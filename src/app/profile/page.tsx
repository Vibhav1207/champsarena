"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

interface Pokemon {
  name: string;
  types: string[];
  imgUrl: string;
  imgAlt: string;
}

export default function Profile() {
  // 3D card tilt values
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const pokemonSquad: Pokemon[] = [
    {
      name: "Dragonite",
      types: ["Dragon", "Flying"],
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2yTz_FoqBcl3-wQte7pgq_j6H17YmkZLNHDXbWX7pLiofwbWVXOdF7tDYCWpI-kg0eYUeu1C-KhFfWUslN1eNIxIsfb7Qk5F4s-AO11CqGOaE7GtFv1Kp0tDAQPUSkRyRpGVOyP6riTNis-nUtE48RbqKxoLf2T1xlMoWBmB3vWmvN5ecGJEMXMvy6nEnvlUyXDw07PfPtz9lHErtiS1FTtbFXgAmFMlBmO2jocuQqp3OFz2g1n7XWm59N3gHTnDoLehE3GbWAMA",
      imgAlt: "3D render metallic Poké Ball icon",
    },
    {
      name: "Gholdengo",
      types: ["Steel"],
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCu0t364iyBwtVTIHG-RHmE-_no_76WGJbBpRVe0RNGENmHK8mHElntDgEbdUQk6P8P9e9hZK5ZJkylHiGSCNRnQYsliif9vFxve3PBX-5stm7fbl-0ishLldaM-NWjKvRruuUpdNrAnYuZSwbTwu_s62OBzXgqJBJRngMNRQumTebb25RW0RcUyfwYl4Ebyj7AuERdp-VUX3u2TPLkrX2ZDjV3ou1SD0oJCA-jzxG811oPAIEMIYq4duSKbh02Lu6cimmglJqT8zM",
      imgAlt: "Reflective Great Ball render",
    },
    {
      name: "Flutter Mane",
      types: ["Ghost"],
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAty_IAwwFW6wd8o5yi2JuD2zAhCnrZG6W_Xd1b3QVwJeMRQ-i9EpC-2xM7BlizbKGyLe5ZAdTTT3yDfLlTIRaIALDeowOW6SMdPpsQZT0kWTLnv8jldIxC90sQaVNk-16qiU8c1scFCe7XUyDhAiKs9LXk97AD3vEdzd3RMKtl-CmtwQaPnF_9-I7kZGXJviJS7yrM7PZGcuhdrfA9tY9V_Km1dmKCydg7zfbdXxquq0EMmSXKEv36YMIaQ-wYx9Cl0TxkfTR_8mo",
      imgAlt: "Metallic Ultra Ball render",
    },
    {
      name: "Iron Hands",
      types: ["Electric"],
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSI-wfDlkkYejAaRMOMwZje9Dfa-FVC79Ai_CpH_ytBq-moj_i91dYvE5gUZnsNKEke-gz-rqvat_t_BXSuxq6tg_vx4x9saZd_asFlWWfpFucybZbCfIDfj6YYY62qmqiwzLRdLCw_H1UA9aSeanRej6V58RVeCj78Hvf-hJVpB88_bi8AXmub5vIIawlh8uTJJiAUNxdQOg2drSknheKR1Ey4ByCUdv19YOb0JlPtGzEPayOv7OxAlNMd4PyuWNX1NRWb6zy1hE",
      imgAlt: "Clockwork-inspired Timer Ball render",
    },
    {
      name: "Chien-Pao",
      types: ["Ice"],
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwSdowhTHbdY_WTX4UH2GnyaCkEeUmESoKbYVMt-kmUj8zPIjqYGS9M5c-siQdbwPc0JdLS4IZNCkyTN3vtEZJ90v00GPcj5eLM_qNbr8SA9EGPTMy_h5DWNtMQBWA-Qqd12WIwVqWFcdB0iBn3G4uTn5OqrwA_mHTBXFaLQb6XjPdhkHkfQTuw_RfNu5_plT5b3iUfVZAb3OkFKwLj2B1GnyKZZ5pb_z6Ph9seMGgA5ANwO2nqAPF6JGVE3pS1YnyPKvSvItRFJM",
      imgAlt: "Polished Luxury Ball render",
    },
  ];

  const badges = [
    { name: "Regional Champ", icon: "workspace_premium", color: "text-yellow-600 bg-yellow-50 border-yellow-200", active: true },
    { name: "100 Wins", icon: "stars", color: "text-blue-600 bg-blue-50 border-blue-200", active: true },
    { name: "Tactician", icon: "psychology", color: "text-purple-600 bg-purple-50 border-purple-200", active: true },
    { name: "Grand Master", icon: "trophy", color: "text-gray-500 bg-gray-100 border-gray-200", active: false },
    { name: "Collector", icon: "eco", color: "text-green-600 bg-green-50 border-green-200", active: true },
    { name: "On Fire", icon: "local_fire_department", color: "text-red-600 bg-red-50 border-red-200", active: true },
  ];

  const tournamentHistory = [
    { event: "Indigo Plateau Regional", date: "Oct 24, 2024", rank: "#4", points: "+150 CP", dotColor: "bg-blue-500" },
    { event: "Spring International Open", date: "Sep 12, 2024", rank: "#12", points: "+80 CP", dotColor: "bg-yellow-500" },
    { event: "Celadon City Invitational", date: "Aug 05, 2024", rank: "#1", points: "+300 CP", dotColor: "bg-blue-500" },
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Limits: Max rotation 10 deg on X, 10 deg on Y
    const calculatedX = (y - centerY) / 20;
    const calculatedY = (centerX - x) / 40;
    
    setRotateX(calculatedX);
    setRotateY(calculatedY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <>
      <Navigation />

      <main className="max-w-container-max mx-auto px-md py-lg space-y-lg">
        
        {/* Main Trainer Card box */}
        <section className="grid grid-cols-1 gap-lg select-none">
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              transition: rotateX === 0 && rotateY === 0 ? "transform 0.5s ease" : "none",
            }}
            className="trainer-card-gradient rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row relative cursor-pointer"
          >
            {/* Flashing ID Chip Decoration */}
            <div className="absolute top-4 right-4 bg-tertiary/10 px-sm py-xs rounded-full flex items-center gap-xs border border-tertiary/20">
              <div className="w-2 h-2 bg-tertiary rounded-full animate-pulse"></div>
              <span className="font-label-lg text-tertiary font-bold tracking-wider text-[11px]">
                OFFICIAL ID: 4829-XJ
              </span>
            </div>

            {/* Left Column: Trainer photo & name */}
            <div className="md:w-1/3 p-lg flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-outline-variant/30 bg-white/40">
              <div className="relative group">
                <div className="w-48 h-48 rounded-full border-4 border-tertiary/20 p-1 relative overflow-hidden bg-surface shadow-md">
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2m0uFr8ZYf6G2xUoHleC1yw2YEnvxaDJr17ZxQ5jQt6DcW_fdnx2MuPDad0Imb7BnvcSPzM5nrLQ-B_iNunutW2EwIl75iyZ6yTUDQwZCmLA-jMPN0Y03ulLvt0A0lsztAPQvvtjT4uvYb6ASpyQhmTD9lHNvS19Q2vSA8TDNf9wGkZUfPSDyfqQZ8U_hHu6tmj5KDEMPq3XMruKrvLUtrEgNt-dEc3kpd14w_hPktYEES54rKqkRlbYUeT539lUYSz16c1tiJeE"
                    alt="Ash Ketchum headshot"
                    fill
                    priority
                    className="object-cover rounded-full"
                    sizes="192px"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white border border-outline-variant shadow-md p-2 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary text-[20px] material-symbols-fill">
                    verified
                  </span>
                </div>
              </div>
              <h1 className="font-headline-lg text-headline-lg mt-md text-on-surface font-bold leading-tight">
                Trainer Ash
              </h1>
              <p className="font-body-md text-on-surface-variant font-medium mt-0.5">
                Joined March 2024
              </p>
            </div>

            {/* Right Column: Stats & Signature Partners */}
            <div className="md:w-2/3 p-lg flex flex-col justify-between space-y-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md pt-sm">
                <div className="space-y-xs">
                  <span className="font-label-lg text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                    Current Rank
                  </span>
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-tertiary text-[32px] material-symbols-fill select-none">
                      military_tech
                    </span>
                    <div className="flex flex-col">
                      <span className="font-title-lg text-title-lg text-on-surface font-semibold leading-tight">
                        Ace Trainer
                      </span>
                      <span className="font-body-md text-tertiary font-medium">
                        Top 5% Regionally
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-xs">
                  <span className="font-label-lg text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                    Home Region
                  </span>
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-tertiary text-[32px] select-none">
                      public
                    </span>
                    <div className="flex flex-col">
                      <span className="font-title-lg text-title-lg text-on-surface font-semibold leading-tight">
                        Kanto District
                      </span>
                      <span className="font-body-md text-on-surface-variant font-medium">
                        Badge Count: 8
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature partners line */}
              <div className="pt-md border-t border-outline-variant/30">
                <span className="font-label-lg text-on-surface-variant uppercase tracking-wider mb-sm block font-semibold text-[11px]">
                  Signature Partners
                </span>
                <div className="flex gap-md flex-wrap">
                  {[
                    { name: "Pikachu", icon: "electric_bolt" },
                    { name: "Charizard", icon: "local_fire_department" },
                    { name: "Greninja", icon: "water_drop" },
                  ].map((partner, i) => (
                    <div key={i} className="flex flex-col items-center gap-xs">
                      <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center border border-outline-variant/50 hover:bg-tertiary/10 hover:border-tertiary transition-colors shadow-inner">
                        <span className="material-symbols-outlined text-tertiary text-[24px]">
                          {partner.icon}
                        </span>
                      </div>
                      <span className="font-label-lg font-bold">{partner.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tournament Team Squad slots */}
        <section className="space-y-sm">
          <div className="flex justify-between items-end select-none">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Tournament Team
              </h2>
              <p className="font-body-md text-on-surface-variant">
                Active VGC Championship Squad
              </p>
            </div>
            <button className="text-tertiary font-bold hover:underline active:scale-95 transition-all text-body-md">
              Manage Team
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-sm">
            {pokemonSquad.map((pokemon, i) => (
              <div
                key={i}
                className="pokemon-slot bg-surface border border-outline-variant rounded-xl p-sm flex flex-col items-center justify-center space-y-xs cursor-pointer shadow-sm"
              >
                <div className="w-20 h-20 relative select-none">
                  <Image
                    src={pokemon.imgUrl}
                    alt={pokemon.imgAlt}
                    fill
                    className="object-contain"
                    sizes="80px"
                  />
                </div>
                <div className="text-center select-none">
                  <span className="font-title-lg text-body-md block text-on-surface font-bold leading-tight">
                    {pokemon.name}
                  </span>
                  <div className="flex gap-1 justify-center mt-1">
                    {pokemon.types.map((t, idx) => (
                      <span
                        key={idx}
                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase shadow-sm ${
                          t === "Dragon"
                            ? "bg-orange-100 text-orange-700"
                            : t === "Flying"
                            ? "bg-blue-100 text-blue-700"
                            : t === "Steel"
                            ? "bg-yellow-100 text-yellow-800"
                            : t === "Ghost"
                            ? "bg-purple-100 text-purple-700"
                            : t === "Electric"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Add member slot */}
            <div className="pokemon-slot border-2 border-dashed border-outline-variant rounded-xl p-sm flex flex-col items-center justify-center space-y-xs cursor-pointer hover:bg-surface-container-low group select-none transition-colors min-h-[148px] shadow-sm">
              <span className="material-symbols-outlined text-outline-variant group-hover:text-tertiary text-[48px] transition-colors">
                add_circle
              </span>
              <span className="font-label-lg text-on-surface-variant font-bold">Add Member</span>
            </div>
          </div>
        </section>

        {/* Achievement Badges & Recent History split bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg pt-sm">
          {/* Achievement Badges Column */}
          <div className="lg:col-span-1 space-y-sm">
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold select-none">
              Achievement Badges
            </h3>
            <div className="bg-surface rounded-xl border border-outline-variant p-md grid grid-cols-3 gap-md shadow-sm">
              {badges.map((badge, idx) => (
                <div
                  key={idx}
                  title={`${badge.name} - ${badge.active ? "Unlocked" : "Locked"}`}
                  className={`flex flex-col items-center group cursor-help transition-all ${
                    badge.active ? "" : "opacity-40 grayscale"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border transition-transform group-hover:scale-110 shadow-sm ${badge.color}`}
                  >
                    <span className={`material-symbols-outlined text-[24px] ${badge.active ? "material-symbols-fill" : ""}`}>
                      {badge.icon}
                    </span>
                  </div>
                  <span className="text-[9px] mt-1 font-bold text-center uppercase text-on-surface-variant tracking-tighter select-none">
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tournament History Column */}
          <div className="lg:col-span-2 space-y-sm">
            <h3 className="font-title-lg text-title-lg text-on-surface font-bold select-none">
              Recent Tournaments
            </h3>
            <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant select-none">
                      <th className="px-md py-sm font-label-lg text-on-surface-variant uppercase tracking-wider text-[11px] font-bold">
                        Event
                      </th>
                      <th className="px-md py-sm font-label-lg text-on-surface-variant uppercase tracking-wider text-[11px] font-bold">
                        Date
                      </th>
                      <th className="px-md py-sm font-label-lg text-on-surface-variant uppercase tracking-wider text-[11px] font-bold">
                        Rank
                      </th>
                      <th className="px-md py-sm font-label-lg text-on-surface-variant uppercase tracking-wider text-[11px] font-bold">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {tournamentHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                        <td className="px-md py-sm">
                          <div className="flex items-center gap-xs">
                            <div className={`w-2.1 h-2.1 rounded-full ${item.dotColor} shrink-0`} />
                            <span className="font-title-lg text-body-md text-on-surface font-bold leading-tight">
                              {item.event}
                            </span>
                          </div>
                        </td>
                        <td className="px-md py-sm font-body-md text-[13px] text-on-surface-variant font-medium">
                          {item.date}
                        </td>
                        <td className="px-md py-sm">
                          <span className="px-2.5 py-0.5 bg-tertiary/10 text-tertiary text-[11px] font-bold rounded-full border border-tertiary/20">
                            {item.rank}
                          </span>
                        </td>
                        <td className="px-md py-sm font-title-lg text-body-md text-on-surface font-bold">
                          {item.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
