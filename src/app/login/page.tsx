"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { loginTrainer, registerTrainer, socialLogin } from "@/app/actions/authActions";

type Tab = "login" | "signup";

const POKEBALL_BG = `radial-gradient(circle at 20% 50%, rgba(63,80,206,0.08) 0%, transparent 60%),
  radial-gradient(circle at 80% 20%, rgba(63,80,206,0.05) 0%, transparent 40%),
  radial-gradient(circle at 60% 80%, rgba(188,194,255,0.1) 0%, transparent 50%)`;

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Register state
  const [rName, setRName] = useState("");
  const [rFav, setRFav] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPass, setRPass] = useState("");
  const [rPassConfirm, setRPassConfirm] = useState("");
  const [rShowPass, setRShowPass] = useState(false);
  const [rTerms, setRTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Animated particles
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginTrainer({ email, password });
      if (res?.error) setError(res.error);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rTerms) { setError("Please agree to the Tournament Rules & Regulations."); return; }
    if (rPass !== rPassConfirm) { setError("Passwords do not match."); return; }
    if (rPass.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await registerTrainer({ name: rName, email: rEmail, password: rPass, favPokemon: rFav });
      if (res?.error) setError(res.error);
      else setSuccess("Account created! Signing you in...");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: "google" | "discord") => {
    setError(null);
    try { await socialLogin(provider); }
    catch { setError(`Failed to sign in with ${provider}.`); }
  };

  return (
    <div className="min-h-screen flex items-stretch" style={{ background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 40%, #0d0d20 100%)" }}>
      
      {/* ── Left Hero Panel ────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col items-center justify-center p-16">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 animate-pulse"
            style={{ background: "radial-gradient(circle, #3f50ce 0%, transparent 70%)", animationDuration: "4s" }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #5869e7 0%, transparent 70%)", animation: "pulse 6s ease-in-out infinite" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
            style={{ border: "1px solid #3f50ce" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ border: "1px solid #5869e7" }} />
        </div>

        {/* Floating particles */}
        {mounted && [
          { top: "15%", left: "10%", size: 8, delay: 0 },
          { top: "75%", left: "15%", size: 5, delay: 1 },
          { top: "30%", left: "85%", size: 10, delay: 2 },
          { top: "65%", left: "80%", size: 6, delay: 0.5 },
          { top: "50%", left: "5%", size: 4, delay: 1.5 },
        ].map((p, i) => (
          <motion.div key={i}
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
            className="absolute rounded-full"
            style={{ top: p.top, left: p.left, width: p.size, height: p.size, background: "#bcc2ff", opacity: 0.6 }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 text-center max-w-xl">
          {/* Pokeball icon */}
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}
            className="mx-auto mb-8 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: "linear-gradient(135deg, #3f50ce, #5869e7)", boxShadow: "0 0 60px rgba(63,80,206,0.5)" }}>
            <span className="material-symbols-outlined material-symbols-fill text-white" style={{ fontSize: 48 }}>catching_pokemon</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
            className="font-bold text-white mb-4" style={{ fontSize: "3rem", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Pokémon<br />
            <span style={{ color: "#bcc2ff" }}>Champions</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}
            className="text-blue-200 mb-12 text-lg leading-relaxed" style={{ color: "rgba(188,194,255,0.8)" }}>
            The elite circuit where legends are forged. Join 150,000+ trainers competing for the Master Class title.
          </motion.p>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
            className="grid grid-cols-3 gap-4">
            {[
              { val: "2.4k", label: "Tournaments" },
              { val: "150k", label: "Trainers" },
              { val: "89", label: "Regions" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl p-4 text-center"
                style={{ background: "rgba(63,80,206,0.2)", border: "1px solid rgba(188,194,255,0.2)", backdropFilter: "blur(10px)" }}>
                <div className="font-bold text-2xl text-white">{s.val}</div>
                <div className="text-xs font-semibold uppercase tracking-widest mt-0.5" style={{ color: "rgba(188,194,255,0.7)" }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Right Form Panel ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 overflow-y-auto" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}>
        <div className="w-full max-w-[440px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #3f50ce, #5869e7)" }}>
                <span className="material-symbols-outlined material-symbols-fill text-white text-xl">catching_pokemon</span>
              </div>
              <span className="font-bold text-2xl text-white">Pokémon Champions</span>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(30px)" }}>

            {/* Tabs */}
            <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {(["login", "signup"] as Tab[]).map((t) => (
                <button key={t} onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                  className="flex-1 py-5 font-bold text-sm uppercase tracking-widest relative transition-all"
                  style={{ color: tab === t ? "#fff" : "rgba(255,255,255,0.4)" }}>
                  {t === "login" ? "Sign In" : "Register"}
                  {tab === t && (
                    <motion.div layoutId="tab-line"
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: "linear-gradient(90deg, transparent, #5869e7, transparent)" }} />
                  )}
                </button>
              ))}
            </div>

            <div className="p-8">
              {/* Error / Success */}
              <AnimatePresence>
                {(error || success) && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mb-5 p-3 rounded-xl text-sm font-semibold text-center"
                    style={{
                      background: error ? "rgba(186,26,26,0.2)" : "rgba(0,200,100,0.2)",
                      border: `1px solid ${error ? "rgba(186,26,26,0.4)" : "rgba(0,200,100,0.4)"}`,
                      color: error ? "#ffa0a0" : "#80ffb0",
                    }}>
                    {error || success}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {tab === "login" ? (
                  /* ── Login Form ── */
                  <motion.form key="login" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }} transition={{ duration: 0.2 }} onSubmit={handleLogin} className="space-y-5">

                    <div>
                      <p className="text-center font-bold text-xl text-white mb-1">Welcome back, Trainer</p>
                      <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Continue your championship journey</p>
                    </div>

                    {/* Social */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "google" as const, label: "Google", icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg> },
                        { id: "discord" as const, label: "Discord", icon: <svg className="w-5 h-5" fill="#5865F2" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 11.721 11.721 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" /></svg> },
                      ].map(({ id, label, icon }) => (
                        <button key={id} type="button" disabled={loading} onClick={() => handleSocial(id)}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}>
                          {icon} {label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>or</span>
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Email</label>
                      <input type="email" required disabled={loading} value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="ash.ketchum@palette.com"
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                        onFocus={e => e.currentTarget.style.borderColor = "rgba(88,105,231,0.8)"}
                        onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"} />
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Password</label>
                        <Link href="#" className="text-xs font-semibold" style={{ color: "#bcc2ff" }}>Forgot?</Link>
                      </div>
                      <div className="relative">
                        <input type={showPass ? "text" : "password"} required disabled={loading} value={password} onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all pr-11"
                          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                          onFocus={e => e.currentTarget.style.borderColor = "rgba(88,105,231,0.8)"}
                          onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"} />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl"
                          style={{ color: "rgba(255,255,255,0.4)" }}>
                          {showPass ? "visibility_off" : "visibility"}
                        </button>
                      </div>
                    </div>

                    {/* Remember me */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div onClick={() => setRemember(!remember)}
                        className="w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0"
                        style={{ background: remember ? "#3f50ce" : "rgba(255,255,255,0.07)", border: `1px solid ${remember ? "#5869e7" : "rgba(255,255,255,0.2)"}` }}>
                        {remember && <span className="material-symbols-outlined text-white text-xs">check</span>}
                      </div>
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Remember me for 30 days</span>
                    </label>

                    <button type="submit" disabled={loading}
                      className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50"
                      style={{ background: loading ? "rgba(63,80,206,0.5)" : "linear-gradient(135deg, #3f50ce, #5869e7)", boxShadow: "0 4px 20px rgba(63,80,206,0.4)" }}>
                      {loading ? "Entering the Stadium..." : "Enter the Stadium →"}
                    </button>

                    {/* Admin hint */}
                    <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(63,80,206,0.15)", border: "1px solid rgba(63,80,206,0.3)" }}>
                      <span className="material-symbols-outlined text-sm align-middle mr-1" style={{ color: "#bcc2ff" }}>admin_panel_settings</span>
                      <span style={{ color: "rgba(188,194,255,0.8)" }}>Admin? Use <code className="font-mono" style={{ color: "#bcc2ff" }}>admin@champsarena.gg</code> / <code className="font-mono" style={{ color: "#bcc2ff" }}>Admin@1234</code></span>
                    </div>
                  </motion.form>

                ) : (
                  /* ── Register Form ── */
                  <motion.form key="signup" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.2 }} onSubmit={handleRegister} className="space-y-4">

                    <div>
                      <p className="text-center font-bold text-xl text-white mb-1">Begin Your Legend</p>
                      <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Create your trainer profile and join the circuit</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Trainer Name */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Trainer Name</label>
                        <input type="text" required disabled={loading} value={rName} onChange={e => setRName(e.target.value)}
                          placeholder="Red"
                          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                          onFocus={e => e.currentTarget.style.borderColor = "rgba(88,105,231,0.8)"}
                          onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"} />
                      </div>
                      {/* Fav Pokémon */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Fav. Pokémon</label>
                        <input type="text" disabled={loading} value={rFav} onChange={e => setRFav(e.target.value)}
                          placeholder="Charizard"
                          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                          onFocus={e => e.currentTarget.style.borderColor = "rgba(88,105,231,0.8)"}
                          onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"} />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Email</label>
                      <input type="email" required disabled={loading} value={rEmail} onChange={e => setREmail(e.target.value)}
                        placeholder="champion@league.com"
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                        onFocus={e => e.currentTarget.style.borderColor = "rgba(88,105,231,0.8)"}
                        onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"} />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Password</label>
                      <div className="relative">
                        <input type={rShowPass ? "text" : "password"} required disabled={loading} value={rPass} onChange={e => setRPass(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full rounded-xl px-4 py-3 text-sm outline-none pr-11"
                          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                          onFocus={e => e.currentTarget.style.borderColor = "rgba(88,105,231,0.8)"}
                          onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"} />
                        <button type="button" onClick={() => setRShowPass(!rShowPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl"
                          style={{ color: "rgba(255,255,255,0.4)" }}>
                          {rShowPass ? "visibility_off" : "visibility"}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Confirm Password</label>
                      <input type="password" required disabled={loading} value={rPassConfirm} onChange={e => setRPassConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${rPassConfirm && rPass !== rPassConfirm ? "rgba(186,26,26,0.6)" : "rgba(255,255,255,0.12)"}`, color: "#fff" }}
                        onFocus={e => e.currentTarget.style.borderColor = "rgba(88,105,231,0.8)"}
                        onBlur={e => e.currentTarget.style.borderColor = rPassConfirm && rPass !== rPassConfirm ? "rgba(186,26,26,0.6)" : "rgba(255,255,255,0.12)"} />
                    </div>

                    {/* Terms */}
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <div onClick={() => setRTerms(!rTerms)}
                        className="w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0 mt-0.5"
                        style={{ background: rTerms ? "#3f50ce" : "rgba(255,255,255,0.07)", border: `1px solid ${rTerms ? "#5869e7" : "rgba(255,255,255,0.2)"}` }}>
                        {rTerms && <span className="material-symbols-outlined text-white text-xs">check</span>}
                      </div>
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                        I agree to the <Link href="#" style={{ color: "#bcc2ff" }} className="font-semibold hover:underline">Tournament Rules</Link> & <Link href="#" style={{ color: "#bcc2ff" }} className="font-semibold hover:underline">Terms of Service</Link>
                      </span>
                    </label>

                    <button type="submit" disabled={loading}
                      className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50"
                      style={{ background: loading ? "rgba(63,80,206,0.5)" : "linear-gradient(135deg, #3f50ce, #5869e7)", boxShadow: "0 4px 20px rgba(63,80,206,0.4)" }}>
                      {loading ? "Registering..." : "Register as Trainer →"}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-8 pb-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                © 2024 Pokémon Champions · Official Tournament Series
              </p>
            </div>
          </div>

          {/* Back link */}
          <div className="text-center mt-5">
            <Link href="/" className="text-sm font-semibold inline-flex items-center gap-1 transition-colors"
              style={{ color: "rgba(188,194,255,0.6)" }}>
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Champions Hub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
