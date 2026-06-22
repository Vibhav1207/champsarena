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
    const { reason } = await req.json();

    if (!reason || reason.trim() === "") {
      return NextResponse.json({ error: "Dispute reason is required" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify user is a participant
    const userId = session.user.id;
    if (match.p1Id !== userId && match.p2Id !== userId) {
      return NextResponse.json({ error: "You are not a participant in this match" }, { status: 403 });
    }

    // Check if a dispute already exists
    const existingDispute = await prisma.matchDispute.findUnique({
      where: { matchId: id },
    });

    if (existingDispute) {
      return NextResponse.json({ error: "A dispute is already active for this match" }, { status: 400 });
    }

    // Create the dispute
    await prisma.$transaction(async (tx) => {
      await tx.matchDispute.create({
        data: {
          matchId: id,
          raisedById: userId,
          reason: reason.trim(),
          status: "OPEN",
        },
      });

      // Update match status to denote an ongoing dispute
      await tx.match.update({
        where: { id },
        data: { status: "ONGOING" }, // Can keep it ongoing so admins can review
      });

      // Log system audit log
      await tx.auditLog.create({
        data: {
          action: "MATCH_DISPUTE_RAISED",
          userId,
          details: `Dispute raised on match ${id} by user ${userId}. Reason: ${reason}`,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Dispute raised. An administrator will review your match shortly." });
  } catch (error: any) {
    console.error("Failed to raise dispute:", error);
    return NextResponse.json({ error: error.message || "Failed to raise dispute" }, { status: 500 });
  }
}
