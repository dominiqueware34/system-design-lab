import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const config = getSupabasePublicConfig();
  if (!config) {
    // Missing env: skip session refresh so static pages still render.
    return supabaseResponse;
  }

  // Always create a new client per request (do not put in a global).
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
        // Required: prevent CDN/cache from serving another user's session.
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  // Do not run logic between createServerClient and getClaims().
  // Removing getClaims() can randomly log users out under SSR.
  await supabase.auth.getClaims();

  // IMPORTANT: return this response object (cookies already attached).
  // If you construct a new NextResponse, copy cookies from supabaseResponse.
  return supabaseResponse;
}
