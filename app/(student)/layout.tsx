"use client";

import { StudentProvider } from "@/lib/providers/student-provider";
import { StudentHeader } from "@/components/layout/student-header";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentProvider>
      <StudentHeader />
      <div className="relative flex-1 overflow-auto bg-[#faf9f7] dark:bg-[#0a0a0a]">
        {/* Grain texture */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </StudentProvider>
  );
}
