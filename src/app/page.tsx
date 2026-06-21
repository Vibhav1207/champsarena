"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

export default function Home() {
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
            <span className="flex items-center gap-xs font-title-lg text-tertiary mx-lg">
              <span className="material-symbols-fill text-[20px]">emoji_events</span>{" "}Leon &apos;The Unbeatable&apos; (Galar Regional)
            </span>
            <span className="flex items-center gap-xs font-title-lg text-tertiary mx-lg">
              <span className="material-symbols-fill text-[20px]">emoji_events</span>{" "}Cynthia &apos;The Champion&apos; (Sinnoh Masters)
            </span>
            <span className="flex items-center gap-xs font-title-lg text-tertiary mx-lg">
              <span className="material-symbols-fill text-[20px]">emoji_events</span>{" "}Steven &apos;Iron Will&apos; (Hoenn Cup)
            </span>
            <span className="flex items-center gap-xs font-title-lg text-tertiary mx-lg">
              <span className="material-symbols-fill text-[20px]">emoji_events</span>{" "}Lance &apos;Dragon Master&apos; (Indigo Invitational)
            </span>
            {/* Duplicated for smooth loop */}
            <span className="flex items-center gap-xs font-title-lg text-tertiary mx-lg">
              <span className="material-symbols-fill text-[20px]">emoji_events</span>{" "}Leon &apos;The Unbeatable&apos; (Galar Regional)
            </span>
            <span className="flex items-center gap-xs font-title-lg text-tertiary mx-lg">
              <span className="material-symbols-fill text-[20px]">emoji_events</span>{" "}Cynthia &apos;The Champion&apos; (Sinnoh Masters)
            </span>
            <span className="flex items-center gap-xs font-title-lg text-tertiary mx-lg">
              <span className="material-symbols-fill text-[20px]">emoji_events</span>{" "}Steven &apos;Iron Will&apos; (Hoenn Cup)
            </span>
            <span className="flex items-center gap-xs font-title-lg text-tertiary mx-lg">
              <span className="material-symbols-fill text-[20px]">emoji_events</span>{" "}Lance &apos;Dragon Master&apos; (Indigo Invitational)
            </span>
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
                    Oct 24, 2023
                  </span>
                </div>
                <h3 className="font-headline-md text-on-surface mb-xs font-bold leading-tight">
                  Registration for the 2024 International Season is Now Open!
                </h3>
                <p className="text-body-md text-on-surface-variant mb-md flex-grow">
                  Secure your spot in the most prestigious tournament of the year. Over $1,000,000 in prizes and the title of World Champion are up for grabs.
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
              {/* Event 1 */}
              <div className="flex-shrink-0 w-72 bg-white rounded-xl shadow-sm border-t-4 border-tertiary p-md hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-sm">
                    <div className="bg-surface-container px-xs py-1 rounded font-label-lg font-bold">
                      VGC Format
                    </div>
                    <span className="material-symbols-outlined text-tertiary">
                      videogame_asset
                    </span>
                  </div>
                  <h4 className="font-title-lg text-on-surface mb-xs font-semibold">
                    London Regional
                  </h4>
                  <p className="text-body-md text-on-surface-variant mb-sm flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px] text-outline">
                      location_on
                    </span>
                    Excel London, UK
                  </p>
                  <div className="flex items-center gap-xs mb-md">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">
                      event
                    </span>
                    <span className="text-body-md font-medium text-on-surface">
                      Nov 15 - 17
                    </span>
                  </div>
                </div>
                <Link
                  href="/tournaments/london-regional-championships"
                  className="w-full text-center py-xs border border-tertiary text-tertiary rounded-lg font-label-lg hover:bg-tertiary hover:text-on-tertiary transition-colors block font-bold"
                >
                  Details
                </Link>
              </div>

              {/* Event 2 */}
              <div className="flex-shrink-0 w-72 bg-white rounded-xl shadow-sm border-t-4 border-victory-gold p-md hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-sm">
                    <div className="bg-surface-container px-xs py-1 rounded font-label-lg font-bold">
                      TCG Format
                    </div>
                    <span className="material-symbols-fill text-victory-gold">
                      star
                    </span>
                  </div>
                  <h4 className="font-title-lg text-on-surface mb-xs font-semibold">
                    International Open
                  </h4>
                  <p className="text-body-md text-on-surface-variant mb-sm flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px] text-outline">
                      location_on
                    </span>
                    Tokyo, Japan
                  </p>
                  <div className="flex items-center gap-xs mb-md">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">
                      event
                    </span>
                    <span className="text-body-md font-medium text-on-surface">
                      Dec 01 - 05
                    </span>
                  </div>
                </div>
                <Link
                  href="/tournaments/ocic-melbourne-master-series"
                  className="w-full text-center py-xs border border-tertiary text-tertiary rounded-lg font-label-lg hover:bg-tertiary hover:text-on-tertiary transition-colors block font-bold"
                >
                  Details
                </Link>
              </div>

              {/* Event 3 */}
              <div className="flex-shrink-0 w-72 bg-white rounded-xl shadow-sm border-t-4 border-tertiary p-md hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-sm">
                    <div className="bg-surface-container px-xs py-1 rounded font-label-lg font-bold">
                      GO Format
                    </div>
                    <span className="material-symbols-outlined text-tertiary">
                      smartphone
                    </span>
                  </div>
                  <h4 className="font-title-lg text-on-surface mb-xs font-semibold">
                    LA Championship
                  </h4>
                  <p className="text-body-md text-on-surface-variant mb-sm flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px] text-outline">
                      location_on
                    </span>
                    Los Angeles, USA
                  </p>
                  <div className="flex items-center gap-xs mb-md">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">
                      event
                    </span>
                    <span className="text-body-md font-medium text-on-surface">
                      Dec 12 - 14
                    </span>
                  </div>
                </div>
                <Link
                  href="/tournaments/tokyo-go-championship"
                  className="w-full text-center py-xs border border-tertiary text-tertiary rounded-lg font-label-lg hover:bg-tertiary hover:text-on-tertiary transition-colors block font-bold"
                >
                  Details
                </Link>
              </div>
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
              {/* Champion 2 - Alex Kim */}
              <motion.div
                variants={itemVariants}
                className="order-2 md:order-1 flex flex-col items-center pb-md md:pb-0"
              >
                <div className="relative mb-md">
                  <div className="w-48 h-48 rounded-full border-4 border-outline-variant overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 relative">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9gsQw6Y-zSlHCerJ7-zku2SOA23kCGzZl3vZZPHfdMP02WMUDrcyPwSOTdz0XAxBWMvrmQ-BsY7HooSbg-1Os0x59i4GXWJ91t3XuS24sqSLyi34iZOTCQwTeehMjDNrJuiCIt01lDL2TF58_znFuXNbYsYbeZoWObtDys08_vjkmK5FtE1gi3ZgWYh3gSwVpQoCBW58yUbhPZRx9y1BdG_-9Odcgmx6tVY6C7kHqWOKJXT5N44qwhIShQS3K-4hHHrw8VrHqU8Y"
                      alt="Alex 'Frost' Kim"
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
                  Alex &apos;Frost&apos; Kim
                </h3>
                <p className="text-on-surface-variant font-label-lg uppercase tracking-wider mb-xs">
                  VGC • 1,240 CP
                </p>
                <span className="bg-blue-100 text-blue-800 px-xs py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter shadow-sm">
                  Articuno-Team
                </span>
              </motion.div>

              {/* Champion 1 - Marcus Vance */}
              <motion.div
                variants={itemVariants}
                className="order-1 md:order-2 flex flex-col items-center scale-110 z-10 pb-lg md:pb-0"
              >
                <div className="relative mb-md">
                  <div className="w-56 h-56 rounded-full border-4 border-gold-accent overflow-hidden shadow-xl hover:scale-105 transition-transform duration-300 ring-4 ring-gold-accent/20 relative">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3NlXblngKtpCbl-MiUTpaPbPcz5dlXq-Cl1KYK7l2p3KnCm4sHJRFLENLPwJ5Qm6vsY7FQyLqbtVyrrXCILKyQZ_6JISHPj-TCbkFIvI_YOuJiw5i4uA0yvXl5lrysA-gm5cbx_lksG6zNHooqA9uydh1tzVoIZrNtzcymmE_vLK3To1t_6EZUQZsZom1k9wzYkpDXDeeMYx_GSuCkKLm6XxPyA9cH1jmCQ2M5iaPTOnocNnVfw5X_CZwV9vBm-ZT5JewA8SYgnc"
                      alt="Marcus 'Legend' Vance"
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
                  Marcus &apos;Legend&apos; Vance
                </h3>
                <p className="text-on-surface-variant font-label-lg uppercase tracking-wider mb-xs">
                  VGC • 1,450 CP
                </p>
                <span className="bg-yellow-100 text-yellow-800 px-xs py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter shadow-sm">
                  Zapdos-Team
                </span>
              </motion.div>

              {/* Champion 3 - Elena Ross */}
              <motion.div
                variants={itemVariants}
                className="order-3 flex flex-col items-center"
              >
                <div className="relative mb-md">
                  <div className="w-48 h-48 rounded-full border-4 border-[#CD7F32] overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 relative">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7wSSy1cuSclpeDjk38IfpBrB_TI71I0TUBwta7qEZnuFc1eaI_Uv2C8ZrU6SB3iOmzY-9-eq29E29gEuTbQkhNZax041mhOpQqKk0l-S97IjRywUH3iCrhf-KSla5CpKD_pzco5ncRnAo416gbLZXL3qHhYNNMhaCIAMCJyIBKfWy3sScQVk7bO5iMZ4Ne0ekJcYCMqmiMTNnMqh0GxoT2bRgXPRHWFl4ldpn6VUNZp3tuG2GZAEIleWznxH8i91lBus1H-AqmqE"
                      alt="Elena 'Storm' Ross"
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
                  Elena &apos;Storm&apos; Ross
                </h3>
                <p className="text-on-surface-variant font-label-lg uppercase tracking-wider mb-xs">
                  TCG • 1,180 CP
                </p>
                <span className="bg-red-100 text-red-800 px-xs py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter shadow-sm">
                  Moltres-Team
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
