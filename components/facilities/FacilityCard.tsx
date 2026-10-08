"use client";

import React from "react";
import Image from "next/image";
import { Facility } from "../../types";
import { StatusBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  Users,
  MapPin,
  ArrowRight,
  Sparkle,
} from "@phosphor-icons/react";

interface FacilityCardProps {
  facility: Facility;
  onViewDetails: (facility: Facility) => void;
  onReserve: (facility: Facility) => void;
}

export function FacilityCard({
  facility,
  onViewDetails,
  onReserve,
}: FacilityCardProps) {
  const isAvailable = facility.status === "AVAILABLE";

  return (
    // Outer Shell (Double-Bezel Doppelrand architecture)
    <div className="group/card p-1.5 rounded-[2rem] bg-zinc-200/60 dark:bg-zinc-800/50 ring-1 ring-black/[0.05] dark:ring-white/[0.08] hover:bg-zinc-300/60 dark:hover:bg-zinc-700/50 hover:shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col h-full hover:-translate-y-1">
      {/* Inner Core */}
      <div className="w-full h-full rounded-[calc(2rem-0.375rem)] bg-white dark:bg-zinc-900 border border-black/[0.03] dark:border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] overflow-hidden flex flex-col justify-between">
        
        {/* Facility Image with Bezel & Badges */}
        <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={facility.image}
            alt={facility.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover/card:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

          {/* Status Pill in Corner */}
          <div className="absolute top-3 right-3 z-10">
            <StatusBadge status={facility.status} />
          </div>

          {/* Code Tag & Capacity overlay at bottom */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
            <span className="font-mono text-[11px] font-semibold tracking-wider px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
              {facility.code}
            </span>
            <span className="flex items-center gap-1.5 font-medium px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
              <Users size={13} weight="bold" />
              <span>Cap: {facility.capacity} pax</span>
            </span>
          </div>
        </div>

        {/* Card Content Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Header & Location */}
            <div className="mb-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight group-hover/card:text-[#0F5132] dark:group-hover/card:text-emerald-400 transition-colors">
                {facility.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                <MapPin size={14} className="shrink-0 text-[#0F5132] dark:text-emerald-400" />
                <span className="truncate">{facility.location} · {facility.floor}</span>
              </div>
            </div>

            {/* Description snippet */}
            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4">
              {facility.description}
            </p>

            {/* Available Resources Tags */}
            <div className="mb-4">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                Installed Resources
              </div>
              <div className="flex flex-wrap gap-1.5">
                {facility.availableResources.slice(0, 3).map((res) => (
                  <span
                    key={res}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-medium"
                  >
                    {res}
                  </span>
                ))}
                {facility.availableResources.length > 3 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 font-medium">
                    +{facility.availableResources.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions with Button-in-Button CTA */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              pill
              onClick={() => onViewDetails(facility)}
              className="flex-1 text-xs min-h-[44px]"
            >
              Specs & Rules
            </Button>
            <Button
              variant="primary"
              size="sm"
              pill
              disabled={!isAvailable}
              onClick={() => onReserve(facility)}
              className="flex-1 text-xs min-h-[44px]"
              trailingIcon={<ArrowRight size={12} weight="bold" />}
            >
              {isAvailable ? "Reserve" : "Occupied"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

