import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { GAMES_DATA } from "@/data/games";

interface GameTournamentsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GameTournamentsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = GAMES_DATA[slug];

  if (!game) {
    return {
      title: "Game Tournaments Not Found | ChampsArena",
    };
  }

  const title = `${game.name} Tournaments Calendar | ChampsArena`;
  const description = `Find and register for all upcoming ${game.name} competitive tournaments, championships, and qualifiers on ChampsArena. View schedules and rules.`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.gg";

  return {
    title,
    description,
    keywords: [...game.keywords, `${game.slug} tournaments`, `${game.slug} registration`, `${game.slug} cups`].join(", "),
    alternates: {
      canonical: `${baseUrl}/games/${slug}/tournaments`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/games/${slug}/tournaments`,
      type: "website",
      images: [
        {
          url: game.bannerUrl,
          width: 1200,
          height: 630,
          alt: `${game.name} Tournaments`,
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

export default async function GameTournamentsPage({ params }: GameTournamentsPageProps) {
  const { slug } = await params;
  const game = GAMES_DATA[slug];

  if (!game) {
    notFound();
  }

  // Fetch all tournaments for this game from the database
  let tournaments: any[] = [];
  try {
    tournaments = await prisma.tournament.findMany({
      where: {
        game: game.gameKey,
        visibility: true,
      },
      orderBy: { startDate: "desc" },
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
    console.error("Failed to fetch tournaments for game page:", err);
  }

  const active = tournaments.filter(t => t.status === "ONGOING" || t.status === "REGISTRATION_OPEN");
  const upcoming = tournaments.filter(t => t.status === "UPCOMING");
  const completed = tournaments.filter(t => t.status === "COMPLETED");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.gg";

  // ItemList / CollectionPage schema for SEO listing
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${game.name} Tournaments Calendar | ChampsArena`,
    "description": `Upcoming, ongoing, and completed esports tournaments for ${game.name}.`,
    "url": `${baseUrl}/games/${slug}/tournaments`,
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
          "name": "Tournaments",
          "item": `${baseUrl}/games/${slug}/tournaments`
        }
      ]
    }
  };

  const BANNER_FALLBACK = "https://lh3.googleusercontent.com/aida-public/AB6AXuDhtk607KBiCbdQvybjgNZ2gNKkzoM2lsIgp4bwuQ6j2UJ_en9Kj8obXtAyG_ZEBIwnSwpXB7S3cWooSmS3-cUBEXUCtrPjKRhZRNr6JN4lqbvsPtt8HdWD2xpjbso2Tv_6FJErMKA8IYo7OkrU7z9Id5UjxdTUKhsF2KvkmXBNPSL4i1Q8SGSsfLk0UO8cMZTPSPVzvms3kNDx4P2ez_2Kz9kghCmoQIjx_HXKVa2AcbynL8Bxm7xKmghwQBi7J4k2x1uvHD-D9Yw";

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
            <li>
              <Link href={`/games/${slug}`} className="hover:text-primary transition-colors">{game.name}</Link>
            </li>
            <li>/</li>
            <li aria-current="page" className="text-primary">
              Tournaments
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-xl border-b-4 border-primary pb-md select-none">
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-[0.9] tracking-tighter mb-md text-primary">
            {game.name} Tournaments
          </h1>
          <p className="text-lg font-medium border-l-8 border-accent-red pl-md max-w-[640px] text-primary">
            Browse and register for the current, upcoming, and past tournament series for {game.name}.
          </p>
        </header>

        {/* Tournaments Grid */}
        <section className="space-y-xl">
          {/* Active and Upcoming */}
          <div>
            <h2 className="text-2xl font-black uppercase text-primary mb-md select-none">
              Open Registration & Ongoing
            </h2>
            {active.length === 0 && upcoming.length === 0 ? (
              <div className="text-center py-16 border-4 border-dashed border-primary bg-white">
                <span className="material-symbols-outlined text-6xl text-primary/30 select-none">sports_esports</span>
                <p className="font-black uppercase text-xs text-primary/50 mt-sm">No upcoming tournaments scheduled yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {[...active, ...upcoming].map((t) => {
                  const used = t._count?.registrations ?? 0;
                  const currencySymbol = t.currency === "INR" ? "₹" : "$";
                  return (
                    <article key={t.id} className="bg-white border-4 border-primary neo-brutalist-shadow-hover transition-all flex flex-col justify-between">
                      <div className="relative h-40 border-b-4 border-primary bg-surface-dim overflow-hidden select-none">
                        <Image
                          src={t.banner || BANNER_FALLBACK}
                          alt={t.title}
                          fill
                          className="object-cover grayscale contrast-125"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <span className="absolute top-sm right-sm bg-accent-red text-white px-2 py-0.5 font-black uppercase text-[10px]">
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="p-md flex-grow flex flex-col justify-between">
                        <div>
                          <h3 className="font-black text-xl uppercase tracking-tight text-primary line-clamp-1 mb-sm">
                            {t.title}
                          </h3>
                          <div className="space-y-xs font-bold text-xs text-primary/80 uppercase">
                            <p>📅 {new Date(t.startDate).toLocaleDateString()}</p>
                            <p>🏆 {currencySymbol}{t.prizePool.toLocaleString()} Prize Pool</p>
                            <p>👥 {t.maxPlayers - used} Slots Open</p>
                          </div>
                        </div>
                        <Link 
                          href={`/tournaments/${t.id}`}
                          className="w-full text-center mt-md py-2 bg-accent-yellow border-2 border-primary text-primary font-black uppercase text-xs hover:translate-y-[-1px] transition-all block select-none"
                        >
                          Join Tournament
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-2xl font-black uppercase text-primary mb-md select-none">
                Completed Tournaments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {completed.map((t) => {
                  const currencySymbol = t.currency === "INR" ? "₹" : "$";
                  return (
                    <article key={t.id} className="bg-surface-container border-4 border-primary flex flex-col justify-between">
                      <div className="p-md flex-grow flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-black text-primary/40 uppercase block mb-xs">Completed</span>
                          <h3 className="font-black text-lg uppercase text-primary line-clamp-1 mb-sm">
                            {t.title}
                          </h3>
                          <div className="space-y-xs font-bold text-[10px] text-primary/70 uppercase">
                            <p>📅 Ended {new Date(t.startDate).toLocaleDateString()}</p>
                            <p>🏆 {currencySymbol}{t.prizePool.toLocaleString()} Prize Pool</p>
                          </div>
                        </div>
                        <Link 
                          href={`/tournaments/${t.id}`}
                          className="w-full text-center mt-md py-2 border-2 border-primary bg-white hover:bg-surface-container text-primary font-black uppercase text-xs transition-all block select-none"
                        >
                          View Results
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
