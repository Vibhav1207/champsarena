"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check session
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setSession(data.user);
          fetchNotifications();
        } else {
          setLoading(false);
          setError("You must be signed in to view notifications.");
        }
      })
      .catch(() => {
        setLoading(false);
        setError("Failed to authenticate session.");
      });
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      } else {
        setError("Failed to load notifications.");
      }
    } catch (err) {
      setError("An error occurred while loading notifications.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n: any) => {
    const isSquadInvite = n.message.toLowerCase().includes("invited you") || n.message.toLowerCase().includes("squad");
    if (isSquadInvite) {
      if (!n.read) {
        await handleMarkAsRead(n.id);
      }
      router.push("/profile?tab=squad");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Navigation />
      <main className="max-w-container-max mx-auto px-md py-xl min-h-[70vh]">
        <div className="w-full max-w-[800px] mx-auto space-y-md">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-sm bg-accent-yellow border-4 border-primary p-sm md:p-md neo-brutalist-shadow-sm select-none">
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-primary">Notification Center</h1>
              <p className="text-xs font-bold text-primary/70 uppercase">Roster updates, match schedules, and dispute updates</p>
            </div>
            {session && notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-primary text-white border-2 border-primary font-black uppercase text-xs tracking-wider px-sm py-xs hover:bg-accent-red hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer shadow-sm"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {/* Loading / Error States */}
          {loading ? (
            <div className="border-4 border-primary p-lg text-center bg-white neo-brutalist-shadow-sm">
              <p className="text-primary font-black uppercase italic tracking-tighter text-lg animate-pulse">
                Fetching alert frequencies...
              </p>
            </div>
          ) : error ? (
            <div className="border-4 border-primary p-lg text-center bg-accent-red/10 neo-brutalist-shadow-sm">
              <p className="text-accent-red font-black uppercase tracking-wider text-sm">{error}</p>
              {!session && (
                <button
                  onClick={() => router.push("/login")}
                  className="mt-sm bg-primary text-white border-2 border-primary font-black uppercase text-xs tracking-widest py-2 px-4 hover:bg-accent-blue transition-colors cursor-pointer"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          ) : (
            /* Notifications List */
            <div className="bg-white border-4 border-primary p-md md:p-lg neo-brutalist-shadow text-primary space-y-sm">
              {notifications.length === 0 ? (
                <div className="py-lg text-center text-primary/60 font-bold uppercase select-none">
                  <span className="material-symbols-outlined text-4xl block mb-xs">notifications_off</span>
                  No alerts logged. You are completely up to date.
                </div>
              ) : (
                <div className="space-y-sm">
                  <AnimatePresence>
                    {notifications.map((n) => {
                      const isSquadInvite = n.message.toLowerCase().includes("invited you") || n.message.toLowerCase().includes("squad");
                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-md border-4 border-primary flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm transition-all ${
                            !n.read
                              ? "bg-accent-blue/10 border-accent-blue/40"
                              : "bg-white"
                          } ${isSquadInvite ? "cursor-pointer hover:bg-accent-yellow/10" : ""}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-xs">
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 border border-primary text-white ${
                                  n.type === "MATCH"
                                    ? "bg-accent-red"
                                    : n.type === "REGISTRATION"
                                    ? "bg-accent-yellow text-primary"
                                    : n.type === "PAYMENT"
                                    ? "bg-accent-blue"
                                    : "bg-primary"
                                }`}
                              >
                                {n.type}
                              </span>
                              <span className="text-[10px] text-primary/50 font-bold">
                                {new Date(n.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-body-md font-bold leading-snug">{n.message}</p>
                          </div>
                          {!n.read && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleMarkAsRead(n.id);
                                if (isSquadInvite) {
                                  router.push("/profile?tab=squad");
                                }
                              }}
                              className="bg-white text-primary border-2 border-primary px-sm py-1 text-xs font-black uppercase hover:bg-accent-yellow transition-colors cursor-pointer select-none self-end sm:self-auto"
                            >
                              Mark Read
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
