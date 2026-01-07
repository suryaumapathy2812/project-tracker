import { successResponse, apiErrors } from "@/lib/api-auth/response";
import { getApiSessionWithOrgs } from "@/lib/api-auth/middleware";

/**
 * GET /api/v1/auth/session
 * Get current session, user info, and organizations
 * Requires Bearer token in Authorization header
 */
export async function GET(request: Request) {
  try {
    const session = await getApiSessionWithOrgs(request);

    if (!session) {
      return apiErrors.unauthorized();
    }

    return successResponse({
      user: session.user,
      session: session.session,
      organizations: session.organizations,
      activeOrganization: session.activeOrganization,
    });
  } catch (error) {
    console.error("Session error:", error);
    return apiErrors.internalError();
  }
}
