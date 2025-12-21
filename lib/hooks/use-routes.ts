"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useNavigationOptional } from "@/lib/contexts/navigation-context";
import { useAuth } from "@/lib/auth-provider";
import {
  routes,
  getNavigationForContext,
  getRouteLabel,
  findRouteByPath,
  canAccessRoute,
  buildRoutePath,
  type UserRole,
  type RouteConfig,
} from "@/lib/routes";

/**
 * Custom hook for accessing routes filtered by user role and navigation context
 * Provides navigation items, active route detection, and access control
 */
export function useRoutes() {
  const pathname = usePathname();
  const navigation = useNavigationOptional();
  // Use AuthProvider context to get role and organization
  const { role, activeOrganization, isLoading } = useAuth();

  // Determine context from navigation
  const isOrgLevel = navigation?.isOrgLevel ?? false;
  const isBatchLevel = navigation?.isBatchLevel ?? false;

  // Get all navigation items for the current role and context
  const navigationItems = useMemo(() => {
    return getNavigationForContext(role, isOrgLevel, isBatchLevel);
  }, [role, isOrgLevel, isBatchLevel]);

  // Get main navigation items only
  const mainNavigation = useMemo(() => {
    return getNavigationForContext(role, isOrgLevel, isBatchLevel, "main");
  }, [role, isOrgLevel, isBatchLevel]);

  // Get admin navigation items only
  const adminNavigation = useMemo(() => {
    return getNavigationForContext(role, isOrgLevel, isBatchLevel, "admin");
  }, [role, isOrgLevel, isBatchLevel]);

  // Find the currently active route based on pathname
  const activeRoute = useMemo(() => {
    return findRouteByPath(pathname);
  }, [pathname]);

  /**
   * Build path for a route with current context's org/batch slugs
   */
  const buildPath = (route: RouteConfig): string => {
    const params: Record<string, string> = {};
    if (navigation?.currentOrg) {
      params.orgSlug = navigation.currentOrg.slug;
    }
    if (navigation?.currentBatch) {
      params.batchSlug = navigation.currentBatch.slug;
    }
    return buildRoutePath(route, params);
  };

  /**
   * Check if a route is currently active
   * Matches exact path or if current path starts with route path
   */
  const isRouteActive = (route: RouteConfig): boolean => {
    if (!pathname) return false;

    const routePath = buildPath(route);

    // Exact match
    if (pathname === routePath) return true;

    // Check if current path starts with route path (for child routes)
    // But only if the route path has more than just a single segment
    if (routePath !== "/" && pathname.startsWith(routePath + "/")) {
      return true;
    }

    // Check if active route matches
    if (activeRoute?.id === route.id) return true;

    return false;
  };

  /**
   * Get the display label for a route based on current user role
   */
  const getLabelForRoute = (route: RouteConfig): string => {
    return getRouteLabel(route, role);
  };

  /**
   * Check if current user can access a specific route
   */
  const canAccess = (route: RouteConfig): boolean => {
    return canAccessRoute(route, role);
  };

  return {
    /** Current user role */
    role,
    /** Whether the organization data is still loading */
    isLoading,
    /** The active organization (if any) */
    activeOrganization,
    /** Navigation context info */
    navigationContext: navigation,
    /** All navigation items for current role and context */
    navigation: navigationItems,
    /** Main group navigation items */
    mainNavigation,
    /** Admin group navigation items */
    adminNavigation,
    /** Currently active route (if any) */
    activeRoute,
    /** Check if a route is active */
    isRouteActive,
    /** Get role-specific label for a route */
    getLabelForRoute,
    /** Check if user can access a route */
    canAccess,
    /** Build path for a route with current context */
    buildPath,
    /** All routes (unfiltered) */
    allRoutes: routes,
  };
}
