import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { GAMES_DATA } from "@/data/games";
import GameHubClient from "./GameHubClient";

interface GamePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = GAMES_DATA[slug];

  if (!game) {
    return {
      title: "Game Hub Not Found | ChampsArena",
    };
  }

  const title = `${game.name} Tournaments & Duels | ChampsArena`;
  const description = `Join upcoming ${game.name} tournaments and duels on ChampsArena. Register, compete, track standings, earn rewards and become a champion.`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

  return {
    title,
    description,
    keywords: game.keywords.join(", "),
    alternates: {
      canonical: `${baseUrl}/games/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/games/${slug}`,
      type: "website",
      images: [
        {
          url: game.bannerUrl,
          width: 1200,
          height: 630,
          alt: game.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [game.bannerUrl],
    },
  };
}

export default async function GameHubPage({ params, searchParams }: GamePageProps) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const game = GAMES_DATA[slug];

  if (!game) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

  // Pre-optimized placeholder for game hero
  const GAME_HERO_PLACEHOLDER = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAFX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwAB//2Q==";

  // Fetch tournaments of this game
  let tournaments: any[] = [];
  try {
    tournaments = await prisma.tournament.findMany({
      where: {
        game: game.gameKey,
        visibility: true,
      },
      orderBy: { startDate: "asc" },
      take: 10,
      select: {
        id: true,
        title: true,
        description: true,
        banner: true,
        entryFee: true,
        prizePool: true,
        currency: true,
        maxPlayers: true,
        startDate: true,
        type: true,
        status: true,
        mode: true,
        minSquadMembers: true,
        maxSquadMembers: true,
        _count: {
          select: { registrations: true }
        }
      }
    });
  } catch (err) {
    console.error("Failed to fetch tournaments for game hub:", err);
  }

  // Fetch open duels for this game
  let openDuels: any[] = [];
  try {
    openDuels = await prisma.duel.findMany({
      where: {
        game: game.gameKey,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        creator: {
          select: { id: true, name: true, username: true, image: true, elo: true },
        },
        opponent: {
          select: { id: true, name: true, username: true, image: true, elo: true },
        },
      },
    });
  } catch (err) {
    console.error("Failed to fetch duels for game hub:", err);
  }

  // Fetch top players
  let topPlayers: any[] = [];
  try {
    topPlayers = await prisma.user.findMany({
      where: {
        registrations: {
          some: {
            tournament: {
              game: game.gameKey
            }
          }
        }
      },
      orderBy: { elo: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        username: true,
        elo: true,
        wins: true,
        losses: true,
        image: true
      }
    });

    if (topPlayers.length === 0) {
      topPlayers = await prisma.user.findMany({
        orderBy: { elo: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          username: true,
          elo: true,
          wins: true,
          losses: true,
          image: true
        }
      });
    }
  } catch (err) {
    console.error("Failed to fetch top users for game hub:", err);
  }

  const activeTournaments = tournaments.filter(t => t.status === "ONGOING" || t.status === "REGISTRATION_OPEN");
  const upcomingTournaments = tournaments.filter(t => t.status === "UPCOMING");
  const completedTournaments = tournaments.filter(t => t.status === "COMPLETED");
  const otherGamesList = Object.values(GAMES_DATA).filter(g => g.slug !== slug).slice(0, 4);

  // Schema Markup
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${baseUrl}/games/${slug}#webpage`,
        "url": `${baseUrl}/games/${slug}`,
        "name": `${game.name} Tournaments Hub | ChampsArena`,
        "description": game.description,
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Games", "item": `${baseUrl}/games` },
            { "@type": "ListItem", "position": 3, "name": game.name, "item": `${baseUrl}/games/${slug}` }
          ]
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${baseUrl}/games/${slug}#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": `How do I join ${game.name} tournaments on ChampsArena?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `To join upcoming ${game.name} tournaments, create an account, search the ${game.name} tournaments list, click 'Register Now', fill in your roster details (if squad game), and complete entry fee checkout.`
            }
          },
          {
            "@type": "Question",
            "name": `Can I challenge other ${game.name} players to a duel?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Yes! Use the Duels tab on the ${game.name} hub to issue open challenges or target specific opponents for 1v1 matches. Results are manually reported and ELO is updated automatically.`
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />
      <main className="max-w-container-max mx-auto px-md py-xl min-h-screen text-left">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-md select-none text-xs font-bold uppercase text-primary/60">
          <ol className="flex items-center gap-xs list-none p-0 m-0">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/games" className="hover:text-primary transition-colors">Games</Link>
            </li>
            <li>/</li>
            <li aria-current="page" className="text-primary truncate">
              {game.name}
            </li>
          </ol>
        </nav>

        {/* Game Hero Header */}
        <section className="relative border-4 border-primary neo-brutalist-shadow mb-xl bg-surface-container-high overflow-hidden min-h-[320px] md:h-[450px] flex flex-col justify-end">
          <div className="absolute inset-0 z-0 grayscale contrast-125 select-none">
            <div className="w-full h-full bg-cover bg-center opacity-70">
              <Image
                src={game.bannerUrl}
                alt={`${game.name} tournament matches`}
                fill
                priority
                className="object-cover"
                quality={85}
                placeholder="blur"
                blurDataURL={GAME_HERO_PLACEHOLDER}
              />
            </div>
            <div className="absolute inset-0 bg-accent-yellow/10 mix-blend-multiply"></div>
          </div>
          <div className="relative z-10 w-full p-md md:p-xl flex flex-col md:flex-row md:items-end justify-between gap-md md:gap-xl bg-white/95 border-t-4 border-primary">
            <div className="space-y-sm text-left">
              <div className="flex items-center gap-xs flex-wrap">
                <span className="px-sm py-1 bg-primary text-white text-label-lg font-black uppercase tracking-wider select-none">
                  {game.genre}
                </span>
                {game.supportsDuels && (
                  <span className="px-sm py-1 bg-accent-blue text-white text-[9px] font-black uppercase tracking-wider select-none border border-primary">
                    Duels
                  </span>
                )}
                {game.supportsSquad && (
                  <span className="px-sm py-1 bg-accent-yellow text-primary text-[9px] font-black uppercase tracking-wider select-none border border-primary">
                    Squad
                  </span>
                )}
              </div>
              <h1 className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase leading-none text-primary tracking-tighter select-none">
                {game.name}
              </h1>
              <p className="text-primary font-body-lg max-w-[672px] font-bold uppercase text-xs sm:text-sm">
                {game.description}
              </p>
            </div>

            <div className="flex flex-col gap-xs shrink-0 w-full md:w-auto md:min-w-[200px] select-none">
              <Link
                href={`/tournaments?game=${game.gameKey}`}
                className="text-center py-3 bg-accent-red text-white border-2 border-primary font-black uppercase text-xs hover:translate-y-[-1px] transition-all"
              >
                Browse Tournaments
              </Link>
              {game.supportsDuels && (
                <Link
                  href={`/games/${slug}?tab=duels`}
                  className="text-center py-3 bg-accent-blue text-white border-2 border-primary font-black uppercase text-xs hover:translate-y-[-1px] transition-all"
                >
                  Open Challenges
                </Link>
              )}
              <Link
                href={`/games/${slug}/leaderboards`}
                className="text-center py-3 bg-white text-primary border-2 border-primary font-black uppercase text-xs hover:bg-accent-yellow transition-all"
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        </section>

        {/* Client-side tabbed content */}
        <GameHubClient
          game={game}
          slug={slug}
          defaultTab={tab || "competitions"}
          activeTournaments={activeTournaments}
          upcomingTournaments={upcomingTournaments}
          completedTournaments={completedTournaments}
          openDuels={openDuels}
          topPlayers={topPlayers}
          otherGamesList={otherGamesList}
        />
      </main>
      <Footer />
    </>
  );
}
