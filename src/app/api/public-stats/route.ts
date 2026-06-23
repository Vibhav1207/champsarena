import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const totalUsers = await prisma.user.count();
    const totalTournaments = await prisma.tournament.count();
    const totalMatches = await prisma.match.count();

    return NextResponse.json({
      totalUsers,
      totalTournaments,
      totalMatches,
    });
  } catch (error: any) {
    console.error("Failed to fetch public stats:", error);
    return NextResponse.json({ error: "Failed to fetch public stats" }, { status: 500 });
  }
}
