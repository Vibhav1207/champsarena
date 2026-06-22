import { prisma } from "@/lib/db";
import { TournamentType, Match, User } from "@prisma/client";

// ELO rating calculator
export function calculateNewElos(
  p1Elo: number,
  p2Elo: number,
  p1Score: number,
  p2Score: number,
  kFactor: number = 32
): { p1NewElo: number; p2NewElo: number } {
  // Expected score calculation
  const expectedP1 = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
  const expectedP2 = 1 / (1 + Math.pow(10, (p1Elo - p2Elo) / 400));

  // Actual score (1 for win, 0 for loss, 0.5 for draw)
  let actualP1 = 0.5;
  let actualP2 = 0.5;
  if (p1Score > p2Score) {
    actualP1 = 1;
    actualP2 = 0;
  } else if (p2Score > p1Score) {
    actualP1 = 0;
    actualP2 = 1;
  }

  const p1NewElo = Math.round(p1Elo + kFactor * (actualP1 - expectedP1));
  const p2NewElo = Math.round(p2Elo + kFactor * (actualP2 - expectedP2));

  return { p1NewElo, p2NewElo };
}

// Generate tournament bracket/matches based on registration
export async function generateMatchesForTournament(tournamentId: string, seedingType: "ELO" | "RANDOM" = "ELO") {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      registrations: {
        where: { status: "APPROVED" },
        include: { user: true },
      },
    },
  });

  if (!tournament) throw new Error("Tournament not found");
  const players = tournament.registrations.map((r) => r.user);

  if (players.length < 2) {
    throw new Error("Cannot generate brackets for less than 2 approved players");
  }

  // Seed players by ELO (highest to lowest) or Random Shuffle
  let seededPlayers = [...players];
  if (seedingType === "RANDOM") {
    // Fisher-Yates shuffle
    for (let i = seededPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seededPlayers[i], seededPlayers[j]] = [seededPlayers[j], seededPlayers[i]];
    }
  } else {
    seededPlayers.sort((a, b) => b.elo - a.elo);
  }

  if (tournament.type === "SINGLE_ELIMINATION") {
    await generateSingleElimination(tournamentId, seededPlayers);
  } else if (tournament.type === "SWISS") {
    await generateSwissRound(tournamentId, 1, seededPlayers);
  } else if (tournament.type === "ROUND_ROBIN") {
    await generateRoundRobin(tournamentId, seededPlayers);
  } else if (tournament.type === "DOUBLE_ELIMINATION") {
    await generateDoubleElimination(tournamentId, seededPlayers);
  }
}

// Single Elimination Bracket Generator
async function generateSingleElimination(tournamentId: string, players: User[]) {
  const numPlayers = players.length;
  // Calculate next power of 2
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
  const numByes = nextPowerOfTwo - numPlayers;

  // We pair top seeds with bottom seeds
  const round1Matches: { p1Id: string | null; p2Id: string | null; status: string }[] = [];

  for (let i = 0; i < nextPowerOfTwo / 2; i++) {
    const p1Idx = i;
    const p2Idx = nextPowerOfTwo - 1 - i;

    const p1 = p1Idx < numPlayers ? players[p1Idx] : null;
    const p2 = p2Idx < numPlayers ? players[p2Idx] : null;

    if (p1 && p2) {
      round1Matches.push({ p1Id: p1.id, p2Id: p2.id, status: "PENDING" });
    } else if (p1) {
      // Bye for player 1, auto advance
      round1Matches.push({ p1Id: p1.id, p2Id: null, status: "BYE" });
    }
  }

  // Save matches to DB for Round 1
  for (const m of round1Matches) {
    await prisma.match.create({
      data: {
        tournamentId,
        round: 1,
        p1Id: m.p1Id,
        p2Id: m.p2Id,
        status: m.status,
        winnerId: m.status === "BYE" ? m.p1Id : null,
        p1Score: m.status === "BYE" ? 2 : 0,
        p2Score: 0,
      },
    });
  }

  // Create empty matches for subsequent rounds
  let currentRoundSize = nextPowerOfTwo / 4;
  let roundNum = 2;
  while (currentRoundSize >= 1) {
    for (let i = 0; i < currentRoundSize; i++) {
      await prisma.match.create({
        data: {
          tournamentId,
          round: roundNum,
          p1Id: null,
          p2Id: null,
          status: "PENDING",
        },
      });
    }
    currentRoundSize /= 2;
    roundNum++;
  }

  // Update tournament status
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "ONGOING" },
  });
}

