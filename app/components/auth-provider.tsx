"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { AuthUser } from "@/app/lib/types";
import { getSupabaseBrowserClient } from "@/app/lib/supabase/client";

function getUserRole(profileRole: string | undefined, appRole: string | undefined): AuthUser["role"] {
  if (profileRole === "orders_admin") return "orders_admin";
  if (profileRole === "admin" || appRole === "admin") return "admin";
  return "customer";
}

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message: string }>;
  signUp: (
    email: string,
    password: string,
    options?: { name?: string }
  ) => Promise<{ ok: boolean; message: string }>;
  resetPassword: (
    email: string
  ) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "skincare-select-auth";

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const persistUser = (nextUser: AuthUser | null) => {
    if (typeof window !== "undefined") {
      if (nextUser) {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(nextUser)
        );
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setUser(nextUser);
  };

  const getProfile = async (userId: string) => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .maybeSingle();

    if (!error) {
      return data;
    }

    console.error("PROFILE ERROR:", error);
    const response = await fetch("/api/auth/admin-status", { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return response.json();
  };

  const loadSupabaseUser = async () => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !authUser) {
        persistUser(null);
        return;
      }

      const profile = await getProfile(authUser.id);

      const nextUser: AuthUser = {
        id: authUser.id,
        email: authUser.email ?? "",
        name:
          profile?.full_name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split("@")[0] ||
          "User",
        role: getUserRole(profile?.role, authUser.app_metadata?.role),
      };

      persistUser(nextUser);
    } catch (error) {
      console.error("AUTH LOAD ERROR:", error);
      persistUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.setTimeout(() => void loadSupabaseUser(), 0);
    // The initial auth check intentionally runs once when the provider mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return {
        ok: false,
        message: "Supabase is not configured.",
      };
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error || !data.user) {
        return {
          ok: false,
          message: error?.message ?? "Unable to sign in.",
        };
      }

      const profile = await getProfile(data.user.id);

      const nextUser: AuthUser = {
        id: data.user.id,
        email: data.user.email ?? email,
        name:
          profile?.full_name ||
          data.user.user_metadata?.full_name ||
          email.split("@")[0],
        role: getUserRole(profile?.role, data.user.app_metadata?.role),
      };

      persistUser(nextUser);

      return {
        ok: true,
        message: "Signed in successfully.",
      };
    } catch (error) {
      console.error("SIGN IN ERROR:", error);

      return {
        ok: false,
        message: "Unable to sign in.",
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    options?: { name?: string }
  ) => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return {
        ok: false,
        message: "Supabase is not configured.",
      };
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: options?.name,
        }),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        return {
          ok: false,
          message: result.message ?? "Unable to create account.",
        };
      }

      const signedIn = await signIn(email.trim().toLowerCase(), password);
      if (!signedIn.ok) {
        return {
          ok: false,
          message: signedIn.message,
        };
      }

      return {
        ok: true,
        message: "You have successfully registered.",
      };
    } catch (error) {
      console.error(error);

      return {
        ok: false,
        message: "Unable to create account.",
      };
    }
  };

  const resetPassword = async (email: string) => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      return {
        ok: false,
        message: "Supabase is not configured.",
      };
    }

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return {
          ok: false,
          message: error.message,
        };
      }

      return {
        ok: true,
        message: "Password reset instructions were sent.",
      };
    } catch (error) {
      console.error(error);

      return {
        ok: false,
        message: "Unable to send password reset instructions.",
      };
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    persistUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    resetPassword,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
}