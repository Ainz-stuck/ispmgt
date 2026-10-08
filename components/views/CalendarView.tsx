"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { FacilityId, Reservation } from "../../types";
import { StatusBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardBody } from "../ui/Card";
import {
  Calendar as CalendarIcon,
  CaretLeft,
  CaretRight,
  Clock,
  MapPin,
  Plus,
  PlusCircle,
  Users,
  ShieldCheck,
  CheckCircle,
  Buildings,
  Printer,
  MagnifyingGlass,
  ArrowClockwise,
  ClockCountdown,
  TrendUp,
  Tag,
  Funnel,
  Sparkle,
} from "@phosphor-icons/react";

type CalendarViewMode = "MONTH" | "WEEK" | "DAY";

// Signature Color Profiles per Facility
const VENUE_THEMES: Record<
  FacilityId,
  {
    bg: string;
    border: string;
    text: string;
    badge: string;
    dot: string;
    label: string;
  }
> = {
  "function-hall": {
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-300 dark:border-emerald-800",
    text: "text-emerald-950 dark:text-emerald-200",
    badge: "bg-emerald-100 text-[#0F5132] dark:bg-emerald-900/80 dark:text-emerald-300",
    dot: "bg-emerald-500",
    label: "Function Hall",
  },
  "dining-hall": {
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-300 dark:border-amber-800",
    text: "text-amber-950 dark:text-amber-200",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-900/80 dark:text-amber-300",
    dot: "bg-amber-500",
    label: "Dining Hall",
  },
  gym: {
    bg: "bg-blue-50 dark:bg-blue-950/50",
    border: "border-blue-300 dark:border-blue-800",
    text: "text-blue-950 dark:text-blue-200",
    badge: "bg-blue-100 text-blue-900 dark:bg-blue-900/80 dark:text-blue-300",
    dot: "bg-blue-500",
    label: "Gym",
  },
  "dance-hall": {
    bg: "bg-purple-50 dark:bg-purple-950/50",
    border: "border-purple-300 dark:border-purple-800",
    text: "text-purple-950 dark:text-purple-200",
    badge: "bg-purple-100 text-purple-900 dark:bg-purple-900/80 dark:text-purple-300",
    dot: "bg-purple-500",
    label: "Dance Hall",
  },
  avr: {
    bg: "bg-cyan-50 dark:bg-cyan-950/50",
    border: "border-cyan-300 dark:border-cyan-800",
    text: "text-cyan-950 dark:text-cyan-200",
    badge: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/80 dark:text-cyan-300",
    dot: "bg-cyan-500",
    label: "AVR",
  },
  "rooftop-engineering": {
    bg: "bg-orange-50 dark:bg-orange-950/50",
    border: "border-orange-300 dark:border-orange-800",
    text: "text-orange-950 dark:text-orange-200",
    badge: "bg-orange-100 text-orange-900 dark:bg-orange-900/80 dark:text-orange-300",
    dot: "bg-orange-500",
    label: "Rooftop",
  },
};

const OPERATING_HOURS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

