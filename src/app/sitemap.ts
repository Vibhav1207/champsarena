import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.gg";

  // Fetch all tournaments to include in the sitemap
  let tournaments: any[] = [];
  try {
    const { prisma } = await import("@/lib/db");
    tournaments = await prisma.tournament.findMany({
      where: { visibility: true },
      select: { id: true, updatedAt: true },
    });
  } catch (err) {
    console.error("Failed to fetch tournaments for sitemap:", err);
  }

  const tournamentUrls = tournaments.map((t) => ({
    url: `${baseUrl}/tournaments/${t.id}`,
    lastModified: t.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tournaments`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rankings`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/brackets`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.8,
    },
    ...tournamentUrls,
  ];
}
