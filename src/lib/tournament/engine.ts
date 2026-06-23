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
      squadRegistrations: {
        where: { status: "APPROVED" },
        include: {
          squad: {
            include: {
              members: true,
            },
          },
        },
      },
    },
  });

  if (!tournament) throw new Error("Tournament not found");

  const isTeam = tournament.game === "FREE_FIRE";

  interface Competitor {
    id: string;
    name: string;
    elo: number;
  }

  let competitors: Competitor[] = [];

  if (isTeam) {
    competitors = tournament.squadRegistrations.map((sr) => {
      const s = sr.squad;
      const averageElo = s.members.length > 0
        ? Math.round(s.members.reduce((acc, m) => acc + m.elo, 0) / s.members.length)
        : 1000;
      return {
        id: s.id,
        name: s.name,
        elo: averageElo,
      };
    });
  } else {
    competitors = tournament.registrations.map((r) => ({
      id: r.user.id,
      name: r.user.name || r.user.username || "Trainer",
      elo: r.user.elo,
    }));
  }

  if (competitors.length < 2) {
    throw new Error(`Cannot generate brackets for less than 2 approved ${isTeam ? "squads" : "players"}`);
  }

  // Seed competitors by ELO or Random
  let seeded = [...competitors];
  if (seedingType === "RANDOM") {
    for (let i = seeded.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seeded[i], seeded[j]] = [seeded[j], seeded[i]];
    }
  } else {
    seeded.sort((a, b) => b.elo - a.elo);
  }

  if (tournament.type === "SINGLE_ELIMINATION") {
    await generateSingleElimination(tournamentId, seeded, isTeam);
  } else if (tournament.type === "SWISS") {
    await generateSwissRound(tournamentId, 1, seeded, isTeam);
  } else if (tournament.type === "ROUND_ROBIN") {
    await generateRoundRobin(tournamentId, seeded, isTeam);
  } else if (tournament.type === "DOUBLE_ELIMINATION") {
    await generateDoubleElimination(tournamentId, seeded, isTeam);
  }
}

// Single Elimination Bracket Generator
async function generateSingleElimination(tournamentId: string, competitors: any[], isTeam: boolean) {
  const numCompetitors = competitors.length;
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numCompetitors)));

  const round1Matches: { c1Id: string | null; c2Id: string | null; status: string }[] = [];

  for (let i = 0; i < nextPowerOfTwo / 2; i++) {
    const c1Idx = i;
    const c2Idx = nextPowerOfTwo - 1 - i;

    const c1 = c1Idx < numCompetitors ? competitors[c1Idx] : null;
    const c2 = c2Idx < numCompetitors ? competitors[c2Idx] : null;

    if (c1 && c2) {
      round1Matches.push({ c1Id: c1.id, c2Id: c2.id, status: "PENDING" });
    } else if (c1) {
      round1Matches.push({ c1Id: c1.id, c2Id: null, status: "BYE" });
    }
  }

  // Save matches to DB for Round 1
  for (const m of round1Matches) {
    await prisma.match.create({
      data: {
        tournamentId,
        round: 1,
        p1Id: !isTeam ? m.c1Id : null,
        p2Id: !isTeam ? m.c2Id : null,
        s1Id: isTeam ? m.c1Id : null,
        s2Id: isTeam ? m.c2Id : null,
        status: m.status,
        winnerId: !isTeam && m.status === "BYE" ? m.c1Id : null,
        winnerSquadId: isTeam && m.status === "BYE" ? m.c1Id : null,
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
          s1Id: null,
          s2Id: null,
          status: "PENDING",
        },
      });
    }
    currentRoundSize /= 2;
    roundNum++;
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "ONGOING" },
  });
}

function getSwissState(prevMatches: Match[], competitors: any[], isTeam: boolean) {
  const wins = new Map<string, number>();
  const losses = new Map<string, number>();
  const playedOpponents = new Map<string, Set<string>>();
  const hadBye = new Set<string>();

  for (const c of competitors) {
    wins.set(c.id, 0);
    losses.set(c.id, 0);
    playedOpponents.set(c.id, new Set<string>());
  }

  for (const m of prevMatches) {
    const c1Id = isTeam ? m.s1Id : m.p1Id;
    const c2Id = isTeam ? m.s2Id : m.p2Id;

    if (c1Id && c2Id) {
      playedOpponents.get(c1Id)?.add(c2Id);
      playedOpponents.get(c2Id)?.add(c1Id);
    }

    if (m.status === "BYE" && c1Id) {
      hadBye.add(c1Id);
      wins.set(c1Id, (wins.get(c1Id) || 0) + 1);
      continue;
    }

    if (m.status !== "COMPLETED") continue;

    const winner = isTeam ? m.winnerSquadId : m.winnerId;
    if (!winner) continue;

    const loser = winner === c1Id ? c2Id : winner === c2Id ? c1Id : null;
    wins.set(winner, (wins.get(winner) || 0) + 1);

    if (loser) {
      losses.set(loser, (losses.get(loser) || 0) + 1);
    }
  }

  return { wins, losses, playedOpponents, hadBye };
}

