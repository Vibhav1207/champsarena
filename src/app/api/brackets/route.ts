import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournamentId");

    if (!tournamentId) {
      return NextResponse.json({ error: "tournamentId is required" }, { status: 400 });
    }

    const matches = await prisma.match.findMany({
      where: { tournamentId },
      include: {
        p1: { select: { id: true, name: true, image: true, elo: true } },
        p2: { select: { id: true, name: true, image: true, elo: true } },
        winner: { select: { id: true, name: true, image: true } },
        s1: { select: { id: true, name: true, logo: true } },
        s2: { select: { id: true, name: true, logo: true } },
        winnerSquad: { select: { id: true, name: true, logo: true } },
      },
      orderBy: [{ round: "asc" }, { id: "asc" }],
    });

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    return NextResponse.json({
      tournament,
      matches,
    });
  } catch (error: any) {
    console.error("Failed to fetch bracket:", error);
    return NextResponse.json({ error: "Failed to fetch bracket" }, { status: 500 });
  }
}
