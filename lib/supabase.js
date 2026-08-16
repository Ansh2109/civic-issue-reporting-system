import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables.\n" +
      "Copy .env.local.example to .env.local and fill in the values from your Supabase project settings."
  );
}

/**
 * Pre-configured Supabase client for use throughout the app.
 *
 * Uses the public anon key — safe to expose to the browser.
 * Row-Level Security (RLS) policies on the database enforce access control,
 * so the anon key cannot be used to read or mutate data it shouldn't.
 *
 * Do NOT import SUPABASE_SERVICE_ROLE_KEY into this file.
 * If a service-role client is ever needed (e.g. for a server-side admin
 * operation), create a separate server-only module and never export it to
 * client components.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
