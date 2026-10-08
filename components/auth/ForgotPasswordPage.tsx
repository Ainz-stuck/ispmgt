"use client";

import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  ArrowLeft,
  CheckCircle,
  WarningCircle,
  Key,
  PaperPlaneTilt,
  LockKeyOpen,
} from "@phosphor-icons/react";

export function ForgotPasswordPage() {
  const { resetPassword, setAuthView } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid institutional email address.");
      return;
    }
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setStep(2); // Move to code / new password step
    }, 450);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const res = resetPassword(email, newPassword);
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || "Password reset failed.");
      } else {
        setStep(3); // Success step
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-8 bg-[#FAFAFB] dark:bg-[#09090B] font-sans relative">
      <button
        type="button"
        onClick={() => setAuthView("login")}
        className="absolute top-6 left-6 flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors py-2 px-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
      >
        <ArrowLeft size={16} weight="bold" />
        <span>Back to Login</span>
      </button>

      {/* Double-Bezel Hardware Auth Enclosure */}
      <div className="w-full max-w-md p-1.5 rounded-[2.25rem] bg-zinc-200/60 dark:bg-zinc-800/50 ring-1 ring-black/[0.05] dark:ring-white/[0.08] shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
        <div className="w-full rounded-[calc(2.25rem-0.375rem)] bg-white dark:bg-zinc-900 border border-black/[0.03] dark:border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] p-7 sm:p-9 space-y-6">
          
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0F5132] flex items-center justify-center text-white mx-auto shadow-md ring-2 ring-emerald-600/30">
              <Key size={26} weight="bold" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-emerald-50 text-[#0F5132] dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500/20">
              <LockKeyOpen size={12} weight="fill" />
              <span>Identity Verification</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Password Recovery
            </h1>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              {step === 1
                ? "Enter your email to receive a password reset authorization token"
                : step === 2
                ? "Authorization token issued! Configure your new password"
                : "Institutional password successfully updated!"}
            </p>
          </div>

          {/* Error notification */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
              <WarningCircle size={16} weight="fill" className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleSendLink} className="space-y-4">
              <Input
                label="Institutional Email Address"
                type="email"
                placeholder="e.g. alex.vance@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                helperText="We will send a 6-digit security reset code to this address."
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                pill
                fullWidth
                disabled={isLoading}
                trailingIcon={<PaperPlaneTilt size={18} weight="bold" />}
                className="mt-2 shadow-lg"
              >
                {isLoading ? "Dispatching Reset Code..." : "Receive Reset Link"}
              </Button>
            </form>
          )}

          {/* STEP 2: Enter Code & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
                A verification token has been simulated for <strong>{email}</strong>.
              </div>

              <Input
                label="Verification Reset Token"
                placeholder="e.g. 849201"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                helperText="Enter 6-digit code or leave default for test bypass"
              />

              <Input
                label="New Password"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                pill
                fullWidth
                disabled={isLoading}
                trailingIcon={<CheckCircle size={18} weight="bold" />}
                className="mt-2 shadow-lg"
              >
                {isLoading ? "Updating Password..." : "Create New Password"}
              </Button>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#0F5132] dark:text-emerald-300 flex items-center justify-center mx-auto ring-4 ring-emerald-500/20">
                <CheckCircle size={36} weight="fill" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                  Password Reset Complete
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
                  Your new password has been verified in the central institutional directory. You can now
                  sign in to UniSpace with your updated credentials.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                pill
                fullWidth
                onClick={() => setAuthView("login")}
                className="shadow-md"
              >
                Return to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

