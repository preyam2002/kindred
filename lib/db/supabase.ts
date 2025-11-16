import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are not set");
}

// Configure Supabase client with explicit fetch for server-side usage
// This ensures fetch works properly in Next.js API routes and server components
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    // Use global fetch (available in Next.js 13+)
    // Explicitly pass fetch to ensure it works in server-side contexts
    fetch: typeof fetch !== 'undefined' ? fetch : undefined,
  },
});