// Swiss Round Pairings Generator
export async function generateSwissRound(tournamentId: string, round: number, players: User[]) {
  // Get previous matches in this tournament to check history
  const prevMatches = await prisma.match.findMany({
    where: { tournamentId },
  });

  // Calculate current score for each player
  const playerScores = new Map<string, number>();
  for (const p of players) {
    playerScores.set(p.id, 0);
  }

  for (const m of prevMatches) {
    if (m.status === "COMPLETED" || m.status === "BYE") {
      if (m.winnerId) {
        playerScores.set(m.winnerId, (playerScores.get(m.winnerId) || 0) + 3); // 3 points for win
      }
      // If draw, both get 1 point (though we default to best-of-three win/loss here)
    }
  }

  // Sort players by score, then ELO
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = playerScores.get(a.id) || 0;
    const scoreB = playerScores.get(b.id) || 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return b.elo - a.elo;
  });

  // Keep track of who has played whom
  const playedOpponents = new Map<string, Set<string>>();
  for (const p of players) {
    playedOpponents.set(p.id, new Set<string>());
  }
  for (const m of prevMatches) {
    if (m.p1Id && m.p2Id) {
      playedOpponents.get(m.p1Id)?.add(m.p2Id);
      playedOpponents.get(m.p2Id)?.add(m.p1Id);
    }
  }

  // Track who has had a bye
  const hadBye = new Set<string>();
  for (const m of prevMatches) {
    if (m.status === "BYE" && m.p1Id) {
      hadBye.add(m.p1Id);
    }
  }

  const paired = new Set<string>();
  const pairings: { p1Id: string; p2Id: string | null; status: string }[] = [];

  // If odd number of players, assign a bye to the lowest rank who hasn't had one
  if (sortedPlayers.length % 2 !== 0) {
    for (let i = sortedPlayers.length - 1; i >= 0; i--) {
      const p = sortedPlayers[i];
      if (!hadBye.has(p.id)) {
        pairings.push({ p1Id: p.id, p2Id: null, status: "BYE" });
        paired.add(p.id);
        break;
      }
    }
  }

  // Pair remaining players using greedy matching matching scores
  for (let i = 0; i < sortedPlayers.length; i++) {
    const p1 = sortedPlayers[i];
    if (paired.has(p1.id)) continue;

    let p2: User | null = null;
    // Find first available opponent from the sorted list (closest score) that hasn't played p1 yet
    for (let j = i + 1; j < sortedPlayers.length; j++) {
      const candidate = sortedPlayers[j];
      if (paired.has(candidate.id)) continue;
      if (!playedOpponents.get(p1.id)?.has(candidate.id)) {
        p2 = candidate;
        break;
      }
    }

    // Fallback if everyone has played everyone (pair with anyone unpaired)
    if (!p2) {
      for (let j = i + 1; j < sortedPlayers.length; j++) {
        const candidate = sortedPlayers[j];
        if (!paired.has(candidate.id)) {
          p2 = candidate;
          break;
        }
      }
    }

    if (p2) {
      pairings.push({ p1Id: p1.id, p2Id: p2.id, status: "PENDING" });
      paired.add(p1.id);
      paired.add(p2.id);
    } else {
      // Odd one out gets a bye if they didn't already, otherwise force match
      if (!paired.has(p1.id)) {
        pairings.push({ p1Id: p1.id, p2Id: null, status: "BYE" });
        paired.add(p1.id);
      }
    }
  }

  // Create matches in database
  for (const p of pairings) {
    await prisma.match.create({
      data: {
        tournamentId,
        round,
        p1Id: p.p1Id,
        p2Id: p.p2Id,
        status: p.status,
        winnerId: p.status === "BYE" ? p.p1Id : null,
        p1Score: p.status === "BYE" ? 2 : 0,
        p2Score: 0,
      },
    });
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "ONGOING" },
  });
}

