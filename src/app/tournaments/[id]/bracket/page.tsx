"use client";

import { useState, useEffect, use } from "react";
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
}

export default function TournamentBracket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [tournament, setTournament] = useState<any>(null);
  const [roundsMatches, setRoundsMatches] = useState<Record<number, Match[]>>({});
  const [grandChampion, setGrandChampion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBrackets() {
      try {
        if (id) {
          const res = await fetch(`/api/brackets?tournamentId=${id}`);
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

                if (m.status === "COMPLETED" && m.winner) {
                  champ = m.winner;
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
  }, [id]);

  const isPreview = Object.keys(roundsMatches).length === 0;
  const quarterFinals = roundsMatches[1] || [];
  const semiFinals = roundsMatches[2] || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary font-black uppercase tracking-widest">
        Loading Battle Brackets...
      </div>
    );
  }

  return (
    <>
      <Navigation />

      <main className="max-w-container-max mx-auto px-md py-lg text-left">
        {/* Tournament Header */}
        <section className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md border-b-4 border-primary pb-md select-none">
          <div>
            <div className="flex items-center gap-xs mb-xs">
              <Link
                href={`/tournaments/${id}`}
                className="text-primary hover:underline flex items-center gap-xs text-body-md font-bold uppercase mr-sm"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back
              </Link>
              <span className="px-2 py-1 bg-primary text-white text-xs font-bold uppercase">
                {tournament?.type?.replace("_", " ") || "Master Class"}
              </span>
              <span className="font-bold text-xs uppercase tracking-widest text-primary">
                • {tournament?.title || "London Regional 2024"}
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
          <div className="border-4 border-primary p-xl text-center bg-white neo-brutalist-shadow select-none my-xl max-w-[896px] mx-auto">
            <span className="material-symbols-outlined text-7xl text-primary mb-sm">account_tree</span>
            <h3 className="text-3xl font-black uppercase italic mb-xs">No Brackets Generated Yet</h3>
            <p className="font-bold text-primary max-w-[512px] mx-auto uppercase text-sm leading-tight text-primary/60">
              The tournament pairings and matchups will generate once the administrator officially starts the event.
            </p>
          </div>
        ) : (
          <section className="overflow-x-auto pb-lg select-none">
            <div className="min-w-[1000px] flex items-center justify-between py-md relative">
              
              {/* Quarter Finals */}
              <div className="flex-1 flex flex-col gap-xl">
                <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 text-center border-b-2 border-primary inline-block mx-auto px-4">
                  Quarter Finals
                </p>
                
                {quarterFinals.map((match, idx) => (
                  <div key={match.id} className="relative group">
                    <div className="match-card border-4 border-primary bg-white overflow-hidden neo-brutalist-shadow-sm hover:-translate-y-0.5 hover:translate-x-[-2px] hover:shadow-md transition-all">
                      <div className="flex flex-col">
                        {/* Player 1 */}
                        <div
                          className={`flex items-center justify-between p-sm border-b-2 border-primary ${
                            match.team1.isWinner ? "bg-accent-yellow/20" : match.team2.isWinner ? "opacity-40" : ""
                          }`}
                        >
                          <div className="flex items-center gap-sm">
                            <div
                              className="w-8 h-8 rounded-none border-2 border-primary bg-cover bg-center grayscale"
                              style={{ backgroundImage: `url('${match.team1.avatarUrl}')` }}
                            />
                            <span className="text-sm font-bold uppercase">
                              {match.team1.name}
                            </span>
                          </div>
                          <span className="text-xl font-bold">
                            {match.team1.score}
                          </span>
                        </div>

                        {/* Player 2 */}
                        <div
                          className={`flex items-center justify-between p-sm ${
                            match.team2.isWinner ? "bg-accent-yellow/20" : match.team1.isWinner ? "opacity-40" : ""
                          }`}
                        >
                          <div className="flex items-center gap-sm">
                            <div
                              className="w-8 h-8 rounded-none border-2 border-primary bg-cover bg-center grayscale"
                              style={{ backgroundImage: `url('${match.team2.avatarUrl}')` }}
                            />
                            <span className="text-sm font-bold uppercase">
                              {match.team2.name}
                            </span>
                          </div>
                          <span className="text-xl font-bold">
                            {match.team2.score}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Right horizontal connector line */}
                    <div className="absolute -right-4 top-1/2 w-4 bracket-line-horizontal" />
                  </div>
                ))}
              </div>

              {/* Quarter Connector Lines */}
              <div className="w-8 flex flex-col items-center justify-center relative pointer-events-none select-none">
                <div className="h-[200px] w-[3px] bg-primary" />
              </div>

              {/* Semi Finals */}
              <div className="flex-1 flex flex-col gap-[200px] justify-center">
                <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 text-center border-b-2 border-primary inline-block mx-auto px-4">
                  Semi Finals
                </p>
                
                {semiFinals.map((match) => (
                  <div key={match.id} className="relative group">
                    {/* Left horizontal connector */}
                    <div className="absolute -left-4 top-1/2 w-4 bracket-line-horizontal" />
                    
                    <div className="match-card border-4 border-primary bg-white overflow-hidden border-l-[12px] border-l-primary neo-brutalist-shadow-sm hover:-translate-y-0.5 hover:translate-x-[-2px] hover:shadow-md transition-all">
                      <div className="flex flex-col">
                        {/* Player 1 */}
                        <div className="flex items-center justify-between p-sm border-b-2 border-primary">
                          <div className="flex items-center gap-sm">
                            <div
                              className="w-12 h-12 rounded-none border-2 border-primary bg-cover bg-center grayscale"
                              style={{ backgroundImage: `url('${match.team1.avatarUrl}')` }}
                            />
                            <span className="text-md font-bold uppercase tracking-tighter">
                              {match.team1.name}
                            </span>
                          </div>
                          {match.status === "completed" ? (
                            <span className="text-xl font-bold">{match.team1.score}</span>
                          ) : (
                            <span className="text-xs font-bold italic bg-primary text-white px-1">VS</span>
                          )}
                        </div>

                        {/* Player 2 */}
                        <div className="flex items-center justify-between p-sm">
                          <div className="flex items-center gap-sm">
                            <div
                              className="w-12 h-12 rounded-none border-2 border-primary bg-cover bg-center grayscale"
                              style={{ backgroundImage: `url('${match.team2.avatarUrl}')` }}
                            />
                            <span className="text-md font-bold uppercase tracking-tighter">
                              {match.team2.name}
                            </span>
                          </div>
                          {match.status === "completed" ? (
                            <span className="text-xl font-bold">{match.team2.score}</span>
                          ) : (
                            <span className="text-xs font-bold opacity-30">...</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Right horizontal connector */}
                    <div className="absolute -right-4 top-1/2 w-4 bracket-line-horizontal" />
                  </div>
                ))}
              </div>

              {/* Finals Connector */}
              <div className="w-8 flex flex-col items-center justify-center relative pointer-events-none select-none">
                <div className="h-[3px] w-full bg-primary" />
              </div>

              {/* Grand Finals */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 text-center border-b-2 border-primary inline-block mx-auto px-4">
                  Grand Final
                </p>
                
                <div className="relative w-full max-w-[320px]">
                  {/* Winner Card */}
                  <div className="match-card border-4 border-primary border-dashed bg-white p-lg flex flex-col items-center gap-md neo-brutalist-shadow">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-none bg-primary flex items-center justify-center border-4 border-primary relative overflow-hidden">
                        {grandChampion?.image ? (
                          <img src={grandChampion.image} alt={grandChampion.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[64px] text-white">
                            person
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold uppercase bg-primary text-white px-2 py-0.5 mb-2 inline-block">
                        {grandChampion ? "WINNER" : "To Be Determined"}
                      </p>
                      <p className="text-4xl font-bold uppercase tracking-tighter leading-none">
                        {grandChampion?.name || "Champion"}
                      </p>
                    </div>
                  </div>

                  {/* Trophy Highlight */}
                  <div className="mt-lg flex flex-col items-center select-none">
                    <div className="border-4 border-primary bg-accent-yellow p-4 neo-brutalist-shadow-sm">
                      <span className="material-symbols-outlined text-[64px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        workspace_premium
                      </span>
                    </div>
                    <p className="text-xs font-bold text-primary uppercase mt-4 tracking-widest">
                      {new Date().getFullYear()} REGIONAL TROPHY
                    </p>
                  </div>
                </div>
              </div>

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
                {tournament?.registrations?.length || 128} Players
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
                ${tournament?.prizePool?.toLocaleString()}
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
