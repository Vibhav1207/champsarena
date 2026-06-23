"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

interface Tournament {
  id: string;
  title: string;
  description: string | null;
  type: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN" | "SWISS";
  status: "UPCOMING" | "REGISTRATION_OPEN" | "ONGOING" | "COMPLETED" | "CANCELLED" | "DRAFT";
  entryFee: number;
  prizePool: number;
  currency?: string;
  maxPlayers: number;
  startDate: string;
  banner: string | null;
  _count?: { registrations: number };
}

const FORMAT_MAP: Record<string, { label: string; bg: string }> = {
  SINGLE_ELIMINATION: { label: "Pokémon VGC", bg: "bg-accent-blue" },
  SWISS:              { label: "Pokémon VGC", bg: "bg-accent-blue" },
  DOUBLE_ELIMINATION: { label: "Pokémon GO", bg: "bg-accent-red" },
  ROUND_ROBIN:        { label: "Pokémon TCG", bg: "bg-primary" },
};

const getTournamentGameInfo = (t: any) => {
  if (t.game === "FREE_FIRE") {
    return { label: "Free Fire", bg: "bg-accent-yellow text-primary border-primary", key: "FREE_FIRE" };
  }
  const typeInfo = FORMAT_MAP[t.type] || { label: "VGC", bg: "bg-accent-blue" };
  const key = t.type === "DOUBLE_ELIMINATION" ? "GO" : t.type === "ROUND_ROBIN" ? "TCG" : "VGC"; // VGC, TCG, GO
  const bgClass = typeInfo.bg.includes("text-") ? typeInfo.bg : `${typeInfo.bg} text-white`;
  return { label: typeInfo.label, bg: bgClass, key };
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  UPCOMING:          { label: "Upcoming",     color: "text-primary/70" },
  REGISTRATION_OPEN: { label: "Open!",        color: "text-accent-red font-black" },
  ONGOING:           { label: "Ongoing",      color: "text-accent-blue font-black" },
  COMPLETED:         { label: "Completed",    color: "text-primary/40" },
  CANCELLED:         { label: "Cancelled",    color: "text-accent-red" },
  DRAFT:             { label: "Draft",        color: "text-primary/40" },
};

const BANNER_FALLBACK = "https://lh3.googleusercontent.com/aida-public/AB6AXuDhtk607KBiCbdQvybjgNZ2gNKkzoM2lsIgp4bwuQ6j2UJ_en9Kj8obXtAyG_ZEBIwnSwpXB7S3cWooSmS3-cUBEXUCtrPjKRhZRNr6JN4lqbvsPtt8HdWD2xpjbso2Tv_6FJErMKA8IYo7OkrU7z9Id5UjxdTUKhsF2KvkmXBNPSL4i1Q8SGSsfLk0UO8cMZTPSPVzvms3kNDx4P2ez_2Kz9kghCmoQIjx_HXKVa2AcbynL8Bxm7xKmghwQBi7J4k2x1uvHD-D9Yw";

