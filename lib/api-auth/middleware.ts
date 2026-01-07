import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { UserResponse, SessionResponse, OrganizationResponse } from "./types";

/**
 * API Auth Middleware
 * Utilities for authenticating API requests
 */

export interface ApiAuthContext {
  user: UserResponse;
  session: SessionResponse;
}

export interface ApiAuthContextWithOrgs extends ApiAuthContext {
  organizations: OrganizationResponse[];
  activeOrganization: OrganizationResponse | null;
}

/**
 * Get session from Bearer token in Authorization header
 * Returns null if no valid session found
 */
export async function getApiSession(
  request: Request
): Promise<ApiAuthContext | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return null;
    }

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role || "Student",
        image: session.user.image || null,
        emailVerified: session.user.emailVerified,
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt.toISOString(),
        activeOrganizationId: session.session.activeOrganizationId || null,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 * Use in API routes that require auth
 */
export async function requireApiAuth(
  request: Request
): Promise<ApiAuthContext> {
  const session = await getApiSession(request);

  if (!session) {
    throw new ApiAuthError("UNAUTHORIZED", "Authentication required");
  }

  return session;
}

/**
 * Get session with user's organizations
 */
export async function getApiSessionWithOrgs(
  request: Request
): Promise<ApiAuthContextWithOrgs | null> {
  const session = await getApiSession(request);

  if (!session) {
    return null;
  }

  // Fetch user's organization memberships
  const memberships = await db.member.findMany({
    where: { userId: session.user.id },
    include: {
      organization: true,
    },
  });

  const organizations: OrganizationResponse[] = memberships.map((m: {
    organization: { id: string; name: string; slug: string; logo: string | null };
    role: string;
  }) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    logo: m.organization.logo,
    role: m.role,
  }));

  // Find active organization
  let activeOrganization: OrganizationResponse | null = null;
  if (session.session.activeOrganizationId) {
    activeOrganization =
      organizations.find(
        (org) => org.id === session.session.activeOrganizationId
      ) || null;
  }

  return {
    ...session,
    organizations,
    activeOrganization,
  };
}

/**
 * Custom error class for API auth errors
 */
export class ApiAuthError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiAuthError";
  }
}

/**
 * Format user data for API response
 */
export function formatUserResponse(user: {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  image?: string | null;
  emailVerified?: boolean;
}): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "Student",
    image: user.image || null,
    emailVerified: user.emailVerified ?? false,
  };
}

/**
 * Format session data for API response
 */
export function formatSessionResponse(session: {
  id: string;
  expiresAt: Date;
  activeOrganizationId?: string | null;
}): SessionResponse {
  return {
    id: session.id,
    expiresAt: session.expiresAt.toISOString(),
    activeOrganizationId: session.activeOrganizationId || null,
  };
}
