"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

interface Player {
  id: string;
  name: string | null;
  image: string | null;
  elo: number;
  wins: number;
  losses: number;
  role: string;
}

function getTier(elo: number) {
  if (elo >= 2800) return { label: "Champion", cls: "bg-accent-yellow text-primary border-2 border-primary font-black uppercase italic text-[10px] tracking-widest" };
  if (elo >= 2500) return { label: "Elite Four", cls: "bg-accent-red text-white border-2 border-primary font-black uppercase italic text-[10px] tracking-widest" };
  if (elo >= 2000) return { label: "Veteran", cls: "border-2 border-primary text-primary font-black uppercase italic text-[10px] tracking-widest" };
  if (elo >= 1500) return { label: "Ace", cls: "bg-accent-blue text-white border-2 border-primary font-black uppercase italic text-[10px] tracking-widest" };
  if (elo >= 1000) return { label: "Trainer", cls: "bg-accent-yellow/20 text-primary border-2 border-primary font-black uppercase italic text-[10px] tracking-widest" };
  return { label: "Rookie", cls: "bg-white text-primary border-2 border-primary font-black uppercase italic text-[10px] tracking-widest" };
}

const TIERS = [
  { name: "ROOKIE", range: "0–1000 ELO", color: "bg-white", borderCls: "border-2 border-primary" },
  { name: "TRAINER", range: "1001–1500 ELO", color: "bg-accent-yellow/20", borderCls: "border-2 border-primary" },
  { name: "ACE", range: "1501–2000 ELO", color: "bg-accent-blue/20", borderCls: "border-2 border-primary" },
  { name: "VETERAN", range: "2001–2500 ELO", color: "bg-white", borderCls: "border-4 border-primary" },
  { name: "ELITE FOUR", range: "2501–2800 ELO", color: "bg-accent-red text-white", borderCls: "border-2 border-primary" },
  { name: "CHAMPION", range: "2801+ ELO", color: "bg-accent-yellow", borderCls: "border-4 border-primary" },
];

