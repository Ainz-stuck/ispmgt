"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Facility, FacilityStatus } from "../../types";
import { Modal } from "../ui/Modal";
import { StatusBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useApp } from "../../context/AppContext";
import {
  Users,
  MapPin,
  Clock,
  EnvelopeSimple,
  CheckCircle,
  WarningCircle,
  Calendar,
  Wrench,
  ArrowRight,
  ShieldCheck,
  PencilSimple,
  FloppyDisk,
  X,
  Plus,
  UploadSimple,
  Trash,
  ArrowClockwise,
  Sparkle,
  Image as ImageIcon,
} from "@phosphor-icons/react";

interface FacilityDetailModalProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
  onReserve: (facility: Facility) => void;
}

const PRESET_FACILITY_IMAGES = [
  { label: "Function Hall", path: "/images/facilities/function_hall.jpg" },
  { label: "Dining Hall", path: "/images/facilities/dining_hall.jpg" },
  { label: "Gymnasium", path: "/images/facilities/gym.jpg" },
  { label: "Dance Hall", path: "/images/facilities/dance_hall.jpg" },
  { label: "AVR Room", path: "/images/facilities/avr.jpg" },
  { label: "Rooftop Engineering", path: "/images/facilities/rooftop_engineering.jpg" },
  { label: "Campus Architecture", path: "/images/campus_hero.jpg" },
];

