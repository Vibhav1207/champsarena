import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { GAMES_DATA } from "@/data/games";

interface GamePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = GAMES_DATA[slug];

  if (!game) {
    return {
      title: "Game Hub Not Found | ChampsArena",
    };
  }

  const title = `${game.name} Tournaments | Register & Compete | ChampsArena`;
  const description = `Join upcoming ${game.name} tournaments on ChampsArena. Register, compete, track standings, earn rewards and become a champion.`;
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

export default async function GameHubPage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = GAMES_DATA[slug];

  if (!game) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

  // Fetch tournaments of this game
  let tournaments: any[] = [];
  try {
    tournaments = await prisma.tournament.findMany({
      where: {
        game: game.gameKey,
        visibility: true,
      },
      orderBy: { startDate: "asc" },
      take: 6,
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
        _count: {
          select: { registrations: true }
        }
      }
    });
  } catch (err) {
    console.error("Failed to fetch tournaments for game hub:", err);
  }

  // Fetch top players by global ELO who registered for tournaments of this game, or simply top users
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
        image: true,
        homeRegion: true
      }
    });

    // Fallback to overall top users if no users registered specifically for this game
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
          image: true,
          homeRegion: true
        }
      });
    }
  } catch (err) {
    console.error("Failed to fetch top users for game hub:", err);
  }

  const activeTournaments = tournaments.filter(t => t.status === "ONGOING" || t.status === "REGISTRATION_OPEN");
  const upcomingTournaments = tournaments.filter(t => t.status === "UPCOMING");
  const completedTournaments = tournaments.filter(t => t.status === "COMPLETED");

  // Schema Markup (CollectionPage + FAQPage)
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
            }
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
            "name": `Is there an ELO ranking system for ${game.name}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Yes! ChampsArena features a custom ELO rating system. Winning matches in official tournaments increases your ELO rating and positions you higher on the global leaderboard, while losing matches decreases your rating.`
            }
          },
          {
            "@type": "Question",
            "name": `What are the prize pools for ${game.name} tournaments?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Prize pools vary by tournament, ranging from free community cups with accolades and badges to premium sponsored tournaments with real cash payouts in USD or INR.`
            }
          }
        ]
      }
    ]
  };

  const otherGamesList = Object.values(GAMES_DATA).filter(g => g.slug !== slug).slice(0, 4);

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
              />
            </div>
            <div className="absolute inset-0 bg-accent-yellow/10 mix-blend-multiply"></div>
          </div>
          <div className="relative z-10 w-full p-md md:p-xl flex flex-col md:flex-row md:items-end justify-between gap-md md:gap-xl bg-white/95 border-t-4 border-primary">
            <div className="space-y-sm text-left">
              <span className="px-sm py-1 bg-primary text-white text-label-lg font-black uppercase tracking-wider select-none">
                {game.genre}
              </span>
              <h1 className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase leading-none text-primary tracking-tighter select-none">
                {game.name} Tournaments
              </h1>
              <p className="text-primary font-body-lg max-w-[672px] font-bold uppercase text-xs sm:text-sm">
                {game.description}
              </p>
            </div>

            <div className="flex flex-col gap-xs shrink-0 w-full md:w-auto md:min-w-[200px] select-none">
              <Link
                href={`/games/${slug}/tournaments`}
                className="text-center py-3 bg-accent-red text-white border-2 border-primary font-black uppercase text-xs hover:translate-y-[-1px] transition-all"
              >
                Browse Tournaments
              </Link>
              <Link
                href={`/games/${slug}/leaderboards`}
                className="text-center py-3 bg-white text-primary border-2 border-primary font-black uppercase text-xs hover:bg-accent-yellow transition-all"
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        </section>

        {/* Content Layout */}
        <div className="grid grid-cols-12 gap-md lg:gap-xl">
          {/* Tournaments List Column */}
          <div className="col-span-12 lg:col-span-8 space-y-xl">
            {/* Active and Upcoming */}
            <div className="bg-white p-md md:p-xl border-4 border-primary neo-brutalist-shadow text-left">
              <h2 className="font-headline-lg uppercase mb-xl border-b-8 border-primary inline-block select-none">
                Upcoming & Live Tournaments
              </h2>

              <div className="space-y-md mt-xl">
                {activeTournaments.length === 0 && upcomingTournaments.length === 0 ? (
                  <div className="text-center py-12 border-4 border-dashed border-primary">
                    <span className="material-symbols-outlined text-5xl text-primary/30 select-none">emoji_events</span>
                    <p className="font-black uppercase text-xs text-primary/60 mt-sm">No active or upcoming tournaments</p>
                  </div>
                ) : (
                  [...activeTournaments, ...upcomingTournaments].map((t) => {
                    const currencySymbol = t.currency === "INR" ? "₹" : "$";
                    return (
                      <article key={t.id} className="border-4 border-primary p-md hover:bg-surface-container transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
                        <div>
                          <div className="flex items-center gap-xs mb-xs select-none">
                            <span className={`px-sm py-0.5 border border-primary text-[9px] font-black uppercase ${t.status === "REGISTRATION_OPEN" ? "bg-accent-red text-white" : "bg-white text-primary"
                              }`}>
                              {t.status.replace("_", " ")}
                            </span>
                            <span className="text-[10px] font-bold text-primary/60">
                              {new Date(t.startDate).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-xl font-black uppercase text-primary tracking-tight leading-tight">
                            {t.title}
                          </h3>
                          <p className="text-xs text-primary/70 line-clamp-2 mt-xs max-w-[500px]">
                            {t.description || "The premier tournament event on ChampsArena."}
                          </p>
                        </div>
                        <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-xs shrink-0 select-none">
                          <div className="text-left sm:text-right">
                            <p className="text-[9px] font-black text-primary/50 uppercase">Prize Pool</p>
                            <p className="text-lg font-black text-accent-red leading-none">{currencySymbol}{t.prizePool.toLocaleString()}</p>
                          </div>
                          <Link
                            href={`/tournaments/${t.id}`}
                            className="bg-accent-yellow text-primary border-2 border-primary px-md py-2 font-black uppercase text-[10px] hover:translate-y-[-1px] transition-all"
                          >
                            Join Arena
                          </Link>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>

            {/* Completed Tournaments */}
            {completedTournaments.length > 0 && (
              <div className="bg-white p-md md:p-xl border-4 border-primary neo-brutalist-shadow text-left">
                <h2 className="font-headline-md uppercase mb-lg select-none">
                  Past Champions & Results
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {completedTournaments.map((t) => (
                    <div key={t.id} className="border-2 border-primary p-sm bg-surface-container-high flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-primary/50 uppercase block mb-xs">Completed Event</span>
                        <h3 className="font-black text-base uppercase text-primary line-clamp-1">{t.title}</h3>
                      </div>
                      <Link
                        href={`/tournaments/${t.id}`}
                        className="mt-md text-xs font-black uppercase text-accent-blue hover:underline inline-block select-none"
                      >
                        View Bracket Tree →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Column */}
          <aside className="col-span-12 lg:col-span-4 space-y-xl">
            {/* Top Players Overall */}
            <div className="bg-white p-md md:p-xl border-4 border-primary neo-brutalist-shadow text-left">
              <h2 className="font-headline-md uppercase mb-xl border-b-4 border-primary select-none">
                Top Contenders
              </h2>
              <div className="space-y-sm">
                {topPlayers.length === 0 ? (
                  <p className="text-sm font-bold uppercase text-primary/50 text-center py-6">No ranked players yet</p>
                ) : (
                  topPlayers.map((player, idx) => (
                    <Link
                      href={`/players/${player.username || player.id}`}
                      key={player.id}
                      className="flex items-center justify-between border-2 border-primary p-xs hover:bg-accent-yellow transition-all"
                    >
                      <div className="flex items-center gap-sm">
                        <span className="font-black text-lg italic text-primary w-6 select-none">#0{idx + 1}</span>
                        <div className="w-8 h-8 border border-primary relative bg-accent-blue shrink-0 overflow-hidden select-none">
                          {player.image ? (
                            <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-xs text-white">
                              {(player.name || "P").charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="font-black text-sm uppercase text-primary truncate max-w-[120px]">
                          {player.name || "Trainer"}
                        </span>
                      </div>
                      <span className="font-black text-base italic text-primary">{player.elo} ELO</span>
                    </Link>
                  ))
                )}
              </div>
              <Link
                href={`/games/${slug}/leaderboards`}
                className="w-full block text-center mt-md py-2 border-2 border-primary text-primary font-black uppercase text-xs hover:bg-primary hover:text-white transition-all select-none"
              >
                Full Leaderboard
              </Link>
            </div>

            {/* Related Games Cross Linking */}
            <div className="bg-accent-yellow p-md border-4 border-primary select-none text-left">
              <h3 className="font-headline-sm uppercase mb-md">
                Other Esports Arenas
              </h3>
              <div className="grid grid-cols-2 gap-xs">
                {otherGamesList.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/games/${g.slug}`}
                    className="p-sm bg-white border-2 border-primary hover:bg-primary hover:text-white transition-all text-center font-black uppercase text-[10px]"
                  >
                    {g.name.split(" ")[0]}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
