import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink px-6">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-grail/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm text-center"
      >
        <p className="mb-3 text-[11px] font-medium uppercase tracking-ultra text-primary">
          Archive · Vet · Ship
        </p>
        <h1 className="font-display text-6xl font-bold tracking-tight text-bone">HAUL</h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-4 h-px w-24 origin-center bg-primary"
        />
        <p className="mt-4 text-sm text-bone/60">
          Every piece you want. Every seller you trust. One archive.
        </p>

        <div className="mt-10 space-y-3">
          <button
            onClick={google}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-bone py-3.5 text-sm font-semibold text-ink transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            Continue with Google
          </button>

          {showEmail ? (
            <div className="space-y-2 rounded-xl border border-bone/15 p-3 text-left animate-fade-in">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-bone/20 bg-transparent px-3 py-2.5 text-sm text-bone placeholder:text-bone/40 outline-none focus:border-primary"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-bone/20 bg-transparent px-3 py-2.5 text-sm text-bone placeholder:text-bone/40 outline-none focus:border-primary"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => emailAuth("in")}
                  disabled={busy || !email || !password}
                  className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Sign in
                </button>
                <button
                  onClick={() => emailAuth("up")}
                  disabled={busy || !email || !password}
                  className="flex-1 rounded-lg border border-bone/20 py-2.5 text-sm text-bone disabled:opacity-50"
                >
                  Sign up
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowEmail(true)}
              className="w-full py-1 text-xs text-bone/50 transition-colors hover:text-bone"
            >
              or use email &amp; password
            </button>
          )}

          <a
            href="/?demo=1"
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-bone/40 transition-colors hover:text-primary"
          >
            <Eye className="h-3.5 w-3.5" /> Preview with demo data
          </a>
        </div>
      </motion.div>
    </div>
  );
}
