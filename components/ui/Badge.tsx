import React from "react";
import { FacilityStatus, ReservationStatus, UserRole } from "../../types";

interface StatusBadgeProps {
  status: FacilityStatus | ReservationStatus | "CONFLICT";
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  let colorClasses = "";
  let label = status as string;

  switch (status) {
    case "AVAILABLE":
    case "APPROVED":
      colorClasses =
        "bg-emerald-50 text-emerald-800 border-emerald-300/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
      label = status === "AVAILABLE" ? "Available" : "Approved";
      break;
    case "PENDING":
      colorClasses =
        "bg-amber-50 text-amber-800 border-amber-300/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
      label = "Pending Review";
      break;
    case "REJECTED":
    case "CONFLICT":
      colorClasses =
        "bg-rose-50 text-rose-800 border-rose-300/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
      label = status === "CONFLICT" ? "Schedule Conflict" : "Rejected";
      break;
    case "MAINTENANCE":
    case "CANCELLED":
      colorClasses =
        "bg-zinc-100 text-zinc-700 border-zinc-300/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700";
      label = status === "MAINTENANCE" ? "Maintenance" : "Cancelled";
      break;
    case "BOOKED":
      colorClasses =
        "bg-sky-50 text-sky-800 border-sky-300/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
      label = "Occupied";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "AVAILABLE" || status === "APPROVED"
            ? "bg-emerald-600 dark:bg-emerald-400"
            : status === "PENDING"
            ? "bg-amber-600 dark:bg-amber-400"
            : status === "REJECTED" || status === "CONFLICT"
            ? "bg-rose-600 dark:bg-rose-400"
            : status === "BOOKED"
            ? "bg-sky-600 dark:bg-sky-400"
            : "bg-zinc-500"
        }`}
      />
      {label}
    </span>
  );
}

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  let color = "";
  let label = "";

  switch (role) {
    case "STUDENT":
      color = "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
      label = "Student";
      break;
    case "FACULTY":
      color = "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
      label = "Faculty Member";
      break;
    case "ADMINISTRATOR":
      color = "bg-emerald-900 text-emerald-100 border-emerald-950 dark:bg-emerald-800 dark:text-emerald-50 dark:border-emerald-700";
      label = "Facility Administrator";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase border ${color} ${className}`}
    >
      {label}
    </span>
  );
}
