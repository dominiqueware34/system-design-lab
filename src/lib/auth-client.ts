import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type SignInWithGoogleOptions = {
  /** Relative path to land on after OAuth (e.g. /campaign, /solo). */
  next?: string;
};

/**
 * Start Google OAuth via Supabase. Redirects the browser to Google.
 * Secrets stay on Supabase/Google — browser only holds the public anon key.
 */
export async function signInWithGoogle(
  options: SignInWithGoogleOptions = {}
): Promise<{ error: Error | null }> {
  if (!hasSupabaseEnv()) {
    return { error: new Error("Supabase is not configured") };
  }

  const next = options.next ?? "/";
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;

  const supabase = createClient();
  if (!supabase) {
    return { error: new Error("Supabase client unavailable") };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  return { error: error ? new Error(error.message) : null };
}

export async function signOut(): Promise<{ error: Error | null }> {
  if (!hasSupabaseEnv()) {
    return { error: null };
  }
  const supabase = createClient();
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error: error ? new Error(error.message) : null };
}
