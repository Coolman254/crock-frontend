import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: any | null;
  loading: boolean;
  login: (identifier: string, password: string, role: string) => Promise<void>;
  logout: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── AuthProvider — wraps the whole app in App.tsx ─────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, rehydrate from token if one exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    const storedRole = localStorage.getItem("role");
    const meCall = storedRole === "student" ? auth.getStudentMe() : auth.getMe();

    meCall
      .then((res: any) => setUser(res.data ?? res.user ?? null))
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      })
      .finally(() => setLoading(false));
  }, []);

  // Called by Login.tsx: login(identifier, password, role)
  const login = async (identifier: string, password: string, role: string) => {
    let token: string;
    let userData: any;

    if (role === "student") {
      const res = await auth.studentLogin(identifier, password);
      // { success, token, data: { ...studentFields } }
      token    = res.token;
      userData = res.data;
    } else {
      const res = await auth.login(identifier, password, role);
      // { token, role, user: { ...userFields } }
      token    = res.token;
      userData = res.user;
    }

    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── useAuth — used by Login.tsx ───────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ── useRequireAuth — used by every dashboard page ─────────────────────────────

export function useRequireAuth(requiredRole?: string) {
  const navigate = useNavigate();
  const [user, setUser]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const meCall = requiredRole === "student"
      ? auth.getStudentMe()
      : auth.getMe();

    meCall
      .then((res: any) => {
        const userData = res.data ?? res.user;
        if (!userData) { navigate("/login"); return; }
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [navigate, requiredRole]);

  return { user, loading };
}

// ── useSignOut — used by dashboard headers ────────────────────────────────────

export function useSignOut() {
  const navigate = useNavigate();
  return () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };
}