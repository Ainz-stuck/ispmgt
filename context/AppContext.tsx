"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import {
  User,
  UserRole,
  Facility,
  FacilityId,
  FacilityStatus,
  FacilityScheduleEntry,
  ResourceItem,
  Reservation,
  ApprovalLog,
  SystemNotification,
  ResourceCondition,
  AuthView,
} from "../types";
import { useAuth, RegisterPayload } from "./AuthContext";
import * as db from "../lib/supabase-data";

export type NavTab =
  | "dashboard"
  | "facilities"
  | "calendar"
  | "reservations"
  | "resources"
  | "reports"
  | "notifications"
  | "architecture"
  | "profile"
  | "users";

const DEFAULT_GUEST: User = {
  id: "guest",
  name: "Guest User",
  email: "guest@chmsu.edu.ph",
  department: "University Campus",
  role: "STUDENT",
  studentOrEmployeeId: "2026-00000",
  status: "ACTIVE",
};

export interface ActionResult {
  success: boolean;
  error?: string;
}

interface AppContextType {
  // Authentication & Users
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authView: AuthView;
  setAuthView: (view: AuthView) => void;
  currentUser: User;
  allUsers: User[];
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<ActionResult>;
  toggleUserStatus: (userId: string) => Promise<ActionResult>;

  // Facilities
  facilities: Facility[];
  updateFacilityStatus: (
    facilityId: FacilityId,
    status: FacilityStatus
  ) => Promise<ActionResult>;
  updateFacilityCapacity: (facilityId: FacilityId, capacity: number) => Promise<ActionResult>;
  updateFacilityDetails: (
    facilityId: FacilityId,
    data: Partial<Facility>
  ) => Promise<ActionResult>;

  // Resources
  resources: ResourceItem[];
  updateResourceCondition: (
    resourceId: string,
    condition: ResourceCondition
  ) => Promise<ActionResult>;
  updateResourceQuantity: (resourceId: string, total: number) => Promise<ActionResult>;

  // Reservations & Campus Schedule
  reservations: Reservation[];
  scheduleSlots: FacilityScheduleEntry[];
  createReservation: (
    data: Omit<
      Reservation,
      | "id"
      | "reservationCode"
      | "status"
      | "submittedAt"
      | "userId"
      | "userName"
      | "userRole"
      | "userEmail"
      | "department"
    >
  ) => Promise<{
    success: boolean;
    conflict?: FacilityScheduleEntry;
    reservationCode?: string;
    error?: string;
  }>;
  approveReservation: (reservationId: string, notes?: string) => Promise<ActionResult>;
  rejectReservation: (reservationId: string, reason: string) => Promise<ActionResult>;
  cancelReservation: (reservationId: string) => Promise<ActionResult>;

  // Logs & Notifications
  approvalLogs: ApprovalLog[];
  notifications: SystemNotification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  unreadNotificationsCount: number;

  // Navigation & Modals
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedFacilityId: FacilityId | null;
  setSelectedFacilityId: (id: FacilityId | null) => void;
  isBookingModalOpen: boolean;
  preselectedFacilityId: FacilityId | null;
  preselectedDate: string | null;
  preselectedTime: string | null;
  openBookingModal: (facilityId?: FacilityId, date?: string, time?: string) => void;
  closeBookingModal: () => void;
  selectedReservationForReview: Reservation | null;
  setSelectedReservationForReview: (res: Reservation | null) => void;

  // Helpers
  checkConflict: (
    facilityId: FacilityId,
    date: string,
    startTime: string,
    endTime: string,
    excludeReservationId?: string
  ) => FacilityScheduleEntry | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  // Core Data States
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<FacilityScheduleEntry[]>([]);
  const [approvalLogs, setApprovalLogs] = useState<ApprovalLog[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [selectedFacilityId, setSelectedFacilityId] = useState<FacilityId | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [preselectedFacilityId, setPreselectedFacilityId] = useState<FacilityId | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);
  const [preselectedTime, setPreselectedTime] = useState<string | null>(null);
  const [selectedReservationForReview, setSelectedReservationForReview] =
    useState<Reservation | null>(null);

