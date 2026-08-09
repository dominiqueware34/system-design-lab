"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { signInWithGoogle, signOut } from "@/lib/auth-client";
import { mergeLocalWithServer } from "@/lib/progress-sync";

/**
 * Compact auth chrome: Continue with Google when signed out;
 * avatar + Sign out when signed in. Mount once from root layout.
 */
export function AuthHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mergeNote, setMergeNote] = useState<string | null>(null);

  const runMerge = useCallback(async () => {
    const result = await mergeLocalWithServer();
    if (result?.mergedFromLocal) {
      setMergeNote("We found progress on this device. Merged into your account.");
      window.setTimeout(() => setMergeNote(null), 6000);
    }
  }, []);

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setReady(true);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setReady(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      const {
        data: { user: current },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(current);
      setReady(true);
      if (current) {
        void runMerge();
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN") {
        void runMerge();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [runMerge]);

  if (!hasSupabaseEnv()) {
    return null;
  }

  const handleSignIn = async () => {
    setBusy(true);
    const next = pathname && pathname !== "/" ? pathname : "/";
    const { error } = await signInWithGoogle({ next });
    if (error) {
      console.error("[auth] signInWithGoogle", error);
      setBusy(false);
    }
    // On success the browser navigates to Google; leave busy spinner.
  };

  const handleSignOut = async () => {
    setBusy(true);
    await signOut();
    setUser(null);
    setBusy(false);
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Signed in";
  const avatarUrl: string | undefined =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-50 flex flex-col items-end gap-2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/90 px-2 py-1.5 shadow-lg backdrop-blur-md">
        {!ready ? (
          <span className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          </span>
        ) : user ? (
          <>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-7 w-7 rounded-full border border-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/30 text-xs font-semibold text-violet-200">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="hidden max-w-[140px] truncate text-xs text-zinc-300 sm:inline">
              {displayName}
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSignOut()}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <LogOut className="h-3 w-3" />
              )}
              Sign out
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSignIn()}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <GoogleGlyph className="h-3.5 w-3.5" />
            )}
            Continue with Google
          </button>
        )}
      </div>
      {mergeNote ? (
        <p className="pointer-events-auto max-w-xs rounded-lg border border-emerald-500/30 bg-emerald-950/90 px-3 py-2 text-xs text-emerald-100 shadow-lg backdrop-blur-md">
          {mergeNote}
        </p>
      ) : null}
    </div>
  );
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
