"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
              data.matches.forEach((m: any) => {
                const roundNum = m.round;
                if (!grouped[roundNum]) grouped[roundNum] = [];

                const mapTeam = (player: any, score: number, otherScore: number) => {
                  return {
                    name: player?.name || "TBD",
                    score: m.status === "BYE" && player ? "BYE" : m.status === "COMPLETED" ? String(score) : "...",
                    avatarUrl: player?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuDoz5Y0R4TFuXNrYLE-POKr2jfVBcGfiv3xrqewXcn_dT6Pi3y98nN89Lhyl3W232l87CwoQ7BZfA8qbk6kPJHxkY4-u9zYPdd0dciP1rQJguaadH5ak_jVWTlDdyyYkf-xTDQ9pi-g9EvcpjFdFOClplU8RKE9t6xRR0E8brOOOKRBiQSzT85kRb5GSGQOF6ERlnWa8-TdzOhAs0m8PDFak7j8ar1G7gZtM9riEUcB6EfuUwvRoSeIULm7Kmic2qMqoBuCYiiXBW4",
                    imgAlt: player?.name || "TBD",
                    isWinner: m.status === "COMPLETED" && m.winnerId === player?.id,
                  };
                };

                grouped[roundNum].push({
                  id: m.id,
                  status: m.status.toLowerCase(),
                  team1: mapTeam(m.p1, m.p1Score, m.p2Score),
                  team2: mapTeam(m.p2, m.p2Score, m.p1Score),
                });

                // Find champion if grand finals (round 99 or highest round complete)
                if (m.status === "COMPLETED" && m.winner) {
                  champ = m.winner;
                }
              });

              setRoundsMatches(grouped);
              if (champ) {
                setGrandChampion(champ);
              }
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
  const quarterFinals = roundsMatches[1] || [];
  const semiFinals = roundsMatches[2] || [];

  return (
    <>
      <Navigation />

      <main className="max-w-container-max mx-auto px-md py-lg">
        {/* Tournament Header */}
        <section className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant/30 pb-md">
          <div className="select-none">
            <div className="flex items-center gap-xs mb-xs">
              <span className="px-xs py-base bg-tertiary/10 text-tertiary text-label-lg font-label-lg rounded uppercase font-bold shadow-sm">
                {tournament?.type?.replace("_", " ") || "Master Class"}
              </span>
              <span className="text-outline text-body-md font-semibold">
                • {tournament?.title || "London Regional 2024"}
              </span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold leading-tight">
              Championship Finals
            </h2>
          </div>
          <div className="flex gap-sm">
            <button className="flex items-center gap-xs px-sm py-xs border border-outline-variant rounded-lg font-title-lg text-body-md hover:bg-surface-container-low transition-colors font-bold active:scale-95">
              <span className="material-symbols-outlined text-[20px]">share</span> Share Bracket
            </button>
            <button className="flex items-center gap-xs px-sm py-xs bg-tertiary text-on-primary rounded-lg font-title-lg text-body-md shadow-sm active:scale-95 hover:brightness-110 transition-all font-bold">
              <span className="material-symbols-outlined text-[20px] material-symbols-fill">
                play_circle
              </span>
              Watch Live
            </button>
          </div>
        </section>

        {/* Interactive Bracket Tree */}
        {isPreview ? (
          <div className="border-4 border-primary p-xl text-center bg-white neo-brutalist-shadow select-none my-xl max-w-[896px] mx-auto text-primary">
            <span className="material-symbols-outlined text-7xl text-primary mb-sm">account_tree</span>
            <h3 className="text-3xl font-black uppercase italic mb-xs">No Brackets Generated Yet</h3>
            <p className="font-bold text-primary max-w-[512px] mx-auto uppercase text-sm leading-tight text-primary/60">
              Select an ongoing tournament or wait until tournament matches are officially generated to view brackets.
            </p>
          </div>
        ) : (
          <section className="overflow-x-auto pb-lg select-none">
            <div className="min-w-[1000px] flex items-center justify-between py-md relative">
              
              {/* Quarter Finals */}
              <div className="w-[300px] flex flex-col gap-xl">
                <p className="text-label-lg font-label-lg text-outline uppercase tracking-widest mb-xs text-center font-bold">
                  Round 1
                </p>
                
                {quarterFinals.map((match, idx) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="relative group"
                  >
                    <div className="match-card bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 hover:border-tertiary cursor-pointer">
                      <div className="flex flex-col">
                        {/* Player 1 */}
                        <div
                          className={`flex items-center justify-between p-sm border-b border-outline-variant ${
                            match.team1.isWinner ? "bg-surface-container-low" : "opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-sm">
                            <div
                              className="w-8 h-8 rounded-full bg-cover bg-center border border-outline-variant shadow-sm"
                              style={{ backgroundImage: `url('${match.team1.avatarUrl}')` }}
                            />
                            <span
                              className={`font-body-md text-on-surface ${
                                match.team1.isWinner ? "font-bold text-tertiary" : "font-medium"
                              }`}
                            >
                              {match.team1.name}
                            </span>
                          </div>
                          <span
                            className={`font-bold ${
                              match.team1.isWinner ? "text-tertiary" : "text-outline"
                            }`}
                          >
                            {match.team1.score}
                          </span>
                        </div>

                        {/* Player 2 */}
                        <div
                          className={`flex items-center justify-between p-sm ${
                            match.team2.isWinner ? "bg-surface-container-low" : "opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-sm">
                            <div
                              className="w-8 h-8 rounded-full bg-cover bg-center border border-outline-variant shadow-sm"
                              style={{ backgroundImage: `url('${match.team2.avatarUrl}')` }}
                            />
                            <span
                              className={`font-body-md text-on-surface ${
                                match.team2.isWinner ? "font-bold text-tertiary" : "font-medium"
                              }`}
                            >
                              {match.team2.name}
                            </span>
                          </div>
                          <span
                            className={`font-bold ${
                              match.team2.isWinner ? "text-tertiary" : "text-outline"
                            }`}
                          >
                            {match.team2.score}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Right horizontal connector line */}
                    <div className="absolute -right-4 top-1/2 w-4 bracket-line-horizontal group-hover:bg-tertiary group-hover:opacity-100 transition-all duration-200" />
                  </motion.div>
                ))}
              </div>

              {/* Quarter Connector Lines (SVG for crisp responsive curves) */}
              <div className="w-[40px] h-[360px] flex items-center justify-center relative pointer-events-none select-none">
                <svg className="absolute inset-0 w-full h-full stroke-tertiary/20 fill-none stroke-[2]">
                  <path d="M 0,98 L 20,98 L 20,262 L 0,262 M 20,180 L 40,180" />
                </svg>
              </div>

              {/* Semi Finals */}
              <div className="w-[300px] flex flex-col justify-center">
                <p className="text-label-lg font-label-lg text-outline uppercase tracking-widest mb-md text-center font-bold">
                  Round 2
                </p>
                
                {semiFinals.map((match, idx) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="relative group py-lg"
                  >
                    {/* Left horizontal connector */}
                    <div className="absolute -left-4 top-1/2 w-4 bracket-line-horizontal group-hover:bg-tertiary group-hover:opacity-100 transition-all duration-200" />
                    
                    <div className="match-card bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-tertiary cursor-pointer transition-all hover:-translate-y-0.5 border-l-4 border-l-tertiary">
                      <div className="flex flex-col">
                        {/* Player 1 */}
                        <div className="flex items-center justify-between p-sm border-b border-outline-variant">
                          <div className="flex items-center gap-sm">
                            <div
                              className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-tertiary/30 shadow-sm"
                              style={{ backgroundImage: `url('${match.team1.avatarUrl}')` }}
                            />
                            <span className="font-body-md text-on-surface font-bold text-tertiary">
                              {match.team1.name}
                            </span>
                          </div>
                          <span className="text-outline font-bold italic px-xs text-[12px]">{match.team1.score}</span>
                        </div>

                        {/* Player 2 */}
                        <div className="flex items-center justify-between p-sm">
                          <div className="flex items-center gap-sm">
                            <div
                              className="w-10 h-10 rounded-full bg-cover bg-center border border-outline-variant shadow-sm"
                              style={{ backgroundImage: `url('${match.team2.avatarUrl}')` }}
                            />
                            <span className="font-body-md text-on-surface font-semibold">
                              {match.team2.name}
                            </span>
                          </div>
                          <span className="text-outline font-bold italic px-xs text-[12px]">{match.team2.score}</span>
                        </div>
                      </div>
                    </div>
                    {/* Right horizontal connector */}
                    <div className="absolute -right-4 top-1/2 w-4 bracket-line-horizontal group-hover:bg-tertiary group-hover:opacity-100 transition-all duration-200" />
                  </motion.div>
                ))}
              </div>

              {/* Finals Connector */}
              <div className="w-[40px] h-[360px] flex items-center justify-center relative pointer-events-none select-none">
                <svg className="absolute inset-0 w-full h-full stroke-tertiary/20 fill-none stroke-[2]">
                  <path d="M 0,180 L 40,180" />
                </svg>
              </div>

              {/* Grand Finals */}
              <div className="w-[300px] flex flex-col items-center justify-center">
                <p className="text-label-lg font-label-lg text-outline uppercase tracking-widest mb-xs text-center font-bold">
                  Grand Final
                </p>
                
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="relative w-full"
                >
                  {/* Winner Card */}
                  <div className="match-card bg-surface-container-lowest border-2 border-outline-variant rounded-xl overflow-hidden shadow-lg p-md flex flex-col items-center gap-md hover:border-tertiary transition-colors cursor-pointer">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center border-4 border-secondary-fixed shadow-inner overflow-hidden">
                        {grandChampion?.image ? (
                          <img src={grandChampion.image} alt={grandChampion.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[48px] text-outline opacity-20 select-none">
                            person
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-md border border-outline-variant/30">
                        <span className="material-symbols-outlined text-tertiary text-[20px] material-symbols-fill">
                          emoji_events
                        </span>
                      </div>
                    </div>
                    <div className="text-center select-none">
                      <p className="text-[10px] font-label-lg text-outline font-bold uppercase tracking-wider">
                        {grandChampion ? "WINNER" : "TBD"}
                      </p>
                      <p className="font-headline-md text-headline-md font-bold text-on-surface-variant">
                        {grandChampion?.name || "Grand Champion"}
                      </p>
                    </div>
                  </div>

                  {/* Trophy Highlight */}
                  <div className="mt-lg flex flex-col items-center animate-bounce duration-1000 select-none">
                    <span
                      className="material-symbols-outlined text-[64px] text-gold-accent material-symbols-fill"
                    >
                      workspace_premium
                    </span>
                    <p className="text-label-lg font-label-lg text-victory-gold font-bold uppercase tracking-wider text-[11px] mt-1">
                      CHAMPIONSHIP TROPHY
                    </p>
                  </div>
                </motion.div>
              </div>

            </div>
          </section>
        )}

        {/* Stats & Info banner row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-md mt-xl">
          {[
            {
              title: "Tournament Status",
              value: tournament?.status || "COMPLETED",
              icon: "info",
            },
            {
              title: "Prize Pool",
              value: tournament?.prizePool ? `$${tournament.prizePool.toLocaleString()}` : "$25,000",
              icon: "payments",
            },
            {
              title: "Format Type",
              value: tournament?.type?.replace("_", " ") || "SWISS",
              icon: "category",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-sm flex items-center gap-md shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center select-none shadow-sm">
                <span className="material-symbols-outlined text-tertiary text-[24px]">
                  {stat.icon}
                </span>
              </div>
              <div className="select-none">
                <p className="text-[11px] font-label-lg text-outline uppercase tracking-wider font-bold">
                  {stat.title}
                </p>
                <p className="font-headline-md text-headline-md font-bold text-on-surface capitalize">
                  {stat.value.toLowerCase()}
                </p>
              </div>
            </motion.div>
          ))}
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
