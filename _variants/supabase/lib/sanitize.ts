/**
 * Server-safe XSS sanitization helpers.
 * No DOM APIs — safe for Node.js server actions and route handlers.
 *
 * Note: This is the Supabase variant. MongoDB-specific helpers like
 * stripMongoOperators are not included — Supabase uses parameterized
 * queries which are inherently safe from SQL injection.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

/**
 * Escapes &, <, >, ", ' to HTML entities.
 */
export function escapeHTML(str: string): string {
  return str.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/**
 * Type-checks, trims, and escapes a value.
 * Returns '' if the value is not a string.
 */
export function sanitizeString(str: unknown): string {
  if (typeof str !== "string") return "";
  return escapeHTML(str.trim());
}

/**
 * Recursively applies sanitizeString to every string value in a plain object.
 * Non-string values are left untouched.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Sanitizes all string values in the given object (escapes HTML entities).
 */
export function sanitizeAndStrip<T extends Record<string, unknown>>(
  obj: T
): T {
  return sanitizeObject(obj);
}
