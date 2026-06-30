import React from "react";
import HomeClient from "@/components/HomeClient";
 import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import type { Tournament } from "@prisma/client";

type UpcomingEvent = Pick<Tournament, "id" | "title" | "description" | "banner" | "entryFee" | "prizePool" | "currency" | "maxPlayers" | "startDate" | "type" | "status"> & {
  _count: { registrations: number };
};

export const metadata: Metadata = {
   title: "ChampsArena | Gaming Tournaments, Esports Competitions & Championships",
   description: "Join competitive gaming tournaments across Pokémon, Free Fire, BGMI, Valorant and more. Register for tournaments, compete against top players, climb leaderboards, and become a champion on ChampsArena.",
   keywords: "gaming tournaments, esports tournaments, pokemon tournaments, free fire tournaments, online tournaments, esports competitions, gaming championships, competitive gaming, tournament platform, online gaming competitions, gaming events, skill based tournaments",
   alternates: {
     canonical: process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro"
   }
 };

 // Enable ISR with 60-second revalidation
 export const revalidate = 60;

 export default async function Home() {
   const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

   // Fetch all data in parallel for better performance
   const [announcement, upcomingEvents, usersData] = await Promise.allSettled([
     // Fetch latest announcement
     prisma.announcement.findFirst({
       where: { published: true },
       orderBy: [
         { pinned: "desc" },
         { createdAt: "desc" }
       ],
     }),

     // Fetch upcoming events
     prisma.tournament.findMany({
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
           select: { registrations: { where: { status: "APPROVED" } } }
         }
       }
     }),

     // Fetch top players and winners
     prisma.user.findMany({
       orderBy: { elo: "desc" },
       select: { id: true, name: true, elo: true, wins: true, losses: true, image: true }
     })
   ]);

   // Handle results
   const announcementData = announcement.status === "fulfilled" ? announcement.value : null;
   const upcomingEventsData = upcomingEvents.status === "fulfilled" ? upcomingEvents.value : [];
   const usersDataResult = usersData.status === "fulfilled" ? usersData.value : [];

   // Process top players and winners
   const topPlayers = usersDataResult.slice(0, 3);
   const winners = [...usersDataResult]
     .filter(u => u.wins > 0)
     .sort((a, b) => b.wins - a.wins)
     .slice(0, 6)
     .map(u => `${u.name || "Trainer"} (${u.wins} wins)`);

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
      {/* Preload hero image */}
      <link
        rel="preload"
        as="image"
        href="https://lh3.googleusercontent.com/aida-public/AB6AXuCIKxLGbKi9AFU6kDvRhPMdZ_gJBwFV86yr70Mjr49MK56QHhQOlrhO2_x-ozbLR-DOiT5jF7wbElOr20jF4xJJ_DQ2DSALh6jUWg3q__3vUjLdahhrdMY_QfxaittO9lpwpkfWAzwjtS-JWvZf9rtIwIadQe0B6pkiSERH_S1-EDIzPvkIFFVg-uF8aRtUFsgjWk0pa4sdBSZs0bl1CF12eAmRjfoAmNxNaYNtLuvMP7JmW8R2x25zkhTuniFtQrSEkk7ycr74JTo"
      />
      <HomeClient
        announcement={announcementData ? {
          ...announcementData,
          createdAt: announcementData.createdAt.toISOString()
        } : null}
        upcomingEvents={upcomingEventsData.map((e: UpcomingEvent) => ({
          ...e,
          startDate: e.startDate.toISOString()
        }))}
        topPlayers={topPlayers}
        winners={winners}
      />
    </>
  );
}