"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { GameInfo } from "@/data/games";
import { formatPrizeAmount } from "@/lib/currency";

interface GameHubClientProps {
  game: GameInfo;
  slug: string;
  defaultTab: string;
  activeTournaments: any[];
  upcomingTournaments: any[];
  completedTournaments: any[];
  openDuels: any[];
  topPlayers: any[];
  otherGamesList: GameInfo[];
}

export default function GameHubClient({
  game,
  slug,
  defaultTab,
  activeTournaments,
  upcomingTournaments,
  completedTournaments,
  openDuels: initialDuels,
  topPlayers,
  otherGamesList,
}: GameHubClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(defaultTab === "duels" ? "duels" : "competitions");

  // Duel state
  const [duels, setDuels] = useState<any[]>(initialDuels);
  const [showCreateDuel, setShowCreateDuel] = useState(false);
  const [duelNotes, setDuelNotes] = useState("");
  const [creatingDuel, setCreatingDuel] = useState(false);
  const [duelError, setDuelError] = useState<string | null>(null);
  const [duelSuccess, setDuelSuccess] = useState(false);

  function switchTab(tab: string) {
    setActiveTab(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  }

  const handleCreateDuel = async () => {
    setCreatingDuel(true);
    setDuelError(null);
    try {
      const res = await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: game.gameKey, notes: duelNotes }),
      });
      const data = await res.json();
      if (data.error) {
        setDuelError(data.error);
      } else {
        setDuelSuccess(true);
        setDuels([data.duel, ...duels]);
        setDuelNotes("");
        setTimeout(() => { setShowCreateDuel(false); setDuelSuccess(false); }, 1500);
      }
    } catch (e) {
      setDuelError("Failed to create duel. Please try again.");
    } finally {
      setCreatingDuel(false);
    }
  };

  const handleAcceptDuel = async (duelId: string) => {
    try {
      const res = await fetch(`/api/duels/${duelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT" }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setDuels(duels.filter(d => d.id !== duelId));
        alert("Duel accepted! The battle is now ongoing.");
      }
    } catch {
      alert("Failed to accept duel.");
    }
  };

  const TABS = [
    { id: "competitions", label: "Competitions", icon: "emoji_events" },
    ...(game.supportsDuels ? [{ id: "duels", label: "Duels", icon: "sports_martial_arts" }] : []),
  ];

  return (
    <div className="grid grid-cols-12 gap-md lg:gap-xl">
      {/* Main Column */}
      <div className="col-span-12 lg:col-span-8 space-y-xl">

        {/* Tab Navigation */}
        <div className="flex border-b-4 border-primary">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-black uppercase text-xs tracking-wider border-r-2 border-primary transition-all cursor-pointer select-none ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "bg-white text-primary hover:bg-accent-yellow"
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── COMPETITIONS TAB ── */}
        {activeTab === "competitions" && (
          <div className="space-y-xl">
            {/* Active and Upcoming */}
            <div className="bg-white p-md md:p-xl border-4 border-primary neo-brutalist-shadow text-left">
              <h2 className="font-headline-lg uppercase mb-xl border-b-8 border-primary inline-block select-none">
                Upcoming & Live Tournaments
              </h2>

              <div className="space-y-md mt-xl">
                {activeTournaments.length === 0 && upcomingTournaments.length === 0 ? (
                  <div className="text-center py-12 border-4 border-dashed border-primary">
                    <span className="material-symbols-outlined text-5xl text-primary/30 select-none">emoji_events</span>
                    <p className="font-black uppercase text-xs text-primary/60 mt-sm">No active or upcoming tournaments</p>
                    <p className="text-[10px] font-bold text-primary/40 uppercase mt-xs">Check back soon or explore another game</p>
                  </div>
                ) : (
                  [...activeTournaments, ...upcomingTournaments].map((t) => {
                    const currencySymbol = t.currency === "INR" ? "₹" : "$";
                    return (
                      <article key={t.id} className="border-4 border-primary p-md hover:bg-surface-container transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
                        <div>
                          <div className="flex items-center gap-xs mb-xs select-none flex-wrap">
                            <span className={`px-sm py-0.5 border border-primary text-[9px] font-black uppercase ${t.status === "REGISTRATION_OPEN" ? "bg-accent-red text-white" : "bg-white text-primary"}`}>
                              {t.status.replace(/_/g, " ")}
                            </span>
                            {t.mode === "SQUAD" && (
                              <span className="px-sm py-0.5 border border-primary text-[9px] font-black uppercase bg-accent-yellow text-primary">
                                Squad ({t.minSquadMembers}–{t.maxSquadMembers})
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-primary/60">
                              {new Date(t.startDate).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-xl font-black uppercase text-primary tracking-tight leading-tight">
                            {t.title}
                          </h3>
                          <p className="text-xs text-primary/70 line-clamp-2 mt-xs max-w-[500px]">
                            {t.description || "The premier tournament event on ChampsArena."}
                          </p>
                        </div>
                        <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-xs shrink-0 select-none">
                          <div className="text-left sm:text-right">
                            <p className="text-[9px] font-black text-primary/50 uppercase">Prize Pool</p>
                            <p className="text-lg font-black text-accent-red leading-none">{currencySymbol}{t.prizePool?.toLocaleString()}</p>
                          </div>
                          <Link
                            href={`/tournaments/${t.id}`}
                            className="bg-accent-yellow text-primary border-2 border-primary px-md py-2 font-black uppercase text-[10px] hover:translate-y-[-1px] transition-all"
                          >
                            Join Arena
                          </Link>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>

            {/* Completed Tournaments */}
            {completedTournaments.length > 0 && (
              <div className="bg-white p-md md:p-xl border-4 border-primary neo-brutalist-shadow text-left">
                <h2 className="font-headline-md uppercase mb-lg select-none">
                  Past Champions & Results
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {completedTournaments.map((t) => (
                    <div key={t.id} className="border-2 border-primary p-sm bg-surface-container-high flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-primary/50 uppercase block mb-xs">Completed Event</span>
                        <h3 className="font-black text-base uppercase text-primary line-clamp-1">{t.title}</h3>
                      </div>
                      <Link
                        href={`/tournaments/${t.id}`}
                        className="mt-md text-xs font-black uppercase text-accent-blue hover:underline inline-block select-none"
                      >
                        View Bracket Tree →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DUELS TAB ── */}
        {activeTab === "duels" && (
          <div className="space-y-lg">
            {/* Duel Header + Create Button */}
            <div className="bg-white border-4 border-primary neo-brutalist-shadow p-md md:p-xl text-left">
              <div className="flex items-center justify-between mb-md">
                <div>
                  <h2 className="font-headline-lg uppercase select-none">Open Challenges</h2>
                  <p className="text-xs font-bold uppercase text-primary/50 mt-xs">1v1 duels waiting for an opponent</p>
                </div>
                <button
                  id="create-duel-btn"
                  onClick={() => setShowCreateDuel(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-accent-yellow text-primary border-3 border-primary font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#1a1a1a] hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer select-none"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Post Challenge
                </button>
              </div>

              {/* Create Duel Modal */}
              {showCreateDuel && (
                <div className="border-4 border-primary p-md bg-accent-yellow/10 mb-md space-y-3">
                  <h3 className="font-black uppercase text-sm text-primary">Issue an Open Challenge</h3>
                  <p className="text-[10px] font-bold uppercase text-primary/60">Anyone can accept your open challenge. Match result is reported manually.</p>
                  <textarea
                    placeholder="Notes (optional) — e.g. 'Looking for a ranked match, Discord: user#0000'"
                    value={duelNotes}
                    onChange={e => setDuelNotes(e.target.value)}
                    rows={2}
                    className="w-full border-3 border-primary px-4 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10 resize-none"
                  />
                  {duelError && <p className="text-accent-red font-black text-xs uppercase">{duelError}</p>}
                  {duelSuccess && <p className="text-green-700 font-black text-xs uppercase">Challenge posted!</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowCreateDuel(false); setDuelError(null); }}
                      className="flex-1 py-2 border-3 border-primary bg-white text-primary font-bold uppercase text-xs tracking-wider transition-all hover:bg-surface-container-high cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="confirm-create-duel-btn"
                      onClick={handleCreateDuel}
                      disabled={creatingDuel}
                      className="flex-1 py-2 border-3 border-primary bg-primary text-white font-black uppercase text-xs tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                    >
                      {creatingDuel ? "Posting..." : "Post Challenge"}
                    </button>
                  </div>
                </div>
              )}

              {/* Open Duels List */}
              {duels.length === 0 ? (
                <div className="text-center py-12 border-4 border-dashed border-primary">
                  <span className="material-symbols-outlined text-5xl text-primary/30 select-none">sports_martial_arts</span>
                  <p className="font-black uppercase text-xs text-primary/60 mt-sm">No open challenges right now</p>
                  <p className="text-[10px] font-bold text-primary/40 uppercase mt-xs">Be the first to post a duel challenge!</p>
                </div>
              ) : (
                <div className="space-y-md">
                  {duels.map(duel => (
                    <div key={duel.id} className="border-3 border-primary p-md bg-white shadow-[4px_4px_0px_0px_#1a1a1a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
                      <div className="flex items-center gap-md">
                        {/* Challenger Avatar */}
                        <div className="w-12 h-12 border-3 border-primary bg-accent-yellow text-primary flex items-center justify-center font-black text-lg shrink-0 select-none overflow-hidden">
                          {duel.creator?.image ? (
                            <img src={duel.creator.image} alt={duel.creator.name} className="w-full h-full object-cover" />
                          ) : (
                            (duel.creator?.name || "?").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-[9px] font-black uppercase text-primary/50">Challenge from</p>
                          <p className="font-black text-primary text-base uppercase tracking-tight">{duel.creator?.name || "Unknown"}</p>
                          <p className="text-[10px] font-bold text-accent-blue">{duel.creator?.elo} ELO</p>
                          {duel.notes && (
                            <p className="text-[10px] font-medium text-primary/60 mt-0.5 italic max-w-xs truncate">"{duel.notes}"</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-md shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-[9px] font-black text-primary/50 uppercase">Posted</p>
                          <p className="text-xs font-bold text-primary">{new Date(duel.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button
                          id={`accept-duel-${duel.id}`}
                          onClick={() => handleAcceptDuel(duel.id)}
                          className="px-5 py-2.5 bg-accent-blue text-white border-2 border-primary font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#1a1a1a] hover:bg-blue-700 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer select-none"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Duel Info Card */}
            <div className="bg-accent-yellow border-4 border-primary p-md text-left neo-brutalist-shadow">
              <h3 className="font-headline-sm uppercase mb-sm select-none flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">info</span>
                How Duels Work
              </h3>
              <ul className="space-y-2 text-xs font-bold uppercase text-primary">
                <li className="flex items-start gap-2"><span className="material-symbols-outlined text-sm text-accent-blue shrink-0 mt-0.5">looks_one</span> Post an open challenge or invite a specific player</li>
                <li className="flex items-start gap-2"><span className="material-symbols-outlined text-sm text-accent-blue shrink-0 mt-0.5">looks_two</span> Your opponent accepts and the match begins</li>
                <li className="flex items-start gap-2"><span className="material-symbols-outlined text-sm text-accent-blue shrink-0 mt-0.5">looks_3</span> Play your match and share screenshot proof</li>
                <li className="flex items-start gap-2"><span className="material-symbols-outlined text-sm text-accent-blue shrink-0 mt-0.5">looks_4</span> Report the result — ELO updates automatically</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Column */}
      <aside className="col-span-12 lg:col-span-4 space-y-xl">
        {/* Top Players */}
        <div className="bg-white p-md md:p-xl border-4 border-primary neo-brutalist-shadow text-left">
          <h2 className="font-headline-md uppercase mb-xl border-b-4 border-primary select-none">
            Top Contenders
          </h2>
          <div className="space-y-sm">
            {topPlayers.length === 0 ? (
              <p className="text-sm font-bold uppercase text-primary/50 text-center py-6">No ranked players yet</p>
            ) : (
              topPlayers.map((player, idx) => (
                <Link
                  href={`/players/${player.username || player.id}`}
                  key={player.id}
                  className="flex items-center justify-between border-2 border-primary p-xs hover:bg-accent-yellow transition-all"
                >
                  <div className="flex items-center gap-sm">
                    <span className="font-black text-lg italic text-primary w-6 select-none">#{idx + 1}</span>
                    <div className="w-8 h-8 border border-primary relative bg-accent-blue shrink-0 overflow-hidden select-none">
                      {player.image ? (
                        <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-xs text-white">
                          {(player.name || "P").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="font-black text-sm uppercase text-primary truncate max-w-[120px]">
                      {player.name || "Trainer"}
                    </span>
                  </div>
                  <span className="font-black text-base italic text-primary">{player.elo} ELO</span>
                </Link>
              ))
            )}
          </div>
          <Link
            href={`/games/${slug}/leaderboards`}
            className="w-full block text-center mt-md py-2 border-2 border-primary text-primary font-black uppercase text-xs hover:bg-primary hover:text-white transition-all select-none"
          >
            Full Leaderboard
          </Link>
        </div>

        {/* Related Games */}
        <div className="bg-accent-yellow p-md border-4 border-primary select-none text-left neo-brutalist-shadow">
          <h3 className="font-headline-sm uppercase mb-md">Other Esports Arenas</h3>
          <div className="grid grid-cols-2 gap-xs">
            {otherGamesList.map((g) => (
              <Link
                key={g.slug}
                href={`/games/${g.slug}`}
                className="p-sm bg-white border-2 border-primary hover:bg-primary hover:text-white transition-all text-center font-black uppercase text-[10px]"
              >
                {g.name.split(" ")[0]}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
