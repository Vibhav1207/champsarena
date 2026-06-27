import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/notifications - Get notification history (admin only)
 * Query parameters:
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 50)
 *   - startDate: filter from date (ISO string)
 *   - endDate: filter to date (ISO string)
 *   - type: filter by notification type
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session || !session.user ||
        (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Max 100
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    const startDateStr = searchParams.get("startDate");
    if (startDateStr) {
      where.createdAt = { ...(where.createdAt || {}), gte: new Date(startDateStr) };
    }

    const endDateStr = searchParams.get("endDate");
    if (endDateStr) {
      where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDateStr) };
    }

    const type = searchParams.get("type");
    if (type) {
      where.type = type;
    }

    // Get notifications with user info
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    console.error("Failed to fetch notification history:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification history" },
      { status: 500 }
    );
  }
}