export function FacilityDetailModal({
  facility,
  isOpen,
  onClose,
  onReserve,
}: FacilityDetailModalProps) {
  const {
    reservations,
    currentUser,
    updateFacilityStatus,
    updateFacilityDetails,
    setActiveTab,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Facility | null>(null);
  const [saveNotice, setSaveNotice] = useState(false);

  // Dynamic inputs for arrays
  const [newResource, setNewResource] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newGuideline, setNewGuideline] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize editForm with the active facility whenever it changes
  useEffect(() => {
    if (facility) {
      setEditForm({ ...facility });
      setIsEditing(false);
      setSaveNotice(false);
    }
  }, [facility, isOpen]);

  if (!facility) return null;

  const isAdmin = currentUser.role === "ADMINISTRATOR";

  // Filter reservations for this facility
  const upcomingReservations = reservations
    .filter((r) => r.facilityId === facility.id && r.status !== "CANCELLED")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  // File upload reader for custom photo
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editForm) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditForm((prev) =>
            prev ? { ...prev, image: event.target!.result as string } : null
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add & Remove Handlers for Resources
  const handleAddResource = () => {
    if (!newResource.trim() || !editForm) return;
    if (!editForm.availableResources.includes(newResource.trim())) {
      setEditForm({
        ...editForm,
        availableResources: [...editForm.availableResources, newResource.trim()],
      });
    }
    setNewResource("");
  };

  const handleRemoveResource = (index: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      availableResources: editForm.availableResources.filter((_, i) => i !== index),
    });
  };

  // Add & Remove Handlers for Amenities/Features
  const handleAddFeature = () => {
    if (!newFeature.trim() || !editForm) return;
    if (!editForm.features.includes(newFeature.trim())) {
      setEditForm({
        ...editForm,
        features: [...editForm.features, newFeature.trim()],
      });
    }
    setNewFeature("");
  };

  const handleRemoveFeature = (index: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      features: editForm.features.filter((_, i) => i !== index),
    });
  };

  // Add & Remove Handlers for Guidelines
  const handleAddGuideline = () => {
    if (!newGuideline.trim() || !editForm) return;
    if (!editForm.guidelines.includes(newGuideline.trim())) {
      setEditForm({
        ...editForm,
        guidelines: [...editForm.guidelines, newGuideline.trim()],
      });
    }
    setNewGuideline("");
  };

  const handleRemoveGuideline = (index: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      guidelines: editForm.guidelines.filter((_, i) => i !== index),
    });
  };

  // Save changes to AppContext
  const handleSave = () => {
    if (!editForm) return;
    updateFacilityDetails(facility.id, editForm);
    setSaveNotice(true);
    setIsEditing(false);
    setTimeout(() => setSaveNotice(false), 4000);
  };

  const handleCancelEdit = () => {
    setEditForm({ ...facility });
    setIsEditing(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Facility: ${editForm?.name || facility.name}` : facility.name}
      subtitle={
        isEditing
          ? "Facility Administrator Direct Specification & Media Control"
          : `${facility.location} · ${facility.floor} · Code: ${facility.code}`
      }
      maxWidth="4xl"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          {/* Left Footer Action (Admin controls) */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && !isEditing && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  icon={<PencilSimple size={15} weight="bold" className="text-amber-600 dark:text-amber-400" />}
                  className="border-amber-300 dark:border-amber-700/60 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 text-zinc-900 dark:text-zinc-100 min-h-[40px]"
                >
                  Edit Specifications
                </Button>

                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs">
                  <span className="text-[11px] text-zinc-500 font-medium">Status:</span>
                  <select
                    value={facility.status}
                    onChange={(e) =>
                      updateFacilityStatus(facility.id, e.target.value as FacilityStatus)
                    }
                    className="text-xs bg-transparent font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="BOOKED">Booked</option>
                  </select>
                </div>
              </>
            )}

            {isAdmin && isEditing && (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-medium">
                <ShieldCheck size={16} weight="fill" />
                <span>Admin Editing Mode Active</span>
              </span>
            )}
          </div>

          {/* Right Footer Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isEditing ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="flex-1 sm:flex-none min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  icon={<FloppyDisk size={15} weight="bold" />}
                  className="flex-1 sm:flex-none min-h-[44px] bg-[#0F5132] hover:bg-[#0A3622] text-white"
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  className="flex-1 sm:flex-none min-h-[44px]"
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={facility.status !== "AVAILABLE"}
                  onClick={() => {
                    onClose();
                    onReserve(facility);
                  }}
                  icon={<ArrowRight size={14} weight="bold" />}
                  className="flex-1 sm:flex-none min-h-[44px]"
                >
                  {facility.status === "AVAILABLE" ? "Reserve Facility" : "Currently Occupied"}
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      {/* Success Notification Banner */}
      {saveNotice && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-[#0F5132] dark:text-emerald-300 flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} weight="fill" />
            <span className="font-semibold">
              Facility specifications and photo updated successfully!
            </span>
          </div>
          <button
            onClick={() => setSaveNotice(false)}
            className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. FACILITY ADMIN EDIT MODE (Strictly available to ADMINISTRATOR)        */}
      {/* ========================================================================= */}
      {isAdmin && isEditing && editForm ? (
        <div className="space-y-6 text-xs">
          {/* Admin Header Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0">
              <PencilSimple size={18} weight="bold" />
            </div>
            <div>
              <div className="font-bold text-amber-950 dark:text-amber-200">
                Facility Administrator Specification Editor
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed mt-0.5">
                Modifying details here immediately updates the facility catalog, reservations engine,
                and details modal across the entire UniSpace portal.
              </p>
            </div>
          </div>

          {/* Section 1: Image & Visual Media Management */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">
                <ImageIcon size={18} className="text-[#0F5132] dark:text-emerald-400" />
                <span>Facility Photo & Media</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">Live Preview Attached</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Preview Thumbnail */}
              <div className="lg:col-span-5 relative h-48 w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800">
                <Image
                  src={editForm.image}
                  alt={editForm.name}
                  fill
                  className="object-cover"
                  unoptimized={editForm.image.startsWith("data:")}
                />
                <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] text-white font-mono truncate">
                  Current: {editForm.image}
                </div>
              </div>

              {/* Image Controls & Presets */}
              <div className="lg:col-span-7 space-y-3">
                <div>
                  <label htmlFor="edit-facility-image" className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Image URL (Web path or external link):
                  </label>
                  <input
                    id="edit-facility-image"
                    type="text"
                    value={editForm.image}
                    onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                    placeholder="/images/facilities/... or https://..."
                    className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                  />
                </div>

                <div>
                  <div className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Or Pick from Verified Campus Photos:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_FACILITY_IMAGES.map((preset) => (
                      <button
                        key={preset.path}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, image: preset.path })}
                        className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                          editForm.image === preset.path
                            ? "bg-[#0F5132] text-white border-[#0F5132]"
                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-yellow-100/70 hover:text-yellow-950"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileUpload}
                    accept="image/*"
                    aria-label="Upload custom facility image file"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-600 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    <UploadSimple size={14} />
                    <span>Upload Local Image File</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Core Details & Capacity */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700/80 space-y-4">
            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Venue Identity & Operational Parameters
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label htmlFor="edit-facility-name" className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Facility Name:
                </label>
                <input
                  id="edit-facility-name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>

              <div>
                <label htmlFor="edit-facility-code" className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Inventory Code:
                </label>
                <input
                  id="edit-facility-code"
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>

              <div>
                <label htmlFor="edit-facility-status" className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Status:
                </label>
                <select
                  id="edit-facility-status"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value as FacilityStatus })
                  }
                  className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="BOOKED">Booked</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-facility-capacity" className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Seating Capacity (Pax):
                </label>
                <input
                  id="edit-facility-capacity"
                  type="number"
                  min="1"
                  max="5000"
                  value={editForm.capacity}
                  onChange={(e) =>
                    setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 0 })
                  }
                  className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>

              <div>
                <label htmlFor="edit-facility-hours" className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Operating Hours:
                </label>
                <input
                  id="edit-facility-hours"
                  type="text"
                  value={editForm.operatingHours}
                  onChange={(e) => setEditForm({ ...editForm, operatingHours: e.target.value })}
                  placeholder="07:00 AM - 10:00 PM"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>

              <div>
                <label htmlFor="edit-facility-floor" className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Floor Assignment:
                </label>
                <input
                  id="edit-facility-floor"
                  type="text"
                  value={editForm.floor}
                  onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                  placeholder="2nd Floor"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label htmlFor="edit-facility-location" className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Building Location:
                </label>
                <input
                  id="edit-facility-location"
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>

              <div>
                <label htmlFor="edit-facility-building" className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Building Complex Name:
                </label>
                <input
                  id="edit-facility-building"
                  type="text"
                  value={editForm.building}
                  onChange={(e) => setEditForm({ ...editForm, building: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Assigned Custodian */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Assigned Custodian Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-facility-custodian" className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Custodian Name & Title:
                </label>
                <input
                  id="edit-facility-custodian"
                  type="text"
                  value={editForm.contactPerson}
                  onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>
              <div>
                <label htmlFor="edit-facility-email" className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Custodian Email:
                </label>
                <input
                  id="edit-facility-email"
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Facility Overview */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700/80 space-y-2">
            <label htmlFor="edit-facility-desc" className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Facility Overview & Description:
            </label>
            <textarea
              id="edit-facility-desc"
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full p-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132] leading-relaxed"
            />
          </div>

          {/* Section 5: Included Resources & Equipment */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Included Resources & Equipment
            </div>
            <div className="flex flex-wrap gap-2">
              {editForm.availableResources.map((res, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold"
                >
                  <span>{res}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveResource(idx)}
                    aria-label={`Remove resource: ${res}`}
                    className="hover:text-rose-600 transition-colors"
                  >
                    <X size={13} weight="bold" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1 max-w-md">
              <input
                type="text"
                placeholder="New resource (e.g. Laser Projector)..."
                aria-label="Add new resource name"
                value={newResource}
                onChange={(e) => setNewResource(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddResource())}
                className="flex-1 h-9 px-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
              />
              <button
                type="button"
                onClick={handleAddResource}
                aria-label="Add resource"
                className="h-9 px-3 rounded-xl bg-[#0F5132] hover:bg-[#0A3622] text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus size={14} weight="bold" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Section 6: Venue Amenities & Technical Capabilities */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Venue Amenities & Technical Capabilities
            </div>
            <div className="space-y-1.5">
              {editForm.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle size={15} weight="fill" className="text-[#0F5132] dark:text-emerald-400" />
                    <span className="text-zinc-800 dark:text-zinc-200">{feat}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    aria-label={`Remove feature: ${feat}`}
                    className="text-zinc-400 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1 max-w-lg">
              <input
                type="text"
                placeholder="New amenity / capability (e.g. DMX Stage Lighting)..."
                aria-label="Add new amenity or technical capability"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFeature())}
                className="flex-1 h-9 px-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                aria-label="Add amenity"
                className="h-9 px-3 rounded-xl bg-[#0F5132] hover:bg-[#0A3622] text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus size={14} weight="bold" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Section 7: Usage Guidelines & Compliance */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Usage Guidelines & Compliance Rules
            </div>
            <div className="space-y-1.5">
              {editForm.guidelines.map((guide, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300 text-[11px] leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] mt-1.5 shrink-0" />
                    <span>{guide}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGuideline(idx)}
                    aria-label={`Remove guideline: ${guide}`}
                    className="text-zinc-400 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="New policy or requirement rule..."
                aria-label="Add new policy or compliance rule"
                value={newGuideline}
                onChange={(e) => setNewGuideline(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddGuideline())}
                className="flex-1 h-9 px-3 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
              />
              <button
                type="button"
                onClick={handleAddGuideline}
                aria-label="Add rule"
                className="h-9 px-3 rounded-xl bg-[#0F5132] hover:bg-[#0A3622] text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus size={14} weight="bold" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. REGULAR VIEW MODE (Visible to Students, Faculty, and Admin)           */
        /* ========================================================================= */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN ON DESKTOP (5 cols) / TOP ON MOBILE: Image, Status, Custodian */}
            <div className="lg:col-span-5 space-y-4">
              {/* Facility Photo Header */}
              <div className="relative h-56 sm:h-64 lg:h-64 w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-sm border border-zinc-200/80 dark:border-zinc-800">
                <Image
                  src={facility.image}
                  alt={facility.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized={facility.image.startsWith("data:")}
                />
                <div className="absolute top-3 right-3 z-10">
                  <StatusBadge status={facility.status} />
                </div>
                <div className="absolute bottom-3 left-3 right-3 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users size={14} /> Cap: {facility.capacity} pax
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock size={14} /> {facility.operatingHours}
                  </span>
                </div>
              </div>

              {/* Quick Specs Pill Box */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Building Location:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{facility.location}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Floor Assignment:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{facility.floor}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Inventory Code:</span>
                  <span className="font-mono font-bold text-[#0F5132] dark:text-emerald-400">{facility.code}</span>
                </div>
              </div>

              {/* Facility Custodian Card */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 space-y-2 text-xs">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Assigned Custodian
                </div>
                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                  {facility.contactPerson}
                </div>
                <div className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 text-[11px]">
                  <EnvelopeSimple size={13} className="shrink-0 text-[#0F5132]" />
                  <span className="truncate">{facility.contactEmail}</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN ON DESKTOP (7 cols) / BOTTOM ON MOBILE: Details, Amenities, Guidelines, Resources */}
            <div className="lg:col-span-7 space-y-5">
              {/* Overview */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Facility Overview
                </h4>
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {facility.description}
                </p>
              </div>

              {/* On-Site Resources Badges */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Included Resources & Equipment
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {facility.availableResources.map((res) => (
                    <span
                      key={res}
                      className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium"
                    >
                      {res}
                    </span>
                  ))}
                </div>
              </div>

              {/* Venue Amenities & Technical Capabilities */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Venue Amenities & Technical Capabilities
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {facility.features.map((feat) => (
                    <div
                      key={feat}
                      className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800"
                    >
                      <CheckCircle
                        size={15}
                        weight="fill"
                        className="text-[#0F5132] dark:text-emerald-400 shrink-0 mt-0.5"
                      />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operating Guidelines */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Usage Guidelines & Compliance
                </h4>
                <ul className="space-y-1.5 bg-zinc-50/50 dark:bg-zinc-800/30 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs">
                  {facility.guidelines.map((guide, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] mt-1.5 shrink-0" />
                      <span>{guide}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Schedule Preview Section */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#0F5132] dark:text-emerald-400" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Upcoming Venue Schedule Preview
                </h4>
              </div>
              <button
                onClick={() => {
                  onClose();
                  setActiveTab("calendar");
                }}
                className="text-xs text-[#0F5132] dark:text-emerald-400 font-medium hover:underline text-left sm:text-right"
              >
                Open Full Master Calendar →
              </button>
            </div>

            {upcomingReservations.length === 0 ? (
              <div className="p-5 text-center text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800">
                No active reservations scheduled for this facility. It is completely available for booking!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {upcomingReservations.map((res) => (
                  <div
                    key={res.id}
                    className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {res.eventName}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {res.date} · {res.startTime} - {res.endTime}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        Requested by: {res.userName}
                      </div>
                    </div>
                    <StatusBadge status={res.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
