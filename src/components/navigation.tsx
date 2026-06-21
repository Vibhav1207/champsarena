"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/tournaments" && pathname.startsWith("/tournaments")) {
      return true;
    }
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-surface dark:bg-surface-container-low border-b border-outline-variant dark:border-outline shadow-sm">
      <div className="flex justify-between items-center px-md py-sm max-w-container-max mx-auto h-16">
        {/* Brand Logo */}
        <div className="flex items-center gap-xs">
          <Link
            href="/"
            className="font-display-lg text-display-lg text-tertiary dark:text-on-tertiary-container tracking-tight text-[24px] hover:opacity-90 active:scale-95 transition-all"
          >
            Pokémon Champions
          </Link>
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-lg">
          <Link
            href="/tournaments"
            className={`${
              isActive("/tournaments")
                ? "text-tertiary font-bold border-b-2 border-tertiary pb-1"
                : "text-on-surface-variant font-medium hover:text-tertiary"
            } transition-colors duration-200 font-title-lg text-[16px]`}
          >
            Tournaments
          </Link>
          <Link
            href="/rankings"
            className={`${
              isActive("/rankings")
                ? "text-tertiary font-bold border-b-2 border-tertiary pb-1"
                : "text-on-surface-variant font-medium hover:text-tertiary"
            } transition-colors duration-200 font-title-lg text-[16px]`}
          >
            Rankings
          </Link>
          <Link
            href="/profile"
            className={`${
              isActive("/profile")
                ? "text-tertiary font-bold border-b-2 border-tertiary pb-1"
                : "text-on-surface-variant font-medium hover:text-tertiary"
            } transition-colors duration-200 font-title-lg text-[16px]`}
          >
            Profile
          </Link>
        </nav>

        {/* Actions Area */}
        <div className="flex items-center gap-md">
          {/* Search Bar (Desktop only) */}
          <div className="hidden lg:flex relative items-center">
            <input
              type="text"
              placeholder="Search tournaments..."
              className="bg-surface-container border border-outline-variant rounded-full px-sm py-xs pl-10 text-body-md focus:outline-none focus:ring-2 focus:ring-tertiary transition-all outline-none"
            />
            <span className="material-symbols-outlined absolute left-3 text-outline">
              search
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-sm">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-tertiary transition-transform active:scale-95">
              notifications
            </button>
            <Link
              href="/profile"
              className="material-symbols-outlined text-on-surface-variant hover:text-tertiary transition-transform active:scale-95"
            >
              person
            </Link>
            <Link
              href="/login"
              className="bg-tertiary text-on-tertiary px-sm py-xs rounded-lg font-label-lg transition-transform hover:brightness-110 active:scale-95 shadow-sm text-center"
            >
              Register
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden material-symbols-outlined text-on-surface-variant hover:text-tertiary transition-transform active:scale-95"
            >
              {mobileMenuOpen ? "close" : "menu"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-outline-variant px-md py-sm flex flex-col gap-sm animate-in slide-in-from-top duration-200">
          <Link
            href="/tournaments"
            onClick={() => setMobileMenuOpen(false)}
            className={`${
              isActive("/tournaments")
                ? "text-tertiary font-bold pl-2 border-l-2 border-tertiary"
                : "text-on-surface-variant font-medium"
            } py-xs`}
          >
            Tournaments
          </Link>
          <Link
            href="/rankings"
            onClick={() => setMobileMenuOpen(false)}
            className={`${
              isActive("/rankings")
                ? "text-tertiary font-bold pl-2 border-l-2 border-tertiary"
                : "text-on-surface-variant font-medium"
            } py-xs`}
          >
            Rankings
          </Link>
          <Link
            href="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={`${
              isActive("/profile")
                ? "text-tertiary font-bold pl-2 border-l-2 border-tertiary"
                : "text-on-surface-variant font-medium"
            } py-xs`}
          >
            Profile
          </Link>

          {/* Search bar inside mobile drawer */}
          <div className="relative flex items-center mt-xs">
            <input
              type="text"
              placeholder="Search tournaments..."
              className="w-full bg-surface-container border border-outline-variant rounded-full px-sm py-xs pl-10 text-body-md focus:outline-none focus:ring-2 focus:ring-tertiary outline-none"
            />
            <span className="material-symbols-outlined absolute left-3 text-outline">
              search
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
