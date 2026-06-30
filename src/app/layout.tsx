import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { PendingActionProvider } from "@/context/PendingActionContext";
import { AuthProvider } from "@/components/AuthProvider";
import { WebVitals } from "@/components/WebVitals";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "700"],
  display: "optional",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "sans-serif"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "ChampsArena | Official Tournament Series",
    template: "%s | ChampsArena",
  },
  description: "The ultimate stage for elite trainers. Join the official tournament series and claim your place in the Hall of Fame.",
  keywords: ["gaming tournaments", "esports", "pokemon", "competitive gaming", "tournaments"],
  authors: [{ name: "ChampsArena" }],
  creator: "ChampsArena",
  publisher: "ChampsArena",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://champsarena.pro",
    siteName: "ChampsArena",
    title: "ChampsArena | Official Tournament Series",
    description: "The ultimate stage for elite trainers. Join the official tournament series and claim your place in the Hall of Fame.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ChampsArena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChampsArena | Official Tournament Series",
    description: "The ultimate stage for elite trainers. Join the official tournament series and claim your place in the Hall of Fame.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" },
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <head>
        {/* DNS Prefetch for external resources */}
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://api.dicebear.com" />
        <link rel="dns-prefetch" href="https://cdn.discordapp.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />

        {/* Preconnect for critical third-party origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.dicebear.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.discordapp.com" crossOrigin="anonymous" />

        {/* Preload Material Symbols font - critical for UI */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="https://fonts.gstatic.com/s/materialsymbolsoutlined/v227/kJEhBvYX7BgnkSrU3T8APEwCfgq_qRKk45frmnt0s90.woff2"
          crossOrigin="anonymous"
        />

        {/* Preload hero image - will be added per page */}
      </head>
      <body className="bg-background text-on-background min-h-full flex flex-col font-space-grotesk selection:bg-accent-yellow selection:text-primary">
        <AuthProvider>
          <PendingActionProvider>
            {children}
          </PendingActionProvider>
        </AuthProvider>

        {/* Web Vitals Monitoring */}
        <WebVitals />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}