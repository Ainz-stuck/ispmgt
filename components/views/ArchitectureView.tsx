"use client";

import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { StatusBadge, RoleBadge } from "../ui/Badge";
import {
  FileText,
  ShieldCheck,
  Database,
  TreeStructure,
  UserCheck,
  CheckCircle,
  ArrowsClockwise,
  ListNumbers,
  DeviceMobile,
  ChartBar,
  Buildings,
  LockKey,
  UsersThree,
  GitFork,
  Intersect,
  Palette,
  ArrowRight,
  Code,
  MapPin,
  Users,
} from "@phosphor-icons/react";

export function ArchitectureView() {
  const { currentUser, setActiveTab } = useApp();
  const [activeSection, setActiveSection] = useState<string>("SCOPE");

  if (currentUser.role !== "ADMINISTRATOR") {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 my-8">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center ring-1 ring-rose-500/20">
          <ShieldCheck size={28} weight="bold" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Restricted Access: Facility Administrator Only
          </h2>
          <p className="text-xs text-zinc-500 max-w-md mt-1">
            System Architecture and technical specifications are restricted to Central Facility Operations Administrators.
          </p>
        </div>
        <button
          onClick={() => setActiveTab("dashboard")}
          className="px-5 py-2.5 rounded-full bg-[#0F5132] hover:bg-[#0A3622] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const navTabs = [
    { id: "SCOPE", label: "Facility Scope & Database", icon: <Buildings size={15} weight="bold" /> },
    { id: "AUTH", label: "Auth & Access Flow", icon: <LockKey size={15} weight="bold" /> },
    { id: "ROLES", label: "Roles & Permissions", icon: <UsersThree size={15} weight="bold" /> },
    { id: "WORKFLOWS", label: "Workflows & Pipelines", icon: <GitFork size={15} weight="bold" /> },
    { id: "CONFLICT", label: "Double-Booking Engine", icon: <Intersect size={15} weight="bold" /> },
    { id: "DESIGN", label: "Design System Specs", icon: <Palette size={15} weight="bold" /> },
  ];

  return (
    <div className="w-full space-y-8 pb-20">
      {/* Title & Section Header aligned with full container */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-semibold bg-emerald-50 text-[#0F5132] dark:bg-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500/20 mb-2">
            <FileText size={13} weight="bold" />
            <span>Implementation Blueprint · Phases 1-13</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            UniSpace System Architecture & Specification
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-3xl leading-relaxed">
            Technical blueprint detailing user access lifecycles, role permissions, relational schema mappings,
            multi-step reservation pipelines, and double-booking conflict mitigation algorithms.
          </p>
        </div>

        {/* System Version Tag */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700 text-xs font-mono text-zinc-600 dark:text-zinc-300 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Spec v2.6 · Production Ready</span>
        </div>
      </div>

      {/* Pill Segmented Nav Bar (Optically Aligned & Wrapped in Concentric Bezel) */}
      <div className="p-1 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 ring-1 ring-black/[0.04] dark:ring-white/[0.06] flex items-center gap-1 overflow-x-auto no-scrollbar">
        {navTabs.map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isActive
                  ? "bg-white dark:bg-zinc-900 text-[#0F5132] dark:text-emerald-400 shadow-sm border border-black/[0.05] dark:border-white/[0.08]"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/40 dark:hover:bg-zinc-800/40"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: FACILITY SCOPE & DATABASE MAPPING                              */}
      {/* ========================================================================= */}
      {activeSection === "SCOPE" && (
        <div className="space-y-8">
          {/* 6 Facilities Grid - Perfectly Aligned 3-Column Bento */}
          <Card>
            <CardHeader>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  1. University Facility Scope (Strictly 6 Certified Campus Venues)
                </h3>
                <p className="text-xs text-zinc-500">
                  Official physical spaces governed by the centralized booking and scheduling engine
                </p>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    code: "HALL-01",
                    name: "Function Hall",
                    cap: "350 pax",
                    floor: "2nd Floor",
                    loc: "Main Administration Complex",
                    desc: "Keynote auditorium, academic convocations, symposiums with dedicated sound booth and tiered stage.",
                    hours: "07:00 - 22:00",
                  },
                  {
                    code: "DINE-01",
                    name: "Dining Hall",
                    cap: "200 pax",
                    floor: "Ground Level",
                    loc: "Student Center Complex",
                    desc: "Catering banquet hall, collegiate mixers, departmental luncheons with food service prep area.",
                    hours: "06:00 - 21:00",
                  },
                  {
                    code: "GYM-01",
                    name: "University Gym",
                    cap: "500 pax",
                    floor: "Ground Floor",
                    loc: "Sports & Athletic Center",
                    desc: "Regulation hardwood basketball arena, intramural tournaments, varsity training, and pep rallies.",
                    hours: "06:00 - 22:00",
                  },
                  {
                    code: "DANC-01",
                    name: "Dance Hall",
                    cap: "80 pax",
                    floor: "2nd Floor, Wing B",
                    loc: "Arts & Humanities Pavilion",
                    desc: "Sprung hardwood dance floor, full-length wall mirrors, ballet barres, and acoustic baffling.",
                    hours: "08:00 - 21:00",
                  },
                  {
                    code: "AVR-01",
                    name: "Audio Visual Room (AVR)",
                    cap: "120 pax",
                    floor: "3rd Floor",
                    loc: "University Library Building",
                    desc: "Tiered multimedia lecture theater, dual laser projectors, pro audio, and thesis defense podium.",
                    hours: "07:30 - 20:00",
                  },
                  {
                    code: "ROOF-01",
                    name: "Rooftop Engineering",
                    cap: "150 pax",
                    floor: "7th Floor Terrace",
                    loc: "College of Engineering",
                    desc: "Open-air panoramic terrace with solar research demonstration kiosks, pergolas, and power feeds.",
                    hours: "07:00 - 19:30",
                  },
                ].map((venue) => (
                  <div
                    key={venue.code}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col justify-between h-full space-y-3"
                  >
                    <div>
                      {/* Top Code & Capacity Header */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-[11px] font-bold text-[#0F5132] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          {venue.code}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          <Users size={13} className="text-zinc-400" />
                          <span>{venue.cap}</span>
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {venue.name}
                      </h4>

                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-1">
                        <MapPin size={13} className="text-[#0F5132] shrink-0" />
                        <span className="truncate">{venue.loc} · {venue.floor}</span>
                      </div>

                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 leading-relaxed line-clamp-3">
                        {venue.desc}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Hours: {venue.hours}</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Certified</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Database Schema Table with Explicit Column Alignment */}
          <Card>
            <CardHeader>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  2. Relational Database Schema to UI Mapping
                </h3>
                <p className="text-xs text-zinc-500">
                  How system models, keys, and relational fields translate directly into UI components
                </p>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs table-fixed">
                  <colgroup>
                    <col className="w-1/4 sm:w-1/5" />
                    <col className="w-1/2 sm:w-2/5" />
                    <col className="w-1/4 sm:w-2/5" />
                  </colgroup>
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-semibold border-b border-zinc-200/80 dark:border-zinc-700">
                    <tr>
                      <th className="px-6 py-3.5">Database Entity</th>
                      <th className="px-6 py-3.5">Schema Attributes</th>
                      <th className="px-6 py-3.5">Mapped UI Component</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {[
                      {
                        entity: "USERS",
                        attrs: "id, email, password_hash, role, department, studentOrEmployeeId, contactNumber, status",
                        ui: "LoginPage, RegisterPage, RoleBadge, UserManagementView, ProfileView",
                      },
                      {
                        entity: "FACILITIES",
                        attrs: "id, name, code, capacity, location, floor, status, specs, guidelines, operatingHours, custodian",
                        ui: "FacilityCard, FacilityDetailModal, FacilitiesView, Step 1 Facility Selector",
                      },
                      {
                        entity: "RESOURCES",
                        attrs: "id, name, category, totalQuantity, availableQuantity, condition, description",
                        ui: "ResourcesView, Step 3 Equipment Selector, Inventory Allocation Strip",
                      },
                      {
                        entity: "RESERVATIONS",
                        attrs: "id, reservationCode, facilityId, userId, date, startTime, endTime, status, purpose, attendees",
                        ui: "ReservationModal, ReservationsView, Dashboard Review Queue, Tracker",
                      },
                      {
                        entity: "APPROVAL_LOGS",
                        attrs: "id, reservationId, actorId, actorName, action, timestamp, remarks",
                        ui: "AdminApprovalModal, Reservation Audit Trail, Rejection Remark Drawer",
                      },
                      {
                        entity: "SCHEDULES",
                        attrs: "id, facilityId, eventTitle, startDate, endDate, startTime, endTime, reservationId",
                        ui: "CalendarView (Monthly/Weekly/Daily), Facility 7-Day Occupancy Strip",
                      },
                      {
                        entity: "NOTIFICATIONS",
                        attrs: "id, userId, title, message, type, isRead, timestamp, reservationId",
                        ui: "Navbar Notification Popover, NotificationsView, Activity Toast Alerts",
                      },
                      {
                        entity: "USAGE_REPORTS",
                        attrs: "facilityId, totalBookings, totalHoursReserved, utilizationRate, peakHourSlot",
                        ui: "ReportsView, Dashboard Analytics KPI Cards, Utilization Bars",
                      },
                    ].map((row) => (
                      <tr key={row.entity} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-3.5 font-bold font-mono text-[#0F5132] dark:text-emerald-400">
                          {row.entity}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 break-words">
                          {row.attrs}
                        </td>
                        <td className="px-6 py-3.5 text-zinc-900 dark:text-zinc-100 font-medium">
                          {row.ui}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: AUTH & ACCESS MANAGEMENT                                       */}
      {/* ========================================================================= */}
      {activeSection === "AUTH" && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Authentication Lifecycle & Access Verification
                </h3>
                <p className="text-xs text-zinc-500">
                  Step-by-step visitor progression from public portal to authenticated role workspace
                </p>
              </div>
            </CardHeader>
            <CardBody className="space-y-6 text-xs">
              {/* Perfectly Aligned 4-Step Grid Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    step: "Step 01",
                    title: "Institutional Landing",
                    desc: "Public portal showcase with official facility catalog, operating hours, and system credentials.",
                    target: "LandingPage.tsx",
                  },
                  {
                    step: "Step 02",
                    title: "Login / Onboarding",
                    desc: "Secure credential authentication, password show/hide, remember me, or student/faculty account creation.",
                    target: "LoginPage.tsx / RegisterPage.tsx",
                  },
                  {
                    step: "Step 03",
                    title: "Role Verification",
                    desc: "Server-side token verification detecting permissions: Student, Faculty, or Facility Administrator.",
                    target: "AppContext.tsx State Machine",
                  },
                  {
                    step: "Step 04",
                    title: "Role-Based Shell",
                    desc: "Tailored view routing: Student organization view, faculty priority queue, or admin console.",
                    target: "DashboardView.tsx",
                  },
                ].map((st, idx) => (
                  <div
                    key={st.step}
                    className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col justify-between h-full space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-zinc-400 font-mono text-[10px] uppercase tracking-widest mb-1.5">
                        <span className="font-bold text-[#0F5132] dark:text-emerald-400">{st.step}</span>
                        <span>0{idx + 1}/04</span>
                      </div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {st.title}
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                        {st.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 font-mono text-[10px] text-zinc-400 truncate">
                      {st.target}
                    </div>
                  </div>
                ))}
              </div>

              {/* Three Governance Policy Panels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 space-y-2">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Rule 01
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    Public Registration Guard
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Available exclusively for <strong>Students</strong> and <strong>Faculty Members</strong>.
                    Requires institutional email validation, student/faculty ID numbers, and department mapping.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
                    Rule 02
                  </div>
                  <h4 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                    Internal Administrator Provisioning
                  </h4>
                  <p className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed">
                    Facility Administrator accounts cannot be created via public registration.
                    Administrators have elevated access to activate, deactivate, and audit all accounts.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 space-y-2">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Rule 03
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    Three-Stage Credential Recovery
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Automated password reset flow: (1) Verified email submission, (2) One-time 6-digit security token
                    dispatch, and (3) Encrypted password reset updating central auth.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: ROLES & PERMISSION MATRIX                                      */}
      {/* ========================================================================= */}
      {activeSection === "ROLES" && (
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Role Permission Matrix & User Archetypes
              </h3>
              <p className="text-xs text-zinc-500">
                Clear distinction of operational privileges across collegiate user types
              </p>
            </div>
          </CardHeader>
          <CardBody className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Student Archetype */}
              <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <RoleBadge role="STUDENT" />
                    <span className="font-mono text-[10px] text-zinc-400">ID: STU-2026-0891</span>
                  </div>
                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Alex Vance
                  </h4>
                  <div className="text-[11px] text-zinc-500 font-medium">
                    Undergraduate · College of Computer Studies
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed pt-1">
                    President of the ACM Student Chapter. Books Function Hall and AVR for hackathons,
                    peer workshops, and collegiate competitions with 3-day lead times.
                  </p>
                </div>

                <div className="pt-4 border-t border-blue-200/80 dark:border-blue-900 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <CheckCircle size={15} weight="fill" className="text-blue-600 shrink-0" />
                    <span>Browse 6 venues & live schedules</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <CheckCircle size={15} weight="fill" className="text-blue-600 shrink-0" />
                    <span>Submit reservation with collision check</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <CheckCircle size={15} weight="fill" className="text-blue-600 shrink-0" />
                    <span>Track real-time approval status</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <CheckCircle size={15} weight="fill" className="text-blue-600 shrink-0" />
                    <span>Cancel own pending reservations</span>
                  </div>
                </div>
              </div>

              {/* Faculty Archetype */}
              <div className="p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <RoleBadge role="FACULTY" />
                    <span className="font-mono text-[10px] text-zinc-400">ID: FAC-2018-0412</span>
                  </div>
                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Dr. Evelyn Reed
                  </h4>
                  <div className="text-[11px] text-zinc-500 font-medium">
                    Tenured Professor · College of Engineering
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed pt-1">
                    Department Chairperson. Coordinates graduate thesis defenses, academic symposiums,
                    and rooftop solar research showcases with automated priority queue status.
                  </p>
                </div>

                <div className="pt-4 border-t border-purple-200/80 dark:border-purple-900 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <CheckCircle size={15} weight="fill" className="text-purple-600 shrink-0" />
                    <span>Automated priority reservation queue</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <CheckCircle size={15} weight="fill" className="text-purple-600 shrink-0" />
                    <span>Expedited 24-hour turnaround window</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <CheckCircle size={15} weight="fill" className="text-purple-600 shrink-0" />
                    <span>Reserve specialized audiovisual assets</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <CheckCircle size={15} weight="fill" className="text-purple-600 shrink-0" />
                    <span>Master calendar direct visibility</span>
                  </div>
                </div>
              </div>

              {/* Administrator Archetype */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <RoleBadge role="ADMINISTRATOR" />
                    <span className="font-mono text-[10px] text-zinc-400">ID: ADM-2015-0010</span>
                  </div>
                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Marcus Holloway
                  </h4>
                  <div className="text-[11px] text-zinc-500 font-medium">
                    Director of Central Facility Operations
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed pt-1">
                    Chief Administrator. Adjudicates reservation requests, manages equipment stocks, resolves
                    time clashes, assigns custodians, and audits user directory access.
                  </p>
                </div>

                <div className="pt-4 border-t border-emerald-200/80 dark:border-emerald-900 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <CheckCircle size={15} weight="fill" className="text-[#0F5132] shrink-0" />
                    <span>Approve / reject with mandatory audit logs</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <CheckCircle size={15} weight="fill" className="text-[#0F5132] shrink-0" />
                    <span>User directory activation & suspensions</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <CheckCircle size={15} weight="fill" className="text-[#0F5132] shrink-0" />
                    <span>Equipment inventory & maintenance states</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <CheckCircle size={15} weight="fill" className="text-[#0F5132] shrink-0" />
                    <span>Campus facility utilization analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: WORKFLOWS & OPERATIONAL PIPELINES                              */}
      {/* ========================================================================= */}
      {activeSection === "WORKFLOWS" && (
        <div className="space-y-8">
          {/* Student & Faculty Pipeline - 6-column Grid */}
          <Card>
            <CardHeader>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Student & Faculty Reservation Pipeline
                </h3>
                <p className="text-xs text-zinc-500">
                  Six sequential phases from facility selection to automated confirmation
                </p>
              </div>
            </CardHeader>
            <CardBody className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
                {[
                  { step: "01", title: "Select Venue", desc: "Browse 6 campus spaces, capacities, and rules." },
                  { step: "02", title: "Date & Hours", desc: "Select date and times with real-time overlap check." },
                  { step: "03", title: "Add Resources", desc: "Allocate projectors, sound, mics, chairs, tables." },
                  { step: "04", title: "Event Purpose", desc: "Provide title, description, and attendee count." },
                  { step: "05", title: "Final Review", desc: "Agree to university rules and submit request." },
                  { step: "06", title: "Decision Alert", desc: "Receive immediate notification on admin sign-off." },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col justify-between h-full space-y-2 text-center"
                  >
                    <div>
                      <div className="w-7 h-7 rounded-full bg-[#0F5132] text-white font-bold flex items-center justify-center mx-auto text-xs shadow-xs">
                        {item.step}
                      </div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs mt-2">
                        {item.title}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Administrator Adjudication Pipeline - 5-column Grid */}
          <Card>
            <CardHeader>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Facility Administrator Adjudication Workflow
                </h3>
                <p className="text-xs text-zinc-500">
                  Five verification stages ensuring zero schedule conflicts and complete custodial auditability
                </p>
              </div>
            </CardHeader>
            <CardBody className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
                {[
                  { step: "01", title: "Queue Triage", desc: "Monitor pending queue sorted by academic priority." },
                  { step: "02", title: "Collision Check", desc: "Automated verification against master schedules." },
                  { step: "03", title: "Asset Inspection", desc: "Validate central warehouse inventory quantities." },
                  { step: "04", title: "Adjudication", desc: "Approve or reject with mandatory audit remarks." },
                  { step: "05", title: "Dispatch & Log", desc: "Generate persistent audit entry and alert requestor." },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col justify-between h-full space-y-2 text-center"
                  >
                    <div>
                      <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center mx-auto text-xs shadow-xs">
                        {item.step}
                      </div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs mt-2">
                        {item.title}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: DOUBLE-BOOKING PREVENTION ENGINE                               */}
      {/* ========================================================================= */}
      {activeSection === "CONFLICT" && (
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Mathematical Double-Booking Prevention Algorithm Specification
              </h3>
              <p className="text-xs text-zinc-500">
                Zero-collision schedule validation operating in real time across the reservation wizard and database
              </p>
            </div>
          </CardHeader>
          <CardBody className="space-y-6 text-xs">
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              UniSpace enforces zero overlapping schedules for identical facilities through an active
              interval intersection formula evaluated during Step 2 of the booking modal and re-verified on
              final database submission:
            </p>

            {/* Code Block with Syntax Highlight Depth */}
            <div className="bg-zinc-950 text-emerald-400 p-5 rounded-2xl font-mono text-[11px] leading-relaxed border border-zinc-800 shadow-inner">
              {`// UniSpace Real-Time Schedule Overlap Condition (Interval Intersection)
const isOverlapping = (startA: string, endA: string, startB: string, endB: string): boolean => {
  return (startA < endB) && (endA > startB);
};

// Evaluated when:
// (existing.facilityId === targetFacilityId) &&
// (existing.date === targetDate) &&
// (existing.status === "APPROVED" || existing.status === "PENDING")`}
            </div>

            {/* Test Cases - 2 Symmetrical Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle size={16} weight="fill" className="text-emerald-600" />
                  <span>Permitted: Non-Overlapping Disjoint Intervals</span>
                </div>
                <div className="font-mono text-[11px] space-y-0.5 text-zinc-600 dark:text-zinc-300">
                  <div>Event A: 09:00 - 12:00 (Approved)</div>
                  <div>Event B: 13:00 - 16:00 (Attempted)</div>
                </div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium pt-1">
                  ✓ Validated: Slot is available. Requestor can proceed to resource selection.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle size={16} weight="fill" className="text-rose-600" />
                  <span>Blocked: Direct Temporal Overlap Detected</span>
                </div>
                <div className="font-mono text-[11px] space-y-0.5 text-zinc-600 dark:text-zinc-300">
                  <div>Event A: 10:00 - 14:00 (Approved)</div>
                  <div>Event B: 13:00 - 15:00 (Attempted)</div>
                </div>
                <div className="text-[11px] text-rose-800 dark:text-rose-300 font-medium pt-1">
                  ✕ Collision: 13:00-14:00 clash triggers modal lockout and calendar conflict banner.
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: DESIGN SYSTEM TOKENS                                           */}
      {/* ========================================================================= */}
      {activeSection === "DESIGN" && (
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Institutional Brand & Design System Tokens
              </h3>
              <p className="text-xs text-zinc-500">
                Curated color palette, typographic scales, and status indicators
              </p>
            </div>
          </CardHeader>
          <CardBody className="space-y-6 text-xs">
            {/* Color Palette Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#0F5132] text-white flex flex-col justify-between h-28 shadow-sm">
                <span className="text-[10px] uppercase font-mono tracking-widest opacity-80">Primary</span>
                <div>
                  <div className="font-bold text-sm">University Green</div>
                  <div className="font-mono text-[11px] mt-0.5 opacity-90">#0F5132</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0A3622] text-white flex flex-col justify-between h-28 shadow-sm">
                <span className="text-[10px] uppercase font-mono tracking-widest opacity-80">Secondary</span>
                <div>
                  <div className="font-bold text-sm">Dark Green</div>
                  <div className="font-mono text-[11px] mt-0.5 opacity-90">#0A3622</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between h-28 shadow-sm">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">Neutral</span>
                <div>
                  <div className="font-bold text-sm">Crisp White</div>
                  <div className="font-mono text-[11px] text-zinc-500 mt-0.5">#FFFFFF / #FAFAFB</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between h-28 shadow-sm">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">Surface</span>
                <div>
                  <div className="font-bold text-sm">Light Gray Slate</div>
                  <div className="font-mono text-[11px] text-zinc-500 mt-0.5">#F4F4F5 / #09090B</div>
                </div>
              </div>
            </div>

            {/* Status Token Matrix */}
            <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">
                Reservation & Venue Status Chips
              </h4>
              <div className="flex flex-wrap gap-2.5">
                <StatusBadge status="AVAILABLE" />
                <StatusBadge status="APPROVED" />
                <StatusBadge status="PENDING" />
                <StatusBadge status="REJECTED" />
                <StatusBadge status="CONFLICT" />
                <StatusBadge status="MAINTENANCE" />
                <StatusBadge status="BOOKED" />
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

