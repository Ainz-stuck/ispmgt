import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  outerClassName?: string;
  hoverEffect?: boolean;
  doubleBezel?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  outerClassName = "",
  hoverEffect = false,
  doubleBezel = true,
  onClick,
}: CardProps) {
  if (!doubleBezel) {
    return (
      <div
        onClick={onClick}
        className={`bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          hoverEffect
            ? "hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xl cursor-pointer hover:-translate-y-0.5"
            : "shadow-xs"
        } ${onClick ? "cursor-pointer" : ""} ${className}`}
      >
        {children}
      </div>
    );
  }

  // Double-Bezel (Doppelrand / Nested Architecture)
  return (
    <div
      onClick={onClick}
      className={`group/bezel p-1.5 rounded-[1.75rem] bg-zinc-200/60 dark:bg-zinc-800/50 ring-1 ring-black/[0.05] dark:ring-white/[0.08] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        hoverEffect ? "hover:bg-zinc-300/60 dark:hover:bg-zinc-700/50 hover:shadow-xl cursor-pointer" : "shadow-xs"
      } ${onClick ? "cursor-pointer" : ""} ${outerClassName}`}
    >
      <div
        className={`w-full h-full rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-zinc-900 border border-black/[0.03] dark:border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-6 py-4.5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-6 py-4 bg-zinc-50/70 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 ${className}`}
    >
      {children}
    </div>
  );
}

