"use client";

import { ReactNode } from "react";
import { useParams, usePathname } from "next/navigation";
import {
  NavigationProvider,
  type NavigationContextValue,
} from "@/lib/contexts/navigation-context";
import { useOrgStore } from "@/lib/stores/org-store";

interface NavigationBridgeProps {
  children: ReactNode;
  /** Whether this is at org level - if not specified, auto-detects from URL */
  isOrgLevel?: boolean;
  /** Whether this is at batch level - if not specified, auto-detects from URL */
  isBatchLevel?: boolean;
}

/**
 * Bridge component that connects the Zustand org store to the
 * existing NavigationProvider context. This allows existing
 * components using useNavigation() to continue working while
 * we migrate to Zustand.
 */
export function NavigationBridge({
  children,
  isOrgLevel: isOrgLevelProp,
  isBatchLevel: isBatchLevelProp,
}: NavigationBridgeProps) {
  const params = useParams();
  const pathname = usePathname();

  const { orgs, activeOrgId, batches, activeBatchId } = useOrgStore();

  // Auto-detect navigation level from URL if not explicitly provided
  const hasBatchSlug = !!params?.batchSlug;
  const hasOrgSlug = !!params?.orgSlug;
  // Check if we're in an org-level route (contains /~/ in path)
  const isOrgLevelRoute = pathname?.includes("/~/") ?? false;

  // Determine actual values: explicit props take precedence, otherwise auto-detect
  const isBatchLevel = isBatchLevelProp ?? hasBatchSlug;
  const isOrgLevel =
    isOrgLevelProp ?? ((hasOrgSlug && !hasBatchSlug) || isOrgLevelRoute);

  // Find current org from store
  const currentOrg = orgs.find((o) => o.id === activeOrgId) || null;

  // Find current batch from store
  const currentBatch = batches.find((b) => b.id === activeBatchId) || null;

  const contextValue: NavigationContextValue = {
    currentOrg: currentOrg
      ? {
          id: currentOrg.id,
          slug: currentOrg.slug,
          name: currentOrg.name,
          logo: currentOrg.logo,
        }
      : null,
    currentBatch: currentBatch
      ? {
          id: currentBatch.id,
          slug: currentBatch.slug,
          name: currentBatch.name,
        }
      : null,
    availableOrgs: orgs,
    availableBatches: batches,
    isOrgLevel,
    isBatchLevel,
  };

  return (
    <NavigationProvider value={contextValue}>{children}</NavigationProvider>
  );
}
