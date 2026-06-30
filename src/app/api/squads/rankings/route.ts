import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const squads = await prisma.squad.findMany({
      include: {
        members: {
          select: { id: true, elo: true, wins: true, losses: true },
        },
      },
    });

    const matches = await prisma.match.findMany({
      where: { status: "COMPLETED" },
      select: { s1Id: true, s2Id: true, winnerSquadId: true },
    });

    const rankedSquads = squads.map((s: { id: string; name: string; logo: string | null; members: Array<{ elo: number }> }) => {
      const squadMatches = matches.filter((m: { s1Id: string | null; s2Id: string | null; winnerSquadId: string | null }) => m.s1Id === s.id || m.s2Id === s.id);
      const wins = squadMatches.filter((m: { winnerSquadId: string | null }) => m.winnerSquadId === s.id).length;
      const losses = squadMatches.length - wins;
      
      const averageElo = s.members.length > 0
        ? Math.round(s.members.reduce((acc: number, m: { elo: number }) => acc + m.elo, 0) / s.members.length)
        : 1000;
        
      const points = wins * 3;

      return {
        id: s.id,
        name: s.name,
        logo: s.logo,
        membersCount: s.members.length,
        wins,
        losses,
        elo: averageElo,
        points,
      };
    });

    // Sort by points (highest first), then ELO
    rankedSquads.sort((a: { points: number; elo: number }, b: { points: number; elo: number }) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.elo - a.elo;
    });

    return NextResponse.json(rankedSquads);
  } catch (error: any) {
    console.error("Failed to load squad rankings:", error);
    return NextResponse.json({ error: "Failed to load rankings" }, { status: 500 });
  }
}
