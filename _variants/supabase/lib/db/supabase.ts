import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Module-level cache ───────────────────────────────────────────────────────

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

// ─── getSupabaseClient (browser-safe, publishable key) ───────────────────────

/**
 * Returns a cached Supabase client using the public publishable key.
 * Safe to use in both client components and server code.
 */
export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL environment variable is not set."
    );
  }
  if (!publishableKey) {
    throw new Error(
      "[supabase] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable is not set."
    );
  }

  browserClient = createClient(url, publishableKey);
  return browserClient;
}

// ─── getSupabaseServerClient (secret key — server only) ──────────────────────

/**
 * Returns a cached Supabase client using the secret key.
 * Bypasses Row Level Security — use only in trusted server-side code.
 *
 * ⚠️  NEVER import this function in client components.
 *     The secret key must NEVER be exposed to the browser.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (serverClient) return serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url) {
    throw new Error(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL environment variable is not set."
    );
  }
  if (!secretKey) {
    throw new Error(
      "[supabase] SUPABASE_SECRET_KEY environment variable is not set. " +
        "This key is for server-side use only."
    );
  }

  serverClient = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}
