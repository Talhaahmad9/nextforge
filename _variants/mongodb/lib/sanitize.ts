/**
 * Server-safe XSS / NoSQL injection sanitization helpers.
 * No DOM APIs — safe for Node.js server actions and route handlers.
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
 * Recursively removes keys that start with '$' or contain '.'
 * to prevent NoSQL injection. Works on nested objects and arrays.
 */
export function stripMongoOperators(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(stripMongoOperators);
  }

  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(obj as Record<string, unknown>)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      result[key] = stripMongoOperators(
        (obj as Record<string, unknown>)[key]
      );
    }

    return result;
  }

  return obj;
}

/**
 * Runs stripMongoOperators then sanitizeObject on the input.
 */
export function sanitizeAndStrip<T extends Record<string, unknown>>(
  obj: T
): T {
  const stripped = stripMongoOperators(obj) as Record<string, unknown>;
  return sanitizeObject(stripped as T);
}
