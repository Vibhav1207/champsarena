import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

// GET /api/tournaments/[id] - Fetch single tournament
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        registrations: {
          where: { status: "APPROVED" },
          include: {
            user: {
              select: { id: true, name: true, elo: true, image: true },
            },
          },
        },
        squadRegistrations: {
          where: { status: "APPROVED" },
          include: {
            squad: {
              select: {
                id: true,
                name: true,
                logo: true,
                captainId: true,
                members: {
                  select: { id: true, name: true, username: true },
                },
              },
            },
          },
        },
        winner: { select: { id: true, name: true, image: true } },
        matches: {
          include: {
            p1: { select: { id: true, name: true, image: true } },
            p2: { select: { id: true, name: true, image: true } },
            winner: { select: { id: true, name: true, image: true } },
            s1: { select: { id: true, name: true, logo: true } },
            s2: { select: { id: true, name: true, logo: true } },
            winnerSquad: { select: { id: true, name: true, logo: true } },
            attachments: true,
            dispute: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Determine user's registration status
    let userRegistration = null;
    let squadRegistration = null;
    if (session?.user?.id) {
      userRegistration = await prisma.registration.findUnique({
        where: {
          userId_tournamentId: {
            userId: session.user.id,
            tournamentId: id,
          },
        },
        include: { payments: true },
      });

      const userDetails = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { squadId: true },
      });

      if (userDetails?.squadId) {
        squadRegistration = await prisma.squadRegistration.findUnique({
          where: {
            squadId_tournamentId: {
              squadId: userDetails.squadId,
              tournamentId: id,
            },
          },
          include: {
            squad: {
              select: {
                id: true,
                name: true,
                logo: true,
                captainId: true,
              },
            },
          },
        });
      }
    }

    return NextResponse.json({
      tournament,
      userRegistration,
      squadRegistration,
    });
  } catch (error: any) {
    console.error("Failed to fetch tournament details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/tournaments/[id] - Update tournament (Admin only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Check status transition for bracket generation
    const tourBefore = await prisma.tournament.findUnique({
      where: { id },
      include: { matches: true },
    });

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        banner: body.banner,
        rules: body.rules,
        entryFee: body.entryFee !== undefined ? parseFloat(body.entryFee) : undefined,
        prizePool: body.prizePool !== undefined ? parseFloat(body.prizePool) : undefined,
        currency: body.currency,
        prizeDistribution: body.prizeDistribution,
        maxPlayers: body.maxPlayers !== undefined ? parseInt(body.maxPlayers) : undefined,
        registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline) : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        type: body.type,
        status: body.status,
        visibility: body.visibility,
        badgeName: body.badgeName,
        badgeIcon: body.badgeIcon,
        winnerId: body.winnerId,
        game: body.game,
        watchLiveUrl: body.watchLiveUrl !== undefined ? body.watchLiveUrl : undefined,
        mode: body.mode,
        minSquadMembers: body.minSquadMembers !== undefined ? parseInt(body.minSquadMembers) : undefined,
        maxSquadMembers: body.maxSquadMembers !== undefined ? parseInt(body.maxSquadMembers) : undefined,
      },
    });

    // Send live notifications to all approved players and squad members when the tournament starts (ONGOING)
    if (body.status === "ONGOING" && tourBefore && tourBefore.status !== "ONGOING") {
      try {
        const [regs, squadRegs] = await Promise.all([
          prisma.registration.findMany({
            where: { tournamentId: id, status: "APPROVED" },
            select: { userId: true },
          }),
          prisma.squadRegistration.findMany({
            where: { tournamentId: id, status: "APPROVED" },
            select: {
              squad: {
                select: {
                  members: {
                    select: { id: true },
                  },
                },
              },
            },
          }),
        ]);

        const userIds = new Set<string>();
        regs.forEach((r: { userId: string }) => userIds.add(r.userId));
        squadRegs.forEach((sr: { squad?: { members?: Array<{ id: string }> } }) => {
          sr.squad?.members?.forEach((m: { id: string }) => userIds.add(m.id));
        });

        if (userIds.size > 0) {
          const notificationsData = Array.from(userIds).map(uid => ({
            userId: uid,
            message: `Tournament "${tourBefore.title}" is now live! Watch it live or view your matchups.`,
            type: "INFO",
          }));
          await prisma.notification.createMany({
            data: notificationsData,
          });
        }
      } catch (err) {
        console.error("Failed to send live notifications:", err);
      }
    }

    // Auto-generate brackets/matches if transitioning to ONGOING and matches don't exist yet
    if (body.status === "ONGOING" && tourBefore && tourBefore.status !== "ONGOING" && tourBefore.matches.length === 0) {
      try {
        const { generateMatchesForTournament } = await import("@/lib/tournament/engine");
        await generateMatchesForTournament(id, body.seedingType || "ELO");
      } catch (err: any) {
        console.error("Bracket generation failed during status transition:", err);
        return NextResponse.json({ error: "Tournament status updated, but bracket generation failed: " + err.message }, { status: 400 });
      }
    }

    // Manual bracket regeneration
    if (body.regenerateBrackets) {
      try {
        await prisma.match.deleteMany({
          where: { tournamentId: id },
        });
        const { generateMatchesForTournament } = await import("@/lib/tournament/engine");
        await generateMatchesForTournament(id, body.seedingType || "ELO");
      } catch (err: any) {
        console.error("Bracket regeneration failed:", err);
        return NextResponse.json({ error: "Failed to regenerate brackets: " + err.message }, { status: 400 });
      }
    }

    // Log update
    await prisma.auditLog.create({
      data: {
        action: "UPDATE_TOURNAMENT",
        userId: session.user.id,
        details: `Updated tournament ${id}: "${updatedTournament.title}" (Status: ${updatedTournament.status})`,
      },
    });

    return NextResponse.json(updatedTournament);
  } catch (error: any) {
    console.error("Failed to update tournament:", error);
    return NextResponse.json({ error: error.message || "Failed to update tournament" }, { status: 500 });
  }
}

// DELETE /api/tournaments/[id] - Delete tournament (Admin only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const deleted = await prisma.tournament.delete({
      where: { id },
    });

    // Log deletion
    await prisma.auditLog.create({
      data: {
        action: "DELETE_TOURNAMENT",
        userId: session.user.id,
        details: `Deleted tournament ${id}: "${deleted.title}"`,
      },
    });

    return NextResponse.json({ success: true, message: "Tournament deleted successfully" });
  } catch (error: any) {
    console.error("Failed to delete tournament:", error);
    return NextResponse.json({ error: error.message || "Failed to delete tournament" }, { status: 500 });
  }
}