// Swiss Round Pairings Generator
export async function generateSwissRound(tournamentId: string, round: number, competitors: any[], isTeam: boolean) {
  const prevMatches = await prisma.match.findMany({
    where: { tournamentId },
  });

  const { wins, losses, playedOpponents, hadBye } = getSwissState(prevMatches, competitors, isTeam);

  const sorted = [...competitors].sort((a, b) => {
    const winsA = wins.get(a.id) || 0;
    const winsB = wins.get(b.id) || 0;
    if (winsA !== winsB) return winsB - winsA;

    const lossesA = losses.get(a.id) || 0;
    const lossesB = losses.get(b.id) || 0;
    if (lossesA !== lossesB) return lossesA - lossesB;

    return b.elo - a.elo;
  });

  const pairings: { c1Id: string; c2Id: string | null; status: string }[] = [];
  let swissPool = [...sorted];

  if (swissPool.length % 2 !== 0) {
    let byeIndex = -1;
    for (let i = swissPool.length - 1; i >= 0; i--) {
      if (!hadBye.has(swissPool[i].id)) {
        byeIndex = i;
        break;
      }
    }

    if (byeIndex === -1) {
      byeIndex = swissPool.length - 1;
    }

    const [byeCompetitor] = swissPool.splice(byeIndex, 1);
    if (byeCompetitor) {
      pairings.push({ c1Id: byeCompetitor.id, c2Id: null, status: "BYE" });
    }
  }

  const groupedByWins = new Map<number, any[]>();
  for (const competitor of swissPool) {
    const competitorWins = wins.get(competitor.id) || 0;
    const existingGroup = groupedByWins.get(competitorWins) || [];
    existingGroup.push(competitor);
    groupedByWins.set(competitorWins, existingGroup);
  }

  const winBuckets = [...groupedByWins.keys()].sort((a, b) => b - a);
  let floatedCompetitor: any | null = null;

  for (const winBucket of winBuckets) {
    const currentGroup = [...(groupedByWins.get(winBucket) || [])];

    if (floatedCompetitor) {
      currentGroup.unshift(floatedCompetitor);
      floatedCompetitor = null;
    }

    while (currentGroup.length > 1) {
      const c1 = currentGroup.shift();
      if (!c1) break;

      let opponentIndex = currentGroup.findIndex(
        (candidate) => !playedOpponents.get(c1.id)?.has(candidate.id)
      );

      if (opponentIndex === -1) {
        opponentIndex = 0;
      }

      const [c2] = currentGroup.splice(opponentIndex, 1);
      if (!c2) {
        floatedCompetitor = c1;
        break;
      }

      pairings.push({ c1Id: c1.id, c2Id: c2.id, status: "PENDING" });
    }

    if (currentGroup.length === 1) {
      floatedCompetitor = currentGroup[0];
    }
  }

  if (floatedCompetitor) {
    pairings.push({ c1Id: floatedCompetitor.id, c2Id: null, status: "BYE" });
  }

  for (const p of pairings) {
    await prisma.match.create({
      data: {
        tournamentId,
        round,
        p1Id: !isTeam ? p.c1Id : null,
        p2Id: !isTeam ? p.c2Id : null,
        s1Id: isTeam ? p.c1Id : null,
        s2Id: isTeam ? p.c2Id : null,
        status: p.status,
        winnerId: !isTeam && p.status === "BYE" ? p.c1Id : null,
        winnerSquadId: isTeam && p.status === "BYE" ? p.c1Id : null,
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

// Round Robin Generator
async function generateRoundRobin(tournamentId: string, competitors: any[], isTeam: boolean) {
  const numCompetitors = competitors.length;
  const list = [...competitors];
  if (numCompetitors % 2 !== 0) {
    list.push({ id: "BYE_DUMMY", name: "BYE" });
  }

  const rounds = list.length - 1;
  const half = list.length / 2;

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const c1 = list[i];
      const c2 = list[list.length - 1 - i];

      if (c1.id !== "BYE_DUMMY" && c2.id !== "BYE_DUMMY") {
        await prisma.match.create({
          data: {
            tournamentId,
            round: r + 1,
            p1Id: !isTeam ? c1.id : null,
            p2Id: !isTeam ? c2.id : null,
            s1Id: isTeam ? c1.id : null,
            s2Id: isTeam ? c2.id : null,
            status: "PENDING",
          },
        });
      } else if (c1.id !== "BYE_DUMMY") {
        await prisma.match.create({
          data: {
            tournamentId,
            round: r + 1,
            p1Id: !isTeam ? c1.id : null,
            p2Id: null,
            s1Id: isTeam ? c1.id : null,
            s2Id: null,
            status: "BYE",
            winnerId: !isTeam ? c1.id : null,
            winnerSquadId: isTeam ? c1.id : null,
            p1Score: 2,
          },
        });
      } else if (c2.id !== "BYE_DUMMY") {
        await prisma.match.create({
          data: {
            tournamentId,
            round: r + 1,
            p1Id: !isTeam ? c2.id : null,
            p2Id: null,
            s1Id: isTeam ? c2.id : null,
            s2Id: null,
            status: "BYE",
            winnerId: !isTeam ? c2.id : null,
            winnerSquadId: isTeam ? c2.id : null,
            p1Score: 2,
          },
        });
      }
    }
    list.splice(1, 0, list.pop()!);
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "ONGOING" },
  });
}

// Double Elimination Bracket Generator
async function generateDoubleElimination(tournamentId: string, competitors: any[], isTeam: boolean) {
  const numCompetitors = competitors.length;
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numCompetitors)));

  // Winners Round 1 Matches
  for (let i = 0; i < nextPowerOfTwo / 2; i++) {
    const c1Idx = i;
    const c2Idx = nextPowerOfTwo - 1 - i;
    const c1 = c1Idx < numCompetitors ? competitors[c1Idx] : null;
    const c2 = c2Idx < numCompetitors ? competitors[c2Idx] : null;

    const status = c1 && c2 ? "PENDING" : c1 ? "BYE" : "PENDING";
    const winnerId = c1 && !c2 ? c1.id : null;

    await prisma.match.create({
      data: {
        tournamentId,
        round: 1, // Winners Round 1
        p1Id: !isTeam ? c1?.id : null,
        p2Id: !isTeam ? c2?.id : null,
        s1Id: isTeam ? c1?.id : null,
        s2Id: isTeam ? c2?.id : null,
        status,
        winnerId: !isTeam && winnerId ? winnerId : null,
        winnerSquadId: isTeam && winnerId ? winnerId : null,
        p1Score: c1 && !c2 ? 2 : 0,
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
          s1Id: null,
          s2Id: null,
          status: "PENDING",
        },
      });
    }
    currentRoundSize /= 2;
    roundNum++;
  }

  // Create placeholders for Losers bracket rounds
  let losersRoundSize = nextPowerOfTwo / 4;
  let losersRoundNum = -1;
  while (losersRoundSize >= 1) {
    for (let stage = 0; stage < 2; stage++) {
      for (let i = 0; i < losersRoundSize; i++) {
        await prisma.match.create({
          data: {
            tournamentId,
            round: losersRoundNum,
            p1Id: null,
            p2Id: null,
            s1Id: null,
            s2Id: null,
            status: "PENDING",
          },
        });
      }
      losersRoundNum--;
    }
    losersRoundSize /= 2;
  }

  // Grand Finals Match
  await prisma.match.create({
    data: {
      tournamentId,
      round: 99,
      p1Id: null,
      p2Id: null,
      s1Id: null,
      s2Id: null,
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
      s1: true,
      s2: true,
    },
  });

  if (!match) throw new Error("Match not found");
  if (match.status === "COMPLETED") throw new Error("Match already completed");

  const isTeam = match.s1Id !== null;

  if (isTeam) {
    const s1 = match.s1;
    const s2 = match.s2;
    if (!s1 || !s2) throw new Error("Match does not have both squads set");

    // Fetch members to compute average ELO
    const s1Members = await prisma.user.findMany({ where: { squadId: s1.id } });
    const s2Members = await prisma.user.findMany({ where: { squadId: s2.id } });

    const s1Elo = s1Members.length > 0
      ? Math.round(s1Members.reduce((acc, m) => acc + m.elo, 0) / s1Members.length)
      : 1000;
    const s2Elo = s2Members.length > 0
      ? Math.round(s2Members.reduce((acc, m) => acc + m.elo, 0) / s2Members.length)
      : 1000;

    const { p1NewElo: s1NewElo, p2NewElo: s2NewElo } = calculateNewElos(s1Elo, s2Elo, p1Score, p2Score);

    const s1Delta = s1NewElo - s1Elo;
    const s2Delta = s2NewElo - s2Elo;

    // Apply ELO changes and increment wins/losses for squad members
    for (const m of s1Members) {
      await prisma.user.update({
        where: { id: m.id },
        data: {
          elo: Math.max(100, m.elo + s1Delta),
          wins: winnerId === s1.id ? { increment: 1 } : undefined,
          losses: winnerId === s2.id ? { increment: 1 } : undefined,
        },
      });
    }

    for (const m of s2Members) {
      await prisma.user.update({
        where: { id: m.id },
        data: {
          elo: Math.max(100, m.elo + s2Delta),
          wins: winnerId === s2.id ? { increment: 1 } : undefined,
          losses: winnerId === s1.id ? { increment: 1 } : undefined,
        },
      });
    }

    // Update this match
    await prisma.match.update({
      where: { id: matchId },
      data: {
        p1Score,
        p2Score,
        winnerSquadId: winnerId,
        status: "COMPLETED",
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        action: "SUBMIT_MATCH_RESULT",
        details: `Squad Match ${matchId} completed: ${s1.name} (${p1Score}) vs ${s2.name} (${p2Score}). Winner: ${winnerId}. ELO changes: ${s1.name} (Avg ELO ${s1Elo} -> ${s1NewElo}), ${s2.name} (Avg ELO ${s2Elo} -> ${s2NewElo})`,
      },
    });

    // System Notifications for members
    const notifications = [
      ...s1Members.map((m) => ({
        userId: m.id,
        message: `Match completed! Your squad "${s1.name}" played against "${s2.name}". Result: ${p1Score}-${p2Score}. Your new ELO is ${Math.max(100, m.elo + s1Delta)}.`,
        type: "MATCH" as const,
      })),
      ...s2Members.map((m) => ({
        userId: m.id,
        message: `Match completed! Your squad "${s2.name}" played against "${s1.name}". Result: ${p2Score}-${p1Score}. Your new ELO is ${Math.max(100, m.elo + s2Delta)}.`,
        type: "MATCH" as const,
      })),
    ];
    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }
  } else {
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
  }

  // Advance competitor in bracket
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
  const isTeam = completedMatch.s1Id !== null;

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
        p1Id: !isTeam && isP1InNextRound ? winnerId : undefined,
        p2Id: !isTeam && !isP1InNextRound ? winnerId : undefined,
        s1Id: isTeam && isP1InNextRound ? winnerId : undefined,
        s2Id: isTeam && !isP1InNextRound ? winnerId : undefined,
      },
    });

    await checkAndNotifyMatchReady(nextMatch.id);
  } else {
    // No more matches in the next round, so the tournament is completed!
    await completeTournament(tournamentId, winnerId);
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

    const maxSwissRounds = 3;

    if (lastRound < maxSwissRounds) {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          registrations: {
            where: { status: "APPROVED" },
            include: { user: true },
          },
          squadRegistrations: {
            where: { status: "APPROVED" },
            include: {
              squad: {
                include: {
                  members: true,
                },
              },
            },
          },
        },
      });

      if (tournament) {
        const isTeam = tournament.game === "FREE_FIRE";
        let competitors = [];

        if (isTeam) {
          competitors = tournament.squadRegistrations.map((sr) => {
            const s = sr.squad;
            const averageElo = s.members.length > 0
              ? Math.round(s.members.reduce((acc, m) => acc + m.elo, 0) / s.members.length)
              : 1000;
            return {
              id: s.id,
              name: s.name,
              elo: averageElo,
            };
          });
        } else {
          competitors = tournament.registrations.map((r) => ({
            id: r.user.id,
            name: r.user.name || r.user.username || "Trainer",
            elo: r.user.elo,
          }));
        }

        await generateSwissRound(tournamentId, lastRound + 1, competitors, isTeam);
      }
    } else {
      // Completed Swiss rounds, mark tournament as completed
      const winCounts = new Map<string, number>();
      allMatches.forEach((m) => {
        const winner = m.s1Id ? m.winnerSquadId : m.winnerId;
        if (winner) {
          winCounts.set(winner, (winCounts.get(winner) || 0) + 1);
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
        squadRegistrations: {
          where: { status: "APPROVED" },
        },
        matches: {
          select: { id: true },
        },
      },
    });

    if (!tournament) return;

    const isTeam = tournament.game === "FREE_FIRE";
    const approvedCount = isTeam ? tournament.squadRegistrations.length : tournament.registrations.length;

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

// Double Elimination round progression helper
async function advanceDoubleElimination(completedMatch: any, winnerId: string) {
  const tournamentId = completedMatch.tournamentId;
  const currentRound = completedMatch.round;
  const isTeam = completedMatch.s1Id !== null;

  const loserId = isTeam
    ? (completedMatch.s1Id === winnerId ? completedMatch.s2Id : completedMatch.s1Id)
    : (completedMatch.p1Id === winnerId ? completedMatch.p2Id : completedMatch.p1Id);

  const c1Id = isTeam ? completedMatch.s1Id : completedMatch.p1Id;
  const c2Id = isTeam ? completedMatch.s2Id : completedMatch.p2Id;

  if (currentRound === 99 || currentRound === 100) {
    if (currentRound === 99) {
      if (winnerId === c1Id) {
        await completeTournament(tournamentId, winnerId);
      } else {
        await prisma.match.create({
          data: {
            tournamentId,
            round: 100,
            p1Id: !isTeam ? c1Id : null,
            p2Id: !isTeam ? c2Id : null,
            s1Id: isTeam ? c1Id : null,
            s2Id: isTeam ? c2Id : null,
            status: "PENDING",
          },
        });

        if (isTeam) {
          const s1Members = await prisma.user.findMany({ where: { squadId: c1Id } });
          const s2Members = await prisma.user.findMany({ where: { squadId: c2Id } });
          const notify = [
            ...s1Members.map(u => ({ userId: u.id, message: "Grand Finals Reset! Prepare for the final squad showdown.", type: "MATCH" as const })),
            ...s2Members.map(u => ({ userId: u.id, message: "Grand Finals Reset! You forced a bracket reset. Win this last match to take the trophy!", type: "MATCH" as const })),
          ];
          await prisma.notification.createMany({ data: notify });
        } else {
          await prisma.notification.createMany({
            data: [
              { userId: c1Id!, message: "Grand Finals Bracket Reset! A final match is required to determine the Champion.", type: "MATCH" },
              { userId: c2Id!, message: "Grand Finals Bracket Reset! You won the first set. Prepare for the final match.", type: "MATCH" },
            ],
          });
        }
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
          p1Id: !isTeam && isP1InNextRound ? winnerId : undefined,
          p2Id: !isTeam && !isP1InNextRound ? winnerId : undefined,
          s1Id: isTeam && isP1InNextRound ? winnerId : undefined,
          s2Id: isTeam && !isP1InNextRound ? winnerId : undefined,
        },
      });
      await checkAndNotifyMatchReady(nextMatch.id);
    } else {
      await prisma.match.updateMany({
        where: { tournamentId, round: 99 },
        data: {
          p1Id: !isTeam ? winnerId : null,
          s1Id: isTeam ? winnerId : null,
        },
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
              p1Id: !isTeam && isP1InNextRound ? loserId : undefined,
              p2Id: !isTeam && !isP1InNextRound ? loserId : undefined,
              s1Id: isTeam && isP1InNextRound ? loserId : undefined,
              s2Id: isTeam && !isP1InNextRound ? loserId : undefined,
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
              p2Id: !isTeam ? loserId : null,
              s2Id: isTeam ? loserId : null,
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
            p1Id: !isTeam ? winnerId : null,
            s1Id: isTeam ? winnerId : null,
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
            p1Id: !isTeam && isP1InNextRound ? winnerId : undefined,
            p2Id: !isTeam && !isP1InNextRound ? winnerId : undefined,
            s1Id: isTeam && isP1InNextRound ? winnerId : undefined,
            s2Id: isTeam && !isP1InNextRound ? winnerId : undefined,
          },
        });
        await checkAndNotifyMatchReady(nextMatch.id);
      }
    } else {
      await prisma.match.updateMany({
        where: { tournamentId, round: 99 },
        data: {
          p2Id: !isTeam ? winnerId : null,
          s2Id: isTeam ? winnerId : null,
        },
      });
      await checkAndNotifyMatchReadyForRound(tournamentId, 99);
    }
  }
}

