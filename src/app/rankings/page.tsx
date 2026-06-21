"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

interface LeaderboardEntry {
  rank: number;
  name: string;
  region: string;
  tier: "World Champion" | "Champion" | "Elite Four" | "Veteran" | "Ace" | "Trainer" | "Rookie";
  elo: number;
  winRate: string;
  winPercent: number;
  wins: number;
  bgClass: string;
  avatarLetter: string;
}

export default function Rankings() {
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [sortBy, setSortBy] = useState("Highest ELO");
  const [searchQuery, setSearchQuery] = useState("");

  const podiumData = {
    first: {
      name: "RedMaster",
      elo: 3015,
      wins: 18,
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkQGpw_0jSF64iFmbyzkB9-Qcceh2uzIOJvLXZZvffb6yOynjwapSj5_DlFqCjV1QsVKA82T6dc1_kWDYJ51RFe28NEe8gBToTJdvSWUpU3He-rGrwFKPOIhkyrKrQs1oB1-nIcEblhw9klBFS8XpZ9cnZ-nQ6oyJUMK-oGQuADaDHcE68RbBF-21lLDAIOZCgsn1RtYzzTwCrt6EAmIyO2AjpAab7e6Zuqf4tPb6IaDtrJT2STVkaN-aXwNGy3XNZZ3PDSrpUgg8",
    },
    second: {
      name: "CynthiaVGC",
      elo: 2842,
      wins: 12,
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCv3AhPoLCqLsBINpEt9A5mhdRplke7b-_HzunL8tmNA9MueRxc1UkBFzLSZygTJYlSEbM4Dv0N73K8tPwx4PtkPP2pt_jGYxMnwncSgHf4ebU0rryIrkCYSJsRnOlVqSYeWq-XsXYRLS8cl1AeDZRt9BcamGsqdqA4LcFpWYC3H6YuHGl-fh8Epau1hkCRbs79E53BPJdGlhhQKfNkujYMsQGFDuE1EZ4zlAq2NaTMR5ke3OQpNgakG732mUsiR_sE0YpBX5e3jUE",
    },
    third: {
      name: "BlueRival",
      elo: 2795,
      wins: 9,
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIlcD__S8XZVZdIvS9p60cTKIkBbCY7K41GJ24Aku-p60aXG_jz0IzdhTVH2xX5j2dKYX-r0M32MLDK0iH5igX58_rMHkT1SnQFx-WytW4lFabGA_3U6fBUx_Yd4fCt6O13TwsMH1YLwFD4iXZft0Jfw2lcbefyuqJnzdOs_yaKdRqhOuMBTUDzWBmf8BEe_Y2oOD69QSPnkuYFpRIFUzU-LQMH9uPwOcLMGiJMn1wnoinkUVf-PVc0NtEgTYVoa3y51EjITn2EOk",
    },
  };

  const leaderboardData: LeaderboardEntry[] = [
    {
      rank: 4,
      name: "LeonChampion",
      region: "Europe",
      tier: "Elite Four",
      elo: 2654,
      winRate: "78%",
      winPercent: 78,
      wins: 7,
      bgClass: "bg-on-tertiary-fixed-variant text-white",
      avatarLetter: "L",
    },
    {
      rank: 5,
      name: "RaihanStorm",
      region: "Europe",
      tier: "Elite Four",
      elo: 2610,
      winRate: "74%",
      winPercent: 74,
      wins: 5,
      bgClass: "bg-on-tertiary-fixed-variant text-white",
      avatarLetter: "R",
    },
    {
      rank: 6,
      name: "LanceDragon",
      region: "North America",
      tier: "Veteran",
      elo: 2580,
      winRate: "72%",
      winPercent: 72,
      wins: 4,
      bgClass: "bg-outline text-white",
      avatarLetter: "L",
    },
    {
      rank: 7,
      name: "StevenStone",
      region: "Asia Pacific",
      tier: "Veteran",
      elo: 2555,
      winRate: "71%",
      winPercent: 71,
      wins: 4,
      bgClass: "bg-outline text-white",
      avatarLetter: "S",
    },
    {
      rank: 8,
      name: "WallaceSoar",
      region: "Asia Pacific",
      tier: "Veteran",
      elo: 2540,
      winRate: "69%",
      winPercent: 69,
      wins: 3,
      bgClass: "bg-outline text-white",
      avatarLetter: "W",
    },
    {
      rank: 9,
      name: "DianthaStar",
      region: "Europe",
      tier: "Veteran",
      elo: 2525,
      winRate: "68%",
      winPercent: 68,
      wins: 3,
      bgClass: "bg-outline text-white",
      avatarLetter: "D",
    },
    {
      rank: 10,
      name: "AlderOak",
      region: "Latin America",
      tier: "Veteran",
      elo: 2510,
      winRate: "68%",
      winPercent: 68,
      wins: 2,
      bgClass: "bg-outline text-white",
      avatarLetter: "A",
    },
  ];

  // Filtering based on region and search query
  const filteredData = leaderboardData.filter((entry) => {
    const matchesRegion = selectedRegion === "All Regions" || entry.region === selectedRegion;
    const matchesSearch = entry.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "Highest ELO") return b.elo - a.elo;
    if (sortBy === "Most Wins") return b.wins - a.wins;
    if (sortBy === "Win Rate") return b.winPercent - a.winPercent;
    return 0;
  });

  return (
    <>
      <Navigation />

      <main className="max-w-container-max mx-auto px-md py-lg">
        {/* World Leaderboards Header */}
        <header className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant/30 pb-md">
          <div className="select-none">
            <div className="flex items-center gap-xs mb-xs">
              <span className="bg-tertiary-fixed text-on-tertiary-fixed px-xs py-0.5 rounded text-label-lg font-label-lg font-bold shadow-sm">
                OFFICIAL SERIES
              </span>
              <span className="text-on-surface-variant font-label-lg text-label-lg font-semibold">
                SEASON 2024
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold leading-tight">
              World Leaderboards
            </h1>
            <p className="text-on-surface-variant font-body-lg mt-xs">
              The top 100 Pokémon Trainers in the world, ranked by ELO and tournament performance.
            </p>
          </div>

          {/* Quick bento stats summary */}
          <div className="flex gap-sm select-none">
            <div className="bg-white p-sm rounded-xl border border-outline-variant shadow-sm flex items-center gap-sm min-w-[160px]">
              <div className="w-10 h-10 rounded-full bg-tertiary-fixed-dim flex items-center justify-center text-tertiary shadow-sm">
                <span className="material-symbols-outlined text-[20px]">groups</span>
              </div>
              <div>
                <p className="text-[10px] font-label-lg text-on-surface-variant uppercase tracking-wider font-bold">
                  ACTIVE TRAINERS
                </p>
                <p className="font-title-lg text-title-lg font-bold text-on-surface">12,482</p>
              </div>
            </div>
            <div className="bg-white p-sm rounded-xl border border-outline-variant shadow-sm flex items-center gap-sm min-w-[160px]">
              <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-primary shadow-sm">
                <span className="material-symbols-outlined text-[20px]">emoji_events</span>
              </div>
              <div>
                <p className="text-[10px] font-label-lg text-on-surface-variant uppercase tracking-wider font-bold">
                  PRIZE POOL
                </p>
                <p className="font-title-lg text-title-lg font-bold text-on-surface">$250,000</p>
              </div>
            </div>
          </div>
        </header>

        {/* Podium visualization */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl select-none max-w-4xl mx-auto pt-sm items-end">
          {/* Podium Rank 2 - Cynthia */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-2 md:order-1 bg-white rounded-xl border-t-4 border-[#A8A8A8] p-md shadow-md flex flex-col items-center text-center hover:shadow-lg transition-shadow border border-outline-variant/30"
          >
            <div className="relative mb-md">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#A8A8A8] p-1 relative shadow-inner bg-surface">
                <Image
                  src={podiumData.second.avatarUrl}
                  alt={podiumData.second.name}
                  fill
                  className="object-cover rounded-full"
                  sizes="96px"
                />
              </div>
              <div className="absolute -bottom-2 right-0 bg-[#A8A8A8] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white">
                2
              </div>
            </div>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
              {podiumData.second.name}
            </h3>
            <span className="text-[10px] font-label-lg px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary mb-md font-bold uppercase shadow-sm">
              CHAMPION
            </span>
            <div className="flex gap-lg w-full border-t border-outline-variant/30 pt-md select-none font-semibold text-[13px]">
              <div className="flex-1">
                <p className="text-on-surface-variant font-medium">ELO</p>
                <p className="font-title-lg text-title-lg font-bold text-on-surface">
                  {podiumData.second.elo}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-on-surface-variant font-medium">WINS</p>
                <p className="font-title-lg text-title-lg font-bold text-on-surface">
                  {podiumData.second.wins}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Podium Rank 1 - RedMaster */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="order-1 md:order-2 bg-white rounded-xl border-t-4 border-gold-accent p-md shadow-lg flex flex-col items-center text-center transform md:scale-105 z-10 hover:shadow-xl transition-all relative overflow-hidden border border-outline-variant/30 pb-lg"
          >
            <div className="absolute top-0 right-0 p-xs">
              <span className="material-symbols-outlined text-gold-accent text-4xl material-symbols-fill">
                workspace_premium
              </span>
            </div>
            <div className="relative mb-md">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gold-accent p-1 relative shadow-inner bg-surface">
                <Image
                  src={podiumData.first.avatarUrl}
                  alt={podiumData.first.name}
                  fill
                  priority
                  className="object-cover rounded-full"
                  sizes="128px"
                />
              </div>
              <div className="absolute -bottom-2 right-2 bg-gold-accent text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl border-2 border-white">
                1
              </div>
            </div>
            <h3 className="font-headline-md text-headline-md font-bold text-tertiary">
              {podiumData.first.name}
            </h3>
            <span className="text-[10px] font-label-lg px-2.5 py-1 rounded-full bg-tertiary/20 text-tertiary font-bold mb-md uppercase tracking-wider shadow-sm">
              WORLD CHAMPION
            </span>
            <div className="flex gap-lg w-full border-t border-outline-variant/30 pt-md select-none font-semibold text-[13px]">
              <div className="flex-1">
                <p className="text-on-surface-variant font-medium">ELO</p>
                <p className="font-title-lg text-title-lg font-bold text-tertiary">
                  {podiumData.first.elo}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-on-surface-variant font-medium">WINS</p>
                <p className="font-title-lg text-title-lg font-bold text-tertiary">
                  {podiumData.first.wins}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Podium Rank 3 - BlueRival */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-3 md:order-3 bg-white rounded-xl border-t-4 border-[#CD7F32] p-md shadow-md flex flex-col items-center text-center hover:shadow-lg transition-shadow border border-outline-variant/30"
          >
            <div className="relative mb-md">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#CD7F32] p-1 relative shadow-inner bg-surface">
                <Image
                  src={podiumData.third.avatarUrl}
                  alt={podiumData.third.name}
                  fill
                  className="object-cover rounded-full"
                  sizes="96px"
                />
              </div>
              <div className="absolute -bottom-2 right-0 bg-[#CD7F32] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white">
                3
              </div>
            </div>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
              {podiumData.third.name}
            </h3>
            <span className="text-[10px] font-label-lg px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary mb-md font-bold uppercase shadow-sm">
              CHAMPION
            </span>
            <div className="flex gap-lg w-full border-t border-outline-variant/30 pt-md select-none font-semibold text-[13px]">
              <div className="flex-1">
                <p className="text-on-surface-variant font-medium">ELO</p>
                <p className="font-title-lg text-title-lg font-bold text-on-surface">
                  {podiumData.third.elo}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-on-surface-variant font-medium">WINS</p>
                <p className="font-title-lg text-title-lg font-bold text-on-surface">
                  {podiumData.third.wins}
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Ranking List Table card */}
        <section className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          {/* Table Header Filter options */}
          <div className="p-md border-b border-outline-variant flex flex-col md:flex-row justify-between items-center gap-md select-none">
            <div className="flex gap-sm overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
              {["All Regions", "North America", "Europe", "Asia Pacific", "Latin America"].map((region) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-sm py-xs rounded-full text-body-md font-medium transition-all ${
                    selectedRegion === region
                      ? "bg-tertiary text-on-tertiary shadow-sm font-semibold"
                      : "hover:bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-md justify-between w-full md:w-auto">
              <div className="relative w-48 sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Trainers..."
                  className="w-full pl-10 pr-4 py-1.5 border border-outline-variant rounded-full text-body-md focus:ring-2 focus:ring-tertiary outline-none bg-surface-container-low"
                />
                <span className="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant text-[18px]">
                  search
                </span>
              </div>

              <div className="flex items-center gap-xs text-on-surface-variant shrink-0">
                <span className="text-body-md font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-surface border border-outline-variant rounded-lg text-sm px-sm py-1.5 focus:ring-tertiary focus:border-tertiary outline-none font-medium"
                >
                  <option>Highest ELO</option>
                  <option>Most Wins</option>
                  <option>Win Rate</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant uppercase text-label-lg tracking-widest border-b border-outline-variant font-bold select-none">
                  <th className="px-lg py-sm">Rank</th>
                  <th className="px-lg py-sm">Trainer</th>
                  <th className="px-lg py-sm">Tier</th>
                  <th className="px-lg py-sm">ELO Rating</th>
                  <th className="px-lg py-sm">W / L Ratio</th>
                  <th className="px-lg py-sm text-right">Tournament Wins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {sortedData.length > 0 ? (
                  sortedData.map((entry) => (
                    <tr
                      key={entry.rank}
                      className="trainer-row transition-all duration-200 hover:bg-surface-container-low hover:shadow-inner cursor-pointer"
                    >
                      <td className="px-lg py-md font-bold text-on-surface-variant select-none">
                        #{entry.rank}
                      </td>
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-sm">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-body-md border border-outline-variant/30 select-none shadow-sm ${entry.bgClass}`}
                          >
                            {entry.avatarLetter}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface leading-tight">{entry.name}</p>
                            <p className="text-xs text-on-surface-variant font-medium">{entry.region}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-lg py-md select-none">
                        <span className="bg-on-tertiary-fixed-variant text-white px-xs py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm border border-tertiary/20">
                          {entry.tier}
                        </span>
                      </td>
                      <td className="px-lg py-md font-bold text-on-surface select-none">
                        {entry.elo.toLocaleString()}
                      </td>
                      <td className="px-lg py-md">
                        <div className="flex flex-col select-none">
                          <span className="text-body-md font-bold text-on-surface">{entry.winRate}</span>
                          <div className="flex mt-1 w-20">
                            <div
                              className="h-1 bg-tertiary rounded-full"
                              style={{ width: `${entry.winPercent}%` }}
                            ></div>
                            <div
                              className="h-1 bg-outline-variant rounded-full ml-1"
                              style={{ width: `${100 - entry.winPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-lg py-md text-right font-headline-md text-tertiary font-bold select-none">
                        {entry.wins}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-lg font-body-md text-on-surface-variant">
                      No trainers match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination */}
          <div className="p-md bg-surface-container-low border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-md select-none">
            <p className="text-body-md text-on-surface-variant font-medium">
              Showing 1 to {sortedData.length} of 100 entries
            </p>
            <div className="flex items-center gap-xs">
              <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant bg-white disabled:opacity-50 active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded bg-tertiary text-on-tertiary font-bold">
                1
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant bg-white hover:bg-surface-container-low font-semibold active:scale-90 transition-transform">
                2
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant bg-white hover:bg-surface-container-low font-semibold active:scale-90 transition-transform">
                3
              </button>
              <span className="px-xs text-on-surface-variant font-bold">...</span>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant bg-white hover:bg-surface-container-low font-semibold active:scale-90 transition-transform">
                10
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant bg-white hover:bg-surface-container-low active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        {/* ELO Tier Legend */}
        <section className="mt-lg grid grid-cols-2 md:grid-cols-6 gap-sm select-none">
          {[
            { name: "ROOKIE", range: "0-1000 ELO", color: "bg-slate-300" },
            { name: "TRAINER", range: "1001-1500 ELO", color: "bg-green-500" },
            { name: "ACE", range: "1501-2000 ELO", color: "bg-blue-500" },
            { name: "VETERAN", range: "2001-2500 ELO", color: "bg-purple-500" },
            { name: "ELITE FOUR", range: "2501-2800 ELO", color: "bg-red-600" },
            { name: "CHAMPION", range: "2801+ ELO", color: "bg-amber-400" },
          ].map((tier, index) => (
            <div
              key={index}
              className="p-sm bg-white rounded-lg border border-outline-variant flex flex-col items-center shadow-sm hover:scale-[1.02] transition-transform"
            >
              <span className={`w-3 h-3 rounded-full mb-xs shadow-sm ${tier.color}`}></span>
              <p className="text-label-lg font-bold text-on-surface">{tier.name}</p>
              <p className="text-[10px] text-on-surface-variant font-semibold tracking-wider">{tier.range}</p>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </>
  );
}
