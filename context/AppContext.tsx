"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import {
  User,
  UserRole,
  Facility,
  FacilityId,
  FacilityStatus,
  ResourceItem,
  Reservation,
  ReservationStatus,
  ApprovalLog,
  SystemNotification,
  ResourceCondition,
  AuthView,
} from "../types";
import {
  MOCK_USERS,
  INITIAL_FACILITIES,
  INITIAL_RESOURCES,
  INITIAL_RESERVATIONS,
  INITIAL_APPROVAL_LOGS,
  INITIAL_NOTIFICATIONS,
} from "../data/mockData";

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

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  department: string;
  password: string;
  role: "STUDENT" | "FACULTY";
}

interface AppContextType {
  // Authentication & Users
  isAuthenticated: boolean;
  authView: AuthView;
  setAuthView: (view: AuthView) => void;
  currentUser: User;
  allUsers: User[];
  login: (email: string, password: string) => { success: boolean; error?: string; role?: UserRole };
  register: (payload: RegisterPayload) => { success: boolean; error?: string };
  resetPassword: (email: string, newPassword: string) => { success: boolean; error?: string };
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateUserProfile: (data: Partial<User>) => void;
  toggleUserStatus: (userId: string) => void;

  // Facilities
  facilities: Facility[];
  updateFacilityStatus: (facilityId: FacilityId, status: FacilityStatus) => void;
  updateFacilityCapacity: (facilityId: FacilityId, capacity: number) => void;
  updateFacilityDetails: (facilityId: FacilityId, data: Partial<Facility>) => void;

  // Resources
  resources: ResourceItem[];
  updateResourceCondition: (resourceId: string, condition: ResourceCondition) => void;
  updateResourceQuantity: (resourceId: string, total: number) => void;

  // Reservations
  reservations: Reservation[];
  createReservation: (
    data: Omit<
      Reservation,
      "id" | "reservationCode" | "status" | "submittedAt" | "userId" | "userName" | "userRole" | "userEmail" | "department"
    >
  ) => { success: boolean; conflict?: Reservation; reservationCode?: string };
  approveReservation: (reservationId: string, notes?: string) => void;
  rejectReservation: (reservationId: string, reason: string) => void;
  cancelReservation: (reservationId: string) => void;

