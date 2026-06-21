import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role, TicketStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/support - Retrieve tickets
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let tickets;

    if (session.user.role === Role.ADMIN || session.user.role === Role.SUPER_ADMIN || session.user.role === Role.MODERATOR) {
      // Admins and mods can view all tickets
      tickets = await prisma.supportTicket.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true } },
          replies: {
            include: {
              user: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    } else {
      // Ordinary users only view their own tickets
      tickets = await prisma.supportTicket.findMany({
        where: { userId: session.user.id },
        include: {
          assignedTo: { select: { id: true, name: true } },
          replies: {
            include: {
              user: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    return NextResponse.json(tickets);
  } catch (error: any) {
    console.error("Failed to fetch tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// POST /api/support - Create a new support ticket
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subject, message } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject,
        message,
        status: TicketStatus.OPEN,
      },
    });

    // Create system notification for admins/mods
    const admins = await prisma.user.findMany({
      where: {
        role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
      },
    });

    const notifications = admins.map((adm) => ({
      userId: adm.id,
      message: `New support ticket created by ${session.user?.name || "Trainer"}: "${subject}"`,
      type: "INFO",
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create ticket:", error);
    return NextResponse.json({ error: error.message || "Failed to create ticket" }, { status: 500 });
  }
}
