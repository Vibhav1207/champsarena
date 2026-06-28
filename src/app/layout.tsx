import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { PendingActionProvider } from "@/context/PendingActionContext";
import { AuthProvider } from "@/components/AuthProvider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ChampsArena | Official Tournament Series",
  description: "The ultimate stage for elite trainers. Join the official tournament series and claim your place in the Hall of Fame.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background min-h-full flex flex-col font-space-grotesk selection:bg-accent-yellow selection:text-primary">
        <AuthProvider>
          <PendingActionProvider>
            {children}
          </PendingActionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}