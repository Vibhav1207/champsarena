import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const squad = await prisma.squad.findUnique({
      where: { id },
      include: {
        members: {
          select: { id: true, name: true, username: true, email: true, image: true, elo: true, wins: true, losses: true },
        },
        captain: {
          select: { id: true, name: true, username: true, email: true },
        },
        coCaptain: {
          select: { id: true, name: true, username: true, email: true },
        },
        registrations: {
          include: {
            tournament: {
              select: { id: true, title: true, startDate: true, game: true, status: true },
            },
          },
        },
      },
    });

    if (!squad) {
      return NextResponse.json({ error: "Squad not found." }, { status: 404 });
    }

    // Retrieve squad matches
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ s1Id: id }, { s2Id: id }],
        status: "COMPLETED",
      },
      include: {
        s1: { select: { name: true } },
        s2: { select: { name: true } },
        winnerSquad: { select: { name: true } },
        tournament: { select: { title: true, startDate: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    // Calculate aggregated stats
    const totalWins = matches.filter(m => m.winnerSquadId === id).length;
    const totalLosses = matches.length - totalWins;
    const winRate = matches.length > 0 ? Math.round((totalWins / matches.length) * 100) : 0;
    const averageElo = squad.members.length > 0
      ? Math.round(squad.members.reduce((acc, m) => acc + m.elo, 0) / squad.members.length)
      : 1000;

    return NextResponse.json({
      squad,
      matches,
      stats: {
        wins: totalWins,
        losses: totalLosses,
        winRate,
        elo: averageElo,
      },
    });
  } catch (error: any) {
    console.error("Failed to load squad details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the squad
    const squad = await prisma.squad.findUnique({
      where: { id },
    });

    if (!squad) {
      return NextResponse.json({ error: "Squad not found." }, { status: 404 });
    }

    // Only the captain can delete/disband the squad
    if (squad.captainId !== session.user.id) {
      return NextResponse.json({ error: "Only the squad captain can disband this squad." }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Remove squadId from all users
      await tx.user.updateMany({
        where: { squadId: id },
        data: { squadId: null },
      });

      // 2. Nullify squad references in matches
      await tx.match.updateMany({
        where: { s1Id: id },
        data: { s1Id: null },
      });
      await tx.match.updateMany({
        where: { s2Id: id },
        data: { s2Id: null },
      });
      await tx.match.updateMany({
        where: { winnerSquadId: id },
        data: { winnerSquadId: null },
      });

      // 3. Nullify squad references in tournaments
      await tx.tournament.updateMany({
        where: { winnerSquadId: id },
        data: { winnerSquadId: null },
      });

      // 4. Delete squad registrations
      await tx.squadRegistration.deleteMany({
        where: { squadId: id },
      });

      // 5. Delete squad invitations
      await tx.squadInvitation.deleteMany({
        where: { squadId: id },
      });

      // 6. Delete the squad itself
      await tx.squad.delete({
        where: { id },
      });

      // 7. Log audit log
      await tx.auditLog.create({
        data: {
          action: "DISBAND_SQUAD",
          userId: session.user.id,
          details: `Squad "${squad.name}" (ID: ${squad.id}) was disbanded by Captain.`,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Squad disbanded successfully." });
  } catch (error: any) {
    console.error("Disband squad failed:", error);
    return NextResponse.json({ error: error.message || "Failed to disband squad" }, { status: 500 });
  }
}
