import { auth } from "@/lib/auth";
import {
  successResponse,
  apiErrors,
  validateRequired,
  validateEmail,
  validatePassword,
} from "@/lib/api-auth/response";
import { formatUserResponse } from "@/lib/api-auth/middleware";
import type { RegisterRequestBody } from "@/lib/api-auth/types";

/**
 * POST /api/v1/auth/register
 * Register a new user with email and password
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterRequestBody;

    // Validate required fields
    const validation = validateRequired(body, ["email", "password", "name"]);
    if (!validation.valid) {
      return validation.response;
    }

    const { email, password, name } = body;

    // Validate email format
    if (!validateEmail(email)) {
      return apiErrors.validationError("Invalid email format", {
        email: "Please provide a valid email address",
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return apiErrors.validationError("Password too weak", {
        password: "Password must be at least 6 characters",
      });
    }

    // Call Better Auth's sign up API (without asResponse to get data directly)
    const data = await auth.api.signUpEmail({
      body: {
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
      },
    });

    // Check if we got valid data
    if (!data || !data.user || !data.token) {
      return apiErrors.validationError("Registration failed");
    }

    return successResponse(
      {
        token: data.token,
        user: formatUserResponse(data.user),
        isNewUser: true,
      },
      201
    );
  } catch (error: unknown) {
    console.error("Register error:", error);

    // Handle Better Auth API errors (check error properties)
    if (error && typeof error === "object") {
      const err = error as { body?: { code?: string }; status?: string };

      if (
        err.body?.code === "USER_ALREADY_EXISTS" ||
        err.status === "UNPROCESSABLE_ENTITY"
      ) {
        return apiErrors.emailExists();
      }
    }

    return apiErrors.internalError();
  }
}
