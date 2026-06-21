import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

// GET /api/users - Leaderboard endpoint
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const region = searchParams.get("region");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "Highest ELO";

    const where: any = {};

    if (region && region !== "All Regions") {
      where.homeRegion = region;
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    let orderBy: any = { elo: "desc" };
    if (sortBy === "Most Wins") orderBy = { wins: "desc" };
    if (sortBy === "Win Rate") {
      // Postgres-specific raw sorting is possible, but we can sort in memory or order by wins since we don't store winRate as a column
      orderBy = { wins: "desc" };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        elo: true,
        wins: true,
        losses: true,
        homeRegion: true,
        favPokemon: true,
        trainerId: true,
      },
      orderBy,
      take: 100, // Top 100 leaderboard
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Leaderboard query failed:", error);
    return NextResponse.json({ error: "Failed to query leaderboard" }, { status: 500 });
  }
}

// PUT /api/users - Update user details (name, homeRegion, favPokemon, image)
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, homeRegion, favPokemon, image } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        homeRegion,
        favPokemon,
        image,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        elo: true,
        wins: true,
        losses: true,
        homeRegion: true,
        favPokemon: true,
        trainerId: true,
      },
    });

    // Log profile update
    await prisma.auditLog.create({
      data: {
        action: "UPDATE_PROFILE",
        userId: session.user.id,
        details: `Updated profile details: ${JSON.stringify({ name, homeRegion, favPokemon })}`,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Profile update failed:", error);
    return NextResponse.json({ error: error.message || "Profile update failed" }, { status: 500 });
  }
}
