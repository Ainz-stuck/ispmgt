"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { fetchProfile, insertNotification } from "../lib/supabase-data";
import { User, UserRole, AuthView } from "../types";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  department: string;
  password: string;
  role: "STUDENT" | "FACULTY" | "ADMINISTRATOR";
  inviteCode?: string;
}

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
  const [authView, setAuthView] = useState<AuthView>("landing");

  const clearAuthNotice = useCallback(() => setAuthNotice(null), []);

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await fetchProfile(userId);
      if (profile) {
        if (profile.status === "DEACTIVATED") {
          await supabase.auth.signOut();
          setCurrentUser(null);
          setIsAuthenticated(false);
          setAuthNotice("Account suspended. Please contact the Facility Administrator.");
          setAuthView("login");
          return;
        }
        setAuthNotice(null);
        setCurrentUser(profile);
        setIsAuthenticated(true);
        setAuthView("app");
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    if (supabaseUser?.id) {
      await loadUserProfile(supabaseUser.id);
    }
  }, [supabaseUser, loadUserProfile]);

  useEffect(() => {
    let recoveryMode = false;

    // 1. Initial session check
    supabase.auth.getSession().then((res: any) => {
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
        setIsLoading(false);
      }
    });

    // 2. Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, activeSession: any) => {
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
        await loadUserProfile(activeSession.user.id);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const login = async (email: string, password: string) => {
    setAuthNotice(null);
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

    setCurrentUser(profile);
    setIsAuthenticated(true);
    setAuthView("app");
    return { success: true, role: profile.role };
  };

  const register = async (payload: RegisterPayload) => {
    setAuthNotice(null);
    const normalizedEmail = payload.email.trim().toLowerCase();

    // If an admin invite code is provided, validate & create securely on the server
    if (payload.inviteCode?.trim()) {
      const response = await fetch("/api/auth/register-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          email: normalizedEmail,
          contactNumber: payload.contactNumber.trim(),
          department: payload.department,
          password: payload.password,
          inviteCode: payload.inviteCode.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Administrator registration failed.",
        };
      }

      const signInRes = await login(normalizedEmail, payload.password);
      if (!signInRes.success) {
        return { success: false, error: signInRes.error };
      }

      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        await insertNotification({
          userId: userData.user.id,
          title: "Welcome to UniSpace",
          message: "Your Facility Administrator account is verified and active.",
          type: "ACCOUNT_SECURITY",
          timestamp: new Date().toISOString(),
          read: false,
        }).catch(() => {});
      }

      return { success: true };
    }

    // Standard Student / Faculty signup (role enforced in DB trigger)
    const targetRole = payload.role === "FACULTY" ? "FACULTY" : "STUDENT";
    const studentOrEmployeeId =
      targetRole === "STUDENT"
        ? `2026-${Math.floor(10000 + Math.random() * 90000)}`
        : `FAC-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: payload.password,
      options: {
        data: {
          name: `${payload.firstName} ${payload.lastName}`.trim(),
          first_name: payload.firstName.trim(),
          last_name: payload.lastName.trim(),
          contact_number: payload.contactNumber.trim(),
          department: payload.department,
          role: targetRole,
          student_or_employee_id: studentOrEmployeeId,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const profile = await fetchProfile(data.user.id);
      if (profile) {
        setCurrentUser(profile);
        setIsAuthenticated(true);
        setAuthView("app");
      }

      await insertNotification({
        userId: data.user.id,
        title: "Welcome to UniSpace",
        message: `Your account as a ${
          targetRole === "STUDENT" ? "Student" : "Faculty Member"
        } is verified and active.`,
        type: "ACCOUNT_SECURITY",
        timestamp: new Date().toISOString(),
        read: false,
      }).catch(() => {});
    }

    return { success: true };
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

    // Verify current password first
    const { error: verifyError } = await supabase.auth.signInWithPassword({
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
