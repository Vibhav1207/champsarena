"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { logoutTrainer } from "@/app/actions/authActions";
import { usePopup } from "@/components/PopupProvider";

type TabId = "trainer" | "squad";

export default function Profile() {
  const { confirm } = usePopup();
  const [activeTab, setActiveTab] = useState<TabId>("trainer");
  const [profileData, setProfileData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Squad States
  const [squadData, setSquadData] = useState<any>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [squadLoading, setSquadLoading] = useState(true);
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [squadName, setSquadName] = useState("");
  const [squadLogo, setSquadLogo] = useState("");
  const [squadDesc, setSquadDesc] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [squadError, setSquadError] = useState<string | null>(null);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [joiningSquadId, setJoiningSquadId] = useState<string | null>(null);
  const [joiningSquadName, setJoiningSquadName] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // Edit Profile States
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editDiscord, setEditDiscord] = useState("");
  const [editTwitter, setEditTwitter] = useState("");
  const [editTwitch, setEditTwitch] = useState("");
  const [editYoutube, setEditYoutube] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const fetchProfile = () => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setProfileData(data.user);
          setEditUsername(data.user.username || "");
          setEditBio(data.user.bio || "");
          setEditCountry(data.user.country || "");
          setEditDiscord(data.user.discordUsername || "");
          
          try {
            const socials = data.user.socialLinks ? JSON.parse(data.user.socialLinks) : {};
            setEditTwitter(socials.twitter || "");
            setEditTwitch(socials.twitch || "");
            setEditYoutube(socials.youtube || "");
          } catch {
            setEditTwitter("");
            setEditTwitch("");
            setEditYoutube("");
          }

          if (data.matches && data.matches.length > 0) {
            const mappedHistory = data.matches.map((m: any) => {
              const isWinner = m.winnerId === data.user.id;
              return {
                event: m.tournament?.title || "Tournament Match",
                date: new Date(m.tournament?.startDate || m.updatedAt).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                }).replace(/\//g, "."),
                rank: isWinner ? "Win" : "Loss",
                points: isWinner ? "+15 CP" : "-10 CP",
                isWin: isWinner,
              };
            });
            setHistory(mappedHistory);
          } else {
            setHistory([]);
          }
        }
      })
      .catch((err) => console.log("Failed to fetch trainer profile", err))
      .finally(() => setLoading(false));
  };

  const fetchSquad = () => {
    setSquadLoading(true);
    fetch("/api/squads")
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSquadData(data.squad);
          setInvitations(data.invitations || []);
        }
      })
      .catch(err => console.log("Failed to load user squad status", err))
      .finally(() => setSquadLoading(false));
  };

  useEffect(() => {
    fetchProfile();
    fetchSquad();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const squadId = params.get("joinSquad");
      if (squadId) {
        setJoiningSquadId(squadId);
        fetch(`/api/squads/${squadId}`)
          .then(res => res.json())
          .then(data => {
            if (data?.squad?.name) {
              setJoiningSquadName(data.squad.name);
              setShowJoinModal(true);
            }
          })
          .catch(() => {});
      }
      const tab = params.get("tab");
      if (tab === "squad") {
        setActiveTab("squad");
      }
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUsername,
          bio: editBio,
          country: editCountry,
          discordUsername: editDiscord,
          socialLinks: JSON.stringify({
            twitter: editTwitter,
            twitch: editTwitch,
            youtube: editYoutube,
          }),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setEditError(data.error);
      } else {
        setShowEditProfile(false);
        fetchProfile();
      }
    } catch {
      setEditError("Failed to update trainer profile coordinates.");
    }
  };

  const handleCreateSquadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSquadError(null);
    try {
      const res = await fetch("/api/squads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: squadName,
          logo: squadLogo,
          description: squadDesc,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setSquadError(data.error);
      } else {
        setShowCreateSquad(false);
        setSquadName("");
        setSquadLogo("");
        setSquadDesc("");
        fetchSquad();
      }
    } catch {
      setSquadError("Failed to create squad.");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "squad_logo");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setSquadLogo(data.url);
      } else {
        alert(data.error || "Failed to upload logo.");
      }
    } catch {
      alert("Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSearchPlayers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteSearch.trim()) return;
    setSearching(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(inviteSearch)}`);
      const data = await res.json();
      if (data.error) {
        setInviteError(data.error);
        setSearchResults([]);
      } else {
        setSearchResults(data);
      }
    } catch {
      setInviteError("Failed to search trainers.");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInvitePlayerDirect = async (targetIdOrEmail: string) => {
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const res = await fetch("/api/squads/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchQuery: targetIdOrEmail }),
      });
      const data = await res.json();
      if (data.error) {
        setInviteError(data.error);
      } else {
        setInviteSuccess("Invitation dispatched successfully!");
        fetchSquad();
      }
    } catch {
      setInviteError("Failed to dispatch invitation.");
    }
  };

  const handleJoinSquadDirect = async () => {
    if (!joiningSquadId) return;
    setJoinError(null);
    try {
      const res = await fetch("/api/squads/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ squadId: joiningSquadId }),
      });
      const data = await res.json();
      if (data.error) {
        setJoinError(data.error);
      } else {
        setJoinSuccess(`Successfully joined ${joiningSquadName || "the squad"}!`);
        setShowJoinModal(false);
        if (typeof window !== "undefined") {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        fetchSquad();
        fetchProfile();
      }
    } catch {
      setJoinError("Failed to join squad.");
    }
  };

  const handleRespondInvite = async (invitationId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      const res = await fetch("/api/squads/invite", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        fetchSquad();
        fetchProfile();
      }
    } catch {
      alert("Failed to respond to invitation.");
    }
  };

  const handleRosterAction = async (targetUserId: string, action: "KICK" | "TRANSFER_CAPTAIN" | "SET_CO_CAPTAIN" | "REMOVE_CO_CAPTAIN" | "LEAVE") => {
    const confirmationMsg: Record<string, string> = {
      KICK: "Kick this trainer from the squad?",
      TRANSFER_CAPTAIN: "Transfer squad captain role to this member? This demotes your role to member.",
      SET_CO_CAPTAIN: "Appoint this trainer as Co-Captain?",
      REMOVE_CO_CAPTAIN: "Remove Co-Captain permissions from this trainer?",
      LEAVE: "Are you sure you want to leave this squad?",
    };

    if (!await confirm(confirmationMsg[action] || "Confirm roster modification?")) return;

    try {
      const res = await fetch("/api/squads/roster", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: targetUserId }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        fetchSquad();
        fetchProfile();
      }
    } catch {
      alert("Failed to execute roster operations.");
    }
  };

  const handleDisbandSquad = async () => {
    if (!squadData) return;
    if (!await confirm("Are you absolutely sure you want to disband and delete your squad? This action is permanent and cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/squads/${squadData.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert("Squad disbanded successfully.");
        fetchSquad();
        fetchProfile();
      }
    } catch {
      alert("Failed to disband squad.");
    }
  };

  const trainerName = profileData?.name || "Trainer";
  const trainerUsername = profileData?.username || "";
  const trainerId = profileData?.trainerId?.slice(0, 8) || "—";
  const elo = profileData?.elo ?? 1000;
  const wins = profileData?.wins ?? 0;
  const losses = profileData?.losses ?? 0;
  const image = profileData?.image || null;

  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  const earnedBadges = profileData?.wonTournaments
    ?.filter((t: any) => t.badgeName)
    .map((t: any) => ({
      name: t.badgeName,
      icon: t.badgeIcon || "workspace_premium",
    })) || [];

  return (
    <>
      <Navigation />

      <main className="max-w-container-max mx-auto px-md py-xl space-y-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-primary">
            <span className="material-symbols-outlined animate-spin text-5xl">progress_activity</span>
            <p className="text-lg font-bold uppercase tracking-wider">Loading trainer parameters…</p>
          </div>
        ) : (
          <>
            {/* Header Tabs */}
            <nav className="flex border-4 border-primary bg-white select-none overflow-x-auto whitespace-nowrap custom-scrollbar">
              <button 
                onClick={() => setActiveTab("trainer")}
                className={`flex-1 md:flex-none font-black uppercase py-md px-lg transition-all border-r-4 border-primary text-base cursor-pointer focus:outline-none ${activeTab === "trainer" ? "bg-primary text-white" : "text-primary hover:bg-accent-yellow"}`}
              >
                Trainer Profile
              </button>
              <button 
                onClick={() => setActiveTab("squad")}
                className={`flex-1 md:flex-none font-black uppercase py-md px-lg transition-all border-r-4 border-primary text-base cursor-pointer focus:outline-none ${activeTab === "squad" ? "bg-primary text-white" : "text-primary hover:bg-accent-yellow"}`}
              >
                Squad Roster Center
              </button>
            </nav>

            <AnimatePresence mode="wait">
              {activeTab === "trainer" ? (
                /* ── TRAINER PROFILE TAB ── */
                <motion.div 
                  key="trainer" 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }} 
                  transition={{ duration: 0.2 }}
                  className="space-y-xl"
                >
                  <section>
                    <div className="border-4 border-primary neo-brutalist-shadow flex flex-col md:flex-row bg-white relative">
                      
                      {/* ID Badge Tag */}
                      <div className="absolute -top-4 -right-4 bg-accent-yellow border-2 border-primary px-4 py-2 flex items-center gap-2 z-10 select-none">
                        <span className="font-bold text-xs uppercase tracking-widest text-primary">
                          ID: {trainerId}
                        </span>
                      </div>

                      {/* Left Block: Avatar, Username, Basic Controls */}
                      <div className="md:w-2/5 p-lg flex flex-col items-center md:items-start border-b-4 md:border-b-0 md:border-r-4 border-primary bg-white text-center md:text-left">
                        <div className="relative w-full max-w-[280px] mx-auto md:max-w-none md:mx-0 aspect-square border-4 border-primary mb-md overflow-hidden bg-surface-container-low select-none">
                          {image ? (
                            <Image
                              src={image}
                              alt={trainerName}
                              fill
                              className="object-cover grayscale contrast-125"
                              sizes="384px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-7xl text-primary bg-accent-yellow/20">
                              {trainerName[0]}
                            </div>
                          )}
                          <div className="absolute bottom-4 left-4 bg-white border-2 border-primary px-3 py-1 font-bold text-xs uppercase text-primary">
                            RANKED UNIT
                          </div>
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase leading-none tracking-tighter mb-2 text-primary">
                          Trainer {trainerName}
                        </h1>
                        
                        {trainerUsername && (
                          <p className="text-md font-bold uppercase text-accent-blue mb-2">
                            @{trainerUsername}
                          </p>
                        )}

                        {profileData?.country && (
                          <div className="flex items-center gap-1.5 font-black uppercase text-xs text-primary/75 mb-md select-none">
                            <span className="material-symbols-outlined text-[16px]">flag</span>
                            {profileData.country}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2 w-full select-none">
                          <button
                            onClick={() => setShowEditProfile(true)}
                            className="flex-grow bg-accent-yellow text-primary border-4 border-primary px-4 py-2 font-black uppercase tracking-widest text-xs hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:translate-x-0 active:translate-y-0 cursor-pointer"
                          >
                            Edit Profile
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await logoutTrainer();
                              } catch (err) {
                                console.error("Sign out failed", err);
                              }
                            }}
                            className="bg-accent-red text-white border-4 border-primary px-4 py-2 font-black uppercase tracking-widest text-xs hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:translate-x-0 active:translate-y-0 cursor-pointer"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>

                      {/* Right Block: Stats & Bio */}
                      <div className="md:w-3/5 flex flex-col justify-between divide-y-4 divide-primary text-left">
                        <div className="p-lg flex-grow space-y-md">
                          <span className="font-black text-xs uppercase tracking-widest text-primary/60 block">Trainer Biography</span>
                          {profileData?.bio ? (
                            <p className="font-bold text-sm uppercase text-primary/80 leading-relaxed whitespace-pre-line">
                              {profileData.bio}
                            </p>
                          ) : (
                            <p className="italic font-bold text-sm uppercase text-primary/30">
                              No trainer biography configured. Add some tactical coordinates.
                            </p>
                          )}

                          {profileData?.discordUsername && (
                            <div className="flex items-center gap-2 pt-xs select-none">
                              <span className="bg-[#5865F2] text-white px-2.5 py-1 border-2 border-primary font-black uppercase text-[10px] tracking-wide">Discord</span>
                              <span className="font-black text-sm uppercase text-primary">@{profileData.discordUsername}</span>
                            </div>
                          )}
                        </div>

                        <div className="p-lg flex flex-col justify-between group hover:bg-accent-yellow transition-colors duration-150 flex-grow select-none">
                          <span className="font-black text-xs uppercase tracking-widest text-primary/60 mb-4 block">Rank Status</span>
                          <div className="space-y-4">
                            <span className="text-4xl sm:text-5xl font-black uppercase block italic text-primary leading-none">
                              {elo > 2000 ? "Grand Master" : elo > 1500 ? "Veteran Tier" : elo > 1000 ? "Ace Tier" : "Rookie Tier"}
                            </span>
                            <div className="flex flex-wrap gap-sm pt-2">
                              <span className="bg-primary text-white inline-block px-3 py-1.5 text-[10px] font-bold uppercase">
                                ELO: {elo.toLocaleString()}
                              </span>
                              <span className="border-2 border-primary bg-white text-primary inline-block px-3 py-1.5 text-[10px] font-bold uppercase">
                                Win Rate: {winRate}% ({wins}W / {losses}L)
                              </span>
                              <span className="border-2 border-primary bg-white text-primary inline-block px-3 py-1.5 text-[10px] font-bold uppercase">
                                Accolades: {earnedBadges.length} Unlocked
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </section>

                  {/* Accolades and Mission Log Bento Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-sm text-left">
                    {/* Accolades Column */}
                    <div className="lg:col-span-1 space-y-md">
                      <h3 className="text-2xl font-black uppercase italic border-b-2 border-primary pb-2 text-primary select-none">Accolades</h3>
                      {earnedBadges.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4 select-none">
                          {earnedBadges.map((badge: any, idx: number) => (
                            <div
                              key={idx}
                              title={`${badge.name} - Unlocked`}
                              className="aspect-square border-4 border-primary flex flex-col items-center justify-center bg-accent-yellow neo-brutalist-shadow-sm hover:scale-105 transition-all cursor-help group p-1"
                            >
                              <span className="material-symbols-outlined text-3xl text-primary group-hover:rotate-12 transition-transform">
                                {badge.icon}
                              </span>
                              <span className="text-[8px] font-black text-center uppercase tracking-tighter line-clamp-2 px-0.5 mt-1 text-primary break-words w-full leading-none">
                                {badge.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border-4 border-dashed border-primary/45 p-md text-center bg-surface-container-low text-primary select-none flex flex-col items-center justify-center min-h-[160px]">
                          <span className="material-symbols-outlined text-5xl text-primary/30 mb-2">military_tech</span>
                          <span className="text-xs font-black uppercase">No Badges Unlocked</span>
                          <p className="text-[10px] text-primary/50 uppercase mt-1 font-bold">Win tournaments to earn accolades</p>
                        </div>
                      )}
                    </div>

                    {/* Mission Log (Match History) Column */}
                    <div className="lg:col-span-2 space-y-md">
                      <h3 className="text-2xl font-black uppercase italic border-b-2 border-primary pb-2 text-primary select-none">Mission Log</h3>
                      <div className="border-4 border-primary neo-brutalist-shadow bg-white overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                              <tr className="bg-primary text-white border-b-4 border-primary font-black uppercase text-xs tracking-wider select-none">
                                <th className="px-md py-4 border-r-2 border-white/20">Operation</th>
                                <th className="px-md py-4 border-r-2 border-white/20">Timestamp</th>
                                <th className="px-md py-4 border-r-2 border-white/20">Result</th>
                                <th className="px-md py-4 text-right">Yield</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y-4 divide-primary bg-white font-bold">
                              {history.length > 0 ? (
                                history.map((item, idx) => (
                                  <tr
                                    key={idx}
                                    className={`trainer-row border-b-4 border-primary transition-colors cursor-pointer ${item.isWin ? "hover:bg-accent-yellow" : "hover:bg-accent-blue hover:text-white"}`}
                                  >
                                    <td className="px-md py-4 font-black uppercase">{item.event}</td>
                                    <td className="px-md py-4 text-sm uppercase tracking-wider">{item.date}</td>
                                    <td className="px-md py-4">
                                      <span className={`px-3 py-1 font-black text-xs uppercase ${item.isWin ? "bg-primary text-white" : "border-2 border-primary text-primary bg-white"}`}>
                                        {item.rank}
                                      </span>
                                    </td>
                                    <td className="px-md py-4 text-right font-black text-lg">{item.points}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="text-center py-12 text-primary font-black uppercase italic select-none">
                                    <span className="material-symbols-outlined text-4xl block mb-2 text-primary">history</span>
                                    No operations logged yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* ── SQUAD CENTER TAB ── */
                <motion.div 
                  key="squad" 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }} 
                  transition={{ duration: 0.2 }}
                  className="space-y-xl text-left"
                >
                  {squadLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-primary">
                      <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
                      <p className="font-black uppercase text-xs tracking-wider mt-sm">Syncing roster logs…</p>
                    </div>
                  ) : squadData ? (
                    /* ── Active Squad Layout ── */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-md lg:gap-xl">
                      {/* Left: Squad Overview Info */}
                      <div className="lg:col-span-4 space-y-md">
                        <div className="border-4 border-primary bg-white p-md neo-brutalist-shadow space-y-md">
                          <div className="relative w-full aspect-square border-4 border-primary bg-surface-container overflow-hidden flex items-center justify-center select-none">
                            {squadData.logo ? (
                              <img src={squadData.logo} alt={squadData.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-6xl text-primary/40">groups</span>
                            )}
                          </div>

                          <div className="text-left">
                            <h2 className="text-3xl font-black uppercase leading-none text-primary">{squadData.name}</h2>
                            <p className="text-xs font-black uppercase text-accent-blue mt-1">ESTABLISHED: {new Date(squadData.createdAt).toLocaleDateString()}</p>
                          </div>

                          <p className="text-xs font-bold uppercase text-primary/80 leading-relaxed border-t-2 border-primary pt-md">
                            {squadData.description || "No squad biography configured."}
                          </p>

                          <div className="border-t-2 border-primary pt-md flex justify-between items-center select-none font-bold text-xs uppercase">
                            <span>Roster Count</span>
                            <span className="font-black text-sm">{squadData.members.length} / 6</span>
                          </div>

                          {/* Invite Link section */}
                          <div className="border-t-2 border-primary pt-md space-y-xs text-xs">
                            <span className="font-black uppercase text-[10px] text-primary/60 block">Squad Invite Link</span>
                            <div className="flex gap-1 select-none">
                              <input
                                type="text"
                                readOnly
                                value={typeof window !== "undefined" ? `${window.location.origin}/profile?joinSquad=${squadData.id}` : ""}
                                className="flex-grow bg-surface-container-high border-2 border-primary px-2 py-1 text-[10px] font-mono outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof window !== "undefined") {
                                    navigator.clipboard.writeText(`${window.location.origin}/profile?joinSquad=${squadData.id}`);
                                    alert("Squad Invite Link copied to clipboard!");
                                  }
                                }}
                                className="bg-primary text-white border-2 border-primary px-2 py-1 font-black uppercase text-[9px] hover:bg-accent-blue cursor-pointer shrink-0"
                              >
                                Copy
                              </button>
                            </div>
                          </div>

                          <div className="pt-xs">
                            {squadData.captainId === profileData.id ? (
                              <button
                                onClick={handleDisbandSquad}
                                className="w-full bg-accent-red text-white border-2 border-primary py-2.5 font-black uppercase text-xs tracking-widest hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer hover:bg-red-700"
                              >
                                Disband Squad
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRosterAction(profileData.id, "LEAVE")}
                                className="w-full bg-accent-red text-white border-2 border-primary py-2.5 font-black uppercase text-xs tracking-widest hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                              >
                                Leave Squad
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Roster Management & Invites */}
                      <div className="lg:col-span-8 space-y-lg">
                        {/* Roster members list */}
                        <div className="border-4 border-primary bg-white neo-brutalist-shadow overflow-hidden">
                          <div className="p-sm bg-surface-container-low border-b-2 border-primary select-none text-left">
                            <h3 className="font-black text-lg uppercase">Squad Roster</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-primary text-white border-b-2 border-primary font-black uppercase text-[10px] tracking-wider select-none">
                                  <th className="px-sm py-3 border-r-2 border-white/10">Trainer</th>
                                  <th className="px-sm py-3 border-r-2 border-white/10">Role</th>
                                  <th className="px-sm py-3 border-r-2 border-white/10">ELO</th>
                                  <th className="px-sm py-3 text-right">Roster Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y-2 divide-primary font-bold text-xs uppercase">
                                {squadData.members.map((member: any) => {
                                  const isTargetCaptain = squadData.captainId === member.id;
                                  const isTargetCoCaptain = squadData.coCaptainId === member.id;
                                  const amICaptain = squadData.captainId === profileData.id;
                                  const amICoCaptain = squadData.coCaptainId === profileData.id;

                                  let roleLabel = "MEMBER";
                                  if (isTargetCaptain) roleLabel = "CAPTAIN";
                                  else if (isTargetCoCaptain) roleLabel = "CO-CAPTAIN";

                                  return (
                                    <tr key={member.id} className="hover:bg-accent-yellow/10">
                                      <td className="px-sm py-3">
                                        <div className="flex items-center gap-sm">
                                          <div className="w-7 h-7 rounded-full bg-accent-yellow border border-primary overflow-hidden flex items-center justify-center font-bold text-xs select-none">
                                            {member.image ? <img src={member.image} alt={member.name} className="w-full h-full object-cover" /> : member.name[0].toUpperCase()}
                                          </div>
                                          <span className="font-black">
                                            {member.name || member.username || "Trainer"}
                                            {member.username && member.username !== "trainer" && ` (@${member.username})`}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-sm py-3">
                                        <span className={`px-2 py-0.5 text-[9px] font-black border ${isTargetCaptain ? "bg-primary text-white border-primary" : isTargetCoCaptain ? "bg-accent-blue text-white border-accent-blue" : "border-primary"}`}>
                                          {roleLabel}
                                        </span>
                                      </td>
                                      <td className="px-sm py-3 font-black">{member.elo}</td>
                                      <td className="px-sm py-3 text-right select-none">
                                        {/* Roster Controls */}
                                        {member.id !== profileData.id && (
                                          <div className="flex flex-wrap md:flex-nowrap gap-1 justify-end">
                                            {amICaptain && (
                                              <>
                                                {isTargetCoCaptain ? (
                                                  <button onClick={() => handleRosterAction(member.id, "REMOVE_CO_CAPTAIN")} className="bg-white border border-primary px-2 py-1 text-[9px] font-black hover:bg-accent-yellow cursor-pointer">DEMOTE</button>
                                                ) : (
                                                  <button onClick={() => handleRosterAction(member.id, "SET_CO_CAPTAIN")} className="bg-white border border-primary px-2 py-1 text-[9px] font-black hover:bg-accent-yellow cursor-pointer">PROMOTE</button>
                                                )}
                                                <button onClick={() => handleRosterAction(member.id, "TRANSFER_CAPTAIN")} className="bg-white border border-primary px-2 py-1 text-[9px] font-black hover:bg-accent-yellow cursor-pointer">MAKE CAPTAIN</button>
                                              </>
                                            )}
                                            {/* Kick permissions: Captain can kick anyone; Co-captain can kick regular members */}
                                            {(amICaptain || (amICoCaptain && !isTargetCaptain && !isTargetCoCaptain)) && (
                                              <button onClick={() => handleRosterAction(member.id, "KICK")} className="bg-accent-red text-white border border-primary px-2 py-1 text-[9px] font-black hover:bg-red-700 cursor-pointer">KICK</button>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Invite Members Block */}
                        {(squadData.captainId === profileData.id || squadData.coCaptainId === profileData.id) && (
                          <div className="border-4 border-primary bg-white p-sm neo-brutalist-shadow space-y-sm">
                            <h3 className="font-black text-lg uppercase select-none">Invite New Members</h3>
                            <p className="text-[10px] font-bold text-primary/60 uppercase select-none">Search players by username, email, or user ID to dispatch invitations.</p>
                            
                            {inviteError && <div className="p-2 bg-red-100 border border-accent-red text-accent-red text-xs font-bold uppercase">{inviteError}</div>}
                            {inviteSuccess && <div className="p-2 bg-green-100 border border-green-700 text-green-700 text-xs font-bold uppercase">{inviteSuccess}</div>}

                            <form onSubmit={handleSearchPlayers} className="flex gap-2">
                              <input
                                type="text"
                                required
                                value={inviteSearch}
                                onChange={e => setInviteSearch(e.target.value)}
                                placeholder="ash.ketchum or ash@pallet.com"
                                className="flex-grow bg-white border-2 border-primary px-sm py-2 text-xs font-bold focus:bg-accent-yellow outline-none uppercase placeholder:text-primary/30"
                              />
                              <button
                                type="submit"
                                className="bg-primary text-white border-2 border-primary px-md py-2 font-black uppercase text-xs hover:bg-accent-blue cursor-pointer"
                              >
                                {searching ? "Searching..." : "Search"}
                              </button>
                            </form>

                            {/* Search Results List */}
                            {searchResults.length > 0 && (
                              <div className="border-2 border-primary bg-surface-container-high p-xs space-y-xs max-h-[200px] overflow-y-auto mt-2">
                                {searchResults.map((user: any) => {
                                  const isMember = squadData?.members?.some((m: any) => m.id === user.id);
                                  const isInvited = squadData?.invitations?.some((invite: any) => invite.userId === user.id);
                                  return (
                                    <div key={user.id} className="flex justify-between items-center bg-white border-2 border-primary px-sm py-1.5 text-xs font-black uppercase">
                                      <div className="flex items-center gap-sm">
                                        <div className="w-6 h-6 rounded-full bg-accent-yellow border border-primary overflow-hidden flex items-center justify-center font-bold text-[10px] select-none">
                                          {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" /> : (user.name || "T")[0].toUpperCase()}
                                        </div>
                                        <div className="flex flex-col text-left">
                                          <span>{user.name || "Trainer"} {user.username && user.username !== "trainer" && `(@${user.username})`}</span>
                                          <span className="text-[8px] text-primary/50">ELO: {user.elo}</span>
                                        </div>
                                      </div>
                                      {isMember ? (
                                        <span className="text-[9px] font-black text-primary/50 border border-primary/20 px-2 py-1 bg-surface-container select-none">
                                          Member
                                        </span>
                                      ) : isInvited ? (
                                        <button
                                          type="button"
                                          disabled
                                          className="bg-surface-container-high text-primary/50 border border-primary/20 px-2 py-1 text-[9px] font-black cursor-not-allowed select-none"
                                        >
                                          Invited
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleInvitePlayerDirect(user.id)}
                                          className="bg-primary text-white border border-primary px-2 py-1 text-[9px] font-black hover:bg-accent-blue cursor-pointer"
                                        >
                                          Invite
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ── Empty State / Received Invites ── */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md lg:gap-xl">
                      {/* Left: received invites list */}
                      <div className="space-y-md">
                        <h3 className="text-2xl font-black uppercase italic border-b-2 border-primary pb-2 text-primary select-none">Invitations Received</h3>
                        {invitations.length > 0 ? (
                          <div className="space-y-md select-none">
                            {invitations.map((invite: any) => (
                              <div key={invite.id} className="border-4 border-primary bg-white p-sm neo-brutalist-shadow flex items-center justify-between">
                                <div className="flex items-center gap-sm">
                                  <div className="w-10 h-10 border-2 border-primary bg-accent-yellow flex items-center justify-center font-bold text-xs select-none">
                                    {invite.squad.logo ? <img src={invite.squad.logo} alt={invite.squad.name} className="w-full h-full object-cover" /> : "S"}
                                  </div>
                                  <div>
                                    <h4 className="font-black text-sm uppercase">{invite.squad.name}</h4>
                                    <span className="text-[9px] font-black text-primary/50 uppercase">Invite received: {new Date(invite.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleRespondInvite(invite.id, "ACCEPT")} className="bg-primary text-white border border-primary px-3 py-1.5 text-[10px] font-black hover:bg-accent-blue cursor-pointer">ACCEPT</button>
                                  <button onClick={() => handleRespondInvite(invite.id, "DECLINE")} className="bg-white text-accent-red border border-primary px-3 py-1.5 text-[10px] font-black hover:bg-red-50 cursor-pointer">DECLINE</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border-4 border-dashed border-primary/45 p-md text-center bg-surface-container-low text-primary select-none flex flex-col items-center justify-center min-h-[160px]">
                            <span className="material-symbols-outlined text-4xl text-primary/30 mb-2">inbox</span>
                            <span className="text-xs font-black uppercase">No Invitations</span>
                            <p className="text-[10px] text-primary/50 uppercase mt-1 font-bold">You haven't received team invites.</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Create squad widget */}
                      <div className="space-y-md">
                        <h3 className="text-2xl font-black uppercase italic border-b-2 border-primary pb-2 text-primary select-none">Create a Squad</h3>
                        <div className="border-4 border-primary bg-white p-md neo-brutalist-shadow text-center space-y-md">
                          <span className="material-symbols-outlined text-6xl text-primary/30 select-none">groups</span>
                          <h4 className="font-black text-lg uppercase select-none">Build Your Own Roster</h4>
                          <p className="text-xs font-bold uppercase text-primary/60 max-w-[320px] mx-auto select-none leading-relaxed">
                            Create a competitive roster to participate in multiplayer tournaments like Free Fire and Valorant.
                          </p>
                          <button
                            onClick={() => setShowCreateSquad(true)}
                            className="bg-accent-yellow text-primary border-4 border-primary px-lg py-2.5 font-black uppercase text-xs tracking-widest hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
                          >
                            Build Squad
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-sm backdrop-blur-sm">
          <div className="bg-white border-8 border-primary max-w-[512px] w-full p-md neo-brutalist-shadow space-y-md text-left text-primary uppercase font-bold text-xs">
            <div className="flex justify-between items-center border-b-4 border-primary pb-sm bg-accent-yellow -mx-md -mt-md p-sm select-none">
              <h3 className="font-black text-lg uppercase text-primary">Edit Trainer Profile</h3>
              <button onClick={() => setShowEditProfile(false)} className="material-symbols-outlined text-primary hover:opacity-75 cursor-pointer">close</button>
            </div>

            {editError && <div className="p-2 bg-red-100 border border-accent-red text-accent-red text-xs font-bold uppercase">{editError}</div>}

            <form onSubmit={handleUpdateProfile} className="space-y-sm">
              <div className="space-y-1">
                <label className="text-[10px] text-primary uppercase font-black tracking-widest">Trainer Username *</label>
                <input 
                  type="text"
                  required
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-white border-2 border-primary py-2 px-3 text-xs font-bold focus:bg-accent-yellow outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-primary uppercase font-black tracking-widest">Biography</label>
                <textarea 
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Tactical summary or coordinates..."
                  rows={3}
                  className="w-full bg-white border-2 border-primary py-2 px-3 text-xs font-bold focus:bg-accent-yellow outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div className="space-y-1">
                  <label className="text-[10px] text-primary uppercase font-black tracking-widest">Country</label>
                  <input 
                    type="text"
                    value={editCountry}
                    onChange={e => setEditCountry(e.target.value)}
                    placeholder="e.g. United Kingdom"
                    className="w-full bg-white border-2 border-primary py-2 px-3 text-xs font-bold focus:bg-accent-yellow outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-primary uppercase font-black tracking-widest">Discord Username</label>
                  <input 
                    type="text"
                    value={editDiscord}
                    onChange={e => setEditDiscord(e.target.value)}
                    placeholder="e.g. ash.ketchum"
                    className="w-full bg-white border-2 border-primary py-2 px-3 text-xs font-bold focus:bg-accent-yellow outline-none"
                  />
                </div>
              </div>

              {/* Social links */}
              <div className="border-t-2 border-primary pt-sm space-y-sm select-none">
                <span className="font-black text-[10px] tracking-widest block text-primary/60">Social accounts</span>
                <div className="grid grid-cols-3 gap-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black">Twitter/X</label>
                    <input type="text" value={editTwitter} onChange={e => setEditTwitter(e.target.value)} placeholder="Handle" className="w-full bg-white border-2 border-primary p-1.5 text-xs font-bold focus:bg-accent-yellow outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black">Twitch</label>
                    <input type="text" value={editTwitch} onChange={e => setEditTwitch(e.target.value)} placeholder="Channel" className="w-full bg-white border-2 border-primary p-1.5 text-xs font-bold focus:bg-accent-yellow outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black">YouTube</label>
                    <input type="text" value={editYoutube} onChange={e => setEditYoutube(e.target.value)} placeholder="Channel" className="w-full bg-white border-2 border-primary p-1.5 text-xs font-bold focus:bg-accent-yellow outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-sm pt-xs select-none">
                <button type="button" onClick={() => setShowEditProfile(false)} className="flex-1 bg-white border-2 border-primary py-2 font-black uppercase text-xs hover:bg-accent-yellow cursor-pointer">Cancel</button>
                <button type="submit" className="flex-grow bg-primary text-white border-2 border-primary py-2 font-black uppercase text-xs hover:bg-accent-blue cursor-pointer">Save Coordinates</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Squad Modal */}
      {showCreateSquad && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-sm backdrop-blur-sm">
          <div className="bg-white border-8 border-primary max-w-[512px] w-full p-md neo-brutalist-shadow space-y-md text-left text-primary uppercase font-bold text-xs">
            <div className="flex justify-between items-center border-b-4 border-primary pb-sm bg-accent-yellow -mx-md -mt-md p-sm select-none">
              <h3 className="font-black text-lg uppercase text-primary">Establish Squad Roster</h3>
              <button onClick={() => setShowCreateSquad(false)} className="material-symbols-outlined text-primary hover:opacity-75 cursor-pointer">close</button>
            </div>

            {squadError && <div className="p-2 bg-red-100 border border-accent-red text-accent-red text-xs font-bold uppercase">{squadError}</div>}

            <form onSubmit={handleCreateSquadSubmit} className="space-y-sm">
              <div className="space-y-1">
                <label className="text-[10px] text-primary uppercase font-black tracking-widest">Squad Name *</label>
                <input 
                  type="text"
                  required
                  value={squadName}
                  onChange={e => setSquadName(e.target.value)}
                  placeholder="e.g. Team Phoenix"
                  className="w-full bg-white border-2 border-primary py-2 px-3 text-xs font-bold focus:bg-accent-yellow outline-none"
                />
              </div>

              <div className="space-y-1 select-none">
                <label className="text-[10px] text-primary uppercase font-black tracking-widest block mb-1">Squad Logo</label>
                {squadLogo ? (
                  <div className="flex items-center gap-sm border-2 border-primary p-xs bg-surface-container-low">
                    <div className="w-12 h-12 border-2 border-primary overflow-hidden relative flex-shrink-0">
                      <img src={squadLogo} alt="Squad Logo Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-primary/60 font-black uppercase block">Uploaded</span>
                      <button
                        type="button"
                        onClick={() => setSquadLogo("")}
                        className="bg-accent-red text-white border border-primary px-1.5 py-0.5 text-[8px] font-black hover:bg-red-700 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-primary/50 hover:border-primary p-sm text-center bg-surface-container-low cursor-pointer flex flex-col items-center justify-center min-h-[80px] relative transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="material-symbols-outlined text-2xl text-primary/60 mb-0.5">upload_file</span>
                    <span className="text-[10px] font-black uppercase text-primary">
                      {uploadingLogo ? "Uploading..." : "Click to upload image"}
                    </span>
                    <span className="text-[8px] text-primary/50 font-bold uppercase">PNG, JPG, or GIF</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-primary uppercase font-black tracking-widest">Description</label>
                <textarea 
                  value={squadDesc}
                  onChange={e => setSquadDesc(e.target.value)}
                  placeholder="Describe your squad..."
                  rows={3}
                  className="w-full bg-white border-2 border-primary py-2 px-3 text-xs font-bold focus:bg-accent-yellow outline-none resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-sm pt-xs select-none">
                <button type="button" onClick={() => setShowCreateSquad(false)} className="flex-1 bg-white border-2 border-primary py-2 font-black uppercase text-xs hover:bg-accent-yellow cursor-pointer">Cancel</button>
                <button type="submit" className="flex-grow bg-primary text-white border-2 border-primary py-2 font-black uppercase text-xs hover:bg-accent-blue cursor-pointer">Establish Squad</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Squad Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-sm backdrop-blur-sm">
          <div className="bg-white border-8 border-primary max-w-[448px] w-full p-md neo-brutalist-shadow space-y-md text-left text-primary uppercase font-bold text-xs">
            <h3 className="font-headline-md text-primary uppercase text-center font-black">
              Squad Invitation Link
            </h3>
            
            <div className="bg-accent-yellow border-4 border-primary p-md text-center space-y-sm select-none">
              <span className="material-symbols-outlined text-5xl text-primary">groups</span>
              <p className="text-sm font-black uppercase text-primary leading-tight">
                You've been invited to join the squad:
              </p>
              <h4 className="text-2xl font-black uppercase text-accent-red leading-none mt-1">
                {joiningSquadName || "Loading..."}
              </h4>
            </div>

            {joinError && <div className="p-2 bg-red-100 border border-accent-red text-accent-red text-xs font-bold uppercase">{joinError}</div>}

            <p className="text-primary/70 font-bold uppercase text-[10px] select-none leading-relaxed text-center">
              Joining this squad will add your profile to their roster. You cannot join if you are already in a squad or if the roster is full.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm select-none">
              <button
                onClick={handleJoinSquadDirect}
                className="p-3 bg-primary text-white border-2 border-primary font-black uppercase text-xs text-center cursor-pointer active:translate-y-0.5"
              >
                Join Squad
              </button>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoiningSquadId(null);
                  setJoiningSquadName(null);
                  if (typeof window !== "undefined") {
                    window.history.replaceState({}, document.title, window.location.pathname);
                  }
                }}
                className="p-3 bg-white text-primary border-2 border-primary font-black uppercase text-xs text-center cursor-pointer hover:bg-accent-yellow"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Join Success Alert banner */}
      {joinSuccess && (
        <div className="fixed bottom-4 right-4 bg-accent-yellow border-4 border-primary p-md neo-brutalist-shadow-sm z-50 flex items-center gap-md font-black uppercase text-xs text-primary">
          <span>{joinSuccess}</span>
          <button onClick={() => setJoinSuccess(null)} className="material-symbols-outlined font-black text-sm hover:opacity-75 cursor-pointer">close</button>
        </div>
      )}
    </>
  );
}

export const dynamic = "force-dynamic";
