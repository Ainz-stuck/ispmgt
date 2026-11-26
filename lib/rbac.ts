import { NavTab, UserRole } from "../types";
import { getLocalYMD } from "./utils";

export type Permission =
  | "FACILITY_BROWSE"
  | "FACILITY_MANAGE"
  | "RESOURCE_BROWSE"
  | "RESOURCE_MANAGE"
  | "RESERVATION_CREATE"
  | "RESERVATION_VIEW_ALL"
  | "RESERVATION_APPROVE"
  | "RESERVATION_BYPASS_LEAD_TIME"
  | "RESERVATION_PRIORITY_QUEUE"
  | "REPORTS_VIEW"
  | "USERS_MANAGE"
  | "AUDIT_LOGS_VIEW";

export const CHMSU_EMAIL_DOMAIN = "@chmsu.edu.ph";
export const STUDENT_MIN_LEAD_DAYS = 3;

export const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: "Student",
  FACULTY: "Faculty & Staff",
  ADMINISTRATOR: "Facility Administrator",
};

export const ROLE_SHORT_LABELS: Record<UserRole, string> = {
  STUDENT: "Student",
  FACULTY: "Faculty & Staff",
  ADMINISTRATOR: "Administrator",
};

export const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  STUDENT: new Set<Permission>([
    "FACILITY_BROWSE",
    "RESOURCE_BROWSE",
    "RESERVATION_CREATE",
  ]),
  FACULTY: new Set<Permission>([
    "FACILITY_BROWSE",
    "RESOURCE_BROWSE",
    "RESERVATION_CREATE",
    "RESERVATION_BYPASS_LEAD_TIME",
    "RESERVATION_PRIORITY_QUEUE",
  ]),
  ADMINISTRATOR: new Set<Permission>([
    "FACILITY_BROWSE",
    "FACILITY_MANAGE",
    "RESOURCE_BROWSE",
    "RESOURCE_MANAGE",
    "RESERVATION_CREATE",
    "RESERVATION_VIEW_ALL",
    "RESERVATION_APPROVE",
    "RESERVATION_BYPASS_LEAD_TIME",
    "REPORTS_VIEW",
    "USERS_MANAGE",
    "AUDIT_LOGS_VIEW",
  ]),
};

export const TAB_PERMISSIONS: Record<NavTab, Permission | null> = {
  dashboard: null,
  facilities: "FACILITY_BROWSE",
  calendar: "FACILITY_BROWSE",
  reservations: "RESERVATION_CREATE",
  resources: "RESOURCE_BROWSE",
  notifications: null,
  reports: "REPORTS_VIEW",
  users: "USERS_MANAGE",
  profile: null,
  "audit-logs": "AUDIT_LOGS_VIEW",
};

export const VALID_TABS: readonly NavTab[] = [
  "dashboard",
  "facilities",
  "calendar",
  "reservations",
  "resources",
  "notifications",
  "reports",
  "users",
  "profile",
  "audit-logs",
];

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function canAccessTab(role: UserRole | undefined, tab: NavTab): boolean {
  if (!role) return false;
  const required = TAB_PERMISSIONS[tab];
  if (!required) return true;
  return hasPermission(role, required);
}

export function isValidNavTab(value: string | null): value is NavTab {
  return value !== null && (VALID_TABS as readonly string[]).includes(value);
}

export function isInstitutionalRegistrationEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const atIdx = normalized.indexOf("@");
  if (atIdx <= 0) return false;
  return normalized.endsWith(CHMSU_EMAIL_DOMAIN) && normalized.length > CHMSU_EMAIL_DOMAIN.length + 1;
}

export function getMinReservationDate(role: UserRole | undefined, baseDate: Date = new Date()): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  if (!hasPermission(role, "RESERVATION_BYPASS_LEAD_TIME")) {
    d.setDate(d.getDate() + STUDENT_MIN_LEAD_DAYS);
  }
  return getLocalYMD(d);
}

export function validateReservationLeadTime(
  role: UserRole | undefined,
  dateStr: string,
  baseDate: Date = new Date()
): { valid: boolean; minDate: string; message?: string } {
  const minDate = getMinReservationDate(role, baseDate);
  if (!dateStr) {
    return { valid: false, minDate, message: "Please select a reservation date." };
  }
  if (dateStr < minDate) {
    if (!hasPermission(role, "RESERVATION_BYPASS_LEAD_TIME")) {
      return {
        valid: false,
        minDate,
        message: `Student reservations require at least ${STUDENT_MIN_LEAD_DAYS} days advance notice (earliest allowed: ${minDate}).`,
      };
    }
    return {
      valid: false,
      minDate,
      message: `Reservation date cannot be in the past (earliest allowed: ${minDate}).`,
    };
  }
  return { valid: true, minDate };
}

export function getRoleQueuePriority(role: UserRole): number {
  switch (role) {
    case "FACULTY":
      return 0;
    case "ADMINISTRATOR":
      return 1;
    case "STUDENT":
    default:
      return 2;
  }
}
