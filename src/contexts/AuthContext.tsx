"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { createClient } from "../lib/supabase/client";
import { migrateGuestDataToCloud } from "../lib/sync/guestMigration";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  displayName: string;
  userInitial: string;
  role: string;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  signInWithPassword: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ data: { user: User | null; session: Session | null }; error: AuthError | null }>;
  signUp: (params: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<{ data: { user: User | null; session: Session | null }; error: AuthError | null }>;
  signInWithOAuth: (provider: "google" | "github") => Promise<{ error: AuthError | null }>;
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
  updateUser: (attributes: {
    password?: string;
    data?: { display_name?: string };
  }) => Promise<{ data: { user: User | null }; error: AuthError | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string>("user");
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = role === "admin";
  const supabase = useMemo(() => createClient(), []);

  const fetchUserRole = useCallback(
    async (userId: string) => {
      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        if (data?.role) {
          setRole(data.role);
        } else {
          setRole("user");
        }
      } catch {
        setRole("user");
      }
    },
    [supabase]
  );

  const refreshSession = useCallback(async () => {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await fetchUserRole(currentSession.user.id);
      } else {
        setRole("user");
      }
    } catch (err) {
      console.warn("Error refreshing auth session:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, fetchUserRole]);

  useEffect(() => {
    // Initial fetch of session and user
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);

      if (initialSession?.user) {
        fetchUserRole(initialSession.user.id);
        // Trigger automatic guest-to-cloud migration
        migrateGuestDataToCloud(initialSession.user.id).catch((err) =>
          console.warn("Guest data migration background error:", err)
        );
      } else {
        setRole("user");
      }
    });

    // Subscribe to auth state updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      if (newSession?.user) {
        fetchUserRole(newSession.user.id);
      } else {
        setRole("user");
      }

      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && newSession?.user) {
        // Seamlessly migrate guest work (recipes, favorites, groceries, etc.)
        migrateGuestDataToCloud(newSession.user.id).catch((err) =>
          console.warn("Guest data migration on sign-in error:", err)
        );
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRole("user");
    } catch (err) {
      console.warn("Sign out error:", err);
    }
  }, [supabase]);

  const signInWithPassword = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (result.data?.user) {
        setUser(result.data.user);
        setSession(result.data.session);
        migrateGuestDataToCloud(result.data.user.id).catch(() => {});
      }
      return result;
    },
    [supabase]
  );

  const signUp = useCallback(
    async ({
      email,
      password,
      displayName,
    }: {
      email: string;
      password: string;
      displayName?: string;
    }) => {
      const result = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName?.trim() || email.split("@")[0],
          },
        },
      });
      if (result.data?.user) {
        setUser(result.data.user);
        setSession(result.data.session);
        migrateGuestDataToCloud(result.data.user.id).catch(() => {});
      }
      return result;
    },
    [supabase]
  );

  const signInWithOAuth = useCallback(
    async (provider: "google" | "github") => {
      return await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
        },
      });
    },
    [supabase]
  );

  const signInWithOtp = useCallback(
    async (email: string) => {
      return await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
        },
      });
    },
    [supabase]
  );

  const resetPasswordForEmail = useCallback(
    async (email: string) => {
      return await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
      });
    },
    [supabase]
  );

  const updateUser = useCallback(
    async (attributes: { password?: string; data?: { display_name?: string } }) => {
      const result = await supabase.auth.updateUser(attributes);
      if (result.data?.user) {
        setUser(result.data.user);
      }
      return result;
    },
    [supabase]
  );

  const displayName = useMemo(() => {
    return (
      user?.user_metadata?.display_name ||
      user?.email?.split("@")[0] ||
      "Chef"
    );
  }, [user]);

  const userInitial = useMemo(() => {
    return displayName.charAt(0).toUpperCase();
  }, [displayName]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      isLoading,
      isGuest: !user && !isLoading,
      displayName,
      userInitial,
      role,
      isAdmin,
      signOut,
      signInWithPassword,
      signUp,
      signInWithOAuth,
      signInWithOtp,
      resetPasswordForEmail,
      updateUser,
      refreshSession,
    }),
    [
      user,
      session,
      isLoading,
      displayName,
      userInitial,
      role,
      isAdmin,
      signOut,
      signInWithPassword,
      signUp,
      signInWithOAuth,
      signInWithOtp,
      resetPasswordForEmail,
      updateUser,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
