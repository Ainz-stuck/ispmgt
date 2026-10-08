"use client";

import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ResourceItem, ResourceCondition } from "../../types";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Input, Select } from "../ui/Input";
import {
  Package,
  Wrench,
  CheckCircle,
  WarningCircle,
  PlusCircle,
  ArrowRight,
} from "@phosphor-icons/react";

export function ResourcesView() {
  const { resources, updateResourceCondition, updateResourceQuantity, currentUser } = useApp();

  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [newCondition, setNewCondition] = useState<ResourceCondition>("EXCELLENT");
  const [newTotal, setNewTotal] = useState<number>(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAdmin = currentUser.role === "ADMINISTRATOR";

  const handleOpenEdit = (res: ResourceItem) => {
    setSelectedResource(res);
    setNewCondition(res.condition);
    setNewTotal(res.totalQuantity);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedResource) return;
    updateResourceCondition(selectedResource.id, newCondition);
    updateResourceQuantity(selectedResource.id, newTotal);
    setIsModalOpen(false);
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
          <div className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-[#0F5132] font-semibold flex items-center gap-1.5">
            <CheckCircle size={15} weight="fill" />
            <span>Admin Inventory Management Active</span>
          </div>
        )}
      </div>

      {/* Resource Inventory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((item) => {
          const pct = Math.round((item.availableQuantity / item.totalQuantity) * 100);

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
                  Allocation: <strong className="text-zinc-700 dark:text-zinc-300">Campus-Wide</strong> across all 6 facilities
                </div>
              </CardBody>

              {isAdmin && (
                <div className="p-3 bg-zinc-50/70 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    icon={<Wrench size={14} />}
                    className="text-xs min-h-[44px] sm:min-h-0 sm:h-8 w-full sm:w-auto justify-center"
                  >
                    Adjust Inventory / Condition
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Edit Resource Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Adjust Equipment: ${selectedResource?.name}`}
        subtitle="Administrator inventory and maintenance tracking"
        maxWidth="md"
        footer={
          <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="min-h-[44px] sm:min-h-0"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              className="min-h-[44px] sm:min-h-0"
            >
              Save Adjustments
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Total Campus Inventory Quantity"
            type="number"
            min={1}
            value={newTotal}
            onChange={(e) => setNewTotal(Number(e.target.value))}
            helperText="Updates central physical asset count."
          />

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
    </div>
  );
}
