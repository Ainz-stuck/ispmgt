"use client";

import React, { useState, useEffect } from "react";
import { useApp, NavTab } from "../../context/AppContext";
import {
  Buildings,
  Calendar,
  ClipboardText,
  Package,
  ChartBar,
  Bell,
  User,
  PlusCircle,
  Student,
  ChalkboardTeacher,
  ShieldCheck,
  CheckCircle,
  FileCode,
  UserGear,
  SignOut,
  CaretDown,
  List,
  X,
  CaretLeft,
  CaretRight,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import { RoleBadge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface NavbarProps {
  isTabletCollapsed?: boolean;
  onToggleTabletCollapse?: () => void;
}

export function Navbar({ isTabletCollapsed = true, onToggleTabletCollapse }: NavbarProps) {
  const {
    currentUser,
    switchRole,
    activeTab,
    setActiveTab,
    unreadNotificationsCount,
    notifications,
    markAllNotificationsAsRead,
    openBookingModal,
    logout,
  } = useApp();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isAdmin = currentUser.role === "ADMINISTRATOR";

  // Navigation Items matching responsive rules
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; adminOnly?: boolean; badge?: number }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <Buildings size={20} weight={activeTab === "dashboard" ? "fill" : "regular"} />,
    },
    {
      id: "facilities",
      label: "Facilities",
      icon: <Buildings size={20} weight={activeTab === "facilities" ? "fill" : "regular"} />,
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: <Calendar size={20} weight={activeTab === "calendar" ? "fill" : "regular"} />,
    },
    {
      id: "reservations",
      label: "Reservations",
      icon: <ClipboardText size={20} weight={activeTab === "reservations" ? "fill" : "regular"} />,
    },
    {
      id: "resources",
      label: "Resources",
      icon: <Package size={20} weight={activeTab === "resources" ? "fill" : "regular"} />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell size={20} weight={activeTab === "notifications" ? "fill" : "regular"} />,
      badge: unreadNotificationsCount,
    },
    {
      id: "reports",
      label: "Reports",
      icon: <ChartBar size={20} weight={activeTab === "reports" ? "fill" : "regular"} />,
      adminOnly: true,
    },
    {
      id: "users",
      label: "Users",
      icon: <UserGear size={20} weight={activeTab === "users" ? "fill" : "regular"} />,
      adminOnly: true,
    },
    {
      id: "profile",
      label: "Profile",
      icon: <User size={20} weight={activeTab === "profile" ? "fill" : "regular"} />,
    },
    {
      id: "architecture",
      label: "System Spec",
      icon: <FileCode size={20} weight={activeTab === "architecture" ? "fill" : "regular"} />,
      adminOnly: true,
    },
  ];

  // Close mobile drawer upon navigating
  const handleNavClick = (tabId: NavTab) => {
    setActiveTab(tabId);
    setIsMobileDrawerOpen(false);
  };

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileDrawerOpen(false);
        setIsNotifOpen(false);
        setIsRoleDropdownOpen(false);
        setIsUserMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP & TABLET SIDEBAR NAVIGATION                                   */}
      {/* Desktop (>= 1200px): Fixed full sidebar (w-64)                           */}
      {/* Tablet (768px - 1199px): Collapsible sidebar (w-20 collapsed, w-64 open) */}
      {/* Mobile (< 768px): Hidden                                                 */}
      {/* ========================================================================= */}
      <aside
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isTabletCollapsed ? "md:w-20 xl:w-64" : "md:w-64 xl:w-64"
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick("dashboard")}
            className="flex items-center gap-3 cursor-pointer group overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-xl p-1"
            aria-label="UniSpace Dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0F5132] flex items-center justify-center text-white shadow-sm group-hover:bg-[#0A3622] transition-colors shrink-0 ring-1 ring-emerald-600/30">
              <Buildings size={22} weight="bold" />
            </div>
            <div className={`transition-opacity duration-200 ${isTabletCollapsed ? "md:hidden xl:block" : "block"}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
                  UniSpace
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-[#0F5132] dark:bg-emerald-950 dark:text-emerald-300">
                  v2.6
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate">
                Facility & Resource Ops
              </p>
            </div>
          </button>

          {/* Tablet Collapse/Expand Button */}
          {onToggleTabletCollapse && (
            <button
              onClick={onToggleTabletCollapse}
              className="hidden md:flex xl:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={isTabletCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isTabletCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isTabletCollapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
            </button>
          )}
        </div>

        {/* Quick Booking CTA Button (Full width on Desktop / Icon on Collapsed Tablet) */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <button
            onClick={() => openBookingModal()}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-[#0F5132] hover:bg-[#0A3622] text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] ${
              isTabletCollapsed ? "md:p-2.5 md:rounded-xl xl:rounded-full xl:py-2.5 xl:px-3" : ""
            }`}
            title="Start New Facility Reservation"
            aria-label="Start New Facility Reservation"
          >
            <PlusCircle size={18} weight="bold" className="shrink-0" />
            <span className={isTabletCollapsed ? "md:hidden xl:inline" : "inline"}>
              Reserve Venue
            </span>
          </button>
        </div>

        {/* Navigation Items List */}
        <nav aria-label="Main Navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 no-scrollbar">
          <div className={`text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-2 ${isTabletCollapsed ? "md:hidden xl:block" : "block"}`}>
            Main Navigation
          </div>

          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? "bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300 shadow-2xs font-bold ring-1 ring-emerald-500/20"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-yellow-950 dark:hover:text-yellow-200 hover:bg-yellow-100/90 dark:hover:bg-yellow-500/20 hover:ring-1 hover:ring-yellow-400/50 dark:hover:ring-yellow-400/30"
                } ${isTabletCollapsed ? "md:justify-center xl:justify-start" : "justify-start"}`}
                title={item.label}
              >
                <span className={`shrink-0 transition-colors ${isActive ? "text-[#0F5132] dark:text-emerald-300" : "text-zinc-500 group-hover:text-yellow-700 dark:group-hover:text-yellow-400"}`}>
                  {item.icon}
                </span>

                <span className={`truncate flex-1 text-left ${isTabletCollapsed ? "md:hidden xl:inline" : "inline"}`}>
                  {item.label}
                </span>

                {/* Badge for Notifications */}
                {item.badge && item.badge > 0 ? (
                  <span className={`px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold ${isTabletCollapsed ? "md:absolute md:top-1.5 md:right-1.5 xl:static" : "static"}`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Current User & Quick Role Switcher */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 shrink-0 space-y-2">
          {/* Role Status Tag */}
          <div className={`flex items-center justify-between gap-2 px-2 py-1 ${isTabletCollapsed ? "md:hidden xl:flex" : "flex"}`}>
            <span className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider">Role</span>
            <RoleBadge role={currentUser.role} />
          </div>

          {/* User Profile Tile */}
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-white border border-zinc-200/90 shadow-2xs">
            <div
              onClick={() => handleNavClick("profile")}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
            >
              <div className="w-8 h-8 rounded-full bg-[#0F5132] text-white font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-emerald-500/30">
                {currentUser.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className={`min-w-0 ${isTabletCollapsed ? "md:hidden xl:block" : "block"}`}>
                <div className="font-bold text-xs text-black dark:text-black truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-zinc-600 dark:text-zinc-600 truncate font-mono font-medium">
                  {currentUser.studentOrEmployeeId}
                </div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className={`p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors ${
                isTabletCollapsed ? "md:hidden xl:block" : "block"
              }`}
              title="Sign Out"
            >
              <SignOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. TOP CONTEXT BAR (Desktop & Tablet Header)                              */}
      {/* Placed at top of main view area, responsive to sidebar width             */}
      {/* ========================================================================= */}
      <header
        className={`hidden md:block sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isTabletCollapsed ? "md:pl-20 xl:pl-64" : "md:pl-64 xl:pl-64"
        }`}
      >
        {/* Top Institutional Hairline */}
        <div className="bg-[#0A3622] text-white text-[11px] px-6 lg:px-8 py-1.5 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium tracking-wide">
              Greenwich University System · Central Facility Operations
            </span>
          </div>
          <div className="flex items-center gap-4 text-emerald-200 text-[11px]">
            <span>Hours: 06:00 - 22:00 PHT</span>
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <CheckCircle size={13} weight="fill" /> 6/6 Venues Active
            </span>
          </div>
        </div>

        {/* Top Navbar Actions */}
        <div className="h-14 px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 capitalize">
              {activeTab === "architecture" ? "System Architecture & Blueprint" : `${activeTab} Overview`}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Role Simulator Pill Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                aria-haspopup="menu"
                aria-expanded={isRoleDropdownOpen}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 text-xs transition-colors"
                title="Switch simulated role for testing"
                aria-label="Switch simulated role for testing"
              >
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Role:</span>
                <RoleBadge role={currentUser.role} />
                <CaretDown size={12} className="text-zinc-400" />
              </button>

              {isRoleDropdownOpen && (
                <div
                  role="menu"
                  aria-label="Simulate Role Access"
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 z-50"
                >
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 py-1 mb-1">
                    Simulate Role Access
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      switchRole("STUDENT");
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 text-left rounded-lg text-xs transition-colors ${
                      currentUser.role === "STUDENT"
                        ? "bg-emerald-50 text-[#0F5132] font-semibold dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Student size={16} weight="bold" />
                    <div className="flex-1">
                      <div className="font-medium">Student</div>
                      <div className="text-[10px] text-zinc-400">Alex Vance · Request & Track</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      switchRole("FACULTY");
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 text-left rounded-lg text-xs transition-colors ${
                      currentUser.role === "FACULTY"
                        ? "bg-emerald-50 text-[#0F5132] font-semibold dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <ChalkboardTeacher size={16} weight="bold" />
                    <div className="flex-1">
                      <div className="font-medium">Faculty Member</div>
                      <div className="text-[10px] text-zinc-400">Dr. Evelyn Reed · Priority Queue</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      switchRole("ADMINISTRATOR");
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 text-left rounded-lg text-xs transition-colors ${
                      currentUser.role === "ADMINISTRATOR"
                        ? "bg-emerald-50 text-[#0F5132] font-semibold dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <ShieldCheck size={16} weight="bold" />
                    <div className="flex-1">
                      <div className="font-medium">Facility Administrator</div>
                      <div className="text-[10px] text-zinc-400">Marcus Holloway · Adjudication</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell Icon */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                aria-haspopup="dialog"
                aria-expanded={isNotifOpen}
                className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label={
                  unreadNotificationsCount > 0
                    ? `Notifications (${unreadNotificationsCount} unread)`
                    : "Notifications"
                }
              >
                <Bell size={20} weight={unreadNotificationsCount > 0 ? "fill" : "regular"} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-zinc-950">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div
                  role="dialog"
                  aria-label="Recent notifications"
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-3 z-50"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Notifications
                      </span>
                      {unreadNotificationsCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-[#0F5132] font-bold">
                          {unreadNotificationsCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => markAllNotificationsAsRead()}
                      className="text-[11px] text-[#0F5132] dark:text-emerald-400 hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-xl text-xs border transition-colors ${
                          notif.read
                            ? "bg-zinc-50/50 border-zinc-100 text-zinc-600 dark:bg-zinc-800/30 dark:border-zinc-800 dark:text-zinc-400"
                            : "bg-emerald-50/40 border-emerald-200 text-zinc-900 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 font-semibold mb-0.5">
                          <span className="truncate">{notif.title}</span>
                          <span className="text-[10px] text-zinc-400 shrink-0">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                          {notif.message}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
                    <button
                      onClick={() => {
                        handleNavClick("notifications");
                        setIsNotifOpen(false);
                      }}
                      className="text-xs text-[#0F5132] dark:text-emerald-400 hover:underline font-medium"
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MOBILE HEADER (320px - 767px)                                          */}
      {/* Strict Requirement: UniSpace logo, Menu button, Notification, Profile    */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="h-16 px-4 flex items-center justify-between gap-3">
          {/* Left: Menu Button (Hamburger) + UniSpace Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
              aria-label="Open Navigation Menu"
            >
              <List size={24} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick("dashboard")}
              className="flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] rounded-xl p-1 text-left"
              aria-label="UniSpace Dashboard"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0F5132] flex items-center justify-center text-white shadow-xs">
                <Buildings size={18} weight="bold" />
              </div>
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
                UniSpace
              </span>
            </button>
          </div>

          {/* Right: Notification Icon + Profile Icon */}
          <div className="flex items-center gap-1.5">
            {/* Notification Icon Button with Badge (Min 44px) */}
            <button
              onClick={() => handleNavClick("notifications")}
              className="min-h-[44px] min-w-[44px] relative flex items-center justify-center rounded-xl text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label={
                unreadNotificationsCount > 0
                  ? `Notifications (${unreadNotificationsCount} unread)`
                  : "Notifications"
              }
            >
              <Bell size={22} weight={unreadNotificationsCount > 0 ? "fill" : "regular"} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-zinc-950">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Profile Avatar Button (Min 44px) */}
            <button
              onClick={() => handleNavClick("profile")}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
              aria-label={`User Profile: ${currentUser.name}`}
            >
              <div className="w-8 h-8 rounded-full bg-[#0F5132] text-white font-bold flex items-center justify-center text-xs ring-1 ring-emerald-500/40">
                {currentUser.name.split(" ").map((n) => n[0]).join("")}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 4. MOBILE SLIDE-OVER NAVIGATION DRAWER                                    */}
      {/* Full screen slide-in drawer with touch-friendly 48px+ targets            */}
      {/* ========================================================================= */}
      {isMobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="fixed inset-0 z-50 md:hidden flex"
        >
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-sm bg-white dark:bg-zinc-950 shadow-2xl flex flex-col justify-between h-full z-10 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] border-r border-zinc-200 dark:border-zinc-800">
            {/* Drawer Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F5132] flex items-center justify-center text-white shadow-xs">
                  <Buildings size={20} weight="bold" />
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">UniSpace</div>
                  <div className="text-[10px] text-zinc-400">Greenwich Facilities</div>
                </div>
              </div>

              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                aria-label="Close Navigation Menu"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* User Profile Bar inside Drawer */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold">Active User</span>
                <RoleBadge role={currentUser.role} />
              </div>
              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {currentUser.name}
              </div>
              <div className="text-xs text-zinc-500 truncate">{currentUser.email}</div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                ID: {currentUser.studentOrEmployeeId} · {currentUser.department}
              </div>
            </div>

            {/* Quick Booking CTA in Mobile Drawer */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  openBookingModal();
                }}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-[#0F5132] text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-transform"
              >
                <PlusCircle size={20} weight="bold" />
                <span>Reserve Venue Now</span>
              </button>
            </div>

            {/* Navigation Links in Mobile Drawer */}
            <nav aria-label="Mobile Navigation" className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
              {navItems.map((item) => {
                if (item.adminOnly && !isAdmin) return null;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`w-full min-h-[48px] flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group ${
                      isActive
                        ? "bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300 font-bold ring-1 ring-emerald-500/20"
                        : "text-zinc-700 dark:text-zinc-300 hover:text-yellow-950 dark:hover:text-yellow-200 hover:bg-yellow-100/90 dark:hover:bg-yellow-500/20 hover:ring-1 hover:ring-yellow-400/50 dark:hover:ring-yellow-400/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`shrink-0 transition-colors ${isActive ? "text-[#0F5132] dark:text-emerald-300" : "text-zinc-500 group-hover:text-yellow-700 dark:group-hover:text-yellow-400"}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge && item.badge > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-bold">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Role Switcher & Sign Out */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 space-y-3">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Simulate Role
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => switchRole("STUDENT")}
                  className={`min-h-[40px] text-xs font-semibold py-1.5 px-2 rounded-lg border text-center transition-colors ${
                    currentUser.role === "STUDENT"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  Student
                </button>
                <button
                  onClick={() => switchRole("FACULTY")}
                  className={`min-h-[40px] text-xs font-semibold py-1.5 px-2 rounded-lg border text-center transition-colors ${
                    currentUser.role === "FACULTY"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  Faculty
                </button>
                <button
                  onClick={() => switchRole("ADMINISTRATOR")}
                  className={`min-h-[40px] text-xs font-semibold py-1.5 px-2 rounded-lg border text-center transition-colors ${
                    currentUser.role === "ADMINISTRATOR"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  Admin
                </button>
              </div>

              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  logout();
                }}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors"
              >
                <SignOut size={16} />
                <span>Sign Out of UniSpace</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
