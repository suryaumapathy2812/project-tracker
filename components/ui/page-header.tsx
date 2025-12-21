"use client";

import { Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "w-full flex flex-col gap-4 sm:flex-row sm:items-center justify-between",
        className,
      )}
    >
      <div className="space-y-1.5">
        <h1
          className={cn(
            instrumentSerif.className,
            "text-4xl tracking-[-0.02em] text-stone-900 dark:text-stone-100",
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          {children}
        </div>
      )}
    </div>
  );
}
