"use client";

import React, { createContext, useContext, useState } from "react";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className = "",
}: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalTab;

  const setActiveTab = (id: string) => {
    if (value === undefined) {
      setInternalTab(id);
    }
    onValueChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-400 overflow-x-auto no-scrollbar max-w-full ${className}`}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  icon,
  className = "",
  disabled = false,
}: {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");

  const isSelected = context.activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => context.setActiveTab(value)}
      className={`relative inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] select-none whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] ${
        isSelected
          ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50 shadow-xs border border-zinc-200/60 dark:border-zinc-700/60"
          : "hover:text-yellow-950 dark:hover:text-yellow-200 hover:bg-yellow-100/90 dark:hover:bg-yellow-500/20 hover:ring-1 hover:ring-yellow-400/40"
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className = "",
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");

  if (context.activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      className={`focus-visible:outline-none mt-4 transition-opacity duration-300 ${className}`}
    >
      {children}
    </div>
  );
}