// Round Robin Generator (simplified standard round robin schedules)
async function generateRoundRobin(tournamentId: string, players: User[]) {
  const numPlayers = players.length;
  const list = [...players];
  if (numPlayers % 2 !== 0) {
    // Add a dummy player for Byes
    list.push({ id: "BYE_DUMMY", name: "BYE" } as User);
  }

  const rounds = list.length - 1;
  const half = list.length / 2;

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const p1 = list[i];
      const p2 = list[list.length - 1 - i];

      if (p1.id !== "BYE_DUMMY" && p2.id !== "BYE_DUMMY") {
        await prisma.match.create({
          data: {
            tournamentId,
            round: r + 1,
            p1Id: p1.id,
            p2Id: p2.id,
            status: "PENDING",
          },
        });
      } else if (p1.id !== "BYE_DUMMY") {
        await prisma.match.create({
          data: {
            tournamentId,
            round: r + 1,
            p1Id: p1.id,
            p2Id: null,
            status: "BYE",
            winnerId: p1.id,
            p1Score: 2,
          },
        });
      } else if (p2.id !== "BYE_DUMMY") {
        await prisma.match.create({
          data: {
            tournamentId,
            round: r + 1,
            p1Id: p2.id,
            p2Id: null,
            status: "BYE",
            winnerId: p2.id,
            p1Score: 2,
          },
        });
      }
    }
    // Rotate list
    list.splice(1, 0, list.pop()!);
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "ONGOING" },
  });
}

// Double Elimination Bracket Generator
async function generateDoubleElimination(tournamentId: string, players: User[]) {
  // Double elimination is complex, we will generate the initial Winners Round 1 bracket,
  // and then create placeholder matches for subsequent rounds in Winners and Losers brackets.
  const numPlayers = players.length;
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
  
  // Winners Round 1 Matches
  for (let i = 0; i < nextPowerOfTwo / 2; i++) {
    const p1Idx = i;
    const p2Idx = nextPowerOfTwo - 1 - i;
    const p1 = p1Idx < numPlayers ? players[p1Idx] : null;
    const p2 = p2Idx < numPlayers ? players[p2Idx] : null;

    await prisma.match.create({
      data: {
        tournamentId,
        round: 1, // Winners Round 1
        p1Id: p1?.id || null,
        p2Id: p2?.id || null,
        status: p1 && p2 ? "PENDING" : p1 ? "BYE" : "PENDING",
        winnerId: p1 && !p2 ? p1.id : null,
        p1Score: p1 && !p2 ? 2 : 0,
      },
    });
  }

  // Create placeholders for Winners round 2, 3, etc.
  let currentRoundSize = nextPowerOfTwo / 4;
  let roundNum = 2;
  while (currentRoundSize >= 1) {
    for (let i = 0; i < currentRoundSize; i++) {
      await prisma.match.create({
        data: {
          tournamentId,
          round: roundNum,
          p1Id: null,
          p2Id: null,
          status: "PENDING",
        },
      });
    }
    currentRoundSize /= 2;
    roundNum++;
  }

  // Create placeholders for Losers bracket rounds (denoted by negative rounds, e.g., -1, -2)
  // Let's create matches for losers round -1, -2, -3, etc.
  let losersRoundSize = nextPowerOfTwo / 4;
  let losersRoundNum = -1;
  while (losersRoundSize >= 1) {
    // Losers round has two stages: matching losers from Winners, then winners of Losers playing each other
    for (let stage = 0; stage < 2; stage++) {
      for (let i = 0; i < losersRoundSize; i++) {
        await prisma.match.create({
          data: {
            tournamentId,
            round: losersRoundNum,
            p1Id: null,
            p2Id: null,
            status: "PENDING",
          },
        });
      }
      losersRoundNum--;
    }
    losersRoundSize /= 2;
  }

  // Grand Finals Match (Winners Champ vs Losers Champ)
  await prisma.match.create({
    data: {
      tournamentId,
      round: 99, // Denote Grand Finals
      p1Id: null,
      p2Id: null,
      status: "PENDING",
    },
  });

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "ONGOING" },
  });
}

