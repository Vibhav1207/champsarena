import { MetadataRoute } from "next";
import { GAMES_DATA } from "@/data/games";
import blogPosts from "@/data/blog.json";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.gg";

  // Fetch all tournaments to include in the sitemap
  let tournaments: any[] = [];
  let players: any[] = [];
  
  try {
    const { prisma } = await import("@/lib/db");
    
    tournaments = await prisma.tournament.findMany({
      where: { visibility: true },
      select: { id: true, updatedAt: true },
    });

    players = await prisma.user.findMany({
      where: {
        username: {
          not: null
        }
      },
      select: { username: true, updatedAt: true },
      take: 200 // Cap to prevent sitemap bloat, but index active players
    });
  } catch (err) {
    console.error("Failed to fetch data for sitemap:", err);
  }

  // Tournaments URLs
  const tournamentUrls = tournaments.map((t) => ({
    url: `${baseUrl}/tournaments/${t.id}`,
    lastModified: t.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Players URLs
  const playerUrls = players.map((p) => ({
    url: `${baseUrl}/players/${p.username}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Games URLs
  const gameSlugs = Object.keys(GAMES_DATA);
  const gameUrls: any[] = [];
  gameSlugs.forEach((slug) => {
    gameUrls.push({
      url: `${baseUrl}/games/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    });
    gameUrls.push({
      url: `${baseUrl}/games/${slug}/tournaments`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    });
    gameUrls.push({
      url: `${baseUrl}/games/${slug}/leaderboards`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    });
  });

  // Blog URLs
  const blogUrls = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/games`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tournaments`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaderboards`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/rankings`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/rules`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  return [
    ...staticUrls,
    ...gameUrls,
    ...tournamentUrls,
    ...playerUrls,
    ...blogUrls,
  ];
}
