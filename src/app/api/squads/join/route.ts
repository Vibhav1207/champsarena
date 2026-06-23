import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { squadId } = await req.json();
    if (!squadId) {
      return NextResponse.json({ error: "Squad ID is required." }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if user already has a squad
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.squadId) {
      return NextResponse.json({ error: "You are already a member of a squad. Exit your current squad first." }, { status: 400 });
    }

    // Check squad and roster count
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        members: { select: { id: true } },
      },
    });

    if (!squad) {
      return NextResponse.json({ error: "Squad not found." }, { status: 404 });
    }

    if (squad.members.length >= 6) {
      return NextResponse.json({ error: "Squad is full (maximum 6 roster spots)." }, { status: 400 });
    }

    // Add user to squad
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { squadId },
      });

      // Notify captain
      await tx.notification.create({
        data: {
          userId: squad.captainId,
          message: `${user.name || user.username || "A new member"} has joined your squad via invite link!`,
          type: "INFO",
        },
      });

      // Log action
      await tx.auditLog.create({
        data: {
          action: "JOIN_SQUAD_LINK",
          userId,
          details: `User ${user.name || user.username} joined squad "${squad.name}" via invite link`,
        },
      });
    });

    return NextResponse.json({ success: true, message: `Successfully joined ${squad.name}!` });
  } catch (error: any) {
    console.error("Failed to join squad via link:", error);
    return NextResponse.json({ error: error.message || "Failed to join squad" }, { status: 500 });
  }
}
