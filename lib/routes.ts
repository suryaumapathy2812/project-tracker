/**
 * Centralized Route Configuration
 * Handles role-based access control and navigation generation
 */

// Organization membership roles
// These are stored in the Member table (per-organization)
export type UserRole = "admin" | "pm" | "student";

// Route visibility - controls when route appears in navigation
export type RouteVisibility =
  | "org-only" // Only visible at org level (/:orgSlug or /:orgSlug/~/*)
  | "batch-only" // Only visible at batch level (/:orgSlug/:batchSlug/*)
  | "both" // Visible at both org and batch level
  | "none"; // Never shown in nav (detail pages, etc.)

// Route configuration interface
export interface RouteConfig {
  /** Unique identifier for the route */
  id: string;
  /** URL path template (supports :orgSlug, :batchSlug, :projectId, etc.) */
  path: string;
  /** Roles that can access this route (* = all authenticated users) */
  roles: (UserRole | "*")[];
  /** Labels per role (allows different labels for different roles) */
  labels: {
    default: string;
    [role: string]: string;
  };
  /** Lucide icon component name */
  icon: string;
  /** Navigation group for organizing menu items */
  group: "main" | "admin" | "user";
  /** Whether to show in main navigation */
  showInNav: boolean;
  /** Sort order within navigation */
  order: number;
  /** Controls when route appears in navigation based on context */
  visibility: RouteVisibility;
  /** Child routes (for nested navigation) */
  children?: RouteConfig[];
  /** Additional metadata */
  meta?: {
    description?: string;
    requiresOrg?: boolean;
    requiresBatch?: boolean;
  };
}

// Route definitions with new hierarchical structure
export const routes: RouteConfig[] = [
  // Org-level routes
  {
    id: "org-overview",
    path: "/:orgSlug",
    roles: ["*"],
    labels: {
      default: "Overview",
    },
    icon: "LayoutDashboard",
    group: "main",
    showInNav: true,
    order: 1,
    visibility: "org-only",
    meta: {
      description: "Organization overview and batches",
      requiresOrg: true,
    },
  },
  {
    id: "org-batches",
    path: "/:orgSlug/~/batches",
    roles: ["admin"],
    labels: {
      default: "Batches",
    },
    icon: "Layers",
    group: "admin",
    showInNav: true,
    order: 2,
    visibility: "org-only",
    meta: {
      description: "Manage organization batches",
      requiresOrg: true,
    },
  },
  {
    id: "org-users",
    path: "/:orgSlug/~/users",
    roles: ["admin"],
    labels: {
      default: "Users",
    },
    icon: "Users",
    group: "admin",
    showInNav: true,
    order: 2.5,
    visibility: "org-only",
    meta: {
      description: "Manage organization members",
      requiresOrg: true,
    },
  },

  {
    id: "projects",
    path: "/:orgSlug/~/projects",
    roles: ["admin", "pm"],
    labels: {
      default: "Projects",
    },
    icon: "FolderKanban",
    group: "main",
    showInNav: true,
    order: 3,
    visibility: "org-only",
    meta: {
      description: "Manage projects and features",
      requiresOrg: true,
    },
    children: [
      {
        id: "project-detail",
        path: "/:orgSlug/~/projects/:projectId",
        roles: ["admin", "pm"],
        labels: { default: "Project Details" },
        icon: "FolderKanban",
        group: "main",
        showInNav: false,
        order: 1,
        visibility: "none",
      },
      {
        id: "project-assign",
        path: "/:orgSlug/~/projects/:projectId/assign",
        roles: ["admin", "pm"],
        labels: { default: "Assign Students" },
        icon: "UserPlus",
        group: "main",
        showInNav: false,
        order: 2,
        visibility: "none",
      },
    ],
  },
  // Batch-level routes
  {
    id: "batch-overview",
    path: "/:orgSlug/:batchSlug",
    roles: ["*"],
    labels: {
      default: "Overview",
      student: "My Assignments",
    },
    icon: "ClipboardList",
    group: "main",
    showInNav: true,
    order: 1,
    visibility: "batch-only",
    meta: {
      description: "Batch overview and assignments",
      requiresOrg: true,
      requiresBatch: true,
    },
  },
  {
    id: "batch-users",
    path: "/:orgSlug/:batchSlug/users",
    roles: ["admin", "pm"],
    labels: {
      default: "Users",
    },
    icon: "Users",
    group: "admin",
    showInNav: true,
    order: 2,
    visibility: "batch-only",
    meta: {
      description: "Manage batch members",
      requiresOrg: true,
      requiresBatch: true,
    },
  },
];

/**
 * Check if a user role can access a specific route
 */
export function canAccessRoute(route: RouteConfig, role: UserRole): boolean {
  // Wildcard allows all authenticated users
  if (route.roles.includes("*")) return true;

  // Check if user's role is in the allowed roles
  return route.roles.includes(role);
}

/**
 * Get navigation items filtered by role and visibility context
 */
export function getNavigationForContext(
  role: UserRole,
  isOrgLevel: boolean,
  isBatchLevel: boolean,
  group?: RouteConfig["group"],
): RouteConfig[] {
  return routes
    .filter((route) => {
      // Check role access
      const roleMatch = route.roles.includes("*") || route.roles.includes(role);
      if (!roleMatch) return false;

      // Check visibility based on current context
      if (route.visibility === "org-only" && !isOrgLevel) return false;
      if (route.visibility === "batch-only" && !isBatchLevel) return false;
      if (route.visibility === "none") return false;

      // Check group filter
      const groupMatch = !group || route.group === group;
      if (!groupMatch) return false;

      return route.showInNav;
    })
    .sort((a, b) => a.order - b.order);
}

/**
 * Get label for route based on user role
 */
export function getRouteLabel(route: RouteConfig, role: UserRole): string {
  return route.labels[role] || route.labels.default;
}

/**
 * Build path with parameters substituted
 */
export function buildRoutePath(
  route: RouteConfig,
  params?: Record<string, string>,
): string {
  if (!params) return route.path;

  let path = route.path;
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value);
  });
  return path;
}

/**
 * Find route by path (for active state detection)
 * Handles both exact matches and dynamic segments
 */
export function findRouteByPath(path: string): RouteConfig | undefined {
  const normalizedPath = path.split("?")[0]; // Remove query params

  function searchRoutes(routeList: RouteConfig[]): RouteConfig | undefined {
    for (const route of routeList) {
      // Exact match
      if (route.path === normalizedPath) return route;

      // Check with dynamic segments (convert :param to regex pattern)
      const routePattern = route.path.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${routePattern}$`);
      if (regex.test(normalizedPath)) return route;

      // Check children recursively
      if (route.children) {
        const found = searchRoutes(route.children);
        if (found) return found;
      }
    }
    return undefined;
  }

  return searchRoutes(routes);
}

/**
 * Find route by ID
 */
export function findRouteById(id: string): RouteConfig | undefined {
  function searchRoutes(routeList: RouteConfig[]): RouteConfig | undefined {
    for (const route of routeList) {
      if (route.id === id) return route;
      if (route.children) {
        const found = searchRoutes(route.children);
        if (found) return found;
      }
    }
    return undefined;
  }

  return searchRoutes(routes);
}

/**
 * Get all routes as a flat array
 */
export function getAllRoutes(): RouteConfig[] {
  const flatRoutes: RouteConfig[] = [];

  function flatten(routeList: RouteConfig[]) {
    for (const route of routeList) {
      flatRoutes.push(route);
      if (route.children) {
        flatten(route.children);
      }
    }
  }

  flatten(routes);
  return flatRoutes;
}
