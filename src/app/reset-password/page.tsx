"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { completePasswordReset } from "@/app/actions/authActions";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenParam = searchParams?.get("token") || "";
  const emailParam = searchParams?.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState(tokenParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // CAPTCHA
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
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Validate CAPTCHA first on the server
      const verifyRes = await fetch("/api/auth/captcha-verify-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captchaAnswer, captchaToken }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.error) {
        setError(verifyData.error);
        fetchCaptcha();
        setLoading(false);
        return;
      }

      const res = await completePasswordReset({
        email,
        password,
        confirmPassword,
        token
      });

      if (res?.error) {
        setError(res.error);
        fetchCaptcha();
      } else {
        setSuccess("Password updated successfully! Redirecting to login page...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch {
      setError("Failed to update password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[512px] mx-auto bg-white border-4 border-primary p-md md:p-lg neo-brutalist-shadow text-primary space-y-md">
      <div className="text-center mb-md select-none">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Update Security Key</h1>
        <p className="text-xs text-primary/60 mt-1 uppercase font-bold">Secure your trainer profile coordinates.</p>
      </div>

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
            {error || success}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-sm text-left uppercase font-bold text-xs">
        <div className="space-y-1">
          <label className="text-[10px] text-primary uppercase font-black tracking-widest"> Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="trainer@league.com"
            className="w-full bg-white border-2 border-primary py-2 px-3 text-sm font-bold focus:bg-accent-yellow outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-primary uppercase font-black tracking-widest">Reset Token</label>
          <input
            type="text"
            required
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Token from email log"
            className="w-full bg-white border-2 border-primary py-2 px-3 text-sm font-bold focus:bg-accent-yellow outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-sm">
          <div className="space-y-1">
            <label className="text-[10px] text-primary uppercase font-black tracking-widest">New Security Key</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border-2 border-primary py-2 px-3 text-sm font-bold focus:bg-accent-yellow outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-primary uppercase font-black tracking-widest">Confirm Key</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border-2 border-primary py-2 px-3 text-sm font-bold focus:bg-accent-yellow outline-none"
            />
          </div>
        </div>

        {/* CAPTCHA verification */}
        <div className="space-y-1 pt-1 select-none">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-xs bg-primary text-white py-3 border-2 border-primary font-black uppercase tracking-widest text-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
        >
          {loading ? "SAVING..." : "Update Security Key"}
        </button>
      </form>

      <div className="text-center pt-2">
        <Link href="/login" className="text-accent-red uppercase tracking-widest font-black text-xs hover:underline flex items-center justify-center gap-xs">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span> Return to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Navigation />
      <main className="max-w-container-max mx-auto px-md py-xl flex items-center justify-center min-h-[70vh]">
        <Suspense fallback={<div className="text-primary font-black uppercase text-center">Loading Password Reset Interface...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
