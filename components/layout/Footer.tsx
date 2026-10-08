import React from "react";
import { Buildings, EnvelopeSimple, Phone, ShieldCheck, MapPin } from "@phosphor-icons/react";

export function Footer() {
  return (
    <footer className="mt-auto bg-zinc-900 text-zinc-300 border-t border-zinc-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: System Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0F5132] flex items-center justify-center text-white">
                <Buildings size={16} weight="bold" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                UniSpace
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Official University Facility Booking & Resource Scheduling Platform.
              Centralized venue allocation, real-time availability, and resource logistics.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Central System Operational · Greenwich Campus
            </div>
          </div>

          {/* Col 2: Six Managed Facilities */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Managed Facilities (6)
            </h4>
            <ul className="space-y-1.5 text-zinc-400">
              <li>1. Function Hall (Cap. 350)</li>
              <li>2. Dining Hall (Cap. 200)</li>
              <li>3. Gym (Cap. 500)</li>
              <li>4. Dance Hall (Cap. 80)</li>
              <li>5. AVR - Audio Visual Room (Cap. 120)</li>
              <li>6. Rooftop Engineering Building (Cap. 150)</li>
            </ul>
          </div>

          {/* Col 3: Operational Policies */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Booking Protocols
            </h4>
            <ul className="space-y-1.5 text-zinc-400">
              <li>Lead Time: 3 Business Days</li>
              <li>Faculty Priority Review Window</li>
              <li>Automatic Conflict & Double-Booking Guard</li>
              <li>Resource Inventory Allocation & Tracking</li>
              <li>Post-Event Custodial Sign-Off</li>
            </ul>
          </div>

          {/* Col 4: Facility Operations Office */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Facility Operations Helpdesk
            </h4>
            <div className="space-y-2 text-zinc-400">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Administration Complex, Room 104</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-emerald-400 shrink-0" />
                <span>+1 (800) 555-UNIV (Ext. 2041)</span>
              </div>
              <div className="flex items-center gap-2">
                <EnvelopeSimple size={15} className="text-emerald-400 shrink-0" />
                <span>facilities@university.edu</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
                <span>Campus Security: Ext. 9110 (24/7)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 text-[11px]">
          <div>
            © 2026 Greenwich University Facility & Resource Management System. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-zinc-400 cursor-pointer">Terms of Facility Use</span>
            <span>·</span>
            <span className="hover:text-zinc-400 cursor-pointer">Safety Guidelines</span>
            <span>·</span>
            <span className="hover:text-zinc-400 cursor-pointer">Asset Recovery Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
