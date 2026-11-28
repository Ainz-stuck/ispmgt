"use client";

import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { hasPermission } from "../../lib/rbac";
import { FacilityId, ResourceCategory, ResourceCondition, ResourceItem } from "../../types";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Input, Select } from "../ui/Input";
import {
  Wrench,
  CheckCircle,
  PlusCircle,
  Trash,
} from "@phosphor-icons/react";

export function ResourcesView() {
  const {
    resources,
    facilities,
    createResource,
    updateResource,
    deleteResource,
    currentUser,
  } = useApp();

  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<ResourceItem | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("AV_EQUIPMENT");
  const [facilityScope, setFacilityScope] = useState<FacilityId | "CAMPUS_WIDE">("CAMPUS_WIDE");
  const [unit, setUnit] = useState("Units");
  const [newCondition, setNewCondition] = useState<ResourceCondition>("EXCELLENT");
  const [newTotal, setNewTotal] = useState<number>(10);
  const [newAvailable, setNewAvailable] = useState<number>(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isAdmin = hasPermission(currentUser.role, "RESOURCE_MANAGE");

  const handleOpenCreate = () => {
    setSelectedResource(null);
    setName("");
    setCategory("AV_EQUIPMENT");
    setFacilityScope("CAMPUS_WIDE");
    setUnit("Units");
    setNewCondition("EXCELLENT");
    setNewTotal(10);
    setNewAvailable(10);
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: ResourceItem) => {
    setSelectedResource(res);
    setName(res.name);
    setCategory(res.category);
    setFacilityScope(res.facilityScope || "CAMPUS_WIDE");
    setUnit(res.unit || "Units");
    setNewCondition(res.condition);
    setNewTotal(res.totalQuantity);
    setNewAvailable(res.availableQuantity);
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveError("Equipment name is required.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    const safeTotal = Math.max(0, Math.floor(Number.isFinite(newTotal) ? newTotal : 0));
    const safeAvailable = Math.min(
      Math.max(0, Math.floor(Number.isFinite(newAvailable) ? newAvailable : safeTotal)),
      safeTotal
    );

    const basePayload = {
      name: name.trim(),
      category,
      facilityScope,
      unit: unit.trim() || "Units",
      condition: newCondition,
      totalQuantity: safeTotal,
    };

    const result = selectedResource
      ? await updateResource(selectedResource.id, {
          ...basePayload,
          // Omit availableQuantity unless explicitly changed so concurrent booking deductions aren't clobbered.
          ...(safeAvailable !== selectedResource.availableQuantity
            ? { availableQuantity: safeAvailable }
            : {}),
        })
      : await createResource({ ...basePayload, availableQuantity: safeAvailable });

    setIsSaving(false);
    if (!result.success) {
      setSaveError(result.error || "Failed to save equipment record.");
      return;
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    setIsSaving(true);
    setDeleteError(null);
    const result = await deleteResource(resourceToDelete.id);
    setIsSaving(false);
    if (!result.success) {
      setDeleteError(result.error || "Failed to delete equipment item.");
      return;
    }
    setResourceToDelete(null);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Campus Resource & Equipment Inventory
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Centralized inventory tracking for multimedia systems, audio gear, and event furniture
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-[#0F5132] font-semibold flex items-center gap-1.5">
              <CheckCircle size={15} weight="fill" />
              <span>Admin Inventory Management Active</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              icon={<PlusCircle size={15} weight="bold" />}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              Add Equipment
            </Button>
          </div>
        )}
      </div>

      {/* Resource Inventory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        {resources.map((item) => {
          const pct =
            item.totalQuantity > 0
              ? Math.min(100, Math.round((item.availableQuantity / item.totalQuantity) * 100))
              : 0;

          return (
            <Card key={item.id} className="flex flex-col justify-between">
              <CardHeader className="bg-zinc-50/50 dark:bg-zinc-800/40">
                <div>
                  <div className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {item.name}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
                    {item.category}
                  </span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                    item.condition === "EXCELLENT"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : item.condition === "GOOD"
                      ? "bg-blue-50 text-blue-800 border-blue-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}
                >
                  {item.condition}
                </span>
              </CardHeader>

              <CardBody className="space-y-4">
                {/* Stock Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-400 block text-[10px] uppercase">
                      Available Stock
                    </span>
                    <strong className="text-lg text-[#0F5132] dark:text-emerald-400">
                      {item.availableQuantity}
                    </strong>{" "}
                    <span className="text-zinc-500 text-[11px]">{item.unit}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-400 block text-[10px] uppercase">
                      Total Inventory
                    </span>
                    <strong className="text-lg text-zinc-900 dark:text-zinc-100">
                      {item.totalQuantity}
                    </strong>{" "}
                    <span className="text-zinc-500 text-[11px]">{item.unit}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-500 text-[11px]">
                    <span>Availability Ratio</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0F5132]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500">
                  Allocation:{" "}
                  <strong className="text-zinc-700 dark:text-zinc-300">
                    {item.facilityScope === "CAMPUS_WIDE"
                      ? "Campus-Wide"
                      : facilities.find((f) => f.id === item.facilityScope)?.name || item.facilityScope}
                  </strong>
                </div>
              </CardBody>

              {isAdmin && (
                <div className="p-3 bg-zinc-50/70 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeleteError(null);
                      setResourceToDelete(item);
                    }}
                    icon={<Trash size={14} />}
                    className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50 min-h-[44px] sm:min-h-0 sm:h-8"
                  >
                    Delete
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    icon={<Wrench size={14} />}
                    className="text-xs min-h-[44px] sm:min-h-0 sm:h-8 flex-1 sm:flex-initial justify-center"
                  >
                    Edit Item
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Create / Edit Resource Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title={selectedResource ? `Edit Equipment: ${selectedResource.name}` : "Add Campus Equipment"}
        subtitle="Administrator inventory and maintenance tracking"
        maxWidth="md"
        footer={
          <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              disabled={isSaving}
              onClick={() => setIsModalOpen(false)}
              className="min-h-[44px] sm:min-h-0"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isSaving}
              onClick={handleSave}
              className="min-h-[44px] sm:min-h-0"
            >
              {selectedResource ? "Save Changes" : "Create Equipment"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {saveError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {saveError}
            </div>
          )}
          <Input
            label="Equipment Name"
            placeholder="e.g. LED Stage Spotlight Kit"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ResourceCategory)}
              options={[
                { value: "AV_EQUIPMENT", label: "AV Equipment" },
                { value: "AUDIO", label: "Audio System" },
                { value: "FURNITURE", label: "Furniture" },
                { value: "DISPLAY", label: "Display & Projection" },
              ]}
            />
            <Input
              label="Measurement Unit"
              placeholder="e.g. Units, Chairs, Sets"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <Select
            label="Allocation Scope"
            value={facilityScope}
            onChange={(e) => setFacilityScope(e.target.value as FacilityId | "CAMPUS_WIDE")}
            options={[
              { value: "CAMPUS_WIDE", label: "Campus-Wide Warehouse" },
              ...facilities.map((f) => ({ value: f.id, label: f.name })),
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Total Inventory Quantity"
              type="number"
              min={0}
              value={newTotal}
              onChange={(e) => {
                const next = Math.max(0, Number(e.target.value));
                setNewTotal(next);
                if (!selectedResource) {
                  setNewAvailable(next);
                } else if (newAvailable > next) {
                  setNewAvailable(next);
                }
              }}
            />
            <Input
              label="Available Stock"
              type="number"
              min={0}
              max={newTotal}
              value={newAvailable}
              onChange={(e) => setNewAvailable(Math.max(0, Math.min(Number(e.target.value), newTotal)))}
            />
          </div>

          <Select
            label="Equipment Operational Condition"
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value as ResourceCondition)}
            options={[
              { value: "EXCELLENT", label: "Excellent - Fully Certified & Calibrated" },
              { value: "GOOD", label: "Good - Normal Operating Wear" },
              { value: "FAIR", label: "Fair - Functional, Requires Inspection" },
              { value: "UNDER_REPAIR", label: "Under Repair - Temporarily Decommissioned" },
            ]}
          />
        </div>
      </Modal>

      {/* Delete Resource Confirmation Modal */}
      <Modal
        isOpen={!!resourceToDelete}
        onClose={() => !isSaving && setResourceToDelete(null)}
        title="Delete Equipment Item"
        subtitle="Past reservation records preserve item names automatically."
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              disabled={isSaving}
              onClick={() => setResourceToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isSaving}
              onClick={handleConfirmDelete}
              icon={<Trash size={14} weight="bold" />}
            >
              Delete Permanently
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
              {deleteError}
            </div>
          )}
          <p>
            Are you sure you want to delete <strong>{resourceToDelete?.name}</strong> from the campus equipment inventory?
          </p>
        </div>
      </Modal>
    </div>
  );
}
