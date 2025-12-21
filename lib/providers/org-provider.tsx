"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";
import { useOrgStore } from "@/lib/stores/org-store";
import { useAuth } from "@/lib/auth-provider";
import { Spinner } from "@/components/ui/spinner";

interface OrgProviderProps {
  children: ReactNode;
}

export function OrgProvider({ children }: OrgProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const { data: session, isPending: isSessionPending } = useSession();
  const { refreshAuth } = useAuth();

  const {
    orgs,
    activeOrgSlug,
    isInitialized,
    setOrgs,
    setActiveOrg,
    setBatches,
    setActiveBatch,
    setLoading,
    setInitialized,
    reset,
  } = useOrgStore();

  // Fetch user's organizations
  const {
    data: fetchedOrgs,
    isLoading: isOrgsLoading,
    isSuccess: isOrgsSuccess,
  } = trpc.organizations.listForUser.useQuery(undefined, {
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get org slug from URL params
  const urlOrgSlug = params?.orgSlug as string | undefined;
  const urlBatchSlug = params?.batchSlug as string | undefined;

  // Handle session state
  useEffect(() => {
    if (isSessionPending) return;

    if (!session?.user) {
      // No session - redirect to login
      reset();
      router.replace("/login");
    }
  }, [session, isSessionPending, router, reset]);

  // Sync fetched orgs to store
  useEffect(() => {
    if (isOrgsSuccess && fetchedOrgs) {
      setOrgs(fetchedOrgs);
      setLoading(false);
    }
  }, [fetchedOrgs, isOrgsSuccess, setOrgs, setLoading]);

  // Handle org routing and active org selection
  useEffect(() => {
    if (isSessionPending || isOrgsLoading || !fetchedOrgs) return;

    const syncOrgAndRoute = async () => {
      const orgsData = fetchedOrgs;

      // Check if user is a student - redirect to /my
      const userRole = (
        (session?.user as { role?: string })?.role || "student"
      ).toLowerCase();

      if (userRole === "student" && !pathname.startsWith("/my")) {
        router.replace("/my");
        setInitialized(true);
        return;
      }

      // No orgs - redirect to home
      if (orgsData.length === 0) {
        setInitialized(true);
        router.replace("/");
        return;
      }

      // If we have a URL org slug, validate and set it
      if (urlOrgSlug) {
        const matchingOrg = orgsData.find((o) => o.slug === urlOrgSlug);
        if (matchingOrg) {
          // Valid org in URL - set as active in local store
          setActiveOrg(matchingOrg.id, matchingOrg.slug);

          // Get current active org from session to avoid unnecessary API calls
          const currentActiveOrgId = (session as { session?: { activeOrganizationId?: string } })?.session?.activeOrganizationId;

          // Only sync with Better Auth if org is different from current active
          if (currentActiveOrgId !== matchingOrg.id) {
            try {
              await authClient.organization.setActive({
                organizationId: matchingOrg.id,
              });
              // Trigger AuthProvider to re-fetch and update cached role
              await refreshAuth();
            } catch (error) {
              console.error("Failed to sync org with Better Auth:", error);
            }
          }
          setInitialized(true);
          return;
        } else {
          // Invalid org slug in URL - redirect to first org
          router.replace(`/${orgsData[0].slug}`);
          return;
        }
      }

      // No org in URL - this is /redirect or similar
      // Check for persisted org preference
      const persistedSlug = activeOrgSlug;
      if (persistedSlug) {
        const persistedOrg = orgsData.find((o) => o.slug === persistedSlug);
        if (persistedOrg) {
          // Redirect to persisted org
          router.replace(`/${persistedOrg.slug}`);
          return;
        }
      }

      // Default to first org
      router.replace(`/${orgsData[0].slug}`);
    };

    syncOrgAndRoute();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshAuth intentionally omitted to prevent infinite loop
  }, [
    isSessionPending,
    isOrgsLoading,
    fetchedOrgs,
    urlOrgSlug,
    activeOrgSlug,
    router,
    pathname,
    session,
    setActiveOrg,
    setInitialized,
  ]);

  // Fetch batches when org changes
  const activeOrg = orgs.find((o) => o.slug === urlOrgSlug);
  const { data: orgDetails } = trpc.organizations.getBySlug.useQuery(
    { slug: urlOrgSlug! },
    {
      enabled: !!urlOrgSlug && !!activeOrg,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Sync batches to store
  useEffect(() => {
    if (orgDetails?.batches) {
      setBatches(orgDetails.batches);

      // Set active batch from URL if present
      if (urlBatchSlug) {
        const matchingBatch = orgDetails.batches.find(
          (b) => b.slug === urlBatchSlug
        );
        if (matchingBatch) {
          setActiveBatch(matchingBatch.id, matchingBatch.slug);
        } else {
          setActiveBatch(null, null);
        }
      } else {
        setActiveBatch(null, null);
      }
    }
  }, [orgDetails, urlBatchSlug, setBatches, setActiveBatch]);

  // Show loading while checking session, fetching orgs, or initializing
  // Wait for isInitialized to ensure role is properly loaded after refreshAuth()
  if (isSessionPending || (session?.user && (isOrgsLoading || !isInitialized))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children until we have a valid session
  if (!session?.user) {
    return null;
  }

  return <>{children}</>;
}
