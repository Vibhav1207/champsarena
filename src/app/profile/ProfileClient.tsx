"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import Modal from "@/components/Modal";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  username?: string | null;
  bio?: string | null;
  country?: string | null;
  discordUsername?: string | null;
  socialLinks?: string | null;
  createdAt: string;
  teams?: any[];
  squad?: any;
  registrations?: any[];
  wonMatches?: any[];
  wonTournaments?: any[];
}

interface Match {
  id: string;
  status: string;
  p1Score: number;
  p2Score: number;
  round: number;
  tournament: { title: string; startDate: string };
  p1: { name: string };
  p2: { name: string };
  winner: { name: string };
}

export default function ProfileClient() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "matches" | "teams" | "settings">("overview");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
    country: "",
    discordUsername: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setEditForm({
          username: data.user.username || "",
          bio: data.user.bio || "",
          country: data.user.country || "",
          discordUsername: data.user.discordUsername || "",
        });
      }
      if (data.matches) {
        setMatches(data.matches);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.error) {
        setSaveError(data.error);
      } else {
        setSaveSuccess(true);
        setEditing(false);
        await fetchProfile();
      }
    } catch (err: any) {
      setSaveError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditForm({
      username: user?.username || "",
      bio: user?.bio || "",
      country: user?.country || "",
      discordUsername: user?.discordUsername || "",
    });
    setSaveError(null);
    setSaveSuccess(false);
  };

  const parseSocialLinks = (links: string | null): Record<string, string> => {
    if (!links) return {};
    try {
      return JSON.parse(links);
    } catch {
      return {};
    }
  };

  const socialLinks = parseSocialLinks(user?.socialLinks || null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary font-black uppercase tracking-widest">
        Loading Trainer Profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary font-black uppercase tracking-widest">
        <div className="text-center p-lg border-4 border-primary bg-white">
          <span className="material-symbols-outlined text-5xl text-primary mb-sm block">person_off</span>
          <h2 className="text-2xl font-black uppercase mb-xs">Profile Not Found</h2>
          <p className="font-bold text-primary uppercase text-sm">Please log in to view your trainer profile.</p>
          <Link href="/login" className="inline-flex items-center gap-xs px-lg py-sm border-4 border-primary bg-primary text-white font-bold uppercase text-sm mt-md">
            <span className="material-symbols-outlined">login</span> Sign In
          </Link>
        </div>
      </div>
    );
  }

  const avatarUrl = user.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuDoz5Y0R4TFuXNrYLE-POKr2jfVBcGfiv3xrqewXcn_dT6Pi3y98nN89Lhyl3W232l87CwoQ7BZfA8qbk6kPJHxkY4-u9zYPdd0dciP1rQJguaadH5ak_jVWTlDdyyYkf-xTDQ9pi-g9EvcpjFdFOClplU8RKE9t6xRR0E8brOOOKRBiQSzT85kRb5GSGQOF6ERlnWa8-TdzOhAs0m8PDFak7j8ar1G7gZtM9riEUcB6EfuUwvRoSeIULm7Kmic2qMqoBuCYiiXBW4";
  const initial = user.name?.charAt(0).toUpperCase() || "?";
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background py-lg px-md">
        <div className="max-w-4xl mx-auto space-y-lg">
          {/* Profile Header */}
          <div className="bg-white border-4 border-primary neo-brutalist-shadow p-lg relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-yellow/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-blue/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-xl">
              {/* Avatar */}
              <div className="relative flex-shrink-0 z-10">
                <div className="w-28 h-28 md:w-36 md:h-36 border-4 border-primary bg-primary flex items-center justify-center overflow-hidden relative">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <span className="text-5xl md:text-7xl font-black text-white uppercase">{initial}</span>
                  )}
                  {user.username && (
                    <div className="absolute bottom-0 right-0 bg-accent-yellow text-primary px-2 py-0.5 border-2 border-primary font-black text-[10px] uppercase">
                      @{user.username}
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left z-10 space-y-2">
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-primary">
                  {user.name}
                </h1>
                <p className="text-sm font-bold text-primary/60 uppercase tracking-wider">
                  Trainer since {memberSince}
                </p>

                {user.bio && (
                  <p className="text-base font-bold text-primary/80 italic max-w-md mx-auto md:mx-0">
                    "{user.bio}"
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-md mt-sm">
                  {user.country && (
                    <span className="flex items-center gap-xs px-sm py-xs bg-surface-container-high border-2 border-primary font-bold text-xs uppercase">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {user.country}
                    </span>
                  )}
                  {user.discordUsername && (
                    <span className="flex items-center gap-xs px-sm py-xs bg-accent-blue/10 border-2 border-accent-blue font-bold text-xs uppercase text-accent-blue">
                      <span className="material-symbols-outlined text-[14px]">chat</span>
                      {user.discordUsername}
                    </span>
                  )}
                  {Object.keys(socialLinks).length > 0 && (
                    <div className="flex items-center gap-xs">
                      {Object.entries(socialLinks).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-xs px-sm py-xs bg-primary/10 border-2 border-primary hover:bg-primary hover:text-white transition-colors font-bold text-xs uppercase"
                        >
                          <span className="material-symbols-outlined text-[14px]">link</span>
                          {platform}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Button */}
              <div className="flex-shrink-0 z-10">
                {editing ? (
                  <div className="flex gap-sm">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-sm py-xs border-3 border-primary bg-accent-yellow text-primary font-black uppercase text-sm cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-sm py-xs border-3 border-primary bg-white text-primary font-black uppercase text-sm cursor-pointer hover:bg-accent-yellow transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-lg py-sm border-3 border-primary bg-white text-primary font-black uppercase text-sm hover:bg-accent-yellow transition-all cursor-pointer"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Edit Form */}
            {editing && (
              <div className="mt-lg pt-lg border-t-4 border-primary bg-surface-container-high relative z-10">
                <form onSubmit={handleSave} className="space-y-sm">
                  {saveError && (
                    <div className="p-sm border-2 border-accent-red bg-red-50 text-accent-red font-black text-xs uppercase">
                      {saveError}
                    </div>
                  )}
                  {saveSuccess && (
                    <div className="p-sm border-2 border-green-700 bg-green-50 text-green-700 font-black text-xs uppercase">
                      Profile saved successfully!
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                    <div>
                      <label className="block text-xs font-black uppercase text-primary mb-1">Username</label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        placeholder="Enter username (letters, numbers, underscore)"
                        className="w-full border-2 border-primary bg-white px-sm py-xs font-bold text-sm outline-none focus:bg-accent-yellow"
                        maxLength={20}
                      />
                      <p className="text-[10px] font-bold text-primary/60 uppercase mt-1">3-20 characters, alphanumeric + underscore only</p>
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-primary mb-1">Country</label>
                      <input
                        type="text"
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        placeholder="e.g., United Kingdom"
                        className="w-full border-2 border-primary bg-white px-sm py-xs font-bold text-sm outline-none focus:bg-accent-yellow"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-primary mb-1">Discord Username</label>
                      <input
                        type="text"
                        value={editForm.discordUsername}
                        onChange={(e) => setEditForm({ ...editForm, discordUsername: e.target.value })}
                        placeholder="username#1234"
                        className="w-full border-2 border-primary bg-white px-sm py-xs font-bold text-sm outline-none focus:bg-accent-yellow"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-primary mb-1">Bio</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        placeholder="Tell the circuit about yourself..."
                        rows={3}
                        className="w-full border-2 border-primary bg-white px-sm py-xs font-bold text-sm outline-none focus:bg-accent-yellow resize-none"
                        maxLength={200}
                      />
                    </div>
                  </div>
                  <div className="mt-sm flex gap-sm justify-end">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-lg py-sm border-3 border-primary bg-white text-primary font-black uppercase text-sm cursor-pointer hover:bg-accent-yellow transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-lg py-sm border-3 border-primary bg-accent-yellow text-primary font-black uppercase text-sm cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Stats Row */}
            <div className="mt-xl grid grid-cols-2 md:grid-cols-4 gap-0 border-t-4 border-primary pt-lg relative z-10">
              <StatCard label="Tournaments" value={user.registrations?.length || 0} icon="emoji_events" />
              <StatCard label="Matches Won" value={user.wonMatches?.length || 0} icon="workspace_premium" />
              <StatCard label="Championships" value={user.wonTournaments?.length || 0} icon="trophy" highlight />
              <StatCard label="Squads" value={user.teams?.length || 0} icon="groups" />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b-4 border-primary bg-white overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: "dashboard" },
              { id: "matches", label: "Match History", icon: "sports_esports" },
              { id: "teams", label: "My Squads", icon: "groups" },
              { id: "settings", label: "Settings", icon: "settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-shrink-0 flex items-center gap-xs px-lg py-sm font-black uppercase text-sm border-b-4 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary bg-white"
                    : "border-transparent text-primary/50 hover:text-primary hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white border-4 border-primary border-t-0 neo-brutalist-shadow p-lg">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                  <ProfileOverview user={user} matches={matches} />
                </motion.div>
              )}
              {activeTab === "matches" && (
                <motion.div key="matches" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                  <MatchHistory matches={matches} />
                </motion.div>
              )}
              {activeTab === "teams" && (
                <motion.div key="teams" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                  <MySquads teams={user.teams || []} squad={user.squad} />
                </motion.div>
              )}
              {activeTab === "settings" && (
                <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                  <ProfileSettings user={user} onSave={fetchProfile} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatCard({ label, value, icon, highlight = false }: { label: string; value: number; icon: string; highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-xs p-sm ${highlight ? "bg-accent-yellow/20" : "bg-surface-container-high"}`}>
      <div className="w-12 h-12 border-4 border-primary flex items-center justify-center bg-white {highlight ? 'bg-accent-yellow' : ''}">
        <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <span className="text-3xl font-black text-primary tracking-tighter">{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{label}</span>
    </div>
  );
}

function ProfileOverview({ user, matches }: { user: UserProfile; matches: Match[] }) {
  return (
    <div className="space-y-lg">
      {/* Tournament Registrations */}
      <section className="space-y-sm">
        <h3 className="text-lg font-black uppercase tracking-tight text-primary border-b-2 border-primary pb-xs">Tournament Circuit</h3>
        {user.registrations && user.registrations.length > 0 ? (
          <div className="space-y-sm">
            {user.registrations.slice(0, 5).map((reg: any) => (
              <Link
                key={reg.id}
                href={`/tournaments/${reg.tournament?.id}`}
                className="flex items-center gap-md p-sm border-2 border-primary bg-white hover:bg-accent-yellow transition-colors group"
              >
                <div className="w-10 h-10 border-4 border-primary bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-xl">emoji_events</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-primary uppercase text-sm truncate">{reg.tournament?.title}</p>
                  <p className="text-[10px] font-bold text-primary/60 uppercase">
                    {reg.tournament?.startDate ? new Date(reg.tournament.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "TBA"}
                    • {reg.status?.replace(/_/g, " ")}
                  </p>
                </div>
                <span className="material-symbols-outlined text-primary/50 group-hover:text-primary transition-colors">chevron_right</span>
              </Link>
            ))}
            {user.registrations.length > 5 && (
              <p className="text-center text-sm font-bold text-primary/60 uppercase mt-sm">
                +{user.registrations.length - 5} more tournaments
              </p>
            )}
          </div>
        ) : (
          <div className="text-center p-lg border-2 border-dashed border-primary bg-surface-container-high">
            <span className="material-symbols-outlined text-4xl text-primary/50 mb-sm block">event_busy</span>
            <p className="font-bold text-primary uppercase">No tournament registrations yet</p>
            <Link href="/tournaments" className="inline-flex items-center gap-xs mt-sm px-md py-sm border-3 border-primary bg-primary text-white font-black uppercase text-sm hover:bg-accent-yellow hover:text-primary transition-all">
              <span className="material-symbols-outlined">explore</span> Browse Tournaments
            </Link>
          </div>
        )}
      </section>

      {/* Recent Matches */}
      <section className="space-y-sm border-t-4 border-primary pt-lg">
        <h3 className="text-lg font-black uppercase tracking-tight text-primary border-b-2 border-primary pb-xs">Recent Matches</h3>
        {matches.length > 0 ? (
          <div className="space-y-sm max-h-96 overflow-y-auto custom-scroll">
            {matches.slice(0, 10).map((match: Match) => (
              <div
                key={match.id}
                className="flex items-center gap-md p-sm border-2 border-primary bg-white hover:bg-surface-container-high transition-colors"
              >
                <div className="flex-1 text-right min-w-0 pr-sm">
                  <p className="font-black text-primary uppercase text-sm truncate">{match.p1?.name}</p>
                  <p className="text-[10px] font-bold text-primary/60 uppercase">{match.tournament?.title}</p>
                </div>
                <div className="flex items-center gap-sm px-sm py-xs bg-primary text-white font-black text-sm">
                  {match.p1Score} - {match.p2Score}
                </div>
                <div className="flex-1 text-left min-w-0 pl-sm">
                  <p className="font-black text-primary uppercase text-sm truncate">{match.p2?.name}</p>
                  <p className="text-[10px] font-bold text-primary/60 uppercase">
                    Round {match.round} • {match.winner?.name === match.p1?.name ? "Won" : "Lost"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-lg border-2 border-dashed border-primary bg-surface-container-high">
            <span className="material-symbols-outlined text-4xl text-primary/50 mb-sm block">history</span>
            <p className="font-bold text-primary uppercase">No completed matches yet</p>
            <p className="text-sm font-bold text-primary/60 mt-xs">Your match history will appear here</p>
          </div>
        )}
      </section>

      {/* Achievements */}
      <section className="space-y-sm border-t-4 border-primary pt-lg">
        <h3 className="text-lg font-black uppercase tracking-tight text-primary border-b-2 border-primary pb-xs">Hall of Champions</h3>
        {user.wonTournaments && user.wonTournaments.length > 0 ? (
          <div className="flex flex-wrap gap-sm">
            {user.wonTournaments.map((t: any) => (
              <div
                key={t.id}
                className="flex items-center gap-xs px-sm py-xs bg-accent-yellow border-2 border-primary font-black text-xs uppercase"
              >
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                {t.title}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm font-bold text-primary/60 uppercase py-md">No championships won yet. Keep training!</p>
        )}
      </section>
    </div>
  );
}

function MatchHistory({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <div className="text-center p-xl border-2 border-dashed border-primary bg-surface-container-high">
        <span className="material-symbols-outlined text-5xl text-primary/50 mb-sm block">history</span>
        <p className="font-bold text-primary uppercase text-lg">No match history</p>
        <p className="text-sm font-bold text-primary/60 mt-xs">Completed matches will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-sm">
      {matches.map((match) => (
        <div
          key={match.id}
          className="flex items-center gap-md p-sm border-2 border-primary bg-white hover:bg-surface-container-high transition-colors"
        >
          <div className="flex-1 text-right min-w-0 pr-sm">
            <p className="font-black text-primary uppercase text-sm truncate">{match.p1?.name}</p>
            <p className="text-[10px] font-bold text-primary/60 uppercase">{match.tournament?.title}</p>
          </div>
          <div className="flex items-center gap-sm px-sm py-xs bg-primary text-white font-black text-sm">
            {match.p1Score} - {match.p2Score}
          </div>
          <div className="flex-1 text-left min-w-0 pl-sm">
            <p className="font-black text-primary uppercase text-sm truncate">{match.p2?.name}</p>
            <p className="text-[10px] font-bold text-primary/60 uppercase">
              Round {match.round} • {match.winner?.name === match.p1?.name ? "Victory" : "Defeat"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MySquads({ teams, squad }: { teams: any[]; squad: any }) {
  return (
    <div className="space-y-lg">
      {/* Active Free Fire Squad */}
      <section className="space-y-sm">
        <h3 className="text-lg font-black uppercase tracking-tight text-primary border-b-2 border-primary pb-xs flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          Free Fire Squad
        </h3>
        {squad ? (
          <div className="bg-white border-4 border-primary p-md neo-brutalist-shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-accent-yellow/20 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2" />
            <h4 className="text-xl font-black uppercase text-primary mb-sm relative z-10">{squad.name}</h4>
            <div className="flex flex-wrap gap-sm relative z-10">
              {squad.members?.map((member: any) => (
                <div key={member.id} className="flex items-center gap-xs px-sm py-xs bg-surface-container-high border-2 border-primary font-bold text-xs uppercase">
                  <span className="material-symbols-outlined text-[14px] text-primary">person</span>
                  {member.name} {member.id === squad.captainId && <span className="text-accent-yellow">★</span>}
                </div>
              ))}
            </div>
            <div className="mt-sm text-xs font-bold text-primary/60 uppercase relative z-10">
              {squad.members?.length || 0} / 5 members
            </div>
          </div>
        ) : (
          <div className="text-center p-lg border-2 border-dashed border-primary bg-surface-container-high">
            <span className="material-symbols-outlined text-4xl text-primary/50 mb-sm block">group_add</span>
            <p className="font-bold text-primary uppercase">No active squad</p>
            <p className="text-sm font-bold text-primary/60 mt-xs">Create or join a squad for Free Fire tournaments</p>
          </div>
        )}
      </section>

      {/* Pokemon Teams */}
      <section className="space-y-sm border-t-4 border-primary pt-lg">
        <h3 className="text-lg font-black uppercase tracking-tight text-primary border-b-2 border-primary pb-xs flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary">caught_pokeball</span>
          Pokemon Teams
        </h3>
        {teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
            {teams.map((team: any) => (
              <div
                key={team.id}
                className={`p-sm border-4 ${team.active ? "border-accent-yellow bg-accent-yellow/10" : "border-primary bg-white"} relative`}
              >
                {team.active && (
                  <div className="absolute -top-2 -right-2 bg-accent-yellow text-primary border-2 border-primary px-2 py-0.5 font-black text-[9px] uppercase">
                    Active
                  </div>
                )}
                <h4 className="font-black text-primary uppercase text-sm mb-xs">{team.name}</h4>
                <div className="flex flex-wrap gap-xs">
                  {JSON.parse(team.pokemonJson || "[]").map((poke: any, idx: number) => (
                    <span key={idx} className="px-xs py-xs border-2 border-primary bg-white font-black text-[9px] uppercase">
                      {poke.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-lg border-2 border-dashed border-primary bg-surface-container-high">
            <span className="material-symbols-outlined text-4xl text-primary/50 mb-sm block">caught_pokeball</span>
            <p className="font-bold text-primary uppercase">No teams created</p>
            <p className="text-sm font-bold text-primary/60 mt-xs">Build your team for Pokemon tournaments</p>
          </div>
        )}
      </section>
    </div>
  );
}

function ProfileSettings({ user }: { user: UserProfile; onSave: () => void }) {
  return (
    <div className="space-y-lg max-w-xl">
      <section className="space-y-sm">
        <h3 className="text-lg font-black uppercase tracking-tight text-primary border-b-2 border-primary pb-xs">Account Info</h3>
        <div className="bg-surface-container-high border-2 border-primary p-sm space-y-sm">
          <div className="grid grid-cols-2 gap-sm text-sm">
            <span className="font-bold text-primary/60 uppercase">Email</span>
            <span className="font-black text-primary truncate">{user.email}</span>
            <span className="font-bold text-primary/60 uppercase">Trainer ID</span>
            <span className="font-black text-primary font-mono">{user.id.slice(0, 8).toUpperCase()}</span>
            <span className="font-bold text-primary/60 uppercase">Member Since</span>
            <span className="font-black text-primary">{new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </div>
      </section>

      <section className="space-y-sm border-t-4 border-primary pt-lg">
        <h3 className="text-lg font-black uppercase tracking-tight text-primary border-b-2 border-primary pb-xs">Danger Zone</h3>
        <div className="bg-red-50 border-2 border-accent-red p-sm space-y-sm">
          <p className="font-bold text-accent-red uppercase text-sm">These actions are irreversible.</p>
          <button className="w-full py-sm bg-accent-red text-white border-3 border-accent-red font-black uppercase text-sm hover:bg-red-700 transition-colors">
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}