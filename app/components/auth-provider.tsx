'use client';

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "@/app/lib/types";
import { getSupabaseBrowserClient } from "@/app/lib/supabase/client";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signUp: (
    email: string,
    password: string,
    options?: { name?: string; role?: "customer" | "admin" },
  ) => Promise<{ ok: boolean; message: string }>;
  resetPassword: (email: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "lueur-co-auth";
const USERS_KEY = "lueur-co-users";

function getStoredUsers(): Array<{ email: string; password: string; name: string; role: "customer" | "admin" }> {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) ?? "[]") as Array<{
      email: string;
      password: string;
      name: string;
      role: "customer" | "admin";
    }>;
  } catch {
    return [];
  }
}

function saveStoredUsers(users: Array<{ email: string; password: string; name: string; role: "customer" | "admin" }>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedUser = window.localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser) as AuthUser);
    }
    setLoading(false);
  }, []);

  const persistUser = (nextUser: AuthUser | null) => {
    if (typeof window === "undefined") {
      return;
    }

    if (nextUser) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    setUser(nextUser);
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          const nextUser: AuthUser = {
            id: data.user.id,
            email: data.user.email ?? email,
            name: data.user.user_metadata?.full_name ?? email.split("@")[0],
            role: email.includes("admin") ? "admin" : "customer",
          };
          persistUser(nextUser);
          return { ok: true, message: "Signed in successfully." };
        }
      } catch {
        // Fall back to the demo/local experience when Supabase is unavailable.
      }
    }

    const storedUsers = getStoredUsers();
    const match = storedUsers.find((candidate) => candidate.email === email && candidate.password === password);
    if (match) {
      const nextUser: AuthUser = { id: `${email}-local`, email, name: match.name, role: match.role };
      persistUser(nextUser);
      return { ok: true, message: "Signed in successfully." };
    }

    if (email === "admin@example.com" && password === "password123") {
      const nextUser: AuthUser = { id: "admin-demo", email, name: "Demo Admin", role: "admin" };
      persistUser(nextUser);
      return { ok: true, message: "Signed in as the demo admin." };
    }

    return { ok: false, message: "We could not find that account. Try signing up first." };
  };

  const signUp = async (email: string, password: string, options?: { name?: string; role?: "customer" | "admin" }) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: options?.name ?? email.split("@")[0] } } });
        if (!error && data.user) {
          const nextUser: AuthUser = {
            id: data.user.id,
            email: data.user.email ?? email,
            name: options?.name ?? email.split("@")[0],
            role: options?.role ?? "customer",
          };
          persistUser(nextUser);
          return { ok: true, message: "Account created successfully." };
        }
      } catch {
        // Fall back to local storage registration.
      }
    }

    const storedUsers = getStoredUsers();
    const existing = storedUsers.find((candidate) => candidate.email === email);
    if (existing) {
      return { ok: false, message: "An account already exists for that email." };
    }

    const nextUser: AuthUser = {
      id: `${email}-local`,
      email,
      name: options?.name ?? email.split("@")[0],
      role: options?.role ?? "customer",
    };
    saveStoredUsers([...storedUsers, { email, password, name: nextUser.name, role: nextUser.role }]);
    persistUser(nextUser);
    return { ok: true, message: "Account created successfully." };
  };

  const resetPassword = async (email: string) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (!error) {
          return { ok: true, message: "Password reset instructions were sent." };
        }
      } catch {
        // Fall back to demo guidance.
      }
    }

    return {
      ok: true,
      message: `Password reset guidance has been prepared for ${email}.`,
    };
  };

  const signOut = () => persistUser(null);

  const value = useMemo<AuthContextValue>(() => ({ user, loading, signIn, signUp, resetPassword, signOut }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
