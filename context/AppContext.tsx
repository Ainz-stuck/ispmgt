"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import {
  User,
  UserRole,
  Facility,
  FacilityId,
  FacilityStatus,
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
  name: "Alex Vance",
  firstName: "Alex",
  lastName: "Vance",
  email: "alex.vance@university.edu",
  department: "College of Computer Studies",
  role: "STUDENT",
  studentOrEmployeeId: "2026-10492",
  status: "ACTIVE",
};

interface AppContextType {
  // Authentication & Users
  isAuthenticated: boolean;
  authView: AuthView;
  setAuthView: (view: AuthView) => void;
  currentUser: User;
  allUsers: User[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPassword?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;

  // Facilities
  facilities: Facility[];
  updateFacilityStatus: (facilityId: FacilityId, status: FacilityStatus) => Promise<void>;
  updateFacilityCapacity: (facilityId: FacilityId, capacity: number) => Promise<void>;
  updateFacilityDetails: (facilityId: FacilityId, data: Partial<Facility>) => Promise<void>;

  // Resources
  resources: ResourceItem[];
  updateResourceCondition: (resourceId: string, condition: ResourceCondition) => Promise<void>;
  updateResourceQuantity: (resourceId: string, total: number) => Promise<void>;

  // Reservations
  reservations: Reservation[];
  createReservation: (
    data: Omit<
      Reservation,
      "id" | "reservationCode" | "status" | "submittedAt" | "userId" | "userName" | "userRole" | "userEmail" | "department"
    >
  ) => Promise<{ success: boolean; conflict?: Reservation; reservationCode?: string }>;
  approveReservation: (reservationId: string, notes?: string) => Promise<void>;
  rejectReservation: (reservationId: string, reason: string) => Promise<void>;
  cancelReservation: (reservationId: string) => Promise<void>;

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
  ) => Reservation | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  // Core Data States
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [approvalLogs, setApprovalLogs] = useState<ApprovalLog[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // UI State
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [selectedFacilityId, setSelectedFacilityId] = useState<FacilityId | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [preselectedFacilityId, setPreselectedFacilityId] = useState<FacilityId | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);
  const [preselectedTime, setPreselectedTime] = useState<string | null>(null);
  const [selectedReservationForReview, setSelectedReservationForReview] = useState<Reservation | null>(null);

  // Active user (authenticated or fallback)
  const currentUser: User = auth.currentUser || DEFAULT_GUEST;

  // Fetch all data from Supabase
  const loadAppData = useCallback(async () => {
    try {
      const [facs, resrcs] = await Promise.all([
        db.fetchFacilities(),
        db.fetchResources(),
      ]);
      setFacilities(facs);
      setResources(resrcs);

      if (auth.isAuthenticated && auth.currentUser) {
        const [users, rsvps, logs, notifs] = await Promise.all([
          db.fetchAllUsers(),
          db.fetchReservations(),
          db.fetchApprovalLogs(),
          db.fetchNotifications(auth.currentUser.id, auth.currentUser.role),
        ]);
        setAllUsers(users);
        setReservations(rsvps);
        setApprovalLogs(logs);
        setNotifications(notifs);
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

  const logout = async () => {
    await auth.logout();
    setActiveTab("dashboard");
  };

  const switchRole = (role: UserRole) => {
    const targetUser = allUsers.find((u) => u.role === role);
    if (targetUser && auth.setCurrentUser) {
      auth.setCurrentUser(targetUser);
      auth.setAuthView("app");
      if (
        role !== "ADMINISTRATOR" &&
        (activeTab === "architecture" || activeTab === "reports" || activeTab === "users")
      ) {
        setActiveTab("dashboard");
      }
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!currentUser.id) return;
    await db.updateUserProfile(currentUser.id, data);
    if (auth.refreshCurrentUser) {
      await auth.refreshCurrentUser();
    }
    setAllUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...data } : u))
    );
  };

  const toggleUserStatus = async (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return;

    const nextStatus = await db.toggleUserStatus(userId, target.status);

    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
    );

    if (currentUser.id === userId && auth.setCurrentUser) {
      auth.setCurrentUser((prev) => (prev ? { ...prev, status: nextStatus } : prev));
    }

    const newLog: ApprovalLog = {
      id: `log-${Date.now()}`,
      reservationId: `user-${userId}`,
      reservationCode: target.studentOrEmployeeId,
      eventName: "User Access State Modified",
      facilityName: "Security & Role Access",
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: "USER_STATUS_CHANGE",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      notes: `User ${target.name} (${target.email}) account status changed to ${nextStatus}.`,
    };

    await db.supabase.from("approval_logs").insert({
      id: newLog.id,
      reservation_id: newLog.reservationId,
      reservation_code: newLog.reservationCode,
      event_name: newLog.eventName,
      facility_name: newLog.facilityName,
      actor_name: newLog.actorName,
      actor_role: newLog.actorRole,
      action: newLog.action,
      timestamp: new Date().toISOString(),
      notes: newLog.notes,
    });

