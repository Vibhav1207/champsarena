import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/profile - Fetch all logged-in user details
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teams: true,
        squad: {
          include: {
            members: { select: { id: true, name: true, username: true } },
          },
        },
        registrations: {
          include: {
            tournament: {
              select: { id: true, title: true, startDate: true },
            },
          },
        },
        wonMatches: true,
        wonTournaments: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user matches
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ p1Id: user.id }, { p2Id: user.id }],
        status: "COMPLETED",
      },
      include: {
        p1: { select: { name: true } },
        p2: { select: { name: true } },
        winner: { select: { name: true } },
        tournament: { select: { title: true, startDate: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      user,
      matches,
    });
  } catch (error: any) {
    console.error("Failed to fetch profile details:", error);
    return NextResponse.json({ error: "Failed to fetch profile details" }, { status: 500 });
  }
}

// POST /api/profile/team - Save/update team squad
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, pokemon } = await req.json();

    if (!name || !pokemon || !Array.isArray(pokemon)) {
      return NextResponse.json({ error: "Invalid team structure" }, { status: 400 });
    }

    // Set other teams to inactive
    await prisma.team.updateMany({
      where: { userId: session.user.id },
      data: { active: false },
    });

    const newTeam = await prisma.team.create({
      data: {
        userId: session.user.id,
        name,
        pokemonJson: JSON.stringify(pokemon),
        active: true,
      },
    });

    return NextResponse.json(newTeam, { status: 201 });
  } catch (error: any) {
    console.error("Failed to save squad:", error);
    return NextResponse.json({ error: error.message || "Failed to save squad" }, { status: 500 });
  }
}

// PUT /api/profile - Update user profile coordinates (username, bio, country, discord)
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, bio, country, discordUsername, socialLinks } = body;

    if (username) {
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (cleanUsername.length < 3) {
        return NextResponse.json({ error: "Username must be at least 3 alphanumeric characters." }, { status: 400 });
      }

      // Check unique username
      const existing = await prisma.user.findUnique({
        where: { username: cleanUsername },
      });

      if (existing && existing.id !== session.user.id) {
        return NextResponse.json({ error: "Username is already taken." }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          username: cleanUsername,
          bio: bio || null,
          country: country || null,
          discordUsername: discordUsername || null,
          socialLinks: typeof socialLinks === "string" ? socialLinks : JSON.stringify(socialLinks),
        },
      });
    } else {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          bio: bio || null,
          country: country || null,
          discordUsername: discordUsername || null,
          socialLinks: typeof socialLinks === "string" ? socialLinks : JSON.stringify(socialLinks),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update profile coordinates:", error);
    return NextResponse.json({ error: error.message || "Profile update failed" }, { status: 500 });
  }
}
