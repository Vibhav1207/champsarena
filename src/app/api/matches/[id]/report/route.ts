import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { p1Score, p2Score, screenshotUrl } = await req.json();

    if (p1Score === undefined || p2Score === undefined) {
      return NextResponse.json({ error: "Scores are required" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status === "COMPLETED" || match.status === "BYE") {
      return NextResponse.json({ error: "Match is already completed" }, { status: 400 });
    }

    // Get reporter user information to check squadId or playerId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, username: true, squadId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isTeam = match.s1Id !== null;
    let isParticipant = false;

    if (isTeam) {
      isParticipant = user.squadId === match.s1Id || user.squadId === match.s2Id;
    } else {
      isParticipant = match.p1Id === user.id || match.p2Id === user.id;
    }

    if (!isParticipant) {
      return NextResponse.json({ error: "You are not a participant in this match" }, { status: 403 });
    }

    const score1 = parseInt(p1Score);
    const score2 = parseInt(p2Score);

    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
      return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
    }

    // Determine reported winner
    let winnerId = null;
    if (score1 > score2) {
      winnerId = isTeam ? match.s1Id : match.p1Id;
    } else if (score2 > score1) {
      winnerId = isTeam ? match.s2Id : match.p2Id;
    } else {
      return NextResponse.json({ error: "Draws are not supported. A winner must be reported." }, { status: 400 });
    }

    if (!winnerId) {
      return NextResponse.json({ error: "Cannot determine match winner" }, { status: 400 });
    }

    // Record screenshot attachment if provided
    if (screenshotUrl) {
      await prisma.matchAttachment.create({
        data: {
          matchId: id,
          url: screenshotUrl,
          uploadedBy: user.id,
        },
      });
    }

    // Save reported result in match model and update status to REPORTED
    await prisma.match.update({
      where: { id },
      data: {
        status: "REPORTED",
        reportedById: user.id,
        reportedP1Score: !isTeam ? score1 : null,
        reportedP2Score: !isTeam ? score2 : null,
        reportedS1Score: isTeam ? score1 : null,
        reportedS2Score: isTeam ? score2 : null,
        reportedWinnerId: !isTeam ? winnerId : null,
        reportedWinnerSquadId: isTeam ? winnerId : null,
      },
    });

    // Notify the opponent
    const reporterName = user.name || user.username || "Your opponent";
    if (isTeam) {
      const opponentSquadId = user.squadId === match.s1Id ? match.s2Id : match.s1Id;
      if (opponentSquadId) {
        const opponentSquad = await prisma.squad.findUnique({
          where: { id: opponentSquadId },
          include: { members: true },
        });
        if (opponentSquad) {
          const notifications = opponentSquad.members.map((mem: { id: string }) => ({
            userId: mem.id,
            message: `Match result reported: Squad "${opponentSquad.name}" has received a match report of ${score1}-${score2} from "${reporterName}". Accept or reject the result.`,
            type: "MATCH" as const,
          }));
          if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications });
          }
        }
      }
    } else {
      const opponentId = user.id === match.p1Id ? match.p2Id : match.p1Id;
      if (opponentId) {
        await prisma.notification.create({
          data: {
            userId: opponentId,
            message: `${reporterName} reported score ${score1}-${score2} for your match. Please accept or reject the result.`,
            type: "MATCH",
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Match result reported. Awaiting opponent confirmation." });
  } catch (error: any) {
    console.error("Match reporting failed:", error);
    return NextResponse.json({ error: error.message || "Failed to report match result" }, { status: 500 });
  }
}
