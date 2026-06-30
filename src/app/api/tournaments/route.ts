import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

// Local enum types from Prisma schema
type TournamentType = "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN" | "SWISS";
type TournamentStatus = "DRAFT" | "UPCOMING" | "REGISTRATION_OPEN" | "ONGOING" | "COMPLETED" | "CANCELLED";
type Role = "USER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";

export const dynamic = "force-dynamic";

// GET /api/tournaments - Fetch tournaments with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format"); // VGC, TCG, GO
    const tier = searchParams.get("tier"); // Regional, International
    const status = searchParams.get("status"); // UPCOMING, ONGOING, etc.
    const search = searchParams.get("search");
    const mode = searchParams.get("mode"); // SOLO, SQUAD
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const skip = (page - 1) * limit;

    // Mapping string parameters to DB enum types
    let typeFilter: TournamentType | undefined;
    if (format === "VGC") typeFilter = "SWISS";
    if (format === "TCG") typeFilter = "ROUND_ROBIN";
    if (format === "GO") typeFilter = "DOUBLE_ELIMINATION";

    let modeFilter: string | undefined;
    if (mode === "SOLO") modeFilter = "SOLO";
    if (mode === "SQUAD") modeFilter = "SQUAD";

    const where: any = {
      visibility: true,
    };

    if (typeFilter) {
      where.type = typeFilter;
    }

    if (status) {
      where.status = status as TournamentStatus;
    }

    if (modeFilter) {
      where.mode = modeFilter;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Execute queries in parallel for better performance
    const [tournaments, totalCount] = await Promise.all([
      prisma.tournament.findMany({
        where,
        include: {
          _count: {
            select: { registrations: { where: { status: "APPROVED" } } },
          },
        },
        orderBy: { startDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.tournament.count({ where }),
    ]);

    return NextResponse.json(
      { tournaments, totalCount, page, totalPages: Math.ceil(totalCount / limit) },
      {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch tournaments:", error);
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}

// POST /api/tournaments - Create a new tournament (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      banner,
      rules,
      entryFee,
      prizePool,
      currency,
      prizeDistribution,
      maxPlayers,
      registrationDeadline,
      startDate,
      endDate,
      type,
      status,
      visibility,
      badgeName,
      badgeIcon,
      game,
      watchLiveUrl,
      mode,
      minSquadMembers,
      maxSquadMembers,
    } = body;

    if (!title || !description || !rules || !registrationDeadline || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tournament = await prisma.tournament.create({
      data: {
        title,
        description,
        banner,
        rules,
        entryFee: parseFloat(entryFee || 0),
        prizePool: parseFloat(prizePool || 0),
        currency: currency || "USD",
        prizeDistribution: prizeDistribution || "TOP_8",
        maxPlayers: parseInt(maxPlayers || 64),
        registrationDeadline: new Date(registrationDeadline),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: type || "SINGLE_ELIMINATION",
        status: status || "DRAFT",
        visibility: visibility !== undefined ? visibility : true,
        badgeName: badgeName || null,
        badgeIcon: badgeIcon || null,
        game: game || "POKEMON_VGC",
        watchLiveUrl: watchLiveUrl || null,
        mode: mode || "SOLO",
        minSquadMembers: minSquadMembers !== undefined ? parseInt(minSquadMembers) : 1,
        maxSquadMembers: maxSquadMembers !== undefined ? parseInt(maxSquadMembers) : 1,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: "CREATE_TOURNAMENT",
        userId: session.user.id,
        details: `Created tournament ${tournament.id}: "${tournament.title}"`,
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create tournament:", error);
    return NextResponse.json({ error: error.message || "Failed to create tournament" }, { status: 500 });
  }
}