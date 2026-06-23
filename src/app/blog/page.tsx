import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import blogPosts from "@/data/blog.json";

export const metadata: Metadata = {
  title: "Esports News, Guides & Tournament Strategy | ChampsArena Blog",
  description: "Stay ahead of the competition with esports news, Pokémon VGC/TCG tournament guides, Garena Free Fire squad tactics, BGMI strategies, and tournament announcements on ChampsArena.",
  keywords: "esports news, tournament guides, pokémon guides, free fire strategies, bgmi drop tactics, competitive gaming strategy",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.gg"}/blog`
  }
};

const CATEGORIES = [
  "All Guides",
  "Pokemon Tournament Guides",
  "Pokemon TCG Guides",
  "Pokemon VGC Guides",
  "Free Fire Guides",
  "BGMI Guides",
  "Valorant Guides",
  "Esports News",
  "Tournament Strategy",
  "Tournament Announcements"
];

export default function BlogIndexPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.gg";

  // CollectionPage JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Esports News, Tournament Guides & Strategies | ChampsArena Blog",
    "description": "Browse competitive strategy guides and esports news on ChampsArena.",
    "url": `${baseUrl}/blog`,
    "about": {
      "@type": "ItemList",
      "numberOfItems": blogPosts.length,
      "itemListElement": blogPosts.map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": post.title,
        "url": `${baseUrl}/blog/${post.slug}`,
        "description": post.excerpt
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
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-md select-none text-xs font-bold uppercase text-primary/60">
          <ol className="flex items-center gap-xs list-none p-0 m-0">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li aria-current="page" className="text-primary">
              Blog
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-xl border-b-4 border-primary pb-md select-none">
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tighter mb-md text-primary">
            Esports Blog
          </h1>
          <p className="text-lg font-medium border-l-8 border-accent-blue pl-md max-w-[640px] text-primary">
            Master the competitive meta, study rotation routes, check player rankings, and keep up with news announcements.
          </p>
        </header>

        <div className="grid grid-cols-12 gap-md lg:gap-xl">
          {/* Categories Sidebar */}
          <aside className="col-span-12 lg:col-span-3 select-none">
            <div className="bg-white p-md border-4 border-primary neo-brutalist-shadow-sm sticky top-[120px]">
              <h2 className="font-headline-sm uppercase mb-md border-b-2 border-primary pb-xs">Categories</h2>
              <ul className="space-y-xs list-none p-0 m-0 text-left">
                {CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <button
                      type="button"
                      className="w-full text-left font-black uppercase text-[10px] py-xs hover:text-accent-red hover:translate-x-[2px] transition-all"
                    >
                      • {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Blog Cards Grid */}
          <section className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-md">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="bg-white border-4 border-primary neo-brutalist-shadow-hover transition-all flex flex-col justify-between"
              >
                {/* Visual Cover placeholder */}
                <div className="relative h-48 bg-primary/10 border-b-4 border-primary overflow-hidden flex items-center justify-center select-none text-primary font-black uppercase text-center p-md">
                  <span className="material-symbols-outlined text-5xl absolute opacity-20">article</span>
                  <p className="text-xl tracking-tight leading-none z-10">{post.title}</p>
                  <span className="absolute bottom-xs left-xs bg-accent-yellow border border-primary px-xs py-0.5 font-bold uppercase text-[9px]">
                    {post.category}
                  </span>
                </div>

                {/* Excerpt Content */}
                <div className="p-md flex-grow flex flex-col justify-between text-left">
                  <div className="mb-md">
                    <div className="flex items-center gap-xs text-[10px] font-bold text-primary/60 uppercase mb-xs select-none">
                      <span>By {post.author}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                    <p className="text-sm font-medium text-primary">
                      {post.excerpt}
                    </p>
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="w-full text-center py-2 bg-white hover:bg-accent-yellow border-2 border-primary text-primary font-black uppercase text-xs transition-all block select-none"
                  >
                    Read Strategy Guide
                  </Link>
                </div>
              </article>
            ))}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
