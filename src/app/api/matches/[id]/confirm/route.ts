import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { submitMatchResult } from "@/lib/tournament/engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action, reason } = await req.json();

    if (!action || !["ACCEPT", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be ACCEPT or REJECT" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status !== "REPORTED") {
      return NextResponse.json({ error: "Match is not in a REPORTED state" }, { status: 400 });
    }

    if (!match.reportedById) {
      return NextResponse.json({ error: "No report found for this match" }, { status: 400 });
    }

    // Get current user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, squadId: true, name: true, username: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isTeam = match.s1Id !== null;
    let isOpponent = false;

    // Fetch the reporter's squad to determine team opposition
    const reporter = await prisma.user.findUnique({
      where: { id: match.reportedById },
      select: { id: true, squadId: true },
    });

    if (isTeam) {
      // The opponent is the squad that did NOT report
      const opponentSquadId = reporter?.squadId === match.s1Id ? match.s2Id : match.s1Id;
      isOpponent = user.squadId === opponentSquadId && opponentSquadId !== null;
    } else {
      // The opponent is the individual player who did NOT report
      const opponentPlayerId = reporter?.id === match.p1Id ? match.p2Id : match.p1Id;
      isOpponent = user.id === opponentPlayerId;
    }

    if (!isOpponent) {
      return NextResponse.json({ error: "You are not authorized to confirm or dispute this match result" }, { status: 403 });
    }

    if (action === "ACCEPT") {
      // Fetch the scores that were reported
      const score1 = isTeam ? match.reportedS1Score : match.reportedP1Score;
      const score2 = isTeam ? match.reportedS2Score : match.reportedP2Score;
      const winnerId = isTeam ? match.reportedWinnerSquadId : match.reportedWinnerId;

      if (score1 === null || score2 === null || !winnerId) {
        return NextResponse.json({ error: "Reported score coordinates are corrupt" }, { status: 400 });
      }

      // Confirm match result - submitMatchResult handles advancement, ELO and Audit Log
      await submitMatchResult(id, score1, score2, winnerId);

      return NextResponse.json({ success: true, message: "Match result confirmed and brackets updated" });
    } else {
      // REJECT -> Initiate Dispute
      await prisma.$transaction(async (tx) => {
        // Set match status to DISPUTED
        await tx.match.update({
          where: { id },
          data: { status: "DISPUTED" },
        });

        // Create MatchDispute
        await tx.matchDispute.create({
          data: {
            matchId: id,
            raisedById: user.id,
            reason: reason || "Opponent rejected match report scores.",
            status: "OPEN",
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            action: "MATCH_DISPUTE_RAISED",
            userId: user.id,
            details: `Match ${id} results disputed by user ${user.id}. Reason: ${reason}`,
          },
        });

        // Notify the reporter
        await tx.notification.create({
          data: {
            userId: match.reportedById!,
            message: `Your match result report for match #${id} was rejected/disputed by the opponent. An administrator will review.`,
            type: "MATCH",
          },
        });
      });

      return NextResponse.json({ success: true, message: "Dispute successfully raised. An administrator will review your logs." });
    }
  } catch (error: any) {
    console.error("Match confirmation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to process confirmation action" }, { status: 500 });
  }
}
