/**
 * Utility functions for generating URL-safe slugs
 */

/**
 * Convert a string to a URL-safe slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a counter if the base slug already exists
 */
export function generateUniqueSlug(
  base: string,
  existingSlugs: string[]
): string {
  const baseSlug = slugify(base);

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let candidateSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(candidateSlug)) {
    counter++;
    candidateSlug = `${baseSlug}-${counter}`;
  }

  return candidateSlug;
}

/**
 * Validate a slug format
 */
export function isValidSlug(slug: string): boolean {
  // Must be lowercase, alphanumeric with hyphens, no leading/trailing hyphens
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
