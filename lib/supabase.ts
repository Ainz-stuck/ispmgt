import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!rawUrl || !rawAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
  );
}

export const supabaseUrl = rawUrl;
export const supabaseAnonKey = rawAnonKey;

export const supabase: any = createClient(supabaseUrl, supabaseAnonKey);

/** Ephemeral non-persisting client used for re-verifying credentials without mutating active session state. */
export function createEphemeralSupabaseClient(): any {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

