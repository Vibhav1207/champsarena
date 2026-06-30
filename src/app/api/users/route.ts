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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 200);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (region) {
      where.country = region;
    }

    let orderBy: any = { elo: "desc" };
    if (sortBy === "Most Wins") orderBy = { wins: "desc" };
    if (sortBy === "Win Rate") {
      orderBy = { wins: "desc" };
    }

    // Parallel queries for data and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
          elo: true,
          wins: true,
          losses: true,
          trainerId: true,
          country: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json(
      { users, total, page, totalPages: Math.ceil(total / limit) },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error: any) {
    console.error("Leaderboard query failed:", error);
    return NextResponse.json({ error: "Failed to query leaderboard" }, { status: 500 });
  }
}

// PUT /api/users - Update user details
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, image, country, bio, discordUsername, socialLinks } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        image,
        country,
        bio,
        discordUsername,
        socialLinks,
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
        trainerId: true,
        country: true,
        bio: true,
        discordUsername: true,
        socialLinks: true,
      },
    });

    // Log profile update
    await prisma.auditLog.create({
      data: {
        action: "UPDATE_PROFILE",
        userId: session.user.id,
        details: `Updated profile details: ${JSON.stringify({ name, country, bio, discordUsername })}`,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Profile update failed:", error);
    return NextResponse.json({ error: error.message || "Profile update failed" }, { status: 500 });
  }
}