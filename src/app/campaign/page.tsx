"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  Loader2,
  Trophy,
  Timer,
  Users,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { signInWithGoogle } from "@/lib/auth-client";

/**
 * Competitive Campaign shell.
 * Guests: pitch + Google CTA. Signed-in: season placeholder until Artifact 6.
 * Solo multi-problem levels live at `/solo` — not here.
 */
export default function CampaignPage() {
  const envConfigured = hasSupabaseEnv();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!envConfigured);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!envConfigured) return;
    const supabase = createClient();
    if (!supabase) {
      queueMicrotask(() => setReady(true));
      return;
    }
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user);
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [envConfigured]);

  const handleSignIn = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle({ next: "/campaign" });
    if (error) {
      console.error("[campaign] signIn", error);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(244,63,94,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(245,158,11,0.08),_transparent_40%)]" />

      <div className="relative mx-auto max-w-3xl px-6 pb-20 pt-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300">
          <Trophy className="h-3.5 w-3.5" />
          Campaign · competitive seasons
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Compete in 3-day seasons
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
          Shared prompt set, private sticky timer, public leaderboard. Google sign-in
          required so ranks stay fair. Scoring formula{" "}
          <code className="text-zinc-300">v1_correct_diff_cover</code> — stars × difficulty
          with coverage multiplier.{" "}
          <span className="text-zinc-300">Not</span> the personal progression map (that&apos;s{" "}
          <Link href="/solo" className="text-amber-300 underline-offset-2 hover:underline">
            Solo Mode
          </Link>
          ).
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Timer,
              title: "3-day seasons",
              body: "Time-boxed shared prompts. Timer is sticky and private — not on the public board.",
            },
            {
              icon: Users,
              title: "Leaderboard",
              body: "Rank by season score. Max 3 attempts per prompt. References hidden until end.",
            },
            {
              icon: Lock,
              title: "Sign-in required",
              body: "Google via Supabase for durable identity and leaderboard integrity.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-white/10 bg-zinc-900/50 p-4"
            >
              <Icon className="mb-2 h-5 w-5 text-rose-400" />
              <p className="text-sm font-medium text-zinc-100">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
          {!ready ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : user ? (
            <div>
              <p className="text-sm font-medium text-zinc-100">You&apos;re signed in</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Competitive seasons, leaderboard, and submit flow ship in later artifacts.
                For now you can keep playing personal levels in Solo Mode or free problems
                in Practice.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/solo"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500"
                >
                  Play Solo Mode
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/practice"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5"
                >
                  Free practice
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-zinc-100">
                Sign in to join Campaign seasons
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {hasSupabaseEnv()
                  ? "Continue with Google to lock your identity for the leaderboard. Seasons open when the competitive stack ships."
                  : "Supabase auth is not configured in this environment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable sign-in."}
              </p>
              {hasSupabaseEnv() ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleSignIn()}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleGlyph className="h-4 w-4" />
                  )}
                  Continue with Google
                </button>
              ) : null}
              <p className="mt-4 text-xs text-zinc-600">
                Want personal levels without ranking?{" "}
                <Link href="/solo" className="text-zinc-400 underline-offset-2 hover:underline">
                  Solo Mode
                </Link>{" "}
                is open to guests.
              </p>
            </div>
          )}
        </div>
      </div>
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
