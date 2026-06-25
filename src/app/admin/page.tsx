"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { logoutTrainer } from "@/app/actions/authActions";
import { usePopup } from "@/components/PopupProvider";
import { formatPrizeAmount } from "@/lib/currency";

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
  const { confirm } = usePopup();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analytics, setAnalytics] = useState<any>({ metrics: {}, auditLogs: [], recentTournaments: [] });
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

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

    if (!(await confirm(message))) return;

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
            <button onClick={() => setShowModal(true)}
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
              loadingManaged={loadingManaged}
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
                    className="bg-white p-5 border-4 border-primary shadow-[8px_8px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[10px_10px_0px_0px_#1a1a1a] transition-all cursor-default flex flex-col justify-between min-h-[140px] text-left">
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
                                      if (await confirm(`Delete tournament "${t.title}"? This cannot be undone and will delete all registrations, payments, and bracket matches associated with it.`)) {
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
                            <button onClick={() => setShowModal(true)}
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
                          <span className={`w-3 h-3 border-2 border-primary ${item.good ? "bg-green-500 animate-pulse" : "bg-amber-400"}`} />
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="w-full max-w-[512px] bg-white border-4 border-primary shadow-[12px_12px_0px_0px_#1a1a1a] max-h-[90vh] overflow-y-auto custom-scrollbar">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-sm bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-[512px] bg-white border-8 border-primary shadow-[12px_12px_0px_0px_#1a1a1a] max-h-[90vh] overflow-y-auto custom-scrollbar text-primary">
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
                      <label className="text-[10px] font-black line-clamp-1">
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
                    if (await confirm(message)) {
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
                    if (await confirm("Conclude this tournament and lock brackets? This will crown the champion based on completed matches.")) {
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
                      if (await confirm(`Are you sure you want to REGENERATE brackets using ${seedingType === "ELO" ? "ELO Rated" : "Random Shuffle"} seeding? This will delete all current matches and scores, and generate a new bracket using the current list of approved players. This CANNOT be undone.`)) {
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
                    if (await confirm(`Are you absolutely sure you want to delete the tournament "${t.title}"? This action CANNOT be undone and will delete all registrations, payments, and bracket matches associated with it.`)) {
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
            <h3 className="font-black text-primary text-sm uppercase tracking-wider mb-3 border-b-2 border-primary pb-2">Registered Players ({registrations.length})</h3>
            {registrations.length > 0 ? (
              <div className="divide-y-2 divide-primary max-h-60 overflow-y-auto custom-scroll pr-1">
                {registrations.map((reg: any, idx: number) => (
                  <div key={reg.id} className="flex items-center justify-between py-2 text-xs font-bold uppercase tracking-tight">
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 border-2 border-primary bg-accent-yellow text-primary flex items-center justify-center font-bold text-xs select-none">
                        {reg.user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-primary truncate max-w-[120px]">{reg.user.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-accent-blue">{reg.user.elo} ELO</span>
                      <p className="text-[9px] text-primary/40 font-medium">Seed #{idx + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold uppercase text-primary/50 py-4 text-center">No players registered yet.</p>
            )}
          </div>

        </div>

        {/* Right Column: Match and Bracket Management */}
        <div className="lg:col-span-8 bg-white border-4 border-primary p-5 md:p-6 shadow-[8px_8px_0px_0px_#1a1a1a] text-left">
          <h3 className="font-black text-primary text-xl mb-4 flex items-center gap-2 border-b-2 border-primary pb-2">
            <span className="material-symbols-outlined text-accent-blue">account_tree</span>
            Match Management & Results
          </h3>

          {matches.length === 0 ? (
            /* Pairings Preview Panel */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-sm">
              {/* Setup Configuration Column */}
              <div className="lg:col-span-5 space-y-4 border-b lg:border-b-0 lg:border-r-2 lg:border-primary pb-4 lg:pb-0 pr-0 lg:pr-4">
                <div>
                  <h4 className="font-black text-primary text-xs uppercase tracking-wider mb-2">1. Seeding Method</h4>
                  <div className="grid grid-cols-2 gap-2 select-none">
                    <button
                      type="button"
                      onClick={() => setSeedingType("ELO")}
                      className={`py-3 px-4 border-2 border-primary text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-xs cursor-pointer select-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-[2px_2px_0px_0px_#1a1a1a] ${seedingType === "ELO" ? "bg-accent-blue text-white" : "bg-white text-primary hover:bg-accent-yellow"
                        }`}
                    >
                      <span className="material-symbols-outlined text-base">military_tech</span>
                      <span>ELO Rated</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSeedingType("RANDOM");
                        handleReshuffle();
                      }}
                      className={`py-3 px-4 border-2 border-primary text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-xs cursor-pointer select-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-[2px_2px_0px_0px_#1a1a1a] ${seedingType === "RANDOM" ? "bg-accent-blue text-white" : "bg-white text-primary hover:bg-accent-yellow"
                        }`}
                    >
                      <span className="material-symbols-outlined text-base">shuffle</span>
                      <span>Random</span>
                    </button>
                  </div>
                </div>

                <div className="bg-surface-container-low border-2 border-primary p-3 space-y-3">
                  <h5 className="font-black text-primary text-xs uppercase tracking-wider border-b-2 border-primary pb-1">Start Checklist</h5>
                  {registrations.length < t.maxPlayers && registrations.length >= 2 && (
                    <p className="text-[10px] font-bold uppercase text-accent-blue bg-accent-blue/10 border border-accent-blue px-2 py-1.5">
                      Max players not required — you can start early with {registrations.length}/{t.maxPlayers} approved players.
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase py-2 px-2 bg-white border-2 border-primary shadow-[2px_2px_0px_0px_#1a1a1a]">
                      <span className="text-primary/60 flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-sm text-accent-blue">category</span>
                        Format
                      </span>
                      <span className="text-primary text-right truncate max-w-[120px]">
                        {t.type?.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold uppercase py-2 px-2 bg-white border-2 border-primary shadow-[2px_2px_0px_0px_#1a1a1a]">
                      <span className="text-primary/60 flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-sm text-accent-blue">group</span>
                        Players
                      </span>
                      <span className={`px-2 py-0.5 border-2 border-primary ${registrations.length >= 2 ? "bg-accent-yellow text-primary" : "bg-accent-red text-white"
                        }`}>
                        {registrations.length} / {t.maxPlayers}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold uppercase py-2 px-2 bg-white border-2 border-primary shadow-[2px_2px_0px_0px_#1a1a1a]">
                      <span className="text-primary/60 flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-sm text-accent-blue">check_circle</span>
                        Ready
                      </span>
                      <span className={`px-2 py-0.5 border-2 border-primary ${registrations.length >= 2 ? "bg-accent-yellow text-primary" : "bg-accent-red text-white"
                        }`}>
                        {registrations.length >= 2 ? "YES" : "NO"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerateBracket}
                  disabled={registrations.length < 2 || savingDetails}
                  className="w-full py-3 bg-accent-yellow text-primary border-3 border-primary font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px] material-symbols-fill">play_circle</span>
                  <span>Generate Bracket</span>
                </button>
              </div>

              {/* Matchups Preview Column */}
              <div className="lg:col-span-7 space-y-3 pl-0 lg:pl-4 flex flex-col h-[380px] mt-4 lg:mt-0">
                <div className="flex items-center justify-between border-b-2 border-primary pb-1">
                  <h4 className="font-black text-primary text-xs uppercase tracking-wider">2. Pairing Preview</h4>
                  {seedingType === "RANDOM" && (
                    <button
                      onClick={handleReshuffle}
                      className="text-xs font-black uppercase tracking-wider underline decoration-2 underline-offset-2 text-accent-blue hover:text-blue-700 flex items-center gap-[2px] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">autorenew</span>
                      Reshuffle
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scroll">
                  {(() => {
                    const sortedForPreview = [...registrations].sort((a, b) => (b.user?.elo ?? 0) - (a.user?.elo ?? 0));
                    const list = seedingType === "ELO" ? sortedForPreview : shuffledPlayers;
                    const numPlayers = list.length;
                    if (numPlayers < 2) return (
                      <div className="flex flex-col items-center justify-center h-full text-center text-primary/40">
                        <span className="material-symbols-outlined text-4xl mb-2">group_off</span>
                        <p className="text-xs font-bold uppercase">Need 2 players for pairings</p>
                      </div>
                    );

                    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
                    const preview: { p1: any; p2: any; isBye: boolean }[] = [];

                    if (t.type === "SINGLE_ELIMINATION" || t.type === "DOUBLE_ELIMINATION") {
                      for (let i = 0; i < nextPowerOfTwo / 2; i++) {
                        const p1Idx = i;
                        const p2Idx = nextPowerOfTwo - 1 - i;

                        const p1 = p1Idx < numPlayers ? list[p1Idx].user : null;
                        const p2 = p2Idx < numPlayers ? list[p2Idx].user : null;

                        if (p1) {
                          preview.push({
                            p1,
                            p2,
                            isBye: !p2,
                          });
                        }
                      }
                    } else {
                      // Swiss or Round Robin
                      const half = Math.ceil(numPlayers / 2);
                      for (let i = 0; i < half; i++) {
                        const p1 = list[i]?.user;
                        const p2 = list[i + half]?.user;
                        if (p1) {
                          preview.push({
                            p1,
                            p2,
                            isBye: !p2,
                          });
                        }
                      }
                    }

                    return preview.map((match, idx) => (
                      <div key={idx} className="bg-white border-2 border-primary p-3 flex flex-col gap-2 shadow-[4px_4px_0px_0px_#1a1a1a]">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider px-1">
                          <span>Match #{idx + 1}</span>
                          {match.isBye && (
                            <span className="px-1.5 py-[1px] bg-accent-blue text-white border border-primary text-[8px] font-black uppercase">BYE</span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 p-2 bg-surface-container-low border border-primary">
                          {/* Player 1 */}
                          <div className="flex items-center justify-between py-1 px-1">
                            <span className="font-bold text-primary text-xs truncate max-w-[140px] flex items-center gap-1">
                              <span className="w-2 h-2 border border-primary bg-accent-blue"></span>
                              {match.p1?.name}
                            </span>
                            <span className="text-[9px] text-primary/60 font-bold bg-white px-1.5 py-0.5 border border-primary">{match.p1?.elo} ELO</span>
                          </div>

                          {/* Divider with VS */}
                          <div className="h-px bg-primary/20 relative flex justify-center my-1">
                            <span className="absolute -top-1.5 px-1 text-[8px] font-black text-primary bg-white border border-primary leading-none uppercase scale-90">VS</span>
                          </div>

                          {/* Player 2 / BYE */}
                          <div className="flex items-center justify-between py-1 px-1">
                            <span className={`text-xs flex items-center gap-1 ${match.isBye ? "text-primary/40 italic font-medium" : "font-bold text-primary truncate max-w-[140px]"}`}>
                              <span className={`w-2 h-2 border border-primary ${match.isBye ? "bg-primary/20" : "bg-accent-blue"}`}></span>
                              {match.isBye ? "BYE Promotion" : match.p2?.name}
                            </span>
                            {!match.isBye && (
                              <span className="text-[9px] text-primary/60 font-bold bg-white px-1.5 py-0.5 border border-primary">{match.p2?.elo} ELO</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          ) : (
            /* Match Listing & Result Inputs */
            <div className="space-y-4">

              {/* Round Completion Progress Tracker */}
              {(() => {
                const currentRoundMatches = matches.filter((m: any) => m.round === activeRoundTab);
                const totalRoundMatches = currentRoundMatches.length;
                const completedRoundMatches = currentRoundMatches.filter((m: any) => m.status === "COMPLETED" || m.status === "BYE").length;
                const completionPercentage = totalRoundMatches > 0 ? Math.round((completedRoundMatches / totalRoundMatches) * 100) : 0;
                return (
                  <div className="bg-surface-container-low border-2 border-primary p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-1">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-1 text-[9px] font-black text-primary/60 uppercase tracking-widest">
                        <span className="material-symbols-outlined text-[14px] text-accent-blue">query_stats</span>
                        <span>Round Progress</span>
                      </div>
                      <h4 className="font-bold text-primary text-xs uppercase tracking-tight">
                        {getRoundName(activeRoundTab ?? 1, t.type)} Matches: {completedRoundMatches} of {totalRoundMatches} completed
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-60">
                      <div className="flex-1 h-3 border-2 border-primary bg-white overflow-hidden p-[1px]">
                        <div
                          className="h-full bg-accent-blue transition-all duration-500"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-accent-blue w-10 text-right">{completionPercentage}%</span>
                    </div>
                  </div>
                );
              })()}

              {/* Round Tabs */}
              <div className="flex gap-1 overflow-x-auto pb-2 border-b-2 border-primary">
                {rounds.map(roundNum => {
                  const isActive = activeRoundTab === roundNum;
                  return (
                    <button
                      key={roundNum}
                      onClick={() => setActiveRoundTab(roundNum)}
                      className={`px-4 py-2 border-2 border-primary text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${isActive
                        ? "bg-primary text-white shadow-none"
                        : "bg-white text-primary hover:bg-accent-yellow active:translate-x-[2px] active:translate-y-[2px]"
                        }`}
                    >
                      {getRoundName(roundNum, t.type)}
                    </button>
                  );
                })}
              </div>

              {/* Matches for the Selected Round */}
              <div className="space-y-4 pt-1 max-h-[500px] overflow-y-auto pr-1 custom-scroll">
                {matches
                  .filter((m: any) => m.round === activeRoundTab)
                  .map((match: any) => {
                    const isTeam = match.s1Id !== null && match.s1Id !== undefined;
                    const hasP1 = isTeam ? !!match.s1 : !!match.p1;
                    const hasP2 = isTeam ? !!match.s2 : !!match.p2;
                    const bothPlayersSet = hasP1 && hasP2;
                    const scores = matchScores[match.id];

                    const comp1Name = isTeam ? (match.s1?.name || "Squad 1") : (match.p1?.name || "Player 1");
                    const comp2Name = isTeam ? (match.s2?.name || "Squad 2") : (match.p2?.name || "Player 2");

                    const comp1Logo = isTeam ? match.s1?.logo : match.p1?.image;
                    const comp2Logo = isTeam ? match.s2?.logo : match.p2?.image;

                    const competitor1Id = isTeam ? match.s1Id : match.p1Id;
                    const competitor2Id = isTeam ? match.s2Id : match.p2Id;

                    const isWinner1 = isTeam
                      ? (match.winnerSquadId === match.s1Id)
                      : (match.winnerId === match.p1Id);
                    const isWinner2 = isTeam
                      ? (match.winnerSquadId === match.s2Id)
                      : (match.winnerId === match.p2Id);

                    const finalWinnerName = isTeam ? (match.winnerSquad?.name) : (match.winner?.name);

                    return (
                      <div
                        key={match.id}
                        className={`border-3 border-primary p-4 shadow-[4px_4px_0px_0px_#1a1a1a] transition-all text-left ${match.status === "COMPLETED" || match.status === "BYE" ? "bg-surface-container-low opacity-95" : "bg-white"
                          }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                          {/* Match Info & Status */}
                          <div className="flex-1 space-y-3">

                            {/* Player 1 Details */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 border-2 border-primary bg-accent-yellow text-primary flex items-center justify-center font-bold text-xs select-none overflow-hidden relative">
                                  {comp1Logo ? (
                                    <img src={comp1Logo} alt={comp1Name} className="w-full h-full object-cover" />
                                  ) : (
                                    comp1Name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <span className={`text-sm uppercase tracking-tight ${isWinner1 && match.status === "COMPLETED" ? "font-black text-accent-blue" : "font-bold text-primary"}`}>
                                    {comp1Name}
                                  </span>
                                  {!isTeam && hasP1 && <span className="text-[9px] text-primary/60 font-bold ml-2">({match.p1.elo} ELO)</span>}
                                </div>
                              </div>
                              {match.status === "COMPLETED" && (
                                <span className="font-black text-sm text-primary bg-white px-2 py-0.5 border border-primary">{match.p1Score}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-primary/20" />
                              <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">VS</span>
                              <div className="flex-1 h-px bg-primary/20" />
                            </div>

                            {/* Player 2 Details */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 border-2 border-primary bg-accent-yellow text-primary flex items-center justify-center font-bold text-xs select-none overflow-hidden relative">
                                  {comp2Logo ? (
                                    <img src={comp2Logo} alt={comp2Name} className="w-full h-full object-cover" />
                                  ) : (
                                    comp2Name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <span className={`text-sm uppercase tracking-tight ${isWinner2 && match.status === "COMPLETED" ? "font-black text-accent-blue" : "font-bold text-primary"}`}>
                                    {comp2Name}
                                  </span>
                                  {!isTeam && hasP2 && <span className="text-[9px] text-primary/60 font-bold ml-2">({match.p2.elo} ELO)</span>}
                                </div>
                              </div>
                              {match.status === "COMPLETED" && (
                                <span className="font-black text-sm text-primary bg-white px-2 py-0.5 border border-primary">{match.p2Score}</span>
                              )}
                            </div>

                          </div>

                          {/* Action Forms / Complete state */}
                          <div className="md:w-64 border-t md:border-t-0 md:border-l-2 md:border-primary pt-4 md:pt-0 md:pl-4 flex flex-col justify-center">
                            {match.status === "COMPLETED" && (
                              <div className="text-center py-2.5 bg-white border-2 border-primary font-bold uppercase text-[10px] tracking-wider">
                                <span className="material-symbols-outlined text-green-600 text-sm align-middle mr-1 material-symbols-fill">check_circle</span>
                                <span className="text-green-800">Completed</span>
                                <p className="text-[9px] text-accent-blue font-black mt-1">Winner: {finalWinnerName || "Unknown"}</p>
                              </div>
                            )}

                            {match.status === "BYE" && (
                              <div className="text-center py-2.5 bg-white border-2 border-primary font-bold uppercase text-[10px] tracking-wider">
                                <span className="text-accent-blue">Bye Promotion</span>
                                <p className="text-[9px] text-primary/50 font-medium mt-1">Advanced automatically</p>
                              </div>
                            )}

                            {match.status === "PENDING" && !bothPlayersSet && (
                              <div className="text-center py-4 bg-surface-container-low border-2 border-dashed border-primary/40 font-bold uppercase tracking-wider text-[10px]">
                                <span className="material-symbols-outlined text-primary/40 text-lg block mb-1">hourglass_empty</span>
                                <span>Waiting for {isTeam ? "Squads" : "Players"}</span>
                              </div>
                            )}

                            {match.status === "PENDING" && bothPlayersSet && scores && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[8px] font-black text-primary/60 uppercase mb-0.5">{isTeam ? "S1 Score" : "P1 Score"}</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="3"
                                      value={scores.p1Score}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setMatchScores((prev: any) => {
                                          const next = { ...prev };
                                          next[match.id] = { ...next[match.id], p1Score: val };
                                          const p1Int = parseInt(val) || 0;
                                          const p2Int = parseInt(next[match.id].p2Score) || 0;
                                          if (p1Int > p2Int) next[match.id].winnerId = competitor1Id;
                                          else if (p2Int > p1Int) next[match.id].winnerId = competitor2Id;
                                          return next;
                                        });
                                      }}
                                      className="w-full border-2 border-primary px-2 py-1 text-xs font-bold text-center bg-white text-primary"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] font-black text-primary/60 uppercase mb-0.5">{isTeam ? "S2 Score" : "P2 Score"}</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="3"
                                      value={scores.p2Score}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setMatchScores((prev: any) => {
                                          const next = { ...prev };
                                          next[match.id] = { ...next[match.id], p2Score: val };
                                          const p1Int = parseInt(next[match.id].p1Score) || 0;
                                          const p2Int = parseInt(val) || 0;
                                          if (p1Int > p2Int) next[match.id].winnerId = competitor1Id;
                                          else if (p2Int > p1Int) next[match.id].winnerId = competitor2Id;
                                          return next;
                                        });
                                      }}
                                      className="w-full border-2 border-primary px-2 py-1 text-xs font-bold text-center bg-white text-primary"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[8px] font-black text-primary/60 uppercase mb-0.5">Winner</label>
                                  <select
                                    value={scores.winnerId}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setMatchScores((prev: any) => {
                                        const next = { ...prev };
                                        next[match.id] = { ...next[match.id], winnerId: val };
                                        return next;
                                      });
                                    }}
                                    className="w-full border-2 border-primary px-2 py-1 text-xs font-bold bg-white text-primary uppercase"
                                  >
                                    <option value={competitor1Id}>{comp1Name}</option>
                                    <option value={competitor2Id}>{comp2Name}</option>
                                  </select>
                                </div>

                                <button
                                  onClick={() => handleSubmitMatch(match.id)}
                                  disabled={submittingMatchId === match.id}
                                  className="w-full py-2 bg-accent-blue text-white border-2 border-primary font-black uppercase text-[10px] tracking-wider shadow-[2px_2px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  {submittingMatchId === match.id ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      Submitting...
                                    </>
                                  ) : (
                                    <>
                                      <span className="material-symbols-outlined text-[14px]">done</span>
                                      Submit Result
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                          </div>

                        </div>
                      </div>
                    );
                  })}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Edit Tournament Modal */}
      <AnimatePresence>
        {editMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-white border-4 border-primary w-full max-w-[512px] p-6 shadow-[12px_12px_0px_0px_#1a1a1a] relative max-h-[90vh] overflow-y-auto custom-scrollbar text-left">

              <div className="flex items-center justify-between mb-4 border-b-4 border-primary pb-3 bg-accent-yellow p-3 -mx-6 -mt-6">
                <h3 className="font-black text-primary text-xl uppercase tracking-tight flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary">edit</span>
                  Edit Tournament
                </h3>
                <button onClick={() => setEditMode(false)} className="text-primary hover:text-primary/70 cursor-pointer">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveDetails} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">Tournament Title</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full border-3 border-primary px-3 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full border-3 border-primary px-3 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">Rules & Regulations</label>
                  <textarea
                    rows={3}
                    value={editForm.rules}
                    onChange={(e) => setEditForm({ ...editForm, rules: e.target.value })}
                    className="w-full border-3 border-primary px-3 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 select-none">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">Custom Badge Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Lumiose Cup Badge"
                      value={editForm.badgeName}
                      onChange={(e) => setEditForm({ ...editForm, badgeName: e.target.value })}
                      className="w-full border-3 border-primary px-3 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">Badge Image</label>
                    {editForm.badgeIcon ? (
                      <div className="flex items-center gap-2 border-3 border-primary p-2 bg-surface-container-low h-[38px]">
                        <div className="w-6 h-6 border-2 border-primary overflow-hidden relative flex-shrink-0">
                          <img src={editForm.badgeIcon} alt="Badge Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-primary/60 font-black uppercase">Uploaded</span>
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, badgeIcon: "" })}
                            className="bg-accent-red text-white border border-primary px-1.5 py-0.5 text-[8px] font-black hover:bg-red-700 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-3 border-dashed border-primary/50 hover:border-primary px-2 py-1 text-center bg-surface-container-low cursor-pointer flex flex-col items-center justify-center h-[38px] relative transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditBadgeUpload}
                          disabled={uploadingEditBadge}
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <span className="text-[10px] font-black uppercase text-primary">
                          {uploadingEditBadge ? "Uploading..." : "Click to Upload"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 select-none">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">Currency</label>
                    <select
                      value={editForm.currency}
                      onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                      className="w-full border-3 border-primary px-3 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">Prize Distribution</label>
                    <select
                      value={editForm.prizeDistribution}
                      onChange={(e) => setEditForm({ ...editForm, prizeDistribution: e.target.value })}
                      className="w-full border-3 border-primary px-3 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10"
                    >
                      <option value="TOP_1">Top 1 (100%)</option>
                      <option value="TOP_3">Top 3 (60% / 30% / 10%)</option>
                      <option value="TOP_4">Top 4 (50% / 25% / 12.5% x2)</option>
                      <option value="TOP_8">Top 8 (50% / 20% / 10% x2 / 2.5% x4)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">Format</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="w-full border-3 border-primary px-3 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10"
                    >
                      {["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "ROUND_ROBIN", "SWISS"].map(v => (
                        <option key={v} value={v}>{v.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">Max Capacity</label>
                    <input
                      type="number"
                      min="2"
                      value={editForm.maxPlayers}
                      onChange={(e) => setEditForm({ ...editForm, maxPlayers: e.target.value })}
                      className="w-full border-3 border-primary px-3 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">
                      Entry Fee ({editForm.currency === "INR" ? "₹" : "$"})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.entryFee}
                      onChange={(e) => setEditForm({ ...editForm, entryFee: e.target.value })}
                      className="w-full border-3 border-primary px-3 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">
                      Prize Pool ({editForm.currency === "INR" ? "₹" : "$"})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.prizePool}
                      onChange={(e) => setEditForm({ ...editForm, prizePool: e.target.value })}
                      className="w-full border-3 border-primary px-3 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">Game</label>
                    <select
                      value={editForm.game}
                      onChange={(e) => setEditForm({ ...editForm, game: e.target.value })}
                      className="w-full border-3 border-primary px-3 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10"
                    >
                      <option value="POKEMON_VGC">Pokémon VGC &amp; TCG</option>
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
                    <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">Tournament Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["SOLO", "SQUAD"] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, mode: m })}
                          className={`py-2.5 border-2 border-primary text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer shadow-[2px_2px_0px_0px_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                            editForm.mode === m ? "bg-primary text-white" : "bg-white text-primary hover:bg-accent-yellow"
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">{m === "SOLO" ? "person" : "groups"}</span>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Squad Config — shown only in SQUAD mode */}
                  {editForm.mode === "SQUAD" && (
                    <>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">Min Squad Size</label>
                        <input type="number" min="2" max="10" value={editForm.minSquadMembers}
                          onChange={e => setEditForm({ ...editForm, minSquadMembers: e.target.value })}
                          className="w-full border-3 border-primary px-3 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10" />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-primary mb-1.5">Max Squad Size</label>
                        <input type="number" min="2" max="10" value={editForm.maxSquadMembers}
                          onChange={e => setEditForm({ ...editForm, maxSquadMembers: e.target.value })}
                          className="w-full border-3 border-primary px-3 py-2 text-sm font-bold bg-white text-primary outline-none focus:bg-accent-yellow/10" />
                      </div>
                    </>
                  )}
                  <div className="col-span-2 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-primary">Reg Close *</label>
                      <input type="datetime-local" required value={editForm.registrationDeadline}
                        onChange={e => setEditForm({ ...editForm, registrationDeadline: e.target.value })}
                        className="w-full border-3 border-primary p-2 text-xs font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-primary">Start Date *</label>
                      <input type="datetime-local" required value={editForm.startDate}
                        onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                        className="w-full border-3 border-primary p-2 text-xs font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider mb-1 text-primary">End Date *</label>
                      <input type="datetime-local" required value={editForm.endDate}
                        onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
                        className="w-full border-3 border-primary p-2 text-xs font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5 text-primary">Watch Live URL (Stream Link)</label>
                    <input type="url" placeholder="e.g. https://twitch.tv/..." value={editForm.watchLiveUrl}
                      onChange={e => setEditForm({ ...editForm, watchLiveUrl: e.target.value })}
                      className="w-full border-3 border-primary px-4 py-3 text-sm font-bold bg-white focus:bg-accent-yellow/10 outline-none text-primary placeholder:text-primary/40" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-3 border-3 border-primary bg-white text-primary font-bold uppercase text-xs tracking-wider transition-all hover:bg-surface-container-high active:translate-x-[2px] active:translate-y-[2px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDetails}
                    className="flex-1 py-3 border-3 border-primary bg-accent-blue text-white font-bold uppercase text-xs tracking-wider transition-all hover:bg-blue-700 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 shadow-[4px_4px_0px_0px_#1a1a1a] active:shadow-none"
                  >
                    {savingDetails ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent({ nav, session, onLogout, loggingOut, onClose }: {
  nav: typeof NAV; session: any; onLogout: () => void; loggingOut: boolean; onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Logo */}
      <div className="p-5 border-b-4 border-primary bg-accent-yellow">
        <Link href="/" className="group flex items-center gap-2" onClick={onClose}>
          <img src="/logo.png" alt="ChampsArena Logo" className="w-8 h-8 object-contain flex-shrink-0" />
          <div className="text-left">
            <p className="font-bold text-primary text-md leading-tight uppercase group-hover:opacity-85 transition-opacity">ChampsArena</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-primary/60 mt-0.5">Admin Console</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-3">
        {nav.map(item => {
          const isActive = item.id === "dashboard";
          return (
            <Link key={item.id} href={item.href} onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 border-3 border-primary font-bold text-xs uppercase tracking-wider transition-all select-none ${isActive
                ? "bg-primary text-white"
                : "bg-white text-primary hover:bg-accent-yellow active:translate-x-[2px] active:translate-y-[2px]"
                }`}>
              <span className={`material-symbols-outlined text-base ${isActive ? "material-symbols-fill" : ""}`}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t-4 border-primary bg-surface-container-low">
        <div className="flex items-center gap-3 mb-4 text-left">
          <div className="w-10 h-10 border-3 border-primary bg-accent-blue text-white flex items-center justify-center font-bold text-sm shrink-0">
            {session?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-tight truncate text-primary">{session?.name || "Admin"}</p>
            <p className="text-[10px] font-bold text-accent-blue uppercase truncate">{(session?.role === "SUPER_ADMIN" ? "ADMIN" : session?.role) || "ADMIN"}</p>
          </div>
        </div>
        <button onClick={onLogout} disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-3 border-primary bg-accent-red text-white hover:bg-red-700 font-bold uppercase text-xs tracking-wider transition-all active:translate-x-[2px] active:translate-y-[2px] cursor-pointer disabled:opacity-50">
          <span className="material-symbols-outlined text-sm">logout</span>
          {loggingOut ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