export function CalendarView() {
  const {
    facilities,
    reservations,
    openBookingModal,
    setSelectedReservationForReview,
  } = useApp();

  // Navigation State (Anchor: October 2026 for institutional academic term)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 0-indexed: 9 = October
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-05");
  const [viewMode, setViewMode] = useState<CalendarViewMode>("MONTH");

  // Filters & Search
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Helpers to format YYYY-MM-DD
  const formatYMD = (year: number, month: number, day: number) => {
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    return `${year}-${mStr}-${dStr}`;
  };

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (r.status === "REJECTED" || r.status === "CANCELLED") return false;

      if (selectedFacilityFilter !== "ALL" && r.facilityId !== selectedFacilityFilter) {
        return false;
      }

      if (selectedStatusFilter !== "ALL" && r.status !== selectedStatusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.eventName.toLowerCase().includes(q);
        const matchUser = r.userName.toLowerCase().includes(q);
        const matchCode = r.reservationCode.toLowerCase().includes(q);
        const matchDept = r.department.toLowerCase().includes(q);
        const matchVenue = r.facilityName.toLowerCase().includes(q);
        if (!matchName && !matchUser && !matchCode && !matchDept && !matchVenue) {
          return false;
        }
      }

      return true;
    });
  }, [reservations, selectedFacilityFilter, selectedStatusFilter, searchQuery]);

  // Occupancy Analytics Stats
  const occupancyStats = useMemo(() => {
    let totalMinutes = 0;
    const venueUsage: Record<string, number> = {};

    filteredReservations.forEach((r) => {
      const [startH, startM] = r.startTime.split(":").map(Number);
      const [endH, endM] = r.endTime.split(":").map(Number);
      const durationMin = (endH * 60 + endM) - (startH * 60 + startM);
      if (durationMin > 0) {
        totalMinutes += durationMin;
        venueUsage[r.facilityName] = (venueUsage[r.facilityName] || 0) + durationMin;
      }
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const confirmedCount = filteredReservations.filter((r) => r.status === "APPROVED").length;
    const pendingCount = filteredReservations.filter((r) => r.status === "PENDING").length;

    let peakVenue = "Function Hall";
    let peakMinutes = 0;
    Object.entries(venueUsage).forEach(([venue, mins]) => {
      if (mins > peakMinutes) {
        peakMinutes = mins;
        peakVenue = venue;
      }
    });

    return {
      totalHours,
      confirmedCount,
      pendingCount,
      peakVenue,
    };
  }, [filteredReservations]);

  // Calendar Math: Days in current month
  const monthData = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Previous month padding days
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
    const prevPadding = Array.from({ length: firstDayIndex }, (_, i) => {
      const dayNum = prevMonthTotalDays - firstDayIndex + 1 + i;
      return {
        dayNum,
        isCurrentMonth: false,
        dateStr: "",
        reservations: [] as Reservation[],
      };
    });

    // Current month days
    const currentDays = Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = formatYMD(currentYear, currentMonth, dayNum);
      const dayReservations = filteredReservations.filter((r) => r.date === dateStr);
      const dateObj = new Date(currentYear, currentMonth, dayNum);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });

      return {
        dayNum,
        dateStr,
        dayName,
        isCurrentMonth: true,
        reservations: dayReservations,
        hasApproved: dayReservations.some((r) => r.status === "APPROVED"),
        hasPending: dayReservations.some((r) => r.status === "PENDING"),
      };
    });

    // Next month padding to fill grid to multiple of 7
    const remainingSlots = (7 - ((prevPadding.length + currentDays.length) % 7)) % 7;
    const nextPadding = Array.from({ length: remainingSlots }, (_, i) => {
      return {
        dayNum: i + 1,
        isCurrentMonth: false,
        dateStr: "",
        reservations: [] as Reservation[],
      };
    });

    return {
      prevPadding,
      currentDays,
      nextPadding,
      allCells: [...prevPadding, ...currentDays, ...nextPadding],
    };
  }, [currentYear, currentMonth, filteredReservations]);

  // Selected Week Days for Weekly View (derived from selectedDate)
  const weekDays = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const curr = new Date(y, m - 1, d);
    const dayOfWeek = curr.getDay(); // 0 for Sunday
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - dayOfWeek);

    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(sunday);
      dayDate.setDate(sunday.getDate() + i);
      const dateStr = formatYMD(
        dayDate.getFullYear(),
        dayDate.getMonth(),
        dayDate.getDate()
      );
      const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = dayDate.getDate();
      const dayReservations = filteredReservations.filter((r) => r.date === dateStr);

      return {
        dateStr,
        dayName,
        dayNum,
        reservations: dayReservations,
      };
    });
  }, [selectedDate, filteredReservations]);

  // Month Name Formatter
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "MONTH") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((y) => y - 1);
      } else {
        setCurrentMonth((m) => m - 1);
      }
    } else if (viewMode === "WEEK") {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const curr = new Date(y, m - 1, d);
      curr.setDate(curr.getDate() - 7);
      setSelectedDate(formatYMD(curr.getFullYear(), curr.getMonth(), curr.getDate()));
      setCurrentMonth(curr.getMonth());
      setCurrentYear(curr.getFullYear());
    } else {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const curr = new Date(y, m - 1, d);
      curr.setDate(curr.getDate() - 1);
      setSelectedDate(formatYMD(curr.getFullYear(), curr.getMonth(), curr.getDate()));
      setCurrentMonth(curr.getMonth());
      setCurrentYear(curr.getFullYear());
    }
  };

  const handleNext = () => {
    if (viewMode === "MONTH") {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((y) => y + 1);
      } else {
        setCurrentMonth((m) => m + 1);
      }
    } else if (viewMode === "WEEK") {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const curr = new Date(y, m - 1, d);
      curr.setDate(curr.getDate() + 7);
      setSelectedDate(formatYMD(curr.getFullYear(), curr.getMonth(), curr.getDate()));
      setCurrentMonth(curr.getMonth());
      setCurrentYear(curr.getFullYear());
    } else {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const curr = new Date(y, m - 1, d);
      curr.setDate(curr.getDate() + 1);
      setSelectedDate(formatYMD(curr.getFullYear(), curr.getMonth(), curr.getDate()));
      setCurrentMonth(curr.getMonth());
      setCurrentYear(curr.getFullYear());
    }
  };

  const handleToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(9);
    setSelectedDate("2026-10-05");
  };

  // Selected date events
  const selectedDateEvents = filteredReservations.filter((r) => r.date === selectedDate);

  // Print schedule utility
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & COMPREHENSIVE CONTROLS TOOLBAR                             */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-emerald-100 text-[#0F5132] dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500/20 mb-1">
              <Sparkle size={12} weight="fill" />
              <span>Campus Facility Schedule Matrix</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
              Master Campus Calendar
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Live schedule orchestration, collision prevention, and instant room vacancy timeline
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer size={15} weight="bold" />}
              className="min-h-[42px] px-3.5"
            >
              Print / Export
            </Button>

            <Button
              size="sm"
              onClick={() => openBookingModal()}
              icon={<PlusCircle size={16} weight="bold" />}
              className="min-h-[42px] px-4 bg-[#0F5132] hover:bg-[#0A3622] text-white"
            >
              Book Venue
            </Button>
          </div>
        </div>

        {/* OCCUPANCY ANALYTICS METRIC STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-semibold text-[11px] uppercase tracking-wider">Booked Hours</span>
              <Clock size={16} className="text-[#0F5132] dark:text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {occupancyStats.totalHours} <span className="text-xs font-normal text-zinc-400">hrs</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Across active filtered events</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-semibold text-[11px] uppercase tracking-wider">Confirmed</span>
              <CheckCircle size={16} className="text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {occupancyStats.confirmedCount} <span className="text-xs font-normal text-zinc-400">events</span>
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Locked on central schedule</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-semibold text-[11px] uppercase tracking-wider">Pending Review</span>
              <ClockCountdown size={16} className="text-amber-600" />
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {occupancyStats.pendingCount} <span className="text-xs font-normal text-zinc-400">requests</span>
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">Awaiting administration</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-semibold text-[11px] uppercase tracking-wider">Peak Venue</span>
              <TrendUp size={16} className="text-blue-600" />
            </div>
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate" title={occupancyStats.peakVenue}>
              {occupancyStats.peakVenue}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Highest utilization this cycle</div>
          </div>
        </div>

        {/* TOOLBAR CONTROLS BAR: Navigation, View Toggle, Venue & Status Filter, Search */}
        <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left: Dynamic Navigation & Date Header */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-yellow-100/80 hover:text-yellow-950 dark:hover:bg-yellow-500/20 text-zinc-700 dark:text-zinc-300 transition-colors"
                title="Previous period"
                aria-label="Previous period"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-yellow-100/80 hover:text-yellow-950 dark:hover:bg-yellow-500/20 text-zinc-700 dark:text-zinc-300 transition-colors"
                title="Next period"
                aria-label="Next period"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleToday}
              className="text-xs h-9 px-3"
              aria-label="Jump to Today"
            >
              Today
            </Button>

            <div className="pl-2 border-l border-zinc-200 dark:border-zinc-700">
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {viewMode === "MONTH" && monthName}
                {viewMode === "WEEK" && `Week of ${weekDays[0].dateStr} - ${weekDays[6].dateStr}`}
                {viewMode === "DAY" && `Daily Schedule: ${selectedDate}`}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">Academic Term 1 · CHMSU Talisay</div>
            </div>
          </div>

          {/* Right: View Mode Toggle & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Search Input */}
            <div className="relative flex-1 sm:w-48 lg:w-44">
              <MagnifyingGlass
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="Search events..."
                aria-label="Search events by title, code, or organizer"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
              />
            </div>

            {/* Venue Filter */}
            <select
              value={selectedFacilityFilter}
              onChange={(e) => setSelectedFacilityFilter(e.target.value)}
              aria-label="Filter events by facility venue"
              className="h-9 px-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
            >
              <option value="ALL">All 6 Venues</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              aria-label="Filter events by approval status"
              className="h-9 px-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved Only</option>
              <option value="PENDING">Pending Only</option>
            </select>

            {/* View Mode Switcher */}
            <div
              role="tablist"
              aria-label="Calendar view format"
              className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs"
            >
              {(["MONTH", "WEEK", "DAY"] as CalendarViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={viewMode === mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                    viewMode === mode
                      ? "bg-white dark:bg-zinc-900 text-[#0F5132] dark:text-emerald-300 shadow-2xs font-bold"
                      : "text-zinc-500 hover:text-yellow-950 dark:hover:text-yellow-300 hover:bg-yellow-100/70 dark:hover:bg-yellow-500/10"
                  }`}
                >
                  {mode === "MONTH" ? "Monthly" : mode === "WEEK" ? "Weekly" : "Daily"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Facility Legend Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 px-1 text-xs">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
            Venues:
          </span>
          {facilities.map((f) => {
            const theme = VENUE_THEMES[f.id] || VENUE_THEMES["function-hall"];
            const isFiltered = selectedFacilityFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={isFiltered}
                aria-label={`Filter calendar by ${f.name}`}
                onClick={() =>
                  setSelectedFacilityFilter(selectedFacilityFilter === f.id ? "ALL" : f.id)
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  isFiltered
                    ? `${theme.badge} ring-2 ring-emerald-600/30 font-bold scale-105`
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                <span>{f.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE RESPONSIVE CALENDAR VIEW (Screen < 768px)                       */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-4">
        {/* Scrollable Day Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {monthName} Timeline
            </span>
            <span className="text-zinc-400 text-[11px]">Scroll horizontally →</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4">
            {monthData.currentDays.map((d) => {
              const isSelected = selectedDate === d.dateStr;
              const hasEvents = d.reservations.length > 0;

              return (
                <button
                  key={d.dayNum}
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`min-w-[62px] min-h-[64px] p-2 rounded-2xl flex flex-col items-center justify-between transition-all shrink-0 border ${
                    isSelected
                      ? "bg-[#0F5132] text-white border-[#0F5132] shadow-md ring-2 ring-emerald-600/30"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${
                      isSelected ? "text-emerald-200" : "text-zinc-400"
                    }`}
                  >
                    {d.dayName}
                  </span>
                  <span className="text-base font-extrabold leading-none my-0.5">
                    {d.dayNum}
                  </span>
                  <div className="flex items-center gap-0.5 h-1.5">
                    {hasEvents && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-white" : "bg-emerald-600 dark:bg-emerald-400"
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Card Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/80 px-4 py-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700 text-xs">
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-[#0F5132] dark:text-emerald-400" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedDate}</span>
            </div>
            <span className="text-zinc-500 font-medium">
              {selectedDateEvents.length} scheduled event(s)
            </span>
          </div>

          {selectedDateEvents.length === 0 ? (
            <div className="p-6 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#0F5132] dark:text-emerald-300 mx-auto flex items-center justify-center">
                <CheckCircle size={22} weight="fill" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  All Venues Available
                </h4>
                <p className="text-xs text-zinc-500 mt-1">
                  No reservations are currently scheduled on {selectedDate}.
                </p>
              </div>
              <Button
                size="sm"
                fullWidth
                onClick={() => openBookingModal(undefined, selectedDate, "09:00")}
                icon={<PlusCircle size={16} weight="bold" />}
                className="min-h-[44px]"
              >
                Reserve on this Date
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((res) => {
                const theme = VENUE_THEMES[res.facilityId] || VENUE_THEMES["function-hall"];
                return (
                  <div
                    key={res.id}
                    onClick={() => setSelectedReservationForReview(res)}
                    className={`p-4 rounded-2xl border ${theme.border} ${theme.bg} shadow-2xs space-y-3 cursor-pointer`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {res.eventName}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                          {res.reservationCode}
                        </div>
                      </div>
                      <StatusBadge status={res.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Buildings size={14} className="shrink-0" />
                        <span className="truncate font-semibold">{res.facilityName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Clock size={14} className="shrink-0" />
                        <span>
                          {res.startTime} - {res.endTime}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.08] text-xs">
                      <span className="text-[11px] text-zinc-500">
                        {res.userName} ({res.department})
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReservationForReview(res);
                        }}
                        className="min-h-[38px] text-xs px-3"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DESKTOP/TABLET: THREE DISTINCT VIEW MODES                              */}
      {/* ========================================================================= */}
      <div className="hidden md:block">
        {/* MODE A: MONTHLY CALENDAR MATRIX */}
        {viewMode === "MONTH" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={18} className="text-[#0F5132] dark:text-emerald-400" />
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {monthName}
                    </span>
                    <span className="text-xs text-zinc-400">Monthly Density Matrix</span>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">
                    {filteredReservations.length} Active Events
                  </span>
                </CardHeader>

                <CardBody className="p-4">
                  {/* Day Names Header */}
                  <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[11px] text-zinc-400 uppercase tracking-wider mb-2">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  {/* 7-Column Days Grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {monthData.allCells.map((cell, idx) => {
                      if (!cell.isCurrentMonth) {
                        return (
                          <div
                            key={`pad-${idx}`}
                            className="p-2 min-h-[68px] lg:min-h-[82px] rounded-xl bg-zinc-50/40 dark:bg-zinc-900/40 text-zinc-300 dark:text-zinc-700 text-xs text-right opacity-30 select-none"
                          >
                            {cell.dayNum}
                          </div>
                        );
                      }

                      const isSelected = selectedDate === cell.dateStr;
                      const count = cell.reservations.length;

                      return (
                        <div
                          key={cell.dateStr}
                          role="button"
                          tabIndex={0}
                          aria-label={`Date ${cell.dateStr}, ${count} events scheduled`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedDate(cell.dateStr)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedDate(cell.dateStr);
                            }
                          }}
                          className={`p-1.5 lg:p-2 min-h-[68px] lg:min-h-[82px] rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] ${
                            isSelected
                              ? "border-[#0F5132] bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-[#0F5132]/40 shadow-sm"
                              : count > 0
                              ? "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 hover:shadow-2xs"
                              : "border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-100/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-semibold text-xs ${
                                isSelected
                                  ? "text-[#0F5132] font-bold dark:text-emerald-400"
                                  : "text-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              {cell.dayNum}
                            </span>
                            {count > 0 && (
                              <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#0F5132] dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center">
                                {count}
                              </span>
                            )}
                          </div>

                          {/* Event Snippets */}
                          <div className="space-y-1 my-1">
                            {cell.reservations.slice(0, 2).map((r) => {
                              const theme = VENUE_THEMES[r.facilityId] || VENUE_THEMES["function-hall"];
                              return (
                                <div
                                  key={r.id}
                                  className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium border ${theme.border} ${theme.bg} ${theme.text}`}
                                  title={`${r.facilityName}: ${r.eventName} (${r.startTime}-${r.endTime})`}
                                >
                                  <span className="font-bold">{r.facilityName.split(" ")[0]}: </span>
                                  {r.eventName}
                                </div>
                              );
                            })}
                            {count > 2 && (
                              <div className="text-[9px] text-zinc-400 font-mono text-center">
                                +{count - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Selected Date Detail Column on the Right */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="bg-zinc-50/60 dark:bg-zinc-800/40">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Schedule for {selectedDate}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {selectedDateEvents.length} event(s) booked on this date
                    </p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono">
                    {selectedDate}
                  </span>
                </CardHeader>
                <CardBody className="p-4 space-y-3 max-h-[520px] overflow-y-auto no-scrollbar">
                  {selectedDateEvents.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500 space-y-2">
                      <p>All facilities are completely open and available on this date.</p>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => openBookingModal(undefined, selectedDate, "09:00")}
                        className="mt-2 min-h-[40px] bg-[#0F5132] text-white"
                      >
                        Reserve on {selectedDate}
                      </Button>
                    </div>
                  ) : (
                    selectedDateEvents.map((res) => {
                      const theme = VENUE_THEMES[res.facilityId] || VENUE_THEMES["function-hall"];
                      return (
                        <div
                          key={res.id}
                          onClick={() => setSelectedReservationForReview(res)}
                          className={`p-3.5 rounded-xl border ${theme.border} ${theme.bg} hover:shadow-xs transition-all cursor-pointer space-y-2 text-xs`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {res.eventName}
                            </span>
                            <StatusBadge status={res.status} />
                          </div>

                          <div className="text-zinc-600 dark:text-zinc-400 space-y-1 text-[11px]">
                            <div className="flex items-center gap-1.5 font-medium">
                              <MapPin size={13} className="shrink-0" />
                              <span>{res.facilityName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono">
                              <Clock size={13} className="shrink-0" />
                              <span>
                                {res.startTime} - {res.endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-500">
                              <Users size={13} className="shrink-0" />
                              <span className="truncate">
                                {res.userName} ({res.department})
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-400">
                            <span className="font-mono">{res.reservationCode}</span>
                            <span className="text-[#0F5132] dark:text-emerald-400 font-semibold hover:underline">
                              Review Details →
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardBody>
              </Card>

              {/* Conflict Guard Badge */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#0F5132] dark:text-emerald-300">
                  <ShieldCheck size={16} weight="fill" />
                  <span>Automated Collision Prevention</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  UniSpace mathematically audits scheduled intervals in real time. Overlapping requests
                  for the same facility are stopped automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MODE B: WEEKLY HOURLY TIMETABLE */}
        {viewMode === "WEEK" && (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-[#0F5132] dark:text-emerald-400" />
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Weekly Timetable: {weekDays[0].dateStr} to {weekDays[6].dateStr}
                </span>
              </div>
              <span className="text-xs text-zinc-400">
                Click any free slot to instantly reserve venue
              </span>
            </CardHeader>

            <CardBody className="p-0 overflow-x-auto">
              <div className="min-w-[850px]">
                {/* 7-Day Header */}
                <div className="grid grid-cols-8 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-xs font-semibold">
                  <div className="p-3 text-center text-zinc-400 uppercase text-[10px] tracking-wider border-r border-zinc-200 dark:border-zinc-800">
                    Time
                  </div>
                  {weekDays.map((d) => {
                    const isSelected = selectedDate === d.dateStr;
                    return (
                      <div
                        key={d.dateStr}
                        onClick={() => setSelectedDate(d.dateStr)}
                        className={`p-2.5 text-center cursor-pointer border-r border-zinc-200 dark:border-zinc-800 transition-colors ${
                          isSelected
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-[#0F5132] dark:text-emerald-300"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <div className="text-[10px] uppercase text-zinc-400 font-bold">{d.dayName}</div>
                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{d.dayNum}</div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {d.reservations.length} event(s)
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Operating Hours Rows (07:00 to 21:00) */}
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {OPERATING_HOURS.map((hour) => {
                    const hourInt = parseInt(hour.split(":")[0]);

                    return (
                      <div key={hour} className="grid grid-cols-8 min-h-[58px]">
                        {/* Hour Label */}
                        <div className="p-2 text-center text-[11px] font-mono text-zinc-400 border-r border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/30">
                          {hour}
                        </div>

                        {/* 7 Day Slot Cells */}
                        {weekDays.map((d) => {
                          // Find matching reservation spanning this hour
                          const eventInHour = d.reservations.find((r) => {
                            const startH = parseInt(r.startTime.split(":")[0]);
                            const endH = parseInt(r.endTime.split(":")[0]);
                            return hourInt >= startH && hourInt < endH;
                          });

                          if (eventInHour) {
                            const theme =
                              VENUE_THEMES[eventInHour.facilityId] || VENUE_THEMES["function-hall"];
                            const isFirstHour =
                              parseInt(eventInHour.startTime.split(":")[0]) === hourInt;

                            return (
                              <div
                                key={`${d.dateStr}-${hour}`}
                                onClick={() => setSelectedReservationForReview(eventInHour)}
                                className={`p-1.5 border-r border-zinc-200 dark:border-zinc-800/80 cursor-pointer ${theme.bg} transition-all`}
                                title={`${eventInHour.eventName} (${eventInHour.facilityName})`}
                              >
                                {isFirstHour ? (
                                  <div className="space-y-0.5">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-[11px] text-zinc-900 dark:text-zinc-100 truncate">
                                        {eventInHour.eventName}
                                      </span>
                                      <StatusBadge status={eventInHour.status} />
                                    </div>
                                    <div className="text-[10px] text-zinc-500 truncate">
                                      {eventInHour.facilityName} · {eventInHour.startTime}-{eventInHour.endTime}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center opacity-40 text-[10px] text-zinc-400">
                                    ↓ continuing
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // Empty slot: Click to book
                          const targetFacility =
                            selectedFacilityFilter !== "ALL"
                              ? (selectedFacilityFilter as FacilityId)
                              : "function-hall";

                          return (
                            <div
                              key={`${d.dateStr}-${hour}`}
                              role="button"
                              tabIndex={0}
                              aria-label={`Book slot at ${hour} on ${d.dateStr}`}
                              onClick={() => {
                                openBookingModal(targetFacility, d.dateStr, hour);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openBookingModal(targetFacility, d.dateStr, hour);
                                }
                              }}
                              className="group/slot p-1.5 border-r border-zinc-100 dark:border-zinc-800/60 hover:bg-yellow-100/70 dark:hover:bg-yellow-500/15 cursor-pointer transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
                            >
                              <span className="hidden group-hover/slot:inline-flex items-center gap-1 text-[10px] font-bold text-yellow-950 dark:text-yellow-200">
                                <Plus size={11} weight="bold" />
                                <span>Book {hour}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* MODE C: DAILY MULTI-VENUE TIMELINE MATRIX */}
        {viewMode === "DAY" && (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={18} className="text-[#0F5132] dark:text-emerald-400" />
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Daily Venue Matrix: {selectedDate}
                </span>
                <span className="text-xs text-zinc-400">
                  Comparing all campus venues side-by-side
                </span>
              </div>
              <div className="text-xs text-zinc-400">
                Click any open green interval to book venue directly
              </div>
            </CardHeader>

            <CardBody className="p-0 overflow-x-auto">
              <div className="min-w-[980px]">
                {/* 6 Venues Column Headers */}
                <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-xs font-semibold">
                  <div className="p-3 text-center text-zinc-400 uppercase text-[10px] tracking-wider border-r border-zinc-200 dark:border-zinc-800">
                    Time
                  </div>
                  {facilities.map((fac) => {
                    const theme = VENUE_THEMES[fac.id] || VENUE_THEMES["function-hall"];
                    const countOnDate = selectedDateEvents.filter(
                      (r) => r.facilityId === fac.id
                    ).length;

                    return (
                      <div
                        key={fac.id}
                        className="p-3 text-center border-r border-zinc-200 dark:border-zinc-800 space-y-0.5"
                      >
                        <div className="flex items-center justify-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                          <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                          <span className="truncate">{fac.name}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          Cap: {fac.capacity} pax · {countOnDate} booked
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Operating Hours Rows */}
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {OPERATING_HOURS.map((hour) => {
                    const hourInt = parseInt(hour.split(":")[0]);

                    return (
                      <div key={hour} className="grid grid-cols-7 min-h-[64px]">
                        {/* Time Row Label */}
                        <div className="p-2 text-center text-[11px] font-mono text-zinc-400 border-r border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/30">
                          {hour}
                        </div>

                        {/* 6 Facility Cells */}
                        {facilities.map((fac) => {
                          const theme = VENUE_THEMES[fac.id] || VENUE_THEMES["function-hall"];

                          // Find event in this facility covering this hour
                          const eventInSlot = selectedDateEvents.find((r) => {
                            if (r.facilityId !== fac.id) return false;
                            const startH = parseInt(r.startTime.split(":")[0]);
                            const endH = parseInt(r.endTime.split(":")[0]);
                            return hourInt >= startH && hourInt < endH;
                          });

                          if (eventInSlot) {
                            const isFirstHour =
                              parseInt(eventInSlot.startTime.split(":")[0]) === hourInt;

                            return (
                              <div
                                key={`${fac.id}-${hour}`}
                                onClick={() => setSelectedReservationForReview(eventInSlot)}
                                className={`p-2 border-r border-zinc-200 dark:border-zinc-800/80 cursor-pointer ${theme.bg} transition-all`}
                              >
                                {isFirstHour ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                                        {eventInSlot.eventName}
                                      </span>
                                      <StatusBadge status={eventInSlot.status} />
                                    </div>
                                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                                      {eventInSlot.startTime} - {eventInSlot.endTime}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 truncate">
                                      {eventInSlot.userName} ({eventInSlot.department})
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-[10px] text-zinc-400 opacity-50">
                                    Occupied (cont.)
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // Empty slot: 1-click booking
                          return (
                            <div
                              key={`${fac.id}-${hour}`}
                              role="button"
                              tabIndex={0}
                              aria-label={`Reserve ${fac.name} at ${hour} on ${selectedDate}`}
                              onClick={() => openBookingModal(fac.id, selectedDate, hour)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openBookingModal(fac.id, selectedDate, hour);
                                }
                              }}
                              className="group/slot p-2 border-r border-zinc-100 dark:border-zinc-800/60 hover:bg-yellow-100/70 dark:hover:bg-yellow-500/15 cursor-pointer transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132]"
                            >
                              <div className="hidden group-hover/slot:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 text-[11px] font-bold text-yellow-950 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-600 shadow-xs">
                                <Plus size={12} weight="bold" />
                                <span>Reserve {hour}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
