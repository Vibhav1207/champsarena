import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { GAMES_DATA } from "@/data/games";

export const metadata: Metadata = {
  title: "Esports & Gaming Tournaments Catalog | ChampsArena",
  description: "Browse competitive gaming tournaments across Pokémon, Garena Free Fire, BGMI, Valorant, Clash Royale, Brawl Stars, EA FC, and Fortnite. Find tournaments, view rankings, and join the action.",
  keywords: "gaming tournaments, esports tournaments, competitive gaming catalog, pokémon tournaments, free fire tournaments, bgmi tournaments, valorant tournaments, clash royale tournaments",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro"}/games`
  }
};

export default function GamesCatalogPage() {
  const gamesList = Object.values(GAMES_DATA);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

  // CollectionPage JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Esports & Gaming Tournaments Catalog | ChampsArena",
    "description": "Browse competitive gaming tournaments and championships across multiple esports titles.",
    "url": `${baseUrl}/games`,
    "about": {
      "@type": "ItemList",
      "numberOfItems": gamesList.length,
      "itemListElement": gamesList.map((game, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": game.name,
        "url": `${baseUrl}/games/${game.slug}`,
        "description": game.description
      }))
    }
  };

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
            <li aria-current="page" className="text-primary">
              Games
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <header className="mb-xl border-b-4 border-primary pb-md select-none">
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tighter mb-md text-primary">
            Esports Games
          </h1>
          <p className="text-lg font-medium border-l-8 border-accent-blue pl-md max-w-[640px] text-primary">
            Select your game to view upcoming tournaments, ELO leaderboards, competitive rules, and community standing.
          </p>
        </header>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {gamesList.map((game) => {
            const isActive = game.slug === "pokemon" || game.slug === "free-fire" || game.slug === "bgmi";
            return (
              <article
                key={game.slug}
                className={`bg-white border-4 border-primary transition-all flex flex-col justify-between ${isActive ? "neo-brutalist-shadow-hover" : "opacity-75 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.3)]"
                  }`}
              >
                {/* Game Banner */}
                <div className="relative h-44 border-b-4 border-primary bg-surface-dim overflow-hidden select-none">
                  <Image
                    src={game.bannerUrl}
                    alt={`${game.name} competition banner`}
                    fill
                    className={`object-cover contrast-125 transition-transform duration-300 ${isActive ? "grayscale hover:scale-105" : "grayscale opacity-60"
                      }`}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <span className="absolute bottom-sm left-sm bg-primary text-white px-sm py-xs font-black uppercase text-xs">
                    {game.genre}
                  </span>
                  {!isActive && (
                    <span className="absolute top-sm right-sm bg-accent-red text-white border-2 border-primary px-sm py-xs font-black uppercase text-[10px] tracking-wider shadow-[2px_2px_0px_#1a1a1a]">
                      Coming Soon
                    </span>
                  )}
                </div>

                {/* Game Content */}
                <div className="p-md flex-grow flex flex-col justify-between">
                  <div className="mb-md">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-primary mb-xs">
                      {game.name}
                    </h2>
                    <p className="text-sm font-bold uppercase text-primary/60 mb-sm">
                      By {game.publisher}
                    </p>
                    <p className="text-sm text-primary font-medium line-clamp-3">
                      {game.description}
                    </p>
                  </div>

                  {/* Game Quick Navigation Actions */}
                  <div className="space-y-xs pt-xs select-none">
                    {isActive ? (
                      <>
                        <Link
                          href={`/games/${game.slug}`}
                          className="w-full text-center py-2 bg-accent-yellow border-2 border-primary text-primary font-black uppercase text-xs hover:translate-y-[-1px] transition-all block"
                        >
                          View Game Hub
                        </Link>
                        <div className="grid grid-cols-2 gap-xs">
                          <Link
                            href={`/games/${game.slug}/tournaments`}
                            className="text-center py-2 border-2 border-primary bg-white hover:bg-surface-container text-primary font-black uppercase text-[10px] block"
                          >
                            Tournaments
                          </Link>
                          <Link
                            href={`/games/${game.slug}/leaderboards`}
                            className="text-center py-2 border-2 border-primary bg-white hover:bg-surface-container text-primary font-black uppercase text-[10px] block"
                          >
                            Leaderboards
                          </Link>
                        </div>
                      </>
                    ) : (
                      <button
                        disabled
                        className="w-full text-center py-2 bg-surface-container-high border-2 border-primary/30 text-primary/40 font-black uppercase text-xs cursor-not-allowed"
                      >
                        Register Coming Soon
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