// Handle Match Results & Promotion
export async function submitMatchResult(
  matchId: string,
  p1Score: number,
  p2Score: number,
  winnerId: string
) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: {
        include: {
          registrations: {
            where: { status: "APPROVED" },
            include: { user: true },
          },
        },
      },
      p1: true,
      p2: true,
    },
  });

  if (!match) throw new Error("Match not found");
  if (match.status === "COMPLETED") throw new Error("Match already completed");

  const p1 = match.p1;
  const p2 = match.p2;

  if (!p1 || !p2) throw new Error("Match does not have both players set");

  // Calculate and update ELOs
  const { p1NewElo, p2NewElo } = calculateNewElos(p1.elo, p2.elo, p1Score, p2Score);

  await prisma.user.update({
    where: { id: p1.id },
    data: {
      elo: p1NewElo,
      wins: winnerId === p1.id ? { increment: 1 } : undefined,
      losses: winnerId === p2.id ? { increment: 1 } : undefined,
    },
  });

  await prisma.user.update({
    where: { id: p2.id },
    data: {
      elo: p2NewElo,
      wins: winnerId === p2.id ? { increment: 1 } : undefined,
      losses: winnerId === p1.id ? { increment: 1 } : undefined,
    },
  });

  // Update this match
  await prisma.match.update({
    where: { id: matchId },
    data: {
      p1Score,
      p2Score,
      winnerId,
      status: "COMPLETED",
    },
  });

  // Record Audit Log
  await prisma.auditLog.create({
    data: {
      action: "SUBMIT_MATCH_RESULT",
      details: `Match ${matchId} completed: ${p1.name} (${p1Score}) vs ${p2.name} (${p2Score}). Winner: ${winnerId}. ELO changes: ${p1.name} (${p1.elo} -> ${p1NewElo}), ${p2.name} (${p2.elo} -> ${p2NewElo})`,
    },
  });

  // System Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: p1.id,
        message: `Match completed! You played against ${p2.name}. Result: ${p1Score}-${p2Score}. Your new ELO is ${p1NewElo}.`,
        type: "MATCH",
      },
      {
        userId: p2.id,
        message: `Match completed! You played against ${p1.name}. Result: ${p2Score}-${p1Score}. Your new ELO is ${p2NewElo}.`,
        type: "MATCH",
      },
    ],
  });

  // Advance player in bracket
  const tType = match.tournament.type;
  if (tType === "SINGLE_ELIMINATION") {
    await advanceSingleElimination(match, winnerId);
  } else if (tType === "SWISS") {
    await checkAndAdvanceSwissRound(match.tournamentId);
  } else if (tType === "DOUBLE_ELIMINATION") {
    await advanceDoubleElimination(match, winnerId);
  } else if (tType === "ROUND_ROBIN") {
    await checkAndCompleteRoundRobin(match.tournamentId);
  }
}

