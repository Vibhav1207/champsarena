import React from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact ChampsArena | Support & Tournament Inquiries",
  description: "Get in touch with the ChampsArena support and tournament administration team. Open support tickets, file tournament disputes, or contact partnership queries.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro"}/contact`
  }
};

export default function ContactPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

  // Breadcrumb Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${baseUrl}/contact#breadcrumb`,
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
            "name": "Contact Support",
            "item": `${baseUrl}/contact`
          }
        ]
      },
      {
        "@type": "ContactPage",
        "@id": `${baseUrl}/contact#webpage`,
        "url": `${baseUrl}/contact`,
        "name": "Contact ChampsArena Support",
        "description": "Contact form and customer support ticketing center for esports players on ChampsArena."
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
          <span className="opacity-50">Contact</span>
        </nav>

        {/* Hero header */}
        <section className="bg-white border-8 border-primary p-md md:p-xl shadow-[12px_12px_0px_0px_#1a1a1a] relative text-left">
          <div className="absolute top-0 left-0 right-0 h-4 bg-accent-red" />
          <h1 className="font-display-md uppercase leading-none tracking-tighter mb-sm pt-4">Contact Command Center</h1>
          <p className="font-bold text-sm sm:text-base uppercase text-primary/70">Get answers, file tournament tickets, or connect with administrators.</p>
        </section>

        {/* Form and Info Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md lg:gap-xl text-left">
          {/* Form */}
          <section className="lg:col-span-7 bg-white border-4 border-primary p-md md:p-lg space-y-md">
            <h2 className="font-headline-md uppercase border-b-4 border-primary pb-xs inline-block">Dispatch Message</h2>
            <form className="space-y-sm font-bold text-xs uppercase pt-xs">
              <div className="flex flex-col gap-1">
                <label className="tracking-wide">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g.  Ash"
                  className="w-full border-2 border-primary p-sm bg-white focus:bg-accent-yellow/10 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="ash@pallet.com"
                  className="w-full border-2 border-primary p-sm bg-white focus:bg-accent-yellow/10 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="tracking-wide">Category / Inquiry Area</label>
                <select className="w-full border-2 border-primary p-sm bg-white focus:outline-none">
                  <option>Tournament Dispute</option>
                  <option>Payment Issue</option>
                  <option>Technical Error</option>
                  <option>Partnership/Sponsorship</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="tracking-wide">Coordinates / Message Details</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Explain your issue in detail..."
                  className="w-full border-2 border-primary p-sm bg-white focus:bg-accent-yellow/10 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-white border-2 border-primary font-black uppercase tracking-wider text-xs hover:bg-accent-blue transition-all active:translate-y-[2px]"
              >
                Send Transmission
              </button>
            </form>
          </section>

          {/* Quick FAQ / Contacts */}
          <section className="lg:col-span-5 space-y-md">
            <div className="bg-white border-4 border-primary p-md md:p-lg space-y-sm">
              <h2 className="font-headline-sm uppercase border-b-4 border-primary pb-xs inline-block">Direct Signals</h2>
              <div className="space-y-sm font-bold text-xs uppercase pt-xs select-none">
                <div className="flex flex-col border-b-2 border-primary pb-xs">
                  <span className="text-primary/60 text-[10px]">Email Support</span>
                  <span className="text-sm font-black">support@champsarena.pro</span>
                </div>
                <div className="flex flex-col border-b-2 border-primary pb-xs">
                  <span className="text-primary/60 text-[10px]">Admin Office Hours</span>
                  <span className="text-sm font-black">09:00 - 18:00 UTC</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-primary/60 text-[10px]">Discord Signal</span>
                  <span className="text-sm font-black">discord.gg/champsarena</span>
                </div>
              </div>
            </div>

            <div className="bg-accent-yellow border-4 border-primary p-md md:p-lg space-y-sm">
              <h2 className="font-headline-sm uppercase">Filing a Dispute?</h2>
              <p className="font-bold text-xs leading-relaxed uppercase">
                If you have a dispute about a specific match, please navigate to your active tournament matchup lobby and upload the screenshot proof directly to file a dispute. This alerts the moderators instantly.
              </p>
              <Link href="/tournaments" className="block w-full text-center py-2.5 bg-primary text-white border-2 border-primary font-black uppercase text-xs hover:bg-accent-blue transition-all active:translate-y-[2px]">
                Lobby Center
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
