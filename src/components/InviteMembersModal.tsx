"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

interface PlayerSearchResult {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  elo: number;
}

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  squadId: string;
  onSuccess: () => void;
}

export default function InviteMembersModal({ isOpen, onClose, squadId, onSuccess }: InviteMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [foundPlayer, setFoundPlayer] = useState<PlayerSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);
    setSuccess(null);
    setFoundPlayer(null);

    try {
      const res = await fetch("/api/squads/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchQuery: searchQuery.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }

      // The invite API actually sends the invitation
      setSuccess(`Invitation sent successfully!`);
      onSuccess();
      setSearchQuery("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setFoundPlayer(null);
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Members" size="lg">
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

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter username, email, display name, or Trainer ID"
              className="flex-1 border-2 border-primary bg-white px-3 py-2 font-bold text-sm outline-none focus:bg-accent-yellow focus:ring-0"
              disabled={searching || inviting}
            />
            <button
              type="submit"
              className="px-4 py-2 border-3 border-primary bg-accent-yellow text-primary font-black uppercase text-sm hover:bg-primary hover:text-white transition-all cursor-pointer disabled:opacity-50"
              disabled={searching || inviting || !searchQuery.trim()}
            >
              {searching ? "Searching..." : inviting ? "Inviting..." : "Find & Invite"}
            </button>
          </div>

          <p className="text-[10px] font-bold text-primary/60 uppercase">
            Enter a username, email, display name, or Trainer ID to invite a registered ChampsArena player.
          </p>

          {foundPlayer && !searching && !inviting && (
            <div className="p-3 border-2 border-accent-blue bg-accent-blue/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-4 border-primary bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {foundPlayer.image ? (
                    <img src={foundPlayer.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-white uppercase">
                      {(foundPlayer.name || foundPlayer.username || "?")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-primary uppercase truncate">
                    {foundPlayer.name || foundPlayer.username || "Unknown"}
                  </p>
                  <p className="text-[10px] font-bold text-primary/60 uppercase">
                    @{foundPlayer.username || "no-username"} • {foundPlayer.email}
                  </p>
                  <p className="text-[10px] font-bold text-primary/60 uppercase">
                    CP: {foundPlayer.elo}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
}