// Single Elimination Advancement Logic
async function advanceSingleElimination(completedMatch: any, winnerId: string) {
  const tournamentId = completedMatch.tournamentId;
  const currentRound = completedMatch.round;

  // Find all matches in this round to see if we can pair the next round
  const roundMatches = await prisma.match.findMany({
    where: { tournamentId, round: currentRound },
    orderBy: { id: "asc" },
  });

  const matchIdx = roundMatches.findIndex((m) => m.id === completedMatch.id);
  const nextRoundMatchIdx = Math.floor(matchIdx / 2);
  const isP1InNextRound = matchIdx % 2 === 0;

  // Find the next round match
  const nextRoundMatches = await prisma.match.findMany({
    where: { tournamentId, round: currentRound + 1 },
    orderBy: { id: "asc" },
  });

  if (nextRoundMatches.length > nextRoundMatchIdx) {
    const nextMatch = nextRoundMatches[nextRoundMatchIdx];
    await prisma.match.update({
      where: { id: nextMatch.id },
      data: {
        p1Id: isP1InNextRound ? winnerId : undefined,
        p2Id: !isP1InNextRound ? winnerId : undefined,
      },
    });

    // Check if the next match is now fully populated, then notify the players
    const updatedNextMatch = await prisma.match.findUnique({
      where: { id: nextMatch.id },
    });
    if (updatedNextMatch?.p1Id && updatedNextMatch?.p2Id) {
      await prisma.notification.createMany({
        data: [
          {
            userId: updatedNextMatch.p1Id,
            message: `Your Round ${currentRound + 1} match has been assigned! Ready for battle.`,
            type: "MATCH",
          },
          {
            userId: updatedNextMatch.p2Id,
            message: `Your Round ${currentRound + 1} match has been assigned! Ready for battle.`,
            type: "MATCH",
          },
        ],
      });
    }
  } else {
    // No more matches in the next round, so the tournament is completed!
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "COMPLETED" },
    });

    // Notify all participants
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { registrations: true },
    });
    const winnerUser = await prisma.user.findUnique({ where: { id: winnerId } });

    if (tournament && winnerUser) {
      const notifications = tournament.registrations.map((reg) => ({
        userId: reg.userId,
        message: `Tournament "${tournament.title}" has completed! Congratulations to the Grand Champion: ${winnerUser.name}!`,
        type: "INFO",
      }));
      await prisma.notification.createMany({ data: notifications });
    }
  }
}

// Swiss Round Check and Promotion
async function checkAndAdvanceSwissRound(tournamentId: string) {
  // Find all matches in the current round
  const ongoingMatches = await prisma.match.findMany({
    where: { tournamentId, status: "PENDING" },
  });

  // If all matches in the current round are completed, generate the next round!
  if (ongoingMatches.length === 0) {
    const allMatches = await prisma.match.findMany({
      where: { tournamentId },
    });
    const lastRound = Math.max(...allMatches.map((m) => m.round), 0);

    // Let's say Swiss tournaments run for 3 rounds in this simple implementation
    const maxSwissRounds = 3;

    if (lastRound < maxSwissRounds) {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          registrations: {
            where: { status: "APPROVED" },
            include: { user: true },
          },
        },
      });
      if (tournament) {
        const players = tournament.registrations.map((r) => r.user);
        await generateSwissRound(tournamentId, lastRound + 1, players);
      }
    } else {
      // Completed Swiss rounds, mark tournament as completed
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: "COMPLETED" },
      });
    }
  }
}

// Check if registrations are full and automatically generate brackets
export async function checkAndAutoGenerateBrackets(tournamentId: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          where: { status: "APPROVED" },
        },
        matches: {
          select: { id: true },
        },
      },
    });

    if (!tournament) return;

    const approvedCount = tournament.registrations.length;
    if (
      approvedCount >= tournament.maxPlayers &&
      tournament.status !== "ONGOING" &&
      tournament.status !== "COMPLETED" &&
      tournament.matches.length === 0
    ) {
      console.log(`Tournament ${tournamentId} has reached max capacity (${approvedCount}/${tournament.maxPlayers}). Auto-generating brackets...`);
      await generateMatchesForTournament(tournamentId);
    }
  } catch (error) {
    console.error("Failed to auto-generate brackets:", error);
  }
}

