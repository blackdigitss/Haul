import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_USER, IS_ARTIFACT, isDemo } from "@/lib/demo";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo()) {
      setUser(DEMO_USER as unknown as User);
      setLoading(false);
      return;
    }

    // Listener BEFORE getSession — catches the OAuth SIGNED_IN event that can
    // fire during the initial redirect back into the app.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Installed-PWA fix: re-validate the token when the app returns to the
    // foreground, otherwise a stale session can 401 quietly.
    const revalidate = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession();
      }
    };
    document.addEventListener("visibilitychange", revalidate);
    window.addEventListener("focus", revalidate);

    return () => {
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", revalidate);
      window.removeEventListener("focus", revalidate);
    };
  }, []);

  const signOut = async () => {
    if (IS_ARTIFACT) return; // the preview build has no real session to leave
    if (isDemo()) {
      sessionStorage.removeItem("haul-demo");
      window.location.href = "/login";
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
