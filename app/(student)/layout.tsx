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
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </StudentProvider>
  );
}
