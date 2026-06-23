"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { logoutTrainer } from "@/app/actions/authActions";

export default function Profile() {
  const [profileData, setProfileData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = () => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setProfileData(data.user);
          


          // Parse match history from DB
          if (data.matches && data.matches.length > 0) {
            const mappedHistory = data.matches.map((m: any) => {
              const isWinner = m.winnerId === data.user.id;
              return {
                event: m.tournament?.title || "Tournament Match",
                date: new Date(m.tournament?.startDate || m.updatedAt).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                }).replace(/\//g, "."),
                rank: isWinner ? "Win" : "Loss",
                points: isWinner ? "+15 CP" : "-10 CP",
                isWin: isWinner,
              };
            });
            setHistory(mappedHistory);
          } else {
            setHistory([]);
          }
        }
      })
      .catch((err) => console.log("Failed to fetch trainer profile", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);



  const trainerName = profileData?.name || "Trainer";
  const trainerId = profileData?.trainerId?.slice(0, 8) || "—";
  const elo = profileData?.elo ?? 1000;
  const wins = profileData?.wins ?? 0;
  const losses = profileData?.losses ?? 0;
  const image = profileData?.image || null;

  const earnedBadges = profileData?.wonTournaments
    ?.filter((t: any) => t.badgeName)
    .map((t: any) => ({
      name: t.badgeName,
      icon: t.badgeIcon || "workspace_premium",
    })) || [];

  return (
    <>
      <Navigation />

      <main className="max-w-container-max mx-auto px-md py-xl space-y-xl">
        {/* Loading overlay */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-primary">
            <span className="material-symbols-outlined animate-spin text-5xl">progress_activity</span>
            <p className="text-lg font-bold uppercase tracking-wider">Loading profile…</p>
          </div>
        ) : (
          <>
            {/* ── Main Trainer Card Box ── */}
            <section>
              <div className="border-4 border-primary neo-brutalist-shadow flex flex-col md:flex-row bg-white relative">
                
                {/* ID Card Chip Decoration */}
                <div className="absolute -top-4 -right-4 bg-accent-yellow border-2 border-primary px-4 py-2 flex items-center gap-2 z-10">
                  <span className="font-bold text-xs uppercase tracking-widest text-primary">
                    ID: {trainerId}
                  </span>
                </div>

                {/* Left Side: Avatar & Name */}
                <div className="md:w-2/5 p-lg flex flex-col items-center md:items-start border-b-4 md:border-b-0 md:border-r-4 border-primary bg-white text-center md:text-left">
                  <div className="relative w-full max-w-[280px] mx-auto md:max-w-none md:mx-0 aspect-square border-4 border-primary mb-md overflow-hidden bg-surface-container-low select-none">
                    {image ? (
                      <Image
                        src={image}
                        alt={trainerName}
                        fill
                        className="object-cover grayscale contrast-125"
                        sizes="384px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-7xl text-primary bg-accent-yellow/20 select-none">
                        {trainerName[0]}
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4 bg-white border-2 border-primary px-3 py-1 font-bold text-xs uppercase text-primary">
                      Verified Unit
                    </div>
                  </div>
                  
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase leading-none tracking-tighter mb-2 text-primary">
                    Trainer {trainerName}
                  </h1>
                  <p className="text-xl font-medium uppercase text-primary opacity-60">
                    Established 2024
                  </p>

                  <button
                    onClick={async () => {
                      try {
                        await logoutTrainer();
                      } catch (err) {
                        console.error("Sign out failed", err);
                      }
                    }}
                    className="mt-md bg-accent-red text-white border-4 border-primary px-4 py-2 font-black uppercase tracking-widest hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:translate-x-0 active:translate-y-0 text-xs shrink-0 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Right Side: Stats & Info */}
                <div className="md:w-3/5 flex flex-col justify-stretch">
                  
                  <div className="p-lg flex flex-col justify-between group hover:bg-accent-yellow transition-colors duration-150 flex-grow">
                    <span className="font-black text-xs uppercase tracking-widest text-primary mb-4 block">Rank Status</span>
                    <div className="space-y-4">
                      <span className="text-4xl sm:text-5xl font-black uppercase block italic text-primary leading-none">
                        {elo > 1500 ? "Grand Master" : elo > 1200 ? "Veteran Tier" : "Ace Tier"}
                      </span>
                      <div className="flex flex-wrap gap-sm pt-2">
                        <span className="bg-primary text-white inline-block px-3 py-1.5 text-xs font-bold uppercase">
                          ELO Rating: {elo.toLocaleString()}
                        </span>
                        <span className="border-2 border-primary inline-block px-3 py-1.5 text-xs font-bold uppercase">
                          Badges: {wins > 10 ? "08/08" : "04/08"}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </section>


            {/* ── Accolades and Mission Log Bento Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-sm">
              
              {/* Accolades (Badges) Column */}
              <div className="lg:col-span-1 space-y-md">
                <h3 className="text-2xl font-black uppercase italic border-b-2 border-primary pb-2 text-primary">Accolades</h3>
                {earnedBadges.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {earnedBadges.map((badge: any, idx: number) => (
                      <div 
                        key={idx}
                        title={`${badge.name} - Unlocked`}
                        className="aspect-square border-4 border-primary flex flex-col items-center justify-center bg-accent-yellow neo-brutalist-shadow-sm hover:scale-105 transition-all cursor-help group p-1"
                      >
                        <span className="material-symbols-outlined text-3xl text-primary group-hover:rotate-12 transition-transform">
                          {badge.icon}
                        </span>
                        <span className="text-[8px] font-black text-center uppercase tracking-tighter line-clamp-2 px-0.5 mt-1 text-primary break-words w-full leading-none">
                          {badge.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-4 border-dashed border-primary/45 p-md text-center bg-surface-container-low text-primary select-none flex flex-col items-center justify-center min-h-[160px]">
                    <span className="material-symbols-outlined text-5xl text-primary/30 mb-2">military_tech</span>
                    <span className="text-xs font-black uppercase">No Badges Unlocked</span>
                    <p className="text-[10px] text-primary/50 uppercase mt-1 font-bold">Win tournaments to earn accolades</p>
                  </div>
                )}
              </div>

              {/* Mission Log (Match History) Column */}
              <div className="lg:col-span-2 space-y-md">
                <h3 className="text-2xl font-black uppercase italic border-b-2 border-primary pb-2 text-primary">Mission Log</h3>
                <div className="border-4 border-primary neo-brutalist-shadow bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-primary text-white border-b-4 border-primary font-black uppercase text-xs tracking-wider select-none">
                          <th className="px-md py-4 border-r-2 border-white/20">Operation</th>
                          <th className="px-md py-4 border-r-2 border-white/20">Timestamp</th>
                          <th className="px-md py-4 border-r-2 border-white/20">Result</th>
                          <th className="px-md py-4 text-right">Yield</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-4 divide-primary bg-white font-bold">
                        {history.length > 0 ? (
                          history.map((item, idx) => {
                            const rowHoverCls = item.isWin 
                              ? "hover:bg-accent-yellow" 
                              : "hover:bg-accent-blue hover:text-white";
                            
                            return (
                              <tr 
                                key={idx} 
                                className={`trainer-row border-b-4 border-primary transition-colors cursor-pointer ${rowHoverCls}`}
                              >
                                <td className="px-md py-4 font-black uppercase">{item.event}</td>
                                <td className="px-md py-4 text-sm uppercase tracking-wider">{item.date}</td>
                                <td className="px-md py-4">
                                  <span className={`px-3 py-1 font-black text-xs uppercase ${
                                    item.isWin 
                                      ? "bg-primary text-white" 
                                      : "border-2 border-primary text-primary bg-white"
                                  }`}>
                                    Pos. {item.rank === "Win" ? "#01" : "#04"}
                                  </span>
                                </td>
                                <td className="px-md py-4 text-right font-black text-lg">{item.points}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center py-12 text-primary font-black uppercase italic select-none">
                              <span className="material-symbols-outlined text-4xl block mb-2 text-primary">history</span>
                              No operations logged yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}

export const dynamic = "force-dynamic";
