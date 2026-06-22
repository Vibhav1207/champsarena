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

    // Verify user is a participant of this match
    const userId = session.user.id;
    if (match.p1Id !== userId && match.p2Id !== userId) {
      return NextResponse.json({ error: "You are not a participant in this match" }, { status: 403 });
    }

    const score1 = parseInt(p1Score);
    const score2 = parseInt(p2Score);

    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
      return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
    }

    // Determine winner based on best-of-three or higher score
    let winnerId = null;
    if (score1 > score2) {
      winnerId = match.p1Id;
    } else if (score2 > score1) {
      winnerId = match.p2Id;
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
          uploadedBy: userId,
        },
      });
    }

    // Submit match result and advance brackets
    await submitMatchResult(id, score1, score2, winnerId);

    return NextResponse.json({ success: true, message: "Match result submitted successfully" });
  } catch (error: any) {
    console.error("Match reporting failed:", error);
    return NextResponse.json({ error: error.message || "Failed to report match result" }, { status: 500 });
  }
}
