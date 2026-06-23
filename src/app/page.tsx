"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
}

interface Tournament {
  id: string;
  title: string;
  description: string;
  banner: string | null;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  startDate: string;
  type: string;
  status: string;
  _count?: { registrations: number };
}

interface TopPlayer {
  id: string;
  name: string;
  elo: number;
  wins: number;
  losses: number;
  image: string | null;
  homeRegion: string | null;
}

const TYPE_MAP: Record<string, { label: string; bg: string }> = {
  SINGLE_ELIMINATION: { label: "VGC Format", bg: "bg-accent-blue" },
  ROUND_ROBIN: { label: "TCG Format", bg: "bg-primary" },
  DOUBLE_ELIMINATION: { label: "GO Format", bg: "bg-accent-red" },
  SWISS: { label: "Swiss Format", bg: "bg-primary" },
};

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: "Upcoming",
  REGISTRATION_OPEN: "Registration Open",
  ONGOING: "Ongoing",
};

export default function Home() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Tournament[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [winners, setWinners] = useState<string[]>([]);
  const [loadingAnn, setLoadingAnn] = useState(true);
  const [loadingTour, setLoadingTour] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  useEffect(() => {
    // Announcements
    fetch("/api/announcements")
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const pinned = data.find((a: any) => a.pinned) || data[0];
          setAnnouncement(pinned);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAnn(false));

    // Tournaments
    fetch("/api/tournaments")
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const filtered = data
            .filter((t: any) => ["REGISTRATION_OPEN", "UPCOMING", "ONGOING"].includes(t.status))
            .slice(0, 3);
          setUpcomingEvents(filtered);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTour(false));

    // Users for podium + winners ticker
    fetch("/api/users")
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => b.elo - a.elo);
          setTopPlayers(sorted.slice(0, 3));
          
          // Build winners ticker from top winners
          const tickerNames = [...data]
            .filter(u => u.wins > 0)
            .sort((a, b) => b.wins - a.wins)
            .slice(0, 6)
            .map(u => `${u.name} (${u.wins} wins)`);
          setWinners(tickerNames);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPlayers(false));
  }, []);

  return (
    <>
      <Navigation />

      <main className="pt-0">
        {/* Hero Section */}
        <section className="relative w-full min-h-[500px] md:h-[700px] py-xl md:py-0 flex items-center justify-center overflow-hidden border-b-4 border-primary bg-accent-yellow/10">
          <div className="absolute inset-0 z-0 opacity-50 grayscale contrast-125">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIKxLGbKi9AFU6kDvRhPMdZ_gJBwFV86yr70Mjr49MK56QHhQOlrhO2_x-ozbLR-DOiT5jF7wbElOr20jF4xJJ_DQ2DSALh6jUWg3q__3vUjLdahhrdMY_QfxaittO9lpwpkfWAzwjtS-JWvZf9rtIwIadQe0B6pkiSERH_S1-EDIzPvkIFFVg-uF8aRtUFsgjWk0pa4sdBSZs0bl1CF12eAmRjfoAmNxNaYNtLuvMP7JmW8R2x25zkhTuniFtQrSEkk7ycr74JTo"
              alt="Stadium background"
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
          <div className="bauhaus-grid absolute inset-0"></div>
          <div className="relative z-20 text-center px-sm max-w-[896px]">
            <div className="inline-block bg-accent-red text-white font-bold uppercase px-4 py-1 mb-md transform -rotate-1 text-lg sm:text-xl select-none">
              The Ultimate Stage
            </div>
            <h1 className="font-bold text-4xl sm:text-6xl md:text-7xl lg:text-[88px] text-primary mb-md leading-none uppercase tracking-tighter">
              <span className="block">ChampsArena</span>
              <span className="block bg-primary text-white inline-block px-4 py-2 transform rotate-1">League</span>
            </h1>
            <p className="font-bold text-sm sm:text-base md:text-xl text-primary mb-xl max-w-[672px] mx-auto border-l-8 border-primary pl-6 bg-white/80 p-4">
              Join the official tournament series and claim your place in the Hall of Fame. Form follows function.
            </p>
            <div className="flex flex-col md:flex-row gap-md justify-center select-none w-full max-w-sm md:max-w-none mx-auto">
              <Link href="/login" className="bg-accent-yellow text-primary px-lg py-sm md:px-xl md:py-md border-4 border-primary font-black text-lg md:text-2xl uppercase tracking-widest neo-brutalist-shadow neo-brutalist-button-active transition-all w-full md:w-auto text-center hover:translate-x-1 hover:translate-y-1">
                Register Now
              </Link>
              <Link href="/tournaments" className="bg-white text-primary border-4 border-primary px-lg py-sm md:px-xl md:py-md font-black text-lg md:text-2xl uppercase tracking-widest neo-brutalist-shadow neo-brutalist-button-active transition-all w-full md:w-auto text-center hover:translate-x-1 hover:translate-y-1">
                Schedule
              </Link>
            </div>
          </div>
          {/* Bauhaus Decorative Elements */}
          <div className="hidden md:block absolute top-20 right-20 w-32 h-32 bg-accent-red rounded-full select-none pointer-events-none"></div>
          <div className="hidden md:block absolute bottom-20 left-20 w-40 h-40 border-8 border-accent-blue select-none pointer-events-none"></div>
        </section>

        {/* Winners Ticker */}
        <div className="bg-primary py-4 overflow-hidden border-b-4 border-primary select-none">
          <div className="flex whitespace-nowrap animate-marquee items-center">
            <span className="font-black mx-md text-white uppercase tracking-widest text-xl">RECENT CHAMPIONS //</span>
            {winners.length > 0 ? (
              [...winners, ...winners].map((w, idx) => (
                <span key={idx} className="flex items-center gap-xs font-bold text-white mx-lg text-xl uppercase">
                  <span className="w-4 h-4 bg-accent-yellow rounded-full"></span> {w}
                </span>
              ))
            ) : (
              <span className="flex items-center gap-xs font-bold text-white mx-lg text-xl uppercase">
                <span className="w-4 h-4 bg-accent-yellow rounded-full"></span> NO RECENT CHAMPIONS RECORDED YET — CURRENT SERIES UNDERWAY
              </span>
            )}
          </div>
        </div>

        {/* Latest Announcement & Upcoming Events */}
        <section className="max-w-container-max mx-auto px-md py-lg md:py-xl grid grid-cols-1 lg:grid-cols-12 gap-md lg:gap-xl">
          {/* Latest Announcement Card */}
          <div className="lg:col-span-5 flex flex-col">
            <h2 className="font-black text-4xl text-primary mb-md uppercase tracking-tighter flex items-center gap-sm select-none">
              <span className="w-8 h-8 bg-accent-red inline-block"></span> News
            </h2>

            {loadingAnn ? (
              <div className="flex-grow bg-white border-4 border-primary p-lg flex items-center justify-center min-h-[300px]">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
              </div>
            ) : announcement ? (
              <div className="bg-white border-4 border-primary neo-brutalist-shadow overflow-hidden group flex-grow flex flex-col">
                <div className="h-64 overflow-hidden border-b-4 border-primary grayscale group-hover:grayscale-0 transition-all duration-500 relative">
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGW7-vBXzV5KsC7LXIfK2ot_cPNs1BvRxQf0sHBj6v53DPscGlH_j8DDNJLsA49-gvQHaA7Sr_3zqaf7h27ApQXPUfQhU38Z5Wgp8B6OIkcIyguC5WUEhA0a5rnCc0XF5yuKBjroVnBtoQwra4ilXJNqFl7no6UIkGdSF_x9iXqkY-P-NZUNF_qeyoU9Jrz7gEgBQ2WqVsf4QIVRkLK4P83cCEEs4dzFuPIqZLyKxMy1n8Ym93FtsPqsTpOWKPWZuHCbegLshT6V8"
                    alt="News cover"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
                <div className="p-md flex flex-col flex-grow justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-sm">
                      <span className="bg-accent-yellow text-primary px-3 py-1 font-black text-sm uppercase select-none">
                        Announcement
                      </span>
                      <span className="text-primary font-bold text-sm uppercase">
                        {new Date(announcement.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="font-black text-3xl text-primary mb-sm uppercase leading-none">{announcement.title}</h3>
                    <p className="font-bold text-primary/70 mb-md leading-snug">{announcement.content}</p>
                  </div>
                  <Link href="/tournaments" className="bg-primary text-white px-6 py-3 font-black uppercase inline-flex items-center justify-center gap-xs hover:bg-accent-blue transition-colors w-fit select-none">
                    Read More <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white border-4 border-dashed border-primary p-lg flex flex-col items-center justify-center text-center flex-grow min-h-[300px]">
                <span className="material-symbols-outlined text-5xl text-primary/30 mb-3">campaign</span>
                <h3 className="font-title-lg text-primary uppercase font-bold">No Announcements</h3>
                <p className="text-primary/60 font-bold uppercase text-xs mt-1">Stay tuned for future tournament updates.</p>
              </div>
            )}
          </div>

          {/* Upcoming Events Carousel */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex justify-between items-center mb-md select-none">
              <h2 className="font-black text-4xl text-primary uppercase tracking-tighter flex items-center gap-sm">
                <span className="w-8 h-8 bg-accent-blue inline-block"></span> Events
              </h2>
              <div className="flex gap-md">
                <button className="w-12 h-12 border-4 border-primary flex items-center justify-center hover:bg-accent-yellow transition-colors font-bold cursor-pointer">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="w-12 h-12 border-4 border-primary flex items-center justify-center hover:bg-accent-yellow transition-colors font-bold cursor-pointer">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            {loadingTour ? (
              <div className="flex-grow bg-white border-4 border-primary p-lg flex items-center justify-center min-h-[300px]">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="flex gap-md overflow-x-auto hide-scrollbar pb-xs flex-grow items-stretch">
                {upcomingEvents.map((event, idx) => {
                  const formatInfo = TYPE_MAP[event.type] || { label: "VGC", bg: "bg-accent-blue" };
                  const isGoldBorder = event.entryFee > 25;
                  return (
                    <div key={event.id} className={`flex-shrink-0 w-80 bg-white border-4 ${isGoldBorder ? "border-accent-yellow" : "border-primary"} p-md neo-brutalist-shadow-hover transition-all flex flex-col justify-between`}>
                      <div>
                        <div className="flex justify-between items-start mb-sm select-none">
                          <div className={`${formatInfo.bg} text-white px-2 py-1 font-black text-xs uppercase`}>
                            {formatInfo.label}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary uppercase">
                            {STATUS_LABEL[event.status] || event.status}
                          </span>
                        </div>
                        <h4 className="font-black text-2xl text-primary mb-xs uppercase line-clamp-1">{event.title}</h4>
                        {event.description && (
                          <p className="font-bold text-primary/60 mb-sm uppercase text-xs line-clamp-1">
                            {event.description}
                          </p>
                        )}
                        <div className="bg-background border-2 border-primary p-sm mb-md flex flex-col gap-y-1">
                          <div className="flex items-center gap-xs font-bold text-sm uppercase">
                            <span className="material-symbols-outlined font-bold text-primary">event</span>
                            <span>{new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </div>
                          <div className="flex items-center gap-xs font-bold text-sm uppercase text-accent-red">
                            <span className="material-symbols-outlined font-bold">trophy</span>
                            <span>${event.prizePool.toLocaleString()} Pool</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/tournaments/${event.id}`} className="w-full text-center py-3 bg-white border-4 border-primary text-primary font-black uppercase hover:bg-primary hover:text-white transition-all active:translate-y-1 select-none">
                        View Details
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border-4 border-dashed border-primary p-lg flex flex-col items-center justify-center text-center flex-grow min-h-[300px]">
                <span className="material-symbols-outlined text-5xl text-primary/30 mb-3">emoji_events</span>
                <h3 className="font-title-lg text-primary uppercase font-bold">No Tournaments</h3>
                <p className="text-primary/60 font-bold uppercase text-xs mt-1">Currently no tournaments are open.</p>
              </div>
            )}
          </div>
        </section>

        {/* Featured Champions Section */}
        <section className="bg-white py-xl border-y-4 border-primary relative overflow-hidden">
          <div className="bauhaus-grid absolute inset-0"></div>
          <div className="max-w-container-max mx-auto px-md relative z-10">
            <div className="text-center mb-xl select-none">
              <h2 className="font-black text-6xl text-primary mb-xs uppercase tracking-tighter">Top Champions</h2>
              <div className="w-24 h-4 bg-accent-red mx-auto mb-sm"></div>
              <p className="font-bold text-2xl text-primary uppercase">Global Ranking Leaders</p>
            </div>

            {loadingPlayers ? (
              <div className="flex justify-center py-16">
                <span className="material-symbols-outlined animate-spin text-primary text-5xl">progress_activity</span>
              </div>
            ) : topPlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md md:gap-xl items-end max-w-[896px] mx-auto pt-sm">
                
                {/* Champion 2 (Left) */}
                <div className="order-2 md:order-1 flex flex-col items-center">
                  {topPlayers[1] ? (
                    <>
                      <div className="relative mb-lg select-none">
                        <div className="w-48 h-48 sm:w-56 sm:h-56 border-8 border-primary bg-background overflow-hidden neo-brutalist-shadow grayscale hover:grayscale-0 transition-all relative">
                          {topPlayers[1].image ? (
                            <Image
                              src={topPlayers[1].image}
                              alt={topPlayers[1].name}
                              fill
                              className="object-cover"
                              sizes="224px"
                            />
                          ) : (
                            <div className="w-full h-full bg-surface-container flex items-center justify-center font-bold text-4xl text-primary">
                              {topPlayers[1].name[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-accent-blue text-white px-4 py-2 font-black text-3xl border-4 border-primary">2</div>
                      </div>
                      <h3 className="font-black text-3xl text-primary uppercase mb-1">{topPlayers[1].name}</h3>
                      <p className="text-primary font-bold uppercase mb-4">{topPlayers[1].elo} CP</p>
                      <span className="bg-primary text-white px-4 py-1 font-black uppercase text-xs tracking-widest select-none">Wins: {topPlayers[1].wins}</span>
                    </>
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 border-8 border-dashed border-primary flex items-center justify-center font-bold text-xl text-primary/40 select-none">
                      2nd Place
                    </div>
                  )}
                </div>

                {/* Champion 1 (Center) */}
                <div className="order-1 md:order-2 flex flex-col items-center transform md:-translate-y-12">
                  {topPlayers[0] ? (
                    <>
                      <div className="relative mb-lg select-none">
                        <div className="w-56 h-56 sm:w-72 sm:h-72 border-8 border-primary bg-accent-yellow overflow-hidden neo-brutalist-shadow transition-all relative">
                          {topPlayers[0].image ? (
                            <Image
                              src={topPlayers[0].image}
                              alt={topPlayers[0].name}
                              fill
                              className="object-cover"
                              sizes="288px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-5xl text-primary">
                              {topPlayers[0].name[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-accent-yellow text-primary px-8 py-3 font-black text-5xl border-8 border-primary">1</div>
                      </div>
                      <h3 className="font-black text-4xl text-primary uppercase mb-1">{topPlayers[0].name}</h3>
                      <p className="text-primary font-black text-xl uppercase mb-4">{topPlayers[0].elo} CP</p>
                      <span className="bg-accent-red text-white px-6 py-2 font-black uppercase text-sm tracking-widest select-none">Wins: {topPlayers[0].wins}</span>
                    </>
                  ) : (
                    <div className="w-56 h-56 sm:w-72 sm:h-72 border-8 border-dashed border-primary flex items-center justify-center font-bold text-2xl text-primary/40 select-none">
                      Champion
                    </div>
                  )}
                </div>

                {/* Champion 3 (Right) */}
                <div className="order-3 flex flex-col items-center">
                  {topPlayers[2] ? (
                    <>
                      <div className="relative mb-lg select-none">
                        <div className="w-48 h-48 sm:w-56 sm:h-56 border-8 border-primary bg-background overflow-hidden neo-brutalist-shadow grayscale hover:grayscale-0 transition-all relative">
                          {topPlayers[2].image ? (
                            <Image
                              src={topPlayers[2].image}
                              alt={topPlayers[2].name}
                              fill
                              className="object-cover"
                              sizes="224px"
                            />
                          ) : (
                            <div className="w-full h-full bg-surface-container flex items-center justify-center font-bold text-4xl text-primary">
                              {topPlayers[2].name[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-accent-red text-white px-4 py-2 font-black text-3xl border-4 border-primary">3</div>
                      </div>
                      <h3 className="font-black text-3xl text-primary uppercase mb-1">{topPlayers[2].name}</h3>
                      <p className="text-primary font-bold uppercase mb-4">{topPlayers[2].elo} CP</p>
                      <span className="bg-primary text-white px-4 py-1 font-black uppercase text-xs tracking-widest select-none">Wins: {topPlayers[2].wins}</span>
                    </>
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 border-8 border-dashed border-primary flex items-center justify-center font-bold text-xl text-primary/40 select-none">
                      3rd Place
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-6xl text-primary/30 block mb-4">group</span>
                <p className="text-primary/60 font-black uppercase text-sm">No trainers registered yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Community Hub Section */}
        <section className="max-w-container-max mx-auto px-md py-lg md:py-xl">
          <div className="bg-white border-4 md:border-8 border-primary p-md md:p-xl flex flex-col md:flex-row items-center gap-md md:gap-xl relative overflow-hidden neo-brutalist-shadow">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-accent-blue rounded-full opacity-20 select-none pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-accent-red opacity-20 transform rotate-12 select-none pointer-events-none"></div>
            <div className="relative z-10 flex-1">
              <h2 className="font-black text-5xl md:text-7xl text-primary mb-md uppercase tracking-tighter leading-none">Join the Hub</h2>
              <div className="w-32 h-6 bg-accent-yellow mb-lg"></div>
              <p className="font-bold text-xl md:text-2xl text-primary mb-xl max-w-[512px] uppercase">
                Connect with thousands of trainers. Discuss meta, find partners, and get real-time support.
              </p>
              <div className="flex flex-wrap gap-md md:gap-lg select-none">
                <a href="#" className="bg-[#5865F2] text-white px-md py-sm md:px-lg md:py-md border-4 border-primary font-black uppercase text-base md:text-xl flex items-center gap-sm neo-brutalist-shadow neo-brutalist-button-active transition-all">
                  Discord Community
                </a>
                <a href="#" className="bg-white text-primary px-md py-sm md:px-lg md:py-md border-4 border-primary font-black uppercase text-base md:text-xl flex items-center gap-sm neo-brutalist-shadow neo-brutalist-button-active transition-all">
                  Find Local Clubs
                </a>
              </div>
            </div>
            <div className="relative z-10 hidden md:block w-1/3">
              <div className="border-8 border-primary bg-accent-yellow p-md transform rotate-3 neo-brutalist-shadow select-none">
                <div className="flex items-center gap-md mb-md">
                  <div className="w-16 h-16 border-4 border-primary bg-primary rounded-none"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-primary w-full"></div>
                    <div className="h-4 bg-primary w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-sm">
                  <div className="h-4 bg-primary/20 w-full"></div>
                  <div className="h-4 bg-primary/20 w-5/6"></div>
                  <div className="h-4 bg-primary/20 w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
