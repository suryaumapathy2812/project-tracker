import { auth } from "@/lib/auth";
import {
  successResponse,
  apiErrors,
  validateRequired,
  validateEmail,
} from "@/lib/api-auth/response";
import {
  formatUserResponse,
  formatSessionResponse,
} from "@/lib/api-auth/middleware";
import type { LoginRequestBody } from "@/lib/api-auth/types";

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequestBody;

    // Validate required fields
    const validation = validateRequired(body, ["email", "password"]);
    if (!validation.valid) {
      return validation.response;
    }

    const { email, password } = body;

    // Validate email format
    if (!validateEmail(email)) {
      return apiErrors.validationError("Invalid email format", {
        email: "Please provide a valid email address",
      });
    }

    // Call Better Auth's sign in API
    const result = await auth.api.signInEmail({
      body: {
        email: email.toLowerCase().trim(),
        password,
      },
      asResponse: true,
    });

    // Check for errors
    if (!result.ok) {
      const errorData = await result.json();

      // Handle specific error cases
      if (
        result.status === 401 ||
        errorData?.code === "INVALID_EMAIL_OR_PASSWORD"
      ) {
        return apiErrors.invalidCredentials();
      }

      if (result.status === 403) {
        return apiErrors.unauthorized(
          errorData?.message || "Account is banned or suspended"
        );
      }

      return apiErrors.invalidCredentials();
    }

    // Extract token from response header
    const token = result.headers.get("set-auth-token");
    const data = await result.json();

    if (!token || !data.user) {
      return apiErrors.internalError("Failed to create session");
    }

    return successResponse({
      token,
      user: formatUserResponse(data.user),
      session: formatSessionResponse(data.session),
    });
  } catch (error) {
    console.error("Login error:", error);
    return apiErrors.internalError();
  }
}
