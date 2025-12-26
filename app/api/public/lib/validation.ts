/**
 * UUID validation utilities for public API endpoints
 */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4 format
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}
