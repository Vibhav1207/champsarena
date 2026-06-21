import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role, TicketStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/support/[id] - Post a reply to a support ticket
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check if user is the ticket creator or an admin/moderator
    const isOwner = ticket.userId === session.user.id;
    const isStaff = session.user.role === Role.ADMIN || session.user.role === Role.SUPER_ADMIN || session.user.role === Role.MODERATOR;

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        message,
      },
    });

    // Automatically reopen / assign / update ticket state
    const updateData: any = {};
    if (isStaff) {
      updateData.status = TicketStatus.ASSIGNED;
      updateData.assignedId = session.user.id;
    } else {
      updateData.status = TicketStatus.OPEN;
    }

    await prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });

    // Notify the other party
    if (isStaff) {
      // Notify player
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          message: `New reply on your support ticket "${ticket.subject}" from support staff.`,
          type: "INFO",
        },
      });
    } else if (ticket.assignedId) {
      // Notify assigned staff
      await prisma.notification.create({
        data: {
          userId: ticket.assignedId,
          message: `New reply on ticket "${ticket.subject}" from user.`,
          type: "INFO",
        },
      });
    }

    return NextResponse.json(reply, { status: 201 });
  } catch (error: any) {
    console.error("Failed to post reply:", error);
    return NextResponse.json({ error: error.message || "Failed to post reply" }, { status: 500 });
  }
}

// PUT /api/support/[id] - Update ticket status / assignment (Admin / Mod only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status, assignedId } = await req.json();

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const isOwner = ticket.userId === session.user.id;
    const isStaff = session.user.role === Role.ADMIN || session.user.role === Role.SUPER_ADMIN || session.user.role === Role.MODERATOR;

    if (!isStaff) {
      // Non-staff can only close their own tickets
      if (isOwner && status === "CLOSED") {
        const updated = await prisma.supportTicket.update({
          where: { id },
          data: { status: TicketStatus.CLOSED },
        });
        return NextResponse.json(updated);
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: status as TicketStatus,
        assignedId: assignedId,
      },
    });

    // Notify user of status update
    if (status) {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          message: `Your support ticket "${ticket.subject}" has been marked as ${status}.`,
          type: "INFO",
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
