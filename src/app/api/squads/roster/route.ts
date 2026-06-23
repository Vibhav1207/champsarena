import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { action, userId } = await req.json();

    if (!action) {
      return NextResponse.json({ error: "Action is required." }, { status: 400 });
    }

    // Retrieve user and squad details
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { squad: true },
    });

    if (!currentUser || !currentUser.squadId) {
      return NextResponse.json({ error: "You are not in a squad." }, { status: 400 });
    }

    const squad = currentUser.squad!;
    const isCaptain = squad.captainId === currentUserId;
    const isCoCaptain = squad.coCaptainId === currentUserId;

    if (action === "LEAVE") {
      if (isCaptain) {
        // Find if there are other members
        const otherMembers = await prisma.user.findMany({
          where: { squadId: squad.id, NOT: { id: currentUserId } },
        });

        if (otherMembers.length > 0) {
          return NextResponse.json({ error: "As Captain, you cannot leave the squad until you transfer captaincy to another member." }, { status: 400 });
        } else {
          // No other members, delete the squad
          await prisma.$transaction(async (tx) => {
            await tx.user.update({
              where: { id: currentUserId },
              data: { squadId: null },
            });
            await tx.squad.delete({
              where: { id: squad.id },
            });
            await tx.auditLog.create({
              data: {
                action: "DISBAND_SQUAD",
                userId: currentUserId,
                details: `Captain ${currentUser.name} left and disbanded squad "${squad.name}"`,
              },
            });
          });
          return NextResponse.json({ success: true, message: "Squad disbanded successfully." });
        }
      } else {
        // Regular member leaves
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: currentUserId },
            data: { squadId: null },
          });

          // If leaving player was co-captain, clear coCaptainId
          if (squad.coCaptainId === currentUserId) {
            await tx.squad.update({
              where: { id: squad.id },
              data: { coCaptainId: null },
            });
          }

          // Notify captain
          await tx.notification.create({
            data: {
              userId: squad.captainId,
              message: `${currentUser.name} has left squad ${squad.name}.`,
              type: "INFO",
            },
          });

          await tx.auditLog.create({
            data: {
              action: "LEAVE_SQUAD",
              userId: currentUserId,
              details: `User ${currentUser.name} left squad "${squad.name}"`,
            },
          });
        });
        return NextResponse.json({ success: true, message: "You have left the squad." });
      }
    }

    // All actions below require a target userId
    if (!userId) {
      return NextResponse.json({ error: "Target User ID is required." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser || targetUser.squadId !== squad.id) {
      return NextResponse.json({ error: "Target player is not in your squad." }, { status: 400 });
    }

    if (action === "KICK") {
      // Permission checks
      if (!isCaptain && !isCoCaptain) {
        return NextResponse.json({ error: "Unauthorized to kick members." }, { status: 403 });
      }
      if (userId === squad.captainId) {
        return NextResponse.json({ error: "Cannot kick the Captain." }, { status: 400 });
      }
      if (isCoCaptain && userId === squad.coCaptainId) {
        return NextResponse.json({ error: "Co-Captains cannot kick themselves or other Co-Captains." }, { status: 400 });
      }
      if (isCoCaptain && squad.captainId !== currentUserId && userId === squad.coCaptainId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { squadId: null },
        });

        // Clear co-captain if that was the kicked user
        if (squad.coCaptainId === userId) {
          await tx.squad.update({
            where: { id: squad.id },
            data: { coCaptainId: null },
          });
        }

        // Notify member
        await tx.notification.create({
          data: {
            userId: userId,
            message: `You have been kicked from squad ${squad.name}.`,
            type: "INFO",
          },
        });

        await tx.auditLog.create({
          data: {
            action: "KICK_SQUAD_MEMBER",
            userId: currentUserId,
            details: `User ${currentUser.name} kicked ${targetUser.name} from squad "${squad.name}"`,
          },
        });
      });

      return NextResponse.json({ success: true, message: "Member kicked successfully." });
    }

    // Actions below require Captain permissions
    if (!isCaptain) {
      return NextResponse.json({ error: "Only the Team Captain can modify roles." }, { status: 403 });
    }

    if (action === "TRANSFER_CAPTAIN") {
      await prisma.$transaction(async (tx) => {
        await tx.squad.update({
          where: { id: squad.id },
          data: {
            captainId: userId,
            // If new captain was co-captain, clear the co-captain slot
            coCaptainId: squad.coCaptainId === userId ? null : squad.coCaptainId,
          },
        });

        await tx.notification.create({
          data: {
            userId: userId,
            message: `You have been promoted to Captain of squad ${squad.name}!`,
            type: "INFO",
          },
        });

        await tx.auditLog.create({
          data: {
            action: "TRANSFER_SQUAD_CAPTAIN",
            userId: currentUserId,
            details: `Captain role transferred from ${currentUser.name} to ${targetUser.name} for squad "${squad.name}"`,
          },
        });
      });

      return NextResponse.json({ success: true, message: "Captaincy transferred successfully." });
    }

    if (action === "SET_CO_CAPTAIN") {
      if (squad.coCaptainId === userId) {
        return NextResponse.json({ error: "User is already Co-Captain." }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.squad.update({
          where: { id: squad.id },
          data: { coCaptainId: userId },
        });

        await tx.notification.create({
          data: {
            userId: userId,
            message: `You have been set as Co-Captain of squad ${squad.name}.`,
            type: "INFO",
          },
        });

        await tx.auditLog.create({
          data: {
            action: "SET_SQUAD_CO_CAPTAIN",
            userId: currentUserId,
            details: `User ${targetUser.name} set as Co-Captain of squad "${squad.name}" by Captain ${currentUser.name}`,
          },
        });
      });

      return NextResponse.json({ success: true, message: "Co-Captain set successfully." });
    }

    if (action === "REMOVE_CO_CAPTAIN") {
      if (squad.coCaptainId !== userId) {
        return NextResponse.json({ error: "User is not Co-Captain." }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.squad.update({
          where: { id: squad.id },
          data: { coCaptainId: null },
        });

        await tx.notification.create({
          data: {
            userId: userId,
            message: `Your Co-Captain permissions have been removed for squad ${squad.name}.`,
            type: "INFO",
          },
        });

        await tx.auditLog.create({
          data: {
            action: "REMOVE_SQUAD_CO_CAPTAIN",
            userId: currentUserId,
            details: `User ${targetUser.name} demoted from Co-Captain of squad "${squad.name}" by Captain ${currentUser.name}`,
          },
        });
      });

      return NextResponse.json({ success: true, message: "Co-Captain removed successfully." });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("Roster operation failed:", error);
    return NextResponse.json({ error: error.message || "Roster modification failed" }, { status: 500 });
  }
}
