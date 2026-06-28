"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { logoutTrainer } from "@/app/actions/authActions";
import { useBodyScrollLock } from "@/lib/bodyScrollLock";
import { formatPrizeAmount } from "@/lib/currency";
import Modal from "@/components/Modal";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/admin" },
  { id: "tournaments", label: "Tournaments", icon: "emoji_events", href: "/tournaments" },
  { id: "rankings", label: "Rankings", icon: "leaderboard", href: "/rankings" },
  { id: "profile", label: "My Profile", icon: "person", href: "/profile" },
  { id: "home", label: "Public Site", icon: "home", href: "/" },
];

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  UPCOMING: { label: "Upcoming", cls: "bg-white text-primary" },
  REGISTRATION_OPEN: { label: "Open", cls: "bg-accent-yellow text-primary" },
  ONGOING: { label: "Ongoing", cls: "bg-accent-blue text-white" },
  COMPLETED: { label: "Completed", cls: "bg-surface-container-high text-primary" },
  DRAFT: { label: "Draft", cls: "bg-white text-primary" },
  CANCELLED: { label: "Cancelled", cls: "bg-accent-red text-white" },
};

export default function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analytics, setAnalytics] = useState<any>({ metrics: {}, auditLogs: [], recentTournaments: [] });
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string>('');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const currentUrl = `${pathname}${query ? '?' + query : ''}`;

  // Disputes state
  const [resolvingDispute, setResolvingDispute] = useState<any>(null);
  const [disputeComment, setDisputeComment] = useState("");
  const [disputeP1Score, setDisputeP1Score] = useState("");
  const [disputeP2Score, setDisputeP2Score] = useState("");
  const [disputeWinnerId, setDisputeWinnerId] = useState("");
  const [handlingDispute, setHandlingDispute] = useState(false);

  // Tournament management state
  const [managingTournamentId, setManagingTournamentId] = useState<string | null>(null);
  const [managedTournament, setManagedTournament] = useState<any>(null);
  const [loadingManaged, setLoadingManaged] = useState(false);
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null);
  const [matchScores, setMatchScores] = useState<Record<string, { p1Score: string; p2Score: string; winnerId: string }>>({});

  const fetchManagedTournament = useCallback(async (id: string) => {
    setLoadingManaged(true);
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      const data = await res.json();
      if (data.tournament) {
        setManagedTournament(data.tournament);

        // Initialize match scores state for forms
        const scores: any = {};
        data.tournament.matches?.forEach((m: any) => {
          const isTeam = m.s1Id !== null && m.s1Id !== undefined;
          const hasCompetitors = isTeam ? (m.s1Id && m.s2Id) : (m.p1Id && m.p2Id);
          if ((m.status === "PENDING" || m.status === "REPORTED" || m.status === "DISPUTED") && hasCompetitors) {
            scores[m.id] = {
              p1Score: String(isTeam ? (m.reportedS1Score ?? m.p1Score ?? 0) : (m.reportedP1Score ?? m.p1Score ?? 0)),
              p2Score: String(isTeam ? (m.reportedS2Score ?? m.p2Score ?? 0) : (m.reportedP2Score ?? m.p2Score ?? 0)),
              winnerId: m.winnerId || m.winnerSquadId || (isTeam ? m.s1Id : m.p1Id),
            };
          }
        });
        setMatchScores(scores);
      }
    } catch (e) {
      console.error("Error fetching managed tournament:", e);
    } finally {
      setLoadingManaged(false);
    }
  }, []);

  useEffect(() => {
    if (managingTournamentId) {
      fetchManagedTournament(managingTournamentId);
    } else {
      setManagedTournament(null);
    }
  }, [managingTournamentId, fetchManagedTournament]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!managingTournamentId) return;
    try {
      const res = await fetch(`/api/tournaments/${managingTournamentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert(`Tournament status updated to ${newStatus}!`);
        fetchManagedTournament(managingTournamentId);
        fetchData(); // Refresh overview stats
      }
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const handleQuickStartTournament = async (
    tournamentId: string,
    title: string,
    playerCount: number,
    maxPlayers: number
  ) => {
    if (playerCount < 2) {
      alert("You need at least 2 approved players to start the tournament.");
      return;
    }

    const isEarlyStart = playerCount < maxPlayers;
    const message = isEarlyStart
      ? `Start "${title}" early with ${playerCount}/${maxPlayers} players? Brackets will be generated for all approved registrations.`
      : `Start "${title}" now with ${playerCount} players? This will generate brackets and set status to ONGOING.`;

    if (!(window.confirm(message))) return;

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ONGOING" }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("Tournament started and brackets generated successfully!");
        fetchData();
      }
    } catch {
      alert("Failed to start tournament.");
    }
  };

  const handleSubmitMatch = async (matchId: string) => {
    const scores = matchScores[matchId];
    if (!scores) return;
    setSubmittingMatchId(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p1Score: parseInt(scores.p1Score),
          p2Score: parseInt(scores.p2Score),
          winnerId: scores.winnerId,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("Match result submitted successfully!");
        fetchManagedTournament(managingTournamentId!);
      }
    } catch (e) {
      alert("Failed to submit match result");
    } finally {
      setSubmittingMatchId(null);
    }
  };

  // Create tournament modal
  const [showModal, setShowModal] = useState(false);
  // Body scroll lock for modals
  useBodyScrollLock(showModal);
  useBodyScrollLock(!!resolvingDispute);
  const [form, setForm] = useState({
    title: "", description: "",
    rules: "Standard Regulation rules apply.",
    entryFee: "0", prizePool: "5000",
    currency: "USD",
    prizeDistribution: "TOP_8",
    maxPlayers: "128",
    type: "SINGLE_ELIMINATION", status: "UPCOMING",
    badgeName: "", badgeIcon: "",
    game: "POKEMON_VGC",
    mode: "SOLO",
    minSquadMembers: "2",
    maxSquadMembers: "4",
    registrationDeadline: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16),
    startDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 16),
    watchLiveUrl: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [uploadingBadge, setUploadingBadge] = useState(false);

  const handleBadgeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBadge(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "badge_image");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setForm((prev) => ({ ...prev, badgeIcon: data.url }));
      } else {
        alert(data.error || "Failed to upload badge image.");
      }
    } catch {
      alert("Failed to upload badge image.");
    } finally {
      setUploadingBadge(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, sessionRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/auth/session"),
      ]);
      const [analyticsData, sessionData] = await Promise.all([analyticsRes.json(), sessionRes.json()]);
      if (analyticsData.metrics) setAnalytics(analyticsData);
      if (sessionData?.user) setSession(sessionData.user);
    } catch (e) { console.error("Admin fetch error:", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateTournamentClick = () => {
    if (!session) {
      setReturnUrl(currentUrl);
      setShowLoginModal(true);
      return;
    }
    setShowModal(true);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logoutTrainer(); } catch { setLoggingOut(false); }
  };

  const handleResolveDispute = async (action: "RESOLVE" | "DISMISS") => {
    if (!resolvingDispute) return;
    setHandlingDispute(true);
    try {
      const matchId = resolvingDispute.matchId;
      const body: any = {
        disputeAction: action,
        resolutionComment: disputeComment,
      };

      if (action === "RESOLVE") {
        if (!disputeP1Score || !disputeP2Score || !disputeWinnerId) {
          alert("Scores and winner ID are required to resolve a dispute.");
          setHandlingDispute(false);
          return;
        }
        body.p1Score = parseInt(disputeP1Score);
        body.p2Score = parseInt(disputeP2Score);
        body.winnerId = disputeWinnerId;
      }

      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert(action === "RESOLVE" ? "Dispute resolved and winner advanced!" : "Dispute dismissed.");
        setResolvingDispute(null);
        setDisputeComment("");
        setDisputeP1Score("");
        setDisputeP2Score("");
        setDisputeWinnerId("");
        fetchData();
      }
    } catch (err: any) {
      alert("Failed to process dispute: " + err.message);
    } finally {
      setHandlingDispute(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setCreateError(null); setCreateSuccess(false);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          entryFee: parseFloat(form.entryFee),
          prizePool: parseFloat(form.prizePool),
          maxPlayers: parseInt(form.maxPlayers),
          minSquadMembers: parseInt(form.minSquadMembers),
          maxSquadMembers: parseInt(form.maxSquadMembers),
          registrationDeadline: new Date(form.registrationDeadline).toISOString(),
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          watchLiveUrl: form.watchLiveUrl || null,
        }),
      });
      const data = await res.json();
      if (data.error) { setCreateError(data.error); }
      else {
        setCreateSuccess(true);
        setForm({
          title: "", description: "",
          rules: "Standard Regulation rules apply.",
          entryFee: "0", prizePool: "5000",
          currency: "USD",
          prizeDistribution: "TOP_8",
          maxPlayers: "128",
          type: "SINGLE_ELIMINATION", status: "UPCOMING",
          badgeName: "", badgeIcon: "",
          game: "POKEMON_VGC",
          mode: "SOLO",
          minSquadMembers: "2",
          maxSquadMembers: "4",
          registrationDeadline: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16),
          startDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16),
          endDate: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 16),
          watchLiveUrl: "",
        });
        setTimeout(() => { setShowModal(false); setCreateSuccess(false); fetchData(); }, 1200);
      }
    } catch (err: any) { setCreateError("Failed: " + err.message); }
    finally { setCreating(false); }
  };

  const m = analytics.metrics;
  const STATS = [
    { label: "Registered Trainers", value: loading ? "—" : (m.totalUsers ?? 0).toLocaleString(), icon: "group", color: "bg-accent-blue text-white" },
    { label: "Total Tournaments", value: loading ? "—" : (m.totalTournaments ?? 0).toLocaleString(), icon: "emoji_events", color: "bg-accent-yellow text-primary" },
    { label: "Active Tournaments", value: loading ? "—" : (m.activeTournaments ?? 0).toLocaleString(), icon: "stadium", color: "bg-accent-blue text-white" },
    { label: "Pending Registrations", value: loading ? "—" : (m.pendingRegistrations ?? 0).toLocaleString(), icon: "assignment_late", color: (m.pendingRegistrations ?? 0) > 0 ? "bg-accent-red text-white" : "bg-accent-yellow text-primary" },
  ];

  return (
    <div className="flex min-h-screen bg-background font-space-grotesk text-primary">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 fixed h-full z-50 bg-white border-r-4 border-primary">
        <SidebarContent nav={NAV} session={session} onLogout={handleLogout} loggingOut={loggingOut} />
      </aside>

      {/* ── Mobile Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black z-40" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="md:hidden fixed top-0 bottom-0 left-0 w-64 z-50 flex flex-col bg-white border-r-4 border-primary">
              <div className="flex justify-end p-3 border-b-4 border-primary bg-white">
                <button onClick={() => setSidebarOpen(false)} className="material-symbols-outlined text-primary hover:opacity-70 transition-opacity">close</button>
              </div>
              <SidebarContent nav={NAV} session={session} onLogout={handleLogout} loggingOut={loggingOut} onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b-4 border-primary h-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 border-3 border-primary bg-white text-primary">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-primary">System Overview</h1>
              <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Administration Console</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} title="Refresh" className="w-10 h-10 border-3 border-primary bg-white hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors active:translate-x-[2px] active:translate-y-[2px]">
              <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>refresh</span>
            </button>
            <button onClick={handleCreateTournamentClick}
              className="flex items-center gap-2 px-6 py-2.5 bg-accent-yellow text-primary border-3 border-primary font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_#1a1a1a] hover:shadow-[6px_6px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
              <span className="material-symbols-outlined text-sm">add</span>
              <span>New Tournament</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-[1280px] w-full mx-auto">
          {managingTournamentId ? (
            <TournamentManagementPanel
              id={managingTournamentId}
              onBack={() => setManagingTournamentId(null)}
              managedTournament={managedTournament}
              load
Managed={loadingManaged}
              fetchManaged={fetchManagedTournament}
              handleUpdateStatus={handleUpdateStatus}
              matchScores={matchScores}
              setMatchScores={setMatchScores}
              handleSubmitMatch={handleSubmitMatch}
              submittingMatchId={submittingMatchId}
              fetchData={fetchData}
            />
          ) : (
            <>
              {/* Welcome Banner */}
              <div className="bg-accent-blue border-4 border-primary p-6 flex items-center justify-between relative overflow-hidden shadow-[8px_8px_0px_0px_#1a1a1a]">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none text-white select-none">
                  <span className="material-symbols-outlined" style={{ fontSize: 120 }}>catching_pokemon</span>
                </div>
                <div className="relative z-10 text-white text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-1">Welcome back,</p>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white">{session?.name || "Chief Arbiter"}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 border-2 border-white bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>shield</span>
                      {(session?.role === "SUPER_ADMIN" ? "ADMIN" : session?.role) || "ADMIN"}
                    </span>
                    {session?.email && <span className="text-xs font-bold uppercase text-white/70 ml-2">{session.email}</span>}
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {STATS.map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-white p-5 border-4 border-primary shadow-[8px_8px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[10px_10px_0px_#1a1a1a] transition-all cursor-default flex flex-col justify-between min-h-[140px] text-left">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{stat.label}</span>
                      <div className={`w-8 h-8 border-2 border-primary flex items-center justify-center text-sm ${stat.color}`}>
                        <span className="material-symbols-outlined text-base">{stat.icon}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-black text-4xl tracking-tighter text-primary">{stat.value}</div>
                      <div className="flex items-center gap-1 mt-2 text-[10px] font-bold italic uppercase text-primary/50">
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>info</span>
                        <span>System Metric</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </section>

              {/* Recent Tournaments Table */}
              <section className="bg-white border-4 border-primary shadow-[8px_8px_0px_0px_#1a1a1a]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b-4 border-primary bg-surface-container-low text-left">
                  <h2 className="font-black text-primary text-xl uppercase tracking-tight">Recent Tournaments</h2>
                  <Link href="/tournaments" className="text-xs font-black uppercase tracking-wider underline decoration-2 underline-offset-4 hover:text-accent-blue transition-colors mt-2 sm:mt-0">
                    View all Tournaments →
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container border-b-2 border-primary">
                        {["Tournament", "Format", "Status", "Registered", "Prize Pool", "Action"].map(h => (
                          <th key={h} className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-primary">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-primary">
                      {loading ? (
                        <tr><td colSpan={6} className="text-center py-12 text-primary font-bold uppercase text-xs italic">Loading tournament records…</td></tr>
                      ) : (analytics.recentTournaments?.length > 0 ? (
                        analytics.recentTournaments.map((t: any) => {
                          const s = STATUS_CONFIG[t.status] || STATUS_CONFIG.DRAFT;
                          const approvedCount = t._count?.registrations ?? 0;
                          const canStart =
                            (t.status === "REGISTRATION_OPEN" || t.status === "UPCOMING" || t.status === "DRAFT") &&
                            approvedCount >= 2;
                          const isEarlyStart = approvedCount < t.maxPlayers;
                          return (
                            <tr key={t.id} className="hover:bg-surface-container-low transition-colors">
                              <td className="px-5 py-4">
                                <Link href={`/tournaments/${t.id}`} className="font-bold text-primary hover:text-accent-blue text-sm uppercase tracking-tight">{t.title}</Link>
                              </td>
                              <td className="px-5 py-4">
                                <span className="text-[10px] font-black px-2.5 py-1 bg-accent-blue text-white border-2 border-primary shadow-[2px_2px_0px_0px_#1a1a1a] uppercase whitespace-nowrap">
                                  {t.type?.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`text-[10px] font-black px-2.5 py-1 border-2 border-primary shadow-[2px_2px_0px_0px_#1a1a1a] uppercase whitespace-nowrap ${s.cls}`}>{s.label}</span>
                              </td>
                              <td className="px-5 py-4 text-xs font-bold text-primary">
                                {approvedCount} / {t.maxPlayers}
                              </td>
                              <td className="px-5 py-4 text-sm font-black text-accent-blue">
                                {formatPrizeAmount(t.prizePool ?? 0, t.currency)}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2 flex-wrap">
                                  {canStart && (
                                    <button
                                      onClick={() =>
                                        handleQuickStartTournament(t.id, t.title, approvedCount, t.maxPlayers)
                                      }
                                      className="bg-accent-yellow text-primary border-2 border-primary px-3 py-1.5 font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-yellow-400 transition-all cursor-pointer whitespace-nowrap"
                                      title={
                                        isEarlyStart
                                          ? `Start with ${approvedCount}/${t.maxPlayers} players`
                                          : "Start tournament"
                                      }
                                    >
                                      {isEarlyStart ? "Start Early" : "Start"}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setManagingTournamentId(t.id)}
                                    className="bg-accent-yellow text-primary border-2 border-primary px-3 py-1.5 font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-yellow-400 transition-all cursor-pointer"
                                  >
                                    Manage
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (window.confirm(`Delete tournament "${t.title}"? This cannot be undone and will delete all registrations, payments, and bracket matches associated with it.`)) {
                                        try {
                                          const res = await fetch(`/api/tournaments/${t.id}`, {
                                            method: "DELETE",
                                          });
                                          const data = await res.json();
                                          if (data.error) {
                                            alert(data.error);
                                          } else {
                                            alert("Tournament deleted successfully!");
                                            fetchData();
                                          }
                                        } catch (e) {
                                          alert("Failed to delete tournament.");
                                        }
                                      }
                                    }}
                                    className="bg-accent-red text-white border-2 border-primary px-2.5 py-1.5 font-bold text-xs shadow-[2px_2px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-red-700 transition-all cursor-pointer flex items-center justify-center"
                                    title="Delete Tournament"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-16">
                            <span className="material-symbols-outlined text-5xl text-primary/30 block mb-3">emoji_events</span>
                            <p className="text-xs font-bold text-primary/60 uppercase mb-4">No tournaments found. Build your first arena!</p>
                            <button onClick={handleCreateTournamentClick}
                              className="px-6 py-2.5 bg-accent-yellow text-primary border-3 border-primary font-bold text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                              Create Tournament
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Active disputes log */}
              <section className="bg-white border-4 border-primary shadow-[8px_8px_0px_0px_#1a1a1a] text-primary">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b-4 border-primary bg-accent-red text-white text-left">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined scale-110">warning</span>
                    <h2 className="font-black text-xl uppercase tracking-tight">Active Match Disputes</h2>
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider bg-white text-accent-red px-2.5 py-1 border-2 border-primary shadow-[2px_2px_0px_0px_#1a1a1a]">
                    {analytics.disputes?.length || 0} Open Disputes
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container border-b-2 border-primary">
                        {["Tournament", "Matchup", "Reason", "Screenshots", "Filed By", "Action"].map(h => (
                          <th key={h} className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-primary">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-primary">
                      {analytics.disputes?.length > 0 ? (
                        analytics.disputes.map((d: any) => (
                          <tr key={d.id} className="hover:bg-surface-container-low transition-colors text-xs font-bold text-primary">
                            <td className="px-5 py-4">
                              <Link href={`/tournaments/${d.match?.tournament?.id}`} className="font-bold text-primary hover:text-accent-blue uppercase tracking-tight">
                                {d.match?.tournament?.title}
                              </Link>
                            </td>
                            <td className="px-5 py-4 font-black">
                              {d.match?.p1?.name || "Player 1"} vs {d.match?.p2?.name || "Player 2"}
                            </td>
                            <td className="px-5 py-4 max-w-xs truncate italic">
                              "{d.reason}"
                            </td>
                            <td className="px-5 py-4">
                              {d.match?.attachments?.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {d.match.attachments.map((att: any, idx: number) => (
                                    <a
                                      key={att.id}
                                      href={att.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-accent-blue underline hover:text-blue-800 break-all"
                                    >
                                      Proof #{idx + 1} (View)
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-primary/40 uppercase text-[10px]">No Proof URL</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {d.match?.p1Id === d.raisedById ? d.match?.p1?.name : d.match?.p2?.name}
                            </td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => {
                                  setResolvingDispute(d);
                                  setDisputeP1Score(String(d.match?.p1Score || 0));
                                  setDisputeP2Score(String(d.match?.p2Score || 0));
                                  setDisputeWinnerId(d.match?.p1Id || "");
                                  setDisputeComment("");
                                }}
                                className="bg-accent-yellow text-primary border-2 border-primary px-3 py-1.5 font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-yellow-400 transition-all cursor-pointer"
                              >
                                Resolve
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-primary/40 font-bold uppercase text-[10px]">
                            No active disputes reported. Everything is running smoothly!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Bottom row: Audit Logs + System Health */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white border-4 border-primary p-5 shadow-[8px_8px_0px_0px_#1a1a1a] text-left">
                  <h2 className="font-black text-primary text-lg uppercase tracking-tight mb-4 border-b-2 border-primary pb-2">Audit Logs</h2>
                  {analytics.auditLogs?.length > 0 ? (
                    <div className="space-y-3 max-h-52 overflow-y-auto custom-scroll pr-1">
                      {analytics.auditLogs.map((log: any) => (
                        <div key={log.id} className="text-xs p-3 bg-surface-container-low border-2 border-primary font-bold text-left">
                          <span className="text-accent-blue uppercase">[ {log.action} ] </span>
                          <span className="text-primary font-medium">{log.details}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-primary/50">
                      <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                      <p className="text-xs font-bold uppercase">No audit logs recorded yet.</p>
                    </div>
                  )}
                </section>

                <section className="bg-white border-4 border-primary p-5 shadow-[8px_8px_0px_0px_#1a1a1a] text-left">
                  <h2 className="font-black text-primary text-lg uppercase tracking-tight mb-4 border-b-2 border-primary pb-2">System Health</h2>
                  <div className="space-y-4">
                    {[
                      { label: "Database (Neon PostgreSQL)", status: "Nominal", good: true },
                      { label: "NextAuth Sessions", status: "Active", good: true },
                      { label: "Prisma ORM v7", status: "Connected", good: true },
                      { label: "Payment Gateway", status: "Standby", good: false },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b-2 border-dashed border-primary/20 last:border-0">
                        <span className="text-xs text-primary font-bold uppercase tracking-tight">{item.label}</span>
                        <span className={`flex items-center gap-1.5 text-xs font-black uppercase ${item.good ? "text-green-700" : "text-amber-600"}`}>
                          <span className={`w-3 h-3 border-2 border-primary ${item.good ? "bg-green-500 animate-pulse" : "bg-amber-400"}`}></span>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </main>

        {/* Footer (Internal) */}
        <footer className="bg-white border-t-4 border-primary px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4 mt-auto">
          <p className="text-[10px] font-black uppercase tracking-widest italic text-primary">© 2026 CHAMPSARENA • FORM FOLLOWS FUNCTION</p>
          <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-primary">
            <a className="hover:text-accent-blue underline decoration-2 underline-offset-2 transition-colors" href="#">Internal Wiki</a>
            <a className="hover:text-accent-blue underline decoration-2 underline-offset-2 transition-colors" href="#">Support</a>
            <a className="hover:text-accent-blue underline decoration-2 underline-offset-2 transition-colors" href="#">Log Files</a>
          </div>
        </footer>
      </div>

      {/* ── Create Tournament Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="w-full max-w-[512px] bg-white border-4 border-primary shadow-[12px_12px_0px_0px_#1a1a1a] max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b-4 border-primary bg-accent-yellow">
                <h2 className="text-xl font-black text-primary uppercase tracking-tight">Create Tournament</h2>
                <button onClick={() => setShowModal(false)} className="material-symbols-outlined text-primary hover:text-primary/70 transition-colors cursor-pointer">close</button>
              </div>

              {createSuccess && (
                <div className="mx-5 mt-4 p-3 border-3 border-primary bg-green-100 text-green-950 text-xs font-black uppercase text-center">
                  <span className="material-symbols-outlined text-sm align-middle mr-1">check_circle</span>
                  Tournament created successfully!
                </div>
              )}
              {createError && (
                <div className="mx-5 mt-4 p-3 border-3 border-primary bg-accent-red text-white text-xs font-black uppercase text-center">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreate} className="p-5 space-y-4 text-left">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary">Tournament Title *</label>
                  <input type="text" required placeholder="Lumiose City Masters 2026"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border-3 border-primary px-4 py-3 text-sm font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary placeholder:text-primary/40" />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary">Description *</label>
                  <textarea required rows={3} placeholder="Describe this tournament…"
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full border-3 border-primary px-4 py-3 text-sm font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary placeholder:text-primary/40 resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary">Rules</label>
                  <textarea rows={2} value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))}
                    className="w-full border-3 border-primary px-4 py-3 text-sm font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3 select-none">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary">Custom Badge Name</label>
                    <input type="text" placeholder="e.g. Lumiose Cup Badge" value={form.badgeName}
                      onChange={e => setForm(f => ({ ...f, badgeName: e.target.value }))}
                      className="w-full border-3 border-primary px-4 py-3 text-sm font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary placeholder:text-primary/40" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary">Badge Image</label>
                    {form.badgeIcon ? (
                      <div className="flex items-center gap-2 border-3 border-primary p-2 bg-surface-container-low h-[48px]">
                        <div className="w-8 h-8 border-2 border-primary overflow-hidden relative flex-shrink-0">
                          <img src={form.badgeIcon} alt="Badge Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-primary/60 font-black uppercase">Uploaded</span>
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, badgeIcon: "" }))}
                            className="bg-accent-red text-white border border-primary px-1.5 py-0.5 text-[8px] font-black hover:bg-red-700 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-3 border-dashed border-primary/50 hover:border-primary px-2 py-1 text-center bg-surface-container-low cursor-pointer flex flex-col items-center justify-center h-[48px] relative transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBadgeUpload}
                          disabled={uploadingBadge}
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="text-[10px] font-black uppercase text-primary">
                          {uploadingBadge ? "Uploading..." : "Click to Upload"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 select-none">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary">Currency</label>
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                      className="w-full border-3 border-primary px-4 py-3 text-sm font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary">
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary">Prize Distribution</label>
                    <select value={form.prizeDistribution} onChange={e => setForm(f => ({ ...f, prizeDistribution: e.target.value }))}
                      className="w-full border-3 border-primary px-4 py-3 text-sm font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary">
                      <option value="TOP_1">Top 1 (100%)</option>
                      <option value="TOP_3">Top 3 (60% / 30% / 10%)</option>
                      <option value="TOP_4">Top 4 (50% / 25% / 12.5% x2)</option>
                      <option value="TOP_8">Top 8 (50% / 20% / 10% x2 / 2.5% x4)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: `Entry Fee (${form.currency === "INR" ? "₹" : "$"})`, key: "entryFee", type: "number" },
                    { label: `Prize Pool (${form.currency === "INR" ? "₹" : "$"})`, key: "prizePool", type: "number" },
                    { label: "Max Players", key: "maxPlayers", type: "number" },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary">{label}</label>
                      <input type={type} min="0" value={(form as any)[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full border-3 border-primary px-4 py-3 text-sm font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary">Format</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full border-3 border-primary px-4 py-3 text-sm font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary">
                      {["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "ROUND_ROBIN", "SWISS"].map(v => (
                        <option key={v} value={v}>{v.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary">Game</label>
                    <select value={form.game} onChange={e => setForm(f => ({ ...f, game: e.target.value }))}
                      className="w-full border-3 border-primary px-4 py-3 text-sm font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary">
                      <option value="POKEMON_VGC">Pokémon VGC & TCG</option>
                      <option value="FREE_FIRE">Free Fire</option>
                      <option value="BGMI">Battlegrounds Mobile India (BGMI)</option>
                      <option value="VALORANT">Valorant</option>
                      <option value="CLASH_ROYALE">Clash Royale</option>
                      <option value="CLASH_OF_CLANS">Clash of Clans</option>
                      <option value="BRAWL_STARS">Brawl Stars</option>
                      <option value="EA_FC">EA Sports FC</option>
                      <option value="FORTNITE">Fortnite</option>
                      <option value="PUBG">PUBG: Battlegrounds</option>
                      <option value="MOBILE_LEGENDS">Mobile Legends: Bang Bang</option>
                      <option value="APEX_LEGENDS">Apex Legends</option>
                    </select>
                  </div>

                  {/* Tournament Mode */}
                  <div className="col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary">Tournament Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["SOLO", "SQUAD"] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, mode: m }))}
                          className={`py-2.5 border-2 border-primary text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer shadow-[2px_2px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                            form.mode === m ? "bg-primary text-white" : "bg-white text-primary hover:bg-accent-yellow"
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">{m === "SOLO" ? "person" : "groups"}</span>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Squad Config — shown only in SQUAD mode */}
                  {form.mode === "SQUAD" && (
                    <>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary">Min Squad Size</label>
                        <input type="number" min="2" max="10" value={form.minSquadMembers}
                          onChange={e => setForm(f => ({ ...f, minSquadMembers: e.target.value }))}
                          className="w-full border-3 border-primary px-4 py-3 text-sm font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary" />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary">Max Squad Size</label>
                        <input type="number" min="2" max="10" value={form.maxSquadMembers}
                          onChange={e => setForm(f => ({ ...f, maxSquadMembers: e.target.value }))}
                          className="w-full border-3 border-primary px-4 py-3 text-sm font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary" />
                      </div>
                    </>
                  )}

                  <div className="col-span-2 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-primary">Reg Close *</label>
                      <input type="datetime-local" required value={form.registrationDeadline}
                        onChange={e => setForm(f => ({ ...f, registrationDeadline: e.target.value }))}
                        className="w-full border-3 border-primary p-2 text-xs font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-primary">Start Date *</label>
                      <input type="datetime-local" required value={form.startDate}
                        onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                        className="w-full border-3 border-primary p-2 text-xs font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-primary">End Date *</label>
                      <input type="datetime-local" required value={form.endDate}
                        onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                        className="w-full border-3 border-primary p-2 text-xs font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5 text-primary">Watch Live URL (Stream Link)</label>
                    <input type="url" placeholder="e.g. https://twitch.tv/..." value={form.watchLiveUrl}
                      onChange={e => setForm(f => ({ ...f, watchLiveUrl: e.target.value }))}
                      className="w-full border-3 border-primary px-4 py-3 text-sm font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary placeholder:text-primary/40" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border-3 border-primary bg-white text-primary font-bold uppercase text-xs tracking-wider transition-all hover:bg-surface-container-high active:translate-x-[2px] active:translate-y-[2px]">
                    Cancel
                  </button>
                  <button type="submit" disabled={creating}
                    className="flex-1 py-3 border-3 border-primary bg-accent-blue text-white font-bold uppercase text-xs tracking-wider transition-all hover:bg-blue-700 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 shadow-[4px_4px_0px_0px_#1a1a1a] active:shadow-none">
                    {creating ? "Creating…" : "Create Tournament"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dispute Resolution Modal ── */}
      <AnimatePresence>
        {resolvingDispute && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4 backdrop-blur-sm"
            onClick={e => {
              if (e.target === e.currentTarget) {
                setResolvingDispute(null);
              }
            }}
            onKeyDown={e => {
              if (e.key === "Escape") {
                setResolvingDispute(null);
              }
            }}
            tabIndex="-1"
          >
            <div className="w-full max-w-[512px] bg-white border-8 border-primary shadow-[12px_12px_0px_0px_#1a1a1a] max-h-[85vh] overflow-y-auto custom-scrollbar text-primary">
              <div className="flex items-center justify-between p-5 border-b-4 border-primary bg-accent-red text-white">
                <h2 className="text-xl font-black uppercase tracking-tight">Resolve Dispute</h2>
                <button
                  onClick={() => setResolvingDispute(null)}
                  className="material-symbols-outlined text-white hover:text-white/70 transition-colors cursor-pointer"
                >
                  close
                </button>
              </div>

              <div className="p-5 space-y-4 text-left font-bold text-xs uppercase">
                <div className="bg-accent-yellow border-2 border-primary p-xs text-center font-black">
                  Match: {resolvingDispute.match?.p1?.name} vs {resolvingDispute.match?.p2?.name}
                </div>
                <div className="border-2 border-primary p-xs bg-surface-container-high">
                  <p className="font-black text-primary/60 mb-1">Dispute Reason:</p>
                  <p className="normal-case italic">"{resolvingDispute.reason}"</p>
                </div>

                {resolvingDispute.match?.attachments?.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-black text-primary/60">Screenshot Evidence:</p>
                    <div className="flex flex-col gap-1">
                      {resolvingDispute.match.attachments.map((att: any, idx: number) => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent-blue underline hover:text-blue-800 break-all text-[11px]"
                        >
                          View Evidence Screenshot #{idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scores input */}
                <div className="border-4 border-primary p-sm space-y-sm bg-surface-container-low">
                  <span className="font-black tracking-wider block text-center">Admin Score Override</span>
                  <div className="grid grid-cols-2 gap-sm">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black line-clamp-1">
                        {resolvingDispute.match?.p1?.name || "Player 1"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={disputeP1Score}
                        onChange={(e) => setDisputeP1Score(e.target.value)}
                        className="w-full border-2 border-primary p-xs font-black text-center focus:bg-accent-yellow outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] footer line-clamp-1">
                        {resolvingDispute.match?.p2?.name || "Player 2"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={disputeP2Score}
                        onChange={(e) => setDisputeP2Score(e.target.value)}
                        className="w-full border-2 border-primary p-xs font-black text-center focus:bg-accent-yellow outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 pt-xs">
                    <label className="text-[10px] font-black">Declare Winner</label>
                    <select
                      value={disputeWinnerId}
                      onChange={(e) => setDisputeWinnerId(e.target.value)}
                      className="w-full border-2 border-primary p-xs font-black bg-white focus:outline-none"
                    >
                      <option value="">-- SELECT WINNER --</option>
                      {resolvingDispute.match?.p1Id && (
                        <option value={resolvingDispute.match.p1Id}>
                          {resolvingDispute.match.p1?.name || "Player 1"}
                        </option>
                      )}
                      {resolvingDispute.match?.p2Id && (
                        <option value={resolvingDispute.match.p2Id}>
                          {resolvingDispute.match.p2?.name || "Player 2"}
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black">Resolution Comment / Verdict</label>
                  <textarea
                    placeholder="Enter ruling details..."
                    value={disputeComment}
                    onChange={(e) => setDisputeComment(e.target.value)}
                    rows={3}
                    className="w-full border-3 border-primary p-xs font-medium uppercase placeholder:text-primary/30 resize-none outline-none focus:bg-accent-yellow/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-sm select-none pt-2">
                  <button
                    onClick={() => handleResolveDispute("RESOLVE")}
                    disabled={handlingDispute}
                    className="p-3 bg-accent-blue text-white border-2 border-primary font-black uppercase text-xs text-center cursor-pointer shadow-[2px_2px_0px_0px_#1a1a1a] active:translate-y-0.5 active:shadow-none"
                  >
                    {handlingDispute ? "Processing..." : "Submit Verdict"}
                  </button>
                  <button
                    onClick={() => handleResolveDispute("DISMISS")}
                    disabled={handlingDispute}
                    className="p-3 bg-accent-red text-white border-2 border-primary font-black uppercase text-xs text-center cursor-pointer shadow-[2px_2px_0px_0px_#1a1a1a] active:translate-y-0.5 active:shadow-none"
                  >
                    {handlingDispute ? "Processing..." : "Dismiss Dispute"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
{showLoginModal && (
  <Modal
    isOpen={showLoginModal}
    onClose={() => setShowLoginModal(false)}
    title="Login Required"
  >
    <p className="text-primary font-bold uppercase text-center mb-4">
      You need to sign in to continue.
    </p>
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={() => {
          setShowLoginModal(false);
          router.push(`/login?callback=${encodeURIComponent(currentUrl)}`);
        }}
        className="flex-1 py-3 border-3 border-primary bg-accent-yellow text-primary font-bold uppercase text-xs tracking-widest hover:bg-yellow-400 transition-all"
      >
        Sign In
      </button>
      <button
        onClick={() => {
          setShowLoginModal(false);
          router.push(`/login?tab=signup&callback=${encodeURIComponent(currentUrl)}`);
        }}
        className="flex-1 py-3 border-3 border-primary bg-primary text-white font-bold uppercase text-xs tracking-widest hover:bg-blue-700 transition-all"
      >
        Create Account
      </button>
    </div>
  </Modal>
)}
    </div>
  );
}

function TournamentManagementPanel({
  id,
  onBack,
  managedTournament,
  loadingManaged,
  fetchManaged,
  handleUpdateStatus,
  matchScores,
  setMatchScores,
  handleSubmitMatch,
  submittingMatchId,
  fetchData,
}: {
  id: string;
  onBack: () => void;
  managedTournament: any;
  loadingManaged: boolean;
  fetchManaged: (id: string) => void;
  handleUpdateStatus: (newStatus: string) => void;
  matchScores: any;
  setMatchScores: any;
  handleSubmitMatch: (matchId: string) => void;
  submittingMatchId: string | null;
  fetchData: () => Promise<void>;
}) {
  const [activeRoundTab, setActiveRoundTab] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [seedingType, setSeedingType] = useState<"ELO" | "RANDOM">("ELO");
  const [shuffledPlayers, setShuffledPlayers] = useState<any[]>([]);

  const handleReshuffle = useCallback(() => {
    if (!managedTournament?.registrations?.length) return;
    const array = [...managedTournament.registrations];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    setShuffledPlayers(array);
  }, [managedTournament?.registrations]);

  useEffect(() => {
    if ((managedTournament?.registrations?.length || 0) > 0 && shuffledPlayers.length === 0) {
      handleReshuffle();
    }
  }, [managedTournament?.registrations?.length, shuffledPlayers.length, handleReshuffle]);

  const handleGenerateBracket = async () => {
    setSavingDetails(true);
    try {
      const res = await fetch(`/api/tournaments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ONGOING",
          seedingType: seedingType,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("Tournament started and brackets generated successfully!");
        fetchManaged(id);
        fetchData();
      }
    } catch (e) {
      alert("Failed to generate brackets.");
    } finally {
      setSavingDetails(false);
    }
  };

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    rules: "",
    type: "",
    entryFee: "",
    prizePool: "",
    currency: "USD",
    prizeDistribution: "TOP_8",
    maxPlayers: "",
    badgeName: "",
    badgeIcon: "",
    game: "",
    mode: "SOLO",
    minSquadMembers: "2",
    maxSquadMembers: "4",
    registrationDeadline: "",
    startDate: "",
    endDate: "",
    watchLiveUrl: "",
  });

  useEffect(() => {
    if (managedTournament) {
      setEditForm({
        title: managedTournament.title || "",
        description: managedTournament.description || "",
        rules: managedTournament.rules || "",
        type: managedTournament.type || "SINGLE_ELIMINATION",
        entryFee: String(managedTournament.entryFee ?? 0),
        prizePool: String(managedTournament.prizePool ?? 0),
        currency: managedTournament.currency || "USD",
        prizeDistribution: managedTournament.prizeDistribution || "TOP_8",
        maxPlayers: String(managedTournament.maxPlayers ?? 128),
        badgeName: managedTournament.badgeName || "",
        badgeIcon: managedTournament.badgeIcon || "",
        game: managedTournament.game || "POKEMON_VGC",
        mode: managedTournament.mode || "SOLO",
        minSquadMembers: String(managedTournament.minSquadMembers ?? 2),
        maxSquadMembers: String(managedTournament.maxSquadMembers ?? 4),
        registrationDeadline: managedTournament.registrationDeadline ? new Date(managedTournament.registrationDeadline).toISOString().slice(0, 16) : "",
        startDate: managedTournament.startDate ? new Date(managedTournament.startDate).toISOString().slice(0, 16) : "",
        endDate: managedTournament.endDate ? new Date(managedTournament.endDate).toISOString().slice(0, 16) : "",
        watchLiveUrl: managedTournament.watchLiveUrl || "",
      });
    }
  }, [managedTournament]);

  const [uploadingEditBadge, setUploadingEditBadge] = useState(false);

  const handleEditBadgeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEditBadge(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "badge_image");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setEditForm(prev => ({ ...prev, badgeIcon: data.url }));
      } else {
        alert(data.error || "Failed to upload badge image.");
      }
    } catch {
      alert("Failed to upload badge image.");
    } finally {
      setUploadingEditBadge(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      const res = await fetch(`/api/tournaments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          rules: editForm.rules,
          type: editForm.type,
          entryFee: parseFloat(editForm.entryFee),
          prizePool: parseFloat(editForm.prizePool),
          currency: editForm.currency,
          prizeDistribution: editForm.prizeDistribution,
          maxPlayers: parseInt(editForm.maxPlayers),
          badgeName: editForm.badgeName || null,
          badgeIcon: editForm.badgeIcon || null,
          game: editForm.game,
          mode: editForm.mode,
          minSquadMembers: parseInt(editForm.minSquadMembers),
          maxSquadMembers: parseInt(editForm.maxSquadMembers),
          registrationDeadline: editForm.registrationDeadline ? new Date(editForm.registrationDeadline).toISOString() : undefined,
          startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : undefined,
          endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : undefined,
          watchLiveUrl: editForm.watchLiveUrl || null,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("Tournament details updated successfully!");
        setEditMode(false);
        fetchManaged(id);
        fetchData();
      }
    } catch (e) {
      alert("Failed to update tournament info.");
    } finally {
      setSavingDetails(false);
    }
  };

  useEffect(() => {
    if (managedTournament?.matches?.length > 0) {
      const rounds = Array.from(new Set(managedTournament.matches.map((m: any) => m.round) as number[]))
        .sort((a, b) => a - b);
      if (rounds.length > 0 && activeRoundTab === null) {
        setActiveRoundTab(rounds[0]);
      }
    }
  }, [managedTournament, activeRoundTab]);

  if (loadingManaged && !managedTournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent animate-spin"></div>
        <p className="text-primary font-bold uppercase text-xs tracking-wider mt-sm">Loading tournament control center…</p>
      </div>
    );
  }

  if (!managedTournament) {
    return (
      <div className="bg-white border-4 border-primary p-8 text-center shadow-[8px_8px_0px_0px_#1a1a1a]">
        <p className="text-accent-red font-black uppercase tracking-wider mb-md">Tournament details could not be loaded.</p>
        <button onClick={onBack} className="bg-accent-blue text-white border-3 border-primary px-6 py-2 font-bold uppercase text-xs tracking-wider cursor-pointer">
          Go Back
        </button>
      </div>
    );
  }

  const t = managedTournament;
  const matches = t.matches || [];
  const registrations = t.registrations || [];

  const rounds = Array.from(new Set(matches.map((m: any) => m.round) as number[]))
    .sort((a, b) => a - b);

  const getRoundName = (roundNum: number, type: string) => {
    if (roundNum === 99) return "Grand Finals";
    if (type === "DOUBLE_ELIMINATION") {
      if (roundNum < 0) return `Losers Round ${Math.abs(roundNum)}`;
      return `Winners Round ${roundNum}`;
    }
    return `Round ${roundNum}`;
  };

  const getStatusBadgeCls = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return config.cls;
  };

  return (
    <div className="space-y-lg select-none">

      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pb-md border-b-4 border-primary">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-10 h-10 border-3 border-primary bg-white flex items-center justify-center hover:bg-accent-yellow transition-colors active:translate-x-[2px] active:translate-y-[2px] cursor-pointer">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="text-left">
            <h2 className="font-black text-primary text-2xl uppercase tracking-tight">{t.title}</h2>
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Tournament Control Center</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchManaged(id)}
            className="w-10 h-10 border-3 border-primary bg-white flex items-center justify-center hover:bg-surface-container-high transition-colors active:translate-x-[2px] active:translate-y-[2px] cursor-pointer">
            <span className={`material-symbols-outlined ${loadingManaged ? "animate-spin" : ""}`}>refresh</span>
          </button>
        </div>
      </div>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg text-left">

        {/* Left Column: Management actions and stats */}
        <div className="lg:col-span-4 space-y-lg">
          {/* Quick Info Card */}
          <div className="bg-white p-5 border-4 border-primary shadow-[8px_8px_0px_0px_#1a1a1a]">
            <div className="flex items-center justify-between mb-sm border-b-2 border-primary pb-2">
              <h3 className="font-black text-primary text-sm uppercase tracking-wider">Tournament Info</h3>
              <button
                onClick={() => setEditMode(true)}
                className="text-xs font-black uppercase underline decoration-2 underline-offset-2 text-accent-blue hover:text-blue-700 flex items-center gap-[2px] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Edit
              </button>
            </div>

            <div className="space-y-2 text-xs font-bold uppercase tracking-tight">
              <div className="flex justify-between py-1.5 border-b border-primary/20">
                <span className="text-primary/60">Format:</span>
                <span className="text-primary">{t.type?.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-primary/20">
                <span className="text-primary/60">Fee:</span>
                <span className="text-primary">{t.currency === "INR" ? "₹" : "$"}{t.entryFee}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-primary/20">
                <span className="text-primary/60">Prize Pool:</span>
                <span className="text-accent-blue">{formatPrizeAmount(t.prizePool ?? 0, t.currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-primary/20">
                <span className="text-primary/60">Players:</span>
                <span className="text-primary">{registrations.length} / {t.maxPlayers}</span>
              </div>
              {t.badgeName && (
                <div className="flex justify-between py-1.5 border-b border-primary/20 items-center">
                  <span className="text-primary/60">Custom Badge:</span>
                  <span className="text-accent-red flex items-center gap-1 font-black">
                    {t.badgeIcon && (t.badgeIcon.startsWith("/") || t.badgeIcon.startsWith("http")) && (
                      <img src={t.badgeIcon} alt={t.badgeName} className="w-5 h-5 object-contain" />
                    )}
                    {t.badgeName}
                  </span>
                </div>
              )}
              {t.status === "COMPLETED" && t.winner && (
                <div className="flex justify-between py-1.5 border-b border-primary/20 items-center">
                  <span className="text-primary/60">Grand Champion:</span>
                  <span className="text-accent-blue font-black flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">emoji_events</span>
                    {t.winner.name}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-primary/60 font-bold uppercase">Current Status:</span>
                <span className={`text-[10px] font-black px-2.5 py-1 border-2 border-primary shadow-[2px_2px_0px_0px_#1a1a1a] uppercase ${getStatusBadgeCls(t.status)}`}>
                  {t.status?.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Controls Card */}
          <div className="bg-white p-5 border-4 border-primary shadow-[8px_8px_0px_0px_#1a1a1a] space-y-4">
            <h3 className="font-black text-primary text-sm uppercase tracking-wider border-b-2 border-primary pb-2">Tournament Actions</h3>

            <div className="space-y-3">
              {(t.status === "DRAFT" || t.status === "UPCOMING") && (
                <button
                  onClick={() => handleUpdateStatus("REGISTRATION_OPEN")}
                  className="w-full py-3 bg-accent-blue text-white border-3 border-primary font-bold uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  Open Registration
                </button>
              )}

              {(t.status === "REGISTRATION_OPEN" || t.status === "UPCOMING" || t.status === "DRAFT") && (
                <button
                  onClick={async () => {
                    if (registrations.length < 2) {
                      alert("You need at least 2 registered and approved players to start the tournament!");
                      return;
                    }
                    const isEarlyStart = registrations.length < t.maxPlayers;
                    const message = isEarlyStart
                      ? `Start the tournament early with ${registrations.length}/${t.maxPlayers} approved players? Brackets will be generated for current registrations only.`
                      : `Start the tournament now? This will generate the initial match brackets for ${registrations.length} players and transition status to ONGOING.`;
                    if (window.confirm(message)) {
                      handleUpdateStatus("ONGOING");
                    }
                  }}
                  className="w-full py-3 bg-accent-yellow text-primary border-3 border-primary font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-xs cursor-pointer animate-pulse"
                >
                  <span className="material-symbols-outlined text-[18px] material-symbols-fill">play_circle</span>
                  <span>
                    {registrations.length < t.maxPlayers
                      ? `Start Early (${registrations.length}/${t.maxPlayers})`
                      : "Start & Generate Brackets"}
                  </span>
                </button>
              )}

              {t.status === "ONGOING" && (
                <button
                  onClick={async () => {
                    if (window.confirm("Conclude this tournament and lock brackets? This will crown the champion based on completed matches.")) {
                      handleUpdateStatus("COMPLETED");
                    }
                  }}
                  className="w-full py-3 bg-green-600 text-white border-3 border-primary font-bold uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  Conclude Tournament
                </button>
              )}

              {matches.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold uppercase mb-1">
                    <span className="text-primary/60">Seeding:</span>
                    <select
                      value={seedingType}
                      onChange={(e) => setSeedingType(e.target.value as any)}
                      className="border-2 border-primary px-2 py-1 text-xs bg-white text-primary font-bold outline-none cursor-pointer"
                    >
                      <option value="ELO">ELO Rated</option>
                      <option value="RANDOM">Random Shuffle</option>
                    </select>
                  </div>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to REGENERATE brackets using ${seedingType === "ELO" ? "ELO Rated" : "Random Shuffle"} seeding? This will delete all current matches and scores, and generate a new bracket using the current list of approved players. This CANNOT be undone.`)) {
                        try {
                          const res = await fetch(`/api/tournaments/${id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ regenerateBrackets: true, seedingType: seedingType }),
                          });
                          const data = await res.json();
                          if (data.error) {
                            alert(data.error);
                          } else {
                            alert("Brackets regenerated successfully!");
                            fetchManaged(id);
                            fetchData();
                          }
                        } catch (e) {
                          alert("Failed to regenerate brackets.");
                        }
                      }
                    }}
                    className="w-full py-3 bg-white text-accent-red border-3 border-primary font-bold uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">autorenew</span>
                    Regenerate Brackets
                  </button>
                </div>
              )}

              <div className="pt-3 border-t-2 border-primary">
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-primary/60">Status Override</label>
                <select
                  value={t.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="w-full border-3 border-primary px-3 py-2 text-xs font-bold bg-white text-primary"
                >
                  {["DRAFT", "UPCOMING", "REGISTRATION_OPEN", "ONGOING", "COMPLETED", "CANCELLED"].map(status => (
                    <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t-2 border-primary">
                <button
                  onClick={async () => {
                    if (window.confirm(`Are you absolutely sure you want to delete the tournament "${t.title}"? This action CANNOT be undone and will delete all registrations, payments, and bracket matches associated with it.`)) {
                      try {
                        const res = await fetch(`/api/tournaments/${id}`, {
                          method: "DELETE",
                        });
                        const data = await res.json();
                        if (data.error) {
                          alert(data.error);
                        } else {
                          alert("Tournament deleted successfully!");
                          onBack();
                          fetchData();
                        }
                      } catch (e) {
                        alert("Failed to delete tournament.");
                      }
                    }
                  }}
                  className="w-full py-3 bg-accent-red text-white border-3 border-primary font-bold uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Delete Tournament
                </button>
              </div>
            </div>
          </div>

          {/* Participants Seed List */}
          <div className="bg-white p-5 border-4 border-primary shadow-[8px_8px_0px_0px_#1a1a1a]">
            <h3 className="font-black text-primary text-sm uppercase tracking-wider border-b-2 border-primary pb-2 mb-4">
              Registered Participants ({registrations.length})
            </h3>
            {registrations.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-primary/50">
                <span className="material-symbols-outlined text-4xl mb-2">group</span>
                <p className="text-xs font-bold uppercase">No participants registered yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scroll pr-1">
                {registrations.map((reg: any, idx: number) => (
                  <div key={reg.userId || reg.squadId || idx} className="flex items-center justify-between text-xs font-bold p-2 border-2 border-primary bg-surface-container-low">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 flex items-center justify-center bg-primary text-white text-[9px] font-black border border-primary flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="uppercase tracking-tight text-primary truncate max-w-[120px]">
                        {reg.user?.name || reg.squad?.name || "Unknown"}
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase text-primary/60">
                      {reg.user?.elo ? `ELO: ${reg.user.elo}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Match Management */}
        <div className="lg:col-span-8 space-y-lg">
          <div className="bg-white border-4 border-primary shadow-[8px_8px_0px_0px_#1a1a1a]">
            <div className="flex items-center justify-between p-5 border-b-4 border-primary bg-surface-container-low">
              <h3 className="font-black text-primary text-sm uppercase tracking-wider">Match Results</h3>
              <Link href={`/tournaments/${id}/bracket`} className="text-xs font-black uppercase underline decoration-2 underline-offset-2 hover:text-accent-blue transition-colors">
                View Bracket →
              </Link>
            </div>
            {loadingManaged ? (
              <div className="p-8 text-center text-primary font-bold uppercase text-xs italic">Loading matches…</div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-primary/50">
                <span className="material-symbols-outlined text-5xl mb-3">account_tree</span>
                <p className="text-xs font-bold uppercase">No matches generated yet. Start the tournament to generate brackets.</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-primary">
                {rounds.map((round: number) => (
                  <div key={round}>
                    <button
                      onClick={() => setActiveRoundTab(activeRoundTab === round ? null : round)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-container-low transition-colors text-left"
                    >
                      <span className="text-xs font-black uppercase tracking-wider text-primary">Round {round}</span>
                      <span className="material-symbols-outlined text-sm text-primary">{activeRoundTab === round ? "expand_less" : "expand_more"}</span>
                    </button>
                    {activeRoundTab === round && (
                      <div className="divide-y divide-primary/20 border-t-2 border-primary">
                        {matches.filter((m: any) => m.round === round).map((match: any) => (
                          <div key={match.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1 flex items-center justify-between gap-3 text-xs font-bold uppercase">
                              <span className="text-primary truncate">{match.p1?.name || match.s1?.name || "TBD"}</span>
                              <span className="text-primary/40 flex-shrink-0">vs</span>
                              <span className="text-primary truncate text-right">{match.p2?.name || match.s2?.name || "TBD"}</span>
                            </div>
                            {match.status === "COMPLETED" ? (
                              <span className="text-[10px] font-black uppercase px-2 py-1 bg-accent-blue text-white border-2 border-primary flex-shrink-0">
                                {match.p1Score ?? match.s1Score ?? 0} – {match.p2Score ?? match.s2Score ?? 0}
                              </span>
                            ) : match.status === "BYE" ? (
                              <span className="text-[10px] font-black uppercase px-2 py-1 bg-surface-container text-primary border-2 border-primary flex-shrink-0">BYE</span>
                            ) : (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="P1"
                                  value={matchScores[match.id]?.p1Score ?? ""}
                                  onChange={(e) => setMatchScores((prev: any) => ({ ...prev, [match.id]: { ...prev[match.id], p1Score: e.target.value } }))}
                                  className="w-14 border-2 border-primary px-2 py-1 text-xs font-bold text-center bg-white outline-none"
                                />
                                <span className="text-primary/40 text-xs">–</span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="P2"
                                  value={matchScores[match.id]?.p2Score ?? ""}
                                  onChange={(e) => setMatchScores((prev: any) => ({ ...prev, [match.id]: { ...prev[match.id], p2Score: e.target.value } }))}
                                  className="w-14 border-2 border-primary px-2 py-1 text-xs font-bold text-center bg-white outline-none"
                                />
                                <button
                                  onClick={() => handleSubmitMatch(match.id)}
                                  disabled={submittingMatchId === match.id}
                                  className="px-3 py-1.5 bg-accent-yellow text-primary border-2 border-primary text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {submittingMatchId === match.id ? "..." : "Set"}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}