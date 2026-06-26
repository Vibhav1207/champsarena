import React from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import Link from "next/link";
import type { Metadata };

export const metadata: Metadata = {
  title: "Privacy Policy | ChampsArena",
  description: "ChampsArena Privacy Policy - Learn how we collect, use, and protect your personal information in our esports tournament platform.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro"}/privacy`
  }
};

export default function PrivacyPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://champsarena.pro";

  // JSON-LD Organization & Breadcrumb structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${baseUrl}/privacy#breadcrumb`,
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
            "name": "Privacy Policy",
            "item": `${baseUrl}/privacy`
          }
        ]
      },
      {
        "@type": "WebPage",
        "@id": `${baseUrl}/privacy#webpage`,
        "url": `${baseUrl}/privacy`,
        "name": "Privacy Policy - ChampsArena",
        "description": "ChampsArena Privacy Policy - Learn how we collect, use, and protect your personal information."
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
          <span className="opacity-50">Privacy Policy</span>
        </nav>

        {/* Hero header */}
        <section className="bg-white border-8 border-primary p-md md:p-xl shadow-[12px_12px_0px_0px_#1a1a1a] relative text-left">
          <div className="absolute top-0 left-0 right-0 h-4 bg-accent-yellow" />
          <h1 className="font-display-md md:font-display-lg leading-none uppercase tracking-tighter mb-md pt-4">
            PRIVACY POLICY
          </h1>
          <p className="font-bold text-lg md:text-xl uppercase max-w-[768px] leading-relaxed border-l-8 border-primary pl-md bg-surface-container-low p-sm">
            Understanding how we protect your personal information on ChampsArena
          </p>
        </section>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-md md:gap-xl text-left">
          <section className="md:col-span-8 bg-white border-4 border-primary p-md md:p-lg space-y-md">
            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block">
              Information Collection
            </h2>
            <p className="font-body-lg text-primary/80">
              ChampsArena collects personal information you voluntarily provide when you register for an account, participate in tournaments, or interact with our services. This may include your name, email address, username, and game-related data.
            </p>

            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block mt-md">
              How We Use Your Information
            </h2>
            <p className="font-body-lg text-primary/80">
              We use your personal information to provide and improve our services, facilitate tournament participation, communicate updates and promotions, and ensure fair play through anti-cheat measures.
            </p>

            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block mt-md">
              Data Sharing & Protection
            </h2>
            <p className="font-body-lg text-primary/80">
              We do not sell your personal information to third parties. We share data only with trusted partners essential for service delivery (tournament processing, payment handling) and as required by law. We employ industry-standard security measures to protect your data.
            </p>

            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block mt-md">
              Your Rights & Controls
            </h2>
            <p className="font-body-lg text-primary/80">
              You have the right to access, update, or delete your personal information. You can manage your account settings and communication preferences through your profile dashboard.
            </p>

            <h2 className="font-headline-md uppercase mb-sm border-b-4 border-primary pb-xs inline-block mt-md">
              Changes to This Policy
            </h2>
            <p className="font-body-lg text-primary/80">
              We may update this privacy policy from time to time. We will notify users of significant changes through our platform or email. Continued use of our services after changes constitutes acceptance.
            </p>
          </section>

          {/* Sidebar */}
          <aside className="md:col-span-4 bg-accent-yellow border-4 border-primary p-md md:p-lg space-y-sm">
            <div className="bg-white border-4 border-primary p-md space-y-sm">
              <h2 className="font-headline-sm uppercase border-b-4 border-primary pb-xs inline-block">
                Key Points
              </h2>
              <div className="space-y-sm font-bold text-xs uppercase pt-xs select-none">
                <div className="flex flex-col border-b-2 border-primary pb-xs">
                  <span className="text-primary/60 text-[10px]">Data Collection</span>
                  <span className="text-sm font-black">Limited to essentials</span>
                </div>
                <div className="flex flex-col border-b-2 border-primary pb-xs">
                  <span className="text-primary/60 text-[10px]">Data Sharing</span>
                  <span className="text-sm font-black">Never sold</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-primary/60 text-[10px]">User Rights</span>
                  <span className="text-sm font-black">Access & control</span>
                </div>
              </div>
            </div>

            <div className="bg-white border-4 border-primary p-md space-y-sm">
              <h2 className="font-headline-sm uppercase border-b-4 border-primary pb-xs inline-block">
                Need Help?
              </h2>
              <p className="font-bold text-xs leading-relaxed uppercase">
                Questions about privacy? Contact our data protection officer.
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