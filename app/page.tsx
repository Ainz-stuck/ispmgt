"use client";

import React from "react";
import { AppProvider, useApp } from "../context/AppContext";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { LandingPage } from "../components/auth/LandingPage";
import { LoginPage } from "../components/auth/LoginPage";
import { RegisterPage } from "../components/auth/RegisterPage";
import { ForgotPasswordPage } from "../components/auth/ForgotPasswordPage";
import { DashboardView } from "../components/views/DashboardView";
import { FacilitiesView } from "../components/views/FacilitiesView";
import { CalendarView } from "../components/views/CalendarView";
import { ReservationsView } from "../components/views/ReservationsView";
import { ResourcesView } from "../components/views/ResourcesView";
import { ReportsView } from "../components/views/ReportsView";
import { UserManagementView } from "../components/views/UserManagementView";
import { ProfileView } from "../components/views/ProfileView";
import { NotificationsView } from "../components/views/NotificationsView";
import { ArchitectureView } from "../components/views/ArchitectureView";
import { FacilityDetailModal } from "../components/facilities/FacilityDetailModal";
import { ReservationModal } from "../components/reservations/ReservationModal";
import { AdminApprovalModal } from "../components/reservations/AdminApprovalModal";

function MainAppShell() {
  const [isTabletCollapsed, setIsTabletCollapsed] = React.useState(true);

  const {
    isAuthenticated,
    authView,
    activeTab,
    selectedFacilityId,
    setSelectedFacilityId,
    facilities,
    openBookingModal,
    currentUser,
  } = useApp();

  // If not authenticated or in auth screens, route to authentication modules
  if (!isAuthenticated || authView !== "app") {
    switch (authView) {
      case "login":
        return <LoginPage />;
      case "register":
        return <RegisterPage />;
      case "forgot-password":
        return <ForgotPasswordPage />;
      case "landing":
      default:
        return <LandingPage />;
    }
  }

  const isAdmin = currentUser.role === "ADMINISTRATOR";

  // Authenticated Role-Based System
  const selectedFacility =
    facilities.find((f) => f.id === selectedFacilityId) || null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAFAFB] dark:bg-[#09090B]">
      {/* WCAG 2.4.1 Bypass Blocks: Skip to Main Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#0F5132] focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 font-semibold text-xs transition-all"
      >
        Skip to main content
      </a>

      <Navbar
        isTabletCollapsed={isTabletCollapsed}
        onToggleTabletCollapse={() => setIsTabletCollapsed(!isTabletCollapsed)}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isTabletCollapsed ? "md:pl-20 xl:pl-64" : "md:pl-64 xl:pl-64"
        }`}
      >
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 focus:outline-none"
        >
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "facilities" && <FacilitiesView />}
          {activeTab === "calendar" && <CalendarView />}
          {activeTab === "reservations" && <ReservationsView />}
          {activeTab === "resources" && <ResourcesView />}
          {activeTab === "reports" && (isAdmin ? <ReportsView /> : <DashboardView />)}
          {activeTab === "users" && (isAdmin ? <UserManagementView /> : <DashboardView />)}
          {activeTab === "profile" && <ProfileView />}
          {activeTab === "notifications" && <NotificationsView />}
          {activeTab === "architecture" && (isAdmin ? <ArchitectureView /> : <DashboardView />)}
        </main>
        <Footer />
      </div>

      {/* Global Modals */}
      <FacilityDetailModal
        facility={selectedFacility}
        isOpen={!!selectedFacilityId}
        onClose={() => setSelectedFacilityId(null)}
        onReserve={(facility) => {
          setSelectedFacilityId(null);
          openBookingModal(facility.id);
        }}
      />

      <ReservationModal />

      <AdminApprovalModal />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <MainAppShell />
    </AppProvider>
  );
}
