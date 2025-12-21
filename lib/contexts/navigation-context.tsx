"use client";

import { createContext, useContext, ReactNode } from "react";

export interface OrgInfo {
  id: string;
  slug: string;
  name: string;
  logo?: string | null;
}

export interface BatchInfo {
  id: string;
  slug: string;
  name: string;
}

export interface NavigationContextValue {
  /** Current organization from URL params */
  currentOrg: OrgInfo | null;
  /** Current batch from URL params (null if at org level or ~ route) */
  currentBatch: BatchInfo | null;
  /** All orgs the user has access to */
  availableOrgs: OrgInfo[];
  /** All batches in the current org */
  availableBatches: BatchInfo[];
  /** True if at /:orgSlug or /:orgSlug/~/* routes */
  isOrgLevel: boolean;
  /** True if at /:orgSlug/:batchSlug/* routes (not ~) */
  isBatchLevel: boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: NavigationContextValue;
}) {
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}

/**
 * Hook that returns navigation context or null if not available
 * Useful for components that might render outside navigation context
 */
export function useNavigationOptional() {
  return useContext(NavigationContext);
}