    setApprovalLogs((l) => [newLog, ...l]);
  };

  // Facility Controls
  const updateFacilityStatus = async (facilityId: FacilityId, status: FacilityStatus) => {
    await db.updateFacilityStatus(facilityId, status);
    setFacilities((prev) =>
      prev.map((f) => (f.id === facilityId ? { ...f, status } : f))
    );

    const facility = facilities.find((f) => f.id === facilityId);
    const newLog: ApprovalLog = {
      id: `log-${Date.now()}`,
      reservationId: `facility-${facilityId}`,
      reservationCode: facility?.code || facilityId,
      eventName: "Facility Status Modification",
      facilityName: facility?.name || facilityId,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: "MAINTENANCE_TOGGLE",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      notes: `Status changed to ${status} by administrator.`,
    };

    await db.supabase.from("approval_logs").insert({
      id: newLog.id,
      reservation_id: newLog.reservationId,
      reservation_code: newLog.reservationCode,
      event_name: newLog.eventName,
      facility_name: newLog.facilityName,
      actor_name: newLog.actorName,
      actor_role: newLog.actorRole,
      action: newLog.action,
      timestamp: new Date().toISOString(),
      notes: newLog.notes,
    });

    setApprovalLogs((prev) => [newLog, ...prev]);
  };

  const updateFacilityCapacity = async (facilityId: FacilityId, capacity: number) => {
    await db.updateFacilityCapacity(facilityId, capacity);
    setFacilities((prev) =>
      prev.map((f) => (f.id === facilityId ? { ...f, capacity } : f))
    );
  };

  const updateFacilityDetails = async (facilityId: FacilityId, data: Partial<Facility>) => {
    await db.updateFacilityDetails(facilityId, data);
    setFacilities((prev) =>
      prev.map((f) => (f.id === facilityId ? { ...f, ...data } : f))
    );

    const facility = facilities.find((f) => f.id === facilityId);
    const newLog: ApprovalLog = {
      id: `log-${Date.now()}`,
      reservationId: `facility-${facilityId}`,
      reservationCode: data.code || facility?.code || facilityId,
      eventName: "Facility Specification Updated",
      facilityName: data.name || facility?.name || facilityId,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: "FACILITY_DETAILS_UPDATE",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      notes: `Facility specifications and media updated by administrator ${currentUser.name}.`,
    };

    await db.supabase.from("approval_logs").insert({
      id: newLog.id,
      reservation_id: newLog.reservationId,
      reservation_code: newLog.reservationCode,
      event_name: newLog.eventName,
      facility_name: newLog.facilityName,
      actor_name: newLog.actorName,
      actor_role: newLog.actorRole,
      action: newLog.action,
      timestamp: new Date().toISOString(),
      notes: newLog.notes,
    });

    setApprovalLogs((prev) => [newLog, ...prev]);

    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: "Facility Details Updated",
      message: `Specifications for ${data.name || facility?.name || facilityId} were updated by ${currentUser.name}.`,
      timestamp: "Just now",
      read: false,
      type: "FACILITY_UPDATE",
    };

    await db.supabase.from("notifications").insert({
      id: newNotif.id,
      user_id: currentUser.id,
      title: newNotif.title,
      message: newNotif.message,
      type: newNotif.type,
      timestamp: new Date().toISOString(),
      read: false,
    });

    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Resource Controls
  const updateResourceCondition = async (resourceId: string, condition: ResourceCondition) => {
    await db.updateResourceCondition(resourceId, condition);
    setResources((prev) =>
      prev.map((r) => (r.id === resourceId ? { ...r, condition } : r))
    );
  };

  const updateResourceQuantity = async (resourceId: string, totalQuantity: number) => {
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
  };

  // Conflict Checker
  const checkConflict = (
    facilityId: FacilityId,
    date: string,
    startTime: string,
    endTime: string,
    excludeReservationId?: string
  ): Reservation | null => {
    const conflict = reservations.find((r) =>
      db.checkTimeConflict(r, facilityId, date, startTime, endTime, excludeReservationId)
    );
    return conflict || null;
  };

  const createReservation = async (
    data: Omit<
      Reservation,
      "id" | "reservationCode" | "status" | "submittedAt" | "userId" | "userName" | "userRole" | "userEmail" | "department"
    >
  ) => {
    const res = await db.createReservationRecord(data, currentUser, reservations);
    if (!res.success) {
      return { success: false, conflict: res.conflict };
    }

    if (res.reservation) {
      setReservations((prev) => [res.reservation!, ...prev]);
    }
    // Refresh notifications & logs from DB
    const [logs, notifs] = await Promise.all([
      db.fetchApprovalLogs(),
      db.fetchNotifications(currentUser.id, currentUser.role),
    ]);
    setApprovalLogs(logs);
    setNotifications(notifs);

    return { success: true, reservationCode: res.reservationCode };
  };

  const approveReservation = async (reservationId: string, notes?: string) => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) return;

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

    const [logs, notifs] = await Promise.all([
      db.fetchApprovalLogs(),
      db.fetchNotifications(currentUser.id, currentUser.role),
    ]);
    setApprovalLogs(logs);
    setNotifications(notifs);
  };

  const rejectReservation = async (reservationId: string, reason: string) => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) return;

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

    const [logs, notifs] = await Promise.all([
      db.fetchApprovalLogs(),
      db.fetchNotifications(currentUser.id, currentUser.role),
    ]);
    setApprovalLogs(logs);
    setNotifications(notifs);
  };

  const cancelReservation = async (reservationId: string) => {
    await db.cancelReservationRecord(reservationId);
    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: "CANCELLED" } : r))
    );
  };

  const markNotificationAsRead = async (id: string) => {
    await db.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser.id) return;
    await db.markAllNotificationsAsRead(currentUser.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(
      (n) => !n.read && (n.userId === currentUser.id || n.userId === "all")
    ).length;
  }, [notifications, currentUser.id]);

  const openBookingModal = (facilityId?: FacilityId, date?: string, time?: string) => {
    if (facilityId) {
      setPreselectedFacilityId(facilityId);
    } else {
      setPreselectedFacilityId(null);
    }
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
        authView: auth.authView,
        setAuthView: auth.setAuthView,
        currentUser,
        allUsers,
        login,
        register,
        resetPassword,
        logout,
        switchRole,
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
