import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

/**
 * Service-role Supabase client (server-only).
 * Bypasses RLS — required for campaign_attempts / campaign_season_scores writes
 * and for public (unauthenticated) season/LB reads where anon has no grants.
 *
 * Never import this into client components.
 */
export function createServiceClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !serviceKey) return null;

  return createClient(config.url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function hasServiceRole(): boolean {
  return Boolean(
    getSupabasePublicConfig() && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
