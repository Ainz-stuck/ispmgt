"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase, createEphemeralSupabaseClient } from "../lib/supabase";
import { fetchProfile, insertNotification } from "../lib/supabase-data";
import { isInstitutionalRegistrationEmail, ROLE_LABELS } from "../lib/rbac";
import { getErrorMessage } from "../lib/utils";
import { User, UserRole, AuthView } from "../types";
import type { AuthChangeEvent, Session, User as SupabaseUser } from "@supabase/supabase-js";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  department: string;
  studentOrEmployeeId: string;
  password: string;
  role: "STUDENT" | "FACULTY";
}

const VALID_UNAUTH_VIEWS = new Set<AuthView>(["landing", "login", "register", "forgot-password"]);

interface AuthContextType {
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  authNotice: string | null;
  clearAuthNotice: () => void;
  authView: AuthView;
  setAuthView: (view: AuthView) => void;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  completePasswordRecovery: (
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authView, setAuthViewState] = useState<AuthView>("landing");
  const isExplicitLoginRef = useRef(false);
  const hasLoadedProfileRef = useRef(false);

  const setAuthView = useCallback((view: AuthView, replace = false) => {
    setAuthViewState(view);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (view === "app" || view === "landing") {
      url.searchParams.delete("auth");
    } else {
      url.searchParams.set("auth", view);
      url.searchParams.delete("tab");
    }
    const nextUrl = `${url.pathname}${url.search}${window.location.hash}`;
    if (replace) {
      window.history.replaceState(null, "", nextUrl);
    } else if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
      window.history.pushState(null, "", nextUrl);
    }
  }, []);

  const clearAuthNotice = useCallback(() => setAuthNotice(null), []);

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await fetchProfile(userId);
      if (!profile) {
        await supabase.auth.signOut();
        hasLoadedProfileRef.current = false;
        setCurrentUser(null);
        setIsAuthenticated(false);
        setAuthNotice("Unable to load your account profile. Please sign in again.");
        setAuthView("login");
        return;
      }
      if (profile.status === "DEACTIVATED") {
        await supabase.auth.signOut();
        hasLoadedProfileRef.current = false;
        setCurrentUser(null);
        setIsAuthenticated(false);
        setAuthNotice("Account suspended. Please contact the Facility Administrator.");
        setAuthView("login");
        return;
      }
      hasLoadedProfileRef.current = true;
      setAuthNotice(null);
      setCurrentUser(profile);
      setIsAuthenticated(true);
      setAuthView("app");
    } catch (err) {
      console.error("Failed to load user profile:", err);
      // Keep the existing session and token intact on transient network errors.
      setAuthNotice("Temporary network error verifying your profile. Please refresh the page to retry.");
      if (!hasLoadedProfileRef.current) {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setAuthView("login");
      }
    }
  }, [setAuthView]);

  const refreshCurrentUser = useCallback(async () => {
    if (supabaseUser?.id) {
      await loadUserProfile(supabaseUser.id);
    }
  }, [supabaseUser, loadUserProfile]);

  useEffect(() => {
    let recoveryMode = false;

    // 1. Initial session check
    supabase.auth.getSession().then((res) => {
      const activeSession = res?.data?.session;
      setSession(activeSession);
      setSupabaseUser(activeSession?.user ?? null);

      const isUrlRecovery =
        typeof window !== "undefined" &&
        window.location.hash.includes("type=recovery");

      if (isUrlRecovery) {
        recoveryMode = true;
        setIsPasswordRecovery(true);
        setAuthView("forgot-password");
        setIsLoading(false);
        return;
      }

      if (activeSession?.user) {
        loadUserProfile(activeSession.user.id).finally(() => setIsLoading(false));
      } else {
        if (typeof window !== "undefined") {
          const authParam = new URLSearchParams(window.location.search).get("auth") as AuthView | null;
          if (authParam && VALID_UNAUTH_VIEWS.has(authParam)) {
            setAuthViewState(authParam);
          }
        }
        setIsLoading(false);
      }
    });

    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const authParam = new URLSearchParams(window.location.search).get("auth") as AuthView | null;
      if (authParam && VALID_UNAUTH_VIEWS.has(authParam)) {
        setAuthViewState(authParam);
      } else if (!recoveryMode) {
        setAuthViewState((prev) => (prev === "app" ? "app" : "landing"));
      }
    };
    window.addEventListener("popstate", handlePopState);

    // 2. Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, activeSession: Session | null) => {
      setSession(activeSession);
      setSupabaseUser(activeSession?.user ?? null);

      if (event === "PASSWORD_RECOVERY") {
        recoveryMode = true;
        setIsPasswordRecovery(true);
        setIsAuthenticated(false);
        setAuthView("forgot-password");
        setIsLoading(false);
        return;
      }

      if (recoveryMode) {
        setIsLoading(false);
        return;
      }

      if (activeSession?.user) {
        if (event === "SIGNED_IN" && isExplicitLoginRef.current) {
          setIsLoading(false);
          return;
        }
        await loadUserProfile(activeSession.user.id);
      } else {
        hasLoadedProfileRef.current = false;
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loadUserProfile, setAuthView]);

  const login = async (email: string, password: string) => {
    setAuthNotice(null);
    isExplicitLoginRef.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data.user) {
        return {
          success: false,
          error: error?.message || "Invalid credentials. Please try again.",
        };
      }

      let profile = await fetchProfile(data.user.id);
      if (!profile) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        profile = await fetchProfile(data.user.id);
      }

      if (!profile) {
        await supabase.auth.signOut();
        return { success: false, error: "Profile not found for this account." };
      }

      if (profile.status === "DEACTIVATED") {
        await supabase.auth.signOut();
        return {
          success: false,
          error: "Account suspended. Please contact the Facility Administrator.",
        };
      }

      hasLoadedProfileRef.current = true;
      setCurrentUser(profile);
      setIsAuthenticated(true);
      setAuthView("app");
      return { success: true, role: profile.role };
    } catch (err) {
      return {
        success: false,
        error: getErrorMessage(err, "Unable to sign in. Please try again."),
      };
    } finally {
      isExplicitLoginRef.current = false;
    }
  };

  const register = async (payload: RegisterPayload) => {
    setAuthNotice(null);
    const normalizedEmail = payload.email.trim().toLowerCase();
    const cleanId = payload.studentOrEmployeeId.trim().toUpperCase();

    if (!isInstitutionalRegistrationEmail(normalizedEmail)) {
      return {
        success: false,
        error: "New institutional accounts must use an official @chmsu.edu.ph email address.",
      };
    }

    if (!cleanId) {
      return {
        success: false,
        error: "Student or Employee ID is required.",
      };
    }

    // Standard Student / Faculty & Staff signup (role enforced in DB trigger)
    const targetRole = payload.role === "FACULTY" ? "FACULTY" : "STUDENT";

    isExplicitLoginRef.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: payload.password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
          data: {
            name: `${payload.firstName} ${payload.lastName}`.trim(),
            first_name: payload.firstName.trim(),
            last_name: payload.lastName.trim(),
            contact_number: payload.contactNumber.trim(),
            department: payload.department,
            role: targetRole,
            student_or_employee_id: cleanId,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        setAuthNotice(
          "Registration received. Please check your @chmsu.edu.ph email to confirm your account before signing in."
        );
        setAuthView("login");
        return { success: true };
      }

      if (data.user) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const profile = await fetchProfile(data.user.id);
        if (profile) {
          hasLoadedProfileRef.current = true;
          setCurrentUser(profile);
          setIsAuthenticated(true);
          setAuthView("app");
        }

        await insertNotification({
          userId: data.user.id,
          title: "Welcome to UniSpace",
          message: `Your account as ${ROLE_LABELS[targetRole]} is verified and active.`,
          type: "ACCOUNT_SECURITY",
          timestamp: new Date().toISOString(),
          read: false,
        }).catch(() => {});
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: getErrorMessage(err, "Registration succeeded, but loading your profile failed. Please sign in."),
      };
    } finally {
      isExplicitLoginRef.current = false;
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
      }
    );

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const completePasswordRecovery = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    setIsPasswordRecovery(false);
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    if (data?.user) {
      await loadUserProfile(data.user.id);
    }

    return { success: true };
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const userEmail = currentUser?.email || supabaseUser?.email;
    if (!userEmail) {
      return { success: false, error: "No authenticated user email found." };
    }

    // Verify current password using an isolated non-persisting client so the active session stays intact
    const ephemeralClient = createEphemeralSupabaseClient();
    const { error: verifyError } = await ephemeralClient.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    if (verifyError) {
      return { success: false, error: "Current password is incorrect." };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  };

  const logout = async () => {
    setIsPasswordRecovery(false);
    hasLoadedProfileRef.current = false;
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthView("landing");
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        supabaseUser,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        isLoading,
        isPasswordRecovery,
        authNotice,
        clearAuthNotice,
        authView,
        setAuthView,
        login,
        register,
        resetPassword,
        completePasswordRecovery,
        changePassword,
        logout,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AppProvider");
  }
  return context;
}
