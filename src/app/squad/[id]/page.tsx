import { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import SquadPageClient from "./SquadPageClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const squad = await prisma.squad.findUnique({
    where: { id },
    select: { name: true, logo: true, description: true },
  });

  if (!squad) {
    return { title: "Squad Not Found | ChampsArena" };
  }

  return {
    title: `${squad.name} | ChampsArena`,
    description: squad.description || `View the ${squad.name} squad on ChampsArena`,
    openGraph: {
      title: squad.name,
      description: squad.description || `View the ${squad.name} squad on ChampsArena`,
      images: squad.logo ? [squad.logo] : [],
    },
  };
}

export default async function SquadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const squad = await prisma.squad.findUnique({
    where: { id },
    include: {
      members: {
        select: { id: true, name: true, username: true, email: true, image: true, elo: true, wins: true, losses: true },
      },
      captain: {
        select: { id: true, name: true, username: true, email: true, image: true },
      },
      coCaptain: {
        select: { id: true, name: true, username: true, email: true, image: true },
      },
      registrations: {
        include: {
          tournament: {
            select: { id: true, title: true, startDate: true, game: true, status: true },
          },
        },
      },
    },
  });

  if (!squad) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-lg border-4 border-primary bg-white">
          <span className="material-symbols-outlined text-5xl text-primary mb-sm block">groups</span>
          <h2 className="text-2xl font-black uppercase mb-xs text-primary">Squad Not Found</h2>
          <p className="font-bold text-primary uppercase text-sm">The squad you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Fetch match history
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ s1Id: id }, { s2Id: id }],
      status: "COMPLETED",
    },
    include: {
      s1: { select: { name: true } },
      s2: { select: { name: true } },
      winnerSquad: { select: { name: true } },
      tournament: { select: { title: true, startDate: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const totalWins = matches.filter(m => m.winnerSquadId === id).length;
  const totalLosses = matches.length - totalWins;
  const winRate = matches.length > 0 ? Math.round((totalWins / matches.length) * 100) : 0;
  const averageElo = squad.members.length > 0
    ? Math.round(squad.members.reduce((acc, m) => acc + m.elo, 0) / squad.members.length)
    : 1000;

  // Check if current user is captain/co-captain
  const isCaptain = session?.user?.id === squad.captainId;
  const isCoCaptain = session?.user?.id === squad.coCaptainId;
  const isMember = Boolean(session?.user?.id && squad.members.some(m => m.id === session.user.id));

  return (
    <SquadPageClient
      initialSquad={{
        ...squad,
        matches,
        stats: {
          wins: totalWins,
          losses: totalLosses,
          winRate,
          elo: averageElo,
        },
        isCaptain,
        isCoCaptain,
        isMember,
        currentUserId: session?.user?.id,
      }}
    />
  );
}