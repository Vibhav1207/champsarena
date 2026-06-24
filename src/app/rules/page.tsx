import React from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Tournament Rules & Regulations | ChampsArena",
  description: "Read the  competitive rules, ELO regulations, match reporting policies, and terms of conduct for participating in tournaments on ChampsArena.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro"}/rules`
  }
};

export default function RulesPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

  // Breadcrumb & FAQ schemas
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${baseUrl}/rules#breadcrumb`,
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
            "name": "Rules & Regulations",
            "item": `${baseUrl}/rules`
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${baseUrl}/rules#faq`,
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How is ELO calculated on ChampsArena?",
            "item": {
              "@type": "Answer",
              "text": "ELO is calculated dynamically based on player matchmaking ratings. Winning against higher ELO opponents increases your ELO significantly, while losing to lower-rated players results in a greater ELO drop."
            }
          },
          {
            "@type": "Question",
            "name": "What happens if a player disconnects during a match?",
            "item": {
              "@type": "Answer",
              "text": "In the case of a disconnection, players must take screenshot evidence and raise a dispute in the match lobby. Tournament moderators will review the dispute and make a final ruling."
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <Navigation />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="max-w-container-max mx-auto px-md py-xl space-y-xl text-primary">
        {/* Breadcrumbs */}
        <nav className="text-xs font-black uppercase tracking-wider flex items-center gap-xs select-none">
          <Link href="/" className="hover:text-accent-blue transition-colors">Home</Link>
          <span className="opacity-50">/</span>
          <span className="opacity-50">Rules</span>
        </nav>

        {/* Hero header */}
        <section className="bg-white border-8 border-primary p-md md:p-xl shadow-[12px_12px_0px_0px_#1a1a1a] relative text-left">
          <div className="absolute top-0 left-0 right-0 h-4 bg-accent-blue" />
          <h1 className="font-display-md uppercase leading-none tracking-tighter mb-sm pt-4">General Platform Rules</h1>
          <p className="font-bold text-sm sm:text-base uppercase text-primary/70">The baseline rules that keep competition fair, consistent, and fun.</p>
        </section>

        {/* Rules Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md lg:gap-xl text-left">
          <div className="lg:col-span-8 space-y-md">
            {[
              {
                num: "01",
                title: "Code of Conduct",
                desc: "All players must respect other competitors, tournament organizers, and community members. Verbal abuse, harassment, hate speech, or offensive usernames will result in immediate suspension and disqualification."
              },
              {
                num: "02",
                title: "Match Reporting & Verification",
                desc: "After every match is completed, both players (or squad captains) must report the scores in the match lobby. You must upload screenshot proof displaying the final scorecard. Intentionally reporting fake scores is a severe violation."
              },
              {
                num: "03",
                title: "Dispute Resolutions",
                desc: "If an opponent reports an incorrect score, click the 'Dispute' button in the match lobby. Explain the situation clearly and attach the screenshot proof. Our moderation team reviews disputes within 24 hours. The moderator's decision is final."
              },
              {
                num: "04",
                title: "Disconnect Policy",
                desc: "If a player disconnects, they have a 5-minute grace period to rejoin. If they fail to rejoin within 5 minutes, they forfeit the current game. Proof of disconnect (screen recording or screenshot of the disconnect error) is required to avoid default loss."
              }
            ].map((rule) => (
              <div key={rule.num} className="bg-white border-4 border-primary p-md flex gap-md">
                <span className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-primary text-white text-2xl font-black select-none">
                  {rule.num}
                </span>
                <div>
                  <h3 className="font-title-lg uppercase mb-xs select-none">{rule.title}</h3>
                  <p className="font-body-md text-primary/80 mt-1 leading-relaxed">
                    {rule.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-md">
            <div className="bg-accent-yellow border-4 border-primary p-md md:p-lg space-y-sm">
              <h2 className="font-headline-sm uppercase">Fair Play ELO Rules</h2>
              <p className="font-bold text-xs leading-relaxed uppercase">
                ELO is recalculate dynamically after every match. Players who disconnect during a match will receive an ELO deduction corresponding to a match loss. Artificially inflating ELO rating (boosting) leads to profile termination.
              </p>
            </div>

            <div className="bg-white border-4 border-primary p-md md:p-lg space-y-sm">
              <h2 className="font-headline-sm uppercase">Need help?</h2>
              <p className="font-bold text-xs leading-relaxed uppercase">
                Have questions regarding game-specific rules sheets? Contact our support staff or reach out on Discord.
              </p>
              <Link href="/contact" className="block w-full text-center py-2.5 bg-primary text-white border-2 border-primary font-black uppercase text-xs hover:bg-accent-blue transition-all active:translate-y-[2px]">
                Support Center
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
