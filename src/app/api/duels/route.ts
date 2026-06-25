import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/duels?game=BGMI&status=PENDING
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "20");

  try {
    const where: any = {};
    if (game) where.game = game;
    if (status) where.status = status;

    const duels = await prisma.duel.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        creator: {
          select: { id: true, name: true, username: true, image: true, elo: true },
        },
        opponent: {
          select: { id: true, name: true, username: true, image: true, elo: true },
        },
        winner: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    return NextResponse.json({ duels });
  } catch (err: any) {
    console.error("GET /api/duels error:", err);
    return NextResponse.json({ error: "Failed to fetch duels" }, { status: 500 });
  }
}

// POST /api/duels — Create a new duel challenge
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { game, opponentId, notes } = body;

    if (!game) {
      return NextResponse.json({ error: "Game is required" }, { status: 400 });
    }

    if (opponentId && opponentId === session.user.id) {
      return NextResponse.json({ error: "You cannot challenge yourself" }, { status: 400 });
    }

    // If opponentId is given, verify that user exists
    if (opponentId) {
      const opponent = await prisma.user.findUnique({ where: { id: opponentId } });
      if (!opponent) {
        return NextResponse.json({ error: "Opponent not found" }, { status: 404 });
      }
    }

    const duel = await prisma.duel.create({
      data: {
        game,
        creatorId: session.user.id,
        opponentId: opponentId || null,
        notes: notes || null,
        status: "PENDING",
      },
      include: {
        creator: {
          select: { id: true, name: true, username: true, image: true, elo: true },
        },
        opponent: {
          select: { id: true, name: true, username: true, image: true, elo: true },
        },
      },
    });

    return NextResponse.json({ duel }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/duels error:", err);
    return NextResponse.json({ error: "Failed to create duel" }, { status: 500 });
  }
}
