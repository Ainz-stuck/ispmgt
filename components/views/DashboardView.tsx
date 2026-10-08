"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useApp } from "../../context/AppContext";
import { Facility, Reservation } from "../../types";
import { FacilityCard } from "../facilities/FacilityCard";
import { StatusBadge, RoleBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardBody } from "../ui/Card";
import {
  Buildings,
  Calendar,
  Clock,
  CheckCircle,
  ClockCountdown,
  ArrowRight,
  MagnifyingGlass,
  PlusCircle,
  Users,
  MapPin,
  WarningCircle,
  Student,
  ChalkboardTeacher,
  ShieldCheck,
  TrendUp,
  UserGear,
  Package,
} from "@phosphor-icons/react";

export function DashboardView() {
  const {
    currentUser,
    facilities,
    reservations,
    setSelectedFacilityId,
    openBookingModal,
    setActiveTab,
    setSelectedReservationForReview,
    approveReservation,
  } = useApp();

  const [searchFilter, setSearchFilter] = useState("");

  const role = currentUser.role;
  const isStudent = role === "STUDENT";
  const isFaculty = role === "FACULTY";
  const isAdmin = role === "ADMINISTRATOR";

  // Metrics
  const availableCount = facilities.filter((f) => f.status === "AVAILABLE").length;
  const userReservations = isAdmin
    ? reservations
    : reservations.filter((r) => r.userId === currentUser.id);

  const pendingCount = reservations.filter((r) => r.status === "PENDING").length;
  const userPendingCount = userReservations.filter((r) => r.status === "PENDING").length;
  const upcomingCount = userReservations.filter((r) => r.status === "APPROVED").length;

  const filteredFacilities = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.location.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-8 sm:space-y-10 pb-16">
      {/* ATTENTION / HERO BANNER (Double-Bezel Hardware Architecture) */}
      <div className="p-1 sm:p-1.5 rounded-[2rem] sm:rounded-[2.5rem] bg-zinc-200/50 dark:bg-zinc-800/40 ring-1 ring-black/[0.05] dark:ring-white/[0.08] shadow-xl sm:shadow-2xl">
        <section className="relative rounded-[calc(2rem-0.25rem)] sm:rounded-[calc(2.5rem-0.375rem)] overflow-hidden bg-zinc-950 text-white min-h-[380px] sm:min-h-[420px] flex flex-col justify-between p-4 sm:p-8 lg:p-12 border border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
          <Image
            src="/images/campus_hero.jpg"
            alt="University Campus Architecture"
            fill
            priority
            className="object-cover opacity-25 mix-blend-luminosity hover:scale-105 transition-transform duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent pointer-events-none" />

          {/* Top Tag & Role Identification */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-1 text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-semibold bg-white/10 backdrop-blur-xl border border-white/20 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="truncate max-w-[200px] sm:max-w-none">
                {isStudent
                  ? "Student Facility & Event Portal"
                  : isFaculty
                  ? "Faculty Priority Scheduling Suite"
                  : "Central Operations Command Console"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-300 ml-auto sm:ml-0">
              <span className="hidden sm:inline">Logged in as {currentUser.name}</span>
              <RoleBadge role={currentUser.role} />
            </div>
          </div>

          {/* Wide Editorial H1 & Value Proposition */}
          <div className="relative z-10 my-auto py-4 sm:py-6 max-w-4xl space-y-3 sm:space-y-4">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight font-sans">
              {isStudent && "UniSpace: University Facility Booking & Resource Scheduling"}
              {isFaculty && "Faculty Academic Venues & Research Resource Booking"}
              {isAdmin && "Central University Facility Operations & Governance"}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-zinc-300 max-w-2xl leading-relaxed font-normal">
              {isStudent &&
                "Book auditoriums, dance studios, and athletics spaces for collegiate organizations with instant schedule collision checking."}
              {isFaculty &&
                "Expedited reservations for graduate thesis defenses, symposiums, and departmental research showcases with priority review."}
              {isAdmin &&
                "Monitor campus venue occupancy, adjudicate pending reservation requests, audit equipment stock, and manage user access."}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <Button
                size="md"
                pill
                onClick={() => openBookingModal()}
                trailingIcon={<PlusCircle size={17} weight="bold" />}
                className="bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-xl px-5 sm:px-6 min-h-[44px] w-full sm:w-auto"
              >
                {isAdmin ? "Create Institutional Booking" : "Start New Reservation"}
              </Button>
              <Button
                variant="secondary"
                size="md"
                pill
                onClick={() => setActiveTab("calendar")}
                trailingIcon={<Calendar size={17} weight="bold" />}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-xl px-5 sm:px-6 min-h-[44px] w-full sm:w-auto"
              >
                Master Calendar
              </Button>
              {isAdmin && (
                <Button
                  variant="secondary"
                  size="md"
                  pill
                  onClick={() => setActiveTab("users")}
                  trailingIcon={<UserGear size={17} weight="bold" />}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-xl px-5 sm:px-6 min-h-[44px] w-full sm:w-auto"
                >
                  Manage Users
                </Button>
              )}
            </div>
          </div>

          {/* Facility Search Bar */}
          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 sm:pt-5 border-t border-white/10">
            <div className="relative w-full sm:max-w-md">
              <MagnifyingGlass
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="Search by venue name, location, or building..."
                aria-label="Search facilities by venue name, location, or building"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full h-11 sm:h-10 pl-10 pr-4 text-xs rounded-full bg-black/40 border border-white/20 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 backdrop-blur-md"
              />
            </div>
            <div className="text-xs text-zinc-400 sm:ml-auto flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
              <span>6 Certified Venues</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">
                {availableCount} Available Now
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ROLE-CUSTOMIZED KPI METRICS (Double-Bezel Hardware Grid) */}
      {/* Desktop: 4 in a row | Tablet: 2 per row | Mobile: 1 per row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-1.5 rounded-[2rem] bg-zinc-200/60 dark:bg-zinc-800/50 ring-1 ring-black/[0.05] dark:ring-white/[0.08] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
          <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white dark:bg-zinc-900 p-5 sm:p-6 border border-black/[0.03] dark:border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Available Venues
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#0F5132] dark:text-emerald-300 flex items-center justify-center ring-1 ring-emerald-500/20">
                <CheckCircle size={18} weight="fill" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {availableCount} <span className="text-sm font-normal text-zinc-400">/ 6</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                {availableCount === 6 ? "All spaces open for booking" : "Active spaces open"}
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-1.5 rounded-[2rem] bg-zinc-200/60 dark:bg-zinc-800/50 ring-1 ring-black/[0.05] dark:ring-white/[0.08] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
          <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white dark:bg-zinc-900 p-5 sm:p-6 border border-black/[0.03] dark:border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {isAdmin ? "Total System Requests" : isFaculty ? "Academic Bookings" : "My Bookings"}
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center ring-1 ring-blue-500/20">
                <Buildings size={18} weight="fill" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {userReservations.length}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                {isAdmin ? "Across all university units" : "Logged under your profile"}
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-1.5 rounded-[2rem] bg-zinc-200/60 dark:bg-zinc-800/50 ring-1 ring-black/[0.05] dark:ring-white/[0.08] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
          <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white dark:bg-zinc-900 p-5 sm:p-6 border border-black/[0.03] dark:border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {isAdmin ? "Pending Approvals" : "Pending Verification"}
              </span>
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center ring-1 ring-amber-500/20">
                <ClockCountdown size={18} weight="fill" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {isAdmin ? pendingCount : userPendingCount}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                {isAdmin
                  ? "Awaiting administrative sign-off"
                  : isFaculty
                  ? "In expedited 24-hr review"
                  : "Under conflict verification"}
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-1.5 rounded-[2rem] bg-zinc-200/60 dark:bg-zinc-800/50 ring-1 ring-black/[0.05] dark:ring-white/[0.08] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
          <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white dark:bg-zinc-900 p-5 sm:p-6 border border-black/[0.03] dark:border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Confirmed Upcoming
              </span>
              <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center ring-1 ring-purple-500/20">
                <Calendar size={18} weight="fill" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {upcomingCount}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                Locked on central schedule
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FACILITY CATALOG BENTO GRID */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              University Facility Catalog
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Available facilities for reservation: Function Hall, Dining Hall, Gym, Dance Hall, AVR, and Rooftop
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("facilities")}
            className="text-[#0F5132] font-semibold"
          >
            Full Catalog →
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 grid-flow-dense">
          {filteredFacilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              onViewDetails={() => setSelectedFacilityId(facility.id)}
              onReserve={() => openBookingModal(facility.id)}
            />
          ))}
        </div>
      </section>

      {/* RECENT BOOKINGS & CAMPUS RESOURCE STATUS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        <div className="lg:col-span-2 2xl:col-span-3">
          <Card>
            <CardHeader>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {isAdmin
                    ? "Pending Administrator Review Queue"
                    : isFaculty
                    ? "My Academic Schedules & Defenses"
                    : "My Submitted Booking Requests"}
                </h3>
                <p className="text-xs text-zinc-500">
                  {isAdmin
                    ? "Requests requiring schedule validation and custodial assignment"
                    : "Review itinerary, resources, and administrative sign-offs"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("reservations")}
                className="text-xs"
              >
                View Master Table →
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              {/* Mobile Card List View (block md:hidden) */}
              <div className="block md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                {userReservations.slice(0, 5).map((res) => (
                  <div key={res.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {res.eventName}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-400 mt-0.5">
                          {res.reservationCode} · {res.userName}
                        </div>
                      </div>
                      <StatusBadge status={res.status} />
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <Buildings size={14} className="text-[#0F5132] shrink-0" />
                        <span className="truncate">{res.facilityName}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[11px] shrink-0">
                        <Calendar size={13} className="text-zinc-400" />
                        <span>{res.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {res.startTime} - {res.endTime}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedReservationForReview(res)}
                        className="text-xs min-h-[38px] px-3.5"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop & Tablet Table (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-semibold border-b border-zinc-200/80 dark:border-zinc-800">
                    <tr>
                      <th className="px-5 py-3">Event / Code</th>
                      <th className="px-4 py-3">Facility</th>
                      <th className="px-4 py-3">Schedule</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {userReservations.slice(0, 5).map((res) => (
                      <tr
                        key={res.id}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {res.eventName}
                          </div>
                          <div className="font-mono text-[10px] text-zinc-400 mt-0.5">
                            {res.reservationCode} · {res.userName}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                          {res.facilityName}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          <div>{res.date}</div>
                          <div className="text-[10px] text-zinc-400">
                            {res.startTime} - {res.endTime}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={res.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedReservationForReview(res)}
                            className="text-xs h-7 px-2"
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right 1 Col: Role-Specific Summary Card */}
        <div className="space-y-6">
          {isAdmin ? (
            <Card>
              <CardHeader>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Admin Quick Actions
                  </h3>
                  <p className="text-xs text-zinc-500">Direct management controls</p>
                </div>
              </CardHeader>
              <CardBody className="space-y-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setActiveTab("users")}
                  icon={<UserGear size={16} />}
                  className="justify-start"
                >
                  Manage User Directory & Accounts
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setActiveTab("resources")}
                  icon={<Package size={16} />}
                  className="justify-start"
                >
                  Adjust Equipment Inventory
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => setActiveTab("reports")}
                  icon={<TrendUp size={16} />}
                  className="justify-start"
                >
                  View Facility Utilization Reports
                </Button>
              </CardBody>
            </Card>
          ) : isFaculty ? (
            <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-300">
                <ChalkboardTeacher size={16} weight="fill" />
                <span>Faculty Academic Priority</span>
              </div>
              <p className="text-purple-900 dark:text-purple-200 text-[11px] leading-relaxed">
                Faculty requests receive automated priority status in the queue and 24-hour turnaround
                for departmental oral defenses and collegiate symposiums.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#0F5132] dark:text-emerald-300">
                <Student size={16} weight="fill" />
                <span>Student Booking Guidelines</span>
              </div>
              <p className="text-emerald-900 dark:text-emerald-200 text-[11px] leading-relaxed">
                All student organization reservations require a 3-day lead time. Ensure your faculty advisor
                has authorized the event schedule.
              </p>
            </div>
          )}

          {/* Equipment Status */}
          <Card>
            <CardHeader>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Campus Equipment Status
                </h3>
                <p className="text-xs text-zinc-500">Live inventory availability</p>
              </div>
            </CardHeader>
            <CardBody className="space-y-3.5">
              {[
                { name: "Laser Projectors", avail: 9, total: 12, pct: 75 },
                { name: "Pro Sound Systems", avail: 5, total: 8, pct: 62 },
                { name: "Wireless Microphones", avail: 18, total: 24, pct: 75 },
                { name: "Auditorium Chairs", avail: 620, total: 800, pct: 77 },
                { name: "Collegiate Tables", avail: 110, total: 150, pct: 73 },
              ].map((res) => (
                <div key={res.name} className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
                    <span className="font-medium">{res.name}</span>
                    <span className="text-zinc-500">
                      <strong>{res.avail}</strong> / {res.total}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0F5132]"
                      style={{ width: `${res.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}
