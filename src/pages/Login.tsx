import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";

const TICKER = [
  "GRAILS", "W2C", "QC PASSED", "BATCH INTEL", "TRUST REPORTS", "AGENT LINKS",
  "SHIP MATH", "SELLER RADAR", "ARCHIVE",
];

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const google = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if ("error" in result && result.error) {
        throw result.error instanceof Error ? result.error : new Error("Sign-in failed");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed");
      setBusy(false);
    }
  };

  const emailAuth = async (mode: "in" | "up") => {
    setBusy(true);
    try {
      const fn =
        mode === "in"
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({ email, password });
      const { error } = await fn;
      if (error) throw error;
      if (mode === "up") toast.success("Account created — check your email if confirmation is on.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dark relative flex min-h-screen flex-col overflow-hidden bg-ink">
      {/* ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-16 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute -right-40 bottom-24 h-[26rem] w-[26rem] rounded-full bg-grail/12 blur-[140px]" />
      </div>

      {/* giant ghost wordmark */}
      <p
        aria-hidden
        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[38vh] font-extrabold leading-none text-bone/[0.035]"
      >
        HAUL
      </p>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <p className="mb-4 text-center font-num text-[10px] font-medium uppercase tracking-ultra text-primary">
            Archive · Vet · Ship
          </p>
          <h1 className="text-center font-display text-[5.5rem] font-extrabold leading-[0.85] tracking-tight">
            <span className="text-gradient">HAUL</span>
          </h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 h-px w-28 origin-center bg-gradient-to-r from-transparent via-primary to-transparent"
          />
          <p className="mt-5 text-center text-sm leading-relaxed text-bone/55">
            Every piece you want. Every seller you trust.
            <br />
            One archive.
          </p>

          <div className="mt-12 space-y-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={google}
              disabled={busy}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-bone py-4 text-sm font-bold text-ink shadow-[0_12px_40px_-12px_hsl(36_30%_96%/0.35)] transition-shadow hover:shadow-[0_16px_48px_-12px_hsl(36_30%_96%/0.45)] disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              Continue with Google
            </motion.button>

            {showEmail ? (
              <div className="space-y-2 rounded-2xl border border-bone/10 bg-bone/[0.03] p-3 text-left animate-fade-in">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-bone/15 bg-transparent px-3.5 py-3 text-sm text-bone placeholder:text-bone/35 outline-none transition-colors focus:border-primary"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-bone/15 bg-transparent px-3.5 py-3 text-sm text-bone placeholder:text-bone/35 outline-none transition-colors focus:border-primary"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => emailAuth("in")}
                    disabled={busy || !email || !password}
                    className="btn-hero flex-1 rounded-xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => emailAuth("up")}
                    disabled={busy || !email || !password}
                    className="flex-1 rounded-xl border border-bone/15 py-3 text-sm text-bone disabled:opacity-50"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowEmail(true)}
                className="w-full py-1.5 text-xs text-bone/45 transition-colors hover:text-bone"
              >
                or use email &amp; password
              </button>
            )}

            <div className="flex justify-center pt-1">
              <a
                href="/?demo=1"
                className="inline-flex items-center gap-1.5 text-xs text-bone/40 transition-colors hover:text-primary"
              >
                <Eye className="h-3.5 w-3.5" /> Preview with demo data
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* editorial ticker */}
      <div className="relative z-10 overflow-hidden border-t border-bone/10 py-3.5">
        <div
          className="flex w-max gap-10 whitespace-nowrap font-num text-[10px] font-medium uppercase tracking-ultra text-bone/30"
          style={{ animation: "marquee 28s linear infinite" }}
        >
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-10">
              {t} <span className="text-primary/50">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
