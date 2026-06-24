import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

interface PlayerProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PlayerProfilePageProps): Promise<Metadata> {
  const { username } = await params;

  // Find user by username or ID
  let player = null;
  try {
    player = await prisma.user.findUnique({
      where: { username },
    });
    if (!player) {
      player = await prisma.user.findUnique({
        where: { id: username },
      });
    }
  } catch (err) {
    console.error("Metadata player query error:", err);
  }

  if (!player) {
    return {
      title: "Player Profile Not Found | ChampsArena",
    };
  }

  const name = player.name || player.username || "Esports Trainer";
  const title = `${name} - Esports Player Profile | ChampsArena`;
  const description = `View the competitive gaming profile for ${name} on ChampsArena. Check ELO rating (${player.elo}), win/loss record (${player.wins}W - ${player.losses}L), region, and achievements.`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

  return {
    title,
    description,
    keywords: ["esports player", `${name} profile`, `${name} elo`, "champsarena player rankings"],
    alternates: {
      canonical: `${baseUrl}/players/${username}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/players/${username}`,
      type: "profile",
      images: [
        {
          url: player.image || `${baseUrl}/logo.png`,
          width: 500,
          height: 500,
          alt: name,
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [player.image || `${baseUrl}/logo.png`],
    },
  };
}

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const { username } = await params;

  // Query User details
  let player = await prisma.user.findUnique({
    where: { username },
    include: {
      squad: {
        select: { id: true, name: true, logo: true }
      },
      registrations: {
        where: { status: "APPROVED" },
        include: {
          tournament: {
            select: { id: true, title: true, game: true, startDate: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });

  // Fallback to query by ID
  if (!player) {
    player = await prisma.user.findUnique({
      where: { id: username },
      include: {
        squad: {
          select: { id: true, name: true, logo: true }
        },
        registrations: {
          where: { status: "APPROVED" },
          include: {
            tournament: {
              select: { id: true, title: true, game: true, startDate: true }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 5
        }
      }
    });
  }

  if (!player) {
    notFound();
  }

  // Accolades logic
  const accolades = [];
  if (player.elo >= 2500) {
    accolades.push({ title: "Grandmaster", desc: "Top tier player with 2500+ ELO", color: "bg-accent-yellow text-primary" });
  } else if (player.elo >= 1800) {
    accolades.push({ title: "Elite Fighter", desc: "Proven challenger with 1800+ ELO", color: "bg-accent-red text-white" });
  } else if (player.elo >= 1300) {
    accolades.push({ title: "Veteran Challenger", desc: "Experienced contender with 1300+ ELO", color: "bg-accent-blue text-white" });
  } else {
    accolades.push({ title: "Rising Star", desc: "Ascending through the ranks", color: "bg-primary text-white" });
  }

  if (player.wins >= 25) {
    accolades.push({ title: "Gladiator", desc: "Claimed 25+ tournament match victories", color: "bg-primary text-white" });
  }
  if (player.wins > 0 && player.losses === 0) {
    accolades.push({ title: "Undefeated", desc: "Flawless record in tournament battles", color: "bg-accent-red text-white" });
  }

  const winrate = player.wins + player.losses > 0
    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
    : 0;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";
  const name = player.name || player.username || "Esports Trainer";

  // ProfilePage JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": name,
      "username": player.username || player.id,
      "image": player.image || `${baseUrl}/logo.png`,
      "description": player.bio || `${name} competitive gaming statistics and achievements on ChampsArena.`,
      "nationality": player.country ? {
        "@type": "Country",
        "name": player.country
      } : undefined,
      "agentInteractionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": player.elo
      }
    },
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
          "name": "Players",
          "item": `${baseUrl}/leaderboards`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": name,
          "item": `${baseUrl}/players/${username}`
        }
      ]
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
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-md select-none text-xs font-bold uppercase text-primary/60">
          <ol className="flex items-center gap-xs list-none p-0 m-0">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/rankings" className="hover:text-primary transition-colors">Players</Link>
            </li>
            <li>/</li>
            <li aria-current="page" className="text-primary truncate">
              {name}
            </li>
          </ol>
        </nav>

        {/* Profile Card Layout */}
        <div className="grid grid-cols-12 gap-md lg:gap-xl">
          {/* Left Column: Avatar & Basic Info */}
          <section className="col-span-12 lg:col-span-4 bg-white border-4 border-primary neo-brutalist-shadow p-md md:p-xl flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="w-40 h-40 border-4 border-primary bg-accent-yellow relative overflow-hidden select-none mb-md shadow-[4px_4px_0px_0px_#1a1a1a]">
              {player.image ? (
                <img src={player.image} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-6xl text-primary">
                  {(player.name || "P").charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h1 className="text-3xl font-black uppercase tracking-tight text-primary leading-none mb-xs">
              {name}
            </h1>
            <p className="text-sm font-bold uppercase text-primary/60 mb-sm">
              @{player.username || player.id}
            </p>

            {/* Region / Country */}
            <div className="flex flex-wrap items-center justify-center gap-xs text-xs font-bold uppercase text-primary/70 mb-md select-none">
              {player.country && (
                <span className="px-sm py-0.5 border border-primary bg-surface-container-high">
                  🏳️ {player.country}
                </span>
              )}
            </div>

            {/* Bio */}
            <p className="text-sm text-primary font-medium mb-md max-w-[280px]">
              {player.bio || "This challenger has not written their bio yet. Form is temporary, class is permanent."}
            </p>

            {/* Social handles */}
            {player.discordUsername && (
              <div className="w-full border-t-2 border-primary pt-md text-left select-none">
                <p className="text-[10px] font-black text-primary/50 uppercase leading-none mb-1">Discord</p>
                <div className="flex items-center gap-xs font-bold uppercase text-sm text-primary">
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                  <span>{player.discordUsername}</span>
                </div>
              </div>
            )}
          </section>

          {/* Right Column: Statistics, Accolades, Match History */}
          <div className="col-span-12 lg:col-span-8 space-y-xl">
            {/* stats card */}
            <section className="bg-white p-md md:p-xl border-4 border-primary neo-brutalist-shadow">
              <h2 className="font-headline-lg uppercase mb-xl border-b-8 border-primary inline-block select-none">
                Competitive Record
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md select-none pt-sm">
                <div className="border-4 border-primary bg-accent-yellow p-md text-center shadow-[4px_4px_0px_0px_#1a1a1a]">
                  <p className="text-[10px] font-black text-primary/70 uppercase">ELO Rating</p>
                  <p className="text-4xl font-black italic mt-1 text-primary">{player.elo}</p>
                </div>
                <div className="border-4 border-primary bg-white p-md text-center shadow-[4px_4px_0px_0px_#1a1a1a]">
                  <p className="text-[10px] font-black text-primary/70 uppercase">Win / Loss</p>
                  <p className="text-4xl font-black italic mt-1 text-primary">{player.wins} - {player.losses}</p>
                </div>
                <div className="border-4 border-primary bg-accent-blue text-white p-md text-center shadow-[4px_4px_0px_0px_#1a1a1a]">
                  <p className="text-[10px] font-black text-white/80 uppercase">Win Rate</p>
                  <p className="text-4xl font-black italic mt-1">{winrate}%</p>
                </div>
              </div>
            </section>

            {/* Squad & Accolades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {/* Squad affiliation */}
              <section className="bg-white p-md border-4 border-primary neo-brutalist-shadow flex flex-col justify-between">
                <div className="text-left">
                  <h3 className="font-headline-sm uppercase mb-md select-none">Squad Affiliation</h3>
                  {player.squad ? (
                    <div className="flex items-center gap-sm mt-sm">
                      <div className="w-12 h-12 border-2 border-primary bg-accent-blue relative overflow-hidden select-none shrink-0">
                        {player.squad.logo ? (
                          <img src={player.squad.logo} alt={player.squad.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-white bg-primary">
                            {player.squad.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-lg uppercase text-primary leading-none">{player.squad.name}</h4>
                        <span className="text-[9px] font-bold text-primary/60 uppercase">Active Squad Member</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-bold uppercase text-primary/50 mt-sm">Solo agent. No squad affiliated.</p>
                  )}
                </div>
              </section>

              {/* Accolades */}
              <section className="bg-white p-md border-4 border-primary neo-brutalist-shadow text-left">
                <h3 className="font-headline-sm uppercase mb-md select-none">Player Achievements</h3>
                <div className="space-y-xs mt-sm">
                  {accolades.map((acc, idx) => (
                    <div key={idx} className="border-2 border-primary p-xs flex flex-col">
                      <span className={`px-2 py-0.5 font-black uppercase text-[10px] self-start mb-0.5 ${acc.color}`}>
                        {acc.title}
                      </span>
                      <span className="text-[10px] text-primary/70 font-medium">{acc.desc}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Recent Registrations */}
            <section className="bg-white p-md md:p-xl border-4 border-primary neo-brutalist-shadow text-left">
              <h3 className="font-headline-md uppercase mb-xl border-b-4 border-primary inline-block select-none">
                Recent Tournament Appearances
              </h3>
              <div className="space-y-xs mt-sm">
                {player.registrations.length === 0 ? (
                  <p className="text-sm font-bold uppercase text-primary/50 py-4 text-center">No tournament appearances yet</p>
                ) : (
                  player.registrations.map((reg) => (
                    <div key={reg.id} className="border-2 border-primary p-sm flex items-center justify-between hover:bg-surface-container transition-all">
                      <div>
                        <span className="text-[9px] font-black text-primary/50 uppercase leading-none">Registered Game</span>
                        <h4 className="font-black text-base uppercase text-primary leading-none mt-1">
                          {reg.tournament.title}
                        </h4>
                      </div>
                      <Link
                        href={`/tournaments/${reg.tournament.id}`}
                        className="bg-accent-yellow border-2 border-primary text-primary px-sm py-1 font-black uppercase text-[10px] hover:translate-y-[-1px] transition-all select-none"
                      >
                        Details
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
