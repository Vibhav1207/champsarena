"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import CreateSquadModal from "@/components/CreateSquadModal";
import Modal from "@/components/Modal";

interface SquadData {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  createdAt: string | Date;
  captainId: string;
  coCaptainId: string | null;
  captain: { id: string; name: string | null; username: string | null; image: string | null };
  coCaptain: { id: string; name: string | null; username: string | null; image: string | null } | null;
  members: { id: string; name: string | null; username: string | null; elo: number; wins: number; losses: number }[];
  registrations: { id: string; status: string; tournament: { id: string; title: string; startDate: string | Date; game: string; status: string } }[];
  memberCount: number;
  isCaptain: boolean;
  isCoCaptain: boolean;
}

interface SquadInvitation {
  id: string;
  squadId: string;
  userId: string;
  status: string;
  createdAt: string | Date;
  squad: { id: string; name: string; logo: string | null; captainId: string };
}

interface SquadsDashboardClientProps {
  initialSquads: SquadData[];
  initialInvitations: SquadInvitation[];
  userId: string;
}

export default function SquadsDashboardClient({ initialSquads, initialInvitations, userId }: SquadsDashboardClientProps) {
  const [squads, setSquads] = useState<SquadData[]>(initialSquads);
  const [invitations, setInvitations] = useState<SquadInvitation[]>(initialInvitations);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRefresh = async () => {
    const res = await fetch("/api/squads");
    const data = await res.json();
    if (data.squad) {
      // Update the specific squad
      setSquads(prev => prev.map(s => s.id === data.squad.id ? data.squad : s));
    }
  };

  const handleCreateSquad = async (squadData: { name: string; logo: string; description: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/squads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(squadData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create squad");
      setSuccess("Squad created successfully!");
      setSquads(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (invitationId: string) => {
    setError(null);
    try {
      const res = await fetch("/api/squads/invite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action: "ACCEPT" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept invitation");
      setSuccess("Welcome to the team!");
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      handleRefresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeclineInvite = async (invitationId: string) => {
    setError(null);
    try {
      const res = await fetch("/api/squads/invite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action: "DECLINE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to decline invitation");
      setSuccess("Invitation declined.");
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (squads.length === 0 && invitations.length === 0) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background py-lg px-md">
          <div className="max-w-2xl mx-auto">
            <div className="text-center p-xl border-2 border-dashed border-primary bg-surface-container-high">
              <span className="material-symbols-outlined text-6xl text-primary/30 mb-md block">groups</span>
              <h2 className="font-black text-2xl text-primary uppercase mb-sm">No Squads Yet</h2>
              <p className="text-primary/60 font-bold uppercase text-sm mb-lg max-w-md mx-auto">
                Create your own squad or wait for an invitation to join one.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-accent-yellow text-primary px-lg py-sm border-4 border-primary font-black uppercase hover:bg-primary hover:text-white transition-all neo-brutalist-shadow neo-brutalist-button-active"
              >
                <span className="material-symbols-outlined mr-1">person_add</span>
                Create Your First Squad
              </button>
            </div>
          </div>
        </main>
        <Footer />
        <CreateSquadModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
        <AnimatePresence>
          {showCreateModal && (
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Squad" size="md">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  name: formData.get("name")?.toString() || "",
                  logo: formData.get("logo")?.toString() || "",
                  description: formData.get("description")?.toString() || "",
                };
                await handleCreateSquad(data);
              }} className="space-y-4">
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
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1">Squad Name *</label>
                  <input name="name" type="text" placeholder="Enter squad name (min 3 characters)" className="w-full border-2 border-primary bg-white px-3 py-2 font-bold text-sm outline-none focus:bg-accent-yellow focus:ring-0" maxLength={50} required disabled={loading} />
                  <p className="text-[10px] font-bold text-primary/60 uppercase mt-1">3-50 characters</p>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1">Team Logo URL (Optional)</label>
                  <input name="logo" type="url" placeholder="https://example.com/logo.png" className="w-full border-2 border-primary bg-white px-3 py-2 font-bold text-sm outline-none focus:bg-accent-yellow focus:ring-0" disabled={loading} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-primary mb-1">Description (Optional)</label>
                  <textarea name="description" placeholder="Tell others about your squad..." rows={3} className="w-full border-2 border-primary bg-white px-3 py-2 font-bold text-sm outline-none focus:bg-accent-yellow focus:ring-0 resize-none" maxLength={500} disabled={loading} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-3 border-3 border-primary bg-white text-primary font-black uppercase text-sm hover:bg-accent-yellow transition-all cursor-pointer disabled:opacity-50" disabled={loading}>Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-3 border-3 border-primary bg-accent-yellow text-primary font-black uppercase text-sm hover:bg-primary hover:text-white transition-all cursor-pointer disabled:opacity-50 active:translate-y-0.5" disabled={loading}>{loading ? "Creating..." : "Create Squad"}</button>
                </div>
              </form>
            </Modal>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background py-lg px-md">
        <div className="max-w-4xl mx-auto space-y-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md mb-lg">
            <h1 className="font-black text-3xl text-primary uppercase">My Squads</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-accent-yellow text-primary px-lg py-sm border-4 border-primary font-black uppercase hover:bg-primary hover:text-white transition-all neo-brutalist-shadow neo-brutalist-button-active flex items-center gap-2"
            >
              <span className="material-symbols-outlined">person_add</span>
              Create Squad
            </button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-sm border-2 border-accent-red bg-red-50 text-accent-red font-bold text-sm uppercase" style={{ animationDuration: "200ms" }}>
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-sm border-2 border-green-700 bg-green-50 text-green-700 font-bold text-sm uppercase" style={{ animationDuration: "200ms" }}>
              {success}
            </motion.div>
          )}

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <section className="space-y-sm">
              <h3 className="text-lg font-black uppercase tracking-tight text-primary border-b-2 border-primary pb-xs flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">mail</span>
                Pending Invitations ({invitations.length})
              </h3>
              <div className="space-y-sm">
                {invitations.map((invitation) => (
                  <motion.div key={invitation.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-4 border-primary p-md neo-brutalist-shadow relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
                      <div className="flex items-center gap-md">
                        <div className="w-14 h-14 border-4 border-primary flex items-center justify-center bg-accent-yellow flex-shrink-0 overflow-hidden">
                          {invitation.squad.logo ? (
                            <Image src={invitation.squad.logo} alt="" fill className="object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-3xl text-primary">shield</span>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-xl text-primary uppercase">{invitation.squad.name}</p>
                          <p className="text-sm font-bold text-primary/60 uppercase">
                            Invited {new Date(invitation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-sm flex-wrap">
                        <button
                          onClick={() => handleAcceptInvite(invitation.id)}
                          className="px-md py-sm bg-accent-yellow text-primary border-3 border-primary font-black uppercase hover:bg-primary hover:text-white transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined mr-1">check</span>
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineInvite(invitation.id)}
                          className="px-md py-sm bg-white text-primary border-3 border-primary font-black uppercase hover:bg-accent-red hover:text-white transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined mr-1">close</span>
                          Decline
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* My Squads */}
          <section className="space-y-sm">
            <h3 className="text-lg font-black uppercase tracking-tight text-primary border-b-2 border-primary pb-xs flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              Your Squads ({squads.length})
            </h3>

            {squads.length === 0 ? (
              <div className="text-center p-lg border-2 border-dashed border-primary bg-surface-container-high">
                <span className="material-symbols-outlined text-4xl text-primary/50 mb-sm block">groups</span>
                <p className="font-bold text-primary uppercase">No squads yet</p>
                <p className="text-sm font-bold text-primary/60 mt-xs">Create a squad or accept an invitation to get started</p>
              </div>
            ) : (
              <div className="space-y-sm">
                {squads.map((squad) => (
                  <Link key={squad.id} href={`/squad/${squad.id}`} className="block">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border-4 border-primary p-md hover:bg-accent-yellow/10 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-md">
                        <div className="w-16 h-16 border-4 border-primary flex items-center justify-center bg-primary flex-shrink-0 overflow-hidden">
                          {squad.logo ? (
                            <Image src={squad.logo} alt={squad.name} fill className="object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-4xl text-primary">shield</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-sm">
                            <h4 className="font-black text-xl text-primary uppercase truncate">{squad.name}</h4>
                            {squad.isCaptain && (
                              <span className="bg-accent-yellow text-primary px-2 py-1 font-black text-xs uppercase border-2 border-primary">
                                Captain
                              </span>
                            )}
                            {squad.isCoCaptain && (
                              <span className="bg-accent-blue text-white px-2 py-1 font-black text-xs uppercase border-2 border-accent-blue">
                                Co-Captain
                              </span>
                            )}
                            {!squad.isCaptain && !squad.isCoCaptain && (
                              <span className="bg-primary text-white px-2 py-1 font-black text-xs uppercase border-2 border-primary">
                                Member
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-primary/60 uppercase">
                            {squad.memberCount}/6 members &bull; Created {new Date(squad.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          {squad.registrations && squad.registrations.length > 0 && (
                            <p className="text-sm font-bold text-primary/60 uppercase mt-xs">
                              {squad.registrations.length} tournament registration{squad.registrations.length > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-sm text-primary/50">
                          <span className="material-symbols-outlined text-xl">chevron_right</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />

      {/* Create Squad Modal */}
      <CreateSquadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleRefresh}
      />
    </>
  );
}