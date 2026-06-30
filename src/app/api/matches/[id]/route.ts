import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { submitMatchResult } from "@/lib/tournament/engine";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { p1Score, p2Score, winnerId, disputeAction, resolutionComment } = await req.json();

    // Check if there is an active dispute for this match
    const dispute = await prisma.matchDispute.findUnique({
      where: { matchId: id },
    });

    if (disputeAction === "DISMISS") {
      if (!dispute) {
        return NextResponse.json({ error: "No active dispute found for this match" }, { status: 400 });
      }

      await prisma.$transaction(async (tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
        await tx.matchDispute.update({
          where: { matchId: id },
          data: {
            status: "DISMISSED",
            resolvedById: session.user.id,
            resolution: resolutionComment || "Dispute dismissed by administrator.",
          },
        });

        // Set match back to PENDING status
        await tx.match.update({
          where: { id },
          data: { status: "PENDING" },
        });

        await tx.auditLog.create({
          data: {
            action: "MATCH_DISPUTE_DISMISSED",
            userId: session.user.id,
            details: `Dispute dismissed for match ${id} by admin ${session.user.id}. Comment: ${resolutionComment}`,
          },
        });
      });

      return NextResponse.json({ success: true, message: "Dispute dismissed successfully" });
    }

    // Resolve or regular score override
    if (p1Score === undefined || p2Score === undefined || !winnerId) {
      return NextResponse.json({ error: "Scores and winner ID are required to resolve/override match results" }, { status: 400 });
    }

    const score1 = parseInt(p1Score);
    const score2 = parseInt(p2Score);

    if (isNaN(score1) || isNaN(score2)) {
      return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
    }

    await prisma.$transaction(async (tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      if (dispute) {
        await tx.matchDispute.update({
          where: { matchId: id },
          data: {
            status: "RESOLVED",
            resolvedById: session.user.id,
            resolution: resolutionComment || `Resolved by admin. Final Score: ${score1}-${score2}. Winner: ${winnerId}`,
          },
        });

        await tx.auditLog.create({
          data: {
            action: "MATCH_DISPUTE_RESOLVED",
            userId: session.user.id,
            details: `Dispute resolved for match ${id} by admin ${session.user.id}. Final Score: ${score1}-${score2}. Comment: ${resolutionComment}`,
          },
        });
      } else {
        await tx.auditLog.create({
          data: {
            action: "MATCH_SCORE_OVERRIDE",
            userId: session.user.id,
            details: `Match score override for match ${id} by admin ${session.user.id}. Final Score: ${score1}-${score2}`,
          },
        });
      }
    });

    // submitMatchResult handles advancement logic
    await submitMatchResult(id, score1, score2, winnerId);

    return NextResponse.json({ success: true, message: "Match result submitted and dispute/bracket updated" });
  } catch (error: any) {
    console.error("Match result submission failed:", error);
    return NextResponse.json({ error: error.message || "Failed to submit result" }, { status: 500 });
  }
}
