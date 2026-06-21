"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

interface Tournament {
  id: string;
  title: string;
  format: "VGC" | "TCG" | "GO";
  tier: "Regional" | "International";
  date: string;
  cost: string;
  prize: string;
  slotsUsed: number;
  slotsTotal: number;
  bgUrl: string;
  imageAlt: string;
  statusText?: string;
  statusColor?: string;
}

export default function Tournaments() {
  const [selectedFormat, setSelectedFormat] = useState<string[]>(["VGC"]);
  const [selectedRegion, setSelectedRegion] = useState("North America");
  const [selectedTier, setSelectedTier] = useState("Regional");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const tournamentsData: Tournament[] = [
    {
      id: "london-regional-championships",
      title: "London Regional Championships",
      format: "VGC",
      tier: "Regional",
      date: "Dec 14, 2024",
      cost: "£45.00",
      prize: "£10,000 Pool",
      slotsUsed: 982,
      slotsTotal: 1024,
      bgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhtk607KBiCbdQvybjgNZ2gNKkzoM2lsIgp4bwuQ6j2UJ_en9Kj8obXtAyG_ZEBIwnSwpXB7S3cWooSmS3-cUBEXUCtrPjKRhZRNr6JN4lqbvsPtt8HdWD2xpjbso2Tv_6FJErMKA8IYo7OkrU7z9Id5UjxdTUKhsF2KvkmXBNPSL4i1Q8SGSsfLk0UO8cMZTPSPVzvms3kNDx4P2ez_2Kz9kghCmoQIjx_HXKVa2AcbynL8Bxm7xKmghwQBi7J4k2x1uvHD-D9Yw",
      imageAlt: "High-tech Pokémon arena with glowing blue hexagonal floor panels",
      statusText: "Registration closing soon!",
      statusColor: "text-error",
    },
    {
      id: "ocic-melbourne-master-series",
      title: "OCIC Melbourne Master Series",
      format: "TCG",
      tier: "International",
      date: "Jan 05, 2025",
      cost: "$60.00",
      prize: "$25,000 Pool",
      slotsUsed: 302,
      slotsTotal: 512,
      bgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLVbdiAm1MMbXGMYA2zWLNMo0ndeBw3pGWYBE8KUNLpdF17MFBuWj9tfOHtxNRisFryJIk72498f-W4oi0lEw19I07Or4y5yBTxHg2k86f0sy4DZmvqEspQGdbmvYyJDfjebNPaVFzxp9NJu0vvingyBnCrGxGkWwj0Bnrexkx4W4QQpECGsoTMijaBdFPAGPPEOkXLj95a9D8iGuXWyELvzOAVzitCsNorMfqRi9rAiYWqo1vZKJK1olYoryVALd2piHQhBzq4eY",
      imageAlt: "Golden international esports stage with high-key lighting",
      statusText: "Slots remaining",
      statusColor: "text-on-surface-variant",
    },
    {
      id: "tokyo-go-championship",
      title: "Tokyo GO Championship",
      format: "GO",
      tier: "Regional",
      date: "Dec 28, 2024",
      cost: "¥3,500",
      prize: "¥1.2M Pool",
      slotsUsed: 241,
      slotsTotal: 256,
      bgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcHC7tn2-5rUOUhQgukY-uqr8l76-5Ag7t1F3XXUSwixJcWU69W1VSICNZLGJOM6Tagyp3Ll5S7_L6oz7Q0S_6RTc8c0258mL4tuoKzxS-a0qT_3-eBESDEzMaScdUGd8A-dy0f3kLZ4vAYT1FHPowUblyZ9sa-91cqVjplcRXZ7C74Pxp4ilNsxyiPRZPcq_GwFq6K5n_t5LA_pMrCo1dTeAHFkcBi22rLtXeuJil9QT_Z-2BHTtY2S5v1eZEhkDLZCU3fHqWMHU",
      imageAlt: "Urban park setup for Pokémon GO tournament",
      statusText: "Almost full!",
      statusColor: "text-error",
    },
    {
      id: "toronto-open-tcg-finals",
      title: "Toronto Open TCG Finals",
      format: "TCG",
      tier: "Regional",
      date: "Feb 12, 2025",
      cost: "$35.00",
      prize: "$5,000 Pool",
      slotsUsed: 574,
      slotsTotal: 1024,
      bgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvdPG7Q-6FJsrVSKs1i2ACqHNxfvmL2HBcIdz1e3nCXuk5qkqfR_7nrE1fVPAfYCnEb-50poHzqa9fAN0PVGBHNuvdmaHYmhb2uSfduRsBoqPSXi6NmUTC1XjgPi14wLADGUly1k5xaSZYZDA5c589ercr72P09okikd8DW4RQPCWD2FW8J46VHjmmW0eZcMRI2uY06gRszLttGTmsNbQbFMuLUx3uCPwjOzTY6poF2IQjq9fgEzv2vR79hwU5OkQEgvpr_YCxD28",
      imageAlt: "Minimalist tables and high-backed chairs set up for card game",
      statusText: "Registration open",
      statusColor: "text-on-surface-variant",
    },
    {
      id: "berlin-pro-qualifier",
      title: "Berlin Pro Qualifier",
      format: "VGC",
      tier: "Regional",
      date: "Feb 20, 2025",
      cost: "€40.00",
      prize: "€8,500 Pool",
      slotsUsed: 0,
      slotsTotal: 128,
      bgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBEi_rHMcusr28WzYB1KbxZ9O9in9F6427VEn3QpYSPirSa14TD6sWWwkW6Pirl6JJga8wd0by2XuNHdbjgyJ3tfL55yLHsBOUrPy6SdW3ba0yVH-5C7lEXIHkS-vq46hphJ3iwdZQhFMKmea6pmMXtxqZFsXeM51fnivOzt_KklN2L_ZPeWNpIqlzBNrdluVEn6oCWs4K95fHtHBST3zkWID9DrSEFCnm0EbcnQhOpd9X9ldYEWr3-S6xAfJh09v6_zBXuDDpVo1s",
      imageAlt: "Futuristic stadium entrance with marble columns and glass panels",
      statusText: "New Listing!",
      statusColor: "text-tertiary font-bold",
    },
  ];

  const handleFormatChange = (format: string) => {
    if (selectedFormat.includes(format)) {
      setSelectedFormat(selectedFormat.filter((f) => f !== format));
    } else {
      setSelectedFormat([...selectedFormat, format]);
    }
  };

  const handleResetFilters = () => {
    setSelectedFormat(["VGC"]);
    setSelectedRegion("North America");
    setSelectedTier("Regional");
    setStartDate("");
    setEndDate("");
  };

  // Card reveal list transition
  const gridVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <>
      <Navigation />

      <main className="max-w-container-max mx-auto px-md py-lg min-h-screen">
        <div className="flex flex-col lg:flex-row gap-lg">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white p-sm rounded-xl border border-outline-variant shadow-sm sticky top-[80px]">
              <div className="flex items-center justify-between mb-sm select-none">
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Filters
                </h2>
                <button
                  onClick={handleResetFilters}
                  className="text-tertiary font-label-lg text-label-lg hover:underline font-semibold"
                >
                  Reset All
                </button>
              </div>

              {/* Format Checkbox list */}
              <div className="mb-md">
                <h3 className="font-title-lg text-title-lg text-on-surface-variant mb-xs font-semibold text-[15px] uppercase tracking-wider">
                  Format
                </h3>
                <div className="space-y-xs">
                  {["VGC (Video Game)", "TCG (Trading Card)", "Pokémon GO"].map((label) => {
                    const formatCode = label.split(" ")[0] as "VGC" | "TCG" | "GO";
                    const checked = selectedFormat.includes(formatCode);
                    return (
                      <label
                        key={formatCode}
                        className="flex items-center gap-xs cursor-pointer group select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleFormatChange(formatCode)}
                          className="custom-checkbox focus:ring-0 outline-none"
                        />
                        <span
                          className={`font-body-md text-body-md transition-colors group-hover:text-tertiary ${
                            checked ? "text-tertiary font-bold" : "text-on-surface-variant"
                          }`}
                        >
                          {label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Region Selector */}
              <div className="mb-md">
                <h3 className="font-title-lg text-title-lg text-on-surface-variant mb-xs font-semibold text-[15px] uppercase tracking-wider">
                  Region
                </h3>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs font-body-md text-body-md focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary outline-none"
                >
                  <option>North America</option>
                  <option>Europe</option>
                  <option>Latin America</option>
                  <option>Asia Pacific</option>
                  <option>Oceania</option>
                </select>
              </div>

              {/* Tier Filter Pills */}
              <div className="mb-md select-none">
                <h3 className="font-title-lg text-title-lg text-on-surface-variant mb-xs font-semibold text-[15px] uppercase tracking-wider">
                  Tier
                </h3>
                <div className="flex flex-wrap gap-xs">
                  {["Regional", "International", "Special Event"].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`px-sm py-base rounded-full border font-label-lg text-label-lg font-bold transition-all ${
                        selectedTier === tier
                          ? "border-tertiary text-tertiary bg-tertiary/5"
                          : "border-outline-variant text-on-surface-variant hover:border-tertiary hover:text-tertiary"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filters */}
              <div>
                <h3 className="font-title-lg text-title-lg text-on-surface-variant mb-xs font-semibold text-[15px] uppercase tracking-wider">
                  Date
                </h3>
                <div className="space-y-xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs font-body-md text-body-md outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary"
                  />
                  <p className="text-center font-label-lg text-label-lg text-outline font-semibold select-none uppercase text-[10px]">
                    to
                  </p>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs font-body-md text-body-md outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Main Tournament Grid */}
          <div className="flex-grow">
            <header className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant/30 pb-md">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                  Available Tournaments
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant">
                  Join the competitive circuit and prove you&apos;re the very best.
                </p>
              </div>
              <div className="flex items-center gap-xs font-label-lg text-label-lg text-on-surface-variant bg-white px-sm py-xs rounded-full border border-outline-variant select-none font-bold">
                <span>Showing 5 of 142 tournaments</span>
              </div>
            </header>

            {/* List and Animations */}
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-md"
            >
              {tournamentsData.map((tournament) => {
                const isRegional = tournament.tier === "Regional";
                const capacityPercent = Math.min(
                  100,
                  Math.round((tournament.slotsUsed / tournament.slotsTotal) * 100)
                );

                return (
                  <motion.article
                    key={tournament.id}
                    variants={cardVariants}
                    className={`tournament-card bg-white rounded-xl overflow-hidden border border-outline-variant shadow-sm hover:shadow-lg flex flex-col border-t-4 ${
                      isRegional ? "border-t-tertiary" : "border-t-victory-gold"
                    }`}
                  >
                    <div className="relative h-48 w-full bg-surface-dim">
                      <Image
                        src={tournament.bgUrl}
                        alt={tournament.imageAlt}
                        fill
                        className="object-cover opacity-80"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 30vw"
                      />
                      <div className="absolute top-sm right-sm flex gap-xs select-none">
                        <span className="bg-on-surface text-white px-sm py-base rounded-full font-label-lg text-label-lg font-bold shadow-sm">
                          {tournament.format}
                        </span>
                        <span
                          className={`px-sm py-base rounded-full font-label-lg text-label-lg font-bold shadow-sm ${
                            isRegional ? "bg-white text-tertiary" : "bg-victory-gold text-white"
                          }`}
                        >
                          {tournament.tier}
                        </span>
                      </div>
                    </div>

                    <div className="p-sm flex-grow flex flex-col">
                      <h3 className="font-headline-md text-headline-md text-on-surface mb-xs leading-tight font-bold">
                        {tournament.title}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-y-xs gap-x-sm mb-md text-on-surface-variant">
                        <div className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-outline text-[18px]">
                            calendar_month
                          </span>
                          <span className="font-body-md text-[13px]">{tournament.date}</span>
                        </div>
                        <div className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-outline text-[18px]">
                            payments
                          </span>
                          <span className="font-body-md text-[13px]">{tournament.cost}</span>
                        </div>
                        <div className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-outline text-[18px]">
                            trophy
                          </span>
                          <span className="font-body-md text-[13px] font-bold text-tertiary">
                            {tournament.prize}
                          </span>
                        </div>
                        <div className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-outline text-[18px]">
                            group
                          </span>
                          <span className="font-body-md text-[13px]">
                            {tournament.slotsTotal - tournament.slotsUsed}/{tournament.slotsTotal} Left
                          </span>
                        </div>
                      </div>

                      {/* Progress occupancy bar */}
                      <div className="mt-auto space-y-xs select-none">
                        <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden flex">
                          <div
                            className={`h-full ${isRegional ? "bg-tertiary" : "bg-victory-gold"}`}
                            style={{ width: `${capacityPercent}%` }}
                          ></div>
                        </div>
                        {tournament.statusText && (
                          <p className={`text-right font-label-lg text-label-lg font-bold ${tournament.statusColor}`}>
                            {tournament.statusText}
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/tournaments/${tournament.id}`}
                        className="w-full mt-sm bg-tertiary text-on-tertiary py-xs rounded-lg font-title-lg text-center font-bold shadow-[0_2px_0_0_#2b3896] hover:shadow-none hover:translate-y-[2px] active:translate-y-[2px] active:scale-[0.98] transition-all block"
                      >
                        Join Tournament
                      </Link>
                    </div>
                  </motion.article>
                );
              })}

              {/* Empty/Upcoming Teaser Card */}
              <motion.article
                variants={cardVariants}
                className="bg-surface-container-low rounded-xl border border-dashed border-outline-variant flex flex-col items-center justify-center p-lg text-center"
              >
                <span className="material-symbols-outlined text-outline-variant text-[64px] mb-sm select-none">
                  more_horiz
                </span>
                <h3 className="font-title-lg text-title-lg text-outline mb-xs font-semibold">
                  More Tournaments Coming
                </h3>
                <p className="font-body-md text-body-md text-outline">
                  New Regional and International events are added weekly. Stay tuned for the Season 2025 schedule.
                </p>
                <button className="mt-md font-label-lg text-label-lg text-tertiary hover:underline font-bold active:scale-95 transition-transform">
                  Get Notified
                </button>
              </motion.article>
            </motion.div>

            {/* Pagination Controls */}
            <div className="mt-xl flex items-center justify-center gap-xs select-none">
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white active:scale-90 transition-all">
                <span className="material-symbols-outlined text-[20px]">
                  chevron_left
                </span>
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-tertiary text-white font-title-lg font-bold shadow-sm">
                1
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white active:scale-90 transition-all font-title-lg font-medium">
                2
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white active:scale-90 transition-all font-title-lg font-medium">
                3
              </button>
              <span className="px-xs text-outline font-bold">...</span>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white active:scale-90 transition-all font-title-lg font-medium">
                12
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-white active:scale-90 transition-all">
                <span className="material-symbols-outlined text-[20px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
