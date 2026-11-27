"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WarningCircle, ArrowClockwise } from "@phosphor-icons/react";
import { Button } from "../components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAFAFB] dark:bg-[#09090B] font-sans">
      <div className="max-w-md w-full p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto ring-1 ring-rose-500/20">
          <WarningCircle size={26} weight="fill" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Unable to Display UniSpace View
          </h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            An unexpected application error occurred while rendering this screen. Your saved database records remain unaffected.
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-zinc-400">Reference: {error.digest}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => reset()}
            icon={<ArrowClockwise size={15} weight="bold" />}
          >
            Retry View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/")}
          >
            Reload Portal
          </Button>
        </div>
      </div>
    </div>
  );
}
