"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutTrainer } from "@/app/actions/authActions";

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(data => { if (data?.user) setSession(data.user); })
      .catch(() => {});
  }, []);

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
          <svg viewBox="0 0 100 100" className="w-8 h-8 flex-shrink-0">
            <circle cx="50" cy="50" r="48" fill="white" stroke="#1a1a1a" strokeWidth="6" />
            <path d="M 3 50 Q 3 3 50 3 Q 97 3 97 50 Z" fill="#FF3B3B" />
            <line x1="3" y1="50" x2="97" y2="50" stroke="#1a1a1a" strokeWidth="6" />
            <circle cx="50" cy="50" r="14" fill="white" stroke="#1a1a1a" strokeWidth="6" />
            <circle cx="50" cy="50" r="6" fill="#FFD700" />
          </svg>
          <span className="font-bold text-[22px] md:text-[26px] uppercase tracking-tighter bg-primary text-white px-3 py-1 select-none">
            ChampsArena
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-md">
          <Link href="/tournaments" className={getLinkCls("/tournaments", "border-accent-red")}>Tournaments</Link>
          <Link href="/rankings"    className={getLinkCls("/rankings", "border-accent-yellow")}>Rankings</Link>
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
            <button className="material-symbols-outlined text-primary hover:text-accent-red hover:scale-115 transition-all font-bold cursor-pointer">
              notifications
            </button>

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
              className="bg-primary text-white px-sm py-2 border-2 border-primary font-bold uppercase tracking-widest text-[13px] neo-brutalist-shadow-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-accent-blue transition-colors">
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
