"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { fetchProfile } from "../lib/supabase-data";
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
  authView: AuthView;
  setAuthView: (view: AuthView) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
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
  const [authView, setAuthView] = useState<AuthView>("landing");

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await fetchProfile(userId);
      if (profile) {
        if (profile.status === "DEACTIVATED") {
          await supabase.auth.signOut();
          setCurrentUser(null);
          setIsAuthenticated(false);
          setAuthView("login");
          return { error: "Account suspended. Please contact the Facility Administrator." };
        }
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
    // 1. Initial session check
    supabase.auth.getSession().then((res: any) => {
      const session = res?.data?.session;
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // 2. Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        await loadUserProfile(session.user.id);
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
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user) {
      setIsLoading(false);
      return { success: false, error: error?.message || "Invalid credentials. Please try again." };
    }

    const profile = await fetchProfile(data.user.id);
    if (!profile) {
      // Profile might still be generating from trigger, wait a moment
      await new Promise((resolve) => setTimeout(resolve, 500));
      const retryProfile = await fetchProfile(data.user.id);
      if (!retryProfile) {
        setIsLoading(false);
        return { success: false, error: "Profile not found for this account." };
      }
      if (retryProfile.status === "DEACTIVATED") {
        await supabase.auth.signOut();
        setIsLoading(false);
        return { success: false, error: "Account suspended. Please contact the Facility Administrator." };
      }
      setCurrentUser(retryProfile);
      setIsAuthenticated(true);
      setAuthView("app");
      setIsLoading(false);
      return { success: true, role: retryProfile.role };
    }

    if (profile.status === "DEACTIVATED") {
      await supabase.auth.signOut();
      setIsLoading(false);
      return { success: false, error: "Account suspended. Please contact the Facility Administrator." };
    }

    setCurrentUser(profile);
    setIsAuthenticated(true);
    setAuthView("app");
    setIsLoading(false);
    return { success: true, role: profile.role };
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);

    const validAdminCode = process.env.NEXT_PUBLIC_ADMIN_INVITE_CODE || "UNISPACE-ADMIN-2026";
    const isAdmin = payload.inviteCode?.trim().toUpperCase() === validAdminCode;
    const targetRole: UserRole = isAdmin ? "ADMINISTRATOR" : (payload.role as UserRole);

    const studentOrEmployeeId =
      targetRole === "STUDENT"
        ? `2026-${Math.floor(10000 + Math.random() * 90000)}`
        : targetRole === "ADMINISTRATOR"
        ? `ADM-${Math.floor(1000 + Math.random() * 9000)}`
        : `FAC-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data, error } = await supabase.auth.signUp({
      email: payload.email.trim().toLowerCase(),
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
      setIsLoading(false);
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Small pause for trigger execution
      await new Promise((resolve) => setTimeout(resolve, 600));
      const profile = await fetchProfile(data.user.id);
      if (profile) {
        setCurrentUser(profile);
        setIsAuthenticated(true);
        setAuthView("app");
      }
    }

    setIsLoading(false);
    return { success: true };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const logout = async () => {
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
        authView,
        setAuthView,
        login,
        register,
        resetPassword,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
