"use client";

import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { NotificationType, SystemNotification } from "../../types";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { Button } from "../ui/Button";
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  WarningCircle,
  Buildings,
  Check,
} from "@phosphor-icons/react";

export function NotificationsView() {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationsCount,
    setSelectedReservationForReview,
    reservations,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const filtered = notifications.filter((n) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "UNREAD") return !n.read;
    return n.type === activeFilter;
  });

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "RESERVATION_APPROVED":
        return <CheckCircle size={18} weight="fill" className="text-emerald-600" />;
      case "RESERVATION_REJECTED":
        return <XCircle size={18} weight="fill" className="text-rose-600" />;
      case "RESERVATION_SUBMITTED":
        return <Clock size={18} weight="fill" className="text-blue-600" />;
      case "SCHEDULE_REMINDER":
        return <Clock size={18} weight="fill" className="text-amber-600" />;
      case "FACILITY_UPDATE":
        return <Buildings size={18} weight="fill" className="text-purple-600" />;
    }
  };

  const handleNotificationClick = (notif: SystemNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.reservationId) {
      const targetRes = reservations.find((r) => r.id === notif.reservationId);
      if (targetRes) {
        setSelectedReservationForReview(targetRes);
      }
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            System announcements, approval notifications, and facility maintenance alerts
          </p>
        </div>

        {unreadNotificationsCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={markAllNotificationsAsRead}
            icon={<Check size={14} weight="bold" />}
          >
            Mark All as Read ({unreadNotificationsCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        role="tablist"
        aria-label="Notification alert categories"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs"
      >
        {[
          { id: "ALL", label: "All Alerts" },
          { id: "UNREAD", label: `Unread (${unreadNotificationsCount})` },
          { id: "RESERVATION_APPROVED", label: "Approvals" },
          { id: "RESERVATION_SUBMITTED", label: "Submissions" },
          { id: "RESERVATION_REJECTED", label: "Rejections" },
          { id: "FACILITY_UPDATE", label: "Facility Notices" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeFilter === tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeFilter === tab.id
                ? "bg-[#0F5132] text-white"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <Card>
        <CardBody className="p-0 divide-y divide-zinc-100 dark:divide-zinc-800">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs">
              No notifications found matching your selection.
            </div>
          ) : (
            filtered.map((notif) => (
              <div
                key={notif.id}
                role="button"
                tabIndex={0}
                aria-label={`${notif.title}: ${notif.message}`}
                onClick={() => handleNotificationClick(notif)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleNotificationClick(notif);
                  }
                }}
                className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] ${
                  notif.read
                    ? "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                    : "bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/50"
                }`}
              >
                <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 mt-0.5">
                  {getIconForType(notif.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-xs ${
                        notif.read
                          ? "font-semibold text-zinc-800 dark:text-zinc-200"
                          : "font-bold text-zinc-950 dark:text-zinc-50"
                      }`}
                    >
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {notif.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.reservationId && (
                    <span className="inline-block text-[11px] text-[#0F5132] dark:text-emerald-400 font-semibold hover:underline pt-0.5">
                      View Reservation Details →
                    </span>
                  )}
                </div>

                {!notif.read && (
                  <span
                    className="w-2 h-2 rounded-full bg-[#0F5132] dark:bg-emerald-400 shrink-0 mt-2"
                    title="Unread notification"
                  />
                )}
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
