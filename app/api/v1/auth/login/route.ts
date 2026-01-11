import { auth } from "@/lib/auth";
import {
  successResponse,
  apiErrors,
  validateRequired,
  validateEmail,
} from "@/lib/api-auth/response";
import { formatUserResponse } from "@/lib/api-auth/middleware";
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

    // Call Better Auth's sign in API (without asResponse to get data directly)
    const data = await auth.api.signInEmail({
      body: {
        email: email.toLowerCase().trim(),
        password,
      },
    });

    // Check if we got valid data
    if (!data || !data.user || !data.token) {
      return apiErrors.invalidCredentials();
    }

    return successResponse({
      token: data.token,
      user: formatUserResponse(data.user),
    });
  } catch (error: unknown) {
    console.error("Login error:", error);

    // Handle Better Auth API errors (check error properties)
    if (error && typeof error === "object") {
      const err = error as { body?: { code?: string; message?: string }; status?: string };

      if (
        err.body?.code === "INVALID_EMAIL_OR_PASSWORD" ||
        err.status === "UNAUTHORIZED"
      ) {
        return apiErrors.invalidCredentials();
      }
      if (err.status === "FORBIDDEN") {
        return apiErrors.unauthorized(
          err.body?.message || "Account is banned or suspended"
        );
      }
    }

    return apiErrors.internalError();
  }
}
