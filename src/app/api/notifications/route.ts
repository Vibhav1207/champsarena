import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

// GET /api/notifications - Get logged in user's notifications
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, all } = body;

    if (all) {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: session.user.id },
        data: { read: true },
      });
    } else if (notificationId) {
      // Mark specific notification as read
      await prisma.notification.update({
        where: { id: notificationId, userId: session.user.id },
        data: { read: true },
      });
    } else {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update notifications:", error);
    return NextResponse.json({ error: error.message || "Failed to update notifications" }, { status: 500 });
  }
}