async function checkAndNotifyMatchReady(matchId: string) {
  const m = await prisma.match.findUnique({
    where: { id: matchId },
  });
  if (!m) return;

  const isTeam = m.s1Id !== null;

  if ((!isTeam && m.p1Id && m.p2Id) || (isTeam && m.s1Id && m.s2Id)) {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "PENDING" },
    });

    if (isTeam) {
      const squads = await prisma.squad.findMany({
        where: { id: { in: [m.s1Id!, m.s2Id!] } },
        include: { members: true },
      });
      const notifications = squads.flatMap((s) =>
        s.members.map((mem) => ({
          userId: mem.id,
          message: `Your squad "${s.name}" has a new match ready! Report to the match room.`,
          type: "MATCH" as const,
        }))
      );
      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    } else {
      await prisma.notification.createMany({
        data: [
          {
            userId: m.p1Id!,
            message: `Your next tournament match is ready! Report to the match room.`,
            type: "MATCH",
          },
          {
            userId: m.p2Id!,
            message: `Your next tournament match is ready! Report to the match room.`,
            type: "MATCH",
          },
        ],
      });
    }
  }
}

async function checkAndNotifyMatchReadyForRound(tournamentId: string, round: number) {
  const matches = await prisma.match.findMany({
    where: { tournamentId, round },
  });
  for (const m of matches) {
    const isTeam = m.s1Id !== null;
    if ((!isTeam && m.p1Id && m.p2Id) || (isTeam && m.s1Id && m.s2Id)) {
      await prisma.match.update({
        where: { id: m.id },
        data: { status: "PENDING" },
      });

      if (isTeam) {
        const squads = await prisma.squad.findMany({
          where: { id: { in: [m.s1Id!, m.s2Id!] } },
          include: { members: true },
        });
        const notifications = squads.flatMap((s) =>
          s.members.map((mem) => ({
            userId: mem.id,
            message: `Your squad "${s.name}" Round ${round === 99 ? "Grand Finals" : round} match is ready!`,
            type: "MATCH" as const,
          }))
        );
        if (notifications.length > 0) {
          await prisma.notification.createMany({ data: notifications });
        }
      } else {
        await prisma.notification.createMany({
          data: [
            {
              userId: m.p1Id!,
              message: `Your round ${round === 99 ? "Grand Finals" : round} match is ready!`,
              type: "MATCH",
            },
            {
              userId: m.p2Id!,
              message: `Your round ${round === 99 ? "Grand Finals" : round} match is ready!`,
              type: "MATCH",
            },
          ],
        });
      }
    }
  }
}

