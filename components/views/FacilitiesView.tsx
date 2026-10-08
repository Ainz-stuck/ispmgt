"use client";

import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Facility, FacilityStatus } from "../../types";
import { FacilityCard } from "../facilities/FacilityCard";
import { Button } from "../ui/Button";
import { MagnifyingGlass, Funnel, PlusCircle, CheckCircle } from "@phosphor-icons/react";

export function FacilitiesView() {
  const {
    facilities,
    setSelectedFacilityId,
    openBookingModal,
    currentUser,
    updateFacilityStatus,
  } = useApp();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [capacityFilter, setCapacityFilter] = useState<string>("ALL");

  const filtered = facilities.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase()) ||
      f.building.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || f.status === statusFilter;

    let matchesCapacity = true;
    if (capacityFilter === "SMALL") matchesCapacity = f.capacity <= 100;
    else if (capacityFilter === "MEDIUM") matchesCapacity = f.capacity > 100 && f.capacity <= 250;
    else if (capacityFilter === "LARGE") matchesCapacity = f.capacity > 250;

    return matchesSearch && matchesStatus && matchesCapacity;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title & Search/Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            University Facilities Directory
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl">
            Certified campus facilities managed by Greenwich Central Operations. Select any venue to
            inspect floor plans, available equipment, and calendar reservations.
          </p>
        </div>

        <Button
          onClick={() => openBookingModal()}
          icon={<PlusCircle size={16} weight="bold" />}
          className="shrink-0 min-h-[44px] w-full sm:w-auto"
        >
          Book a Venue
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1 w-full">
          <MagnifyingGlass
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search venue name, building, or location..."
            aria-label="Search venues by name, building, or location"
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
            aria-label="Filter venues by operational status"
            className="min-h-[44px] h-11 sm:h-10 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available Only</option>
            <option value="MAINTENANCE">Under Maintenance</option>
            <option value="BOOKED">Occupied</option>
          </select>

          {/* Capacity Filter */}
          <select
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
            aria-label="Filter venues by seating capacity"
            className="min-h-[44px] h-11 sm:h-10 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
          >
            <option value="ALL">All Capacities</option>
            <option value="SMALL">Small (up to 100)</option>
            <option value="MEDIUM">Medium (100 - 250)</option>
            <option value="LARGE">Large (250+)</option>
          </select>
        </div>
      </div>

      {/* Facilities Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">
            No university facilities match your active filter criteria.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setCapacityFilter("ALL");
            }}
            className="mt-3"
          >
            Reset All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              onViewDetails={() => setSelectedFacilityId(facility.id)}
              onReserve={() => openBookingModal(facility.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
