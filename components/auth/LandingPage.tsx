"use client";

import React from "react";
import Image from "next/image";
import { useApp } from "../../context/AppContext";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/Badge";
import { FacilityCard } from "../facilities/FacilityCard";
import {
  Buildings,
  Calendar,
  Package,
  Bell,
  CheckCircle,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Clock,
  Sparkle,
  SignIn,
  UserPlus,
  Users,
} from "@phosphor-icons/react";

export function LandingPage() {
  const { setAuthView, facilities, setSelectedFacilityId, openBookingModal } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFB] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-50 font-sans selection:bg-[#0F5132] selection:text-white">
      {/* Top Institutional Notification Hairline */}
      <div className="bg-[#0A3622] text-white text-[11px] px-4 sm:px-8 py-2 flex items-center justify-between border-b border-emerald-950 font-mono tracking-wide">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-medium text-emerald-100">
            Carlos Hilado Memorial State University - Talisay Campus
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-emerald-200 text-[10px]">
          <span>Academic Year 2026-2027</span>
          <span className="opacity-40">/</span>
          <span>Operating: 06:00 - 22:00 PHT</span>
          <span className="opacity-40">/</span>
          <span className="text-emerald-300 font-semibold">Live System Online</span>
        </div>
      </div>

      {/* Floating Island Navigation Bar */}
      <div className="sticky top-4 z-40 px-4 sm:px-6 w-full max-w-7xl mx-auto">
        <header className="rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl ring-1 ring-black/[0.06] dark:ring-white/[0.08] shadow-[0_16px_32px_-8px_rgba(0,0,0,0.08)] px-5 sm:px-7 h-16 flex items-center justify-between transition-all duration-300">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0F5132] flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-600/30">
              <Buildings size={20} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  UniSpace
                </span>
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-[#0F5132] dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500/20 font-semibold tracking-wider">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <a href="#features" className="hover:text-[#0F5132] dark:hover:text-emerald-400 transition-colors">
              Platform Modules
            </a>
            <a href="#facilities" className="hover:text-[#0F5132] dark:hover:text-emerald-400 transition-colors">
              6 Campus Venues
            </a>
            <a href="#specs" className="hover:text-[#0F5132] dark:hover:text-emerald-400 transition-colors">
              Booking Guidelines
            </a>
          </div>

          {/* Auth Actions with Pill Architecture */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              pill
              onClick={() => setAuthView("login")}
              className="text-xs min-h-[44px] px-3 sm:px-4"
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              pill
              onClick={() => setAuthView("register")}
              trailingIcon={<UserPlus size={13} weight="bold" />}
              className="text-xs shadow-md min-h-[44px] px-3.5 sm:px-4"
            >
              Create Account
            </Button>
          </div>
        </header>
      </div>

      {/* HERO SECTION WITH MACRO-WHITESPACE & CINEMATIC DEPTH */}
      <section className="relative overflow-hidden pt-12 pb-24 sm:pt-20 sm:pb-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Double-Bezel Hero Showcase Shell */}
        <div className="relative rounded-[2.5rem] p-2 bg-zinc-200/50 dark:bg-zinc-800/40 ring-1 ring-black/[0.05] dark:ring-white/[0.08] shadow-2xl">
          <div className="relative rounded-[calc(2.5rem-0.5rem)] overflow-hidden bg-zinc-950 text-white min-h-[580px] sm:min-h-[640px] flex flex-col justify-between p-6 sm:p-14 lg:p-16 border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            
            {/* Background Architectural Canvas */}
            <Image
              src="/images/campus_hero.jpg"
              alt="Greenwich University Campus Architecture"
              fill
              priority
              className="object-cover opacity-35 mix-blend-luminosity hover:scale-105 transition-transform duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/50 to-transparent pointer-events-none" />

            {/* Top Microscopic Eyebrow Badge */}
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] uppercase tracking-[0.25em] font-semibold bg-white/10 backdrop-blur-xl border border-white/20 text-emerald-300">
                <ShieldCheck size={14} weight="fill" />
                <span>Centralized Institutional Facility Scheduling</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>6 Facilities Certified</span>
              </div>
            </div>

            {/* Center Content: Massive Editorial Typography & Narrative */}
            <div className="relative z-10 my-auto py-10 max-w-4xl space-y-6">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.06] font-sans">
                University Facility Booking & Resource Scheduling System
              </h1>

              <p className="text-base sm:text-xl text-zinc-300 max-w-2xl font-normal leading-relaxed">
                Reserve university facilities easily and manage schedules efficiently. Centralized booking, mathematical collision prevention, and instant equipment tracking.
              </p>

              {/* Primary Interactive CTAs with Button-in-Button Trailing Icons */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Button
                  size="lg"
                  pill
                  onClick={() => setAuthView("login")}
                  trailingIcon={<SignIn size={18} weight="bold" />}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-2xl px-8 font-semibold text-sm sm:text-base min-h-[48px] justify-center"
                >
                  Login to Portal
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  pill
                  onClick={() => setAuthView("register")}
                  trailingIcon={<UserPlus size={18} weight="bold" />}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xl px-8 font-semibold text-sm sm:text-base shadow-xl min-h-[48px] justify-center"
                >
                  Create Account
                </Button>
              </div>
            </div>

            {/* Bottom Hardware Metric Strip */}
            <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
              <div className="flex flex-wrap items-center gap-6">
                <span className="flex items-center gap-2">
                  <CheckCircle size={15} weight="fill" className="text-emerald-400" />
                  <span className="text-zinc-200">Strictly 6 Official Venues</span>
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle size={15} weight="fill" className="text-emerald-400" />
                  <span className="text-zinc-200">Zero Double-Booking Engine</span>
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle size={15} weight="fill" className="text-emerald-400" />
                  <span className="text-zinc-200">Centralized Equipment Tracking</span>
                </span>
              </div>
              <div className="font-mono text-[11px] text-zinc-400">
                Greenwich Institutional v2.6
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ASYMMETRICAL BENTO: FEATURE HIGHLIGHTS */}
      <section id="features" className="py-24 sm:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-16">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-emerald-50 text-[#0F5132] dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500/20">
            <Sparkle size={12} weight="fill" />
            <span>Architecture & Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Engineered for High-Consequence Academic Logistics
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Eliminating conflicting reservations, paper-based forms, and inventory losses through an institutional-grade scheduling core.
          </p>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-6">
          
          {/* Card 1: Facility Reservation (Hero Bento Spanning 7 Cols) */}
          <div className="lg:col-span-7 group/bento p-1.5 rounded-[2rem] bg-zinc-200/60 dark:bg-zinc-800/40 ring-1 ring-black/[0.05] dark:ring-white/[0.08] hover:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white dark:bg-zinc-900 p-8 sm:p-10 border border-black/[0.03] dark:border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-[#0F5132] dark:text-emerald-300 flex items-center justify-center ring-1 ring-emerald-500/20">
                  <Buildings size={26} weight="bold" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Facility Reservation
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg">
                  Browse 6 dedicated campus venues with detailed floor capacities, acoustic specifications,
                  custodian contacts, and real-time operational availability. Students and faculty can reserve spaces with immediate validation.
                </p>
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px]">
                  Capacities: 80 - 500 Pax
                </span>
                <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px]">
                  Instant Guideline Access
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Schedule Management (Spanning 5 Cols) */}
          <div className="lg:col-span-5 group/bento p-1.5 rounded-[2rem] bg-zinc-200/60 dark:bg-zinc-800/40 ring-1 ring-black/[0.05] dark:ring-white/[0.08] hover:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white dark:bg-zinc-900 p-8 sm:p-10 border border-black/[0.03] dark:border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center ring-1 ring-blue-500/20">
                  <Calendar size={26} weight="bold" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Schedule Management
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Interactive monthly, weekly, and daily calendars with built-in mathematical double-booking
                  prevention and conflict alerts. Never double-book another collegiate hall.
                </p>
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 font-semibold">
                <CheckCircle size={16} weight="fill" />
                <span>Interval Collision Algorithm Active</span>
              </div>
            </div>
          </div>

          {/* Card 3: Resource Tracking (Spanning 6 Cols) */}
          <div className="lg:col-span-6 group/bento p-1.5 rounded-[2rem] bg-zinc-200/60 dark:bg-zinc-800/40 ring-1 ring-black/[0.05] dark:ring-white/[0.08] hover:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white dark:bg-zinc-900 p-8 sm:p-10 border border-black/[0.03] dark:border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center ring-1 ring-purple-500/20">
                  <Package size={26} weight="bold" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Resource Tracking
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Reserve laser projectors, pro audio, microphones, chairs, and tables from central campus
                  inventory with wear-and-tear monitoring and custodial checklists.
                </p>
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-xs text-purple-700 dark:text-purple-400 font-semibold">
                <CheckCircle size={16} weight="fill" />
                <span>Audited Central Campus Warehouse</span>
              </div>
            </div>
          </div>

          {/* Card 4: Notifications & Governance (Spanning 6 Cols) */}
          <div className="lg:col-span-6 group/bento p-1.5 rounded-[2rem] bg-zinc-200/60 dark:bg-zinc-800/40 ring-1 ring-black/[0.05] dark:ring-white/[0.08] hover:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
            <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white dark:bg-zinc-900 p-8 sm:p-10 border border-black/[0.03] dark:border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center ring-1 ring-amber-500/20">
                  <Bell size={26} weight="bold" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Notifications & Governance
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Instant alerts for submission receipts, administrative approvals, rejection remarks,
                  and emergency maintenance notices sent directly to students and faculty.
                </p>
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-semibold">
                <CheckCircle size={16} weight="fill" />
                <span>Live Audit Trails & Timestamping</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* MANAGED CAMPUS FACILITIES PREVIEW WITH DOUBLE-BEZEL CARDS */}
      <section id="facilities" className="py-24 sm:py-32 bg-zinc-100/60 dark:bg-zinc-900/30 border-y border-zinc-200/80 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-emerald-100 text-[#0F5132] dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500/20">
                <span>Certified Catalog</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Managed Campus Facilities
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500">
                The 6 certified university venues available for verified academic and collegiate bookings
              </p>
            </div>
            
            <Button
              variant="secondary"
              size="md"
              pill
              onClick={() => setAuthView("login")}
              trailingIcon={<ArrowRight size={14} weight="bold" />}
              className="min-h-[44px] w-full sm:w-auto justify-center"
            >
              Sign In to Reserve
            </Button>
          </div>

          {/* 6 Facilities Cards in Double-Bezel Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.map((f) => (
              <FacilityCard
                key={f.id}
                facility={f}
                onViewDetails={() => setAuthView("login")}
                onReserve={() => setAuthView("login")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-zinc-950 text-zinc-400 py-16 border-t border-zinc-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0F5132] flex items-center justify-center text-white ring-2 ring-emerald-600/30">
              <Buildings size={18} weight="bold" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">UniSpace System</div>
              <div className="text-[11px] text-zinc-500">Carlos Hilado Memorial State University</div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-zinc-400">
            <button
              onClick={() => setAuthView("login")}
              className="hover:text-emerald-400 transition-colors"
            >
              Portal Login
            </button>
            <span className="opacity-30">·</span>
            <button
              onClick={() => setAuthView("register")}
              className="hover:text-emerald-400 transition-colors"
            >
              Register Account
            </button>
            <span className="opacity-30">·</span>
            <button
              onClick={() => setAuthView("forgot-password")}
              className="hover:text-emerald-400 transition-colors"
            >
              Password Recovery
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

