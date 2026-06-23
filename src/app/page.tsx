import React from "react";
import HomeClient from "@/components/HomeClient";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChampsArena | Gaming Tournaments, Esports Competitions & Championships",
  description: "Join competitive gaming tournaments across Pokémon, Free Fire, BGMI, Valorant and more. Register for tournaments, compete against top players, climb leaderboards, and become a champion on ChampsArena.",
  keywords: "gaming tournaments, esports tournaments, pokemon tournaments, free fire tournaments, online tournaments, esports competitions, gaming championships, competitive gaming, tournament platform, online gaming competitions, gaming events, skill based tournaments",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.gg"
  }
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.gg";

  // Fetch Announcements on the Server
  let announcement = null;
  try {
    announcement = await prisma.announcement.findFirst({
      where: { published: true },
      orderBy: [
        { pinned: "desc" },
        { createdAt: "desc" }
      ]
    });
  } catch (err) {
    console.error("Failed to fetch announcement on server:", err);
  }

  // Fetch upcoming events
  let upcomingEvents: any[] = [];
  try {
    upcomingEvents = await prisma.tournament.findMany({
      where: {
        visibility: true,
        status: { in: ["REGISTRATION_OPEN", "UPCOMING", "ONGOING"] }
      },
      orderBy: { startDate: "asc" },
      take: 3,
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
    console.error("Failed to fetch tournaments on server:", err);
  }

  // Fetch top players & winners ticker
  let topPlayers: any[] = [];
  let winners: string[] = [];
  try {
    const allUsers = await prisma.user.findMany({
      orderBy: { elo: "desc" },
      select: { id: true, name: true, elo: true, wins: true, losses: true, image: true, homeRegion: true }
    });
    
    topPlayers = allUsers.slice(0, 3);
    winners = [...allUsers]
      .filter(u => u.wins > 0)
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 6)
      .map(u => `${u.name || "Trainer"} (${u.wins} wins)`);
  } catch (err) {
    console.error("Failed to fetch users on server:", err);
  }

  // JSON-LD Schema definitions
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "ChampsArena",
        "url": baseUrl,
        "logo": `${baseUrl}/logo.png`,
        "sameAs": [
          "https://twitter.com/champsarena",
          "https://discord.gg/champsarena"
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "ChampsArena",
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${baseUrl}/tournaments?search={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <>
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
        announcement={announcement ? {
          ...announcement,
          createdAt: announcement.createdAt.toISOString()
        } : null}
        upcomingEvents={upcomingEvents.map(e => ({
          ...e,
          startDate: e.startDate.toISOString()
        }))}
        topPlayers={topPlayers}
        winners={winners}
      />
    </>
  );
}
