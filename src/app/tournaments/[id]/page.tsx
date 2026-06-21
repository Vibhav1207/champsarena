"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

type TabId = "rules" | "schedule" | "brackets" | "standings";

interface StandingsPlayer {
  rank: string;
  name: string;
  record: string;
  points: number;
  omw: string;
}

export default function TournamentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [activeTab, setActiveTab] = useState<TabId>("rules");
  const [searchPlayer, setSearchPlayer] = useState("");
  const [tournament, setTournament] = useState<any>(null);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);

  const fetchDetails = () => {
    fetch(`/api/tournaments/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tournament) {
          setTournament(data.tournament);
          setUserRegistration(data.userRegistration);
        }
      })
      .catch((err) => console.log("Failed to fetch tournament detail", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleRegister = async () => {
    if (tournament?.entryFee > 0) {
      setShowGatewayModal(true);
    } else {
      await processCheckout("STRIPE"); // Free, doesn't matter
    }
  };

  const processCheckout = async (selectedGateway: "STRIPE" | "RAZORPAY") => {
    try {
      setPaying(true);
      setShowGatewayModal(false);

      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: id,
          gateway: selectedGateway,
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.success) {
        alert("Registered successfully!");
        fetchDetails();
      } else if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else if (data.orderId) {
        // Launch Razorpay checkout
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: "Pokémon Champions",
          description: `Entry fee for ${tournament.title}`,
          order_id: data.orderId,
          handler: async function (response: any) {
            alert("Payment completed! Awaiting confirmation...");
            fetchDetails();
          },
          prefill: {
            name: "Trainer",
          },
          theme: {
            color: "#2b3896",
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      alert("Checkout failed: " + err.message);
    } finally {
      setPaying(false);
    }
  };

  // Standings data mapping from tournament registrations
  const standingsData: StandingsPlayer[] = tournament?.registrations?.map((reg: any, idx: number) => {
    const userMatches = tournament.matches.filter(
      (m: any) => (m.p1Id === reg.userId || m.p2Id === reg.userId) && m.status === "COMPLETED"
    );
    const wins = userMatches.filter((m: any) => m.winnerId === reg.userId).length;
    const losses = userMatches.length - wins;

    return {
      rank: `#${idx + 1}`,
      name: reg.user.name || "Trainer",
      record: `${wins}-${losses}-0`,
      points: wins * 3,
      omw: "50.0%",
    };
  }) || [
    { rank: "#1", name: "S. Arisaka", record: "4-0-0", points: 12, omw: "78.5%" },
    { rank: "#2", name: "M. Wolf", record: "4-0-0", points: 12, omw: "72.1%" },
    { rank: "#3", name: "E. Rizzo", record: "3-1-0", points: 9, omw: "84.0%" },
    { rank: "#4", name: "K. Zheng", record: "3-1-0", points: 9, omw: "65.8%" },
  ];

  const filteredStandings = standingsData.filter((player) =>
    player.name.toLowerCase().includes(searchPlayer.toLowerCase())
  );

  return (
    <>
      <Navigation />

      {/* Script for Razorpay */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>

      <main className="max-w-container-max mx-auto px-md py-lg">
        {/* Tournament Hero Banner */}
        <section className="relative rounded-xl overflow-hidden mb-xl bg-surface-container-lowest border border-outline-variant shadow-lg h-[400px]">
          <div className="absolute inset-0 z-0">
            <div className="relative w-full h-full bg-cover bg-center opacity-40">
              <Image
                src={tournament?.banner || "https://lh3.googleusercontent.com/aida-public/AB6AXuBCv2pWhNKWU97uKk9zYDylNAFoYURc2PUasR4OKe0YGHIzxtQjexfWnxinQsdaYb3Wczwvt-xknZIr3_-eePNVgaNFcOU7Aw1a-EwXrJm-FHI42wIz6yc-JfG2PAkZvhe0weNIunPtr810PRThL4s2e-ZJP9t2mttk2E4VEEwHjCCPPCQ5b62Sq3JJRUqKPd-FAwMxt93tWBzkTVU9tuyeuZGkLY3bx5gHUo-5gSLwET6ltb9H0rd_71fi8hTxfYJAEBkq83Bwoks"}
                alt="High-tech Pokémon tournament stadium at dusk"
                fill
                priority
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          </div>
          <div className="absolute bottom-0 left-0 p-xl z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-md">
            <div className="space-y-xs">
              <div className="flex flex-wrap items-center gap-sm mb-xs select-none">
                <span className="px-sm py-1 bg-tertiary text-on-tertiary text-label-lg font-label-lg rounded-full shadow-sm font-bold uppercase">
                  {tournament?.type?.replace("_", " ") || "REGIONAL QUALIFIER"}
                </span>
                <span className="px-sm py-1 bg-surface-container-high text-on-surface text-label-lg font-label-lg rounded-full flex items-center gap-1 font-bold border border-outline-variant/30">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                  {tournament?.status || "LIVE NOW"}
                </span>
              </div>
              <h1 className="font-display-lg text-display-lg text-on-surface font-bold leading-tight">
                {tournament?.title || "Lumiose City Masters: Summer 2024"}
              </h1>
              <p className="text-on-surface-variant font-body-lg max-w-2xl">
                {tournament?.description || "The premier VGC Regulation G tournament in the Kalos circuit. Top 4 finishers secure a direct invitation."}
              </p>
            </div>
            
            {/* Quick stats sidebar */}
            <div className="flex flex-col gap-xs min-w-[240px] bg-white/70 p-sm rounded-lg border border-white/50 backdrop-blur-sm shadow-md select-none">
              <div className="flex items-center justify-between text-on-surface-variant text-body-md border-b border-outline-variant/30 pb-xs">
                <span>Participants</span>
                <span className="font-bold text-on-surface">
                  {tournament?.registrations?.length || 0} / {tournament?.maxPlayers || 128}
                </span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant text-body-md border-b border-outline-variant/30 pb-xs">
                <span>Entry Fee</span>
                <span className="font-bold text-on-surface">
                  {tournament?.entryFee > 0 ? `$${tournament.entryFee.toFixed(2)}` : "Free"}
                </span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant text-body-md border-b border-outline-variant/30 pb-xs">
                <span>Prize Pool</span>
                <span className="font-bold text-tertiary">
                  ${tournament?.prizePool?.toLocaleString() || "15,000.00"}
                </span>
              </div>

              {/* Registration and payment action button */}
              <div className="mt-xs">
                {userRegistration ? (
                  userRegistration.status === "APPROVED" ? (
                    <button disabled className="w-full bg-green-600 text-white py-xs rounded-lg font-bold text-body-md text-center opacity-90 cursor-default">
                      ✓ Registered & Paid
                    </button>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={paying}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-xs rounded-lg font-bold text-body-md text-center transition-all shadow-sm"
                    >
                      {paying ? "Processing..." : "Complete Payment"}
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={paying}
                    className="w-full bg-tertiary text-on-primary hover:brightness-110 py-xs rounded-lg font-bold text-body-md text-center transition-all shadow-md"
                  >
                    {paying ? "Processing..." : "Register Now"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tab switch Navigation */}
        <nav className="flex gap-lg border-b border-outline-variant mb-lg overflow-x-auto whitespace-nowrap custom-scrollbar select-none">
          {(["rules", "schedule", "brackets", "standings"] as TabId[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-sm transition-all text-title-lg font-title-lg px-xs capitalize font-semibold relative focus:outline-none ${
                activeTab === tab
                  ? "text-tertiary font-bold"
                  : "text-on-surface-variant hover:text-tertiary"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="detail-tab-indicator" className="active-tab-indicator" />
              )}
            </button>
          ))}
        </nav>

        {/* Tab contents */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === "rules" && (
              <motion.div
                key="rules"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bento-grid"
              >
                {/* Rules List */}
                <div className="col-span-12 lg:col-span-8 space-y-md">
                  <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm border-t-4 border-t-tertiary">
                    <h2 className="font-headline-lg text-headline-lg mb-md font-bold">
                      Tournament Regulations
                    </h2>
                    <div className="space-y-sm">
                      {tournament?.rules ? (
                        <p className="text-on-surface-variant text-body-md whitespace-pre-wrap">
                          {tournament.rules}
                        </p>
                      ) : (
                        [
                          {
                            num: 1,
                            title: "Standard Format (Regulation G)",
                            desc: "Players must use teams consistent with the Regulation G ruleset, which allows for one restricted Legendary Pokémon per team.",
                          },
                          {
                            num: 2,
                            title: "Match Structure",
                            desc: "All matches are Best-of-Three (Bo3). Time limits are 20 minutes for total game time and 7 minutes per player (Your Time).",
                          },
                          {
                            num: 3,
                            title: "Open Team Sheets",
                            desc: "Participants must provide an open team sheet highlighting moves, abilities, and held items. Tera types must be explicitly listed.",
                          },
                          {
                            num: 4,
                            title: "Disconnect Policy",
                            desc: "In the event of a disconnection, players must immediately call a judge. Intentional disconnects will result in immediate disqualification.",
                          },
                        ].map((rule) => (
                          <div key={rule.num} className="flex gap-md group">
                            <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-tertiary-fixed text-on-tertiary-fixed rounded-full font-bold shadow-sm select-none">
                              {rule.num}
                            </span>
                            <div>
                              <h3 className="font-title-lg text-title-lg text-on-surface font-semibold">
                                {rule.title}
                              </h3>
                              <p className="text-on-surface-variant text-body-md mt-1">
                                {rule.desc}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Prize Pool Distribution */}
                <div className="col-span-12 lg:col-span-4 space-y-md">
                  <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
                    <h2 className="font-headline-md text-headline-md mb-md font-bold select-none">
                      Prize Distribution
                    </h2>
                    <div className="space-y-sm">
                      {[
                        { rank: "1st Place", title: "Champion", prize: tournament?.prizePool ? `$${(tournament.prizePool * 0.5).toLocaleString()}` : "$7,500", highlight: true },
                        { rank: "2nd Place", title: "Finalist", prize: tournament?.prizePool ? `$${(tournament.prizePool * 0.2).toLocaleString()}` : "$3,000", highlight: false },
                        { rank: "3rd - 4th Place", title: "Semi-Finals", prize: tournament?.prizePool ? `$${(tournament.prizePool * 0.1).toLocaleString()}` : "$1,500", highlight: false },
                        { rank: "5th - 8th Place", title: "Quarter-Finals", prize: tournament?.prizePool ? `$${(tournament.prizePool * 0.025).toLocaleString()}` : "$375", highlight: false },
                      ].map((item, index) => (
                        <div
                          key={index}
                          className={`flex justify-between items-center p-sm rounded-lg border-l-4 ${
                            item.highlight
                              ? "bg-surface-container-low border-l-tertiary shadow-sm"
                              : "bg-surface-container-low border-l-transparent"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface">{item.rank}</span>
                            <span className="text-[10px] font-label-lg text-on-surface-variant uppercase tracking-wider">
                              {item.title}
                            </span>
                          </div>
                          <span
                            className={`font-bold ${
                              item.highlight ? "text-title-lg text-tertiary" : "text-on-surface"
                            }`}
                          >
                            {item.prize}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-lg py-sm border border-tertiary text-tertiary rounded-lg font-bold hover:bg-tertiary-fixed transition-colors active:scale-95 shadow-sm">
                      Full Prize Matrix
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "schedule" && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bento-grid"
              >
                <div className="col-span-12 max-w-3xl mx-auto w-full">
                  <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
                    <h2 className="font-headline-lg text-headline-lg mb-xl text-center font-bold select-none">
                      Event Timeline
                    </h2>
                    <div className="space-y-0">
                      {[
                        {
                          time: "08:00 AM - 09:30 AM",
                          title: "Player Check-in",
                          desc: "Verification of ID and Open Team Sheets at the Main Atrium.",
                          icon: "how_to_reg",
                          highlight: true,
                        },
                        {
                          time: "10:00 AM - 01:00 PM",
                          title: "Swiss Rounds 1-4",
                          desc: "First half of the qualifying phase. Short break follows Round 4.",
                          icon: "sports_esports",
                          highlight: false,
                        },
                        {
                          time: "01:00 PM - 02:00 PM",
                          title: "Lunch Break",
                          desc: "Complimentary refreshments provided for all Registered Masters.",
                          icon: "restaurant",
                          highlight: false,
                        },
                        {
                          time: "02:00 PM - 06:00 PM",
                          title: "Swiss Rounds 5-7 & Top 16",
                          desc: "Concluding Swiss rounds and the start of the Single Elimination bracket.",
                          icon: "stadium",
                          highlight: false,
                        },
                        {
                          time: "07:00 PM",
                          title: "Grand Finals & Awards",
                          desc: "The crowning of the Lumiose City Champion on the main stage.",
                          icon: "emoji_events",
                          highlight: true,
                          fill: true,
                        },
                      ].map((item, index, arr) => (
                        <div key={index} className="timeline-item flex gap-lg pb-xl relative">
                          {/* Dot line connector */}
                          <div className="timeline-dot flex flex-col items-center relative select-none">
                            <span
                              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md z-10 ${
                                item.highlight
                                  ? "bg-tertiary text-on-tertiary"
                                  : "bg-surface-container-high text-on-surface border border-outline-variant"
                              }`}
                            >
                              <span className={`material-symbols-outlined ${item.fill ? "material-symbols-fill" : ""}`}>
                                {item.icon}
                              </span>
                            </span>
                            {index !== arr.length - 1 && (
                              <div className="absolute top-12 bottom-0 w-[2px] bg-outline-variant/30 translate-y-2 h-[calc(100%+8px)]" />
                            )}
                          </div>
                          
                          <div className="flex-1 pt-2">
                            <span
                              className={`text-[12px] font-label-lg uppercase tracking-wider font-bold ${
                                item.highlight ? "text-tertiary" : "text-on-surface-variant"
                              }`}
                            >
                              {item.time}
                            </span>
                            <h3 className="font-headline-md text-headline-md font-bold mt-0.5">
                              {item.title}
                            </h3>
                            <p className="text-on-surface-variant text-body-md mt-1">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "brackets" && (
              <motion.div
                key="brackets"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center min-h-[400px] bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant p-lg text-center"
              >
                <span className="material-symbols-outlined text-6xl text-outline-variant mb-md select-none">
                  account_tree
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                  {tournament?.matches?.length > 0 ? "Matches Generated" : "Brackets Loading..."}
                </h3>
                <p className="text-on-surface-variant text-body-md max-w-sm mt-1">
                  {tournament?.matches?.length > 0
                    ? `Tournament is ongoing with ${tournament.matches.length} matches created.`
                    : "Swiss rounds are currently in progress. Bracket visualization will appear after Round 7."}
                </p>
                <div className="mt-lg flex flex-wrap gap-md justify-center select-none">
                  <button
                    onClick={() => setActiveTab("standings")}
                    className="bg-tertiary text-on-tertiary px-lg py-sm rounded-lg font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
                  >
                    View Current Swiss Standings
                  </button>
                  <Link
                    href={`/brackets?tournamentId=${id}`}
                    className="bg-surface-container-high text-on-surface px-lg py-sm rounded-lg font-bold active:scale-95 transition-all hover:bg-surface-container-highest flex items-center justify-center"
                  >
                    Open Bracket Tree
                  </Link>
                </div>
              </motion.div>
            )}

            {activeTab === "standings" && (
              <motion.div
                key="standings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-md"
              >
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
                  <div className="p-lg bg-surface border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-md select-none">
                    <h2 className="font-headline-md text-headline-md font-bold">
                      Current Swiss Standings
                    </h2>
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={searchPlayer}
                        onChange={(e) => setSearchPlayer(e.target.value)}
                        placeholder="Search player..."
                        className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-full text-body-md focus:ring-2 focus:ring-tertiary outline-none bg-white"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
                        search
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-surface-container-low text-label-lg font-label-lg text-on-surface-variant uppercase tracking-wider select-none font-bold border-b border-outline-variant">
                          <th className="px-lg py-md">Rank</th>
                          <th className="px-lg py-md">Player</th>
                          <th className="px-lg py-md">W-L-D</th>
                          <th className="px-lg py-md">Points</th>
                          <th className="px-lg py-md">OMW%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {filteredStandings.length > 0 ? (
                          filteredStandings.map((player, index) => (
                            <tr key={index} className="hover:bg-tertiary-fixed/10 transition-colors">
                              <td className="px-lg py-md font-bold text-tertiary select-none">{player.rank}</td>
                              <td className="px-lg py-md">
                                <div className="flex items-center gap-sm">
                                  <div className="w-8 h-8 rounded-full bg-secondary-fixed border border-outline-variant flex items-center justify-center font-bold text-[11px] text-on-surface select-none">
                                    {player.name.charAt(0)}
                                  </div>
                                  <span className="font-bold text-on-surface">{player.name}</span>
                                </div>
                              </td>
                              <td className="px-lg py-md font-medium">{player.record}</td>
                              <td className="px-lg py-md font-bold text-on-surface">{player.points}</td>
                              <td className="px-lg py-md font-medium text-on-surface-variant">{player.omw}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-lg font-body-md text-on-surface-variant">
                              No players match your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gateway Selection Modal */}
        {showGatewayModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-sm">
            <div className="bg-white rounded-2xl max-w-sm w-full p-md shadow-2xl space-y-md">
              <h3 className="font-headline-md text-on-surface font-bold text-center">
                Select Payment Method
              </h3>
              <p className="text-on-surface-variant text-body-md text-center">
                Entry Fee: <span className="font-bold text-tertiary">${tournament?.entryFee.toFixed(2)}</span>
              </p>
              <div className="grid grid-cols-2 gap-sm">
                <button
                  onClick={() => processCheckout("STRIPE")}
                  className="p-md border-2 border-outline-variant hover:border-tertiary rounded-xl flex flex-col items-center gap-xs transition-all font-bold active:scale-95"
                >
                  <span className="material-symbols-outlined text-[32px] text-blue-600">credit_card</span>
                  <span>Stripe</span>
                </button>
                <button
                  onClick={() => processCheckout("RAZORPAY")}
                  className="p-md border-2 border-outline-variant hover:border-tertiary rounded-xl flex flex-col items-center gap-xs transition-all font-bold active:scale-95"
                >
                  <span className="material-symbols-outlined text-[32px] text-green-600">payments</span>
                  <span>Razorpay</span>
                </button>
              </div>
              <button
                onClick={() => setShowGatewayModal(false)}
                className="w-full text-center py-xs text-outline hover:underline font-bold text-label-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
export const dynamic = "force-dynamic";
