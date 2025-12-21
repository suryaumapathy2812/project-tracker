"use client";

import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { OrgDropdown } from "./org-dropdown";
import { BatchDropdown } from "./batch-dropdown";
import { NavTabs } from "./nav-tabs";
import { UserButton } from "@/components/auth/user-button";
import { useNavigationOptional } from "@/lib/contexts/navigation-context";

export function DashboardHeader() {
  const navigation = useNavigationOptional();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      {/* Row 1: Logo > Org Dropdown > Batch Dropdown > User */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link
            href={
              navigation?.currentOrg ? `/${navigation.currentOrg.slug}` : "/"
            }
            className="flex items-center gap-2"
          >
            <div>
              <FolderKanban className="h-4 w-4" />
            </div>
          </Link>

          {/* Breadcrumb with dropdowns - only show if we have navigation context */}
          {navigation && (
            <>
              <span className="text-gray-400">/</span>

              {/* At org level: show org name as static text, no dropdown */}
              {/* At batch level: show org dropdown for navigation */}
              {navigation.isOrgLevel ? (
                <span className="text-sm font-medium">
                  {navigation.currentOrg?.name}
                </span>
              ) : (
                <OrgDropdown />
              )}

              {/* Show batch dropdown only at batch level */}
              {navigation.isBatchLevel &&
                navigation.availableBatches.length > 0 && (
                  <>
                    <span className="text-gray-400">/</span>
                    <BatchDropdown />
                  </>
                )}
            </>
          )}
        </div>

        {/* User Button */}
        <UserButton />
      </div>

      {/* Row 2: Navigation Tabs */}
      <div className="px-4 sm:px-6 lg:px-8">
        <NavTabs />
      </div>
    </header>
  );
}
