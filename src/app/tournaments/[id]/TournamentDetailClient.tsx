"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import Modal from "@/components/Modal";

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
  const [registrationCountdown, setRegistrationCountdown] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reportP1Score, setReportP1Score] = useState("");
  const [reportP2Score, setReportP2Score] = useState("");
  const [reportScreenshot, setReportScreenshot] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [reportingMatch, setReportingMatch] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);

  useEffect(() => {
    if (!tournament?.registrationDeadline || tournament.status !== "REGISTRATION_OPEN") {
      setRegistrationCountdown("");
      return;
    }
    const deadline = new Date(tournament.registrationDeadline).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = deadline - now;
      if (diff <= 0) {
        setRegistrationCountdown("REGISTRATION CLOSED");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeStr = "";
      if (days > 0) {
        timeStr = `CLOSING IN: ${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        timeStr = `CLOSING IN: ${hours}h ${minutes}m ${seconds}s`;
      } else {
        timeStr = `CLOSING IN: ${minutes}m ${seconds}s`;
      }
      setRegistrationCountdown(timeStr);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [tournament?.registrationDeadline, tournament?.status]);

  // Active match state
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
    if (!currentUser) {
      alert("You must be logged in to report match results.");
      return;
    }
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
    if (!currentUser) {
      alert("You must be logged in to accept match results.");
      return;
    }
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
    if (!currentUser) {
      alert("You must be logged in to raise a dispute.");
      return;
    }
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
      // We'll use the Modal for gateway selection, so we don't need setShowGatewayModal here
      // Instead, we'll set a state for the modal
      // But we don't have a state for the gateway modal yet. We'll add it.
      // However, to minimize changes, we'll keep the state and then replace the modal.
      // We'll add a state for the gateway modal and then replace the modal.
      // But we are already using showGatewayModal. We'll keep it and replace the modal.
      // We'll set the state to true to open the modal.
      setShowGatewayModal(true);
    } else {
      await processCheckout("STRIPE"); // Free, doesn't matter
    }
  };

  const processCheckout = async (selectedGateway: "STRIPE" | "RAZORPAY") => {
    try {
      setPaying(true);
      // We'll close the modal after starting the process
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

      <main className="min-h-screen bg-background font-space-grotesk text-primary pb-16">
        <div className="max-w-5xl mx-auto px-sm md:px-lg pt-lg space-y-lg">

          {/* Tournament Header */}
          <div className="bg-white border-4 border-primary shadow-[8px_8px_0px_0px_#1a1a1a] p-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-sm">
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">
                  {tournament?.game?.replace(/_/g, " ")} · {tournament?.type?.replace(/_/g, " ")}
                </p>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-tight text-primary">
                  {tournament?.title}
                </h1>
                {registrationCountdown && (
                  <p className="text-xs font-black uppercase tracking-widest text-accent-red mt-2 animate-pulse">
                    {registrationCountdown}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <span className={`text-[10px] font-black px-3 py-1.5 border-2 border-primary uppercase tracking-wider ${
                  tournament?.status === "REGISTRATION_OPEN" ? "bg-accent-yellow text-primary" :
                  tournament?.status === "ONGOING" ? "bg-accent-blue text-white" :
                  tournament?.status === "COMPLETED" ? "bg-primary text-white" :
                  "bg-surface-container text-primary"
                }`}>
                  {tournament?.status?.replace(/_/g, " ")}
                </span>
                {tournament?.prizePool > 0 && (
                  <span className="text-lg font-black text-accent-blue">
                    🏆 {formatPrizeMoney(tournament.prizePool)} Prize Pool
                  </span>
                )}
                {tournament?.entryFee > 0 && (
                  <span className="text-xs font-black text-primary/60 uppercase">
                    Entry: {formatEntryFee(tournament.entryFee)}
                  </span>
                )}
              </div>
            </div>

            {/* Register / Status Button */}
            <div className="mt-md pt-sm border-t-2 border-primary flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {tournament?.status === "REGISTRATION_OPEN" && !userRegistration && !squadRegistration && (
                <button
                  onClick={handleRegister}
                  disabled={paying}
                  className="bg-accent-yellow text-primary border-3 border-primary px-6 py-3 font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
                >
                  {paying ? "Processing…" : tournament?.entryFee > 0 ? `Register — ${formatEntryFee(tournament.entryFee)}` : "Register Free"}
                </button>
              )}
              {(userRegistration || squadRegistration) && (
                <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-green-700 border-2 border-green-700 px-3 py-1.5">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Registered
                  {(userRegistration?.status || squadRegistration?.status) !== "APPROVED" && (
                    <span className="text-primary/60"> — Pending Approval</span>
                  )}
                </span>
              )}
              {tournament?.watchLiveUrl && (
                <a
                  href={tournament.watchLiveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-accent-red text-white border-3 border-primary px-4 py-2 font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_#1a1a1a] hover:shadow-[5px_5px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">live_tv</span>
                  Watch Live
                </a>
              )}
            </div>
          </div>

          {/* Active Match Panel */}
          {activeMatch && activeMatch.status !== "COMPLETED" && activeMatch.status !== "BYE" && (
            <div className="bg-accent-yellow border-4 border-primary shadow-[8px_8px_0px_0px_#1a1a1a] p-md">
              <h2 className="font-black text-primary uppercase tracking-tight text-lg mb-sm border-b-2 border-primary pb-2">
                Your Active Match
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-md">
                <div className="flex items-center gap-sm text-center">
                  {comp1Logo && (
                    <Image
                      src={comp1Logo}
                      alt={comp1Name}
                      width={40}
                      height={40}
                      className="w-10 h-10 border-2 border-primary object-cover"
                      sizes="40px"
                      loading="lazy"
                      quality={85}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzNmNTBjZSIvPjwvc3ZnPg=="
                    />
                  )}
                  <span className={`font-black text-primary uppercase text-sm ${isComp1User ? "underline decoration-2" : ""}`}>
                    {comp1Name} {isComp1User ? "(You)" : ""}
                  </span>
                </div>
                <span className="font-black text-primary/60 text-xl">VS</span>
                <div className="flex items-center gap-sm text-center">
                  <span className={`font-black text-primary uppercase text-sm ${isComp2User ? "underline decoration-2" : ""}`}>
                    {comp2Name} {isComp2User ? "(You)" : ""}
                  </span>
                  {comp2Logo && (
                    <Image
                      src={comp2Logo}
                      alt={comp2Name}
                      width={40}
                      height={40}
                      className="w-10 h-10 border-2 border-primary object-cover"
                      sizes="40px"
                      loading="lazy"
                      quality={85}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzNmNTBjZSIvPjwvc3ZnPg=="
                    />
                  )}
                </div>
              </div>

              {activeMatch.status === "REPORTED" && !userSideReported && (
                <div className="mt-sm p-3 bg-white border-2 border-primary">
                  <p className="text-xs font-black uppercase text-primary mb-2">
                    Opponent reported: {reportedScore1} – {reportedScore2}. Do you agree?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAcceptResult(activeMatch.id)}
                      disabled={reportingMatch}
                      className="flex-1 py-2 bg-green-600 text-white border-2 border-primary font-black text-xs uppercase cursor-pointer disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => setShowDisputeModal(true)}
                      className="flex-1 py-2 bg-accent-red text-white border-2 border-primary font-black text-xs uppercase cursor-pointer"
                    >
                      Dispute
                    </button>
                  </div>
                </div>
              )}

              {activeMatch.status !== "REPORTED" && (isComp1User || isComp2User) && (
                <div className="mt-sm space-y-sm">
                  <p className="text-xs font-black uppercase text-primary/60">Report Your Match Score:</p>
                  <div className="flex gap-sm items-center">
                    <div className="space-y-1 flex-1">
                      <label className="text-[10px] font-black uppercase">{comp1Name}</label>
                      <input
                        type="number"
                        min="0"
                        value={reportP1Score}
                        onChange={e => setReportP1Score(e.target.value)}
                        className="w-full border-2 border-primary px-3 py-2 text-sm font-bold bg-white outline-none"
                        placeholder="0"
                      />
                    </div>
                    <span className="font-black text-primary mt-4">–</span>
                    <div className="space-y-1 flex-1">
                      <label className="text-[10px] font-black uppercase">{comp2Name}</label>
                      <input
                        type="number"
                        min="0"
                        value={reportP2Score}
                        onChange={e => setReportP2Score(e.target.value)}
                        className="w-full border-2 border-primary px-3 py-2 text-sm font-bold bg-white outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-primary">Screenshot Proof</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      disabled={uploadingScreenshot}
                      className="text-xs text-primary cursor-pointer"
                    />
                    {reportScreenshot && (
                      <a href={reportScreenshot} target="_blank" rel="noreferrer" className="text-xs text-accent-blue underline">
                        View uploaded proof
                      </a>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReportMatch(activeMatch.id)}
                      disabled={reportingMatch || uploadingScreenshot}
                      className="flex-1 py-2.5 bg-primary text-white border-2 border-primary font-black text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                      {reportingMatch ? "Submitting…" : "Submit Scores"}
                    </button>
                    <button
                      onClick={() => setShowDisputeModal(true)}
                      className="py-2.5 px-4 bg-white text-accent-red border-2 border-primary font-black text-xs uppercase cursor-pointer"
                    >
                      Dispute
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-4 border-primary bg-white">
            {(["rules", "schedule", "brackets", "standings"] as TabId[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-[10px] md:text-xs font-black uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-white"
                    : "bg-white text-primary hover:bg-accent-yellow"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white border-4 border-primary shadow-[8px_8px_0px_0px_#1a1a1a] p-md text-left">

            {activeTab === "rules" && (
              <div className="space-y-md">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-primary mb-sm border-b-2 border-primary pb-2">Tournament Rules</h2>
                  <p className="text-sm font-bold text-primary/80 whitespace-pre-line leading-relaxed">
                    {tournament?.rules || "Standard rules apply. Check back for detailed ruleset."}
                  </p>
                </div>
                {tournament?.description && (
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-primary mb-2 border-b border-primary/20 pb-1">About</h3>
                    <p className="text-sm font-bold text-primary/80 whitespace-pre-line">{tournament?.description}</p>
                  </div>
                )}
                {prizeDistributionItems.length > 0 && tournament?.prizePool > 0 && (
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-primary mb-sm border-b border-primary/20 pb-1">Prize Distribution</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {prizeDistributionItems.map((item) => (
                        <div key={item.rank} className={`p-3 border-2 border-primary flex justify-between items-center ${item.highlight ? "bg-accent-yellow" : "bg-surface-container-low"}`}>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{item.rank}</p>
                            <p className="font-black uppercase text-primary text-sm">{item.title}</p>
                          </div>
                          <p className="font-black text-accent-blue text-lg">
                            {formatPrizeMoney(Math.floor(tournament.prizePool * item.pct))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="space-y-sm">
                <h2 className="text-xl font-black uppercase tracking-tight text-primary mb-sm border-b-2 border-primary pb-2">Schedule</h2>
                <div className="space-y-2 text-sm font-bold">
                  {tournament?.registrationDeadline && (
                    <div className="flex justify-between py-2 border-b border-primary/20">
                      <span className="text-primary/60 uppercase text-xs">Registration Closes</span>
                      <span className="text-primary">{new Date(tournament.registrationDeadline).toLocaleString()}</span>
                    </div>
                  )}
                  {tournament?.startDate && (
                    <div className="flex justify-between py-2 border-b border-primary/20">
                      <span className="text-primary/60 uppercase text-xs">Start Date</span>
                      <span className="text-primary">{new Date(tournament.startDate).toLocaleString()}</span>
                    </div>
                  )}
                  {tournament?.endDate && (
                    <div className="flex justify-between py-2">
                      <span className="text-primary/60 uppercase text-xs">End Date</span>
                      <span className="text-primary">{new Date(tournament.endDate).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "brackets" && (
              <div className="space-y-sm">
                <div className="flex items-center justify-between mb-sm border-b-2 border-primary pb-2">
                  <h2 className="text-xl font-black uppercase tracking-tight text-primary">Bracket</h2>
                  <Link
                    href={`/tournaments/${id}/bracket`}
                    className="text-xs font-black uppercase tracking-wider underline decoration-2 underline-offset-2 hover:text-accent-blue transition-colors"
                  >
                    Full Bracket View →
                  </Link>
                </div>
                {(!tournament?.matches || tournament.matches.length === 0) ? (
                  <div className="flex flex-col items-center py-12 text-primary/50">
                    <span className="material-symbols-outlined text-5xl mb-3">account_tree</span>
                    <p className="text-xs font-bold uppercase">Brackets will be generated when the tournament starts.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="space-y-3 min-w-[300px]">
                      {Array.from(new Set(tournament.matches.map((m: any) => m.round))).sort().map((round: any) => (
                        <div key={round} className="border-2 border-primary">
                          <div className="bg-primary text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest">
                            Round {round}
                          </div>
                          <div className="divide-y divide-primary/20">
                            {tournament.matches.filter((m: any) => m.round === round).map((m: any) => (
                              <div key={m.id} className="px-4 py-3 flex items-center justify-between text-xs font-bold">
                                <div className="flex flex-col gap-1">
                                  <span className={m.winnerId === m.p1Id || m.winnerSquadId === m.s1Id ? "text-accent-blue font-black" : "text-primary"}>
                                    {m.p1?.name || m.s1?.name || "TBD"}
                                  </span>
                                  <span className={m.winnerId === m.p2Id || m.winnerSquadId === m.s2Id ? "text-accent-blue font-black" : "text-primary"}>
                                    {m.p2?.name || m.s2?.name || "TBD"}
                                  </span>
                                </div>
                                {m.status === "COMPLETED" && (
                                  <span className="text-[10px] font-black text-accent-blue">
                                    {m.p1Score ?? m.s1Score ?? 0} – {m.p2Score ?? m.s2Score ?? 0}
                                  </span>
                                )}
                                {m.status === "BYE" && (
                                  <span className="text-[10px] font-black text-primary/40 uppercase">BYE</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "standings" && (
              <div className="space-y-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm mb-sm border-b-2 border-primary pb-2">
                  <h2 className="text-xl font-black uppercase tracking-tight text-primary">Standings</h2>
                  <input
                    type="text"
                    placeholder="Search player…"
                    value={searchPlayer}
                    onChange={e => setSearchPlayer(e.target.value)}
                    className="border-2 border-primary px-3 py-1.5 text-xs font-bold bg-white outline-none w-full sm:w-48"
                  />
                </div>
                {filteredStandings.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-primary/50">
                    <span className="material-symbols-outlined text-5xl mb-3">leaderboard</span>
                    <p className="text-xs font-bold uppercase">No standings yet. Standings update as matches complete.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[400px] text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container border-b-2 border-primary">
                          {["Rank", "Player", "Record", "Points", "OMW%"].map(h => (
                            <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-primary">
                        {filteredStandings.map((player) => (
                          <tr key={player.name} className="hover:bg-surface-container-low transition-colors">
                            <td className="px-4 py-3 font-black text-primary text-sm">{player.rank}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {player.logo && (
                                  <img src={player.logo} alt={player.name} className="w-6 h-6 border border-primary object-cover" />
                                )}
                                <span className="font-bold text-sm text-primary">{player.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-xs text-primary">{player.record}</td>
                            <td className="px-4 py-3 font-black text-accent-blue">{player.points}</td>
                            <td className="px-4 py-3 font-bold text-xs text-primary/60">{player.omw}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Participants List */}
          <div className="bg-white border-4 border-primary shadow-[8px_8px_0px_0px_#1a1a1a] p-md">
            <h2 className="text-lg font-black uppercase tracking-tight text-primary mb-sm border-b-2 border-primary pb-2">
              Participants ({tournament?.game === "FREE_FIRE" ? (tournament?.squadRegistrations?.length || 0) : (tournament?.registrations?.length || 0)} / {tournament?.maxPlayers})
            </h2>
            {tournament?.game === "FREE_FIRE" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(tournament?.squadRegistrations || []).map((reg: any) => (
                  <Link href={`/squad/${reg.squadId}`} key={reg.squadId} className="flex items-center gap-2 p-2 border-2 border-primary hover:bg-surface-container transition-colors">
                    {reg.squad?.logo && (
                      <Image
                        src={reg.squad.logo}
                        alt={reg.squad.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-cover border border-primary"
                        sizes="32px"
                        loading="lazy"
                        quality={85}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjwvc3ZnPg=="
                      />
                    )}
                    <span className="text-xs font-bold uppercase text-primary truncate">{reg.squad?.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(tournament?.registrations || []).map((reg: any) => (
                  <Link href={`/players/${reg.user?.username || reg.userId}`} key={reg.userId} className="flex items-center gap-2 p-2 border-2 border-primary hover:bg-surface-container transition-colors">
                    {reg.user?.image && (
                      <Image
                        src={reg.user.image}
                        alt={reg.user.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-cover rounded-full border border-primary"
                        sizes="32px"
                        loading="lazy"
                        quality={85}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZjZjdmYyIvPjwvc3ZnPg=="
                      />
                    )}
                    <span className="text-xs font-bold uppercase text-primary truncate">{reg.user?.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />

      {/* Dispute Modal */}
      {showDisputeModal && (
        <Modal isOpen={showDisputeModal} onClose={() => setShowDisputeModal(false)} title="Raise a Dispute">
          <div className="space-y-sm">
            <p className="text-xs font-bold text-primary uppercase">Please describe the reason for your dispute:</p>
            <textarea
              rows={4}
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              placeholder="e.g. Opponent reported incorrect scores…"
              className="w-full border-2 border-primary px-3 py-2 text-sm font-bold bg-white outline-none resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 py-2.5 border-2 border-primary bg-white text-primary font-black text-xs uppercase cursor-pointer hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => activeMatch && handleRaiseDispute(activeMatch.id)}
                disabled={submittingDispute}
                className="flex-1 py-2.5 bg-accent-red text-white border-2 border-primary font-black text-xs uppercase cursor-pointer disabled:opacity-50"
              >
                {submittingDispute ? "Submitting…" : "Submit Dispute"}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </>
  );
}