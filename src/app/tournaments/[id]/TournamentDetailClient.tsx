"use client";

import { useState, useEffect } from "react";
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

interface TournamentDetailClientProps {
  id: string;
  initialTournament: any;
  initialUserRegistration: any;
  initialSquadRegistration: any;
}

export default function TournamentDetailClient({
  id,
  initialTournament,
  initialUserRegistration,
  initialSquadRegistration,
}: TournamentDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("rules");
  const [searchPlayer, setSearchPlayer] = useState("");
  const [tournament, setTournament] = useState<any>(initialTournament);
  const [userRegistration, setUserRegistration] = useState<any>(initialUserRegistration);
  const [squadRegistration, setSquadRegistration] = useState<any>(initialSquadRegistration);
  const [loading, setLoading] = useState(false); // Already loaded on server!
  const [paying, setPaying] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);

  // Active match state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reportP1Score, setReportP1Score] = useState("");
  const [reportP2Score, setReportP2Score] = useState("");
  const [reportScreenshot, setReportScreenshot] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [reportingMatch, setReportingMatch] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const fetchDetails = () => {
    fetch(`/api/tournaments/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tournament) {
          setTournament(data.tournament);
          setUserRegistration(data.userRegistration);
          setSquadRegistration(data.squadRegistration);
        }
      })
      .catch((err) => console.log("Failed to fetch tournament detail", err));
  };

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => { });
  }, [id]);

  const handleReportMatch = async (matchId: string) => {
    if (!reportP1Score || !reportP2Score) {
      alert("Please enter scores for both sides.");
      return;
    }
    try {
      setReportingMatch(true);
      const res = await fetch(`/api/matches/${matchId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p1Score: parseInt(reportP1Score),
          p2Score: parseInt(reportP2Score),
          screenshotUrl: reportScreenshot,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("Scores submitted successfully! Awaiting opponent's confirmation.");
        setReportP1Score("");
        setReportP2Score("");
        setReportScreenshot("");
        fetchDetails();
      }
    } catch (err: any) {
      alert("Failed to report scores: " + err.message);
    } finally {
      setReportingMatch(false);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingScreenshot(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "match_proof");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setReportScreenshot(data.url);
      } else {
        alert(data.error || "Failed to upload screenshot.");
      }
    } catch {
      alert("Failed to upload screenshot.");
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleAcceptResult = async (matchId: string) => {
    try {
      setReportingMatch(true);
      const res = await fetch(`/api/matches/${matchId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ACCEPT",
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("Results confirmed! Brackets have updated.");
        fetchDetails();
      }
    } catch (err: any) {
      alert("Failed to accept results: " + err.message);
    } finally {
      setReportingMatch(false);
    }
  };

  const handleRaiseDispute = async (matchId: string) => {
    if (!disputeReason.trim()) {
      alert("Please provide a reason for the dispute.");
      return;
    }
    try {
      setSubmittingDispute(true);
      const isReported = activeMatch?.status === "REPORTED";
      const endpoint = isReported
        ? `/api/matches/${matchId}/confirm`
        : `/api/matches/${matchId}/dispute`;

      const body = isReported
        ? { action: "REJECT", reason: disputeReason }
        : { reason: disputeReason };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert(isReported ? "Match results disputed. An administrator will review your logs." : "Dispute filed successfully. A judge will review your match.");
        setDisputeReason("");
        setShowDisputeModal(false);
        fetchDetails();
      }
    } catch (err: any) {
      alert("Failed to file dispute: " + err.message);
    } finally {
      setSubmittingDispute(false);
    }
  };

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
          order_id: data.orderId,
          handler: async function (response: any) {
            alert("Payment completed! Awaiting confirmation...");
            fetchDetails();
          },
          prefill: {
            name: "Trainer",
          },
          theme: {
            color: "#1a1a1a",
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
  const rawStandingsData: ({ name: string; wins: number; losses: number; points: number; omw: string; logo?: string | null })[] =
    tournament?.game === "FREE_FIRE"
      ? tournament?.squadRegistrations?.map((reg: any) => {
          const squadMatches = tournament.matches.filter(
            (m: any) =>
              (m.s1Id === reg.squadId || m.s2Id === reg.squadId) &&
              (m.status === "COMPLETED" || m.status === "BYE")
          );
          const wins = squadMatches.filter(
            (m: any) => m.winnerSquadId === reg.squadId
          ).length;
          const losses = squadMatches.filter(
            (m: any) =>
              m.status === "COMPLETED" &&
              (m.s1Id === reg.squadId || m.s2Id === reg.squadId) &&
              m.winnerSquadId !== reg.squadId
          ).length;

          return {
            name: reg.squad.name || "Squad",
            wins,
            losses,
            points: wins,
            omw: "50.0%",
            logo: reg.squad.logo,
          };
        }) || []
      : tournament?.registrations?.map((reg: any) => {
          const userMatches = tournament.matches.filter(
            (m: any) =>
              (m.p1Id === reg.userId || m.p2Id === reg.userId) &&
              (m.status === "COMPLETED" || m.status === "BYE")
          );
          const wins = userMatches.filter((m: any) => m.winnerId === reg.userId).length;
          const losses = userMatches.filter(
            (m: any) =>
              m.status === "COMPLETED" &&
              (m.p1Id === reg.userId || m.p2Id === reg.userId) &&
              m.winnerId !== reg.userId
          ).length;

          return {
            name: reg.user.name || "Trainer",
            wins,
            losses,
            points: wins,
            omw: "50.0%",
            logo: null,
          };
        }) || [];

  const standingsData: (StandingsPlayer & { logo?: string | null })[] = [...rawStandingsData]
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses || a.name.localeCompare(b.name))
    .map((player, idx) => ({
      rank: `#${idx + 1}`,
      name: player.name,
      record: `${player.wins}-${player.losses}`,
      points: player.points,
      omw: player.omw,
      logo: player.logo,
    }));

  const filteredStandings = standingsData.filter((player) =>
    player.name.toLowerCase().includes(searchPlayer.toLowerCase())
  );

  const activeMatch = tournament?.matches?.find(
    (m: any) => {
      const isFreeFire = tournament?.game === "FREE_FIRE";
      if (isFreeFire) {
        return (
          (m.s1Id === currentUser?.squadId || m.s2Id === currentUser?.squadId) &&
          m.status !== "COMPLETED" &&
          m.status !== "BYE"
        );
      } else {
        return (
          (m.p1Id === currentUser?.id || m.p2Id === currentUser?.id) &&
          m.status !== "COMPLETED" &&
          m.status !== "BYE"
        );
      }
    }
  );

  const isSquadMatch = activeMatch?.s1Id !== null && activeMatch?.s1Id !== undefined;
  const comp1Name = isSquadMatch ? (activeMatch?.s1?.name || "Squad 1") : (activeMatch?.p1?.name || "Player 1");
  const comp2Name = isSquadMatch ? (activeMatch?.s2?.name || "Squad 2") : (activeMatch?.p2?.name || "Player 2");
  
  const comp1Logo = isSquadMatch ? activeMatch?.s1?.logo : activeMatch?.p1?.image;
  const comp2Logo = isSquadMatch ? activeMatch?.s2?.logo : activeMatch?.p2?.image;

  const isComp1User = isSquadMatch
    ? (activeMatch?.s1Id === currentUser?.squadId)
    : (activeMatch?.p1Id === currentUser?.id);

  const isComp2User = isSquadMatch
    ? (activeMatch?.s2Id === currentUser?.squadId)
    : (activeMatch?.p2Id === currentUser?.id);
  
  const userSideReported = activeMatch?.reportedById === currentUser?.id || 
    (tournament?.game === "FREE_FIRE" && currentUser?.squad?.members?.some((m: any) => m.id === activeMatch?.reportedById));

  const reportedScore1 = isSquadMatch ? activeMatch?.reportedS1Score : activeMatch?.reportedP1Score;
  const reportedScore2 = isSquadMatch ? activeMatch?.reportedS2Score : activeMatch?.reportedP2Score;

  const currencyCode = tournament?.currency === "INR" ? "INR" : "USD";
  const currencySymbol = currencyCode === "INR" ? "₹" : "$";
  const formatEntryFee = (fee: number) =>
    `${currencySymbol}${fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatPrizeMoney = (amount: number) => `${currencySymbol}${amount.toLocaleString()}`;

  const prizeDistributionItems = (() => {
    const dist = tournament?.prizeDistribution || "TOP_8";
    if (dist === "TOP_1") {
      return [{ rank: "1st Place", title: "CHAMPION", pct: 1, highlight: true }];
    }
    if (dist === "TOP_3") {
      return [
        { rank: "1st Place", title: "CHAMPION", pct: 0.6, highlight: true },
        { rank: "2nd Place", title: "FINALIST", pct: 0.3, highlight: false },
        { rank: "3rd Place", title: "SEMI-FINAL", pct: 0.1, highlight: false },
      ];
    }
    if (dist === "TOP_4") {
      return [
        { rank: "1st Place", title: "CHAMPION", pct: 0.5, highlight: true },
        { rank: "2nd Place", title: "FINALIST", pct: 0.25, highlight: false },
        { rank: "3rd - 4th", title: "SEMI-FINAL", pct: 0.125, highlight: false },
      ];
    }
    return [
      { rank: "1st Place", title: "CHAMPION", pct: 0.5, highlight: true },
      { rank: "2nd Place", title: "FINALIST", pct: 0.2, highlight: false },
      { rank: "3rd - 4th", title: "SEMI-FINAL", pct: 0.1, highlight: false },
      { rank: "5th - 8th", title: "QUARTER-FINAL", pct: 0.025, highlight: false },
    ];
  })();

  return (
    <>
      <Navigation />

      {/* Script for Razorpay */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>

      <main className="max-w-container-max mx-auto px-md py-xl text-left">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-md select-none text-xs font-bold uppercase text-primary/60">
          <ol className="flex items-center gap-xs list-none p-0 m-0">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/tournaments" className="hover:text-primary transition-colors">Tournaments</Link>
            </li>
            <li>/</li>
            <li aria-current="page" className="text-primary truncate max-w-[200px]">
              {tournament?.title}
            </li>
          </ol>
        </nav>

        {/* Tournament Hero Banner */}
        <section className="relative border-4 border-primary neo-brutalist-shadow mb-xl bg-surface-container-high overflow-hidden min-h-[360px] md:h-[500px] flex flex-col justify-end">
          <div className="absolute inset-0 z-0 grayscale contrast-125 select-none">
            <div className="w-full h-full bg-cover bg-center opacity-60">
              <Image
                src={tournament?.banner || "https://lh3.googleusercontent.com/aida-public/AB6AXuBCv2pWhNKWU97uKk9zYDylNAFoYURc2PUasR4OKe0YGHIzxtQjexfWnxinQsdaYb3Wczwvt-xknZIr3_-eePNVgaNFcOU7Aw1a-EwXrJm-FHI42wIz6yc-JfG2PAkZvhe0weNIunPtr810PRThL4s2e-ZJP9t2mttk2E4VEEwHjCCPPCQ5b62Sq3JJRUqKPd-FAwMxt93tWBzkTVU9tuyeuZGkLY3bx5gHUo-5gSLwET6ltb9H0rd_71fi8hTxfYJAEBkq83Bwoks"}
                alt="Tournament banner image"
                fill
                priority
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-accent-yellow/20 mix-blend-multiply"></div>
          </div>
          <div className="relative z-10 w-full p-md md:p-xl flex flex-col md:flex-row md:items-end justify-between gap-md md:gap-xl bg-white/90 border-t-4 border-primary">
            <div className="space-y-sm text-left">
              <div className="flex flex-wrap items-center gap-sm mb-xs select-none">
                <span className="px-sm py-1 bg-primary text-white text-label-lg font-black uppercase">
                  {tournament?.type?.replace("_", " ") || "REGIONAL QUALIFIER"}
                </span>
                <span className="px-sm py-1 bg-accent-red text-white text-label-lg font-black uppercase flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-white"></span>
                  {tournament?.status || "LIVE NOW"}
                </span>
              </div>
              <h1 className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase leading-none text-primary tracking-tighter select-none">
                {tournament?.title}
              </h1>
              <p className="text-primary font-body-lg max-w-[672px] font-bold uppercase text-xs sm:text-sm">
                {tournament?.description || "The premier circuit tournament stage. Form follows function."}
              </p>
            </div>

            {/* Quick stats sidebar */}
            <div className="flex flex-col gap-sm min-w-[280px] bg-accent-yellow p-md border-4 border-primary select-none">
              <div className="flex items-center justify-between text-primary border-b-2 border-primary pb-xs">
                <span className="uppercase font-black text-sm">Participants</span>
                <span className="font-black text-lg">
                  {tournament?.game === "FREE_FIRE"
                    ? `${tournament?.squadRegistrations?.length || 0} / ${tournament?.maxPlayers || 128}`
                    : `${tournament?.registrations?.length || 0} / ${tournament?.maxPlayers || 128}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-primary border-b-2 border-primary pb-xs">
                <span className="uppercase font-black text-sm">Entry Fee</span>
                <span className="font-black text-lg">
                  {tournament?.entryFee > 0 ? formatEntryFee(tournament.entryFee) : "Free"}
                </span>
              </div>
              <div className="flex items-center justify-between text-primary pb-xs">
                <span className="uppercase font-black text-sm">Prize Pool</span>
                <span className="font-black text-2xl text-accent-red">
                  {formatPrizeMoney(tournament?.prizePool ?? 0)}
                </span>
              </div>

              {/* Action Button */}
              <div className="mt-xs">
                {tournament?.game === "FREE_FIRE" ? (
                  squadRegistration && squadRegistration.status === "APPROVED" ? (
                    <button disabled className="w-full bg-primary text-white py-3 border-2 border-primary font-black uppercase text-sm cursor-default tracking-wider select-none text-center">
                      ✓ Registered: {squadRegistration.squad?.name || "Squad"}
                    </button>
                  ) : (tournament?.squadRegistrations?.length || 0) >= (tournament?.maxPlayers || 64) ? (
                    <button disabled className="w-full bg-surface-container-high border-2 border-primary text-primary/40 py-3 font-black uppercase text-sm cursor-not-allowed select-none text-center">
                      Tournament Full
                    </button>
                  ) : !currentUser?.squadId ? (
                    <Link
                      href="/profile"
                      className="w-full block bg-accent-yellow text-primary border-2 border-primary py-3 font-black uppercase text-sm text-center active:translate-y-0.5 transition-transform hover:bg-primary hover:text-white"
                    >
                      Create/Join Squad to Register
                    </Link>
                  ) : currentUser?.squad?.captainId !== currentUser?.id ? (
                    <button disabled className="w-full bg-surface-container-high border-2 border-primary text-primary/40 py-3 font-black uppercase text-sm cursor-default select-none text-center">
                      Wait for Captain to Register
                    </button>
                  ) : (
                    squadRegistration && squadRegistration.status === "PENDING" ? (
                      <button
                        onClick={handleRegister}
                        disabled={paying}
                        className="w-full bg-accent-red text-white border-2 border-primary py-3 font-black uppercase text-sm text-center active:translate-y-0.5 transition-transform"
                      >
                        {paying ? "Processing..." : "Complete Payment"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowRosterModal(true)}
                        className="w-full bg-primary text-white border-2 border-primary py-3 font-black uppercase text-sm text-center active:translate-y-0.5 transition-transform"
                      >
                        Register Squad
                      </button>
                    )
                  )
                ) : (
                  userRegistration && userRegistration.status === "APPROVED" ? (
                    <button disabled className="w-full bg-primary text-white py-3 border-2 border-primary font-black uppercase text-sm cursor-default tracking-wider select-none text-center">
                      ✓ Registered & Paid
                    </button>
                  ) : (tournament?.registrations?.length || 0) >= (tournament?.maxPlayers || 64) ? (
                    <button disabled className="w-full bg-surface-container-high border-2 border-primary text-primary/40 py-3 font-black uppercase text-sm cursor-not-allowed select-none text-center">
                      Tournament Full
                    </button>
                  ) : userRegistration ? (
                    <button
                      onClick={handleRegister}
                      disabled={paying}
                      className="w-full bg-accent-red text-white border-2 border-primary py-3 font-black uppercase text-sm text-center active:translate-y-0.5 transition-transform"
                    >
                      {paying ? "Processing..." : "Complete Payment"}
                    </button>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={paying}
                      className="w-full bg-primary text-white border-2 border-primary py-3 font-black uppercase text-sm text-center active:translate-y-0.5 transition-transform"
                    >
                      {paying ? "Processing..." : "Register Now"}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Active Match Card */}
        {activeMatch && (
          <section className="border-4 border-primary bg-white p-md md:p-xl neo-brutalist-shadow mb-xl relative overflow-hidden text-primary">
            {/* Top Bar Accent */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-accent-blue" />

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-xl mt-2">
              <div className="space-y-sm w-full lg:w-auto">
                <div className="flex flex-wrap items-center gap-sm">
                  <span className="px-sm py-1 bg-accent-blue text-white text-label-md font-black uppercase tracking-wider">
                    My Active Match (Round {activeMatch.round})
                  </span>
                  {activeMatch.dispute ? (
                    <span className="px-sm py-1 bg-accent-red text-white text-label-md font-black uppercase tracking-wider animate-pulse">
                      ⚠️ Match Disputed
                  </span>
                  ) : (
                    <span className="px-sm py-1 bg-accent-yellow text-primary text-label-md font-black uppercase tracking-wider">
                      Status: {activeMatch.status}
                    </span>
                  )}
                </div>

                {/* Matchup visualizer */}
                <div className="flex flex-col sm:flex-row items-center gap-md sm:gap-xl">
                  {/* Competitor 1 */}
                  <div className="flex items-center gap-sm bg-surface-container-high border-2 border-primary p-xs pr-md min-w-[200px]">
                    <div className="w-10 h-10 bg-primary flex items-center justify-center font-bold text-white uppercase select-none overflow-hidden relative">
                      {comp1Logo ? (
                        <img src={comp1Logo} alt={comp1Name} className="w-full h-full object-cover" />
                      ) : (
                        comp1Name.charAt(0)
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-black text-sm uppercase text-primary line-clamp-1">
                        {comp1Name}
                      </div>
                      <div className="text-[10px] font-black text-primary/60">
                        {isComp1User ? "YOUR SIDE" : "OPPONENT"}
                      </div>
                    </div>
                  </div>

                  <span className="font-black text-xl text-primary">VS</span>

                  {/* Competitor 2 */}
                  <div className="flex items-center gap-sm bg-surface-container-high border-2 border-primary p-xs pr-md min-w-[200px]">
                    <div className="w-10 h-10 bg-primary flex items-center justify-center font-bold text-white uppercase select-none overflow-hidden relative">
                      {comp2Logo ? (
                        <img src={comp2Logo} alt={comp2Name} className="w-full h-full object-cover" />
                      ) : (
                        comp2Name.charAt(0)
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-black text-sm uppercase text-primary line-clamp-1">
                        {comp2Name}
                      </div>
                      <div className="text-[10px] font-black text-primary/60">
                        {isComp2User ? "YOUR SIDE" : "OPPONENT"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Forms / Info */}
              <div className="w-full lg:w-auto flex flex-col md:flex-row gap-md items-stretch md:items-end">
                {activeMatch.dispute ? (
                  <div className="w-full md:w-80 bg-accent-red/10 border-2 border-accent-red p-sm text-xs font-bold uppercase text-accent-red">
                    <p className="font-black mb-1">Dispute Reason:</p>
                    <p className="line-clamp-3 italic">"{activeMatch.dispute.reason}"</p>
                    <p className="mt-2 text-[10px] text-primary/70">Our moderation team is investigating this match. Stand by for the final ruling.</p>
                  </div>
                ) : activeMatch.status === "REPORTED" ? (
                  userSideReported ? (
                    <div className="w-full md:w-80 bg-accent-yellow/10 border-2 border-primary p-sm text-xs font-bold uppercase text-primary">
                      <p className="font-black mb-1">Result Reported!</p>
                      <p className="text-sm">You reported: <span className="font-black">{reportedScore1} - {reportedScore2}</span></p>
                      <p className="mt-2 text-[10px] text-primary/70">Waiting for opponent to confirm or dispute the scores.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-md w-full lg:w-auto">
                      <div className="bg-accent-yellow border-4 border-primary p-sm text-xs font-bold uppercase text-primary">
                        <p className="font-black mb-1">Opponent Reported Result</p>
                        <p className="text-sm">Score: <span className="font-black">{reportedScore1} - {reportedScore2}</span></p>
                        <p className="mt-1 text-[10px] text-primary/70">Verify and accept or dispute this result.</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-sm select-none w-full sm:w-auto">
                        <button
                          onClick={() => handleAcceptResult(activeMatch.id)}
                          disabled={reportingMatch}
                          className="w-full sm:w-auto bg-primary text-white border-2 border-primary px-md py-3 font-black uppercase text-xs text-center cursor-pointer active:translate-y-0.5"
                        >
                          {reportingMatch ? "Confirming..." : "Accept Result"}
                        </button>
                        <button
                          onClick={() => setShowDisputeModal(true)}
                          className="w-full sm:w-auto bg-accent-red text-white border-2 border-primary px-md py-3 font-black uppercase text-xs text-center cursor-pointer active:translate-y-0.5"
                        >
                          Dispute
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    {/* Score Reporting Inputs */}
                    <div className="w-full md:w-auto bg-surface-container-high border-4 border-primary p-sm space-y-xs">
                      <span className="text-[10px] font-black uppercase text-primary/70 block">Report Match Scores</span>
                      <div className="flex items-center gap-sm">
                        <div className="flex flex-col gap-1 w-24">
                          <label className="text-[9px] font-black uppercase text-primary/70 line-clamp-1">
                            {comp1Name}
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="Score"
                            value={reportP1Score}
                            onChange={(e) => setReportP1Score(e.target.value)}
                            className="w-full p-xs bg-white border-2 border-primary text-xs font-black text-center focus:bg-accent-yellow focus:outline-none"
                          />
                        </div>
                        <span className="font-black text-xs text-primary mt-4">-</span>
                        <div className="flex flex-col gap-1 w-24">
                          <label className="text-[9px] font-black uppercase text-primary/70 line-clamp-1">
                            {comp2Name}
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="Score"
                            value={reportP2Score}
                            onChange={(e) => setReportP2Score(e.target.value)}
                            className="w-full p-xs bg-white border-2 border-primary text-xs font-black text-center focus:bg-accent-yellow focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Screenshot Proof upload */}
                      <div className="flex flex-col gap-1 pt-xs select-none">
                        <label className="text-[9px] font-black uppercase text-primary/70 block mb-0.5">Screenshot Proof</label>
                        {reportScreenshot ? (
                          <div className="flex items-center gap-xs border-2 border-primary p-xs bg-surface-container-low">
                            <div className="w-10 h-10 border-2 border-primary overflow-hidden relative flex-shrink-0">
                              <img src={reportScreenshot} alt="Proof Preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[8px] text-primary/60 font-black uppercase block">Uploaded</span>
                              <button
                                type="button"
                                onClick={() => setReportScreenshot("")}
                                className="bg-accent-red text-white border border-primary px-1.5 py-0.5 text-[8px] font-black hover:bg-red-700 cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-primary/50 hover:border-primary p-xs text-center bg-surface-container-low cursor-pointer flex flex-col items-center justify-center min-h-[60px] relative transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleScreenshotUpload}
                              disabled={uploadingScreenshot}
                              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span className="material-symbols-outlined text-xl text-primary/60">upload_file</span>
                            <span className="text-[9px] font-black uppercase text-primary">
                              {uploadingScreenshot ? "Uploading..." : "Click to upload proof"}
                            </span>
                            <span className="text-[7px] text-primary/50 font-bold uppercase">PNG, JPG, or GIF</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-sm w-full md:w-auto select-none">
                      <button
                        onClick={() => handleReportMatch(activeMatch.id)}
                        disabled={reportingMatch}
                        className="w-full sm:w-auto bg-primary text-white border-2 border-primary px-md py-3 font-black uppercase text-xs text-center cursor-pointer active:translate-y-0.5"
                      >
                        {reportingMatch ? "Submitting..." : "Submit Result"}
                      </button>
                      <button
                        onClick={() => setShowDisputeModal(true)}
                        className="w-full sm:w-auto bg-accent-red text-white border-2 border-primary px-md py-3 font-black uppercase text-xs text-center cursor-pointer active:translate-y-0.5"
                      >
                        Dispute
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tab switch Navigation */}
        <nav className="flex gap-0 border-4 border-primary mb-xl overflow-x-auto whitespace-nowrap custom-scrollbar bg-white select-none">
          {(["rules", "schedule", "brackets", "standings"] as TabId[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-black uppercase py-md px-lg transition-all border-r-4 border-primary text-base cursor-pointer focus:outline-none ${isActive
                    ? "bg-primary text-white"
                    : "text-primary hover:bg-accent-yellow"
                  }`}
              >
                {tab}
              </button>
            );
          })}
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
                className="grid grid-cols-12 gap-md lg:gap-xl"
              >
                {/* Rules List */}
                <div className="col-span-12 lg:col-span-8 space-y-md lg:space-y-xl">
                  <div className="bg-white p-md md:p-xl border-4 border-primary neo-brutalist-shadow">
                    <h2 className="font-headline-lg uppercase mb-xl border-b-8 border-primary inline-block select-none">
                      Tournament Regulations
                    </h2>
                    <div className="space-y-lg mt-xl">
                      {tournament?.rules ? (
                        <p className="text-primary font-bold uppercase text-body-lg whitespace-pre-wrap">
                          {tournament.rules}
                        </p>
                      ) : (
                        [
                          {
                            num: "01",
                            title: "Standard Format",
                            desc: "Regulation G ruleset. One restricted Legendary Pokémon permitted per team.",
                          },
                          {
                            num: "02",
                            title: "Match Structure",
                            desc: "Best-of-Three (Bo3). 20 min total game time, 7 min player time.",
                          },
                          {
                            num: "03",
                            title: "Open Team Sheets",
                            desc: "Must list moves, abilities, items, and Tera types explicitly.",
                          },
                          {
                            num: "04",
                            title: "Disconnect Policy",
                            desc: "Call judge immediately. Intentional disconnects = immediate DQ.",
                          },
                        ].map((rule) => (
                          <div key={rule.num} className="flex gap-md group">
                            <span className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-primary text-white text-2xl font-black select-none">
                              {rule.num}
                            </span>
                            <div>
                              <h3 className="font-title-lg uppercase mb-xs select-none">
                                {rule.title}
                              </h3>
                              <p className="text-primary font-bold uppercase text-sm mt-1">
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
                <div className="col-span-12 lg:col-span-4 space-y-md lg:space-y-xl">
                  <div className="bg-white p-md md:p-xl border-4 border-primary neo-brutalist-shadow">
                    <h2 className="font-headline-md uppercase mb-xl border-b-4 border-primary select-none">
                      Prize Distribution
                    </h2>
                    <div className="space-y-0 border-2 border-primary">
                      {prizeDistributionItems.map((item, index) => (
                        <div
                          key={index}
                          className={`flex justify-between items-center p-md border-b-2 last:border-b-0 border-primary ${item.highlight
                              ? "bg-accent-yellow"
                              : "bg-white"
                            }`}
                        >
                          <div className="flex flex-col select-none">
                            <span className="font-black uppercase text-lg leading-tight">{item.rank}</span>
                            <span className="text-[10px] font-label-lg uppercase tracking-wider">
                              {item.title}
                            </span>
                          </div>
                          <span className="font-display-lg text-2xl font-black">
                            {formatPrizeMoney((tournament?.prizePool ?? 0) * item.pct)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-xl py-md bg-primary text-white uppercase font-black neo-brutalist-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
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
                className="grid grid-cols-12 gap-md lg:gap-xl"
              >
                <div className="col-span-12 max-w-[896px] mx-auto w-full">
                  <div className="bg-white p-md md:p-xl border-4 border-primary neo-brutalist-shadow">
                    <h2 className="font-headline-lg uppercase mb-xl text-center select-none">
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
                        },
                      ].map((item, index, arr) => (
                        <div key={index} className="timeline-item flex gap-md pb-md md:pb-xl relative">
                          <div className="timeline-dot flex flex-col items-center relative select-none">
                            <span
                              className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center border-4 border-primary z-10 ${item.highlight
                                  ? "bg-primary text-white"
                                  : "bg-white text-primary"
                                }`}
                            >
                              <span className="material-symbols-outlined scale-125 md:scale-150">
                                {item.icon}
                              </span>
                            </span>
                            {index !== arr.length - 1 && (
                              <div className="absolute top-12 md:top-16 bottom-0 w-[4px] bg-primary h-[calc(100%+8px)]" />
                            )}
                          </div>

                          <div className="flex-1 pt-0 md:pt-4 text-left">
                            <span className="text-[10px] md:text-label-lg bg-accent-yellow border-2 border-primary px-2 py-1 font-black">
                              {item.time}
                            </span>
                            <h3 className="text-sm md:font-headline-md uppercase mt-1 md:mt-2">
                              {item.title}
                            </h3>
                            <p className="text-primary font-bold uppercase text-[10px] md:text-sm mt-1 md:mt-2">
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
                className="flex flex-col items-center justify-center min-h-[500px] bg-white border-4 border-primary neo-brutalist-shadow text-center"
              >
                <span className="material-symbols-outlined text-8xl text-primary mb-xl select-none">
                  account_tree
                </span>
                <h3 className="font-display-lg uppercase text-center select-none">
                  {tournament?.matches?.length > 0 ? "Matches Generated" : "Brackets Loading..."}
                </h3>
                <p className="text-primary font-bold uppercase mt-md select-none">
                  {tournament?.matches?.length > 0
                    ? `Tournament is ongoing with ${tournament.matches.length} matches created.`
                    : "Swiss rounds in progress"}
                </p>
                <div className="mt-xl flex flex-col md:flex-row gap-lg select-none">
                  <button
                    onClick={() => setActiveTab("standings")}
                    className="bg-primary text-white px-xl py-md font-black uppercase neo-brutalist-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  >
                    View Standings
                  </button>
                  <Link
                    href={`/tournaments/${id}/bracket`}
                    className="bg-white text-primary border-4 border-primary px-xl py-md font-black uppercase hover:bg-accent-yellow transition-all flex items-center justify-center"
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
                className="space-y-xl font-bold"
              >
                <div className="bg-white border-4 border-primary neo-brutalist-shadow overflow-hidden">
                  <div className="p-md md:p-xl bg-accent-yellow border-b-4 border-primary flex flex-col md:flex-row justify-between items-center gap-md select-none">
                    <h2 className="font-headline-md uppercase">Current Swiss Standings</h2>
                    <div className="relative w-full md:w-auto">
                      <input
                        type="text"
                        value={searchPlayer}
                        onChange={(e) => setSearchPlayer(e.target.value)}
                        placeholder="SEARCH PLAYER..."
                        className="w-full md:w-80 pl-12 pr-4 py-3 bg-white border-4 border-primary text-body-md font-bold focus:bg-primary focus:text-white outline-none placeholder:text-primary/50 uppercase"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-3.5 text-primary scale-110">
                        search
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-primary text-white uppercase font-black select-none border-b-4 border-primary">
                          <th className="px-md py-sm md:px-xl md:py-md border-r-2 border-primary text-xs md:text-sm">Rank</th>
                          <th className="px-md py-sm md:px-xl md:py-md border-r-2 border-primary text-xs md:text-sm">
                            {tournament?.game === "FREE_FIRE" ? "Squad" : "Player"}
                          </th>
                          <th className="px-md py-sm md:px-xl md:py-md border-r-2 border-primary text-xs md:text-sm">W-L</th>
                          <th className="px-md py-sm md:px-xl md:py-md border-r-2 border-primary text-xs md:text-sm">Pts</th>
                          <th className="px-md py-sm md:px-xl md:py-md text-xs md:text-sm">OMW%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-4 divide-primary">
                        {filteredStandings.length > 0 ? (
                          filteredStandings.map((player, index) => (
                            <tr key={index} className="hover:bg-accent-yellow transition-colors group">
                              <td className="px-md py-sm md:px-xl md:py-md font-black text-lg md:text-2xl border-r-2 border-primary select-none">{player.rank}</td>
                              <td className="px-md py-sm md:px-xl md:py-md border-r-2 border-primary">
                                <div className="flex items-center gap-sm md:gap-md">
                                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary flex items-center justify-center font-bold text-white uppercase select-none text-xs md:text-sm overflow-hidden relative">
                                    {player.logo ? (
                                      <img src={player.logo} alt={player.name} className="w-full h-full object-cover" />
                                    ) : (
                                      player.name.charAt(0)
                                    )}
                                  </div>
                                  <span className="font-black uppercase text-sm md:text-xl">{player.name}</span>
                                </div>
                              </td>
                              <td className="px-md py-sm md:px-xl md:py-md font-bold border-r-2 border-primary select-none text-xs md:text-base">{player.record}</td>
                              <td className="px-md py-sm md:px-xl md:py-md font-black border-r-2 border-primary select-none text-xs md:text-lg">{player.points}</td>
                              <td className="px-md py-sm md:px-xl md:py-md font-bold select-none text-xs md:text-base">{player.omw}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-12 font-bold uppercase text-primary/60">
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
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-sm backdrop-blur-sm">
            <div className="bg-white border-8 border-primary max-w-[384px] w-full p-md neo-brutalist-shadow space-y-md text-left">
              <h3 className="font-headline-md text-primary uppercase text-center font-black">
                Select Payment
              </h3>
              <p className="text-primary font-bold uppercase text-center border-2 border-primary p-sm bg-accent-yellow text-sm">
                Entry Fee: <span className="font-black text-lg text-accent-red">{formatEntryFee(tournament?.entryFee ?? 0)}</span>
              </p>
              <div className="grid grid-cols-1 gap-sm">
                {currencyCode !== "INR" && (
                  <button
                    onClick={() => processCheckout("STRIPE")}
                    className="p-md border-4 border-primary bg-white hover:bg-accent-yellow flex flex-col items-center gap-xs font-black uppercase text-xs transition-all active:translate-y-0.5"
                  >
                    <span className="material-symbols-outlined text-[32px] text-primary">credit_card</span>
                    <span>Stripe</span>
                  </button>
                )}
                {currencyCode === "INR" && (
                  <button
                    onClick={() => processCheckout("RAZORPAY")}
                    className="p-md border-4 border-primary bg-white hover:bg-accent-yellow flex flex-col items-center gap-xs font-black uppercase text-xs transition-all active:translate-y-0.5"
                  >
                    <span className="material-symbols-outlined text-[32px] text-primary">payments</span>
                    <span>Razorpay</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowGatewayModal(false)}
                className="w-full text-center py-3 bg-primary text-white uppercase font-black text-xs hover:bg-accent-red transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Dispute Modal */}
        {showDisputeModal && activeMatch && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-sm backdrop-blur-sm">
            <div className="bg-white border-8 border-primary max-w-[448px] w-full p-md neo-brutalist-shadow space-y-md text-left text-primary">
              <h3 className="font-headline-md text-primary uppercase text-center font-black">
                File Match Dispute
              </h3>
              <div className="bg-accent-yellow border-2 border-primary p-xs text-center text-xs font-black uppercase text-primary">
                Match: {comp1Name} vs {comp2Name}
              </div>
              <p className="text-primary font-bold uppercase text-xs">
                Provide a clear description of the issue (e.g. incorrect score reported by opponent, player didn't show up, connection issues, rules violation). Please also submit screenshot URL proof in the match lobby report if possible.
              </p>

              <div className="flex flex-col gap-xs">
                <label className="text-[10px] font-black uppercase text-primary/70">Reason / Details</label>
                <textarea
                  placeholder="EXPLAIN THE ISSUE..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={4}
                  className="w-full p-sm bg-white border-4 border-primary text-sm font-bold focus:bg-accent-yellow focus:outline-none uppercase placeholder:text-primary/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm select-none">
                <button
                  onClick={() => handleRaiseDispute(activeMatch.id)}
                  disabled={submittingDispute}
                  className="p-3 bg-accent-red text-white border-2 border-primary font-black uppercase text-xs text-center cursor-pointer active:translate-y-0.5"
                >
                  {submittingDispute ? "Filing..." : "Raise Dispute"}
                </button>
                <button
                  onClick={() => {
                    setShowDisputeModal(false);
                    setDisputeReason("");
                  }}
                  className="p-3 bg-white text-primary border-2 border-primary font-black uppercase text-xs text-center cursor-pointer hover:bg-accent-yellow"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Roster Validation Modal */}
        {showRosterModal && currentUser?.squad && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-sm backdrop-blur-sm">
            <div className="bg-white border-8 border-primary max-w-[448px] w-full p-md neo-brutalist-shadow space-y-md text-left text-primary">
              <h3 className="font-headline-md text-primary uppercase text-center font-black">
                Squad Registration
              </h3>
              
              {/* Squad Header */}
              <div className="flex items-center gap-sm bg-accent-yellow border-4 border-primary p-xs select-none">
                <div className="w-12 h-12 bg-primary flex items-center justify-center font-bold text-white uppercase select-none overflow-hidden relative">
                  {currentUser.squad.logo ? (
                    <img src={currentUser.squad.logo} alt={currentUser.squad.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.squad.name.charAt(0)
                  )}
                </div>
                <div className="text-left">
                  <h4 className="font-black text-sm uppercase text-primary">{currentUser.squad.name}</h4>
                  <p className="text-[10px] font-black text-primary/60">SQUAD ROSTER</p>
                </div>
              </div>

              {/* Roster Member List */}
              <div className="border-4 border-primary bg-surface-container-high p-sm max-h-[160px] overflow-y-auto space-y-xs">
                {currentUser.squad.members.map((mem: any, idx: number) => (
                  <div key={mem.id} className="flex justify-between items-center bg-white border-2 border-primary px-xs py-1 text-xs font-black uppercase">
                    <span>{idx + 1}. {mem.name || mem.username || "Trainer"}</span>
                    <span className="text-[9px] text-primary/50">{mem.id === currentUser.squad.captainId ? "CAPTAIN" : "MEMBER"}</span>
                  </div>
                ))}
              </div>

              {/* Validation Status */}
              {currentUser.squad.members.length < 4 || currentUser.squad.members.length > 5 ? (
                <div className="bg-accent-red/10 border-2 border-accent-red p-sm text-xs font-bold uppercase text-accent-red text-center">
                  ⚠️ Invalid roster size ({currentUser.squad.members.length} players). Free Fire tournaments require between 4 and 5 players. Please manage your roster in your profile page.
                </div>
              ) : (
                <div className="bg-green-100 border-2 border-green-600 p-sm text-xs font-bold uppercase text-green-700 text-center">
                  ✓ Roster size valid ({currentUser.squad.members.length} players). Ready to register.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm select-none">
                {currentUser.squad.members.length >= 4 && currentUser.squad.members.length <= 5 ? (
                  <button
                    onClick={async () => {
                      setShowRosterModal(false);
                      await handleRegister();
                    }}
                    className="p-3 bg-primary text-white border-2 border-primary font-black uppercase text-xs text-center cursor-pointer active:translate-y-0.5"
                  >
                    Confirm & Register
                  </button>
                ) : (
                  <button
                    disabled
                    className="p-3 bg-surface-container-high text-primary/30 border-2 border-primary font-black uppercase text-xs text-center cursor-not-allowed"
                  >
                    Confirm & Register
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowRosterModal(false);
                  }}
                  className="p-3 bg-white text-primary border-2 border-primary font-black uppercase text-xs text-center cursor-pointer hover:bg-accent-yellow"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
