"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { logoutTrainer } from "@/app/actions/authActions";

interface Pokemon {
  name: string;
  types: string[];
  imgUrl: string;
  imgAlt: string;
}

export default function Profile() {
  const [profileData, setProfileData] = useState<any>(null);
  const [squad, setSquad] = useState<Pokemon[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const badges = [
    { name: "Regional Champ", icon: "workspace_premium", color: "hover:bg-accent-yellow", active: true },
    { name: "100 Wins", icon: "stars", color: "hover:bg-accent-blue hover:text-white", active: false },
    { name: "Tactician", icon: "psychology", color: "hover:bg-accent-red hover:text-white", active: false },
    { name: "Grand Master", icon: "trophy", color: "bg-gray-100 opacity-30", active: false },
    { name: "Collector", icon: "eco", color: "hover:bg-green-500 hover:text-white", active: false },
    { name: "On Fire", icon: "local_fire_department", color: "bg-primary text-white hover:bg-accent-red", active: false },
  ];

  const fetchProfile = () => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setProfileData(data.user);
          
          // Parse active team from DB
          const activeTeam = data.user.teams?.find((t: any) => t.active);
          if (activeTeam) {
            try {
              const parsed = JSON.parse(activeTeam.pokemonJson);
              setSquad(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
              setSquad([]);
            }
          } else {
            setSquad([]);
          }

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

  const handleAddMember = async () => {
    const name = prompt("Enter Pokémon name:");
    if (!name) return;
    const typeString = prompt("Enter type (comma separated, e.g. Dragon, Flying):", "Dragon");
    if (!typeString) return;
    const types = typeString.split(",").map((t) => t.trim());

    const newPokemon: Pokemon = {
      name,
      types,
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXu2yTz_FoqBcl3-wQte7pgq_j6H17YmkZLNHDXbWX7pLiofwbWVXOdF7tDYCWpI-kg0eYUeu1C-KhFfWUslN1eNIxIsfb7Qk5F4s-AO11CqGOaE7GtFv1Kp0tDAQPUSkRyRpGVOyP6riTNis-nUtE48RbqKxoLf2T1xlMoWBmB3vWmvN5ecGJEMXMvy6nEnvlUyXDw07PfPtz9lHErtiS1FTtbFXgAmFMlBmO2jocuQqp3OFz2g1n7XWm59N3gHTnDoLehE3GbWAMA",
      imgAlt: name,
    };

    const updatedSquad = [...squad.slice(0, 5), newPokemon]; // Keep max 6
    setSquad(updatedSquad);

    // Save to backend
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "VGC Squad",
          pokemon: updatedSquad,
        }),
      });
      alert("Squad updated successfully!");
      fetchProfile();
    } catch (err) {
      console.error("Failed to save team", err);
    }
  };

  const trainerName = profileData?.name || "Trainer";
  const trainerId = profileData?.trainerId?.slice(0, 8) || "—";
  const elo = profileData?.elo ?? 1000;
  const wins = profileData?.wins ?? 0;
  const losses = profileData?.losses ?? 0;
  const homeRegion = profileData?.homeRegion || "Unknown Region";
  const favPokemon = profileData?.favPokemon || "—";
  const image = profileData?.image || null;

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
                <div className="md:w-3/5 flex flex-col">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 flex-grow">
                    <div className="p-lg border-b-4 sm:border-r-4 border-primary flex flex-col justify-between group hover:bg-accent-yellow transition-colors duration-150">
                      <span className="font-black text-xs uppercase tracking-widest text-primary mb-4 block">Rank Status</span>
                      <div className="space-y-2">
                        <span className="text-4xl font-black uppercase block italic text-primary">
                          {elo > 1500 ? "Grand Master" : elo > 1200 ? "Veteran Tier" : "Ace Tier"}
                        </span>
                        <span className="bg-primary text-white inline-block px-2 py-1 text-xs font-bold uppercase">
                          ELO Rating: {elo.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="p-lg border-b-4 border-primary flex flex-col justify-between hover:bg-accent-blue hover:text-white transition-colors duration-150 group">
                      <span className="font-black text-xs uppercase tracking-widest text-primary group-hover:text-white mb-4 block">Deployment Region</span>
                      <div className="space-y-2">
                        <span className="text-4xl font-black uppercase block italic">
                          {homeRegion} Dist.
                        </span>
                        <span className="border-2 border-primary group-hover:border-white inline-block px-2 py-1 text-xs font-bold uppercase">
                          Badges: {wins > 10 ? "08/08" : "04/08"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-lg bg-surface-container-low border-t-4 border-primary">
                    <span className="font-black text-xs uppercase tracking-widest text-primary mb-6 block">Core Operational Units</span>
                    <div className="flex flex-wrap gap-md md:gap-lg justify-start">
                      {[
                        { name: favPokemon, icon: "electric_bolt" },
                        { name: "Charizard", icon: "local_fire_department" },
                        { name: "Greninja", icon: "water_drop" },
                      ].map((unit, i) => (
                        <div key={i} className="flex items-center gap-2 sm:gap-4 group">
                          <div className="w-16 h-16 border-4 border-primary flex items-center justify-center bg-white group-hover:bg-accent-red group-hover:text-white transition-all duration-150 select-none">
                            <span className="material-symbols-outlined text-3xl">{unit.icon}</span>
                          </div>
                          <span className="font-black uppercase tracking-tighter text-primary">{unit.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </section>

            {/* ── Combat Squad Preview Section ── */}
            <section className="space-y-md">
              <div className="flex justify-between items-baseline border-b-4 border-primary pb-4">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter italic text-primary">Combat Squad</h2>
                  <p className="font-black text-xs uppercase tracking-widest text-primary opacity-60">Active VGC Championship Configuration</p>
                </div>
                <button 
                  onClick={handleAddMember}
                  className="bg-primary text-white border-2 border-primary px-6 py-2 font-black uppercase text-xs hover:bg-accent-red hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
                >
                  Modify Fleet
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {squad.map((pokemon, i) => (
                  <div 
                    key={i} 
                    className="pokemon-slot border-4 border-primary neo-brutalist-shadow-sm p-md flex flex-col items-center gap-4 neo-brutalist-shadow-hover bg-white cursor-pointer group"
                  >
                    <div className="w-full aspect-square bg-surface-container-low border-2 border-primary flex items-center justify-center overflow-hidden relative select-none">
                      <Image 
                        src={pokemon.imgUrl} 
                        alt={pokemon.imgAlt} 
                        width={80}
                        height={80}
                        className="object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                      />
                    </div>
                    <div className="text-center w-full">
                      <span className="text-xl font-black uppercase block mb-2 text-primary tracking-tighter">{pokemon.name}</span>
                      <div className="flex gap-1 justify-center flex-wrap">
                        {pokemon.types.map((t, idx) => (
                          <span 
                            key={idx} 
                            className={`px-2 py-0.5 border-2 border-primary text-[10px] font-black uppercase select-none ${
                              idx === 0 ? "bg-primary text-white" : "bg-white text-primary"
                            }`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Member Slot */}
                {squad.length < 6 && (
                  <div 
                    onClick={handleAddMember}
                    className="pokemon-slot border-4 border-dashed border-primary p-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-surface-container-low transition-colors duration-150 group min-h-[220px]"
                  >
                    <span className="material-symbols-outlined text-6xl group-hover:text-accent-red text-primary transition-colors">add_box</span>
                    <span className="font-black uppercase text-xs text-primary">Append Member</span>
                  </div>
                )}
              </div>
            </section>

            {/* ── Accolades and Mission Log Bento Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-sm">
              
              {/* Accolades (Badges) Column */}
              <div className="lg:col-span-1 space-y-md">
                <h3 className="text-2xl font-black uppercase italic border-b-2 border-primary pb-2 text-primary">Accolades</h3>
                <div className="grid grid-cols-3 gap-4">
                  {badges.map((badge, idx) => (
                    <div 
                      key={idx}
                      title={`${badge.name} - ${badge.active ? "Unlocked" : "Locked"}`}
                      className={`aspect-square border-4 border-primary flex items-center justify-center transition-colors cursor-help group bg-white ${
                        badge.active ? badge.color : "bg-surface-container-low opacity-40 grayscale"
                      }`}
                    >
                      <span className="material-symbols-outlined text-4xl text-primary group-hover:scale-110 transition-transform">
                        {badge.icon}
                      </span>
                    </div>
                  ))}
                </div>
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
