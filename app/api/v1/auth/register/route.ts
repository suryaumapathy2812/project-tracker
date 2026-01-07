import { auth } from "@/lib/auth";
import {
  successResponse,
  apiErrors,
  validateRequired,
  validateEmail,
  validatePassword,
} from "@/lib/api-auth/response";
import {
  formatUserResponse,
  formatSessionResponse,
} from "@/lib/api-auth/middleware";
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

    // Call Better Auth's sign up API
    const result = await auth.api.signUpEmail({
      body: {
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
      },
      asResponse: true,
    });

    // Check for errors
    if (!result.ok) {
      const errorData = await result.json();

      // Handle specific error cases
      if (result.status === 422 || errorData?.code === "USER_ALREADY_EXISTS") {
        return apiErrors.emailExists();
      }

      return apiErrors.validationError(
        errorData?.message || "Registration failed"
      );
    }

    // Extract token from response header
    const token = result.headers.get("set-auth-token");
    const data = await result.json();

    if (!token || !data.user) {
      return apiErrors.internalError("Failed to create session");
    }

    return successResponse(
      {
        token,
        user: formatUserResponse(data.user),
        session: formatSessionResponse(data.session),
        isNewUser: true,
      },
      201
    );
  } catch (error) {
    console.error("Register error:", error);
    return apiErrors.internalError();
  }
}
