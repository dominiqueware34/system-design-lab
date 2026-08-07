"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Cloud, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { signInWithGoogle } from "@/lib/auth-client";

const SOFT_DISMISS_KEY = "sdl-signin-soft-dismissed";
const AFTER_COMPLETE_DISMISS_KEY = "sdl-signin-after-complete-dismissed";
const AFTER_COMPLETE_SHOW_KEY = "sdl-signin-after-complete-pending";

/** Call after first level clear / lesson complete when signed out. */
export function maybeQueueSignInAfterComplete(): void {
  if (typeof window === "undefined") return;
  if (!hasSupabaseEnv()) return;
  try {
    if (localStorage.getItem(AFTER_COMPLETE_DISMISS_KEY) === "1") return;
    localStorage.setItem(AFTER_COMPLETE_SHOW_KEY, "1");
    window.dispatchEvent(new Event("sdl:signin-after-complete"));
  } catch {
    // ignore storage failures
  }
}

/**
 * Soft inline prompt for campaign map: “Sign in to save progress across devices”.
 */
export function SoftSignInHint({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(true); // hide until we know
  const [dismissed, setDismissed] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    try {
      setDismissed(localStorage.getItem(SOFT_DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }

    const supabase = createClient();
    if (!supabase) {
      setSignedIn(false);
      return;
    }
    void supabase.auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!hasSupabaseEnv() || signedIn || dismissed) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-sm text-sky-100 ${className}`}
    >
      <Cloud className="h-4 w-4 shrink-0 text-sky-400" />
      <span className="flex-1 text-xs sm:text-sm">
        Sign in to save progress across devices
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void signInWithGoogle({
            next: pathname && pathname !== "/" ? pathname : "/campaign",
          }).finally(() => setBusy(false));
        }}
        className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-zinc-900 hover:bg-zinc-100 disabled:opacity-60"
      >
        Continue with Google
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          try {
            localStorage.setItem(SOFT_DISMISS_KEY, "1");
          } catch {
            /* ignore */
          }
          setDismissed(true);
        }}
        className="rounded p-1 text-sky-300/70 hover:bg-white/5 hover:text-sky-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * Dismissible banner after first level/lesson clear while signed out.
 * Listens for localStorage pending flag + custom event.
 */
export function AfterCompleteSignInBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    if (!hasSupabaseEnv()) {
      setVisible(false);
      return;
    }
    try {
      if (localStorage.getItem(AFTER_COMPLETE_DISMISS_KEY) === "1") {
        setVisible(false);
        return;
      }
      setVisible(localStorage.getItem(AFTER_COMPLETE_SHOW_KEY) === "1");
    } catch {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("sdl:signin-after-complete", refresh);
    return () => window.removeEventListener("sdl:signin-after-complete", refresh);
  }, [refresh]);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    const supabase = createClient();
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        try {
          localStorage.removeItem(AFTER_COMPLETE_SHOW_KEY);
        } catch {
          /* ignore */
        }
        setVisible(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(AFTER_COMPLETE_DISMISS_KEY, "1");
      localStorage.removeItem(AFTER_COMPLETE_SHOW_KEY);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-lg flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-zinc-950/95 px-4 py-3 shadow-2xl backdrop-blur-md">
        <p className="flex-1 text-sm text-zinc-200">
          Nice progress!{" "}
          <span className="text-zinc-400">
            Sign in to keep it when you switch devices.
          </span>
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void signInWithGoogle({
              next: pathname && pathname !== "/" ? pathname : "/campaign",
            }).finally(() => setBusy(false));
          }}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100 disabled:opacity-60"
        >
          Continue with Google
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
