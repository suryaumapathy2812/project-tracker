import { NextResponse } from "next/server";
import { ErrorCode, type ApiErrorResponse } from "./types";

/**
 * API Response Helpers
 * Standardized response builders for the client auth API
 */

// HTTP status codes mapped to error codes
const errorStatusMap: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.EMAIL_EXISTS]: 409,
  [ErrorCode.OAUTH_ERROR]: 400,
  [ErrorCode.INTERNAL_ERROR]: 500,
};

/**
 * Create a success JSON response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Create an error JSON response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, string>
): NextResponse {
  const status = errorStatusMap[code] || 500;
  const body: ApiErrorResponse = {
    error: message,
    code,
    ...(details && { details }),
  };
  return NextResponse.json(body, { status });
}

/**
 * Shorthand error responses
 */
export const apiErrors = {
  unauthorized: (message = "Unauthorized") =>
    errorResponse(ErrorCode.UNAUTHORIZED, message),

  invalidCredentials: (message = "Invalid email or password") =>
    errorResponse(ErrorCode.INVALID_CREDENTIALS, message),

  invalidToken: (message = "Invalid or expired token") =>
    errorResponse(ErrorCode.INVALID_TOKEN, message),

  tokenExpired: (message = "Token has expired") =>
    errorResponse(ErrorCode.TOKEN_EXPIRED, message),

  validationError: (message: string, details?: Record<string, string>) =>
    errorResponse(ErrorCode.VALIDATION_ERROR, message, details),

  emailExists: (message = "Email already registered") =>
    errorResponse(ErrorCode.EMAIL_EXISTS, message),

  userNotFound: (message = "User not found") =>
    errorResponse(ErrorCode.USER_NOT_FOUND, message),

  oauthError: (message = "OAuth authentication failed") =>
    errorResponse(ErrorCode.OAUTH_ERROR, message),

  internalError: (message = "Internal server error") =>
    errorResponse(ErrorCode.INTERNAL_ERROR, message),
};

/**
 * Validate required fields in request body
 */
export function validateRequired<T extends object>(
  body: T,
  fields: (keyof T)[]
): { valid: true } | { valid: false; response: NextResponse } {
  const missing: string[] = [];

  for (const field of fields) {
    const value = body[field];
    if (!value || (typeof value === "string" && !value.trim())) {
      missing.push(String(field));
    }
  }

  if (missing.length > 0) {
    const details: Record<string, string> = {};
    for (const field of missing) {
      details[field] = `${field} is required`;
    }
    return {
      valid: false,
      response: apiErrors.validationError("Missing required fields", details),
    };
  }

  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength (minimum 6 characters)
 */
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}
