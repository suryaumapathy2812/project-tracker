import { create } from "zustand";
import { persist } from "zustand/middleware";

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

interface OrgState {
  // User's organizations
  orgs: OrgInfo[];
  isLoading: boolean;
  isInitialized: boolean;

  // Active organization
  activeOrgId: string | null;
  activeOrgSlug: string | null;

  // Batches for active org
  batches: BatchInfo[];
  activeBatchId: string | null;
  activeBatchSlug: string | null;

  // Actions
  setOrgs: (orgs: OrgInfo[]) => void;
  setActiveOrg: (orgId: string | null, orgSlug: string | null) => void;
  setBatches: (batches: BatchInfo[]) => void;
  setActiveBatch: (batchId: string | null, batchSlug: string | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

const initialState = {
  orgs: [],
  isLoading: true,
  isInitialized: false,
  activeOrgId: null,
  activeOrgSlug: null,
  batches: [],
  activeBatchId: null,
  activeBatchSlug: null,
};

export const useOrgStore = create<OrgState>()(
  persist(
    (set) => ({
      ...initialState,

      setOrgs: (orgs) => set({ orgs }),

      setActiveOrg: (activeOrgId, activeOrgSlug) =>
        set({
          activeOrgId,
          activeOrgSlug,
          // Reset batch when org changes
          batches: [],
          activeBatchId: null,
          activeBatchSlug: null,
        }),

      setBatches: (batches) => set({ batches }),

      setActiveBatch: (activeBatchId, activeBatchSlug) =>
        set({ activeBatchId, activeBatchSlug }),

      setLoading: (isLoading) => set({ isLoading }),

      setInitialized: (isInitialized) => set({ isInitialized }),

      reset: () => set(initialState),
    }),
    {
      name: "org-storage",
      // Only persist activeOrgSlug for returning users
      partialize: (state) => ({
        activeOrgSlug: state.activeOrgSlug,
      }),
    }
  )
);

// Selector hooks for optimized re-renders
export const useActiveOrg = () =>
  useOrgStore((state) => ({
    id: state.activeOrgId,
    slug: state.activeOrgSlug,
    org: state.orgs.find((o) => o.id === state.activeOrgId) || null,
  }));

export const useOrgs = () => useOrgStore((state) => state.orgs);

export const useActiveBatch = () =>
  useOrgStore((state) => ({
    id: state.activeBatchId,
    slug: state.activeBatchSlug,
    batch: state.batches.find((b) => b.id === state.activeBatchId) || null,
  }));

export const useBatches = () => useOrgStore((state) => state.batches);

export const useOrgLoading = () =>
  useOrgStore((state) => ({
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
  }));
