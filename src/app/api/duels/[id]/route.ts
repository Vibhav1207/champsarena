import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/duels/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const duel = await prisma.duel.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, username: true, image: true, elo: true },
        },
        opponent: {
          select: { id: true, name: true, username: true, image: true, elo: true },
        },
        winner: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    return NextResponse.json({ duel });
  } catch (err: any) {
    console.error("GET /api/duels/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch duel" }, { status: 500 });
  }
}

// PUT /api/duels/[id] — Accept, decline, submit result, cancel
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, creatorScore, opponentScore, winnerId, proofUrl } = body;

    const duel = await prisma.duel.findUnique({ where: { id } });
    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    const userId = session.user.id;

    // --- Accept open challenge (user is joining as opponent) ---
    if (action === "ACCEPT") {
      if (duel.opponentId && duel.opponentId !== userId) {
        return NextResponse.json({ error: "This duel is reserved for another player" }, { status: 403 });
      }
      if (duel.creatorId === userId) {
        return NextResponse.json({ error: "You cannot accept your own challenge" }, { status: 400 });
      }
      if (duel.status !== "PENDING") {
        return NextResponse.json({ error: "Duel is no longer open" }, { status: 400 });
      }

      const updated = await prisma.duel.update({
        where: { id },
        data: { opponentId: userId, status: "ONGOING" },
        include: {
          creator: { select: { id: true, name: true, username: true, image: true, elo: true } },
          opponent: { select: { id: true, name: true, username: true, image: true, elo: true } },
        },
      });
      return NextResponse.json({ duel: updated });
    }

    // --- Decline challenge ---
    if (action === "DECLINE") {
      if (duel.opponentId !== userId && duel.creatorId !== userId) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      const updated = await prisma.duel.update({
        where: { id },
        data: { status: "DECLINED" },
      });
      return NextResponse.json({ duel: updated });
    }

    // --- Cancel challenge (creator only) ---
    if (action === "CANCEL") {
      if (duel.creatorId !== userId) {
        return NextResponse.json({ error: "Only the creator can cancel" }, { status: 403 });
      }

      const updated = await prisma.duel.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({ duel: updated });
    }

    // --- Report result ---
    if (action === "REPORT") {
      if (duel.status !== "ONGOING") {
        return NextResponse.json({ error: "Duel must be ongoing to report a result" }, { status: 400 });
      }
      if (duel.creatorId !== userId && duel.opponentId !== userId) {
        return NextResponse.json({ error: "Only participants can report results" }, { status: 403 });
      }
      if (typeof creatorScore !== "number" || typeof opponentScore !== "number" || !winnerId) {
        return NextResponse.json({ error: "Scores and winner ID are required" }, { status: 400 });
      }
      if (winnerId !== duel.creatorId && winnerId !== duel.opponentId) {
        return NextResponse.json({ error: "Winner must be one of the duel participants" }, { status: 400 });
      }

      const updated = await prisma.duel.update({
        where: { id },
        data: {
          status: "COMPLETED",
          creatorScore,
          opponentScore,
          winnerId,
          reportedById: userId,
          reportedWinnerId: winnerId,
          reportedCreatorScore: creatorScore,
          reportedOpponentScore: opponentScore,
          proofUrl: proofUrl || null,
        },
      });

      // Update ELO and win/loss stats
      const K = 32;
      const [creator, opponent] = await Promise.all([
        prisma.user.findUnique({ where: { id: duel.creatorId }, select: { elo: true } }),
        duel.opponentId ? prisma.user.findUnique({ where: { id: duel.opponentId! }, select: { elo: true } }) : null,
      ]);

      if (creator && opponent && duel.opponentId) {
        const expectedCreator = 1 / (1 + Math.pow(10, (opponent.elo - creator.elo) / 400));
        const creatorActualScore = winnerId === duel.creatorId ? 1 : 0;
        const creatorNewElo = Math.max(100, Math.round(creator.elo + K * (creatorActualScore - expectedCreator)));
        const opponentNewElo = Math.max(100, Math.round(opponent.elo + K * ((1 - creatorActualScore) - (1 - expectedCreator))));

        await Promise.all([
          prisma.user.update({
            where: { id: duel.creatorId },
            data: {
              elo: creatorNewElo,
              wins: { increment: creatorActualScore === 1 ? 1 : 0 },
              losses: { increment: creatorActualScore === 0 ? 1 : 0 },
            },
          }),
          prisma.user.update({
            where: { id: duel.opponentId },
            data: {
              elo: opponentNewElo,
              wins: { increment: creatorActualScore === 0 ? 1 : 0 },
              losses: { increment: creatorActualScore === 1 ? 1 : 0 },
            },
          }),
        ]);
      }

      return NextResponse.json({ duel: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("PUT /api/duels/[id] error:", err);
    return NextResponse.json({ error: "Failed to update duel" }, { status: 500 });
  }
}

// DELETE /api/duels/[id] — Creator deletes their own pending duel
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const duel = await prisma.duel.findUnique({ where: { id } });
    if (!duel) return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    if (duel.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Only the creator can delete this duel" }, { status: 403 });
    }
    if (!["PENDING", "DECLINED", "CANCELLED"].includes(duel.status)) {
      return NextResponse.json({ error: "Cannot delete an active or completed duel" }, { status: 400 });
    }

    await prisma.duel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/duels/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete duel" }, { status: 500 });
  }
}
