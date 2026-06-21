"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
}

interface Tournament {
  id: string;
  title: string;
  description: string;
  banner: string | null;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  startDate: string;
  type: string;
  status: string;
  _count?: {
    registrations: number;
  };
}

interface PodiumPlayer {
  name: string;
  elo: number;
  wins: number;
  image: string | null;
}

export default function Home() {
  // Real data state with mock fallbacks
  const [featuredAnnouncement, setFeaturedAnnouncement] = useState<Announcement>({
    id: "ann-default",
    title: "Registration for the 2024 International Season is Now Open!",
    content: "Secure your spot in the most prestigious tournament of the year. Over $1,000,000 in prizes and the title of World Champion are up for grabs.",
    pinned: true,
    createdAt: "2024-10-24T00:00:00Z",
  });

  const [upcomingEvents, setUpcomingEvents] = useState<Tournament[]>([
    {
      id: "london-regional-championships",
      title: "London Regional Championships",
      description: "Excel London, UK",
      banner: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhtk607KBiCbdQvybjgNZ2gNKkzoM2lsIgp4bwuQ6j2UJ_en9Kj8obXtAyG_ZEBIwnSwpXB7S3cWooSmS3-cUBEXUCtrPjKRhZRNr6JN4lqbvsPtt8HdWD2xpjbso2Tv_6FJErMKA8IYo7OkrU7z9Id5UjxdTUKhsF2KvkmXBNPSL4i1Q8SGSsfLk0UO8cMZTPSPVzvms3kNDx4P2ez_2Kz9kghCmoQIjx_HXKVa2AcbynL8Bxm7xKmghwQBi7J4k2x1uvHD-D9Yw",
      entryFee: 45.00,
      prizePool: 10000,
      maxPlayers: 1024,
      startDate: "2024-11-15T09:00:00Z",
      type: "SWISS",
      status: "REGISTRATION_OPEN",
    },
    {
      id: "ocic-melbourne-master-series",
      title: "OCIC Melbourne Master Series",
      description: "Tokyo, Japan",
      banner: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLVbdiAm1MMbXGMYA2zWLNMo0ndeBw3pGWYBE8KUNLpdF17MFBuWj9tfOHtxNRisFryJIk72498f-W4oi0lEw19I07Or4y5yBTxHg2k86f0sy4DZmvqEspQGdbmvYyJDfjebNPaVFzxp9NJu0vvingyBnCrGxGkWwj0Bnrexkx4W4QQpECGsoTMijaBdFPAGPPEOkXLj95a9D8iGuXWyELvzOAVzitCsNorMfqRi9rAiYWqo1vZKJK1olYoryVALd2piHQhBzq4eY",
      entryFee: 60.00,
      prizePool: 25000,
      maxPlayers: 512,
      startDate: "2025-01-05T09:00:00Z",
      type: "ROUND_ROBIN",
      status: "UPCOMING",
    },
    {
      id: "tokyo-go-championship",
      title: "Tokyo GO Championship",
      description: "Los Angeles, USA",
      banner: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcHC7tn2-5rUOUhQgukY-uqr8l76-5Ag7t1F3XXUSwixJcWU69W1VSICNZLGJOM6Tagyp3Ll5S7_L6oz7Q0S_6RTc8c0258mL4tuoKzxS-a0qT_3-eBESDEzMaScdUGd8A-dy0f3kLZ4vAYT1FHPowUblyZ9sa-91cqVjplcRXZ7C74Pxp4ilNsxyiPRZPcq_GwFq6K5n_t5LA_pMrCo1dTeAHFkcBi22rLtXeuJil9QT_Z-2BHTtY2S5v1eZEhkDLZCU3fHqWMHU",
      entryFee: 10.00,
      prizePool: 2500,
      maxPlayers: 256,
      startDate: "2024-12-12T09:00:00Z",
      type: "DOUBLE_ELIMINATION",
      status: "UPCOMING",
    },
  ]);

  const [podium, setPodium] = useState<{
    first: PodiumPlayer;
    second: PodiumPlayer;
    third: PodiumPlayer;
  }>({
    first: {
      name: "Marcus Vance",
      elo: 1450,
      wins: 45,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3NlXblngKtpCbl-MiUTpaPbPcz5dlXq-Cl1KYK7l2p3KnCm4sHJRFLENLPwJ5Qm6vsY7FQyLqbtVyrrXCILKyQZ_6JISHPj-TCbkFIvI_YOuJiw5i4uA0yvXl5lrysA-gm5cbx_lksG6zNHooqA9uydh1tzVoIZrNtzcymmE_vLK3To1t_6EZUQZsZom1k9wzYkpDXDeeMYx_GSuCkKLm6XxPyA9cH1jmCQ2M5iaPTOnocNnVfw5X_CZwV9vBm-ZT5JewA8SYgnc",
    },
    second: {
      name: "Alex Kim",
      elo: 1240,
      wins: 38,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9gsQw6Y-zSlHCerJ7-zku2SOA23kCGzZl3vZZPHfdMP02WMUDrcyPwSOTdz0XAxBWMvrmQ-BsY7HooSbg-1Os0x59i4GXWJ91t3XuS24sqSLyi34iZOTCQwTeehMjDNrJuiCIt01lDL2TF58_znFuXNbYsYbeZoWObtDys08_vjkmK5FtE1gi3ZgWYh3gSwVpQoCBW58yUbhPZRx9y1BdG_-9Odcgmx6tVY6C7kHqWOKJXT5N44qwhIShQS3K-4hHHrw8VrHqU8Y",
    },
    third: {
      name: "Elena Ross",
      elo: 1180,
      wins: 32,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB7wSSy1cuSclpeDjk38IfpBrB_TI71I0TUBwta7qEZnuFc1eaI_Uv2C8ZrU6SB3iOmzY-9-eq29E29gEuTbQkhNZax041mhOpQqKk0l-S97IjRywUH3iCrhf-KSla5CpKD_pzco5ncRnAo416gbLZXL3qHhYNNMhaCIAMCJyIBKfWy3sScQVk7bO5iMZ4Ne0ekJcYCMqmiMTNnMqh0GxoT2bRgXPRHWFl4ldpn6VUNZp3tuG2GZAEIleWznxH8i91lBus1H-AqmqE",
    },
  });

  const [marqueeWinners, setMarqueeWinners] = useState<string[]>([
    "Leon 'The Unbeatable' (Galar Regional)",
    "Cynthia 'The Champion' (Sinnoh Masters)",
    "Steven 'Iron Will' (Hoenn Cup)",
    "Lance 'Dragon Master' (Indigo Invitational)",
  ]);

  useEffect(() => {
    // Fetch announcements
    fetch("/api/announcements")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const featured = data.find((a: any) => a.pinned) || data[0];
          setFeaturedAnnouncement({
            id: featured.id,
            title: featured.title,
            content: featured.content,
            pinned: featured.pinned,
            createdAt: featured.createdAt,
          });
        }
      })
      .catch((err) => console.log("Failed to fetch live announcements, using fallback", err));

    // Fetch tournaments
    fetch("/api/tournaments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Use up to 3 upcoming/ongoing tournaments
          const filtered = data
            .filter((t: any) => t.status === "REGISTRATION_OPEN" || t.status === "UPCOMING" || t.status === "ONGOING")
            .slice(0, 3);
          if (filtered.length > 0) {
            setUpcomingEvents(filtered);
          }
        }
      })
      .catch((err) => console.log("Failed to fetch live tournaments, using fallback", err));

    // Fetch top users for podium
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length >= 3) {
          setPodium({
            first: {
              name: data[0].name || "Trainer",
              elo: data[0].elo,
              wins: data[0].wins,
              image: data[0].image || null,
            },
            second: {
              name: data[1].name || "Trainer",
              elo: data[1].elo,
              wins: data[1].wins,
              image: data[1].image || null,
            },
            third: {
              name: data[2].name || "Trainer",
              elo: data[2].elo,
              wins: data[2].wins,
              image: data[2].image || null,
            },
          });
        }
      })
      .catch((err) => console.log("Failed to fetch leaderboard, using fallback", err));
  }, []);

  // Anim container variant
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  } as const;

  return (
    <>
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden bg-surface-dim">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
            {/* Optimized Next.js Image component */}
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIKxLGbKi9AFU6kDvRhPMdZ_gJBwFV86yr70Mjr49MK56QHhQOlrhO2_x-ozbLR-DOiT5jF7wbElOr20jF4xJJ_DQ2DSALh6jUWg3q__3vUjLdahhrdMY_QfxaittO9lpwpkfWAzwjtS-JWvZf9rtIwIadQe0B6pkiSERH_S1-EDIzPvkIFFVg-uF8aRtUFsgjWk0pa4sdBSZs0bl1CF12eAmRjfoAmNxNaYNtLuvMP7JmW8R2x25zkhTuniFtQrSEkk7ycr74JTo"
              alt="Pokémon Champions Stadium backdrop"
              fill
              priority
              className="object-cover opacity-80"
              sizes="100vw"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-20 text-center px-sm max-w-3xl"
          >
            <h1 className="font-display-lg text-display-lg md:text-[64px] text-tertiary mb-md drop-shadow-lg leading-tight select-none">
              Pokémon Champions
            </h1>
            <p className="font-headline-md text-on-surface-variant mb-lg max-w-2xl mx-auto">
              The ultimate stage for elite trainers. Join the official tournament series and claim your place in the Hall of Fame.
            </p>
            <div className="flex flex-col sm:flex-row gap-md justify-center items-center">
              <Link
                href="/login"
                className="bg-gold-accent hover:bg-yellow-400 text-black px-xl py-md rounded-xl font-headline-md shadow-lg hover:scale-105 transition-transform active:scale-95 border-b-4 border-yellow-600 font-bold block text-center min-w-[180px]"
              >
                Register Now
              </Link>
              <Link
                href="/tournaments"
                className="bg-surface-container-lowest hover:bg-surface-container text-tertiary border border-tertiary px-xl py-md rounded-xl font-headline-md shadow-md hover:scale-105 transition-transform active:scale-95 font-semibold block text-center min-w-[180px]"
              >
                View Schedule
              </Link>
            </div>
          </motion.div>

          {/* Background Decorative Pokeball Shape */}
          <div className="absolute -bottom-20 -left-20 w-80 h-80 opacity-10 pointer-events-none">
            <div className="w-full h-full border-[20px] border-tertiary rounded-full relative">
              <div className="absolute top-1/2 left-0 w-full h-[20px] bg-tertiary -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-background border-[10px] border-tertiary rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        </section>

        {/* Winners Ticker */}
        <div className="bg-tertiary-fixed py-xs overflow-hidden border-y border-outline-variant select-none">
          <div className="flex whitespace-nowrap animate-marquee items-center">
            <span className="font-label-lg mx-md text-on-tertiary-fixed-variant uppercase tracking-widest font-bold">
              Recent Winners:
            </span>
            {marqueeWinners.map((winner, idx) => (
              <span key={idx} className="flex items-center gap-xs font-title-lg text-tertiary mx-lg">
                <span className="material-symbols-fill text-[20px]">emoji_events</span> {winner}
              </span>
            ))}
            {/* Duplicated for smooth loop */}
            {marqueeWinners.map((winner, idx) => (
              <span key={`dup-${idx}`} className="flex items-center gap-xs font-title-lg text-tertiary mx-lg">
                <span className="material-symbols-fill text-[20px]">emoji_events</span> {winner}
              </span>
            ))}
          </div>
        </div>

        {/* Latest Announcement & Upcoming Events */}
        <section className="max-w-container-max mx-auto px-md py-lg lg:py-xl grid grid-cols-1 lg:grid-cols-12 gap-lg">
          {/* Announcements Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 flex flex-col"
          >
            <h2 className="font-headline-lg text-on-surface mb-md flex items-center gap-xs font-bold">
              <span className="material-symbols-outlined text-tertiary text-[28px]">
                campaign
              </span>
              Latest Announcements
            </h2>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex-grow flex flex-col">
              <div className="h-48 overflow-hidden relative">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGW7-vBXzV5KsC7LXIfK2ot_cPNs1BvRxQf0sHBj6v53DPscGlH_j8DDNJLsA49-gvQHaA7Sr_3zqaf7h27ApQXPUfQhU38Z5Wgp8B6OIkcIyguC5WUEhA0a5rnCc0XF5yuKBjroVnBtoQwra4ilXJNqFl7no6UIkGdSF_x9iXqkY-P-NZUNF_qeyoU9Jrz7gEgBQ2WqVsf4QIVRkLK4P83cCEEs4dzFuPIqZLyKxMy1n8Ym93FtsPqsTpOWKPWZuHCbegLshT6V8"
                  alt="Stadium battle crowd cheering"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
              <div className="p-md flex flex-col flex-grow">
                <div className="flex justify-between items-center mb-xs">
                  <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-xs py-1 rounded font-label-lg font-bold">
                    NEWS
                  </span>
                  <span className="text-on-surface-variant font-label-lg">
                    {new Date(featuredAnnouncement.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <h3 className="font-headline-md text-on-surface mb-xs font-bold leading-tight">
                  {featuredAnnouncement.title}
                </h3>
                <p className="text-body-md text-on-surface-variant mb-md flex-grow">
                  {featuredAnnouncement.content}
                </p>
                <Link
                  href="#"
                  className="text-tertiary font-bold flex items-center gap-xs hover:underline mt-auto"
                >
                  Read More
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Events slider */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 flex flex-col"
          >
            <div className="flex justify-between items-center mb-md">
              <h2 className="font-headline-lg text-on-surface flex items-center gap-xs font-bold">
                <span className="material-symbols-outlined text-tertiary text-[28px]">
                  calendar_month
                </span>
                Upcoming Events
              </h2>
              <div className="flex gap-xs">
                <button className="p-xs rounded-full border border-outline-variant hover:bg-surface-variant active:scale-90 transition-transform">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="p-xs rounded-full border border-outline-variant hover:bg-surface-variant active:scale-90 transition-transform">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Slider cards list */}
            <div className="flex gap-md overflow-x-auto hide-scrollbar pb-xs flex-grow items-stretch select-none">
              {upcomingEvents.map((event, idx) => {
                const isSwiss = event.type === "SWISS";
                const isRoundRobin = event.type === "ROUND_ROBIN";
                const formatLabel = isSwiss ? "VGC Format" : isRoundRobin ? "TCG Format" : "GO Format";
                const formatIcon = isSwiss ? "videogame_asset" : isRoundRobin ? "star" : "smartphone";

                return (
                  <div
                    key={event.id}
                    className={`flex-shrink-0 w-72 bg-white rounded-xl shadow-sm border-t-4 ${
                      idx === 1 ? "border-t-victory-gold" : "border-t-tertiary"
                    } p-md hover:shadow-md transition-all flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-sm">
                        <div className="bg-surface-container px-xs py-1 rounded font-label-lg font-bold">
                          {formatLabel}
                        </div>
                        <span
                          className={`material-symbols-${formatIcon === "star" ? "fill text-victory-gold" : "outlined text-tertiary"}`}
                        >
                          {formatIcon}
                        </span>
                      </div>
                      <h4 className="font-title-lg text-on-surface mb-xs font-semibold">
                        {event.title}
                      </h4>
                      <p className="text-body-md text-on-surface-variant mb-sm flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[16px] text-outline">
                          location_on
                        </span>
                        {event.description}
                      </p>
                      <div className="flex items-center gap-xs mb-md">
                        <span className="material-symbols-outlined text-tertiary text-[18px]">
                          event
                        </span>
                        <span className="text-body-md font-medium text-on-surface">
                          {new Date(event.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/tournaments/${event.id}`}
                      className="w-full text-center py-xs border border-tertiary text-tertiary rounded-lg font-label-lg hover:bg-tertiary hover:text-on-tertiary transition-colors block font-bold"
                    >
                      Details
                    </Link>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* Featured Champions Podium Section */}
        <section className="bg-surface-container-low py-xl relative overflow-hidden">
          <div className="pokeball-pattern absolute inset-0"></div>
          <div className="max-w-container-max mx-auto px-md relative z-10">
            <div className="text-center mb-xl">
              <h2 className="font-display-lg text-display-lg text-tertiary mb-xs font-bold leading-tight">
                Featured Champions
              </h2>
              <p className="text-headline-md text-on-surface-variant font-medium">
                Meet the current leaders of the Global Rankings
              </p>
            </div>

            {/* Podium grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-lg items-end max-w-4xl mx-auto pt-sm"
            >
              {/* Champion 2 - Second */}
              <motion.div
                variants={itemVariants}
                className="order-2 md:order-1 flex flex-col items-center pb-md md:pb-0"
              >
                <div className="relative mb-md">
                  <div className="w-48 h-48 rounded-full border-4 border-outline-variant overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 relative">
                    <Image
                      src={podium.second.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuD9gsQw6Y-zSlHCerJ7-zku2SOA23kCGzZl3vZZPHfdMP02WMUDrcyPwSOTdz0XAxBWMvrmQ-BsY7HooSbg-1Os0x59i4GXWJ91t3XuS24sqSLyi34iZOTCQwTeehMjDNrJuiCIt01lDL2TF58_znFuXNbYsYbeZoWObtDys08_vjkmK5FtE1gi3ZgWYh3gSwVpQoCBW58yUbhPZRx9y1BdG_-9Odcgmx6tVY6C7kHqWOKJXT5N44qwhIShQS3K-4hHHrw8VrHqU8Y"}
                      alt={podium.second.name}
                      fill
                      className="object-cover"
                      sizes="192px"
                    />
                  </div>
                  <div className="absolute -bottom-2 right-4 bg-outline text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shadow-md border-2 border-white select-none">
                    2
                  </div>
                </div>
                <h3 className="font-headline-md text-on-surface font-bold">
                  {podium.second.name}
                </h3>
                <p className="text-on-surface-variant font-label-lg uppercase tracking-wider mb-xs">
                  VGC • {podium.second.elo} CP
                </p>
                <span className="bg-blue-100 text-blue-800 px-xs py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter shadow-sm">
                  Wins: {podium.second.wins}
                </span>
              </motion.div>

              {/* Champion 1 - First */}
              <motion.div
                variants={itemVariants}
                className="order-1 md:order-2 flex flex-col items-center scale-110 z-10 pb-lg md:pb-0"
              >
                <div className="relative mb-md">
                  <div className="w-56 h-56 rounded-full border-4 border-gold-accent overflow-hidden shadow-xl hover:scale-105 transition-transform duration-300 ring-4 ring-gold-accent/20 relative">
                    <Image
                      src={podium.first.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuD3NlXblngKtpCbl-MiUTpaPbPcz5dlXq-Cl1KYK7l2p3KnCm4sHJRFLENLPwJ5Qm6vsY7FQyLqbtVyrrXCILKyQZ_6JISHPj-TCbkFIvI_YOuJiw5i4uA0yvXl5lrysA-gm5cbx_lksG6zNHooqA9uydh1tzVoIZrNtzcymmE_vLK3To1t_6EZUQZsZom1k9wzYkpDXDeeMYx_GSuCkKLm6XxPyA9cH1jmCQ2M5iaPTOnocNnVfw5X_CZwV9vBm-ZT5JewA8SYgnc"}
                      alt={podium.first.name}
                      fill
                      className="object-cover"
                      sizes="224px"
                    />
                  </div>
                  <div className="absolute -bottom-2 right-6 bg-gold-accent text-black w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-white select-none">
                    1
                  </div>
                </div>
                <h3 className="font-headline-md text-tertiary font-bold">
                  {podium.first.name}
                </h3>
                <p className="text-on-surface-variant font-label-lg uppercase tracking-wider mb-xs">
                  VGC • {podium.first.elo} CP
                </p>
                <span className="bg-yellow-100 text-yellow-800 px-xs py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter shadow-sm">
                  Wins: {podium.first.wins}
                </span>
              </motion.div>

              {/* Champion 3 - Third */}
              <motion.div
                variants={itemVariants}
                className="order-3 flex flex-col items-center"
              >
                <div className="relative mb-md">
                  <div className="w-48 h-48 rounded-full border-4 border-[#CD7F32] overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 relative">
                    <Image
                      src={podium.third.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuB7wSSy1cuSclpeDjk38IfpBrB_TI71I0TUBwta7qEZnuFc1eaI_Uv2C8ZrU6SB3iOmzY-9-eq29E29gEuTbQkhNZax041mhOpQqKk0l-S97IjRywUH3iCrhf-KSla5CpKD_pzco5ncRnAo416gbLZXL3qHhYNNMhaCIAMCJyIBKfWy3sScQVk7bO5iMZ4Ne0ekJcYCMqmiMTNnMqh0GxoT2bRgXPRHWFl4ldpn6VUNZp3tuG2GZAEIleWznxH8i91lBus1H-AqmqE"}
                      alt={podium.third.name}
                      fill
                      className="object-cover"
                      sizes="192px"
                    />
                  </div>
                  <div className="absolute -bottom-2 right-4 bg-[#CD7F32] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shadow-md border-2 border-white select-none">
                    3
                  </div>
                </div>
                <h3 className="font-headline-md text-on-surface font-bold">
                  {podium.third.name}
                </h3>
                <p className="text-on-surface-variant font-label-lg uppercase tracking-wider mb-xs">
                  TCG • {podium.third.elo} CP
                </p>
                <span className="bg-red-100 text-red-800 px-xs py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter shadow-sm">
                  Wins: {podium.third.wins}
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Community Hub banner */}
        <section className="max-w-container-max mx-auto px-md py-lg lg:py-xl">
          <div className="bg-tertiary rounded-3xl p-lg md:p-xl flex flex-col md:flex-row items-center gap-xl relative overflow-hidden shadow-lg">
            {/* Background Icon Decoration */}
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none flex items-center justify-center">
              <span className="material-symbols-outlined text-[300px] text-on-tertiary">
                forum
              </span>
            </div>
            
            <div className="relative z-10 flex-1">
              <h2 className="font-display-lg text-headline-lg md:text-[48px] text-on-tertiary mb-md font-bold leading-tight">
                Join the Community Hub
              </h2>
              <p className="text-body-lg text-tertiary-fixed mb-lg max-w-lg">
                Connect with thousands of trainers worldwide. Discuss meta strategies, find practice partners, and get real-time tournament support.
              </p>
              <div className="flex flex-wrap gap-md">
                <a
                  href="#"
                  className="bg-[#5865F2] hover:brightness-110 text-white px-lg py-md rounded-xl font-headline-md flex items-center gap-sm transition-all shadow-md active:scale-95 font-bold"
                >
                  {/* Embedded inline SVG of Discord Logo */}
                  <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.721 11.721 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
                  </svg>
                  Discord Community
                </a>
                <a
                  href="#"
                  className="bg-on-tertiary hover:bg-surface-container-high text-tertiary px-lg py-md rounded-xl font-headline-md flex items-center gap-sm transition-all shadow-md active:scale-95 font-bold"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    groups
                  </span>
                  Find Local Clubs
                </a>
              </div>
            </div>

            <div className="relative z-10 hidden md:block">
              <div className="bg-white/10 backdrop-blur-md p-md rounded-2xl border border-white/20 shadow-2xl rotate-3">
                <div className="flex items-center gap-md mb-md">
                  <div className="w-12 h-12 rounded-full bg-green-400"></div>
                  <div>
                    <div className="w-24 h-4 bg-white/20 rounded mb-xs"></div>
                    <div className="w-16 h-3 bg-white/10 rounded"></div>
                  </div>
                </div>
                <div className="space-y-sm">
                  <div className="w-64 h-3 bg-white/20 rounded"></div>
                  <div className="w-56 h-3 bg-white/10 rounded"></div>
                  <div className="w-48 h-3 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
