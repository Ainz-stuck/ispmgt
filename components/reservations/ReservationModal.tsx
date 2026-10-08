"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useApp } from "../../context/AppContext";
import { Facility, FacilityId, RequestedResource, Reservation } from "../../types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Input";
import { StatusBadge } from "../ui/Badge";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  WarningCircle,
  ArrowRight,
  ArrowLeft,
  Package,
  FileText,
  ShieldCheck,
} from "@phosphor-icons/react";

export function ReservationModal() {
  const {
    isBookingModalOpen,
    closeBookingModal,
    preselectedFacilityId,
    preselectedDate,
    preselectedTime,
    facilities,
    resources,
    currentUser,
    createReservation,
    checkConflict,
    setActiveTab,
  } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  // Form Fields
  const [eventName, setEventName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [expectedAttendees, setExpectedAttendees] = useState<number>(50);

  // Resource Requests
  const [requestedResources, setRequestedResources] = useState<{ [id: string]: number }>({
    "res-proj": 0,
    "res-sound": 0,
    "res-mic": 0,
    "res-chair": 0,
    "res-table": 0,
  });

  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [conflictReservation, setConflictReservation] = useState<Reservation | null>(null);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isBookingModalOpen) {
      setCurrentStep(1);
      setSubmittedCode(null);
      setFormError(null);
      setPolicyAccepted(false);

      if (preselectedDate) {
        setDate(preselectedDate);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const defaultDateStr = tomorrow.toISOString().split("T")[0];
        setDate(defaultDateStr);
      }

      if (preselectedTime) {
        setStartTime(preselectedTime);
        const [h, m] = preselectedTime.split(":").map(Number);
        const endHour = Math.min(22, (h || 9) + 2);
        setEndTime(`${endHour < 10 ? "0" + endHour : endHour}:${(m !== undefined && m < 10) ? "0" + m : (m || "00")}`);
      } else {
        setStartTime("09:00");
        setEndTime("12:00");
      }

      if (preselectedFacilityId) {
        const found = facilities.find((f) => f.id === preselectedFacilityId);
        if (found) {
          setSelectedFacility(found);
          setCurrentStep(2); // Jump directly to information step if facility was pre-selected
        }
      } else {
        setSelectedFacility(null);
      }
    }
  }, [isBookingModalOpen, preselectedFacilityId, preselectedDate, preselectedTime, facilities]);

  // Live Conflict Detection when step 2 values change
  useEffect(() => {
    if (selectedFacility && date && startTime && endTime) {
      const conflict = checkConflict(selectedFacility.id, date, startTime, endTime);
      setConflictReservation(conflict);
    } else {
      setConflictReservation(null);
    }
  }, [selectedFacility, date, startTime, endTime, checkConflict]);

  if (!isBookingModalOpen) return null;

  const handleFacilitySelect = (facility: Facility) => {
    if (facility.status !== "AVAILABLE") return;
    setSelectedFacility(facility);
    setCurrentStep(2);
  };

  const handleResourceChange = (resId: string, value: number) => {
    setRequestedResources((prev) => ({
      ...prev,
      [resId]: Math.max(0, value),
    }));
  };

  const validateStep2 = () => {
    if (!eventName.trim()) {
      setFormError("Event name is required.");
      return false;
    }
    if (!purpose.trim()) {
      setFormError("Event purpose and academic justification are required.");
      return false;
    }
    if (!date) {
      setFormError("Please select a reservation date.");
      return false;
    }
    if (!startTime || !endTime) {
      setFormError("Start time and end time are required.");
      return false;
    }
    if (startTime >= endTime) {
      setFormError("End time must be later than start time.");
      return false;
    }
    if (selectedFacility && expectedAttendees > selectedFacility.capacity) {
      setFormError(
        `Expected attendees (${expectedAttendees}) exceeds venue capacity (${selectedFacility.capacity}).`
      );
      return false;
    }
    if (conflictReservation) {
      setFormError("Cannot proceed while there is a schedule conflict for this venue.");
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = () => {
    if (!policyAccepted) {
      setFormError("You must acknowledge the University Facility Terms & Safety Policy.");
      return;
    }
    if (!selectedFacility) return;

    // Build resource list
    const resourceList: RequestedResource[] = [];
    Object.entries(requestedResources).forEach(([resId, qty]) => {
      if (qty > 0) {
        const item = resources.find((r) => r.id === resId);
        if (item) {
          resourceList.push({
            resourceId: resId,
            name: item.name,
            quantity: qty,
          });
        }
      }
    });

    const result = createReservation({
      facilityId: selectedFacility.id,
      facilityName: selectedFacility.name,
      eventName,
      purpose,
      date,
      startTime,
      endTime,
      expectedAttendees,
      resources: resourceList,
    });

    if (result.success && result.reservationCode) {
      setSubmittedCode(result.reservationCode);
      setCurrentStep(5); // Success step
    } else if (result.conflict) {
      setConflictReservation(result.conflict);
      setFormError("A conflicting booking was just detected. Please choose another time slot.");
    }
  };

  return (
    <Modal
      isOpen={isBookingModalOpen}
      onClose={closeBookingModal}
      title={
        submittedCode
          ? "Reservation Confirmed"
          : `New Reservation Request (Step ${currentStep} of 4)`
      }
      subtitle={
        submittedCode
          ? "Booking logged in central facility database"
          : currentStep === 1
          ? "Select one of the 6 managed university facilities"
          : currentStep === 2
          ? "Specify event details and schedule"
          : currentStep === 3
          ? "Allocate required campus equipment and furniture"
          : "Review reservation summary and submit for approval"
      }
      maxWidth="3xl"
      footer={
        submittedCode ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-zinc-500">
              Reference Code: <strong className="text-zinc-900 dark:text-zinc-100">{submittedCode}</strong>
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                closeBookingModal();
                setActiveTab("reservations");
              }}
            >
              Track in Reservations →
            </Button>
          </div>
        ) : (
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
            <div>
              {currentStep > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFormError(null);
                    setCurrentStep((prev) => prev - 1);
                  }}
                  icon={<ArrowLeft size={14} weight="bold" />}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  Back
                </Button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={closeBookingModal}
                className="min-h-[44px]"
              >
                Cancel
              </Button>

              {currentStep === 1 && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!selectedFacility}
                  onClick={() => setCurrentStep(2)}
                  icon={<ArrowRight size={14} weight="bold" />}
                  className="min-h-[44px]"
                >
                  Continue to Schedule
                </Button>
              )}

              {currentStep === 2 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (validateStep2()) {
                      setCurrentStep(3);
                    }
                  }}
                  icon={<ArrowRight size={14} weight="bold" />}
                  className="min-h-[44px]"
                >
                  Continue to Resources
                </Button>
              )}

              {currentStep === 3 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentStep(4)}
                  icon={<ArrowRight size={14} weight="bold" />}
                  className="min-h-[44px]"
                >
                  Review Summary
                </Button>
              )}

              {currentStep === 4 && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!policyAccepted || !!conflictReservation}
                  onClick={handleSubmit}
                  icon={<CheckCircle size={15} weight="bold" />}
                  className="min-h-[44px]"
                >
                  Submit Reservation Request
                </Button>
              )}
            </div>
          </div>
        )
      }
    >
      {/* Step Indicators */}
      {!submittedCode && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          {[
            { num: 1, title: "Facility" },
            { num: 2, title: "Schedule & Info" },
            { num: 3, title: "Resources" },
            { num: 4, title: "Review & Submit" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-1.5 sm:gap-2">
              <span
                className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentStep === s.num
                    ? "bg-[#0F5132] text-white shadow-xs"
                    : currentStep > s.num
                    ? "bg-emerald-100 text-[#0F5132] dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                }`}
              >
                {currentStep > s.num ? "✓" : s.num}
              </span>
              <span
                className={`text-xs ${
                  currentStep === s.num
                    ? "font-bold text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-400 hidden sm:inline"
                }`}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {formError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <WarningCircle size={16} weight="fill" className="shrink-0 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      {/* STEP 1: Select Facility */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
            Choose from the 6 approved university venues:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {facilities.map((f) => {
              const isSelected = selectedFacility?.id === f.id;
              const isAvailable = f.status === "AVAILABLE";

              return (
                <div
                  key={f.id}
                  onClick={() => isAvailable && handleFacilitySelect(f)}
                  className={`p-3.5 rounded-xl border transition-all text-left flex gap-3 ${
                    isSelected
                      ? "border-[#0F5132] bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-[#0F5132]/30"
                      : isAvailable
                      ? "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-800/60 cursor-pointer"
                      : "opacity-60 bg-zinc-50 border-zinc-200 cursor-not-allowed"
                  }`}
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-zinc-100">
                    <Image
                      src={f.image}
                      alt={f.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                          {f.name}
                        </span>
                        <StatusBadge status={f.status} />
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {f.location}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 pt-1">
                      <span>Cap: {f.capacity}</span>
                      <span className="text-[#0F5132] dark:text-emerald-400 font-medium">
                        {isSelected ? "Selected" : "Select →"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: Reservation Information & Conflict Detector */}
      {currentStep === 2 && selectedFacility && (
        <div className="space-y-4">
          {/* Selected Facility Reminder Strip */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Venue:</span>
              <strong className="text-zinc-900 dark:text-zinc-100">{selectedFacility.name}</strong>
              <span className="text-zinc-400">({selectedFacility.location})</span>
            </div>
            <span className="text-zinc-500">Max Capacity: {selectedFacility.capacity} pax</span>
          </div>

          {/* Schedule Conflict Alert Banner */}
          {conflictReservation && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-700">
                <WarningCircle size={18} weight="fill" />
                <span>Double-Booking Conflict Detected!</span>
              </div>
              <p className="leading-relaxed pl-6">
                <strong>{selectedFacility.name}</strong> is already booked for{" "}
                <em>&quot;{conflictReservation.eventName}&quot;</em> from{" "}
                <strong>{conflictReservation.startTime}</strong> to{" "}
                <strong>{conflictReservation.endTime}</strong> on {conflictReservation.date}.
              </p>
              <div className="pl-6 pt-1 text-[11px] text-rose-700 font-semibold">
                Please adjust the date or time slot to resolve this schedule collision.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Event / Activity Name"
                placeholder="e.g. ACM Annual Technology Keynote & Coding Showcase"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Textarea
                label="Event Purpose & Academic Justification"
                placeholder="State the purpose, expected outcome, and departmental relevance of the event..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Date of Reservation"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Expected Attendees Count"
                type="number"
                min={1}
                max={selectedFacility.capacity}
                value={expectedAttendees}
                onChange={(e) => setExpectedAttendees(Number(e.target.value))}
                helperText={`Maximum venue limit: ${selectedFacility.capacity}`}
                required
              />
            </div>

            <div>
              <Input
                label="Start Time (24h)"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="End Time (24h)"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Resource Selection */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            Request university inventory equipment and furnishings needed for your event:
          </div>

          <div className="space-y-3">
            {resources.map((res) => {
              const currentQty = requestedResources[res.id] || 0;

              return (
                <div
                  key={res.id}
                  className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>{res.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono">
                        {res.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Condition: {res.condition} · Total Campus Stock: {res.totalQuantity} {res.unit} (
                      {res.availableQuantity} currently available)
                    </div>
                  </div>

                  {/* Quantity Counter with 44px Touch Targets */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleResourceChange(res.id, currentQty - (res.id === "res-chair" ? 10 : 1))}
                      disabled={currentQty <= 0}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-bold text-base text-zinc-700 dark:text-zinc-200 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      aria-label={`Decrease ${res.name}`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={res.availableQuantity}
                      value={currentQty}
                      aria-label={`Quantity of ${res.name}`}
                      onChange={(e) => handleResourceChange(res.id, Number(e.target.value))}
                      className="w-14 sm:w-16 min-h-[44px] text-center rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleResourceChange(
                          res.id,
                          currentQty + (res.id === "res-chair" ? 10 : 1)
                        )
                      }
                      disabled={currentQty >= res.availableQuantity}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-bold text-base text-zinc-700 dark:text-zinc-200 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      aria-label={`Increase ${res.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: Confirmation & Agreement */}
      {currentStep === 4 && selectedFacility && (
        <div className="space-y-5">
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3">
            <h4 className="text-xs font-bold text-[#0F5132] dark:text-emerald-400 uppercase tracking-wider">
              Reservation Summary
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-zinc-400 block">Facility:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{selectedFacility.name}</strong>
              </div>
              <div>
                <span className="text-zinc-400 block">Location:</span>
                <span className="text-zinc-700 dark:text-zinc-300">{selectedFacility.location}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Event Title:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{eventName}</strong>
              </div>
              <div>
                <span className="text-zinc-400 block">Schedule:</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {date} ({startTime} - {endTime})
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">Requester:</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {currentUser.name} ({currentUser.role})
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">Attendees:</span>
                <span className="text-zinc-700 dark:text-zinc-300">{expectedAttendees} people</span>
              </div>
            </div>

            {/* Resources list */}
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800 text-xs">
              <span className="text-zinc-400 block mb-1">Allocated Resources:</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(requestedResources).some(([_, qty]) => qty > 0) ? (
                  Object.entries(requestedResources).map(([resId, qty]) => {
                    if (qty <= 0) return null;
                    const r = resources.find((item) => item.id === resId);
                    return (
                      <span
                        key={resId}
                        className="px-2 py-0.5 bg-white dark:bg-zinc-800 rounded border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 font-medium text-[11px]"
                      >
                        {r?.name}: {qty}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-zinc-400 italic">No extra resources requested.</span>
                )}
              </div>
            </div>
          </div>

          {/* Compliance Checkbox with 44px Touch Area */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <label className="flex items-start gap-3 cursor-pointer text-xs min-h-[44px] select-none">
              <input
                type="checkbox"
                checked={policyAccepted}
                onChange={(e) => setPolicyAccepted(e.target.checked)}
                className="mt-0.5 rounded text-[#0F5132] focus:ring-[#0F5132] w-4 h-4 shrink-0"
              />
              <span className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px] sm:text-xs">
                I hereby verify that this reservation adheres to university academic regulations and venue
                safety policies. I agree to maintain decorum and return all requested assets in clean,
                working condition upon event conclusion.
              </span>
            </label>
          </div>
        </div>
      )}

      {/* STEP 5: Success State */}
      {submittedCode && (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0F5132] dark:bg-emerald-950 dark:text-emerald-300 mx-auto flex items-center justify-center">
            <CheckCircle size={36} weight="fill" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Reservation Submitted Successfully!
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              Your reservation request has been officially recorded in the Greenwich central database and
              forwarded to the Facility Administrator.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 max-w-sm mx-auto text-xs space-y-1">
            <div className="text-zinc-400 uppercase tracking-wider text-[10px]">
              System Tracking Code
            </div>
            <div className="font-mono text-base font-bold text-[#0F5132] dark:text-emerald-400">
              {submittedCode}
            </div>
            <div className="text-[11px] text-zinc-500">
              Status: <StatusBadge status="PENDING" />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
