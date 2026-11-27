"use client";

import React, { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { hasPermission, ROLE_SHORT_LABELS } from "../../lib/rbac";
import { escapeCsvCell } from "../../lib/utils";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { RoleBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  ShieldCheck,
  MagnifyingGlass,
  DownloadSimple,
  Clock,
  ClipboardText,
} from "@phosphor-icons/react";

const ACTION_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RESERVATION_UPDATED: "Booking Edited",
  RESERVATION_DELETED: "Booking Deleted",
  STATUS_OVERRIDE: "Status Override",
  MAINTENANCE_TOGGLE: "Facility Status",
  RESOURCE_CREATED: "Equipment Added",
  RESOURCE_DELETED: "Equipment Deleted",
  FACILITY_DETAILS_UPDATE: "Facility Edit",
  USER_STATUS_CHANGE: "Account Status",
  USER_ROLE_CHANGE: "Role Assignment",
};

export function AuditLogsView() {
  const { currentUser, approvalLogs, setActiveTab } = useApp();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const canViewAuditLogs = hasPermission(currentUser.role, "AUDIT_LOGS_VIEW");

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return approvalLogs.filter((log) => {
      if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
      if (roleFilter !== "ALL" && log.actorRole !== roleFilter) return false;
      if (!q) return true;
      return (
        log.eventName.toLowerCase().includes(q) ||
        log.facilityName.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        log.reservationCode.toLowerCase().includes(q) ||
        log.notes.toLowerCase().includes(q)
      );
    });
  }, [approvalLogs, search, actionFilter, roleFilter]);

  if (!canViewAuditLogs) {
    return (
      <div className="min-h-[380px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 my-8">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center ring-1 ring-rose-500/20">
          <ShieldCheck size={28} weight="bold" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Restricted Access: Facility Administrator Only
          </h2>
          <p className="text-xs text-zinc-500 max-w-md mt-1">
            Campus security and governance audit trails are restricted to authorized Facility Administrators.
          </p>
        </div>
        <Button onClick={() => setActiveTab("dashboard")} size="sm" pill>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const handleExportCsv = () => {
    const header = [
      "Timestamp",
      "Action",
      "Actor",
      "Role",
      "Reference Code",
      "Subject / Event",
      "Target / Facility",
      "Notes",
    ];
    const rows = filteredLogs.map((log) =>
      [
        log.timestamp,
        ACTION_LABELS[log.action] || log.action,
        log.actorName,
        ROLE_SHORT_LABELS[log.actorRole] || log.actorRole,
        log.reservationCode,
        log.eventName,
        log.facilityName,
        log.notes,
      ]
        .map(escapeCsvCell)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unispace-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
            <ShieldCheck size={16} weight="fill" />
            <span>Administrator Security & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            System Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Immutable operational log of reservations, approvals, facility edits, and RBAC account modifications.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCsv}
          icon={<DownloadSimple size={16} weight="bold" />}
          disabled={filteredLogs.length === 0}
          className="min-h-[44px] sm:min-h-[38px]"
        >
          Export CSV ({filteredLogs.length})
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1 w-full">
          <MagnifyingGlass
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search by actor, reference code, event, venue, or notes..."
            aria-label="Search audit logs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[44px] h-11 sm:h-10 pl-10 pr-4 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            aria-label="Filter by audit action"
            className="min-h-[44px] h-11 sm:h-10 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
          >
            <option value="ALL">All Actions</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by actor role"
            className="min-h-[44px] h-11 sm:h-10 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
          >
            <option value="ALL">All Actor Roles</option>
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty & Staff</option>
            <option value="ADMINISTRATOR">Administrator</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <ClipboardText size={16} weight="bold" className="text-[#0F5132]" />
            <span>Recorded Activity ({filteredLogs.length})</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No audit events match the active search or filter criteria.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {log.eventName}
                      </span>
                      {log.reservationCode && (
                        <span className="font-mono text-[11px] text-zinc-400">
                          {log.reservationCode}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {log.notes}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 pt-0.5">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {log.actorName}
                      </span>
                      <RoleBadge role={log.actorRole} />
                      <span>·</span>
                      <span>{log.facilityName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 shrink-0">
                    <Clock size={13} />
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
