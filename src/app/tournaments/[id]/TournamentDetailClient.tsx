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
          p2Score: parseInt(report.");
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
      setReportingMatch);
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

      <main className];
      [, [, broadcast D.C. compute across