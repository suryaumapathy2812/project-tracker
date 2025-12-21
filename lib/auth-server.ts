import { auth } from "./auth";
import { headers } from "next/headers";
import { cache } from "react";
import { db } from "./db";
import type { UserRole, AuthUser, ActiveOrganization } from "./auth";

/**
 * Get the current session from Better Auth (server-side)
 * Uses React cache to dedupe requests within a single render
 */
export const getSession = cache(async () => {
  const headersList = await headers();
  return await auth.api.getSession({
    headers: headersList,
  });
});

/**
 * Get the current user from the session (server-side)
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const session = await getSession();
  if (!session?.user) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  } as AuthUser;
});

/**
 * Get the active organization for the current user (server-side)
 * Fetches from the session's activeOrganizationId
 */
export const getActiveOrganization = cache(
  async (): Promise<ActiveOrganization | null> => {
    const session = await getSession();
    if (!session?.session?.activeOrganizationId || !session.user) {
      return null;
    }

    const orgId = session.session.activeOrganizationId;
    const userId = session.user.id;

    // Fetch the organization and user's membership
    const [org, member] = await Promise.all([
      db.organization.findUnique({
        where: { id: orgId },
      }),
      db.member.findFirst({
        where: {
          organizationId: orgId,
          userId: userId,
        },
      }),
    ]);

    if (!org || !member) {
      return null;
    }

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      role: (member.role as UserRole) || "student",
      createdAt: org.createdAt,
    };
  }
);

/**
 * Get full auth context for the current user (server-side)
 * Returns user, session, active organization, and role
 */
export const getAuthContext = cache(async () => {
  const [session, activeOrg] = await Promise.all([
    getSession(),
    getActiveOrganization(),
  ]);

  if (!session?.user) {
    return {
      isAuthenticated: false,
      user: null,
      session: null,
      activeOrganization: null,
      role: "student" as UserRole,
    };
  }

  return {
    isAuthenticated: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    } as AuthUser,
    session: session.session,
    activeOrganization: activeOrg,
    role: activeOrg?.role || ("student" as UserRole),
  };
});

/**
 * Require authentication - throws if not authenticated
 * Use in server actions or API routes
 */
export async function requireAuth() {
  const context = await getAuthContext();
  if (!context.isAuthenticated || !context.user) {
    throw new Error("Unauthorized");
  }
  return context;
}

/**
 * Require specific role - throws if user doesn't have required role
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const context = await requireAuth();
  if (!allowedRoles.includes(context.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  return context;
}
