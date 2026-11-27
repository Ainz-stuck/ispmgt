"use client";

import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { hasPermission, getRoleQueuePriority } from "../../lib/rbac";
import { Reservation } from "../../types";
import { StatusBadge, RoleBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardBody } from "../ui/Card";
import { Modal } from "../ui/Modal";
import {
  MagnifyingGlass,
  PlusCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  Buildings,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react";

export function ReservationsView() {
  const {
    reservations,
    currentUser,
    setSelectedReservationForReview,
    openBookingModal,
    openEditBookingModal,
    approveReservation,
    cancelReservation,
    deleteReservation,
    checkConflict,
  } = useApp();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);

  const isAdmin = hasPermission(currentUser.role, "RESERVATION_APPROVE");
  const canViewAll = hasPermission(currentUser.role, "RESERVATION_VIEW_ALL");

  const canDeleteReservation = (res: Reservation) => {
    if (isAdmin) return true;
    return res.userId === currentUser.id && res.status !== "APPROVED";
  };

  const canEditReservation = (res: Reservation) => {
    return res.userId === currentUser.id && res.status === "PENDING";
  };

  const handleQuickApprove = async (res: Reservation) => {
    setActionError(null);
    const conflict = checkConflict(res.facilityId, res.date, res.startTime, res.endTime, res.id);
    if (conflict) {
      setSelectedReservationForReview(res);
      return;
    }
    setBusyId(res.id);
    const result = await approveReservation(res.id);
    setBusyId(null);
    if (!result.success) {
      setActionError(result.error || "Unable to approve reservation.");
    }
  };

  const handleCancelReservation = async (resId: string) => {
    setActionError(null);
    setBusyId(resId);
    const result = await cancelReservation(resId);
    setBusyId(null);
    if (!result.success) {
      setActionError(result.error || "Unable to cancel reservation.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!reservationToDelete) return;
    setActionError(null);
    setBusyId(reservationToDelete.id);
    const result = await deleteReservation(reservationToDelete.id);
    setBusyId(null);
    if (!result.success) {
      setActionError(result.error || "Unable to delete reservation.");
    }
    setReservationToDelete(null);
  };

  // Filter & priority-sort reservations (pending Faculty & Staff priority first for Admins)
  const filtered = reservations
    .filter((r) => {
      if (!canViewAll && r.userId !== currentUser.id) {
        return false;
      }

      const matchesSearch =
        r.eventName.toLowerCase().includes(search.toLowerCase()) ||
        r.reservationCode.toLowerCase().includes(search.toLowerCase()) ||
        r.userName.toLowerCase().includes(search.toLowerCase()) ||
        r.facilityName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      const matchesRole = roleFilter === "ALL" || r.userRole === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    })
    .sort((a, b) => {
      if (!isAdmin) return 0;
      const aPending = a.status === "PENDING" ? 0 : 1;
      const bPending = b.status === "PENDING" ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      const pDiff = getRoleQueuePriority(a.userRole) - getRoleQueuePriority(b.userRole);
      if (pDiff !== 0) return pDiff;
      return (b.submittedAt || "").localeCompare(a.submittedAt || "");
    });

  const pendingCount = reservations.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6 pb-16">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            {isAdmin ? "Central Reservation Queue & Approvals" : "My Reservation Requests"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            {isAdmin
              ? `Review and arbitrate ${pendingCount} pending facility requests across the university.`
              : "Track your submitted venue applications, inspection schedules, and approval logs."}
          </p>
        </div>

        <Button
          onClick={() => openBookingModal()}
          icon={<PlusCircle size={16} weight="bold" />}
          className="min-h-[44px] w-full sm:w-auto"
        >
          New Booking Request
        </Button>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center justify-between gap-2">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:text-rose-700 font-semibold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1 w-full">
          <MagnifyingGlass
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search by code (e.g. US-2026), event title, requester, or facility..."
            aria-label="Search reservations by code, event title, requester, or facility"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[44px] h-11 sm:h-10 pl-10 pr-4 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter reservations by status"
            className="min-h-[44px] h-11 sm:h-10 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Role Filter (Admin view only) */}
          {isAdmin && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter reservations by requester role"
              className="min-h-[44px] h-11 sm:h-10 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Student Requests</option>
              <option value="FACULTY">Faculty &amp; Staff Priority</option>
            </select>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MOBILE CARDS VIEW (320px - 767px)                                      */}
      {/* Converts reservation approval table into touch-friendly cards on mobile   */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-3.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
            No reservation records found matching active criteria.
          </div>
        ) : (
          filtered.map((res) => (
            <div
              key={res.id}
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-3"
            >
              {/* Header: Requester & Status */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {res.userName}
                    </span>
                    <RoleBadge role={res.userRole} />
                    {isAdmin && res.status === "PENDING" && res.userRole === "FACULTY" && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                        Priority Queue
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {res.reservationCode} · {res.department}
                  </div>
                </div>
                <StatusBadge status={res.status} />
              </div>

              {/* Event & Venue Info */}
              <div className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                  {res.eventName}
                </div>
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <Buildings size={14} className="text-[#0F5132] shrink-0" />
                  <span className="font-medium">{res.facilityName}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <Calendar size={13} className="text-zinc-400" />
                    <span>{res.date}</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock size={13} className="text-zinc-400" />
                    <span>{res.startTime} - {res.endTime}</span>
                  </div>
                </div>
              </div>

              {/* Resources Allocated */}
              {res.resources.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {res.resources.map((item) => (
                    <span
                      key={item.resourceId}
                      className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {item.name}: {item.quantity}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons: 44px+ touch targets */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedReservationForReview(res)}
                  className="min-h-[44px] flex-1 text-xs"
                >
                  Details
                </Button>

                {/* Admin Quick Decision Buttons */}
                {isAdmin && res.status === "PENDING" && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={busyId === res.id}
                      onClick={() => handleQuickApprove(res)}
                      className="min-h-[44px] flex-1 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                      icon={<CheckCircle size={16} weight="bold" />}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === res.id}
                      onClick={() => setSelectedReservationForReview(res)}
                      className="min-h-[44px] px-3 text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                      icon={<XCircle size={16} weight="bold" />}
                    >
                      Reject
                    </Button>
                  </>
                )}

                {/* Owner Edit & Cancel Pending */}
                {canEditReservation(res) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === res.id}
                      onClick={() => openEditBookingModal(res)}
                      className="min-h-[44px] text-xs px-3"
                      icon={<PencilSimple size={15} weight="bold" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={busyId === res.id}
                      onClick={() => handleCancelReservation(res.id)}
                      className="min-h-[44px] text-xs text-amber-700 hover:bg-amber-50 px-3"
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {canDeleteReservation(res) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === res.id}
                    onClick={() => setReservationToDelete(res)}
                    className="min-h-[44px] text-xs text-rose-600 hover:bg-rose-50 px-3"
                    icon={<Trash size={15} />}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP & TABLET MASTER TABLE (hidden md:block)                       */}
      {/* Full expanded table for larger screens                                    */}
      {/* ========================================================================= */}
      <div className="hidden md:block">
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-5 py-3.5">Tracking / Event</th>
                    <th className="px-4 py-3.5">Venue</th>
                    <th className="px-4 py-3.5">Requester / Dept</th>
                    <th className="px-4 py-3.5">Reserved Schedule</th>
                    <th className="px-4 py-3.5">Resources</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                        No reservation records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((res) => (
                      <tr
                        key={res.id}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        {/* Code / Event */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {res.eventName}
                          </div>
                          <div className="font-mono text-[11px] text-[#0F5132] dark:text-emerald-400 font-semibold mt-0.5">
                            {res.reservationCode}
                          </div>
                        </td>

                        {/* Venue */}
                        <td className="px-4 py-4 text-zinc-800 dark:text-zinc-200 font-medium">
                          {res.facilityName}
                        </td>

                        {/* Requester */}
                        <td className="px-4 py-4">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {res.userName}
                          </div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                            <RoleBadge role={res.userRole} />
                    {isAdmin && res.status === "PENDING" && res.userRole === "FACULTY" && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                        Priority Queue
                      </span>
                    )}
                            <span>{res.department}</span>
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-medium text-zinc-800 dark:text-zinc-200">
                            {res.date}
                          </div>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Clock size={12} />
                            <span>
                              {res.startTime} - {res.endTime}
                            </span>
                          </div>
                        </td>

                        {/* Resources */}
                        <td className="px-4 py-4">
                          {res.resources.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {res.resources.map((item) => (
                                <span
                                  key={item.resourceId}
                                  className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-300"
                                >
                                  {item.name}: {item.quantity}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic">None</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <StatusBadge status={res.status} />
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedReservationForReview(res)}
                              className="h-7 text-xs px-2.5"
                            >
                              Details
                            </Button>

                            {/* Quick Admin Actions */}
                            {isAdmin && res.status === "PENDING" && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  loading={busyId === res.id}
                                  onClick={() => handleQuickApprove(res)}
                                  className="h-7 text-xs px-2 bg-emerald-700 hover:bg-emerald-800 text-white"
                                  title="One-Click Approve"
                                >
                                  <CheckCircle size={14} weight="bold" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busyId === res.id}
                                  onClick={() => setSelectedReservationForReview(res)}
                                  className="h-7 text-xs px-2 text-rose-700 border-rose-300 hover:bg-rose-50"
                                  title="Reject with remarks"
                                >
                                  <XCircle size={14} weight="bold" />
                                </Button>
                              </>
                            )}

                            {/* Owner edit & cancel pending */}
                            {canEditReservation(res) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busyId === res.id}
                                  onClick={() => openEditBookingModal(res)}
                                  className="h-7 text-xs px-2"
                                  title="Edit pending reservation"
                                >
                                  <PencilSimple size={14} weight="bold" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  loading={busyId === res.id}
                                  onClick={() => handleCancelReservation(res.id)}
                                  className="h-7 text-xs text-amber-700 hover:bg-amber-50"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}

                            {canDeleteReservation(res) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={busyId === res.id}
                                onClick={() => setReservationToDelete(res)}
                                className="h-7 text-xs px-2 text-rose-600 hover:bg-rose-50"
                                title="Delete reservation"
                              >
                                <Trash size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Delete Reservation Confirmation Modal */}
      <Modal
        isOpen={!!reservationToDelete}
        onClose={() => busyId !== reservationToDelete?.id && setReservationToDelete(null)}
        title="Delete Reservation Record"
        subtitle={reservationToDelete?.reservationCode}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              disabled={busyId === reservationToDelete?.id}
              onClick={() => setReservationToDelete(null)}
            >
              Keep Record
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={busyId === reservationToDelete?.id}
              onClick={handleConfirmDelete}
              icon={<Trash size={14} weight="bold" />}
            >
              Confirm Delete
            </Button>
          </div>
        }
      >
        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Permanently delete <strong>{reservationToDelete?.eventName}</strong> on{" "}
          <strong>{reservationToDelete?.date}</strong> ({reservationToDelete?.facilityName})? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
