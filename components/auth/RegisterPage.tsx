"use client";

import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";
import {
  Buildings,
  Eye,
  EyeSlash,
  UserPlus,
  ArrowLeft,
  WarningCircle,
  ShieldCheck,
  User,
} from "@phosphor-icons/react";

export function RegisterPage() {
  const { register, setAuthView } = useApp();

  // Personal Information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [department, setDepartment] = useState("");

  // Account Information
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Role Selection (Student or Faculty Member only)
  const [role, setRole] = useState<"STUDENT" | "FACULTY">("STUDENT");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const departmentsList = [
    { value: "", label: "Select Your Department / College" },
    { value: "College of Computer Studies", label: "College of Computer Studies" },
    { value: "College of Engineering", label: "College of Engineering" },
    { value: "Department of Performing Arts", label: "Department of Performing Arts" },
    { value: "Department of Athletics & Kinesiology", label: "Department of Athletics & Kinesiology" },
    { value: "College of Business & Administration", label: "College of Business & Administration" },
    { value: "Central Library Learning Resources", label: "Central Library Learning Resources" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      setError("Please provide a valid institutional email address.");
      return;
    }
    if (!contactNumber.trim()) {
      setError("Contact number is required for facility reservation alerts.");
      return;
    }
    if (!department) {
      setError("Please select your academic department or college.");
      return;
    }
    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your confirmation password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const res = register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        contactNumber: contactNumber.trim(),
        department,
        password,
        role,
      });

      setIsLoading(false);
      if (!res.success) {
        setError(res.error || "Registration failed.");
      }
    }, 450);
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
      <div className="w-full max-w-xl p-1.5 rounded-[2.25rem] bg-zinc-200/60 dark:bg-zinc-800/50 ring-1 ring-black/[0.05] dark:ring-white/[0.08] shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] my-10">
        <div className="w-full rounded-[calc(2.25rem-0.375rem)] bg-white dark:bg-zinc-900 border border-black/[0.03] dark:border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] p-7 sm:p-9 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0F5132] flex items-center justify-center text-white mx-auto shadow-md ring-2 ring-emerald-600/30">
              <Buildings size={26} weight="bold" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-emerald-50 text-[#0F5132] dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500/20">
              <User size={12} weight="fill" />
              <span>New User Registration</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Create UniSpace Account
            </h1>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              University Facility Booking and Resource Scheduling System
            </p>
          </div>

          {/* Admin Policy Notice */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-[#0F5132] shrink-0 mt-0.5" />
            <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">
              Public registration is available for <strong>Students</strong> and{" "}
              <strong>Faculty Members</strong>. Facility Administrator accounts are issued internally
              by the Central Operations Directorate.
            </div>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
              <WarningCircle size={16} weight="fill" className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection Dropdown */}
            <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <Select
                label="Account Role Type"
                value={role}
                onChange={(e) => setRole(e.target.value as "STUDENT" | "FACULTY")}
                options={[
                  { value: "STUDENT", label: "Student (Collegiate & Organization Reservations)" },
                  { value: "FACULTY", label: "Faculty Member (Priority Academic & Research Allocations)" },
                ]}
                helperText="Select your primary academic standing with the university."
                required
              />
            </div>

            {/* Section: Personal Information */}
            <div className="space-y-3 pt-2">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Personal Information
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  placeholder="e.g. Jordan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <Input
                  label="Last Name"
                  placeholder="e.g. Taylor"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Institutional Email Address"
                  type="email"
                  placeholder="e.g. j.taylor@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  helperText="Must be a valid @university.edu address"
                  required
                />
                <Input
                  label="Contact Number"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  helperText="Used for schedule SMS alerts"
                  required
                />
              </div>

              <Select
                label="Academic Department / College"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={departmentsList}
                required
              />
            </div>

            {/* Section: Account Credentials */}
            <div className="space-y-3 pt-2">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Account Security Credentials
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="reg-password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full min-h-[44px] h-11 sm:h-10 px-3.5 pr-10 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 focus:border-[#0F5132]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="min-h-[44px] min-w-[44px] absolute right-0 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    >
                      {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-confirm-password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Confirm Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="reg-confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full min-h-[44px] h-11 sm:h-10 px-3.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 focus:border-[#0F5132]"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              pill
              fullWidth
              disabled={isLoading}
              trailingIcon={<UserPlus size={18} weight="bold" />}
              className="mt-4 shadow-lg min-h-[48px]"
            >
              {isLoading ? "Creating Account..." : "Complete Registration"}
            </Button>
          </form>

          <div className="text-center text-xs text-zinc-500 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            Already have an institutional account?{" "}
            <button
              type="button"
              onClick={() => setAuthView("login")}
              className="font-bold text-[#0F5132] dark:text-emerald-400 hover:underline ml-1"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

