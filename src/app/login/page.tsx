"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Sign up fields
  const [trainerName, setTrainerName] = useState("");
  const [favPokemon, setFavPokemon] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Logged in as: ${email}`);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      alert("Please agree to the Tournament Rules & Regulations.");
      return;
    }
    alert(`Registered Trainer: ${trainerName} (Favorite: ${favPokemon})`);
  };

  return (
    <main className="h-screen w-full flex flex-col lg:flex-row items-stretch overflow-hidden relative bg-background">
      {/* Illustration Section (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-surface-container-high relative overflow-hidden items-center justify-center">
        <div className="relative z-10 w-full max-w-xl p-xl text-center flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-lg hover:scale-105 duration-700 transition-transform relative w-full h-[320px]"
          >
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_GGm1TdSujnJMPpV26nMMZ9ErqzNLiFieUPof4Wwl3D5ExarqL9tyrRvWXAJDP-fJPCvXmnGBSCmA38MuTs0JZ2hBh8-oDE0gSe7vARjHZ6POhuHOQcetNUJ5CzOBf5RUgBVY0wQp0RngnafcmCuotXRxGx3r9GdWq-KQW_ddzbhoiGiIpOx6BJCYEJBSw8KgaHVFnba8U3mgsGU9cEAmGP7XW_e407Z3ExFiI2GXMG8hi_qSBIJWwDvQ1qCRfLNL3yYaN0jjxB0"
              alt="Two modern Pokémon trainers in athletic tournament gear"
              fill
              priority
              className="object-contain drop-shadow-2xl"
              sizes="576px"
            />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="font-display-lg text-display-lg text-tertiary mb-sm tracking-tight leading-tight font-bold"
          >
            Pokémon Champions
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="font-title-lg text-title-lg text-on-surface-variant max-w-md mx-auto"
          >
            The elite circuit for the world&apos;s most dedicated trainers. Your journey to the Master Class begins here.
          </motion.p>

          {/* Bento Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-xl grid grid-cols-3 gap-md w-full"
          >
            <div className="bg-white/40 p-md rounded-xl backdrop-blur-sm border border-white/50 text-center shadow-sm">
              <span className="block font-headline-md text-headline-md text-tertiary font-bold">2.4k</span>
              <span className="font-label-lg text-label-lg uppercase tracking-widest text-on-surface-variant font-semibold">Tournaments</span>
            </div>
            <div className="bg-white/40 p-md rounded-xl backdrop-blur-sm border border-white/50 text-center shadow-sm">
              <span className="block font-headline-md text-headline-md text-tertiary font-bold">150k</span>
              <span className="font-label-lg text-label-lg uppercase tracking-widest text-on-surface-variant font-semibold">Trainers</span>
            </div>
            <div className="bg-white/40 p-md rounded-xl backdrop-blur-sm border border-white/50 text-center shadow-sm">
              <span className="block font-headline-md text-headline-md text-tertiary font-bold">89</span>
              <span className="font-label-lg text-label-lg uppercase tracking-widest text-on-surface-variant font-semibold">Regions</span>
            </div>
          </motion.div>
        </div>

        {/* Animated Particles */}
        <div className="absolute top-20 left-20 w-12 h-12 bg-tertiary/10 rounded-full animate-bounce" style={{ animationDuration: "3s" }}></div>
        <div className="absolute bottom-40 right-20 w-16 h-16 bg-on-tertiary-container/10 rounded-full animate-pulse" style={{ animationDuration: "4s" }}></div>
      </div>

      {/* Form Section */}
      <div className="flex-1 h-full overflow-y-auto custom-scroll bg-background flex items-center justify-center p-sm md:p-xl">
        <div className="w-full max-w-lg">
          {/* Mobile Logo (Visible on mobile only) */}
          <div className="lg:hidden text-center mb-xl select-none">
            <Link href="/" className="font-display-lg text-display-lg text-tertiary tracking-tight font-bold hover:opacity-90">
              Pokémon Champions
            </Link>
            <p className="text-on-surface-variant font-body-lg uppercase tracking-wider font-semibold text-[13px] mt-1">
              Master Class Series
            </p>
          </div>

          {/* Trainer Card Box */}
          <div className="bg-surface-container-lowest trainer-card-shadow rounded-xl overflow-hidden border border-outline-variant flex flex-col min-h-[600px]">
            {/* Header Tabs */}
            <div className="flex border-b border-outline-variant select-none">
              <button
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-md font-title-lg text-title-lg relative transition-colors duration-200 font-semibold focus:outline-none ${
                  activeTab === "login" ? "text-tertiary" : "text-on-surface-variant hover:text-tertiary"
                }`}
              >
                Login
                {activeTab === "login" && (
                  <motion.div layoutId="tab-indicator" className="active-tab-indicator" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("signup")}
                className={`flex-1 py-md font-title-lg text-title-lg relative transition-colors duration-200 font-semibold focus:outline-none ${
                  activeTab === "signup" ? "text-tertiary" : "text-on-surface-variant hover:text-tertiary"
                }`}
              >
                Sign Up
                {activeTab === "signup" && (
                  <motion.div layoutId="tab-indicator" className="active-tab-indicator" />
                )}
              </button>
            </div>

            <div className="p-lg flex-grow flex flex-col justify-between">
              <AnimatePresence mode="wait">
                {activeTab === "login" ? (
                  /* Login View */
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleLoginSubmit}
                    className="space-y-md"
                  >
                    <div className="text-center mb-md select-none">
                      <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                        Welcome Back, Trainer
                      </h2>
                      <p className="font-body-md text-on-surface-variant">
                        Sign in to continue your championship journey.
                      </p>
                    </div>

                    {/* Social OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-sm">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-xs p-sm rounded-lg border border-outline-variant hover:bg-surface-container-low transition-all duration-200 active:scale-[0.98]"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                        </svg>
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">Google</span>
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center gap-xs p-sm rounded-lg border border-outline-variant hover:bg-surface-container-low transition-all duration-200 active:scale-[0.98]"
                      >
                        <svg className="w-5 h-5" fill="#5865F2" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.721 11.721 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"></path>
                        </svg>
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">Discord</span>
                      </button>
                    </div>

                    <div className="relative flex items-center py-base select-none">
                      <div className="flex-grow border-t border-outline-variant"></div>
                      <span className="flex-shrink mx-sm text-label-lg text-outline font-semibold uppercase text-[10px]">
                        or use email
                      </span>
                      <div className="flex-grow border-t border-outline-variant"></div>
                    </div>

                    {/* Email/Password Fields */}
                    <div className="space-y-sm">
                      <div className="space-y-xs">
                        <label className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ash.ketchum@palette.com"
                          className="w-full bg-white border border-outline-variant rounded-lg p-sm font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-xs">
                        <div className="flex justify-between items-center">
                          <label className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                            Password
                          </label>
                          <Link
                            href="#"
                            className="text-tertiary font-label-lg hover:underline font-semibold"
                          >
                            Forgot?
                          </Link>
                        </div>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-outline-variant rounded-lg p-sm font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center gap-xs select-none">
                      <input
                        type="checkbox"
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="pokeball-checkbox"
                      />
                      <label
                        htmlFor="remember"
                        className="font-body-md text-on-surface-variant cursor-pointer font-medium"
                      >
                        Remember me for 30 days
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-tertiary text-on-primary py-md rounded-lg font-title-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all duration-200 border-b-2 border-on-tertiary-fixed-variant font-bold text-center"
                    >
                      Enter the Stadium
                    </button>
                  </motion.form>
                ) : (
                  /* Sign Up View */
                  <motion.form
                    key="signup"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSignupSubmit}
                    className="space-y-md"
                  >
                    <div className="text-center mb-md select-none">
                      <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                        Begin Your Legend
                      </h2>
                      <p className="font-body-md text-on-surface-variant">
                        Create your trainer profile and join the circuit.
                      </p>
                    </div>

                    {/* Two Column Name & Favourite */}
                    <div className="grid grid-cols-2 gap-sm">
                      <div className="space-y-xs">
                        <label className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                          Trainer Name
                        </label>
                        <input
                          type="text"
                          required
                          value={trainerName}
                          onChange={(e) => setTrainerName(e.target.value)}
                          placeholder="Red"
                          className="w-full bg-white border border-outline-variant rounded-lg p-sm font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-xs">
                        <label className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                          Favorite Pokémon
                        </label>
                        <input
                          type="text"
                          required
                          value={favPokemon}
                          onChange={(e) => setFavPokemon(e.target.value)}
                          placeholder="Charizard"
                          className="w-full bg-white border border-outline-variant rounded-lg p-sm font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Email/Password Fields */}
                    <div className="space-y-sm">
                      <div className="space-y-xs">
                        <label className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          placeholder="champion@league.com"
                          className="w-full bg-white border border-outline-variant rounded-lg p-sm font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-xs">
                        <label className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider font-semibold text-[11px]">
                          Create Password
                        </label>
                        <input
                          type="password"
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-outline-variant rounded-lg p-sm font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Info banner */}
                    <div className="bg-surface-container-low p-sm rounded-lg flex items-start gap-sm select-none">
                      <span className="material-symbols-outlined text-tertiary mt-0.5">
                        info
                      </span>
                      <p className="text-label-lg text-on-surface-variant font-medium">
                        Your Trainer Name will be your public identifier in tournament brackets and rankings.
                      </p>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-center gap-xs select-none">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="pokeball-checkbox"
                      />
                      <label
                        htmlFor="terms"
                        className="font-body-md text-on-surface-variant cursor-pointer font-medium"
                      >
                        I agree to the Tournament Rules & Regulations
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-tertiary text-on-primary py-md rounded-lg font-title-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all duration-200 border-b-2 border-on-tertiary-fixed-variant font-bold text-center"
                    >
                      Register as Trainer
                    </button>

                    <div className="relative flex items-center py-base select-none">
                      <div className="flex-grow border-t border-outline-variant"></div>
                      <span className="flex-shrink mx-sm text-label-lg text-outline font-semibold uppercase text-[10px]">
                        or join with
                      </span>
                      <div className="flex-grow border-t border-outline-variant"></div>
                    </div>

                    {/* Social OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-sm">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-xs p-sm rounded-lg border border-outline-variant hover:bg-surface-container-low transition-all duration-200 active:scale-[0.98]"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                        </svg>
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">Google</span>
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center gap-xs p-sm rounded-lg border border-outline-variant hover:bg-surface-container-low transition-all duration-200 active:scale-[0.98]"
                      >
                        <svg className="w-5 h-5" fill="#5865F2" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.721 11.721 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"></path>
                        </svg>
                        <span className="font-label-lg text-label-lg font-bold text-on-surface">Discord</span>
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Bottom Policy links */}
              <div className="mt-xl text-center space-y-sm border-t border-outline-variant/30 pt-sm select-none">
                <p className="font-body-md text-on-surface-variant text-[13px] font-medium">
                  By joining, you accept our{" "}
                  <Link href="#" className="text-tertiary hover:underline font-semibold">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-tertiary hover:underline font-semibold">
                    Terms of Service
                  </Link>
                  .
                </p>
                <div className="flex justify-center gap-md text-label-lg text-outline font-semibold uppercase text-[10px]">
                  <span>v2.4.0-CHAMPION</span>
                  <span>•</span>
                  <Link href="#" className="hover:text-tertiary">
                    Support
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Back Action */}
          <div className="mt-md text-center select-none">
            <Link
              href="/"
              className="inline-flex items-center gap-xs font-body-md text-on-surface-variant hover:text-tertiary transition-colors font-medium hover:scale-[1.02] active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
              Back to Champions Hub
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
