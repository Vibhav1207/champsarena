"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

interface Team {
  name: string;
  score: string;
  avatarUrl: string;
  imgAlt: string;
  isWinner: boolean;
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  status: "completed" | "active" | "pending" | "bye";
  round: number;
}

function BracketsContent() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams?.get("tournamentId");

  const [tournament, setTournament] = useState<any>(null);
  const [roundsMatches, setRoundsMatches] = useState<Record<number, Match[]>>({});
  const [grandChampion, setGrandChampion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBrackets() {
      try {
        let activeTournamentId = tournamentId;

        // If no ID provided, try to find first tournament
        if (!activeTournamentId) {
          const tournamentsRes = await fetch("/api/tournaments");
          const tournaments = await tournamentsRes.json();
          if (Array.isArray(tournaments) && tournaments.length > 0) {
            activeTournamentId = tournaments[0].id;
          }
        }

        if (activeTournamentId) {
          const res = await fetch(`/api/brackets?tournamentId=${activeTournamentId}`);
          const data = await res.json();
          if (data.tournament) {
            setTournament(data.tournament);

            // Group matches by round
            const grouped: Record<number, Match[]> = {};
            let champ = null;

            if (data.matches && data.matches.length > 0) {
              const isTeam = data.tournament?.game === "FREE_FIRE";
              data.matches.forEach((m: any) => {
                const roundNum = m.round;
                if (!grouped[roundNum]) grouped[roundNum] = [];

                const mapTeam = (playerOrSquad: any, score: number, otherScore: number) => {
                  return {
                    name: playerOrSquad?.name || "TBD",
                    score: m.status === "BYE" && playerOrSquad ? "BYE" : m.status === "COMPLETED" ? String(score) : "...",
                    avatarUrl: playerOrSquad?.logo || playerOrSquad?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuDoz5Y0R4TFuXNrYLE-POKr2jfVBcGfiv3xrqewXcn_dT6Pi3y98nN89Lhyl3W232l87CwoQ7BZfA8qbk6kPJHxkY4-u9zYPdd0dciP1rQJguaadH5ak_jVWTlDdyyYkf-xTDQ9pi-g9EvcpjFdFOClplU8RKE9t6xRR0E8brOOOKRBiQSzT85kRb5GSGQOF6ERlnWa8-TdzOhAs0m8PDFak7j8ar1G7gZtM9riEUcB6EfuUwvRoSeIULm7Kmic2qMqoBuCYiiXBW4",
                    imgAlt: playerOrSquad?.name || "TBD",
                    isWinner: m.status === "COMPLETED" && (m.winnerId === playerOrSquad?.id || m.winnerSquadId === playerOrSquad?.id),
                  };
                };

                const isTeamMatch = m.s1Id !== null;

                grouped[roundNum].push({
                  id: m.id,
                  status: m.status.toLowerCase(),
                  round: roundNum,
                  team1: mapTeam(isTeamMatch ? m.s1 : m.p1, m.p1Score, m.p2Score),
                  team2: mapTeam(isTeamMatch ? m.s2 : m.p2, m.p2Score, m.p1Score),
                });

                if (m.status === "COMPLETED" && (m.winner || m.winnerSquad)) {
                  champ = m.winner || m.winnerSquad;
                }
              });

              setRoundsMatches(grouped);
              if (champ) {
                setGrandChampion(champ);
              }
            } else {
              setRoundsMatches({});
              setGrandChampion(null);
            }
          }
        }
      } catch (err) {
        console.error("Bracket load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBrackets();
  }, [tournamentId]);

  const isPreview = Object.keys(roundsMatches).length === 0;

  const sortedRounds = Object.keys(roundsMatches)
    .map(Number)
    .sort((a, b) => {
      if (a === 99) return 1;
      if (b === 99) return -1;
      if (a > 0 && b < 0) return -1;
      if (a < 0 && b > 0) return 1;
      return a - b;
    });

  const getRoundName = (roundNum: number, type?: string) => {
    if (roundNum === 99) return "Grand Finals";
    if (type === "DOUBLE_ELIMINATION") {
      if (roundNum < 0) return `Losers Round ${Math.abs(roundNum)}`;
      return `Winners Round ${roundNum}`;
    }
    if (type === "ROUND_ROBIN") {
      return `Round ${roundNum}`;
    }
    if (type === "SWISS") {
      return `Swiss Round ${roundNum}`;
    }
    return `Round ${roundNum}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary font-black uppercase tracking-widest">
        Loading Battle Brackets...
      </div>
    );
  }

  const currencySymbol = tournament?.currency === "INR" ? "₹" : "$";

  return (
    <>
      <Navigation />

      <main className="max-w-container-max mx-auto px-md py-lg text-left">
        {/* Tournament Header */}
        <section className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md border-b-4 border-primary pb-md select-none">
          <div>
            <div className="flex items-center gap-xs mb-xs">
              {tournament?.id && (
                <Link
                  href={`/tournaments/${tournament.id}`}
                  className="text-primary hover:underline flex items-center gap-xs text-body-md font-bold uppercase mr-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Back
                </Link>
              )}
              <span className="px-2 py-1 bg-primary text-white text-xs font-bold uppercase">
                {tournament?.type?.replace("_", " ") || "Master Class"}
              </span>
              <span className="font-bold text-xs uppercase tracking-widest text-primary">
                • {tournament?.title || "London Regional 2026"}
              </span>
            </div>
            <h2 className="text-5xl font-bold uppercase tracking-tighter text-primary">
              Championship Bracket
            </h2>
          </div>
          <div className="flex gap-sm">
            <button className="flex items-center gap-xs px-sm py-xs border-4 border-primary bg-white font-bold uppercase text-sm neo-brutalist-shadow-sm active:translate-y-0.5 transition-all">
              <span className="material-symbols-outlined">share</span> Share
            </button>
            <button className="flex items-center gap-xs px-sm py-xs border-4 border-primary bg-primary text-white font-bold uppercase text-sm neo-brutalist-shadow-sm active:translate-y-0.5 transition-all">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span> Watch Live
            </button>
          </div>
        </section>

        {/* Warning banner or bracket tree depending on started status */}
        {isPreview ? (
          <div className="border-4 border-primary p-md md:p-xl text-center bg-white neo-brutalist-shadow select-none my-lg md:my-xl max-w-[896px] mx-auto text-primary">
            <span className="material-symbols-outlined text-5xl md:text-7xl text-primary mb-sm">account_tree</span>
            <h3 className="text-2xl md:text-3xl font-black uppercase italic mb-xs">No Brackets Generated Yet</h3>
            <p className="font-bold text-primary max-w-[512px] mx-auto uppercase text-xs md:text-sm leading-tight text-primary/60">
              Select an ongoing tournament or wait until tournament matches are officially generated to view brackets.
            </p>
          </div>
        ) : (
          <section className="overflow-x-auto pb-lg select-none">
            <div className="flex gap-md md:gap-xl py-md relative">
              {sortedRounds.map((roundNum) => {
                const matches = roundsMatches[roundNum] || [];
                const roundName = getRoundName(roundNum, tournament?.type);

                return (
                  <div key={roundNum} className="flex flex-col gap-md md:gap-lg min-w-[280px] w-[280px]">
                    <div className="text-center border-b-4 border-primary pb-xs mb-md select-none bg-surface-container-high p-xs">
                      <p className="text-xs font-black text-primary uppercase tracking-[0.2em] line-clamp-1">
                        {roundName}
                      </p>
                    </div>

                    <div className="flex flex-col justify-around h-full gap-md">
                      {matches.map((match) => (
                        <div key={match.id} className="relative group text-primary">
                          <div className="match-card border-4 border-primary bg-white overflow-hidden neo-brutalist-shadow-sm hover:-translate-y-0.5 hover:translate-x-[-2px] hover:shadow-md transition-all">
                            <div className="flex flex-col">
                              {/* Player 1 */}
                              <div
                                className={`flex items-center justify-between p-sm border-b-2 border-primary ${match.team1.isWinner ? "bg-accent-yellow/20 font-black" : match.team2.isWinner ? "opacity-40" : ""
                                  }`}
                              >
                                <div className="flex items-center gap-xs">
                                  <div className="w-6 h-6 bg-primary flex items-center justify-center font-bold text-white text-[10px] uppercase">
                                    {match.team1.name.charAt(0)}
                                  </div>
                                  <span className="text-xs uppercase line-clamp-1">
                                    {match.team1.name}
                                  </span>
                                </div>
                                <span className="text-sm font-black">
                                  {match.team1.score}
                                </span>
                              </div>

                              {/* Player 2 */}
                              <div
                                className={`flex items-center justify-between p-sm ${match.team2.isWinner ? "bg-accent-yellow/20 font-black" : match.team1.isWinner ? "opacity-40" : ""
                                  }`}
                              >
                                <div className="flex items-center gap-xs">
                                  <div className="w-6 h-6 bg-primary flex items-center justify-center font-bold text-white text-[10px] uppercase">
                                    {match.team2.name.charAt(0)}
                                  </div>
                                  <span className="text-xs uppercase line-clamp-1">
                                    {match.team2.name}
                                  </span>
                                </div>
                                <span className="text-sm font-black">
                                  {match.team2.score}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Grand Champion Column */}
              {grandChampion && (
                <div className="flex flex-col items-center justify-center min-w-[280px] w-[280px] bg-accent-yellow/10 border-4 border-primary border-dashed p-md neo-brutalist-shadow self-center">
                  <div className="w-20 h-20 bg-primary flex items-center justify-center border-4 border-primary mb-sm">
                    {grandChampion.logo || grandChampion.image ? (
                      <img src={grandChampion.logo || grandChampion.image} alt={grandChampion.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[48px] text-white">
                        {tournament?.game === "FREE_FIRE" ? "groups" : "person"}
                      </span>
                    )}
                  </div>
                  <div className="text-center select-none text-primary">
                    <span className="px-2 py-0.5 bg-primary text-white text-[10px] font-black uppercase">Grand Champion</span>
                    <h3 className="text-2xl font-black uppercase tracking-tight mt-xs">{grandChampion.name}</h3>
                    <div className="mt-sm border-2 border-primary bg-accent-yellow p-sm inline-block">
                      <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Stats & Info banner row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-0 mt-xl border-t-4 border-primary">
          <div className="border-r-4 border-b-4 border-primary p-md flex items-center gap-md">
            <div className="w-12 h-12 border-4 border-primary bg-accent-yellow flex items-center justify-center select-none shadow-sm">
              <span className="material-symbols-outlined text-primary font-bold">
                groups
              </span>
            </div>
            <div className="select-none">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Registered Players</p>
              <p className="text-4xl font-bold tracking-tighter">
                {tournament?.registrations?.length || 0} Players
              </p>
            </div>
          </div>

          <div className="border-r-4 border-b-4 border-primary p-md flex items-center gap-md bg-primary text-white">
            <div className="w-12 h-12 border-2 border-white flex items-center justify-center select-none">
              <span className="material-symbols-outlined text-white">
                payments
              </span>
            </div>
            <div className="select-none">
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">Prize Pool</p>
              <p className="text-4xl font-bold tracking-tighter text-accent-yellow">
                {currencySymbol}{tournament?.prizePool?.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="border-b-4 border-primary p-md flex items-center gap-md">
            <div className="w-12 h-12 border-4 border-primary bg-white flex items-center justify-center select-none">
              <span className="material-symbols-outlined text-primary">
                category
              </span>
            </div>
            <div className="select-none">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Format Type</p>
              <p className="text-4xl font-bold tracking-tighter capitalize">
                {tournament?.type?.toLowerCase().replace("_", " ")}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default function Brackets() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-outline font-medium">Loading Battle Brackets...</div>}>
      <BracketsContent />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
