/**
 * API Authentication Module
 * Exports all utilities for the client auth API
 */

// Types
export * from "./types";

// Response helpers
export {
  successResponse,
  errorResponse,
  apiErrors,
  validateRequired,
  validateEmail,
  validatePassword,
} from "./response";

// Middleware
export {
  getApiSession,
  requireApiAuth,
  getApiSessionWithOrgs,
  ApiAuthError,
  formatUserResponse,
  formatSessionResponse,
  type ApiAuthContext,
  type ApiAuthContextWithOrgs,
} from "./middleware";