async function advanceDoubleElimination(completedMatch: any, winnerId: string) {
  const tournamentId = completedMatch.tournamentId;
  const currentRound = completedMatch.round;
  const loserId = completedMatch.p1Id === winnerId ? completedMatch.p2Id : completedMatch.p1Id;

  if (currentRound === 99 || currentRound === 100) {
    if (currentRound === 99) {
      if (winnerId === completedMatch.p1Id) {
        await completeTournament(tournamentId, winnerId);
      } else {
        await prisma.match.create({
          data: {
            tournamentId,
            round: 100,
            p1Id: completedMatch.p1Id,
            p2Id: completedMatch.p2Id,
            status: "PENDING",
          },
        });
        await prisma.notification.createMany({
          data: [
            {
              userId: completedMatch.p1Id,
              message: "Grand Finals Bracket Reset! A final match is required to determine the Champion.",
              type: "MATCH",
            },
            {
              userId: completedMatch.p2Id,
              message: "Grand Finals Bracket Reset! You won the first set. Prepare for the final match.",
              type: "MATCH",
            },
          ],
        });
      }
    } else {
      await completeTournament(tournamentId, winnerId);
    }
    return;
  }

  if (currentRound > 0) {
    const roundMatches = await prisma.match.findMany({
      where: { tournamentId, round: currentRound },
      orderBy: { id: "asc" },
    });

    const matchIdx = roundMatches.findIndex((m) => m.id === completedMatch.id);
    const nextRoundMatchIdx = Math.floor(matchIdx / 2);
    const isP1InNextRound = matchIdx % 2 === 0;

    const nextRoundMatches = await prisma.match.findMany({
      where: { tournamentId, round: currentRound + 1 },
      orderBy: { id: "asc" },
    });

    if (nextRoundMatches.length > nextRoundMatchIdx) {
      const nextMatch = nextRoundMatches[nextRoundMatchIdx];
      await prisma.match.update({
        where: { id: nextMatch.id },
        data: {
          p1Id: isP1InNextRound ? winnerId : undefined,
          p2Id: !isP1InNextRound ? winnerId : undefined,
        },
      });
      await checkAndNotifyMatchReady(nextMatch.id);
    } else {
      await prisma.match.updateMany({
        where: { tournamentId, round: 99 },
        data: { p1Id: winnerId },
      });
      await checkAndNotifyMatchReadyForRound(tournamentId, 99);
    }

    if (loserId) {
      if (currentRound === 1) {
        const losersMatches = await prisma.match.findMany({
          where: { tournamentId, round: -1 },
          orderBy: { id: "asc" },
        });

        if (losersMatches.length > nextRoundMatchIdx) {
          const lMatch = losersMatches[nextRoundMatchIdx];
          await prisma.match.update({
            where: { id: lMatch.id },
            data: {
              p1Id: isP1InNextRound ? loserId : undefined,
              p2Id: !isP1InNextRound ? loserId : undefined,
            },
          });
          await checkAndNotifyMatchReady(lMatch.id);
        }
      } else {
        const dropRound = -2 * (currentRound - 1);
        const losersMatches = await prisma.match.findMany({
          where: { tournamentId, round: dropRound },
          orderBy: { id: "asc" },
        });

        if (losersMatches.length > matchIdx) {
          const lMatch = losersMatches[matchIdx];
          await prisma.match.update({
            where: { id: lMatch.id },
            data: {
              p2Id: loserId,
            },
          });
          await checkAndNotifyMatchReady(lMatch.id);
        }
      }
    }
  } else {
    const lr = -currentRound;
    const roundMatches = await prisma.match.findMany({
      where: { tournamentId, round: currentRound },
      orderBy: { id: "asc" },
    });

    const matchIdx = roundMatches.findIndex((m) => m.id === completedMatch.id);

    const nextRoundMatches = await prisma.match.findMany({
      where: { tournamentId, round: currentRound - 1 },
      orderBy: { id: "asc" },
    });

    if (nextRoundMatches.length > 0) {
      if (lr % 2 !== 0) {
        const nextMatch = nextRoundMatches[matchIdx];
        await prisma.match.update({
          where: { id: nextMatch.id },
          data: {
            p1Id: winnerId,
          },
        });
        await checkAndNotifyMatchReady(nextMatch.id);
      } else {
        const nextRoundMatchIdx = Math.floor(matchIdx / 2);
        const isP1InNextRound = matchIdx % 2 === 0;
        const nextMatch = nextRoundMatches[nextRoundMatchIdx];
        await prisma.match.update({
          where: { id: nextMatch.id },
          data: {
            p1Id: isP1InNextRound ? winnerId : undefined,
            p2Id: !isP1InNextRound ? winnerId : undefined,
          },
        });
        await checkAndNotifyMatchReady(nextMatch.id);
      }
    } else {
      await prisma.match.updateMany({
        where: { tournamentId, round: 99 },
        data: { p2Id: winnerId },
      });
      await checkAndNotifyMatchReadyForRound(tournamentId, 99);
    }
  }
}

