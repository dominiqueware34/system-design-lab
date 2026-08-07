/** True when public Supabase env is configured (safe for client + server). */
export function hasSupabaseEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("your-project-ref"));
}

export function getSupabasePublicConfig(): { url: string; key: string } | null {
  if (!hasSupabaseEnv()) return null;
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}
