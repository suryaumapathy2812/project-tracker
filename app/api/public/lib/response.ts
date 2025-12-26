import { NextResponse } from "next/server";

/**
 * Standardized response utilities for public API endpoints
 */

export type ErrorCode =
  | "NOT_FOUND"
  | "INVALID_REQUEST"
  | "INTERNAL_ERROR";

export interface ErrorResponse {
  error: string;
  code: ErrorCode;
}

/**
 * Create a successful JSON response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Create an error JSON response
 */
export function errorResponse(
  error: string,
  code: ErrorCode,
  status: number
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error, code }, { status });
}

/**
 * Create a 404 Not Found response
 */
export function notFound(
  message = "Resource not found"
): NextResponse<ErrorResponse> {
  return errorResponse(message, "NOT_FOUND", 404);
}

/**
 * Create a 400 Bad Request response
 */
export function badRequest(
  message = "Invalid request"
): NextResponse<ErrorResponse> {
  return errorResponse(message, "INVALID_REQUEST", 400);
}

/**
 * Create a 500 Internal Server Error response
 */
export function internalError(
  message = "An unexpected error occurred"
): NextResponse<ErrorResponse> {
  return errorResponse(message, "INTERNAL_ERROR", 500);
}
