import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are not set");
}

/**
 * Creates a Supabase client for server-side usage
 * This is a factory function that creates a new client instance
 */
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: {
      // Use global fetch (available in Next.js 13+)
      // Explicitly pass fetch to ensure it works in server-side contexts
      fetch: typeof fetch !== 'undefined' ? fetch : undefined,
    },
  });
}

