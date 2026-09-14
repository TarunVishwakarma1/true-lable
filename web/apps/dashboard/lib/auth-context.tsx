"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type AdminProfile, type LoginInput, type RegisterInput } from "./api";

const TOKEN_KEY = "truelabel-dashboard:token";

interface AuthState {
  token: string | null;
  profile: AdminProfile | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    api
      .me(stored)
      .then((p) => {
        setToken(stored);
        setProfile(p);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const applySession = useCallback((session: { token: string; profile: AdminProfile }) => {
    localStorage.setItem(TOKEN_KEY, session.token);
    setToken(session.token);
    setProfile(session.profile);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => applySession(await api.login(input)),
    [applySession],
  );

  const register = useCallback(
    async (input: RegisterInput) => applySession(await api.register(input)),
    [applySession],
  );

  const logout = useCallback(() => {
    if (token) api.logout(token).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setProfile(null);
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, profile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