  // Logs & Notifications
  approvalLogs: ApprovalLog[];
  notifications: SystemNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
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
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authView, setAuthView] = useState<AuthView>("landing");
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);

  // Core Data
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [resources, setResources] = useState<ResourceItem[]>(INITIAL_RESOURCES);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [approvalLogs, setApprovalLogs] = useState<ApprovalLog[]>(INITIAL_APPROVAL_LOGS);
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);

  // UI State
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [selectedFacilityId, setSelectedFacilityId] = useState<FacilityId | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [preselectedFacilityId, setPreselectedFacilityId] = useState<FacilityId | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<string | null>(null);
  const [preselectedTime, setPreselectedTime] = useState<string | null>(null);
  const [selectedReservationForReview, setSelectedReservationForReview] = useState<Reservation | null>(null);

  // Authentication Handlers
  const login = (email: string, password: string) => {
    const user = allUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return { success: false, error: "Invalid credentials. User with this email does not exist." };
    }
    if (user.password && user.password !== password) {
      return { success: false, error: "Incorrect password. Please try again." };
    }
    if (user.status === "DEACTIVATED") {
      return { success: false, error: "Account suspended. Please contact the Facility Administrator." };
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    setAuthView("app");
    setActiveTab("dashboard");
    return { success: true, role: user.role };
  };

  const register = (payload: RegisterPayload) => {
    // Duplicate account prevention
    const exists = allUsers.some((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase());
    if (exists) {
      return { success: false, error: "An account with this institutional email already exists." };
    }

    const newId = `usr-${payload.role.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const studentOrEmployeeId =
      payload.role === "STUDENT"
        ? `2026-${Math.floor(10000 + Math.random() * 90000)}`
        : `FAC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: User = {
      id: newId,
      name: `${payload.firstName} ${payload.lastName}`,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email.trim(),
      password: payload.password,
      contactNumber: payload.contactNumber,
      department: payload.department,
      role: payload.role,
      studentOrEmployeeId,
      status: "ACTIVE",
      createdAt: new Date().toISOString().split("T")[0],
    };

    setAllUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setAuthView("app");
    setActiveTab("dashboard");

    // Welcome Notification
    const notif: SystemNotification = {
      id: `notif-${Date.now()}`,
      userId: newUser.id,
      title: "Welcome to UniSpace",
      message: `Your account as a ${payload.role === "STUDENT" ? "Student" : "Faculty Member"} is verified and active.`,
      type: "ACCOUNT_SECURITY",
      timestamp: "Just now",
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);

    return { success: true };
  };

  const resetPassword = (email: string, newPassword: string) => {
    const userIndex = allUsers.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (userIndex === -1) {
      return { success: false, error: "No account registered with this email address." };
    }

    setAllUsers((prev) =>
      prev.map((u, idx) => (idx === userIndex ? { ...u, password: newPassword } : u))
    );

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAuthView("landing");
  };

  const switchRole = (role: UserRole) => {
    const targetUser = allUsers.find((u) => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      setIsAuthenticated(true);
      setAuthView("app");
      if (
        role !== "ADMINISTRATOR" &&
        (activeTab === "architecture" || activeTab === "reports" || activeTab === "users")
      ) {
        setActiveTab("dashboard");
      }
    }
  };

  const updateUserProfile = (data: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...data }));
    setAllUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...data } : u))
    );
  };

  const toggleUserStatus = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
          // If currentUser is being toggled, update as well
          if (currentUser.id === userId) {
            setCurrentUser((c) => ({ ...c, status: nextStatus }));
          }

          const newLog: ApprovalLog = {
            id: `log-${Date.now()}`,
            reservationId: `user-${userId}`,
            reservationCode: u.studentOrEmployeeId,
            eventName: "User Access State Modified",
            facilityName: "Security & Role Access",
            actorName: currentUser.name,
            actorRole: currentUser.role,
            action: "USER_STATUS_CHANGE",
            timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
            notes: `User ${u.name} (${u.email}) account status changed to ${nextStatus}.`,
          };
          setApprovalLogs((l) => [newLog, ...l]);

          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  // Facility Controls
  const updateFacilityStatus = (facilityId: FacilityId, status: FacilityStatus) => {
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
    setApprovalLogs((prev) => [newLog, ...prev]);
  };

  const updateFacilityCapacity = (facilityId: FacilityId, capacity: number) => {
    setFacilities((prev) =>
      prev.map((f) => (f.id === facilityId ? { ...f, capacity } : f))
    );
  };

  const updateFacilityDetails = (facilityId: FacilityId, data: Partial<Facility>) => {
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
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Resource Controls
  const updateResourceCondition = (resourceId: string, condition: ResourceCondition) => {
    setResources((prev) =>
      prev.map((r) => (r.id === resourceId ? { ...r, condition } : r))
    );
  };

  const updateResourceQuantity = (resourceId: string, totalQuantity: number) => {
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
    const conflict = reservations.find((r) => {
      if (r.id === excludeReservationId) return false;
      if (r.facilityId !== facilityId) return false;
      if (r.date !== date) return false;
      if (r.status === "REJECTED" || r.status === "CANCELLED") return false;

      const startMinutes = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
      };

      const newStart = startMinutes(startTime);
      const newEnd = startMinutes(endTime);
      const existingStart = startMinutes(r.startTime);
      const existingEnd = startMinutes(r.endTime);

      return newStart < existingEnd && newEnd > existingStart;
    });

    return conflict || null;
  };

  const createReservation = (
    data: Omit<
      Reservation,
      "id" | "reservationCode" | "status" | "submittedAt" | "userId" | "userName" | "userRole" | "userEmail" | "department"
    >
  ) => {
    const conflict = checkConflict(data.facilityId, data.date, data.startTime, data.endTime);
    if (conflict) {
      return { success: false, conflict };
    }

    const newCode = `US-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReservation: Reservation = {
      ...data,
      id: `res-${Date.now()}`,
      reservationCode: newCode,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      userEmail: currentUser.email,
      department: currentUser.department,
      status: "PENDING",
      submittedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    setReservations((prev) => [newReservation, ...prev]);

    const newLog: ApprovalLog = {
      id: `log-${Date.now()}`,
      reservationId: newReservation.id,
      reservationCode: newCode,
      eventName: data.eventName,
      facilityName: data.facilityName,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: "SUBMITTED",
      timestamp: newReservation.submittedAt,
      notes: "Reservation submitted and queued for administrator schedule review.",
    };
    setApprovalLogs((prev) => [newLog, ...prev]);

    const userNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: `Reservation Submitted: ${data.facilityName}`,
      message: `Your booking request ${newCode} for "${data.eventName}" has been logged and is pending review.`,
      type: "RESERVATION_SUBMITTED",
      timestamp: "Just now",
      read: false,
      reservationId: newReservation.id,
    };

    const adminNotif: SystemNotification = {
      id: `notif-adm-${Date.now()}`,
      userId: "usr-admin-01",
      title: `New Reservation Request: ${data.facilityName}`,
      message: `${currentUser.name} (${currentUser.role}) requested ${data.facilityName} for "${data.eventName}" on ${data.date}.`,
      type: "RESERVATION_SUBMITTED",
      timestamp: "Just now",
      read: false,
      reservationId: newReservation.id,
    };

    setNotifications((prev) => [userNotif, adminNotif, ...prev]);

    return { success: true, reservationCode: newCode };
  };

  const approveReservation = (reservationId: string, notes?: string) => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) return;

    const reviewedAt = new Date().toISOString().replace("T", " ").substring(0, 16);

    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? {
              ...r,
              status: "APPROVED",
              reviewedAt,
              reviewedBy: currentUser.name,
              adminNotes: notes || "Approved by facility administrator.",
            }
          : r
      )
    );

    const newLog: ApprovalLog = {
      id: `log-${Date.now()}`,
      reservationId: target.id,
      reservationCode: target.reservationCode,
      eventName: target.eventName,
      facilityName: target.facilityName,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: "APPROVED",
      timestamp: reviewedAt,
      notes: notes || "Approved after facility and resource verification.",
    };
    setApprovalLogs((prev) => [newLog, ...prev]);

    const notif: SystemNotification = {
      id: `notif-${Date.now()}`,
      userId: target.userId,
      title: `Reservation Approved: ${target.facilityName}`,
      message: `Your booking request ${target.reservationCode} for "${target.eventName}" on ${target.date} has been approved.`,
      type: "RESERVATION_APPROVED",
      timestamp: "Just now",
      read: false,
      reservationId: target.id,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const rejectReservation = (reservationId: string, reason: string) => {
    const target = reservations.find((r) => r.id === reservationId);
    if (!target) return;

    const reviewedAt = new Date().toISOString().replace("T", " ").substring(0, 16);

    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? {
              ...r,
              status: "REJECTED",
              reviewedAt,
              reviewedBy: currentUser.name,
              rejectionReason: reason,
            }
          : r
      )
    );

    const newLog: ApprovalLog = {
      id: `log-${Date.now()}`,
      reservationId: target.id,
      reservationCode: target.reservationCode,
      eventName: target.eventName,
      facilityName: target.facilityName,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action: "REJECTED",
      timestamp: reviewedAt,
      notes: `Rejected with reason: ${reason}`,
    };
    setApprovalLogs((prev) => [newLog, ...prev]);

    const notif: SystemNotification = {
      id: `notif-${Date.now()}`,
      userId: target.userId,
      title: `Reservation Rejected: ${target.facilityName}`,
      message: `Your booking request ${target.reservationCode} for "${target.eventName}" was declined. Reason: ${reason}`,
      type: "RESERVATION_REJECTED",
      timestamp: "Just now",
      read: false,
      reservationId: target.id,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const cancelReservation = (reservationId: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: "CANCELLED" } : r))
    );
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
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
        isAuthenticated,
        authView,
        setAuthView,
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
