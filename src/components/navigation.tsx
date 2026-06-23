"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutTrainer } from "@/app/actions/authActions";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(data => { if (data?.user) setSession(data.user); })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (session) {
      // Fetch count
      fetch("/api/notifications/count")
        .then(r => r.json())
        .then(data => setUnreadCount(data.count || 0))
        .catch(() => {});
      
      // Fetch recent 5 notifications
      fetch("/api/notifications")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setNotifications(data.slice(0, 5));
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";

  const isActive = (path: string) => {
    if (path === "/tournaments" && pathname.startsWith("/tournaments")) return true;
    return pathname === path;
  };

  const getLinkCls = (path: string, activeColor: string) => {
    const base = "text-primary font-black uppercase text-[15px] tracking-tight transition-colors duration-150 py-1 px-2";
    if (isActive(path)) {
      return `${base} border-b-4 ${activeColor}`;
    }
    return `${base} hover:bg-accent-yellow`;
  };

  const getMobileLinkCls = (path: string, activeBg: string) => {
    const base = "text-primary font-black uppercase text-[16px] tracking-tight py-2 px-3 border-2 border-primary transition-all";
    if (isActive(path)) {
      return `${base} ${activeBg} neo-brutalist-shadow-sm`;
    }
    return `${base} bg-white hover:bg-accent-yellow`;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b-4 border-primary">
      <div className="flex justify-between items-center px-md py-sm max-w-container-max mx-auto h-20">

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-xs hover:opacity-95 transition-all">
          <img src="/logo.png" alt="ChampsArena Logo" className="w-20 h-20 object-contain flex-shrink-0" />
          <span className="font-bold text-[22px] md:text-[26px] uppercase tracking-tighter bg-primary text-white px-3 py-1 select-none">
            ChampsArena
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-md">
          <Link href="/games" className={getLinkCls("/games", "border-accent-blue")}>Games</Link>
          <Link href="/tournaments" className={getLinkCls("/tournaments", "border-accent-red")}>Tournaments</Link>
          <Link href="/rankings" className={getLinkCls("/rankings", "border-accent-yellow")}>Rankings</Link>
          {isAdmin && (
            <Link href="/admin" className={getLinkCls("/admin", "border-accent-blue")}>
              Admin
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-md">
          {/* Search (desktop) */}
          <div className="hidden lg:flex relative items-center">
            <input
              type="text"
              placeholder="SEARCH..."
              className="bg-white border-4 border-primary rounded-none px-sm py-xs pl-10 text-body-md focus:outline-none focus:ring-0 transition-all font-bold placeholder:text-primary/50 w-48"
            />
            <span className="material-symbols-outlined absolute left-3 text-primary font-bold">search</span>
          </div>

          <div className="flex items-center gap-sm">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative material-symbols-outlined text-primary hover:text-accent-red hover:scale-110 transition-all font-bold cursor-pointer flex items-center justify-center p-1"
              >
                notifications
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-red text-white border-2 border-primary text-[10px] font-black px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-none shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border-4 border-primary neo-brutalist-shadow-sm z-50 text-primary">
                  <div className="p-sm border-b-4 border-primary bg-accent-yellow flex justify-between items-center">
                    <span className="font-black text-sm uppercase tracking-tight">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-black underline uppercase hover:text-accent-red"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-md text-center text-sm font-bold text-primary/60">No notifications</p>
                    ) : (
                      notifications.map((n) => {
                        const isSquadInvite = n.message.toLowerCase().includes("invited you") || n.message.toLowerCase().includes("squad");
                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (isSquadInvite) {
                                if (!n.read) {
                                  markAsRead(n.id);
                                }
                                setIsOpen(false);
                                router.push("/profile?tab=squad");
                              }
                            }}
                            className={`p-sm border-b-2 border-primary flex items-start justify-between gap-xs transition-colors hover:bg-slate-50 ${
                              !n.read ? "bg-accent-blue/10" : ""
                            } ${isSquadInvite ? "cursor-pointer hover:bg-accent-yellow/10" : ""}`}
                          >
                            <div className="flex-1">
                              <p className="text-[13px] font-medium leading-tight">{n.message}</p>
                              <span className="text-[10px] text-primary/50 font-bold">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {!n.read && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await markAsRead(n.id);
                                  if (isSquadInvite) {
                                    setIsOpen(false);
                                    router.push("/profile?tab=squad");
                                  }
                                }}
                                className="text-[10px] font-black text-accent-blue uppercase hover:underline cursor-pointer"
                              >
                                Read
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-sm bg-slate-50 border-t-2 border-primary text-center">
                    <Link
                      href="/notifications"
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-black uppercase text-primary hover:underline hover:text-accent-red"
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {session ? (
              /* Logged-in avatar */
              <Link href="/profile" title={session.name || "Profile"}
                className="w-9 h-9 rounded-full bg-accent-yellow text-primary flex items-center justify-center font-bold text-sm border-2 border-primary overflow-hidden hover:scale-105 transition-transform">
                {session.image
                  ? <img src={session.image} alt={session.name || "You"} className="w-full h-full object-cover" />
                  : (session.name || "?")[0].toUpperCase()}
              </Link>
            ) : (
              <Link href="/profile" className="material-symbols-outlined text-primary hover:text-accent-blue hover:scale-115 transition-all font-bold">
                person
              </Link>
            )}

            <Link href="/login"
              className="hidden sm:block bg-primary text-white px-sm py-2 border-2 border-primary font-bold uppercase tracking-widest text-[13px] neo-brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-accent-blue transition-colors">
              {session ? "Dashboard" : "Register"}
            </Link>

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-primary hover:bg-accent-yellow transition-colors flex items-center justify-center w-10 h-10 border-2 border-primary font-bold">
              <span className="material-symbols-outlined">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t-4 border-primary p-md flex flex-col gap-sm z-50">
          <Link href="/games" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkCls("/games", "bg-accent-blue/20")}>
            Games
          </Link>
          <Link href="/tournaments" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkCls("/tournaments", "bg-accent-red/20")}>
            Tournaments
          </Link>
          <Link href="/rankings" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkCls("/rankings", "bg-accent-yellow/20")}>
            Rankings
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)}
              className={getMobileLinkCls("/admin", "bg-accent-blue/20")}>
              Admin Panel
            </Link>
          )}
          {session ? (
            <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkCls("/profile", "bg-accent-blue/20")}>
              Profile / Dashboard
            </Link>
          ) : (
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkCls("/login", "bg-accent-blue/20")}>
              Register / Sign In
            </Link>
          )}
          {session && (
            <div className="flex flex-col gap-xs py-sm border-t-2 border-primary mt-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent-yellow border-2 border-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(session.name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{session.name}</p>
                  <p className="text-xs text-primary/70">{session.email}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  try {
                    await logoutTrainer();
                  } catch (err) {
                    console.error("Sign out failed", err);
                  }
                }}
                className="text-left text-xs font-black text-accent-red hover:underline flex items-center gap-1 mt-2 pl-1"
              >
                <span className="material-symbols-outlined text-[14px]">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
