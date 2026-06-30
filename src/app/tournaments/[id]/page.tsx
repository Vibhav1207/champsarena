import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { GAMES_DATA } from "@/data/games";
import TournamentDetailClient from "./TournamentDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      title: true,
      game: true,
      type: true,
      prizePool: true,
      currency: true,
      registrationDeadline: true,
      startDate: true,
      banner: true,
    },
  });

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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";
  const ogImageUrl = `${baseUrl}/api/og/tournament?title=${encodeURIComponent(tournament.title)}&game=${encodeURIComponent(tournament.game)}&prize=${encodeURIComponent(tournament.prizePool)}&currency=${encodeURIComponent(tournament.currency)}&date=${encodeURIComponent(new Date(tournament.startDate).toLocaleDateString())}`;

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

// Enable ISR for tournament detail pages (revalidate every 5 minutes)
export const revalidate = 300;

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // If the parameter is actually a game slug, redirect permanently to that game's tournaments page
  if (GAMES_DATA[id]) {
    redirect(`/games/${id}/tournaments`);
  }

  // Check if user is authenticated
  const session = await auth();
  if (!session) {
    const callbackUrl = `/tournaments/${id}`;
    redirect(`/login?callback=${encodeURIComponent(callbackUrl)}`);
  }

  // Fetch Tournament details with optimized queries
  const [tournament, userRegistration, userDetails] = await Promise.all([
    prisma.tournament.findUnique({
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
    }),
    session?.user?.id
      ? prisma.registration.findUnique({
          where: {
            userId_tournamentId: {
              userId: session.user.id,
              tournamentId: id,
            },
          },
          include: { payments: true },
        })
      : Promise.resolve(null),
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { squadId: true },
        })
      : Promise.resolve(null),
  ]);

  if (!tournament) {
    notFound();
  }

  // Fetch squad registration if user is in a squad
  const squadRegistration = userDetails?.squadId
    ? await prisma.squadRegistration.findUnique({
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
      })
    : null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";
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

  // Serialize objects for client hydration - only include necessary fields
  const serializedTournament = {
    id: tournament.id,
    title: tournament.title,
    description: tournament.description,
    banner: tournament.banner,
    game: tournament.game,
    type: tournament.type,
    status: tournament.status,
    entryFee: tournament.entryFee,
    prizePool: tournament.prizePool,
    currency: tournament.currency,
    maxPlayers: tournament.maxPlayers,
    startDate: tournament.startDate.toISOString(),
    endDate: tournament.endDate.toISOString(),
    registrationDeadline: tournament.registrationDeadline.toISOString(),
    rules: tournament.rules,
    visibility: tournament.visibility,
    mode: tournament.mode,
    minSquadMembers: tournament.minSquadMembers,
    maxSquadMembers: tournament.maxSquadMembers,
    registrations: tournament.registrations.map((r: typeof tournament.registrations[0]) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      user: {
        ...r.user,
        image: r.user.image,
      },
    })),
    squadRegistrations: tournament.squadRegistrations.map((sr: typeof tournament.squadRegistrations[0]) => ({
      ...sr,
      createdAt: sr.createdAt.toISOString(),
      squad: {
        ...sr.squad,
        logo: sr.squad.logo,
        members: sr.squad.members,
      },
    })),
    winner: tournament.winner ? {
      ...tournament.winner,
      image: tournament.winner.image,
    } : null,
    matches: tournament.matches.map((m: typeof tournament.matches[0]) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      scheduledAt: m.scheduledAt?.toISOString(),
    })),
  };

  const serializedUserRegistration = userRegistration
    ? {
        ...userRegistration,
        createdAt: userRegistration.createdAt.toISOString(),
        payments: userRegistration.payments.map((p: typeof userRegistration.payments[0]) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        })),
      }
    : null;

  const serializedSquadRegistration = squadRegistration
    ? {
        ...squadRegistration,
        createdAt: squadRegistration.createdAt.toISOString(),
        squad: {
          ...squadRegistration.squad,
          logo: squadRegistration.squad.logo,
        },
      }
    : null;

  // Preload banner image if exists
  const preloadLinks = tournament.banner ? (
    <link rel="preload" as="image" href={tournament.banner} />
  ) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {preloadLinks}
      <TournamentDetailClient
        id={id}
        initialTournament={serializedTournament}
        initialUserRegistration={serializedUserRegistration}
        initialSquadRegistration={serializedSquadRegistration}
      />
    </>
  );
}