export default function Tournaments() {
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/tournaments")
      .then(r => r.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setTournaments(data);
        } else {
          setError("Failed to load tournaments.");
        }
      })
      .catch(() => setError("Network error loading tournaments."))
      .finally(() => setLoading(false));
  }, []);

  const toggleFormat = (f: string) => {
    setSelectedFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleReset = () => {
    setSelectedFormats([]);
    setSelectedStatus("");
    setStartDate("");
    setEndDate("");
  };

  const filtered = tournaments.filter(t => {
    if (selectedFormats.length > 0) {
      const gameInfo = getTournamentGameInfo(t);
      if (!selectedFormats.includes(gameInfo.key)) return false;
    }
    if (selectedStatus && t.status !== selectedStatus) return false;
    if (startDate && new Date(t.startDate) < new Date(startDate)) return false;
    if (endDate && new Date(t.startDate) > new Date(endDate)) return false;
    return true;
  });

  return (
    <>
      <Navigation />
      <main className="max-w-container-max mx-auto px-md py-lg min-h-screen">
        <div className="flex flex-col lg:flex-row gap-lg text-left">

          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white p-md border-4 border-primary neo-brutalist-shadow-sm sticky top-[120px]">
              <div className="flex items-center justify-between mb-sm border-b-2 border-primary pb-xs select-none">
                <h2 className="font-headline-md text-headline-md text-primary uppercase italic">Filters</h2>
                <button onClick={handleReset} className="text-primary font-label-lg text-label-lg hover:underline underline-offset-4 font-bold">
                  RESET
                </button>
              </div>

              {/* Format Filter */}
              <div className="mb-md mt-sm select-none">
                <h3 className="font-title-lg text-title-lg text-primary mb-xs uppercase font-black italic">Format</h3>
                <div className="space-y-sm">
                  {[
                    { label: "VGC (Video Game)", key: "VGC", img: "/vgc.png", color: "bg-accent-blue/10" },
                    { label: "TCG (Trading Card)", key: "TCG", img: "/tcg.png", color: "bg-primary/5" },
                    { label: "Pokémon GO", key: "GO", img: "/pogo.png", color: "bg-accent-red/10" },
                    { label: "Free Fire", key: "FREE_FIRE", img: "/free_fire.png", color: "bg-accent-yellow/10" },
                  ].map(({ label, key, img, color }) => {
                    const isSelected = selectedFormats.includes(key);
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => toggleFormat(key)}
                        className={`w-full text-left border-4 border-primary flex flex-row items-center transition-all duration-150 relative overflow-hidden group active:translate-x-[2px] active:translate-y-[2px] cursor-pointer h-14 ${
                          isSelected
                            ? "bg-accent-yellow shadow-none translate-x-[2px] translate-y-[2px]"
                            : "bg-white shadow-[4px_4px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1a1a1a]"
                        }`}
                      >
                        {/* Game Image */}
                        <div className={`relative h-full w-20 shrink-0 ${color} border-r-2 border-primary overflow-hidden`}>
                          <Image
                            src={img}
                            alt={label}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1"
                            sizes="80px"
                          />
                        </div>
                        {/* Card Label */}
                        <div className="px-sm py-1 flex items-center justify-between flex-grow">
                          <span className="font-bold text-[10px] uppercase tracking-tight text-primary leading-tight line-clamp-2">
                            {label}
                          </span>
                          <span className={`border-2 border-primary flex items-center justify-center w-5 h-5 shrink-0 ${
                            isSelected ? "bg-primary text-white" : "bg-white"
                          }`}>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 stroke-white stroke-[4] fill-none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter */}
              <div className="mb-md select-none">
                <h3 className="font-title-lg text-title-lg text-primary mb-xs uppercase">Status</h3>
                <div className="flex flex-wrap gap-xs">
                  {[
                    { label: "Open", val: "REGISTRATION_OPEN" },
                    { label: "Upcoming", val: "UPCOMING" },
                    { label: "Ongoing", val: "ONGOING" },
                    { label: "Completed", val: "COMPLETED" },
                  ].map(({ label, val }) => (
                    <button
                      key={val}
                      onClick={() => setSelectedStatus(s => s === val ? "" : val)}
                      className={`px-sm py-base border-2 border-primary font-label-lg text-label-lg uppercase font-bold transition-all ${
                        selectedStatus === val
                          ? "bg-primary text-white"
                          : "bg-white text-primary hover:bg-accent-yellow"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div>
                <h3 className="font-title-lg text-title-lg text-primary mb-xs uppercase">Date</h3>
                <div className="space-y-xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-white border-2 border-primary px-sm py-xs font-body-md text-body-md outline-none uppercase font-bold"
                  />
                  <p className="text-center font-label-lg text-label-lg font-bold select-none">TO</p>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-white border-2 border-primary px-sm py-xs font-body-md text-body-md outline-none uppercase font-bold"
                  />
                </div>
              </div>

            </div>
          </aside>

          {/* Main Grid */}
          <div className="flex-grow">
            <header className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-md border-b-4 border-primary pb-md select-none">
              <div>
                <h1 className="font-display-lg text-display-lg text-primary uppercase italic">Tournaments</h1>
                <p className="font-body-lg text-body-lg text-primary font-medium mt-xs max-w-[576px]">
                  JOIN THE COMPETITIVE CIRCUIT AND PROVE YOU'RE THE VERY BEST.
                </p>
              </div>
              {!loading && !error && (
                <div className="flex items-center gap-xs font-label-lg text-label-lg text-white bg-black px-md py-xs border-2 border-black">
                  <span>SHOWING {filtered.length} / {tournaments.length} EVENTS</span>
                </div>
              )}
            </header>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4 text-primary">
                <span className="material-symbols-outlined animate-spin text-5xl font-bold">progress_activity</span>
                <p className="font-black uppercase text-sm tracking-widest">Loading tournaments…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <span className="material-symbols-outlined text-5xl text-accent-red font-bold">error</span>
                <p className="font-black uppercase text-sm tracking-widest text-primary">{error}</p>
                <button onClick={() => window.location.reload()} className="px-lg py-md bg-white border-4 border-primary text-primary font-black uppercase neo-brutalist-shadow active:translate-y-1">Retry</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-md">
                
                {filtered.length > 0 ? (
                  filtered.map(t => {
                    const gameInfo = getTournamentGameInfo(t);
                    const stat = STATUS_LABEL[t.status] || { label: t.status, color: "text-primary/70" };
                    const used = t._count?.registrations ?? 0;
                    const cap = Math.min(100, Math.round((used / t.maxPlayers) * 100));
                    const isGoldBorder = t.entryFee > 25;
                    const currencySymbol = t.currency === "INR" ? "₹" : "$";

                    return (
                      <article key={t.id} className="bg-white border-4 border-primary neo-brutalist-shadow-hover transition-all flex flex-col">
                        <div className="relative h-48 border-b-4 border-primary bg-surface-dim">
                          <Image
                            src={t.banner || BANNER_FALLBACK}
                            alt={t.title}
                            fill
                            className="object-cover grayscale contrast-125"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 30vw"
                          />
                          <div className="absolute top-0 right-0 flex select-none">
                            <span className={`${gameInfo.bg} px-sm py-base border-l-4 border-b-4 border-primary font-label-lg text-label-lg uppercase`}>
                              {gameInfo.label}
                            </span>
                            <span className={`bg-white text-primary px-sm py-base border-l-4 border-b-4 border-primary font-label-lg text-label-lg uppercase italic font-bold`}>
                              {isGoldBorder ? "International" : "Regional"}
                            </span>
                          </div>
                        </div>

                        <div className="p-sm flex-grow flex flex-col justify-between">
                          <div>
                            <h3 className="font-headline-md text-headline-md text-primary mb-sm leading-tight uppercase line-clamp-2">
                              {t.title}
                            </h3>

                            <div className="grid grid-cols-1 gap-y-xs mb-md font-bold uppercase text-body-md text-primary">
                              <div className="flex items-center gap-xs">
                                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                <span>{new Date(t.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              </div>
                              <div className="flex items-center gap-xs text-accent-red">
                                <span className="material-symbols-outlined text-[18px]">trophy</span>
                                <span>{currencySymbol}{t.prizePool.toLocaleString()} Pool</span>
                              </div>
                              <div className="flex items-center gap-xs">
                                <span className="material-symbols-outlined text-[18px]">group</span>
                                <span>{t.maxPlayers - used} / {t.maxPlayers} Slots Left</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto">
                            <div className="w-full bg-surface-container-high border-2 border-primary h-4 mb-xs">
                              <div className="bg-accent-red h-full border-r-2 border-primary" style={{ width: `${cap}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center select-none mb-sm">
                              <p className={`font-label-lg text-label-lg ${stat.color} uppercase italic`}>{stat.label}</p>
                              {cap >= 90 && <p className="font-label-lg text-label-lg text-accent-red font-black uppercase italic">Almost Full!</p>}
                            </div>
                            <Link href={`/tournaments/${t.id}`} className="w-full text-center py-3 bg-accent-yellow border-2 border-primary text-primary font-black uppercase neo-brutalist-shadow-sm hover:translate-y-[-2px] transition-all block select-none">
                              Join Tournament
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-32 text-center gap-4 bg-white border-4 border-dashed border-primary">
                    <span className="material-symbols-outlined text-7xl text-primary/30">emoji_events</span>
                    <h3 className="font-title-lg text-primary font-bold uppercase italic">No Tournaments Found</h3>
                    <p className="text-primary/60 font-bold uppercase text-xs max-w-[384px]">
                      Try adjusting or resetting your filter criteria.
                    </p>
                    <button onClick={handleReset} className="px-lg py-md bg-white border-4 border-primary text-primary font-black uppercase neo-brutalist-shadow active:translate-y-1">
                      Reset Filters
                    </button>
                  </div>
                )}

                {/* More coming teaser */}
                {filtered.length > 0 && (
                  <article className="bg-surface-container-high border-4 border-dashed border-primary flex flex-col items-center justify-center p-lg text-center select-none">
                    <div className="w-16 h-16 bg-black flex items-center justify-center mb-sm">
                      <span className="material-symbols-outlined text-white text-[40px]">add</span>
                    </div>
                    <h3 className="font-title-lg text-title-lg text-primary mb-xs uppercase italic">More Events</h3>
                    <p className="font-body-md text-body-md text-primary font-medium uppercase">Stay tuned for the 2025 schedule.</p>
                  </article>
                )}

              </div>
            )}

            {/* Pagination */}
            {!loading && !error && filtered.length > 0 && (
              <div className="mt-xl flex items-center justify-center gap-xs select-none">
                <button className="w-12 h-12 flex items-center justify-center border-4 border-primary hover:bg-black hover:text-white transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                </button>
                <button className="w-12 h-12 flex items-center justify-center border-4 border-primary bg-black text-white font-title-lg uppercase">1</button>
                <button className="w-12 h-12 flex items-center justify-center border-4 border-primary hover:bg-black hover:text-white font-title-lg uppercase transition-all">2</button>
                <button className="w-12 h-12 flex items-center justify-center border-4 border-primary hover:bg-black hover:text-white font-title-lg uppercase transition-all">3</button>
                <span className="px-xs text-primary font-black">...</span>
                <button className="w-12 h-12 flex items-center justify-center border-4 border-primary hover:bg-black hover:text-white font-title-lg uppercase transition-all">12</button>
                <button className="w-12 h-12 flex items-center justify-center border-4 border-primary hover:bg-black hover:text-white transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
