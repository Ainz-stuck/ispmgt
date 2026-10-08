"use client";

import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { User, UserRole } from "../../types";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { RoleBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  Users,
  MagnifyingGlass,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  UserGear,
  EnvelopeSimple,
  Phone,
} from "@phosphor-icons/react";

export function UserManagementView() {
  const { allUsers, toggleUserStatus, currentUser } = useApp();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase()) ||
      u.studentOrEmployeeId.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0F5132] text-xs font-semibold mb-1">
            <ShieldCheck size={14} weight="fill" />
            <span>Administrator Security Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            User Access & Directory Management
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Audit registered student and faculty accounts, configure access privileges, and toggle activation status
          </p>
        </div>

        <div className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 font-mono">
          Total Users: <strong>{allUsers.length}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1 w-full">
          <MagnifyingGlass
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search by user name, email, department, or student ID..."
            aria-label="Search users by name, email, department, or student ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[44px] h-11 sm:h-10 pl-10 pr-4 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter users by institutional role"
            className="min-h-[44px] h-11 sm:h-10 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Students Only</option>
            <option value="FACULTY">Faculty Members</option>
            <option value="ADMINISTRATOR">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter users by account status"
            className="min-h-[44px] h-11 sm:h-10 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
          >
            <option value="ALL">All Account States</option>
            <option value="ACTIVE">Active Only</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Mobile Card List (< 768px) */}
      <div className="block md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">No users match your active filter criteria.</p>
          </div>
        ) : (
          filtered.map((user) => {
            const isCurrent = user.id === currentUser.id;
            const isActive = user.status === "ACTIVE";

            return (
              <div
                key={user.id}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3"
              >
                {/* Header: Name, ID, Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 flex-wrap">
                      <span>{user.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-normal">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      ID: {user.studentOrEmployeeId}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                      isActive
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? "bg-emerald-600" : "bg-rose-600"
                      }`}
                    />
                    {isActive ? "Active" : "Deactivated"}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Role</span>
                    <div className="mt-1">
                      <RoleBadge role={user.role} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Department</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate block mt-0.5">
                      {user.department}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                  <div className="flex items-center gap-2">
                    <EnvelopeSimple size={13} className="text-zinc-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.contactNumber && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-zinc-400 shrink-0" />
                      <span>{user.contactNumber}</span>
                    </div>
                  )}
                </div>

                {/* Action button */}
                {user.role !== "ADMINISTRATOR" ? (
                  <Button
                    variant={isActive ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => toggleUserStatus(user.id)}
                    className="w-full min-h-[44px] text-xs justify-center font-medium mt-1"
                  >
                    {isActive ? "Deactivate Account" : "Activate Account"}
                  </Button>
                ) : (
                  <div className="text-center py-2 text-[11px] text-zinc-400 italic bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                    Protected Administrator Account
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop/Tablet Master Table (>= 768px) */}
      <Card className="hidden md:block">
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">User Identity</th>
                  <th className="px-4 py-3.5">Institutional Email</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  const isActive = user.status === "ACTIVE";

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* User Identity */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 font-normal">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          ID: {user.studentOrEmployeeId}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-300">
                        {user.email}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <RoleBadge role={user.role} />
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                        {user.department}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3.5 text-zinc-500 text-[11px]">
                        {user.contactNumber || "N/A"}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-rose-50 text-rose-800 border-rose-300"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-600" : "bg-rose-600"
                            }`}
                          />
                          {isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {user.role !== "ADMINISTRATOR" ? (
                          <Button
                            variant={isActive ? "secondary" : "primary"}
                            size="sm"
                            onClick={() => toggleUserStatus(user.id)}
                            className="h-8 min-h-[32px] text-xs px-3"
                          >
                            {isActive ? "Deactivate" : "Activate"}
                          </Button>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
