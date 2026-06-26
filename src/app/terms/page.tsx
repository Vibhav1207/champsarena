import React from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | ChampsArena",
  description: "ChampsArena Terms of Service - Governing the use of our esports tournament platform, user responsibilities, and intellectual property rights.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro"}/terms`
  }
};

export default function TermsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

  // JSON-LD Organization & Breadcrumb structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${baseUrl}/terms#breadcrumb`,
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
            "name": "Terms of Service",
            "item": `${baseUrl}/terms`
          }
        ]
      },
      {
        "@type": "WebPage",
        "@id": `${baseUrl}/terms#webpage`,
        "url": `${baseUrl}/terms`,
        "name": "Terms of Service - ChampsArena",
        "description": "ChampsArena Terms of Service - Governing the use of our esports tournament platform."
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
        {/* Breadcrumbs */}
        <nav className="text-xs font-black uppercase tracking-wider flex items-center gap-xs select-none">
          <Link href="/" className="hover:text-accent-blue transition-colors">Home</Link>
          <span className="opacity-50">/</span>
          <span className="opacity-50">Terms of Service</span>
        </nav>

        {/* Hero header */}
        <section className="bg-white border-8 border-primary p-md md:p-xl shadow-[12px_12px_0px_0px_#1a1a1a] relative text-left">
          <div className="absolute top-0 left-0 right-0 h-4 bg-accent-red" />
          <h1 className="font-display-md md:font-display-lg leading-none uppercase tracking-tighter mb-md pt-4">
            TERMS OF SERVICE
          </h1>
          <p className="font-bold text-lg md:text-xl uppercase max-w-[768px] leading-relaxed border-l-8 border-primary pl-md bg-surface-container-low p-sm">
            Governing your use of ChampsArena esports tournament platform
          </p>
        </section>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-md md:gap-xl text-left">
          <section className="md:col-span-8 bg-white border-4 border-primary p-md md:p-lg space-y-md">
            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block">
              Acceptance of Terms
            </h2>
            <p className="font-body-lg text-primary/80">
              By accessing or using ChampsArena's website, applications, and services, you agree to be bound by these Terms of Service, our Privacy Policy, and any additional terms that may apply to specific services.
            </p>

            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block mt-md">
              User Accounts & Responsibilities
            </h2>
            <p className="font-body-lg text-primary/80">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration.
            </p>

            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block mt-md">
              Tournament Participation & Conduct
            </h2>
            <p className="font-body-lg text-primary/80">
              Participants agree to compete fairly, follow game-specific rules, and refrain from cheating, harassment, or unsportsmanlike conduct. Violations may result in warnings, point deductions, disqualification, or account termination.
            </p>

            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block mt-md">
              Prize Distribution & Payments
            </h2>
            <p className="font-body-lg text-primary/80">
              Prizes are awarded according to tournament specifications and are subject to verification. All payments are processed through secure third-party gateways. ChampsArena is not responsible for payment processing delays or fees imposed by financial institutions.
            </p>

            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block mt-md">
              Intellectual Property
            </h2>
            <p className="font-body-lg text-primary/80">
              champsarena.pro, its logo, and all related trademarks are property of ChampsArena. Users retain rights to their own content but grant ChampsArena a license to display user-generated content in connection with tournament promotion and operation.
            </p>

            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block mt-md">
              Disclaimer of Warranties
            </h2>
            <p className="font-body-lg text-primary/80">
              ChampsArena provides its services "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that services will be uninterrupted, error-free, or completely secure.
            </p>

            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block mt-md">
              Limitation of Liability
            </h2>
            <p className="font-body-lg text-primary/80">
              To the maximum extent permitted by law, ChampsArena shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use our services.
            </p>

            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block mt-md">
              Governing Law & Dispute Resolution
            </h2>
            <p className="font-body-lg text-primary/80">
              These Terms shall be governed by the laws of the jurisdiction in which ChampsArena operates. Any disputes shall be resolved through good-faith negotiation first, followed by mediation or arbitration if necessary.
            </p>

            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block mt-md">
              Changes to Terms
            </h2>
            <p className="font-body-lg text-primary/80">
              We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated effective date. Your continued use of ChampsArena after changes constitutes acceptance of the revised terms.
            </p>
          </section>

          {/* Sidebar */}
          <aside className="md:col-span-4 bg-accent-yellow border-4 border-primary p-md md:p-lg space-y-sm">
            <div className="bg-white border-4 border-primary p-md space-y-sm">
              <h2 className="font-headline-sm uppercase border-b-4 border-primary pb-xs inline-block">
                Key Terms
              </h2>
              <div className="space-y-sm font-bold text-xs uppercase pt-xs select-none">
                <div className="flex flex-col border-b-2 border-primary pb-xs">
                  <span className="text-primary/60 text-[10px]">User Conduct</span>
                  <span className="text-sm font-black">Fair play required</span>
                </div>
                <div className="flex flex-col border-b-2 border-primary pb-xs">
                  <span className="text-primary/60 text-[10px]">Account Security</span>
                  <span className="text-sm font-black">User responsible</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-primary/60 text-[10px]">Intellectual Property</span>
                  <span className="text-sm font-black">Respected & protected</span>
                </div>
              </div>
            </div>

            <div className="bg-white border-4 border-primary p-md space-y-sm">
              <h2 className="font-headline-sm uppercase border-b-4 border-primary pb-xs inline-block">
                Need Help?
              </h2>
              <p className="font-bold text-xs leading-relaxed uppercase">
                Questions about these terms? Contact our legal team for clarification.
              </p>
              <Link href="/contact" className="block w-full text-center py-2.5 bg-primary text-white border-2 border-primary font-black uppercase text-xs hover:bg-accent-blue transition-all active:translate-y-[2px]">
                Contact Support
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}