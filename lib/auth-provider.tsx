"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { authClient } from "./auth-client";
import type { UserRole } from "./auth";

// Types for auth context
interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface ActiveOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  role: UserRole;
  createdAt: Date;
}

interface AuthContextValue {
  // State
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  activeOrganization: ActiveOrganization | null;
  role: UserRole;

  // Actions
  refreshAuth: () => Promise<void>;
  setActiveOrganization: (orgId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeOrganization, setActiveOrgState] =
    useState<ActiveOrganization | null>(null);

  // Fetch session and active organization
  const fetchAuthState = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get session from Better Auth
      const sessionResult = await authClient.getSession();

      if (!sessionResult.data?.user) {
        setUser(null);
        setActiveOrgState(null);
        return;
      }

      const sessionUser = sessionResult.data.user;
      setUser({
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        image: sessionUser.image,
      });

      // Get active organization
      const activeOrgResult = await authClient.organization.getFullOrganization(
        {}
      );

      if (activeOrgResult.data) {
        const org = activeOrgResult.data;
        // Find the current user's membership to get their role
        const currentMember = org.members?.find(
          (m) => m.userId === sessionUser.id
        );

        setActiveOrgState({
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo: org.logo ?? null,
          role: (currentMember?.role as UserRole) || "student",
          createdAt: new Date(org.createdAt),
        });
      } else {
        setActiveOrgState(null);
      }
    } catch (error) {
      console.error("[AuthProvider] Error fetching auth state:", error);
      setUser(null);
      setActiveOrgState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchAuthState();
  }, [fetchAuthState]);

  // Refresh auth state
  const refreshAuth = useCallback(async () => {
    await fetchAuthState();
  }, [fetchAuthState]);

  // Set active organization
  const setActiveOrganization = useCallback(
    async (orgId: string) => {
      try {
        setIsLoading(true);
        await authClient.organization.setActive({
          organizationId: orgId,
        });
        // Refresh to get updated state
        await fetchAuthState();
      } catch (error) {
        console.error("[AuthProvider] Error setting active org:", error);
        throw error;
      }
    },
    [fetchAuthState]
  );

  // Sign out
  const handleSignOut = useCallback(async () => {
    try {
      await authClient.signOut();
      setUser(null);
      setActiveOrgState(null);
      // Full page navigation to clear all state
      window.location.href = "/login";
    } catch (error) {
      console.error("[AuthProvider] Error signing out:", error);
      // Still redirect on error
      window.location.href = "/login";
    }
  }, []);

  // Memoize context value
  const contextValue = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: !!user,
      user,
      activeOrganization,
      role: activeOrganization?.role || "student",
      refreshAuth,
      setActiveOrganization,
      signOut: handleSignOut,
    }),
    [
      isLoading,
      user,
      activeOrganization,
      refreshAuth,
      setActiveOrganization,
      handleSignOut,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to get current user (convenience wrapper)
 */
export function useCurrentUser() {
  const { user, isLoading, isAuthenticated } = useAuth();
  return { user, isLoading, isAuthenticated };
}

/**
 * Hook to get current organization and role (convenience wrapper)
 */
export function useOrganization() {
  const { activeOrganization, role, isLoading, setActiveOrganization } =
    useAuth();
  return { organization: activeOrganization, role, isLoading, setActiveOrganization };
}
