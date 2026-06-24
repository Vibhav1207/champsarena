import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { GAMES_DATA } from "@/data/games";

interface GameLeaderboardsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GameLeaderboardsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = GAMES_DATA[slug];

  if (!game) {
    return {
      title: "Game Leaderboard Not Found | ChampsArena",
    };
  }

  const title = `${game.name} Leaderboard & Standings | ChampsArena`;
  const description = `View official player standings, ELO rankings, and win rates for ${game.name} on ChampsArena. Climb the ladder and check top contenders.`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

  return {
    title,
    description,
    keywords: [...game.keywords, `${game.slug} leaderboard`, `${game.slug} rankings`, `${game.slug} top players`].join(", "),
    alternates: {
      canonical: `${baseUrl}/games/${slug}/leaderboards`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/games/${slug}/leaderboards`,
      type: "website",
      images: [
        {
          url: game.bannerUrl,
          width: 1200,
          height: 630,
          alt: `${game.name} Leaderboards`,
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

export default async function GameLeaderboardsPage({ params }: GameLeaderboardsPageProps) {
  const { slug } = await params;
  const game = GAMES_DATA[slug];

  if (!game) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";
  const isFreeFire = game.gameKey === "FREE_FIRE";

  // Schema Markup (CollectionPage)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${game.name} Leaderboard | ChampsArena`,
    "description": `Competitive leaderboard and player rankings for ${game.name}.`,
    "url": `${baseUrl}/games/${slug}/leaderboards`,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Games",
          "item": `${baseUrl}/games`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": game.name,
          "item": `${baseUrl}/games/${slug}`
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Leaderboard",
          "item": `${baseUrl}/games/${slug}/leaderboards`
        }
      ]
    }
  };

  // Fetch Rankings Data
  let trainersList: any[] = [];
  let squadsList: any[] = [];

  if (isFreeFire) {
    try {
      const squads = await prisma.squad.findMany({
        include: {
          members: {
            select: { id: true, elo: true, wins: true, losses: true },
          },
        },
      });

      const matches = await prisma.match.findMany({
        where: { status: "COMPLETED" },
        select: { s1Id: true, s2Id: true, winnerSquadId: true },
      });

      squadsList = squads.map(s => {
        const squadMatches = matches.filter(m => m.s1Id === s.id || m.s2Id === s.id);
        const wins = squadMatches.filter(m => m.winnerSquadId === s.id).length;
        const losses = squadMatches.length - wins;

        const averageElo = s.members.length > 0
          ? Math.round(s.members.reduce((acc, m) => acc + m.elo, 0) / s.members.length)
          : 1000;

        const points = wins * 3;

        return {
          id: s.id,
          name: s.name,
          logo: s.logo,
          membersCount: s.members.length,
          wins,
          losses,
          elo: averageElo,
          points,
        };
      });

      // Sort by points (highest first), then ELO
      squadsList.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.elo - a.elo;
      });
    } catch (err) {
      console.error("Failed to load Free Fire squads rankings:", err);
    }
  } else {
    try {
      trainersList = await prisma.user.findMany({
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

      // Fallback if no trainers registered for tournaments of this game specifically
      if (trainersList.length === 0) {
        trainersList = await prisma.user.findMany({
          orderBy: { elo: "desc" },
          take: 50,
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
      console.error("Failed to fetch game trainers list:", err);
    }
  }

  function getTierLabel(elo: number) {
    if (elo >= 2800) return "Champion";
    if (elo >= 2500) return "Elite Four";
    if (elo >= 2000) return "Veteran";
    if (elo >= 1500) return "Ace";
    if (elo >= 1000) return "Trainer";
    return "Rookie";
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navigation />
      <main className="max-w-container-max mx-auto px-md py-xl min-h-screen text-left">
        {/* Breadcrumbs */}
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
            <li>
              <Link href={`/games/${slug}`} className="hover:text-primary transition-colors">{game.name}</Link>
            </li>
            <li>/</li>
            <li aria-current="page" className="text-primary">
              Leaderboard
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-xl border-b-4 border-primary pb-md select-none">
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-[0.9] tracking-tighter mb-md text-primary">
            {game.name} Leaderboard
          </h1>
          <p className="text-lg font-medium border-l-8 border-accent-blue pl-md max-w-[640px] text-primary">
            Official ranking board of {isFreeFire ? "squads" : "trainers"} competing in {game.name}.
          </p>
        </header>

        {/* Leaderboard Table */}
        <div className="bg-white border-4 border-primary neo-brutalist-shadow overflow-hidden mb-xl">
          <div className="overflow-x-auto">
            {isFreeFire ? (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-primary text-white uppercase text-xs font-black tracking-widest select-none border-b-2 border-primary">
                    <th className="px-lg py-4 border-r-2 border-white/20">Rank</th>
                    <th className="px-lg py-4 border-r-2 border-white/20">Squad Name</th>
                    <th className="px-lg py-4 border-r-2 border-white/20 text-center">Roster Size</th>
                    <th className="px-lg py-4 border-r-2 border-white/20">Avg ELO</th>
                    <th className="px-lg py-4 border-r-2 border-white/20">Record</th>
                    <th className="px-lg py-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y-4 divide-primary bg-white">
                  {squadsList.length > 0 ? (
                    squadsList.map((s, idx) => {
                      const rankNum = idx + 1;
                      const formattedRank = rankNum < 10 ? `#0${rankNum}` : `#${rankNum}`;
                      const totalMatches = s.wins + s.losses;
                      const wr = totalMatches > 0 ? Math.round((s.wins / totalMatches) * 100) : 0;
                      return (
                        <tr key={s.id} className="hover:bg-surface-container transition-colors border-b-4 border-primary">
                          <td className="px-lg py-md font-black text-3xl italic text-primary select-none w-24">
                            {formattedRank}
                          </td>
                          <td className="px-lg py-md">
                            <div className="flex items-center gap-sm">
                              <div className="w-10 h-10 border-2 border-primary relative bg-accent-blue shrink-0 overflow-hidden select-none">
                                {s.logo ? (
                                  <img src={s.logo} alt={s.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-black text-white bg-primary">
                                    {s.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span className="font-black text-lg uppercase text-primary leading-none">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-lg py-md text-center font-bold text-primary w-32 select-none">
                            {s.membersCount} Players
                          </td>
                          <td className="px-lg py-md font-black text-xl italic text-primary select-none w-32">
                            {s.elo}
                          </td>
                          <td className="px-lg py-md w-40">
                            <div className="flex flex-col">
                              <span className="font-black text-primary text-sm">{wr}% WR</span>
                              <span className="text-[10px] font-bold text-primary/60 mt-0.5">{s.wins}W / {s.losses}L</span>
                            </div>
                          </td>
                          <td className="px-lg py-md text-right font-black text-3xl italic text-accent-red select-none w-32">
                            {s.points}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-primary/60 font-black uppercase italic">
                        No squads registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-primary text-white uppercase text-xs font-black tracking-widest select-none border-b-2 border-primary">
                    <th className="px-lg py-4 border-r-2 border-white/20">Rank</th>
                    <th className="px-lg py-4 border-r-2 border-white/20">Trainer</th>
                    <th className="px-lg py-4 border-r-2 border-white/20 text-center">Tier</th>
                    <th className="px-lg py-4 border-r-2 border-white/20">ELO Rating</th>
                    <th className="px-lg py-4 border-r-2 border-white/20">Win/Loss</th>
                    <th className="px-lg py-4 text-right">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y-4 divide-primary bg-white">
                  {trainersList.length > 0 ? (
                    trainersList.map((p, idx) => {
                      const rankNum = idx + 1;
                      const formattedRank = rankNum < 10 ? `#0${rankNum}` : `#${rankNum}`;
                      const total = p.wins + p.losses;
                      const wr = total > 0 ? Math.round((p.wins / total) * 100) : 0;
                      return (
                        <tr key={p.id} className="hover:bg-surface-container transition-colors border-b-4 border-primary">
                          <td className="px-lg py-md font-black text-3xl italic text-primary select-none w-24">
                            {formattedRank}
                          </td>
                          <td className="px-lg py-md">
                            <div className="flex items-center gap-sm">
                              <div className="w-10 h-10 border-2 border-primary relative bg-accent-yellow shrink-0 overflow-hidden select-none">
                                {p.image ? (
                                  <img src={p.image} alt={p.name || "Trainer"} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-black text-primary">
                                    {(p.name || "P").charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <Link
                                href={`/players/${p.username || p.id}`}
                                className="font-black text-lg uppercase text-primary leading-none hover:underline"
                              >
                                {p.name || "Trainer"}
                              </Link>
                            </div>
                          </td>
                          <td className="px-lg py-md text-center font-black text-xs uppercase text-primary/70 w-32 select-none">
                            <span className="px-2 py-0.5 border border-primary bg-accent-yellow/20">
                              {getTierLabel(p.elo)}
                            </span>
                          </td>
                          <td className="px-lg py-md font-black text-xl italic text-primary select-none w-32">
                            {p.elo}
                          </td>
                          <td className="px-lg py-md font-bold text-sm text-primary/70 w-32 select-none">
                            {p.wins}W - {p.losses}L
                          </td>
                          <td className="px-lg py-md text-right font-black text-3xl italic text-accent-red select-none w-32">
                            {wr}%
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-primary/60 font-black uppercase italic">
                        No ranked trainers.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