  const currentUser: User = auth.currentUser || DEFAULT_GUEST;

  // Fetch all data from Supabase
  const loadAppData = useCallback(async () => {
    try {
      const facs = await db.fetchFacilities();
      setFacilities(facs);

      if (auth.isAuthenticated && auth.currentUser) {
        const isAdmin = auth.currentUser.role === "ADMINISTRATOR";
        const [resrcs, users, rsvps, slots, logs, notifs] = await Promise.all([
          db.fetchResources(),
          isAdmin ? db.fetchAllUsers() : Promise.resolve([]),
          db.fetchReservations(),
          db.fetchFacilitySchedule(),
          db.fetchApprovalLogs(),
          db.fetchNotifications(auth.currentUser.id, auth.currentUser.role),
        ]);
        setResources(resrcs);
        setAllUsers(users);
        setReservations(rsvps);
        setScheduleSlots(slots);
        setApprovalLogs(logs);
        setNotifications(notifs);
      } else {
        setResources([]);
        setAllUsers([]);
        setReservations([]);
        setScheduleSlots([]);
        setApprovalLogs([]);
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error loading app data from Supabase:", err);
    }
  }, [auth.isAuthenticated, auth.currentUser]);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  // Auth wrappers
  const login = async (email: string, pass: string) => {
    const res = await auth.login(email, pass);
    if (res.success) {
      setActiveTab("dashboard");
    }
    return res;
  };

  const register = async (payload: RegisterPayload) => {
    const res = await auth.register(payload);
    if (res.success) {
      setActiveTab("dashboard");
    }
    return res;
  };

  const resetPassword = async (email: string) => {
    return auth.resetPassword(email);
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    return auth.changePassword(currentPass, newPass);
  };

  const logout = async () => {
    await auth.logout();
    setActiveTab("dashboard");
  };

  const updateUserProfile = async (data: Partial<User>): Promise<ActionResult> => {
    if (!currentUser.id || currentUser.id === "guest") {
      return { success: false, error: "Not authenticated." };
    }
    try {
      await db.updateUserProfile(currentUser.id, data);
      await auth.refreshCurrentUser();
      setAllUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? { ...u, ...data } : u))
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update profile." };
    }
  };

  const toggleUserStatus = async (userId: string): Promise<ActionResult> => {
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return { success: false, error: "User not found." };

    try {
      const nextStatus = await db.toggleUserStatus(userId, target.status);

      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
      );

      if (currentUser.id === userId) {
        auth.setCurrentUser((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      }

      const newLog = await db.insertApprovalLog({
        reservationId: `user-${userId}`,
        reservationCode: target.studentOrEmployeeId,
        eventName: "User Access State Modified",
        facilityName: "Security & Role Access",
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: "USER_STATUS_CHANGE",
        timestamp: new Date().toISOString(),
        notes: `User ${target.name} (${target.email}) account status changed to ${nextStatus}.`,
      });

      setApprovalLogs((l) => [newLog, ...l]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to toggle user status." };
    }
  };

  // Facility Controls
  const updateFacilityStatus = async (
    facilityId: FacilityId,
    status: FacilityStatus
  ): Promise<ActionResult> => {
    try {
      await db.updateFacilityStatus(facilityId, status);
      setFacilities((prev) =>
        prev.map((f) => (f.id === facilityId ? { ...f, status } : f))
      );

      const facility = facilities.find((f) => f.id === facilityId);
      const newLog = await db.insertApprovalLog({
        reservationId: `facility-${facilityId}`,
        reservationCode: facility?.code || facilityId,
        eventName: "Facility Status Modification",
        facilityName: facility?.name || facilityId,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: "MAINTENANCE_TOGGLE",
        timestamp: new Date().toISOString(),
        notes: `Status changed to ${status} by administrator.`,
      });

      setApprovalLogs((prev) => [newLog, ...prev]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update facility status." };
    }
  };

  const updateFacilityCapacity = async (
    facilityId: FacilityId,
    capacity: number
  ): Promise<ActionResult> => {
    try {
      await db.updateFacilityCapacity(facilityId, capacity);
      setFacilities((prev) =>
        prev.map((f) => (f.id === facilityId ? { ...f, capacity } : f))
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update capacity." };
    }
  };

  const updateFacilityDetails = async (
    facilityId: FacilityId,
    data: Partial<Facility>
  ): Promise<ActionResult> => {
    try {
      await db.updateFacilityDetails(facilityId, data);
      setFacilities((prev) =>
        prev.map((f) => (f.id === facilityId ? { ...f, ...data } : f))
      );

      const facility = facilities.find((f) => f.id === facilityId);
      const newLog = await db.insertApprovalLog({
        reservationId: `facility-${facilityId}`,
        reservationCode: data.code || facility?.code || facilityId,
        eventName: "Facility Specification Updated",
        facilityName: data.name || facility?.name || facilityId,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: "FACILITY_DETAILS_UPDATE",
        timestamp: new Date().toISOString(),
        notes: `Facility specifications and media updated by administrator ${currentUser.name}.`,
      });
      setApprovalLogs((prev) => [newLog, ...prev]);

      const newNotif = await db.insertNotification({
        userId: null,
        targetRole: "ALL",
        title: "Facility Details Updated",
        message: `Specifications for ${
          data.name || facility?.name || facilityId
        } were updated by ${currentUser.name}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: "FACILITY_UPDATE",
      });
      setNotifications((prev) => [newNotif, ...prev]);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update facility details." };
    }
  };

  // Resource Controls
  const updateResourceCondition = async (
    resourceId: string,
    condition: ResourceCondition
  ): Promise<ActionResult> => {
    try {
      await db.updateResourceCondition(resourceId, condition);
      setResources((prev) =>
        prev.map((r) => (r.id === resourceId ? { ...r, condition } : r))
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update condition." };
    }
  };

  const updateResourceQuantity = async (
    resourceId: string,
    totalQuantity: number
  ): Promise<ActionResult> => {
    try {
      await db.updateResourceQuantity(resourceId, totalQuantity);
      setResources((prev) =>
        prev.map((r) =>
          r.id === resourceId
            ? {
                ...r,
                totalQuantity,
                availableQuantity: Math.min(r.availableQuantity, totalQuantity),
              }
            : r
        )
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update quantity." };
    }
  };

  // Conflict Checker (uses campus-wide anonymized scheduleSlots)
  const checkConflict = useCallback(
    (
      facilityId: FacilityId,
      date: string,
      startTime: string,
      endTime: string,
      excludeReservationId?: string
    ): FacilityScheduleEntry | null => {
      const conflict = scheduleSlots.find((slot) =>
        db.checkTimeConflict(
          slot,
          facilityId,
          date,
          startTime,
          endTime,
          excludeReservationId
        )
      );
      return conflict || null;
    },
    [scheduleSlots]
  );

  const createReservation = async (
    data: Omit<
      Reservation,
      | "id"
      | "reservationCode"
      | "status"
      | "submittedAt"
      | "userId"
      | "userName"
      | "userRole"
      | "userEmail"
      | "department"
    >
  ) => {
    try {
      // Refresh schedule slots right before creation to catch recent concurrent bookings
      const latestSlots = await db.fetchFacilitySchedule();
      setScheduleSlots(latestSlots);

      const res = await db.createReservationRecord(data, currentUser, latestSlots);
      if (!res.success) {
        return { success: false, conflict: res.conflict };
      }

      if (res.reservation) {
        setReservations((prev) => [res.reservation!, ...prev]);
      }

      const [slots, logs, notifs] = await Promise.all([
        db.fetchFacilitySchedule(),
        db.fetchApprovalLogs(),
        db.fetchNotifications(currentUser.id, currentUser.role),
      ]);
      setScheduleSlots(slots);
      setApprovalLogs(logs);
      setNotifications(notifs);

      return { success: true, reservationCode: res.reservationCode };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to submit reservation request.",
      };
    }
  };

  const approveReservation = async (
    reservationId: string,
    notes?: string
  ): Promise<ActionResult> => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) return { success: false, error: "Reservation not found." };

    try {
      const overlap = checkConflict(
        target.facilityId,
        target.date,
        target.startTime,
        target.endTime,
        target.id
      );
      if (overlap) {
        return {
          success: false,
          error: `Schedule overlap with "${overlap.eventName}" (${overlap.startTime} - ${overlap.endTime}).`,
        };
      }

      await db.approveReservationRecord(target, currentUser, notes);

      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId
            ? {
                ...r,
                status: "APPROVED",
                reviewedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
                reviewedBy: currentUser.name,
                adminNotes: notes || "Approved by facility administrator.",
              }
            : r
        )
      );

      const [slots, logs, notifs] = await Promise.all([
        db.fetchFacilitySchedule(),
        db.fetchApprovalLogs(),
        db.fetchNotifications(currentUser.id, currentUser.role),
      ]);
      setScheduleSlots(slots);
      setApprovalLogs(logs);
      setNotifications(notifs);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to approve reservation.",
      };
    }
  };

  const rejectReservation = async (
    reservationId: string,
    reason: string
  ): Promise<ActionResult> => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) return { success: false, error: "Reservation not found." };

    try {
      await db.rejectReservationRecord(target, currentUser, reason);

      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId
            ? {
                ...r,
                status: "REJECTED",
                reviewedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
                reviewedBy: currentUser.name,
                rejectionReason: reason,
              }
            : r
        )
      );

      const [slots, logs, notifs] = await Promise.all([
        db.fetchFacilitySchedule(),
        db.fetchApprovalLogs(),
        db.fetchNotifications(currentUser.id, currentUser.role),
      ]);
      setScheduleSlots(slots);
      setApprovalLogs(logs);
      setNotifications(notifs);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to reject reservation.",
      };
    }
  };

  const cancelReservation = async (reservationId: string): Promise<ActionResult> => {
    try {
      await db.cancelReservationRecord(reservationId);
      setReservations((prev) =>
        prev.map((r) => (r.id === reservationId ? { ...r, status: "CANCELLED" } : r))
      );
      const slots = await db.fetchFacilitySchedule();
      setScheduleSlots(slots);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to cancel reservation.",
      };
    }
  };

  const markNotificationAsRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read || currentUser.id === "guest") return;

    await db.markNotificationAsRead(target, currentUser.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser.id || currentUser.id === "guest") return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    await db.markAllNotificationsAsRead(currentUser.id, unread);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const openBookingModal = (facilityId?: FacilityId, date?: string, time?: string) => {
    setPreselectedFacilityId(facilityId || null);
    setPreselectedDate(date || null);
    setPreselectedTime(time || null);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setPreselectedFacilityId(null);
    setPreselectedDate(null);
    setPreselectedTime(null);
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated: auth.isAuthenticated,
        isAuthLoading: auth.isLoading,
        authView: auth.authView,
        setAuthView: auth.setAuthView,
        currentUser,
        allUsers,
        login,
        register,
        resetPassword,
        changePassword,
        logout,
        updateUserProfile,
        toggleUserStatus,
        facilities,
        updateFacilityStatus,
        updateFacilityCapacity,
        updateFacilityDetails,
        resources,
        updateResourceCondition,
        updateResourceQuantity,
        reservations,
        scheduleSlots,
        createReservation,
        approveReservation,
        rejectReservation,
        cancelReservation,
        approvalLogs,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadNotificationsCount,
        activeTab,
        setActiveTab,
        selectedFacilityId,
        setSelectedFacilityId,
        isBookingModalOpen,
        preselectedFacilityId,
        preselectedDate,
        preselectedTime,
        openBookingModal,
        closeBookingModal,
        selectedReservationForReview,
        setSelectedReservationForReview,
        checkConflict,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
