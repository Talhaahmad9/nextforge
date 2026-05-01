import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Module-level cache ───────────────────────────────────────────────────────

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

// ─── getSupabaseClient (browser-safe, anon key) ───────────────────────────────

/**
 * Returns a cached Supabase client using the public anon key.
 * Safe to use in both client components and server code.
 */
export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL environment variable is not set."
    );
  }
  if (!anonKey) {
    throw new Error(
      "[supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set."
    );
  }

  browserClient = createClient(url, anonKey);
  return browserClient;
}

// ─── getSupabaseServerClient (service role — server only) ────────────────────

/**
 * Returns a cached Supabase client using the service role key.
 * Bypasses Row Level Security — use only in trusted server-side code.
 *
 * ⚠️  NEVER import this function in client components.
 *     The service role key must NEVER be exposed to the browser.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (serverClient) return serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL environment variable is not set."
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "[supabase] SUPABASE_SERVICE_ROLE_KEY environment variable is not set. " +
        "This key is for server-side use only."
    );
  }

  serverClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}
