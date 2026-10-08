"use client";

import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  Buildings,
  Eye,
  EyeSlash,
  SignIn,
  ArrowLeft,
  WarningCircle,
  Student,
  ChalkboardTeacher,
  ShieldCheck,
  CheckCircle,
  Shield,
} from "@phosphor-icons/react";

export function LoginPage() {
  const { login, setAuthView } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please provide your institutional email and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const res = login(email, password);
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || "Login failed.");
      }
    }, 350);
  };

  const fillQuickCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-8 bg-[#FAFAFB] dark:bg-[#09090B] font-sans relative">
      {/* Return to Landing link */}
      <button
        type="button"
        onClick={() => setAuthView("landing")}
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors py-2 px-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
      >
        <ArrowLeft size={16} weight="bold" />
        <span>Return to Landing</span>
      </button>

      {/* Double-Bezel Hardware Auth Enclosure */}
      <div className="w-full max-w-md p-1.5 rounded-[2.25rem] bg-zinc-200/60 dark:bg-zinc-800/50 ring-1 ring-black/[0.05] dark:ring-white/[0.08] shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
        <div className="w-full rounded-[calc(2.25rem-0.375rem)] bg-white dark:bg-zinc-900 border border-black/[0.03] dark:border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] p-7 sm:p-9 space-y-6">
          
          {/* Logo & Eyebrow Tag */}
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0F5132] flex items-center justify-center text-white mx-auto shadow-md ring-2 ring-emerald-600/30">
              <Buildings size={26} weight="bold" />
            </div>
            
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-emerald-50 text-[#0F5132] dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500/20">
              <Shield size={12} weight="fill" />
              <span>Institutional Access</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Sign In to UniSpace
            </h1>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              Greenwich University Central Facility & Resource Portal
            </p>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
              <WarningCircle size={16} weight="fill" className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Institutional Email Address"
              type="email"
              placeholder="e.g. alex.vance@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password with Show/Hide toggle */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Password <span className="text-rose-600">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[44px] h-11 sm:h-10 px-3.5 pr-10 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 focus:border-[#0F5132]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="min-h-[44px] min-w-[44px] absolute right-0 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1 min-h-[44px]">
              <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-600 dark:text-zinc-400 min-h-[44px]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#0F5132] focus:ring-[#0F5132] w-4 h-4"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setAuthView("forgot-password")}
                className="font-medium text-[#0F5132] dark:text-emerald-400 hover:underline min-h-[44px] flex items-center"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button with Button-in-Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              pill
              fullWidth
              disabled={isLoading}
              trailingIcon={<SignIn size={18} weight="bold" />}
              className="mt-2 shadow-lg min-h-[48px]"
            >
              {isLoading ? "Authenticating..." : "Login"}
            </Button>
          </form>

          {/* Demo Fast Login Switcher */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5 text-center">
              One-Click Role Demonstration
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  fillQuickCredentials("alex.vance@university.edu", "password123")
                }
                className="min-h-[44px] p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-left hover:border-blue-300 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                <div className="flex items-center gap-1 font-bold text-blue-900 dark:text-blue-300 text-[11px]">
                  <Student size={14} weight="bold" /> Student
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">Alex Vance · Request</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  fillQuickCredentials("e.reed@university.edu", "password123")
                }
                className="min-h-[44px] p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60 text-left hover:border-purple-300 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                <div className="flex items-center gap-1 font-bold text-purple-900 dark:text-purple-300 text-[11px]">
                  <ChalkboardTeacher size={14} weight="bold" /> Faculty
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">Dr. Reed · Priority</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  fillQuickCredentials("m.holloway@university.edu", "adminpassword")
                }
                className="min-h-[44px] p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 text-left hover:border-emerald-300 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                <div className="flex items-center gap-1 font-bold text-emerald-900 dark:text-emerald-300 text-[11px]">
                  <ShieldCheck size={14} weight="bold" /> Admin
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">Marcus H. · Approvals</div>
              </button>
            </div>
          </div>

          {/* Footer: Create Account */}
          <div className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            Don&apos;t have an institutional account?{" "}
            <button
              type="button"
              onClick={() => setAuthView("register")}
              className="font-bold text-[#0F5132] dark:text-emerald-400 hover:underline ml-1"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

