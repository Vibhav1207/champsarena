import { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import SquadsDashboardClient from "./SquadsDashboardClient";

export const metadata: Metadata = {
  title: "My Squads | ChampsArena",
  description: "Manage your squads and team invitations",
};

export default async function SquadsDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-lg border-4 border-primary bg-white">
          <span className="material-symbols-outlined text-5xl text-primary mb-sm block">person_off</span>
          <h2 className="text-2xl font-black uppercase mb-xs text-primary">Please Sign In</h2>
          <p className="font-bold text-primary uppercase text-sm">You must be logged in to view your squads.</p>
        </div>
      </div>
    );
  }

  // Fetch all squads where user is a member
  const squads = await prisma.squad.findMany({
    where: { members: { some: { id: session.user.id } } },
    include: {
      members: {
        select: { id: true, name: true, username: true, elo: true, wins: true, losses: true },
      },
      captain: {
        select: { id: true, name: true, username: true, image: true },
      },
      coCaptain: {
        select: { id: true, name: true, username: true, image: true },
      },
      registrations: {
        include: {
          tournament: {
            select: { id: true, title: true, startDate: true, game: true, status: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Fetch pending invitations for the user
  const invitations = await prisma.squadInvitation.findMany({
    where: { userId: session.user.id, status: "PENDING" },
    include: {
      squad: {
        select: { id: true, name: true, logo: true, captainId: true },
      },
    },
  });

  // Calculate stats for each squad
  const squadsWithStats = squads.map((squad) => {
    const matches = squad.members.length > 0 ? 0 : 0; // We'll skip match calculation for list view
    return {
      ...squad,
      memberCount: squad.members.length,
      isCaptain: squad.captainId === session.user.id,
      isCoCaptain: squad.coCaptainId === session.user.id,
    };
  });

  return (
    <SquadsDashboardClient
      initialSquads={squadsWithStats}
      initialInvitations={invitations}
      userId={session.user.id}
    />
  );
}