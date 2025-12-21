"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Building2,
  Users,
  Layers,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-provider";
import { useNavigationOptional } from "@/lib/contexts/navigation-context";
import {
  getNavigationForContext,
  getRouteLabel,
  buildRoutePath,
  type RouteConfig,
} from "@/lib/routes";

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Building2,
  Users,
  Layers,
  UserPlus,
};

// Dynamic icon component
function RouteIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}

interface NavTabProps {
  route: RouteConfig;
  isActive: boolean;
  label: string;
  href: string;
}

function NavTab({ route, isActive, label, href }: NavTabProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors",
        "hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {/*<RouteIcon name={route.icon} className="h-4 w-4" />*/}
      <span>{label}</span>

      {/* Active indicator bar */}
      {isActive && (
        <span
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

export function NavTabs() {
  const pathname = usePathname();
  const { role } = useAuth();
  const navigation = useNavigationOptional();

  // If no navigation context, don't show tabs
  if (!navigation) {
    return null;
  }

  const { currentOrg, currentBatch, isOrgLevel, isBatchLevel } = navigation;

  // Debug: Log current role and navigation context
  console.log(
    "[NavTabs] role:",
    role,
    "isOrgLevel:",
    isOrgLevel,
    "isBatchLevel:",
    isBatchLevel,
  );

  // Get routes filtered by role and context
  const routes = getNavigationForContext(role, isOrgLevel, isBatchLevel);

  // Build actual paths with current org/batch slugs
  const buildPath = (route: RouteConfig): string => {
    const params: Record<string, string> = {};
    if (currentOrg) {
      params.orgSlug = currentOrg.slug;
    }
    if (currentBatch) {
      params.batchSlug = currentBatch.slug;
    }
    return buildRoutePath(route, params);
  };

  // Check if route is active
  const isRouteActive = (route: RouteConfig): boolean => {
    const routePath = buildPath(route);
    // Exact match only - no prefix matching to avoid overview routes
    // staying active when navigating to sibling routes
    return pathname === routePath;
  };

  return (
    <nav className="-mb-px flex items-center gap-1">
      {routes.map((route) => (
        <NavTab
          key={route.id}
          route={route}
          isActive={isRouteActive(route)}
          label={getRouteLabel(route, role)}
          href={buildPath(route)}
        />
      ))}
    </nav>
  );
}
