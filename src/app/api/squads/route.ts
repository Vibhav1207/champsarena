import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/squads - Fetch user's squad and invitations
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user with squad details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        squad: {
          include: {
            members: {
              select: { id: true, name: true, email: true, username: true, image: true, elo: true },
            },
            captain: {
              select: { id: true, name: true, username: true, email: true },
            },
            coCaptain: {
              select: { id: true, name: true, username: true, email: true },
            },
            invitations: {
              where: { status: "PENDING" },
              select: { id: true, userId: true },
            },
          },
        },
        squadInvitations: {
          where: { status: "PENDING" },
          include: {
            squad: {
              select: { id: true, name: true, logo: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      squad: user.squad,
      invitations: user.squadInvitations,
    });
  } catch (error: any) {
    console.error("Failed to load user squad data:", error);
    return NextResponse.json({ error: "Failed to retrieve squad status" }, { status: 500 });
  }
}

// POST /api/squads - Create a new squad
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user already in a squad
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.squadId) {
      return NextResponse.json({ error: "You are already a member of a squad. Exit your current squad to build a new one." }, { status: 400 });
    }

    const { name, logo, description } = await req.json();

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: "Squad name must be at least 3 characters." }, { status: 400 });
    }

    // Verify name uniqueness
    const existing = await prisma.squad.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "A squad with this name already exists." }, { status: 400 });
    }

    // Create squad and add captain as a member
    const newSquad = await prisma.$transaction(async (tx) => {
      const squad = await tx.squad.create({
        data: {
          name: name.trim(),
          logo: logo || null,
          description: description || "",
          captainId: userId,
        },
      });

      // Update user with squadId
      await tx.user.update({
        where: { id: userId },
        data: { squadId: squad.id },
      });

      // Log action
      await tx.auditLog.create({
        data: {
          action: "CREATE_SQUAD",
          userId: userId,
          details: `User ${user.name} created squad "${squad.name}"`,
          newValue: squad.name,
        },
      });

      return squad;
    });

    return NextResponse.json(newSquad, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create squad:", error);
    return NextResponse.json({ error: error.message || "Failed to create squad" }, { status: 500 });
  }
}
