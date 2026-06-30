import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

// Role type from Prisma schema
type Role = "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";

export const dynamic = "force-dynamic";

// GET /api/announcements - Fetch news announcements
export async function GET(req: NextRequest) {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        published: true,
        OR: [
          { scheduledPublishAt: null },
          { scheduledPublishAt: { lte: new Date() } },
        ],
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(announcements);
  } catch (error: any) {
    console.error("Failed to fetch announcements:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

// POST /api/announcements - Create a new announcement (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { title, content, pinned, scheduledPublishAt, published } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        pinned: !!pinned,
        scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : null,
        published: published !== undefined ? published : true,
      },
    });

    // Log announcement creation
    await prisma.auditLog.create({
      data: {
        action: "CREATE_ANNOUNCEMENT",
        userId: session.user.id,
        details: `Created announcement: "${title}"`,
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create announcement:", error);
    return NextResponse.json({ error: error.message || "Failed to create announcement" }, { status: 500 });
  }
}
