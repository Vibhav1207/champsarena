import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { GAMES_DATA } from "@/data/games";
import TournamentDetailClient from "./TournamentDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  let tournament;
  try {
    tournament = await prisma.tournament.findUnique({
      where: { id },
    });
  } catch (err) {
    console.error("Metadata fetch error:", err);
  }

  if (!tournament) {
    return {
      title: "Tournament Not Found | ChampsArena",
    };
  }

  const gameName = tournament.game.replace("_", " ");
  const format = tournament.type ? tournament.type.replace("_", " ") : "Championship";
  const prizeStr = tournament.prizePool > 0 ? ` with a ${tournament.currency === "INR" ? "₹" : "$"}${tournament.prizePool.toLocaleString()} Prize Pool` : "";
  const regDeadlineStr = tournament.registrationDeadline ? ` Register before ${new Date(tournament.registrationDeadline).toLocaleDateString()}.` : "";

  const title = `${tournament.title} | ${gameName} Tournament Registration | ChampsArena`;
  const description = `Register for ${tournament.title}${prizeStr}.${regDeadlineStr} View tournament details, rules, schedule, standings, participants, and results on ChampsArena.`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.gg";
  const ogImageUrl = `${baseUrl}/api/og/tournament?title=${encodeURIComponent(tournament.title)}&game=${encodeURIComponent(tournament.game)}&prize=${encodeURIComponent(tournament.prizePool)}&date=${encodeURIComponent(new Date(tournament.startDate).toLocaleDateString())}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/tournaments/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/tournaments/${id}`,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: tournament.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // If the parameter is actually a game slug, redirect permanently to that game's tournaments page
  if (GAMES_DATA[id]) {
    redirect(`/games/${id}/tournaments`);
  }

  // Fetch Tournament details
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
    notFound();
  }

  // Fetch auth session and user registrations
  const session = await auth();
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.gg";
  const currencyCode = tournament.currency === "INR" ? "INR" : "USD";

  // Event JSON-LD schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": tournament.title,
    "description": tournament.description || `Competitive ${tournament.game} tournament on ChampsArena`,
    "startDate": tournament.startDate.toISOString(),
    "endDate": tournament.endDate.toISOString(),
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
    "location": {
      "@type": "VirtualLocation",
      "url": `${baseUrl}/tournaments/${id}`
    },
    "organizer": {
      "@type": "Organization",
      "name": "ChampsArena",
      "url": baseUrl
    },
    "offers": {
      "@type": "Offer",
      "price": tournament.entryFee,
      "priceCurrency": currencyCode,
      "availability": (tournament.game === "FREE_FIRE" ? tournament.squadRegistrations.length : tournament.registrations.length) >= tournament.maxPlayers 
        ? "https://schema.org/OutOfStock" 
        : "https://schema.org/InStock"
    }
  };

  // Serialize objects for client hydration
  const serializedTournament = JSON.parse(JSON.stringify(tournament));
  const serializedUserRegistration = JSON.parse(JSON.stringify(userRegistration));
  const serializedSquadRegistration = JSON.parse(JSON.stringify(squadRegistration));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TournamentDetailClient
        id={id}
        initialTournament={serializedTournament}
        initialUserRegistration={serializedUserRegistration}
        initialSquadRegistration={serializedSquadRegistration}
      />
    </>
  );
}
