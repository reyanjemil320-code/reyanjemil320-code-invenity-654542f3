import { createContext, useContext, useEffect, useState } from "react";
import { fetchAuth, getToken, clearToken, type AuthUser } from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthUser | null; // kept for page compatibility: truthy when signed in
  loading: boolean;
  isAdmin: boolean;
  signIn: (user: AuthUser) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchAuth<{ user: AuthUser }>("/api/auth/me")
      .then((res) => {
        setUser(res.user);
        setIsAdmin(!!res.user.isAdmin);
        setLoading(false);
      })
      .catch(() => {
        clearToken();
        setLoading(false);
      });
  }, []);

  // Called by the Auth page right after a successful signup/login, so the
  // whole app (navbar etc.) switches to the signed-in UI without a reload.
  const signIn = (u: AuthUser) => {
    setUser(u);
    setIsAdmin(!!u.isAdmin);
  };

  const signOut = async () => {
    try {
      await fetchAuth("/api/auth/logout", { method: "POST" });
    } catch {
      /* clear locally regardless */
    }
    clearToken();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session: user, loading, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