async function checkAndNotifyMatchReady(matchId: string) {
  const m = await prisma.match.findUnique({
    where: { id: matchId },
  });
  if (m && m.p1Id && m.p2Id) {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "PENDING" },
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: m.p1Id,
          message: `Your next tournament match is ready! Report to the match room.`,
          type: "MATCH",
        },
        {
          userId: m.p2Id,
          message: `Your next tournament match is ready! Report to the match room.`,
          type: "MATCH",
        },
      ],
    });
  }
}

async function checkAndNotifyMatchReadyForRound(tournamentId: string, round: number) {
  const matches = await prisma.match.findMany({
    where: { tournamentId, round },
  });
  for (const m of matches) {
    if (m.p1Id && m.p2Id) {
      await prisma.match.update({
        where: { id: m.id },
        data: { status: "PENDING" },
      });
      await prisma.notification.createMany({
        data: [
          {
            userId: m.p1Id,
            message: `Your round ${round === 99 ? 'Grand Finals' : round} match is ready!`,
            type: "MATCH",
          },
          {
            userId: m.p2Id,
            message: `Your round ${round === 99 ? 'Grand Finals' : round} match is ready!`,
            type: "MATCH",
          },
        ],
      });
    }
  }
}

async function completeTournament(tournamentId: string, winnerId: string) {
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "COMPLETED" },
  });

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { registrations: true },
  });
  const winnerUser = await prisma.user.findUnique({ where: { id: winnerId } });

  if (tournament && winnerUser) {
    const notifications = tournament.registrations.map((reg) => ({
      userId: reg.userId,
      message: `Tournament "${tournament.title}" has completed! Congratulations to the Grand Champion: ${winnerUser.name}!`,
      type: "INFO",
    }));
    await prisma.notification.createMany({ data: notifications });
  }
}

async function checkAndCompleteRoundRobin(tournamentId: string) {
  const pendingMatches = await prisma.match.findMany({
    where: { tournamentId, NOT: { status: { in: ["COMPLETED", "BYE"] } } },
  });

  if (pendingMatches.length === 0) {
    const allMatches = await prisma.match.findMany({
      where: { tournamentId },
    });
    
    const winCounts = new Map<string, number>();
    allMatches.forEach((m) => {
      if (m.winnerId) {
        winCounts.set(m.winnerId, (winCounts.get(m.winnerId) || 0) + 1);
      }
    });

    let winnerId: string | null = null;
    let maxWins = -1;
    winCounts.forEach((wins, id) => {
      if (wins > maxWins) {
        maxWins = wins;
        winnerId = id;
      }
    });

    if (winnerId) {
      await completeTournament(tournamentId, winnerId);
    } else {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: "COMPLETED" },
      });
    }
  }
}