function PlayerAvatar({ name, image, size = 12 }: { name: string | null; image: string | null; size?: number }) {
  const initial = (name || "T")[0].toUpperCase();

  if (image) {
    return (
      <Image
        src={image}
        alt={name || "Trainer"}
        width={size * 4}
        height={size * 4}
        className="w-full h-full object-cover"
        sizes={`${size * 4}px`}
        loading="lazy"
        quality={75}
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZjZjdmYyIvPjwvc3ZnPg=="
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center font-black text-primary select-none" style={{ fontSize: `${size}px` }}>
      {initial}
    </div>
  );
}

function PodiumPlayer({ player, rank, tierClass, size, delay = 0 }: {
  player: Player | undefined;
  rank: "01" | "02" | "03";
  tierClass: string;
  size: "sm" | "md" | "lg";
  delay?: number;
}) {
  const sizeConfig = {
    sm: { w: "w-32 h-32", border: "border-4", badge: "text-2xl py-2 px-4", name: "text-2xl", elo: "text-xl", wins: "text-xs" },
    md: { w: "w-40 h-40", border: "border-4", badge: "text-4xl py-3 px-8", name: "text-3xl", elo: "text-3xl", wins: "text-sm" },
    lg: { w: "w-48 h-48 sm:w-56 sm:h-56", border: "border-8", badge: "text-3xl py-2 px-4", name: "text-3xl", elo: "text-3xl", wins: "text-xs" },
  }[size];

  if (!player) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
        className={`order-2 md:order-1 bg-white border-4 border-primary neo-brutalist-shadow-hover p-lg flex flex-col items-center text-center relative opacity-40 ${size === "lg" ? "order-2 md:order-1" : "order-1 md:order-2"}`}
      >
        <div className="absolute top-0 left-0 bg-primary text-white px-4 py-2 font-black text-2xl">{rank}</div>
        <div className={`${sizeConfig.w} ${sizeConfig.border} border-primary flex items-center justify-center font-bold text-4xl text-primary bg-primary/10 select-none`}>
          {rank}
        </div>
        <p className="text-primary text-sm font-bold">—</p>
      </motion.div>
    );
  }

  const tier = getTier(player.elo);

  if (rank === "01") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay }}
        className="order-1 md:order-2 bg-accent-yellow border-4 border-primary neo-brutalist-shadow-hover p-lg flex flex-col items-center text-center relative md:scale-110 z-10"
      >
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-accent-red text-white border-4 border-primary px-6 py-2 font-black text-4xl">
          {rank}
        </div>
        <div className={`${sizeConfig.w} ${sizeConfig.border} border-primary overflow-hidden mb-md bg-white relative`}>
          <PlayerAvatar name={player.name} image={player.image} size={size === "lg" ? 14 : size === "md" ? 16 : 12} />
        </div>
        <h3 className="text-3xl font-black uppercase italic mb-1 text-primary">{player.name}</h3>
        <span className="bg-primary text-white px-4 py-1 font-bold text-sm uppercase tracking-widest mb-md">
          World Champion
        </span>
        <div className="grid grid-cols-2 w-full border-t-4 border-primary pt-md font-bold">
          <div className="border-r-2 border-primary">
            <p className="text-[10px] font-bold uppercase opacity-80">ELO</p>
            <p className="text-3xl font-black italic">{player.elo.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase opacity-80">Wins</p>
            <p className="text-3xl font-black italic">{player.wins}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={`${size === "lg" ? "order-3" : rank === "02" ? "order-2 md:order-1" : "order-1 md:order-2"} bg-white border-4 border-primary neo-brutalist-shadow-hover p-lg flex flex-col items-center text-center relative ${rank === "03" ? "order-3" : ""}`}
    >
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 bg-primary text-white ${sizeConfig.badge} font-black`}>
        {rank}
      </div>
      <div className={`${sizeConfig.w} ${sizeConfig.border} border-primary overflow-hidden mb-md bg-white relative`}>
        <PlayerAvatar name={player.name} image={player.image} size={size === "lg" ? 14 : size === "md" ? 16 : 12} />
      </div>
      <h3 className={`${sizeConfig.name} font-black uppercase italic mb-1 text-primary`}>{player.name}</h3>
      <span className={`${tier.cls} mb-md`}>
        {tier.label}
      </span>
      <div className="grid grid-cols-2 w-full border-t-2 border-primary pt-md font-bold">
          <p className="text-[10px] font-bold uppercase opacity-60">ELO</p>
          <p className={`${sizeConfig.elo} font-black`}>{player.elo}</p>
          <div>
            <p className="text-[10px] font-bold uppercase opacity-60">Wins</p>
            <p className={`${sizeConfig.elo} font-black`}>{player.wins}</p>
          </div>
        </div>
      </motion.div>
  );
}

function LeaderboardTable({ players }: { players: Player[] }) {
  const winRate = (p: Player) => {
    const total = p.wins + p.losses;
    return total > 0 ? Math.round((p.wins / total) * 100) : 0;
  };

  return (
    <section className="border-4 border-primary neo-brutalist-shadow bg-white overflow-hidden mb-xl">
      {/* Filters / Search / Sort */}
      <LeaderboardFilters />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-primary text-white uppercase text-xs font-black tracking-[0.2em] select-none border-b-2 border-primary">
              <th className="px-lg py-4 border-r-2 border-white/20">Rank</th>
              <th className="px-lg py-4 border-r-2 border-white/20">Trainer</th>
              <th className="px-lg py-4 border-r-2 border-white/20 text-center">Tier</th>
              <th className="px-lg py-4 border-r-2 border-white/20">ELO Rating</th>
              <th className="px-lg py-4 border-r-2 border-white/20">W / L Ratio</th>
              <th className="px-lg py-4 text-right">Tournament Wins</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-primary bg-white">
            {players.length > 0 ? (
              players.map((p, i) => {
                const tier = getTier(p.elo);
                const rate = winRate(p);
                const rank = i + 4;
                const formattedRank = rank < 10 ? `#0${rank}` : `#${rank}`;
                return (
                  <tr key={p.id} className="trainer-row hover:bg-surface-container transition-colors border-b-4 border-primary">
                    <td className="px-lg py-md font-black text-3xl italic text-primary select-none w-24">
                      {formattedRank}
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-12 h-12 border-2 border-primary relative bg-accent-yellow shrink-0 overflow-hidden">
                          <PlayerAvatar name={p.name} image={p.image} size={5} />
                        </div>
                        <div>
                          <p className="font-black text-xl uppercase tracking-tighter text-primary">
                            {p.name || "Trainer"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-lg py-md text-center select-none w-36">
                      <span className={`px-3 py-1 ${tier.cls}`}>
                        {tier.label}
                      </span>
                    </td>
                    <td className="px-lg py-md font-black text-2xl italic text-primary select-none w-36">
                      {p.elo.toLocaleString()}
                    </td>
                    <td className="px-lg py-md w-48">
                      <div className="flex flex-col">
                        <span className="text-xl font-black italic text-primary">{rate}%</span>
                        <div className="flex mt-1 border-2 border-primary h-2 w-24 bg-white overflow-hidden">
                          <div
                            className="bg-accent-blue h-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-primary opacity-60 mt-0.5">
                          {p.wins}W / {p.losses}L
                        </span>
                      </div>
                    </td>
                    <td className="px-lg py-md text-right font-black text-4xl italic text-accent-red select-none w-48">
                      {p.wins < 10 ? `0${p.wins}` : p.wins}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-12 text-primary font-black uppercase italic">
                  No trainers match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination */}
      <div className="p-md bg-white border-t-4 border-primary flex flex-col md:flex-row justify-between items-center gap-md">
        <p className="font-black uppercase tracking-widest text-xs italic">
          Showing 01 to {Math.min(10, players.length + 3)} of {players.length} entries
        </p>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 border-2 border-primary font-black hover:bg-accent-yellow transition-all flex items-center justify-center">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-10 h-10 bg-primary text-white font-black italic">1</button>
          <button className="w-10 h-10 border-2 border-primary font-black italic hover:bg-accent-yellow">2</button>
          <button className="w-10 h-10 border-2 border-primary font-black italic hover:bg-accent-yellow">3</button>
          <span className="px-2 font-black">...</span>
          <button className="w-10 h-10 border-2 border-primary font-black italic hover:bg-accent-yellow">10</button>
          <button className="w-10 h-10 border-2 border-primary font-black hover:bg-accent-yellow transition-all flex items-center justify-center">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function LeaderboardFilters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Highest ELO");

  return (
    <div className="p-md border-b-4 border-primary flex flex-col md:flex-row justify-between items-center gap-md select-none bg-white">
      <div className="relative w-full md:w-80 border-2 border-primary bg-white flex items-center px-sm py-1">
        <span className="material-symbols-outlined text-primary text-[20px]">search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="SEARCH TRAINERS..."
          className="w-full ml-xs border-none outline-none focus:ring-0 text-sm font-bold uppercase placeholder:opacity-50"
        />
      </div>
      <div className="flex items-center gap-xs text-primary shrink-0 w-full md:w-auto justify-between md:justify-start">
        <span className="text-xs font-black uppercase tracking-widest">Sort:</span>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-white border-2 border-primary font-black uppercase tracking-widest text-xs px-4 py-2 focus:ring-0 outline-none"
        >
          <option>Highest ELO</option>
          <option>Most Wins</option>
          <option>Win Rate</option>
        </select>
      </div>
    </div>
  );
}

function SquadStandings({ squads, loading }: { squads: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="p-xl text-center">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
        <p className="text-sm font-bold uppercase tracking-wider mt-sm">Calculating squad frequencies...</p>
      </div>
    );
  }

  return (
    <section className="border-4 border-primary neo-brutalist-shadow bg-white overflow-hidden mb-xl">
      <div className="p-md border-b-4 border-primary bg-accent-yellow flex justify-between items-center select-none">
        <h2 className="font-headline-md uppercase text-primary">Squad Leaderboard</h2>
        <span className="bg-primary text-white px-3 py-1 font-bold text-xs uppercase">Free Fire</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-primary text-white uppercase text-xs font-black tracking-[0.2em] select-none border-b-2 border-primary">
              <th className="px-lg py-4 border-r-2 border-white/20">Rank</th>
              <th className="px-lg py-4 border-r-2 border-white/20">Squad</th>
              <th className="px-lg py-4 border-r-2 border-white/20 text-center">Members</th>
              <th className="px-lg py-4 border-r-2 border-white/20">Average ELO</th>
              <th className="px-lg py-4 border-r-2 border-white/20">W / L Record</th>
              <th className="px-lg py-4 text-right">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-primary bg-white">
            {squads.length > 0 ? (
              squads.map((s, idx) => {
                const rankNum = idx + 1;
                const formattedRank = rankNum < 10 ? `#0${rankNum}` : `#${rankNum}`;
                const rate = s.wins + s.losses > 0 ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0;
                return (
                  <tr key={s.id} className="hover:bg-surface-container transition-colors border-b-4 border-primary">
                    <td className="px-lg py-md font-black text-3xl italic text-primary select-none w-24">
                      {formattedRank}
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-12 h-12 border-2 border-primary relative bg-accent-blue shrink-0 overflow-hidden">
                          {s.logo ? (
                            <Image
                              src={s.logo}
                              alt={s.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              sizes="48px"
                              loading="lazy"
                              quality={85}
                              placeholder="blur"
                              blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjwvc3ZnPg=="
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-lg text-white bg-primary select-none">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-xl uppercase tracking-tighter text-primary">
                            {s.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-lg py-md text-center select-none font-bold text-primary w-36">
                      {s.membersCount} Players
                    </td>
                    <td className="px-lg py-md font-black text-2xl italic text-primary select-none w-36">
                      {s.elo.toLocaleString()}
                    </td>
                    <td className="px-lg py-md w-48">
                      <div className="flex flex-col">
                        <span className="text-xl font-black italic text-primary">{rate}% WR</span>
                        <span className="text-[10px] font-bold text-primary opacity-60 mt-0.5">
                          {s.wins}W / {s.losses}L
                        </span>
                      </div>
                    </td>
                    <td className="px-lg py-md text-right font-black text-4xl italic text-accent-red select-none w-48">
                      {s.points}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-12 text-primary/60 font-black uppercase italic">
                  No squads registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Rankings() {
  const [activeTab, setActiveTab] = useState<"trainers" | "squads">("trainers");
  const [sortBy, setSortBy] = useState("Highest ELO");
  const [searchQuery, setSearchQuery] = useState("");
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [squads, setSquads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSquads, setLoadingSquads] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/users")
      .then(r => r.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setAllPlayers(data);
        } else {
          setError("Failed to load leaderboard data.");
        }
      })
      .catch(() => setError("Network error loading rankings."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "squads" && squads.length === 0) {
      setLoadingSquads(true);
      fetch("/api/squads/rankings")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSquads(data);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingSquads(false));
    }
  }, [activeTab, squads.length]);

  // Client-side filter + sort
  const filtered = useMemo(() => {
    return [...allPlayers]
      .filter(p => {
        if (searchQuery && !p.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "Highest ELO") return b.elo - a.elo;
        if (sortBy === "Most Wins") return b.wins - a.wins;
        if (sortBy === "Win Rate") {
          const rateA = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
          const rateB = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
          return rateB - rateA;
        }
        return 0;
      });
  }, [allPlayers, searchQuery, sortBy]);

  const podiumPlayers = useMemo(() => filtered.slice(0, 3), [filtered]);
  const tableRows = useMemo(() => filtered.slice(3), [filtered]);

  const totalWins = useMemo(() => allPlayers.reduce((s, p) => s + p.wins, 0), [allPlayers]);

  return (
    <>
      <Navigation />
      <main className="max-w-container-max mx-auto px-md py-xl">
        {/* Header */}
        <header className="mb-xl flex flex-col md:flex-row md:items-start justify-between gap-xl">
          <div className="max-w-[672px] select-none">
            <div className="flex items-center gap-xs mb-sm">
              <span className="bg-accent-yellow border-2 border-primary text-primary px-2 py-0.5 font-bold uppercase text-xs">
                Official Series
              </span>
              <span className="border-2 border-primary px-2 py-0.5 font-bold uppercase text-xs">
                Season 2026
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tighter mb-md text-primary">
              World<br />Leaderboards
            </h1>
            <p className="text-lg font-medium border-l-8 border-accent-red pl-md max-w-[512px] text-primary">
              The top Pokémon Trainers ranked by ELO and tournament performance.
            </p>
          </div>

          {/* Live stat pills */}
          {!loading && !error && (
            <div className="flex flex-col gap-sm shrink-0 w-full md:w-auto md:min-w-[240px] select-none">
              <div className="bg-accent-blue text-white border-4 border-primary neo-brutalist-shadow p-md flex items-center gap-md">
                <span className="material-symbols-outlined text-4xl">groups</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Active Trainers</p>
                  <p className="text-3xl font-black italic">{allPlayers.length.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-accent-yellow text-primary border-4 border-primary neo-brutalist-shadow p-md flex items-center gap-md">
                <span className="material-symbols-outlined text-4xl">emoji_events</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Wins</p>
                  <p className="text-3xl font-black italic">{totalWins.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Loading / Error */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-primary">
            <span className="material-symbols-outlined animate-spin text-5xl">progress_activity</span>
            <p className="text-lg font-bold uppercase tracking-wider">Loading rankings…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 border-4 border-primary p-xl bg-white neo-brutalist-shadow max-w-[448px] mx-auto">
            <span className="material-symbols-outlined text-5xl text-accent-red">error</span>
            <p className="text-lg font-black uppercase text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-lg py-sm bg-accent-red text-white border-4 border-primary font-black uppercase tracking-widest hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-150 active:translate-x-0 active:translate-y-0"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && allPlayers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center border-4 border-primary p-xl bg-white neo-brutalist-shadow max-w-[576px] mx-auto">
            <span className="material-symbols-outlined text-7xl text-primary">leaderboard</span>
            <h2 className="text-3xl font-black uppercase italic">No trainers yet</h2>
            <p className="text-primary font-medium max-w-[384px]">
              Be the first to register and claim the #1 spot on the World Leaderboard!
            </p>
            <Link
              href="/login"
              className="mt-4 px-lg py-sm bg-accent-yellow text-primary border-4 border-primary font-black uppercase tracking-widest hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-150"
            >
              Register Now →
            </Link>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Leaderboard Mode Tabs */}
            <div className="flex border-4 border-primary mb-xl bg-white select-none">
              <button
                onClick={() => setActiveTab("trainers")}
                className={`flex-1 py-4 font-black uppercase text-center border-r-4 border-primary transition-all text-sm md:text-base cursor-pointer focus:outline-none ${activeTab === "trainers" ? "bg-primary text-white" : "text-primary hover:bg-accent-yellow"
                  }`}
              >
                Trainer Standings (1v1)
              </button>
              <button
                onClick={() => setActiveTab("squads")}
                className={`flex-1 py-4 font-black uppercase text-center transition-all text-sm md:text-base cursor-pointer focus:outline-none ${activeTab === "squads" ? "bg-primary text-white" : "text-primary hover:bg-accent-yellow"
                  }`}
              >
                Squad Standings (Free Fire)
              </button>
            </div>

            {activeTab === "trainers" ? (
              <>
                {/* ── Podium ── */}
                {podiumPlayers.length > 0 && (
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl items-end max-w-[896px] mx-auto select-none pt-sm">
                    <PodiumPlayer player={podiumPlayers[1]} rank="02" tierClass="bg-accent-blue" size="lg" delay={0.1} />
                    <PodiumPlayer player={podiumPlayers[0]} rank="01" tierClass="bg-accent-yellow" size="md" delay={0} />
                    <PodiumPlayer player={podiumPlayers[2]} rank="03" tierClass="bg-accent-red" size="lg" delay={0.2} />
                  </section>
                )}

                {/* ── Leaderboard Table Section ── */}
                <LeaderboardTable players={tableRows} />
              </>
            ) : (
              <SquadStandings squads={squads} loading={loadingSquads} />
            )}
          </>
        )}

        {/* Tier Legend */}
        {!loading && !error && (
          <section className="mt-xl grid grid-cols-2 md:grid-cols-6 gap-md select-none">
            {TIERS.map((t, i) => (
              <div key={i} className={`p-sm border-4 border-primary flex flex-col items-center ${t.color} neo-brutalist-shadow-hover`}>
                {t.name === "CHAMPION" ? (
                  <div className="w-8 h-8 border-4 border-primary italic flex items-center justify-center font-black text-xl mb-xs bg-white text-primary">
                    C
                  </div>
                ) : (
                  <div className={`w-8 h-8 border-2 border-primary mb-xs ${t.name === "ELITE FOUR" ? "bg-white" : t.color}`}></div>
                )}
                <p className="text-xs font-black uppercase italic text-center">{t.name}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-60 mt-0.5">{t.range}</p>
              </div>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}

export const dynamic = "force-dynamic";