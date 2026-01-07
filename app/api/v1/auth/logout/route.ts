import { auth } from "@/lib/auth";
import { successResponse, apiErrors } from "@/lib/api-auth/response";
import { getApiSession } from "@/lib/api-auth/middleware";

/**
 * POST /api/v1/auth/logout
 * Invalidate the current session
 * Requires Bearer token in Authorization header
 */
export async function POST(request: Request) {
  try {
    // Verify user is authenticated first
    const session = await getApiSession(request);

    if (!session) {
      return apiErrors.unauthorized();
    }

    // Call Better Auth's sign out API
    await auth.api.signOut({
      headers: request.headers,
    });

    return successResponse({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    // Even if there's an error, we'll return success
    // since the user wants to log out anyway
    return successResponse({ success: true });
  }
}
