import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./api";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  // for students: admission number used instead of email
  admissionNo?: string | number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (emailOrAdmNo: string, password: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (t) {
      // Students use student-auth/me, others use auth/me
      const meCall = role === "student" ? auth.getStudentMe() : auth.getMe();
      meCall
        .then((data: any) => {
          if (role === "student") {
            const s = data.data;
            setUser({
              id: s._id,
              name: `${s.firstName} ${s.lastName}`,
              email: s.email || "",
              role: "student",
              admissionNo: s.admissionNo,
            });
          } else {
            setUser(data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("userRole");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (emailOrAdmNo: string, password: string, role: string) => {
    if (role === "student") {
      const data = await auth.studentLogin(emailOrAdmNo, password);
      if (!data.success) throw new Error("Login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", "student");
      setToken(data.token);
      const s = data.data;
      setUser({
        id: s._id,
        name: `${s.firstName} ${s.lastName}`,
        email: s.email || "",
        role: "student",
        admissionNo: s.admissionNo,
      });
    } else {
      const data = await auth.login(emailOrAdmNo, password, role);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", role);
      setToken(data.token);
      setUser(data.user);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function useRequireAuth(requiredRole?: string) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login"); return; }
    if (requiredRole && user.role !== requiredRole) { navigate("/login"); }
  }, [user, loading, navigate, requiredRole]);

  return { user, loading };
}

export function useSignOut() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return () => { logout(); navigate("/login"); };
}
