"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { loginTrainer, registerTrainer, socialLogin, requestPasswordReset } from "@/app/actions/authActions";

type Tab = "login" | "signup" | "forgot";

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [stats, setStats] = useState({ totalUsers: 0, totalTournaments: 0, totalMatches: 0 });

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPass, setRPass] = useState("");
  const [rPassConfirm, setRPassConfirm] = useState("");
  const [rTerms, setRTerms] = useState(false);

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState("");

  // CAPTCHA state
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCaptcha = () => {
    setCaptchaAnswer("");
    fetch("/api/auth/captcha")
      .then(r => r.json())
      .then(d => {
        if (d.question && d.token) {
          setCaptchaQuestion(d.question);
          setCaptchaToken(d.token);
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    // Fetch live stats for the hero
    fetch("/api/public-stats")
      .then(r => r.json())
      .then(d => {
        if (d) {
          setStats({
            totalUsers: d.totalUsers || 0,
            totalTournaments: d.totalTournaments || 0,
            totalMatches: d.totalMatches || 0
          });
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetchCaptcha();
  }, [tab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginTrainer({ email, password, captchaAnswer, captchaToken });
      if (res?.error) {
        setError(res.error);
        fetchCaptcha();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rTerms) {
      setError("Please accept the Tournament Regulations.");
      return;
    }
    if (rPass !== rPassConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (rPass.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await registerTrainer({
        name: rName,
        email: rEmail,
        password: rPass,
        captchaAnswer,
        captchaToken
      });
      if (res?.error) {
        setError(res.error);
        fetchCaptcha();
      } else {
        setSuccess("Trainer registered! Signing you in…");
      }
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const { verifyCaptcha } = await import("@/lib/captcha");
    // Verify CAPTCHA check on client first or just let server do it. Since verifyCaptcha runs server side, we verify through actions or a separate API. Let's do it inside the action or check locally. Actually verifyCaptcha uses node crypto which is a server-only module, so client cannot import it directly without runtime errors!
    // That means we must check CAPTCHA server-side.
    // Let's call the action which will handle CAPTCHA. Let's modify requestPasswordReset to also verify CAPTCHA.
    try {
      // Fetch reset
      const res = await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, captchaAnswer, captchaToken }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        fetchCaptcha();
      } else {
        setSuccess("Security key reset link generated! Check your scratch/sent_emails.log file.");
        setForgotEmail("");
        setCaptchaAnswer("");
      }
    } catch {
      setError("Failed to process reset request.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: "google" | "discord") => {
    setError(null);
    try {
      await socialLogin(provider);
    } catch {
      setError(`Failed to sign in with ${provider}.`);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-screen overflow-x-hidden lg:overflow-hidden bg-background text-primary selection:bg-accent-yellow selection:text-primary flex flex-col justify-stretch">
      <main className="flex-1 w-full flex flex-col lg:flex-row items-stretch lg:overflow-hidden relative">

        {/* ── Left Illustration Section (Desktop Only) ── */}
        <div className="hidden lg:flex lg:w-1/2 h-full bg-surface-container-high relative overflow-hidden items-center justify-center border-r-[6px] border-primary">
          <div className="relative z-10 w-full max-w-[576px] p-md lg:p-md text-center flex flex-col items-center select-none">

            <div className="mb-md lg:mb-md border-4 border-primary neo-brutalist-shadow bg-white p-2 max-h-[140px] xl:max-h-[220px] overflow-hidden flex items-center justify-center">
              <img
                className="w-full h-auto grayscale contrast-125 object-cover"
                alt="ChampsArena Stadium"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_GGm1TdSujnJMPpV26nMMZ9ErqzNLiFieUPof4Wwl3D5ExarqL9tyrRvWXAJDP-fJPCvXmnGBSCmA38MuTs0JZ2hBh8-oDE0gSe7vARjHZ6POhuHOQcetNUJ5CzOBf5RUgBVY0wQp0RngnafcmCuotXRxGx3r9GdWq-KQW_ddzbhoiGiIpOx6BJCYEJBSw8KgaHVFnba8U3mgsGU9cEAmGP7XW_e407Z3ExFiI2GXMG8hi_qSBIJWwDvQ1qCRfLNL3yYaN0jjxB0"
              />
            </div>

            <h1 className="text-4xl xl:text-6xl font-black text-primary mb-xs lg:mb-xs tracking-tighter uppercase italic leading-[0.9]">
              ChampsArena
            </h1>

            <p className="text-base xl:text-md font-bold text-primary bg-accent-yellow inline-block px-4 py-1.5 border-2 border-primary mb-md lg:mb-md">
              The elite tournament platform.
            </p>

            {/* Decorative Stats Grid */}
            <div className="mt-md lg:mt-lg grid grid-cols-3 gap-0 w-full border-4 border-primary neo-brutalist-shadow overflow-hidden bg-white">
              <div className="bg-white p-sm xl:p-sm border-r-2 border-primary">
                <span className="block text-xl xl:text-2xl font-black text-primary">
                  {stats.totalMatches > 0 ? stats.totalMatches.toLocaleString() : "2.4k"}
                </span>
                <span className="font-black text-[9px] xl:text-[10px] uppercase tracking-widest text-primary">Events</span>
              </div>
              <div className="bg-accent-blue text-white p-sm xl:p-sm border-r-2 border-primary">
                <span className="block text-xl xl:text-2xl font-black">
                  {stats.totalUsers > 0 ? stats.totalUsers.toLocaleString() : "15k"}
                </span>
                <span className="font-black text-[9px] xl:text-[10px] uppercase tracking-widest">Trainers</span>
              </div>
              <div className="bg-accent-yellow text-primary p-sm xl:p-sm">
                <span className="block text-xl xl:text-2xl font-black text-primary">
                  {stats.totalTournaments > 0 ? stats.totalTournaments.toLocaleString() : "89"}
                </span>
                <span className="font-black text-[9px] xl:text-[10px] uppercase tracking-widest text-primary">Tournaments</span>
              </div>
            </div>

          </div>

          {/* Geometric Bauhaus Art Details */}
          <div className="absolute top-5 left-5 xl:top-10 xl:left-10 w-16 h-16 xl:w-24 xl:h-24 bg-accent-red border-4 border-primary"></div>
          <div className="absolute bottom-10 right-5 xl:bottom-20 xl:right-10 w-24 h-24 xl:w-32 xl:h-32 rounded-full bg-accent-blue border-4 border-primary"></div>
          <div className="absolute top-1/2 left-0 w-12 h-36 xl:w-16 xl:h-48 bg-accent-yellow border-4 border-primary -translate-y-1/2"></div>
        </div>

        {/* ── Right Form Section ── */}
        <div className="flex-1 h-full overflow-y-auto custom-scroll bg-background flex flex-col items-center justify-start lg:justify-center py-lg lg:py-md px-sm md:p-lg">
          <div className="w-full max-w-[512px]">

            {/* Mobile Header (Hidden on Desktop) */}
            <div className="lg:hidden text-center mb-xl">
              <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter uppercase italic">
                ChampsArena
              </h1>
              <p className="text-primary font-bold text-xs bg-accent-yellow inline-block px-2 border-2 border-primary mt-1">
                Tournament Hub
              </p>
            </div>

            {/* Trainer Card Container */}
            <div className="bg-white border-4 border-primary neo-brutalist-shadow flex flex-col min-h-[440px] lg:min-h-0 relative">

              {/* Card Header / Tabs */}
              <div className="flex border-b-[3px] border-primary">
                <button
                  onClick={() => { setTab("login"); setError(null); setSuccess(null); }}
                  className={`flex-1 py-3 text-lg font-black relative uppercase tracking-tighter transition-colors duration-200 ${tab === "login" ? "text-primary bg-white" : "text-primary bg-surface-container-high border-r-[3px] border-primary"
                    }`}
                >
                  Login
                  {tab === "login" && <div className="active-tab-indicator"></div>}
                </button>
                <button
                  onClick={() => { setTab("signup"); setError(null); setSuccess(null); }}
                  className={`flex-1 py-3 text-lg font-black relative uppercase tracking-tighter transition-colors duration-200 border-l-[3px] border-primary ${tab === "signup" ? "text-primary bg-white" : "text-primary bg-surface-container-high"
                    }`}
                >
                  Sign Up
                  {tab === "signup" && <div className="active-tab-indicator"></div>}
                </button>
              </div>

              {/* Form Body */}
              <div className="p-sm lg:p-md flex-1 flex flex-col justify-between">

                <div className="space-y-sm">

                  {/* Status Messages */}
                  <AnimatePresence>
                    {(error || success) && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-3 border-2 border-primary font-black uppercase text-xs tracking-wider text-center"
                        style={{
                          background: error ? "#ffdad6" : "#d1fae5",
                          color: error ? "#93000a" : "#065f46",
                        }}
                      >
                        <span className="material-symbols-outlined text-base align-middle mr-1.5">
                          {error ? "error" : "check_circle"}
                        </span>
                        {error || success}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {tab === "login" ? (
                      /* ── LOGIN FORM ── */
                      <motion.form
                        key="login"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.15 }}
                        onSubmit={handleLogin}
                        className="space-y-sm"
                      >
                        <div className="mb-sm text-left">
                          <h2 className="text-lg font-black uppercase tracking-tighter">Enter the Circuit</h2>
                          <p className="text-[11px] font-bold text-primary opacity-60 mt-0.5">Sign in to continue your tournament journey.</p>
                        </div>

                        {/* Social Logins */}
                        <div className="grid grid-cols-2 gap-0 border-2 border-primary">
                          <button
                            type="button"
                            onClick={() => handleSocial("google")}
                            className="flex items-center justify-center gap-xs py-2 bg-white hover:bg-accent-yellow border-r-2 border-primary transition-colors duration-100 font-black uppercase text-[10px] tracking-wider cursor-pointer"
                          >
                            Google
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSocial("discord")}
                            className="flex items-center justify-center gap-xs py-2 bg-white hover:bg-accent-blue hover:text-white transition-colors duration-100 font-black uppercase text-[10px] tracking-wider cursor-pointer"
                          >
                            Discord
                          </button>
                        </div>

                        {/* OR Divider */}
                        <div className="relative flex items-center py-base">
                          <div className="flex-grow border-t-2 border-primary"></div>
                          <span className="flex-shrink mx-sm text-[10px] text-primary uppercase font-black tracking-widest">OR EMAIL</span>
                          <div className="flex-grow border-t-2 border-primary"></div>
                        </div>

                        {/* Form Inputs */}
                        <div className="space-y-xs text-left">
                          <div className="space-y-1">
                            <label className="text-[10px] text-primary uppercase font-black tracking-widest">Trainer Email</label>
                            <input
                              type="email"
                              required
                              disabled={loading}
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              placeholder="ash.ketchum@pallet.com"
                              className="w-full bg-white border-2 border-primary py-2 px-3 text-sm font-bold focus:bg-accent-yellow outline-none transition-colors"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] text-primary uppercase font-black tracking-widest">Security Key</label>
                              <button
                                type="button"
                                onClick={() => { setTab("forgot"); setError(null); setSuccess(null); }}
                                className="text-accent-red font-black uppercase text-[10px] hover:underline cursor-pointer"
                              >
                                Forgot?
                              </button>
                            </div>
                            <input
                              type="password"
                              required
                              disabled={loading}
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-white border-2 border-primary py-2 px-3 text-sm font-bold focus:bg-accent-yellow outline-none transition-colors"
                            />
                          </div>

                          {/* CAPTCHA verification */}
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] text-primary uppercase font-black tracking-widest">Verify You Are Human</label>
                              <button
                                type="button"
                                onClick={fetchCaptcha}
                                className="text-[9px] font-black text-accent-blue uppercase hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[10px]">refresh</span> Refresh
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <div className="bg-primary text-white font-mono px-3 py-2 border-2 border-primary text-xs font-black select-none flex items-center justify-center grow">
                                {captchaQuestion}
                              </div>
                              <input
                                type="text"
                                required
                                value={captchaAnswer}
                                onChange={e => setCaptchaAnswer(e.target.value)}
                                placeholder="Answer"
                                className="w-24 bg-white border-2 border-primary py-2 px-2 text-sm font-bold focus:bg-accent-yellow outline-none text-center"
                              />
                            </div>
                          </div>

                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-sm select-none">
                          <input
                            className="pokeball-checkbox"
                            id="remember"
                            type="checkbox"
                          />
                          <label className="text-[10px] text-primary uppercase font-black tracking-widest cursor-pointer" htmlFor="remember">
                            Keep Active (30D)
                          </label>
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-primary text-white py-2.5 text-lg font-black uppercase tracking-tighter border-2 border-primary neo-brutalist-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:bg-accent-red cursor-pointer"
                        >
                          {loading ? "ENTERING..." : "Enter the Stadium"}
                        </button>

                        {/* Admin Hint */}

                      </motion.form>
                    ) : tab === "signup" ? (
                      /* ── SIGN UP FORM ── */
                      <motion.form
                        key="signup"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.15 }}
                        onSubmit={handleRegister}
                        className="space-y-sm"
                      >
                        <div className="mb-sm text-left">
                          <h2 className="text-lg font-black uppercase tracking-tighter">New Registration</h2>
                          <p className="text-[11px] font-bold text-primary opacity-60 mt-0.5">Create your trainer profile and join the circuit.</p>
                        </div>

                        <div className="space-y-xs text-left">
                          <div className="space-y-1">
                            <label className="text-[10px] text-primary uppercase font-black tracking-widest">Trainer Name</label>
                            <input
                              type="text"
                              required
                              disabled={loading}
                              value={rName}
                              onChange={e => setRName(e.target.value)}
                              placeholder="Red"
                              className="w-full bg-white border-2 border-primary py-2 px-3 text-sm font-bold focus:bg-accent-yellow outline-none transition-colors"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-primary uppercase font-black tracking-widest">Email</label>
                            <input
                              type="email"
                              required
                              disabled={loading}
                              value={rEmail}
                              onChange={e => setREmail(e.target.value)}
                              placeholder="champion@league.com"
                              className="w-full bg-white border-2 border-primary py-2 px-3 text-sm font-bold focus:bg-accent-yellow outline-none transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-sm">
                            <div className="space-y-1">
                              <label className="text-[10px] text-primary uppercase font-black tracking-widest">Password</label>
                              <input
                                type="password"
                                required
                                disabled={loading}
                                value={rPass}
                                onChange={e => setRPass(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white border-2 border-primary py-2 px-3 text-sm font-bold focus:bg-accent-yellow outline-none transition-colors"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-primary uppercase font-black tracking-widest">Confirm</label>
                              <input
                                type="password"
                                required
                                disabled={loading}
                                value={rPassConfirm}
                                onChange={e => setRPassConfirm(e.target.value)}
                                placeholder="••••••••"
                                className={`w-full bg-white border-2 py-2 px-3 text-sm font-bold focus:bg-accent-yellow outline-none transition-colors ${rPassConfirm && rPass !== rPassConfirm ? "border-accent-red" : "border-primary"
                                  }`}
                              />
                            </div>
                          </div>

                          {/* CAPTCHA verification */}
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] text-primary uppercase font-black tracking-widest">Verify You Are Human</label>
                              <button
                                type="button"
                                onClick={fetchCaptcha}
                                className="text-[9px] font-black text-accent-blue uppercase hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[10px]">refresh</span> Refresh
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <div className="bg-primary text-white font-mono px-3 py-2 border-2 border-primary text-xs font-black select-none flex items-center justify-center grow">
                                {captchaQuestion}
                              </div>
                              <input
                                type="text"
                                required
                                value={captchaAnswer}
                                onChange={e => setCaptchaAnswer(e.target.value)}
                                placeholder="Answer"
                                className="w-24 bg-white border-2 border-primary py-2 px-2 text-sm font-bold focus:bg-accent-yellow outline-none text-center"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Notice */}
                        <div className="bg-accent-yellow border-2 border-primary p-2 flex items-start gap-2 text-left">
                          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                          <p className="text-[9px] uppercase font-black text-primary leading-tight">
                            Your username will be auto-generated from your trainer name. You can customize it on your profile dashboard.
                          </p>
                        </div>

                        {/* Terms */}
                        <div className="flex items-center gap-sm select-none">
                          <input
                            className="pokeball-checkbox"
                            id="terms"
                            type="checkbox"
                            checked={rTerms}
                            onChange={e => setRTerms(e.target.checked)}
                          />
                          <label className="text-[10px] text-primary uppercase font-black tracking-widest cursor-pointer" htmlFor="terms">
                            Accept Regulations
                          </label>
                        </div>

                        {/* Submit */}
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-accent-red text-white py-2.5 text-lg font-black uppercase tracking-tighter border-2 border-primary neo-brutalist-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:bg-primary cursor-pointer"
                        >
                          {loading ? "REGISTERING..." : "Register Trainer"}
                        </button>
                      </motion.form>
                    ) : (
                      /* ── FORGOT PASSWORD FORM ── */
                      <motion.form
                        key="forgot"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.15 }}
                        onSubmit={handleRequestReset}
                        className="space-y-sm"
                      >
                        <div className="mb-sm text-left">
                          <h2 className="text-lg font-black uppercase tracking-tighter">Reset Security Key</h2>
                          <p className="text-[11px] font-bold text-primary opacity-60 mt-0.5">Simulate a security key reset. We will log the reset link.</p>
                        </div>

                        <div className="space-y-xs text-left">
                          <div className="space-y-1">
                            <label className="text-[10px] text-primary uppercase font-black tracking-widest">Trainer Email</label>
                            <input
                              type="email"
                              required
                              disabled={loading}
                              value={forgotEmail}
                              onChange={e => setForgotEmail(e.target.value)}
                              placeholder="trainer@league.com"
                              className="w-full bg-white border-2 border-primary py-2 px-3 text-sm font-bold focus:bg-accent-yellow outline-none transition-colors"
                            />
                          </div>

                          {/* CAPTCHA verification */}
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] text-primary uppercase font-black tracking-widest">Verify You Are Human</label>
                              <button
                                type="button"
                                onClick={fetchCaptcha}
                                className="text-[9px] font-black text-accent-blue uppercase hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[10px]">refresh</span> Refresh
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <div className="bg-primary text-white font-mono px-3 py-2 border-2 border-primary text-xs font-black select-none flex items-center justify-center grow">
                                {captchaQuestion}
                              </div>
                              <input
                                type="text"
                                required
                                value={captchaAnswer}
                                onChange={e => setCaptchaAnswer(e.target.value)}
                                placeholder="Answer"
                                className="w-24 bg-white border-2 border-primary py-2 px-2 text-sm font-bold focus:bg-accent-yellow outline-none text-center"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-accent-red text-white py-2.5 text-lg font-black uppercase tracking-tighter border-2 border-primary neo-brutalist-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:bg-primary cursor-pointer"
                        >
                          {loading ? "SENDING KEY..." : "Send Reset link"}
                        </button>

                        <button
                          type="button"
                          onClick={() => { setTab("login"); setError(null); setSuccess(null); }}
                          className="w-full bg-white text-primary border-2 border-primary py-2 font-black uppercase text-xs tracking-wider hover:bg-accent-yellow transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                </div>

                {/* Trainer Card Footer inside box */}
                <div className="mt-md text-left border-t-[3px] border-primary pt-3">
                  <p className="text-[9px] font-black uppercase text-primary leading-none mb-2">
                    By joining, you accept our <Link className="text-accent-red hover:underline" href="#">Privacy Policy</Link> and <Link className="text-accent-red hover:underline" href="#">Terms of Service</Link>.
                  </p>
                  <div className="flex justify-between items-center text-[10px] text-primary font-black uppercase tracking-widest">
                    <span>V2.5.0-SEC</span>
                    <div className="flex gap-md">
                      <Link className="hover:text-accent-red" href="#">Rules</Link>
                      <Link className="hover:text-accent-red" href="#">Support</Link>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Back to Hub button */}
            <div className="mt-md text-center select-none">
              <Link href="/" className="inline-flex items-center gap-xs font-black uppercase text-xs text-primary hover:text-accent-red transition-colors">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Return to Hub
              </Link>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
