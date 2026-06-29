"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import Modal from "@/components/Modal";
import InviteMembersModal from "@/components/InviteMembersModal";
import CreateSquadModal from "@/components/CreateSquadModal";

interface SquadMember {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  elo?: number;
  wins?: number;
  losses?: number;
}

interface SquadData {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  createdAt: string | Date;
  captainId: string;
  coCaptainId: string | null;
  captain: SquadMember;
  coCaptain: SquadMember | null;
  members: SquadMember[];
  registrations: {
    id: string;
    status: string;
    tournament: {
      id: string;
      title: string;
      startDate: string | Date;
      game: string;
      status: string;
    };
  }[];
  matches: {
    id: string;
    status: string;
    s1Id: string | null;
    s2Id: string | null;
    s1: { name: string } | null;
    s2: { name: string } | null;
    winnerSquadId: string | null;
    winnerSquad: { name: string } | null;
    tournament: { title: string; startDate: string | Date } | null;
  }[];
  stats: {
    wins: number;
    losses: number;
    winRate: number;
    elo: number;
  };
  isCaptain: boolean;
  isCoCaptain: boolean;
  isMember: boolean;
  currentUserId: string | undefined;
}

interface SquadPageClientProps {
  initialSquad: SquadData;
}

export default function SquadPageClient({ initialSquad }: SquadPageClientProps) {
  const [squad, setSquad] = useState<SquadData>(initialSquad);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [availableTournaments, setAvailableTournaments] = useState<any[]>([]);
  const [fetchingTournaments, setFetchingTournaments] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [editingLogo, setEditingLogo] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { name, logo, description, captainId, coCaptainId, members, id } = squad;

  const handleRefresh = () => {
    window.location.reload();
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const fetchAvailableTournaments = async () => {
    setFetchingTournaments(true);
    try {
      try {
        const res = await fetch("/api/tournaments?mode=SQUAD");
        const data = await res.json();
        if (res.ok) {
          const registeredIds = new Set(squad.registrations?.map((r: any) => r.tournamentId) || []);
          const available = data.filter((t: any) =>
            t.mode === "SQUAD" &&
            t.status === "REGISTRATION_OPEN" &&
            !registeredIds.has(t.id)
          );
          setAvailableTournaments(available);
        }
      } catch (err) {
        console.error("Failed to fetch tournaments:", err);
      }
    } finally {
      setFetchingTournaments(false);
    }
  };

  const handleAction = async (action: string, userId?: string) => {
    clearMessages();
    setActionLoading(action + (userId || ""));

    try {
      const res = await fetch("/api/squads/roster", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      setSuccess(data.message || "Action completed successfully");
      handleRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch(`/api/squads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingName.trim(),
          logo: editingLogo.trim() || null,
          description: editingDescription.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update squad");
      }

      setSuccess("Squad updated successfully!");
      handleRefresh();
      setShowEditModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSquad = async () => {
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch(`/api/squads/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete squad");
      }

      setSuccess("Squad disbanded successfully!");
      setShowDeleteConfirm(false);
      window.location.href = "/profile?tab=squad";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTournament = async (tournamentId: string, tournamentTitle: string) => {
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/squad-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register for tournament");
      }

      setSuccess(`Successfully registered for "${tournamentTitle}"!`);
      handleRefresh();
      setShowRegisterModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!squad) {
    return null;
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background py-lg px-md">
        <div className="max-w-4xl mx-auto space-y-lg">
          {/* Squad Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white border-4 border-primary p-lg neo-brutalist-shadow overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent-yellow/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-blue/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-lg">
              {/* Squad Logo */}
              <div className="relative flex-shrink-0 z-10">
                <div className="w-28 h-28 md:w-32 md:h-32 border-4 border-primary bg-primary flex items-center justify-center overflow-hidden relative">
                  {squad.logo ? (
                    <Image src={squad.logo} alt={squad.name} fill className="object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-5xl md:text-6xl text-primary">shield</span>
                  )}
                </div>
              </div>

              {/* Squad Info */}
              <div className="flex-1 text-center md:text-left z-10 space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-sm">
                  <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-primary">
                    {name}
                  </h1>
                  {squad.isCaptain && (
                    <span className="bg-accent-yellow text-primary px-3 py-1 font-black text-sm uppercase border-2 border-primary">
                      Captain
                    </span>
                  )}
                  {squad.isCoCaptain && (
                    <span className="bg-accent-blue text-white px-3 py-1 font-black text-sm uppercase border-2 border-accent-blue">
                      Co-Captain
                    </span>
                  )}
                  {squad.isMember && !squad.isCaptain && !squad.isCoCaptain && (
                    <span className="bg-primary text-white px-3 py-1 font-black text-sm uppercase border-2 border-primary">
                      Member
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-primary/60 uppercase tracking-wider">
                  Created {new Date(squad.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>

                {squad.description && (
                  <p className="text-base font-bold text-primary/80 italic max-w-md mx-auto md:mx-0">
                    "{squad.description}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex-shrink-0 z-10 flex flex-col gap-sm">
                {(squad.isCaptain || squad.isCoCaptain) && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-lg py-sm border-3 border-primary bg-accent-yellow text-primary font-black uppercase text-sm hover:bg-primary hover:text-white transition-all cursor-pointer neo-brutalist-button-active"
                  >
                    <span className="material-symbols-outlined mr-1">person_add</span>
                    Invite Members
                  </button>
                )}
                {squad.isCaptain && availableTournaments.length > 0 && (
                  <button
                    onClick={() => { fetchAvailableTournaments(); setShowRegisterModal(true); }}
                    className="px-lg py-sm border-3 border-primary bg-accent-blue text-white font-black uppercase text-sm hover:bg-blue-700 transition-all cursor-pointer neo-brutalist-button-active"
                  >
                    <span className="material-symbols-outlined mr-1">sports_esports</span>
                    Register for Tournament ({availableTournaments.length})
                  </button>
                )}
                {squad.isCaptain && (
                  <button
                    onClick={() => { setEditingName(name); setEditingLogo(logo || ""); setEditingDescription(description || ""); setShowEditModal(true); }}
                    className="px-lg py-sm border-3 border-primary bg-white text-primary font-black uppercase text-sm hover:bg-accent-yellow transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined mr-1">edit</span>
                    Edit Squad
                  </button>
                )}
                {squad.isCaptain && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-lg py-sm border-3 border-accent-red bg-red-50 text-accent-red font-black uppercase text-sm hover:bg-accent-red hover:text-white transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined mr-1">delete</span>
                    Disband Squad
                  </button>
                )}
                {!squad.isCaptain && !squad.isCoCaptain && squad.isMember && (
                  <button
                    onClick={() => handleAction("LEAVE")}
                    className="px-lg py-sm border-3 border-primary bg-white text-primary font-black uppercase text-sm hover:bg-accent-yellow transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined mr-1">logout</span>
                    Leave Squad
                  </button>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-xl grid grid-cols-2 md:grid-cols-4 gap-0 border-t-4 border-primary pt-lg relative z-10">
              <StatCard label="Members" value={members.length} icon="person" />
              <StatCard label="Wins" value={squad.stats.wins} icon="workspace_premium" />
              <StatCard label="Losses" value={squad.stats.losses} icon="sports_mma" />
              <StatCard label="Avg CP" value={squad.stats.elo} icon="trending_up" highlight />
            </div>
          </motion.div>

          {/* Members List */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-sm"
          >
            <h3 className="text-lg font-black uppercase tracking-tight text-primary border-b-2 border-primary pb-xs flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              Squad Members ({members.length}/6)
            </h3>

            <div className="space-y-sm">
              {members.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white border-4 border-primary p-sm neo-brutalist-shadow-sm relative flex items-center gap-md"
                >
                  <div className="w-12 h-12 border-4 border-primary bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {member.image ? (
                      <Image src={member.image} alt="" fill className="object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-white uppercase">
                        {(member.name || member.username || "?")[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sm flex-wrap">
                      <p className="font-black text-primary uppercase truncate flex-1">
                        {member.name || member.username || "Unknown"}
                      </p>
                      {member.id === captainId && (
                        <span className="bg-accent-yellow text-primary px-2 py-0.5 font-black text-[9px] uppercase border-2 border-primary flex-shrink-0">
                          Captain
                        </span>
                      )}
                      {member.id === coCaptainId && (
                        <span className="bg-accent-blue text-white px-2 py-0.5 font-black text-[9px] uppercase border-2 border-accent-blue flex-shrink-0">
                          Co-Captain
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-primary/60 uppercase">
                      @{member.username || "no-username"} &bull; CP: {member.elo} &bull; W/L: {member.wins}/{member.losses}
                    </p>
                  </div>

                  {/* Actions */}
                  {squad.isCaptain && member.id !== squad.currentUserId && (
                    <div className="flex items-center gap-sm">
                      {member.id !== coCaptainId && (
                        <button
                          onClick={() => handleAction("SET_CO_CAPTAIN", member.id)}
                          disabled={actionLoading === "SET_CO_CAPTAIN" + member.id}
                          className="px-sm py-xs border-2 border-accent-blue bg-accent-blue/10 text-accent-blue font-black text-xs uppercase hover:bg-accent-blue hover:text-white transition-all cursor-pointer disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined mr-1 text-[12px]">star</span>
                          Co-Captain
                        </button>
                      )}
                      {member.id === coCaptainId && (
                        <button
                          onClick={() => handleAction("REMOVE_CO_CAPTAIN", member.id)}
                          disabled={actionLoading === "REMOVE_CO_CAPTAIN" + member.id}
                          className="px-sm py-xs border-2 border-primary bg-white text-primary font-black text-xs uppercase hover:bg-accent-yellow transition-all cursor-pointer disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined mr-1 text-[12px]">star_outline</span>
                          Remove Co-Captain
                        </button>
                      )}
                      <button
                        onClick={() => handleAction("TRANSFER_CAPTAIN", member.id)}
                        disabled={actionLoading === "TRANSFER_CAPTAIN" + member.id}
                        className="px-sm py-xs border-2 border-primary bg-white text-primary font-black text-xs uppercase hover:bg-accent-yellow transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined mr-1 text-[12px]">swap_horiz</span>
                        Transfer
                      </button>
                      <button
                        onClick={() => handleAction("KICK", member.id)}
                        disabled={actionLoading === "KICK" + member.id}
                        className="px-sm py-xs border-2 border-accent-red bg-red-50 text-accent-red font-black text-xs uppercase hover:bg-accent-red hover:text-white transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined mr-1 text-[12px]">person_remove</span>
                        Kick
                      </button>
                    </div>
                  )}
                  {squad.isCaptain && member.id === squad.currentUserId && member.id !== captainId && (
                    <button
                      onClick={() => handleAction("TRANSFER_CAPTAIN", member.id)}
                      disabled={actionLoading === "TRANSFER_CAPTAIN" + member.id}
                      className="px-sm py-xs border-2 border-accent-yellow bg-accent-yellow/10 text-primary font-black text-xs uppercase hover:bg-accent-yellow transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined mr-1 text-[12px]">swap_horiz</span>
                      Claim Captain
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Tournament Registrations */}
          {squad.registrations && squad.registrations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-sm border-t-4 border-primary pt-lg"
            >
              <h3 className="text-lg font-black uppercase tracking-tight text-primary border-b-2 border-primary pb-xs flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">emoji_events</span>
                Tournament Registrations
              </h3>

              <div className="space-y-sm">
                {squad.registrations.map((reg) => (
                  <Link
                    key={reg.id}
                    href={`/tournaments/${reg.tournament.id}`}
                    className="flex items-center gap-md p-sm border-2 border-primary bg-white hover:bg-accent-yellow transition-colors group"
                  >
                    <div className="w-10 h-10 border-4 border-primary bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-white text-xl">emoji_events</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-primary uppercase text-sm truncate">{reg.tournament.title}</p>
                      <p className="text-[10px] font-bold text-primary/60 uppercase">
                        {new Date(reg.tournament.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        &bull; {reg.tournament.game} &bull; {reg.status.replace(/_/g, " ")}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-primary/50 group-hover:text-primary transition-colors">chevron_right</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Match History */}
          {squad.matches && squad.matches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-sm border-t-4 border-primary pt-lg"
            >
              <h3 className="text-lg font-black uppercase tracking-tight text-primary border-b-2 border-primary pb-xs flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                Match History
              </h3>

              <div className="space-y-sm max-h-96 overflow-y-auto custom-scroll">
                {squad.matches.map((match) => (
                  <div key={match.id} className="flex items-center gap-md p-sm border-2 border-primary bg-white hover:bg-surface-container-high transition-colors">
                    <div className="flex-1 text-right min-w-0 pr-sm">
                      <p className="font-black text-primary uppercase text-sm truncate">{match.s1?.name || "TBD"}</p>
                      <p className="text-[10px] font-bold text-primary/60 uppercase">{match.tournament?.title}</p>
                    </div>
                    <div className="flex items-center gap-sm px-sm py-xs bg-primary text-white font-black text-sm">
                      {match.s1Id === id ? match.winnerSquadId === id ? "W" : "L" : match.winnerSquadId === id ? "W" : "L"}
                    </div>
                    <div className="flex-1 text-left min-w-0 pl-sm">
                      <p className="font-black text-primary uppercase text-sm truncate">{match.s2?.name || "TBD"}</p>
                      <p className="text-[10px] font-bold text-primary/60 uppercase">
                        Round &bull; {match.winnerSquad?.name === match.s1?.name ? "Victory" : "Defeat"}
                      </p>
                    </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* No Tournament Registrations Message */}
            {squad.isCaptain && (!squad.registrations || squad.registrations.length === 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-lg border-2 border-dashed border-primary bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-4xl text-primary/50 mb-sm block">emoji_events</span>
                <p className="font-bold text-primary uppercase">No Tournament Registrations</p>
                <p className="text-sm font-bold text-primary/60 mt-xs">Register your squad for a team tournament</p>
                <Link
                  href="/tournaments"
                  className="inline-flex items-center gap-xs mt-sm px-md py-sm border-3 border-primary bg-primary text-white font-black uppercase text-sm hover:bg-accent-yellow hover:text-primary transition-all"
                >
                  <span className="material-symbols-outlined">explore</span> Browse Tournaments
                </Link>
              </motion.div>
            )}

            {/* Modals */}
            <InviteMembersModal
              isOpen={showInviteModal}
              onClose={() => setShowInviteModal(false)}
              squadId={id}
              onSuccess={handleRefresh}
            />

            <CreateSquadModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              onSuccess={handleRefresh}
            />

            {/* Edit Squad Modal */}
            <AnimatePresence>
              {showEditModal && (
                <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Squad" size="md">
                  <form onSubmit={handleEditSquad} className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-50 border-2 border-red-500 text-red-700 font-bold text-sm uppercase">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-black uppercase text-primary mb-1">Squad Name *</label>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full border-2 border-primary bg-white px-3 py-2 font-bold text-sm outline-none focus:bg-accent-yellow focus:ring-0"
                        maxLength={50}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-primary mb-1">Team Logo URL</label>
                      <input
                        type="url"
                        value={editingLogo}
                        onChange={(e) => setEditingLogo(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="w-full border-2 border-primary bg-white px-3 py-2 font-bold text-sm outline-none focus:bg-accent-yellow focus:ring-0"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-primary mb-1">Description</label>
                      <textarea
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        rows={3}
                        className="w-full border-2 border-primary bg-white px-3 py-2 font-bold text-sm outline-none focus:bg-accent-yellow focus:ring-0 resize-none"
                        maxLength={500}
                        disabled={loading}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(false)}
                        className="flex-1 px-4 py-3 border-3 border-primary bg-white text-primary font-black uppercase text-sm hover:bg-accent-yellow transition-all cursor-pointer disabled:opacity-50"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 border-3 border-primary bg-accent-yellow text-primary font-black uppercase text-sm hover:bg-primary hover:text-white transition-all cursor-pointer disabled:opacity-50 active:translate-y-0.5"
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </Modal>
              )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Disband Squad" size="sm">
                  <div className="space-y-4 text-center">
                    <div className="w-16 h-16 mx-auto border-4 border-accent-red bg-red-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-accent-red">warning</span>
                    </div>
                    <p className="font-bold text-primary uppercase">
                      Are you sure you want to disband <span className="text-accent-red">{name}</span>?
                    </p>
                    <p className="text-sm font-bold text-primary/60 uppercase">
                      This action cannot be undone. All members will be removed and tournament registrations cancelled.
                    </p>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-4 py-3 border-3 border-primary bg-white text-primary font-black uppercase text-sm hover:bg-accent-yellow transition-all cursor-pointer disabled:opacity-50"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteSquad}
                        className="flex-1 px-4 py-3 border-3 border-accent-red bg-accent-red text-white font-black uppercase text-sm hover:bg-red-700 transition-all cursor-pointer disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? "Disbanding..." : "Disband Squad"}
                      </button>
                    </div>
                  </div>
                </Modal>
              )}
            </AnimatePresence>

            {/* Register Tournament Modal */}
            <AnimatePresence>
              {showRegisterModal && (
                <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} title="Register for Tournament" size="md">
                  <div className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-50 border-2 border-red-500 text-red-700 font-bold text-sm uppercase">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="p-3 bg-green-50 border-2 border-green-700 text-green-700 font-bold text-sm uppercase">
                        {success}
                      </div>
                    )}

                    {availableTournaments.length === 0 ? (
                      <div className="text-center p-lg border-2 border-dashed border-primary bg-surface-container-high">
                        <span className="material-symbols-outlined text-4xl text-primary/50 mb-sm block">emoji_events</span>
                        <p className="font-bold text-primary uppercase">No Available Tournaments</p>
                        <p className="text-sm font-bold text-primary/60 mt-xs">No squad tournaments are currently open for registration</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto custom-scroll">
                        {availableTournaments.map((tournament) => (
                          <div
                            key={tournament.id}
                            className="p-3 border-2 border-primary bg-white hover:bg-accent-yellow transition-colors cursor-pointer"
                            onClick={() => handleRegisterTournament(tournament.id, tournament.title)}
                          >
                            <p className="font-black text-primary uppercase text-sm truncate">{tournament.title}</p>
                            <p className="text-[10px] font-bold text-primary/60 uppercase">
                              {new Date(tournament.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              &bull; {tournament.game} &bull; Min: {tournament.minSquadMembers} &bull; Max: {tournament.maxSquadMembers}
                            </p>
                            <p className="text-[10px] font-bold text-accent-blue uppercase mt-1">Click to register</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Modal>
              )}
            </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatCard({ label, value, icon, highlight = false }: { label: string; value: number | string; icon: string; highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-xs p-sm ${highlight ? "bg-accent-yellow/20" : "bg-surface-container-high"}`}>
      <div className="w-10 h-10 border-4 border-primary flex items-center justify-center bg-white">
        <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <span className="text-2xl font-black text-primary tracking-tighter">{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{label}</span>
    </div>
  );
}