"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { StatusBadge, RoleBadge } from "../ui/Badge";
import { Textarea } from "../ui/Input";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  WarningCircle,
} from "@phosphor-icons/react";

export function AdminApprovalModal() {
  const {
    selectedReservationForReview,
    setSelectedReservationForReview,
    approveReservation,
    rejectReservation,
    checkConflict,
  } = useApp();

  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setAdminNotes("");
    setRejectionReason("");
    setIsRejecting(false);
    setActionError(null);
    setIsSubmitting(false);
  }, [selectedReservationForReview?.id]);

  if (!selectedReservationForReview) return null;

  const res = selectedReservationForReview;

  // Check if there is another reservation colliding
  const conflict = checkConflict(
    res.facilityId,
    res.date,
    res.startTime,
    res.endTime,
    res.id
  );

  const handleApprove = async () => {
    setIsSubmitting(true);
    setActionError(null);
    const result = await approveReservation(res.id, adminNotes);
    setIsSubmitting(false);

    if (!result.success) {
      setActionError(result.error || "Failed to approve reservation.");
      return;
    }

    setSelectedReservationForReview(null);
    setAdminNotes("");
    setIsRejecting(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setIsSubmitting(true);
    setActionError(null);
    const result = await rejectReservation(res.id, rejectionReason.trim());
    setIsSubmitting(false);

    if (!result.success) {
      setActionError(result.error || "Failed to reject reservation.");
      return;
    }

    setSelectedReservationForReview(null);
    setRejectionReason("");
    setIsRejecting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedReservationForReview(null);
    setIsRejecting(false);
    setActionError(null);
  };

  return (
    <Modal
      isOpen={!!selectedReservationForReview}
      onClose={handleClose}
      title={`Review Reservation: ${res.reservationCode}`}
      subtitle={`${res.facilityName} · Requested by ${res.userName}`}
      maxWidth="2xl"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 w-full">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="min-h-[44px] sm:min-h-0"
          >
            Close
          </Button>

          {res.status === "PENDING" && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {!isRejecting ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActionError(null);
                      setIsRejecting(true);
                    }}
                    disabled={isSubmitting}
                    className="text-rose-700 border-rose-300 hover:bg-rose-50 min-h-[44px] sm:min-h-0"
                    icon={<XCircle size={15} weight="bold" />}
                  >
                    Reject Request
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!!conflict || isSubmitting}
                    loading={isSubmitting}
                    onClick={handleApprove}
                    className="min-h-[44px] sm:min-h-0"
                    icon={<CheckCircle size={15} weight="bold" />}
                  >
                    Approve Reservation
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => setIsRejecting(false)}
                    className="min-h-[44px] sm:min-h-0"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={!rejectionReason.trim() || isSubmitting}
                    loading={isSubmitting}
                    onClick={handleReject}
                    className="min-h-[44px] sm:min-h-0"
                  >
                    Confirm Rejection
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Action Error Banner */}
        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2">
            <WarningCircle size={16} weight="fill" className="text-rose-600 shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Status Header Bar */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-medium">Status:</span>
            <StatusBadge status={res.status} />
          </div>
          <div className="text-zinc-500">
            Submitted: {res.submittedAt}
          </div>
        </div>

        {/* Schedule Conflict Alert */}
        {conflict && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2">
            <WarningCircle size={16} weight="fill" className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Schedule Overlap Alert:</strong>
              This request overlaps with event &quot;{conflict.eventName}&quot; ({conflict.startTime} - {conflict.endTime}).
              Approval is locked until the conflict is resolved.
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
          <div>
            <span className="text-zinc-400 block text-[11px]">Event Title:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              {res.eventName}
            </span>
          </div>

          <div>
            <span className="text-zinc-400 block text-[11px]">Venue Requested:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {res.facilityName}
            </span>
          </div>

          <div>
            <span className="text-zinc-400 block text-[11px]">Requester Information:</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{res.userName}</span>
              <RoleBadge role={res.userRole} />
            </div>
            <div className="text-zinc-500 text-[11px] mt-0.5">
              {res.department} · {res.userEmail}
            </div>
          </div>

          <div>
            <span className="text-zinc-400 block text-[11px]">Date & Time Slot:</span>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mt-0.5">
              <Calendar size={14} className="text-[#0F5132]" />
              <span>{res.date}</span>
              <Clock size={14} className="text-[#0F5132] ml-2" />
              <span>{res.startTime} - {res.endTime}</span>
            </div>
          </div>

          <div className="sm:col-span-2">
            <span className="text-zinc-400 block text-[11px]">Event Purpose:</span>
            <p className="text-zinc-700 dark:text-zinc-300 mt-0.5 leading-relaxed bg-white dark:bg-zinc-800 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {res.purpose}
            </p>
          </div>

          <div className="sm:col-span-2">
            <span className="text-zinc-400 block text-[11px] mb-1">Requested Resources:</span>
            <div className="flex flex-wrap gap-1.5">
              {res.resources.length > 0 ? (
                res.resources.map((r) => (
                  <span
                    key={r.resourceId}
                    className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium"
                  >
                    {r.name}: {r.quantity}
                  </span>
                ))
              ) : (
                <span className="text-zinc-400 italic">No extra resources requested.</span>
              )}
            </div>
          </div>
        </div>

        {/* Existing Notes or Decision History */}
        {res.adminNotes && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-300">
            <strong>Administrator Note:</strong> {res.adminNotes}
          </div>
        )}

        {res.rejectionReason && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-900 dark:text-rose-300">
            <strong>Rejection Reason:</strong> {res.rejectionReason}
          </div>
        )}

        {/* Action Input Forms for Pending Items */}
        {res.status === "PENDING" && !isRejecting && (
          <div className="pt-2">
            <Textarea
              label="Approval Remarks & Custodial Instructions (Optional)"
              placeholder="e.g. Approved. Audio technicians assigned for setup at 08:30 AM."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
        )}

        {res.status === "PENDING" && isRejecting && (
          <div className="pt-2 bg-rose-50/50 p-3 rounded-xl border border-rose-200">
            <Textarea
              label="Official Rejection Reason (Mandatory)"
              placeholder="State the regulatory or scheduling reason for declining this request..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