async function completeTournament(tournamentId: string, winnerId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { registrations: true, squadRegistrations: true },
  });

  if (!tournament) return;

  const isTeam = tournament.game === "FREE_FIRE";

  if (isTeam) {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "COMPLETED", winnerSquadId: winnerId },
    });

    const winningSquad = await prisma.squad.findUnique({
      where: { id: winnerId },
    });

    if (winningSquad) {
      const registeredSquadIds = tournament.squadRegistrations.map((sr) => sr.squadId);
      const members = await prisma.user.findMany({
        where: { squadId: { in: registeredSquadIds } },
      });

      const notifications = members.map((u) => ({
        userId: u.id,
        message: `Tournament "${tournament.title}" has completed! Congratulations to the Squad Champions: ${winningSquad.name}!`,
        type: "INFO" as const,
      }));
      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    }
  } else {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "COMPLETED", winnerId },
    });

    const winnerUser = await prisma.user.findUnique({ where: { id: winnerId } });

    if (winnerUser) {
      const notifications = tournament.registrations.map((reg) => ({
        userId: reg.userId,
        message: `Tournament "${tournament.title}" has completed! Congratulations to the Grand Champion: ${winnerUser.name}!`,
        type: "INFO",
      }));
      await prisma.notification.createMany({ data: notifications });
    }
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
      const winner = m.s1Id ? m.winnerSquadId : m.winnerId;
      if (winner) {
        winCounts.set(winner, (winCounts.get(winner) || 0) + 1);
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
