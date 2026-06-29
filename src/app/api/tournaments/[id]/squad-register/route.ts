import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { RegistrationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/tournaments/[id]/squad-register - Register a squad for a tournament
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Fetch tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        mode: true,
        minSquadMembers: true,
        maxSquadMembers: true,
        status: true,
        registrationDeadline: true,
        startDate: true,
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Check if tournament is a squad tournament
    if (tournament.mode !== "SQUAD") {
      return NextResponse.json({ error: "This tournament is not a squad tournament" }, { status: 400 });
    }

    // Check if registration is open
    if (tournament.status !== "REGISTRATION_OPEN" && tournament.status !== "UPCOMING") {
      return NextResponse.json({ error: "Registration is not open for this tournament" }, { status: 400 });
    }

    // Check registration deadline
    if (new Date() > new Date(tournament.registrationDeadline)) {
      return NextResponse.json({ error: "Registration deadline has passed" }, { status: 400 });
    }

    // Get user's squad
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { squadId: true },
    });

    if (!user?.squadId) {
      return NextResponse.json({ error: "You are not a member of any squad" }, { status: 400 });
    }

    // Fetch squad with members
    const squad = await prisma.squad.findUnique({
      where: { id: user.squadId },
      include: {
        members: {
          select: { id: true },
        },
        captain: { select: { id: true } },
      },
    });

    if (!squad) {
      return NextResponse.json({ error: "Squad not found" }, { status: 404 });
    }

    // Only captain can register
    if (squad.captainId !== userId) {
      return NextResponse.json({ error: "Only the Team Captain can register the squad" }, { status: 403 });
    }

    // Check squad member count
    const memberCount = squad.members.length;
    if (memberCount < (tournament.minSquadMembers || 1)) {
      return NextResponse.json({
        error: `Squad must have at least ${tournament.minSquadMembers || 1} members to register`
      }, { status: 400 });
    }

    if (memberCount > (tournament.maxSquadMembers || 6)) {
      return NextResponse.json({
        error: `Squad cannot have more than ${tournament.maxSquadMembers || 6} members for this tournament`
      }, { status: 400 });
    }

    // Check if squad already registered
    const existingRegistration = await prisma.squadRegistration.findUnique({
      where: {
        squadId_tournamentId: {
          squadId: squad.id,
          tournamentId: id,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json({ error: "Squad is already registered for this tournament" }, { status: 400 });
    }

    // Create registration
    const registration = await prisma.squadRegistration.create({
      data: {
        squadId: squad.id,
        tournamentId: id,
        status: RegistrationStatus.PENDING,
      },
      include: {
        squad: {
          select: { id: true, name: true, logo: true },
        },
        tournament: {
          select: { id: true, title: true },
        },
      },
    });

    // Notify all squad members
    const memberIds = squad.members.map(m => m.id);
    await prisma.notification.createMany({
      data: memberIds.map(memberId => ({
        userId: memberId,
        message: `Your squad "${squad.name}" has been registered for "${tournament.title}"!`,
        type: "INFO",
      })),
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: "SQUAD_TOURNAMENT_REGISTRATION",
        userId,
        details: `Captain registered squad "${squad.name}" for tournament "${tournament.title}"`,
      },
    });

    return NextResponse.json({ success: true, registration }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to register squad for tournament:", error);
    return NextResponse.json({ error: error.message || "Failed to register squad" }, { status: 500 });
  }
}

// DELETE /api/tournaments/[id]/squad-register - Unregister squad from tournament
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Get user's squad
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { squadId: true },
    });

    if (!user?.squadId) {
      return NextResponse.json({ error: "You are not a member of any squad" }, { status: 400 });
    }

    // Fetch squad
    const squad = await prisma.squad.findUnique({
      where: { id: user.squadId },
      select: { id: true, captainId: true, name: true },
    });

    if (!squad) {
      return NextResponse.json({ error: "Squad not found" }, { status: 404 });
    }

    // Only captain can unregister
    if (squad.captainId !== userId) {
      return NextResponse.json({ error: "Only the Team Captain can unregister the squad" }, { status: 403 });
    }

    // Check if registration exists
    const registration = await prisma.squadRegistration.findUnique({
      where: {
        squadId_tournamentId: {
          squadId: squad.id,
          tournamentId: id,
        },
      },
      include: {
        tournament: { select: { title: true } },
      },
    });

    if (!registration) {
      return NextResponse.json({ error: "Squad is not registered for this tournament" }, { status: 404 });
    }

    // Check if tournament already started
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { status: true, title: true },
    });

    if (tournament && tournament.status === "ONGOING") {
      return NextResponse.json({ error: "Cannot unregister from an ongoing tournament" }, { status: 400 });
    }

    // Delete registration
    await prisma.squadRegistration.delete({
      where: {
        squadId_tournamentId: {
          squadId: squad.id,
          tournamentId: id,
        },
      },
    });

    // Notify squad members
    const members = await prisma.user.findMany({
      where: { squadId: squad.id },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: members.map(m => ({
        userId: m.id,
        message: `Your squad "${squad.name}" has been unregistered from "${tournament?.title || "the tournament"}"`,
        type: "INFO",
      })),
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        action: "SQUAD_TOURNAMENT_UNREGISTRATION",
        userId,
        details: `Captain unregistered squad "${squad.name}" from tournament "${tournament?.title || id}"`,
      },
    });

    return NextResponse.json({ success: true, message: "Squad unregistered successfully" });
  } catch (error: any) {
    console.error("Failed to unregister squad:", error);
    return NextResponse.json({ error: error.message || "Failed to unregister squad" }, { status: 500 });
  }
}