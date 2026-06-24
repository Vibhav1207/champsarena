import React from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About ChampsArena | Competitive Esports Tournament Series",
  description: "Learn about the mission, values, and history behind ChampsArena, the ultimate stage for competitive esports tournaments.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro"}/about`
  }
};

export default function AboutPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

  // JSON-LD Organization & Breadcrumb structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${baseUrl}/about#breadcrumb`,
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
            "name": "About Us",
            "item": `${baseUrl}/about`
          }
        ]
      },
      {
        "@type": "AboutPage",
        "@id": `${baseUrl}/about#webpage`,
        "url": `${baseUrl}/about`,
        "name": "About ChampsArena",
        "description": "Learn about the mission and history behind ChampsArena, the premier esports tournament platform."
      }
    ]
  };

  return (
    <>
      <Navigation />

      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-container-max mx-auto px-md py-xl space-y-xl text-primary">
        {/* Breadcrumb Visual Component */}
        <nav className="text-xs font-black uppercase tracking-wider flex items-center gap-xs select-none">
          <Link href="/" className="hover:text-accent-blue transition-colors">Home</Link>
          <span className="opacity-50">/</span>
          <span className="opacity-50">About</span>
        </nav>

        {/* Hero Section */}
        <section className="bg-white border-8 border-primary p-md md:p-xl shadow-[12px_12px_0px_0px_#1a1a1a] relative overflow-hidden text-left">
          <div className="absolute top-0 left-0 right-0 h-4 bg-accent-yellow" />
          <h1 className="font-display-md md:font-display-lg leading-none uppercase tracking-tighter mb-md pt-4">
            CHAMPSARENA
          </h1>
          <p className="font-bold text-lg md:text-xl uppercase max-w-[768px] leading-relaxed border-l-8 border-primary pl-md bg-surface-container-low p-sm">
            We build the arenas where champions are crowned. ChampsArena is an automated, fair, and high-performance tournament series platform built for the competitive community.
          </p>
        </section>

        {/* Narrative columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-md md:gap-xl text-left">
          <section className="md:col-span-8 bg-white border-4 border-primary p-md md:p-lg space-y-md">
            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block">
              Our Vision
            </h2>
            <p className="font-body-lg text-primary/80">
              ChampsArena was born out of a desire to create a clean, competitive, and lag-free space where grassroots players and seasoned pros alike can compete under standard rules. Our platform supports matchmaking, dynamic brackets, automated ELO calculation, and score-verification with dispute logging.
            </p>
            <p className="font-body-lg text-primary/80">
              Whether you are drafting a restricted legendary in Pokémon VGC, landing hot spots in BGMI, deploying strategies in Free Fire, or holding sites in Valorant, ChampsArena makes registering and playing completely frictionless.
            </p>
          </section>

          <section className="md:col-span-4 bg-accent-yellow border-4 border-primary p-md md:p-lg space-y-sm flex flex-col justify-between">
            <div>
              <h2 className="font-headline-sm uppercase mb-xs">
                Quick Info
              </h2>
              <ul className="space-y-sm font-bold text-xs uppercase pt-xs select-none">
                <li className="flex justify-between border-b-2 border-primary pb-xs">
                  <span>Founded</span>
                  <span>2026</span>
                </li>
                <li className="flex justify-between border-b-2 border-primary pb-xs">
                  <span>Open Tourneys</span>
                  <span>Daily</span>
                </li>
                <li className="flex justify-between border-b-2 border-primary pb-xs">
                  <span>Supported Games</span>
                  <span>12+ Titles</span>
                </li>
              </ul>
            </div>
            <Link href="/tournaments" className="w-full text-center py-3 bg-primary text-white border-2 border-primary font-black uppercase text-xs hover:bg-accent-blue transition-all active:translate-y-[2px]">
              Browse Tournaments
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
