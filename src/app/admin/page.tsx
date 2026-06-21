"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { logoutTrainer } from "@/app/actions/authActions";

type NavItem = { id: string; label: string; icon: string; href: string };

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/admin" },
  { id: "tournaments", label: "Tournaments", icon: "emoji_events", href: "/tournaments" },
  { id: "users", label: "Users / Rankings", icon: "group", href: "/rankings" },
  { id: "profile", label: "My Profile", icon: "person", href: "/profile" },
  { id: "home", label: "Public Site", icon: "home", href: "/" },
];

interface Analytics {
  metrics: {
    totalUsers: number;
    totalTournaments: number;
    activeTournaments: number;
    revenue: number;
    pendingRegistrations: number;
  };
  auditLogs: any[];
  recentPayments: any[];
  recentTournaments: any[];
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics>({
    metrics: { totalUsers: 0, totalTournaments: 0, activeTournaments: 0, revenue: 0, pendingRegistrations: 0 },
    auditLogs: [],
    recentPayments: [],
    recentTournaments: [],
  });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [session, setSession] = useState<{ name?: string; email?: string; role?: string } | null>(null);

  // Tournament creation form
  const [form, setForm] = useState({
    title: "",
    description: "",
    rules: "Standard VGC 2024 Regulation G rules apply.",
    entryFee: "0",
    prizePool: "5000",
    maxPlayers: "128",
    type: "SINGLE_ELIMINATION",
    status: "UPCOMING",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/analytics").then(r => r.json()).catch(() => null),
      fetch("/api/auth/session").then(r => r.json()).catch(() => null),
    ]).then(([analyticsData, sessionData]) => {
      if (analyticsData?.metrics) setAnalytics(analyticsData);
      if (sessionData?.user) setSession(sessionData.user);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logoutTrainer(); }
    catch { setLoggingOut(false); }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    const startDate = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const deadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          entryFee: parseFloat(form.entryFee),
          prizePool: parseFloat(form.prizePool),
          maxPlayers: parseInt(form.maxPlayers),
          registrationDeadline: deadline,
          startDate,
          endDate,
        }),
      });
      const data = await res.json();
      if (data.error) { setCreateError(data.error); }
      else { setCreateModal(false); setForm({ title: "", description: "", rules: "Standard VGC 2024 Regulation G rules apply.", entryFee: "0", prizePool: "5000", maxPlayers: "128", type: "SINGLE_ELIMINATION", status: "UPCOMING" }); fetchAnalytics(); }
    } catch (err: any) { setCreateError("Failed: " + err.message); }
    finally { setCreating(false); }
  };

  const STATS = [
    { label: "Registered Trainers", value: analytics.metrics.totalUsers.toLocaleString(), icon: "person", color: "#3f50ce" },
    { label: "Total Tournaments", value: analytics.metrics.totalTournaments.toLocaleString(), icon: "emoji_events", color: "#5869e7" },
    { label: "Active Tournaments", value: analytics.metrics.activeTournaments.toLocaleString(), icon: "stadium", color: "#00b894" },
    { label: "Pending Registrations", value: analytics.metrics.pendingRegistrations.toLocaleString(), icon: "assignment_late", color: analytics.metrics.pendingRegistrations > 0 ? "#e17055" : "#00b894" },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: "#0f0f1a", fontFamily: "var(--font-lexend), sans-serif" }}>

      {/* ── Sidebar ── */}
      <>
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-64 fixed h-full z-50"
          style={{ background: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
          <SidebarContent nav={NAV} session={session} onLogout={handleLogout} loggingOut={loggingOut} activeId="dashboard" />
        </aside>

        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="md:hidden fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.7)" }} />
              <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="md:hidden fixed top-0 bottom-0 left-0 w-64 z-50 flex flex-col"
                style={{ background: "#151525", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
                <SidebarContent nav={NAV} session={session} onLogout={handleLogout} loggingOut={loggingOut} activeId="dashboard"
                  onClose={() => setSidebarOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>

      {/* ── Main Content ── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-6 h-16"
          style={{ background: "rgba(15,15,26,0.95)", borderBottom: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg"
              style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">Admin Console</h1>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>System Overview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchAnalytics} className="p-2 rounded-lg transition-all hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.5)" }} title="Refresh data">
              <span className={`material-symbols-outlined ${loading ? "animate-spin" : ""}`}>refresh</span>
            </button>
            <button onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #3f50ce, #5869e7)", boxShadow: "0 4px 15px rgba(63,80,206,0.35)" }}>
              <span className="material-symbols-outlined text-base">add</span>
              <span className="hidden sm:inline">New Tournament</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">

          {/* Welcome Banner */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 flex items-center justify-between overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, rgba(63,80,206,0.3) 0%, rgba(88,105,231,0.15) 100%)", border: "1px solid rgba(63,80,206,0.3)" }}>
            <div className="absolute right-0 top-0 bottom-0 w-48 opacity-10 flex items-center justify-center" style={{ fontSize: 120 }}>
              <span className="material-symbols-outlined">catching_pokemon</span>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold mb-1" style={{ color: "rgba(188,194,255,0.7)" }}>Welcome back,</p>
              <h2 className="text-2xl font-bold text-white">{session?.name || "Chief Arbiter"}</h2>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(63,80,206,0.3)", color: "#bcc2ff" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>shield</span>
                  {session?.role || "SUPER_ADMIN"}
                </span>
                <span className="ml-2">{session?.email}</span>
              </p>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02]"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${stat.color}22`, color: stat.color }}>
                    <span className="material-symbols-outlined text-lg">{stat.icon}</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{loading ? "—" : stat.value}</div>
              </motion.div>
            ))}
          </section>

          {/* Recent Tournaments */}
          <section className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-white">Recent Tournaments</h2>
              <Link href="/tournaments" className="text-sm font-semibold" style={{ color: "#bcc2ff" }}>View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Tournament", "Type", "Status", "Players", "Prize Pool"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading...</td></tr>
                  ) : analytics.recentTournaments?.length > 0 ? (
                    analytics.recentTournaments.map((t: any) => (
                      <tr key={t.id} className="transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td className="px-5 py-4">
                          <Link href={`/tournaments/${t.id}`} className="font-semibold text-white hover:text-blue-300 transition-colors">{t.title}</Link>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold px-2 py-1 rounded-full"
                            style={{ background: "rgba(63,80,206,0.2)", color: "#bcc2ff" }}>
                            {t.type?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {t._count?.registrations ?? 0} / {t.maxPlayers}
                        </td>
                        <td className="px-5 py-4 text-sm font-bold" style={{ color: "#bcc2ff" }}>
                          ${t.prizePool?.toLocaleString() ?? "0"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-16">
                        <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: "rgba(255,255,255,0.15)" }}>emoji_events</span>
                        <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No tournaments yet</p>
                        <button onClick={() => setCreateModal(true)}
                          className="mt-3 px-4 py-2 rounded-xl text-sm font-bold text-white"
                          style={{ background: "linear-gradient(135deg, #3f50ce, #5869e7)" }}>
                          Create first tournament
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* System Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Audit Logs */}
            <section className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 className="font-bold text-white mb-4">Audit Logs</h2>
              {analytics.auditLogs?.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {analytics.auditLogs.map((log: any) => (
                    <div key={log.id} className="text-xs p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}>
                      <span className="font-bold" style={{ color: "#bcc2ff" }}>{log.action}: </span>
                      {log.details?.slice(0, 80)}…
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No recent audit logs.</p>
              )}
            </section>

            {/* System Health */}
            <section className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 className="font-bold text-white mb-4">System Health</h2>
              <div className="space-y-4">
                {[
                  { label: "Database", status: "Nominal", color: "#00b894" },
                  { label: "Auth Service", status: "Active", color: "#00b894" },
                  { label: "Payment Gateway", status: "Standby", color: "#fdcb6e" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{item.label}</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: item.color }}>
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: item.color }} />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ── Create Tournament Modal ── */}
      <AnimatePresence>
        {createModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.8)" }}
            onClick={e => { if (e.target === e.currentTarget) setCreateModal(false); }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
              style={{ background: "#151525", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create Tournament</h2>
                <button onClick={() => setCreateModal(false)} className="material-symbols-outlined" style={{ color: "rgba(255,255,255,0.5)" }}>close</button>
              </div>

              {createError && (
                <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(186,26,26,0.2)", color: "#ffa0a0", border: "1px solid rgba(186,26,26,0.4)" }}>
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateTournament} className="space-y-4">
                {[
                  { label: "Tournament Title", key: "title", type: "text", placeholder: "Lumiose City Masters 2024", required: true },
                  { label: "Description", key: "description", type: "textarea", placeholder: "Describe this tournament...", required: true },
                  { label: "Rules", key: "rules", type: "textarea", placeholder: "Tournament rules...", required: false },
                ].map(({ label, key, type, placeholder, required }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</label>
                    {type === "textarea" ? (
                      <textarea required={required} rows={3} placeholder={placeholder}
                        value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
                    ) : (
                      <input type={type} required={required} placeholder={placeholder}
                        value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
                    )}
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Entry Fee ($)", key: "entryFee", type: "number" },
                    { label: "Prize Pool ($)", key: "prizePool", type: "number" },
                    { label: "Max Players", key: "maxPlayers", type: "number" },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</label>
                      <input type={type} min="0"
                        value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Format</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}>
                      {["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "ROUND_ROBIN", "SWISS"].map(v => (
                        <option key={v} value={v} style={{ background: "#151525" }}>{v.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setCreateModal(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)" }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={creating}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #3f50ce, #5869e7)" }}>
                    {creating ? "Creating..." : "Create Tournament"}
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

/* ── Sidebar Content Component ── */
function SidebarContent({ nav, session, onLogout, loggingOut, activeId, onClose }: {
  nav: NavItem[]; session: any; onLogout: () => void; loggingOut: boolean; activeId: string; onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {onClose && (
          <div className="flex items-center justify-between mb-4">
            <span />
            <button onClick={onClose} className="material-symbols-outlined" style={{ color: "rgba(255,255,255,0.5)" }}>close</button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3f50ce, #5869e7)" }}>
            <span className="material-symbols-outlined material-symbols-fill text-white text-base">catching_pokemon</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Pokémon Champions</p>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(63,80,206,0.9)" }}>Admin Console</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(item => {
          const isActive = item.id === activeId;
          return (
            <Link key={item.id} href={item.href} onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm"
              style={{
                background: isActive ? "rgba(63,80,206,0.2)" : "transparent",
                color: isActive ? "#bcc2ff" : "rgba(255,255,255,0.5)",
                borderLeft: isActive ? "2px solid #5869e7" : "2px solid transparent",
              }}>
              <span className={`material-symbols-outlined text-lg ${isActive ? "material-symbols-fill" : ""}`}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile + Logout */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #3f50ce, #5869e7)", color: "#fff" }}>
            {session?.name?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{session?.name || "Admin"}</p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{session?.email || ""}</p>
          </div>
        </div>
        <button onClick={onLogout} disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "rgba(186,26,26,0.15)", color: "#ff8080", border: "1px solid rgba(186,26,26,0.3)" }}>
          <span className="material-symbols-outlined text-base">logout</span>
          {loggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    UPCOMING: { bg: "rgba(253,203,110,0.2)", color: "#fdcb6e" },
    REGISTRATION_OPEN: { bg: "rgba(0,184,148,0.2)", color: "#00b894" },
    ONGOING: { bg: "rgba(63,80,206,0.2)", color: "#bcc2ff" },
    COMPLETED: { bg: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" },
    DRAFT: { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" },
    CANCELLED: { bg: "rgba(186,26,26,0.2)", color: "#ff8080" },
  };
  const style = map[status] || map.DRAFT;
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ background: style.bg, color: style.color }}>
      {status.replace("_", " ")}
    </span>
  );
}

export const dynamic = "force-dynamic";
