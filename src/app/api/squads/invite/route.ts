import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/squads/invite - Send an invitation to a player
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchQuery } = await req.json();

    if (!searchQuery || searchQuery.trim() === "") {
      return NextResponse.json({ error: "Search query is required." }, { status: 400 });
    }

    // Get current user's squad
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        squad: true,
      },
    });

    if (!currentUser || !currentUser.squadId) {
      return NextResponse.json({ error: "You must be in a squad to invite members." }, { status: 400 });
    }

    const squad = currentUser.squad!;

    // Check permissions (Captain or Co-Captain can invite)
    const isCaptain = squad.captainId === session.user.id;
    const isCoCaptain = squad.coCaptainId === session.user.id;
    if (!isCaptain && !isCoCaptain) {
      return NextResponse.json({ error: "Only the Team Captain or Co-Captain can invite members." }, { status: 403 });
    }

    // Find the player
    const invitee = await prisma.user.findFirst({
      where: {
        OR: [
          { id: searchQuery.trim() },
          { email: searchQuery.trim() },
          { username: searchQuery.trim() },
          { name: searchQuery.trim() },
        ],
      },
    });

    if (!invitee) {
      return NextResponse.json({ error: "Trainer not found. Double check their ID, username, or email." }, { status: 404 });
    }

    if (invitee.squadId) {
      return NextResponse.json({ error: `${invitee.name || invitee.username} is already a member of another squad.` }, { status: 400 });
    }

    // Check if invitation already exists
    const existingInvite = await prisma.squadInvitation.findUnique({
      where: {
        squadId_userId: {
          squadId: squad.id,
          userId: invitee.id,
        },
      },
    });

    if (existingInvite && existingInvite.status === "PENDING") {
      return NextResponse.json({ error: "An invitation has already been sent to this trainer." }, { status: 400 });
    }

    // Create or reset invitation
    const invitation = await prisma.squadInvitation.upsert({
      where: {
        squadId_userId: {
          squadId: squad.id,
          userId: invitee.id,
        },
      },
      create: {
        squadId: squad.id,
        userId: invitee.id,
        status: "PENDING",
      },
      update: {
        status: "PENDING",
        createdAt: new Date(),
      },
    });

    // Create system notification for invitee
    await prisma.notification.create({
      data: {
        userId: invitee.id,
        message: `${squad.name} has invited you to join their squad!`,
        type: "INFO",
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: "SEND_SQUAD_INVITATION",
        userId: session.user.id,
        details: `Squad "${squad.name}" invited user "${invitee.name || invitee.username}"`,
      },
    });

    return NextResponse.json({ success: true, invitation });
  } catch (error: any) {
    console.error("Failed to send invite:", error);
    return NextResponse.json({ error: error.message || "Failed to process invitation" }, { status: 500 });
  }
}

// PUT /api/squads/invite - Accept or decline an invitation
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invitationId, action } = await req.json();

    if (!invitationId || !action || !["ACCEPT", "DECLINE"].includes(action)) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    const invitation = await prisma.squadInvitation.findUnique({
      where: { id: invitationId },
      include: {
        squad: {
          include: {
            captain: true,
          },
        },
      },
    });

    if (!invitation || invitation.userId !== session.user.id) {
      return NextResponse.json({ error: "Invitation not found or unauthorized." }, { status: 404 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "This invitation has already been processed." }, { status: 400 });
    }

    if (action === "ACCEPT") {
      // Make sure user isn't in another squad now
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (user?.squadId) {
        return NextResponse.json({ error: "You are already a member of another squad. Exit that squad first." }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        // Accept invitation
        await tx.squadInvitation.update({
          where: { id: invitationId },
          data: { status: "ACCEPTED" },
        });

        // Link user to squad
        await tx.user.update({
          where: { id: session.user.id },
          data: { squadId: invitation.squadId },
        });

        // Notify team captain
        await tx.notification.create({
          data: {
            userId: invitation.squad.captainId,
            message: `${session.user.name} has accepted your invitation to join ${invitation.squad.name}!`,
            type: "INFO",
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            action: "ACCEPT_SQUAD_INVITATION",
            userId: session.user.id,
            details: `User ${session.user.name} joined squad "${invitation.squad.name}"`,
          },
        });
      });

      return NextResponse.json({ success: true, message: "Welcome to the team!" });
    } else {
      // DECLINE
      await prisma.$transaction(async (tx) => {
        await tx.squadInvitation.update({
          where: { id: invitationId },
          data: { status: "DECLINED" },
        });

        // Notify team captain
        await tx.notification.create({
          data: {
            userId: invitation.squad.captainId,
            message: `${session.user.name} has declined your invitation to join ${invitation.squad.name}.`,
            type: "INFO",
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            action: "DECLINE_SQUAD_INVITATION",
            userId: session.user.id,
            details: `User ${session.user.name} declined squad invitation to "${invitation.squad.name}"`,
          },
        });
      });

      return NextResponse.json({ success: true, message: "Invitation declined." });
    }
  } catch (error: any) {
    console.error("Failed to update invitation:", error);
    return NextResponse.json({ error: error.message || "Failed to process invitation action" }, { status: 500 });
  }
}
