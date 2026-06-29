"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

interface CreateSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSquadModal({ isOpen, onClose, onSuccess }: CreateSquadModalProps) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [description, setDescription] = useState("");
  const [game, setGame] = useState("FREE_FIRE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const games = [
    { value: "FREE_FIRE", label: "Free Fire" },
    { value: "BGMI", label: "BGMI" },
    { value: "VALORANT", label: "Valorant" },
    { value: "POKEMON_VGC", label: "Pokémon VGC" },
    { value: "POKEMON_TCG", label: "Pokémon TCG" },
    { value: "POKEMON_GO", label: "Pokémon GO" },
    { value: "OTHER", label: "Other" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/squads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), logo: logo.trim() || null, description: description.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create squad");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setLogo("");
    setDescription("");
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Squad" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-500 text-red-700 font-bold text-sm uppercase">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-black uppercase text-primary mb-1">Squad Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter squad name (min 3 characters)"
            className="w-full border-2 border-primary bg-white px-3 py-2 font-bold text-sm outline-none focus:bg-accent-yellow focus:ring-0"
            maxLength={50}
            required
            disabled={loading}
          />
          <p className="text-[10px] font-bold text-primary/60 uppercase mt-1">3-50 characters</p>
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-primary mb-1">Team Logo URL (Optional)</label>
          <input
            type="url"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full border-2 border-primary bg-white px-3 py-2 font-bold text-sm outline-none focus:bg-accent-yellow focus:ring-0"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-primary mb-1">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell others about your squad..."
            rows={3}
            className="w-full border-2 border-primary bg-white px-3 py-2 font-bold text-sm outline-none focus:bg-accent-yellow focus:ring-0 resize-none"
            maxLength={500}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-primary mb-1">Primary Game</label>
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="w-full border-2 border-primary bg-white px-3 py-2 font-bold text-sm outline-none focus:bg-accent-yellow focus:ring-0"
            disabled={loading}
          >
            {games.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
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
            {loading ? "Creating..." : "Create Squad"}
          </button>
        </div>
      </form>
    </Modal>
  );
}