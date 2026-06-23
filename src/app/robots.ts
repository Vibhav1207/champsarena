import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.gg";

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/games",
        "/tournaments",
        "/blog",
        "/leaderboards",
        "/players"
      ],
      disallow: [
        "/admin",
        "/dashboard",
        "/api",
        "/auth/callback",
        "/settings",
        "/profile"
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
