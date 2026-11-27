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
  NavTab,
} from "../types";
import { useAuth, RegisterPayload } from "./AuthContext";
import * as db from "../lib/supabase-data";
import {
  canAccessTab,
  hasPermission,
  isValidNavTab,
  ROLE_SHORT_LABELS,
  validateReservationLeadTime,
} from "../lib/rbac";

export type { NavTab };

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
  updateUserRole: (userId: string, role: UserRole) => Promise<ActionResult>;

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
  createResource: (data: Omit<ResourceItem, "id">) => Promise<ActionResult>;
  updateResource: (
    resourceId: string,
    data: Partial<Omit<ResourceItem, "id">>
  ) => Promise<ActionResult>;
  deleteResource: (resourceId: string) => Promise<ActionResult>;
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
  updateReservation: (
    reservationId: string,
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
  deleteReservation: (reservationId: string) => Promise<ActionResult>;
  approveReservation: (reservationId: string, notes?: string) => Promise<ActionResult>;
  rejectReservation: (reservationId: string, reason: string) => Promise<ActionResult>;
  cancelReservation: (reservationId: string) => Promise<ActionResult>;

  // Logs & Notifications
  approvalLogs: ApprovalLog[];
  notifications: SystemNotification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<ActionResult>;
  clearReadNotifications: () => Promise<ActionResult>;
  unreadNotificationsCount: number;

  // Navigation & Modals
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedFacilityId: FacilityId | null;
  setSelectedFacilityId: (id: FacilityId | null) => void;
  isBookingModalOpen: boolean;
  editingReservation: Reservation | null;
  preselectedFacilityId: FacilityId | null;
  preselectedDate: string | null;
  preselectedTime: string | null;
  openBookingModal: (facilityId?: FacilityId, date?: string, time?: string) => void;
  openEditBookingModal: (reservation: Reservation) => void;
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

  // UI State with URL ?tab= synchronization
  const [activeTab, setActiveTabState] = useState<NavTab>(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("tab");
      if (isValidNavTab(param)) return param;
    }
    return "dashboard";
  });
  const [selectedFacilityId, setSelectedFacilityId] = useState<FacilityId | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [preselectedFacilityId, setPreselectedFacilityId] = useState<FacilityId | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);
  const [preselectedTime, setPreselectedTime] = useState<string | null>(null);
  const [selectedReservationForReview, setSelectedReservationForReview] =
    useState<Reservation | null>(null);

  const currentUser: User = auth.currentUser || DEFAULT_GUEST;

  const setActiveTab = useCallback(
    (tab: NavTab) => {
      const targetTab: NavTab = canAccessTab(currentUser.role, tab) ? tab : "dashboard";
      setActiveTabState(targetTab);
      if (typeof window === "undefined" || !auth.isAuthenticated) return;

      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      if (targetTab === "dashboard") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", targetTab);
      }
      const nextUrl = `${url.pathname}${url.search}${window.location.hash}`;
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
        window.history.pushState(null, "", nextUrl);
      }
    },
    [currentUser.role, auth.isAuthenticated]
  );

  // Enforce RBAC on activeTab after user role loads & sync browser Back/Forward
  useEffect(() => {
    if (typeof window === "undefined" || !auth.isAuthenticated || !auth.currentUser) return;

    const url = new URL(window.location.href);
    const param = url.searchParams.get("tab");
    const resolvedTab: NavTab =
      isValidNavTab(param) && canAccessTab(auth.currentUser.role, param)
        ? param
        : canAccessTab(auth.currentUser.role, activeTab)
        ? activeTab
        : "dashboard";

    if (resolvedTab !== activeTab) {
      setActiveTabState(resolvedTab);
    }

    if (resolvedTab === "dashboard") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", resolvedTab);
    }
    url.searchParams.delete("auth");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${window.location.hash}`);

    const handlePopState = () => {
      const nextParam = new URLSearchParams(window.location.search).get("tab");
      if (isValidNavTab(nextParam) && canAccessTab(auth.currentUser!.role, nextParam)) {
        setActiveTabState(nextParam);
      } else {
        setActiveTabState("dashboard");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [auth.isAuthenticated, auth.currentUser, activeTab]);

  // Fetch all data from Supabase
  const loadAppData = useCallback(async () => {
    try {
      const facs = await db.fetchFacilities();
      setFacilities(facs);

      if (auth.isAuthenticated && auth.currentUser) {
        const canManageUsers = hasPermission(auth.currentUser.role, "USERS_MANAGE");
        const [resrcs, users, rsvps, slots, logs, notifs] = await Promise.all([
          db.fetchResources(),
          canManageUsers ? db.fetchAllUsers() : Promise.resolve([]),
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
    setActiveTabState("dashboard");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
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
    if (!hasPermission(currentUser.role, "USERS_MANAGE")) {
      return { success: false, error: "Forbidden: Administrator privileges required." };
    }
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return { success: false, error: "User not found." };
    if (userId === currentUser.id) {
      return { success: false, error: "Administrators cannot deactivate their own account." };
    }

    try {
      const nextStatus = await db.toggleUserStatus(userId, target.status);

      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
      );

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

  const updateUserRole = async (userId: string, role: UserRole): Promise<ActionResult> => {
    if (!hasPermission(currentUser.role, "USERS_MANAGE")) {
      return { success: false, error: "Forbidden: Administrator privileges required." };
    }
    if (userId === currentUser.id) {
      return { success: false, error: "Administrators cannot change or demote their own role." };
    }
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return { success: false, error: "User not found." };
    if (target.role === role) return { success: true };

    try {
      await db.updateUserRole(userId, role);

      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );

      const newLog = await db.insertApprovalLog({
        reservationId: `user-${userId}`,
        reservationCode: target.studentOrEmployeeId,
        eventName: "User Role Assignment Changed",
        facilityName: "Security & Role Access",
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: "USER_ROLE_CHANGE",
        timestamp: new Date().toISOString(),
        notes: `User ${target.name} (${target.email}) role updated from ${ROLE_SHORT_LABELS[target.role]} to ${ROLE_SHORT_LABELS[role]}.`,
      });
      setApprovalLogs((l) => [newLog, ...l]);

      await db.insertNotification({
        userId,
        title: "Institutional Role Updated",
        message: `Your UniSpace access role was updated to ${ROLE_SHORT_LABELS[role]} by ${currentUser.name}.`,
        type: "ACCOUNT_SECURITY",
        timestamp: new Date().toISOString(),
        read: false,
      }).catch(() => {});

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update user role." };
    }
  };

  // Facility Controls
  const updateFacilityStatus = async (
    facilityId: FacilityId,
    status: FacilityStatus
  ): Promise<ActionResult> => {
    if (!hasPermission(currentUser.role, "FACILITY_MANAGE")) {
      return { success: false, error: "Forbidden: Administrator privileges required." };
    }
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
    if (!hasPermission(currentUser.role, "FACILITY_MANAGE")) {
      return { success: false, error: "Forbidden: Administrator privileges required." };
    }
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
    if (!hasPermission(currentUser.role, "FACILITY_MANAGE")) {
      return { success: false, error: "Forbidden: Administrator privileges required." };
    }
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

  // Resource Controls (Full CRUD)
  const createResource = async (
    data: Omit<ResourceItem, "id">
  ): Promise<ActionResult> => {
    if (!hasPermission(currentUser.role, "RESOURCE_MANAGE")) {
      return { success: false, error: "Forbidden: Administrator privileges required." };
    }
    try {
      const created = await db.createResource(data);
      setResources((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );

      const newLog = await db.insertApprovalLog({
        reservationId: created.id,
        reservationCode: created.category,
        eventName: `Equipment Added: ${created.name}`,
        facilityName:
          created.facilityScope === "CAMPUS_WIDE"
            ? "Campus-Wide Warehouse"
            : created.facilityScope,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: "RESOURCE_CREATED",
        timestamp: new Date().toISOString(),
        notes: `Created ${created.name} (${created.availableQuantity}/${created.totalQuantity} ${created.unit}, ${created.condition}).`,
      });
      setApprovalLogs((prev) => [newLog, ...prev]);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to add equipment item." };
    }
  };

  const updateResource = async (
    resourceId: string,
    data: Partial<Omit<ResourceItem, "id">>
  ): Promise<ActionResult> => {
    if (!hasPermission(currentUser.role, "RESOURCE_MANAGE")) {
      return { success: false, error: "Forbidden: Administrator privileges required." };
    }
    try {
      await db.updateResource(resourceId, data);
      setResources((prev) =>
        prev
          .map((r) => {
            if (r.id !== resourceId) return r;
            const nextTotal =
              data.totalQuantity !== undefined ? data.totalQuantity : r.totalQuantity;
            const nextAvailable =
              data.availableQuantity !== undefined
                ? Math.min(data.availableQuantity, nextTotal)
                : Math.min(r.availableQuantity, nextTotal);
            return {
              ...r,
              ...data,
              totalQuantity: nextTotal,
              availableQuantity: nextAvailable,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update equipment details." };
    }
  };

  const deleteResource = async (resourceId: string): Promise<ActionResult> => {
    if (!hasPermission(currentUser.role, "RESOURCE_MANAGE")) {
      return { success: false, error: "Forbidden: Administrator privileges required." };
    }
    const target = resources.find((r) => r.id === resourceId);
    try {
      await db.deleteResource(resourceId);
      setResources((prev) => prev.filter((r) => r.id !== resourceId));

      if (target) {
        const newLog = await db.insertApprovalLog({
          reservationId: resourceId,
          reservationCode: target.category,
          eventName: `Equipment Deleted: ${target.name}`,
          facilityName: "Campus-Wide Warehouse",
          actorName: currentUser.name,
          actorRole: currentUser.role,
          action: "RESOURCE_DELETED",
          timestamp: new Date().toISOString(),
          notes: `Removed ${target.name} from active inventory catalog.`,
        });
        setApprovalLogs((prev) => [newLog, ...prev]);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to delete equipment item." };
    }
  };

  const updateResourceCondition = async (
    resourceId: string,
    condition: ResourceCondition
  ): Promise<ActionResult> => {
    if (!hasPermission(currentUser.role, "RESOURCE_MANAGE")) {
      return { success: false, error: "Forbidden: Administrator privileges required." };
    }
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
    if (!hasPermission(currentUser.role, "RESOURCE_MANAGE")) {
      return { success: false, error: "Forbidden: Administrator privileges required." };
    }
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
      const leadCheck = validateReservationLeadTime(currentUser.role, data.date);
      if (!leadCheck.valid) {
        return { success: false, error: leadCheck.message };
      }

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
    if (!hasPermission(currentUser.role, "RESERVATION_APPROVE")) {
      return { success: false, error: "Forbidden: Only Facility Administrators can approve reservations." };
    }
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
    if (!hasPermission(currentUser.role, "RESERVATION_APPROVE")) {
      return { success: false, error: "Forbidden: Only Facility Administrators can reject reservations." };
    }
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

  const updateReservation = async (
    reservationId: string,
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
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) {
      return { success: false, error: "Reservation record not found." };
    }
    const isAdmin = hasPermission(currentUser.role, "RESERVATION_APPROVE");
    if (!isAdmin && target.userId !== currentUser.id) {
      return { success: false, error: "Forbidden: You can only edit your own reservations." };
    }
    if (target.status !== "PENDING") {
      return { success: false, error: "Only pending reservations can be edited." };
    }

    try {
      const leadCheck = validateReservationLeadTime(currentUser.role, data.date);
      if (!leadCheck.valid) {
        return { success: false, error: leadCheck.message };
      }

      const latestSlots = await db.fetchFacilitySchedule();
      setScheduleSlots(latestSlots);

      const res = await db.updateReservationRecord(
        target,
        data,
        currentUser,
        latestSlots
      );
      if (!res.success) {
        return { success: false, conflict: res.conflict };
      }

      if (res.reservation) {
        setReservations((prev) =>
          prev.map((r) => (r.id === reservationId ? res.reservation! : r))
        );
      }

      const [slots, logs] = await Promise.all([
        db.fetchFacilitySchedule(),
        db.fetchApprovalLogs(),
      ]);
      setScheduleSlots(slots);
      setApprovalLogs(logs);

      return { success: true, reservationCode: target.reservationCode };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to update reservation request.",
      };
    }
  };

  const deleteReservation = async (reservationId: string): Promise<ActionResult> => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) {
      return { success: false, error: "Reservation record not found." };
    }
    const isAdmin = hasPermission(currentUser.role, "RESERVATION_APPROVE");
    if (!isAdmin) {
      if (target.userId !== currentUser.id) {
        return { success: false, error: "Forbidden: You can only delete your own reservations." };
      }
      if (target.status === "APPROVED") {
        return {
          success: false,
          error: "Approved bookings cannot be deleted by requesters. Contact an Administrator.",
        };
      }
    }

    try {
      await db.deleteReservationRecord(reservationId);
      setReservations((prev) => prev.filter((r) => r.id !== reservationId));
      setScheduleSlots((prev) => prev.filter((s) => s.id !== reservationId));
      if (selectedReservationForReview?.id === reservationId) {
        setSelectedReservationForReview(null);
      }

      if (isAdmin) {
        const newLog = await db
          .insertApprovalLog({
            reservationId,
            reservationCode: target.reservationCode,
            eventName: target.eventName,
            facilityName: target.facilityName,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            action: "RESERVATION_DELETED",
            timestamp: new Date().toISOString(),
            notes: `Reservation ${target.reservationCode} (${target.status}) deleted by administrator.`,
          })
          .catch(() => null);
        if (newLog) setApprovalLogs((prev) => [newLog, ...prev]);
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to delete reservation.",
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

  const deleteNotification = async (id: string): Promise<ActionResult> => {
    if (!currentUser.id || currentUser.id === "guest") {
      return { success: false, error: "Not authenticated." };
    }
    const target = notifications.find((n) => n.id === id);
    if (!target) return { success: false, error: "Notification not found." };

    try {
      await db.deleteNotificationRecord(target, currentUser.id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to delete notification." };
    }
  };

  const clearReadNotifications = async (): Promise<ActionResult> => {
    if (!currentUser.id || currentUser.id === "guest") {
      return { success: false, error: "Not authenticated." };
    }
    const readItems = notifications.filter((n) => n.read);
    if (readItems.length === 0) return { success: true };

    try {
      await db.clearReadNotifications(currentUser.id, readItems);
      setNotifications((prev) => prev.filter((n) => !n.read));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to clear notifications." };
    }
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const openBookingModal = (facilityId?: FacilityId, date?: string, time?: string) => {
    setEditingReservation(null);
    setPreselectedFacilityId(facilityId || null);
    setPreselectedDate(date || null);
    setPreselectedTime(time || null);
    setIsBookingModalOpen(true);
  };

  const openEditBookingModal = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setPreselectedFacilityId(reservation.facilityId);
    setPreselectedDate(reservation.date);
    setPreselectedTime(reservation.startTime);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setEditingReservation(null);
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
        updateUserRole,
        facilities,
        updateFacilityStatus,
        updateFacilityCapacity,
        updateFacilityDetails,
        resources,
        createResource,
        updateResource,
        deleteResource,
        updateResourceCondition,
        updateResourceQuantity,
        reservations,
        scheduleSlots,
        createReservation,
        updateReservation,
        deleteReservation,
        approveReservation,
        rejectReservation,
        cancelReservation,
        approvalLogs,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearReadNotifications,
        unreadNotificationsCount,
        activeTab,
        setActiveTab,
        selectedFacilityId,
        setSelectedFacilityId,
        isBookingModalOpen,
        editingReservation,
        preselectedFacilityId,
        preselectedDate,
        preselectedTime,
        openBookingModal,
        openEditBookingModal,
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
