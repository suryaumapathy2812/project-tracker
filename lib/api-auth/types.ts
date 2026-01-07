/**
 * API Authentication Types
 * Types for the client auth API endpoints
 */

// Error codes for API responses
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  UNAUTHORIZED: "UNAUTHORIZED",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  EMAIL_EXISTS: "EMAIL_EXISTS",
  OAUTH_ERROR: "OAUTH_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// API Error response
export interface ApiErrorResponse {
  error: string;
  code: ErrorCode;
  details?: Record<string, string>;
}

// User response shape
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  emailVerified: boolean;
}

// Session response shape
export interface SessionResponse {
  id: string;
  expiresAt: string;
  activeOrganizationId: string | null;
}

// Organization response shape
export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
}

// Auth success response (login/register)
export interface AuthSuccessResponse {
  token: string;
  user: UserResponse;
  session: SessionResponse;
}

// Register success response
export interface RegisterSuccessResponse extends AuthSuccessResponse {
  isNewUser: true;
}

// OAuth success response
export interface OAuthSuccessResponse extends AuthSuccessResponse {
  isNewUser: boolean;
}

// Session endpoint response
export interface SessionSuccessResponse {
  user: UserResponse;
  session: SessionResponse;
  organizations: OrganizationResponse[];
  activeOrganization: OrganizationResponse | null;
}

// Logout success response
export interface LogoutSuccessResponse {
  success: true;
}

// Request body types
export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface RegisterRequestBody {
  email: string;
  password: string;
  name: string;
}

export interface GoogleOAuthRequestBody {
  idToken: string;
}

export interface GitHubOAuthRequestBody {
  code: string;
}

export interface LogoutRequestBody {
  allDevices?: boolean;
}
