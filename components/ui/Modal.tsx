"use client";

import React, { useEffect } from "react";
import { X } from "@phosphor-icons/react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  footer?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "2xl",
  footer,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 sm:bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog / Mobile Bottom Sheet */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-2xl shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 overflow-hidden transform transition-all my-0 sm:my-8 z-10 flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-sheet-up sm:animate-none`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="min-w-0 flex-1 pr-2">
            <h3
              id="modal-title"
              className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50 truncate"
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] shrink-0"
            aria-label="Close dialog"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4 bg-zinc-50/90 dark:bg-zinc-900/90 border-t border-zinc-100 dark:border-zinc-800 shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
