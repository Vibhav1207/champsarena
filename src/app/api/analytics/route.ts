import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 1. Core Metrics
    const totalUsers = await prisma.user.count();
    const totalTournaments = await prisma.tournament.count();
    const activeTournaments = await prisma.tournament.count({
      where: { status: "ONGOING" },
    });
    
    // Revenue sum from SUCCESS payments
    const payments = await prisma.payment.findMany({
      where: { status: "SUCCESS" },
    });
    const revenue = payments.reduce((acc, pay) => acc + pay.amount, 0);

    const pendingRegistrations = await prisma.registration.count({
      where: { status: "PENDING" },
    });

    // 2. Tournament Participation rate (registrations per tournament)
    const registrationsByTournament = await prisma.tournament.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: { registrations: true },
        },
      },
    });

    // 3. User Growth (users created per month/day - simplified grouping by createdAt)
    const users = await prisma.user.findMany({
      select: { createdAt: true },
    });
    const userGrowth: Record<string, number> = {};
    for (const u of users) {
      const month = u.createdAt.toISOString().slice(0, 7); // YYYY-MM
      userGrowth[month] = (userGrowth[month] || 0) + 1;
    }

    // Convert userGrowth to sorted array
    const userGrowthArray = Object.entries(userGrowth)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 4. Recent Payment Transactions
    const recentPayments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        registration: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            tournament: { select: { id: true, title: true } },
          },
        },
      },
    });

    // 5. Recent Audit Logs
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { name: true, role: true } },
      },
    });

    // 6. Recent Tournaments
    const recentTournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        maxPlayers: true,
        prizePool: true,
        entryFee: true,
        currency: true,
        startDate: true,
        _count: {
          select: {
            registrations: { where: { status: "APPROVED" } },
          },
        },
      },
    });

    // 7. Active/Open Disputes
    const disputes = await prisma.matchDispute.findMany({
      where: { status: "OPEN" },
      include: {
        match: {
          include: {
            p1: { select: { id: true, name: true } },
            p2: { select: { id: true, name: true } },
            tournament: { select: { id: true, title: true } },
            attachments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalTournaments,
        activeTournaments,
        revenue,
        pendingRegistrations,
      },
      userGrowth: userGrowthArray,
      tournamentParticipation: registrationsByTournament,
      recentPayments,
      auditLogs,
      recentTournaments,
      disputes,
    });
  } catch (error: any) {
    console.error("Failed to compile system analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
