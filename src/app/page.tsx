import Link from "next/link";
import {
  ArrowRight,
  Bot,
  GraduationCap,
  Map as MapIcon,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

const MODES = [
  {
    href: "/training",
    title: "Training",
    tagline: "Learn",
    body: "Building blocks and guided builds — caches, queues, LBs, agent patterns.",
    icon: GraduationCap,
    accent: "border-sky-500/30 hover:border-sky-400/50",
    iconClass: "text-sky-400",
    cta: "Start learning",
  },
  {
    href: "/solo",
    title: "Solo Mode",
    tagline: "Play",
    body: "Personal progression map. Clear levels, survive wrenches, earn stars — no public ranking.",
    icon: MapIcon,
    accent: "border-amber-500/30 hover:border-amber-400/50",
    iconClass: "text-amber-400",
    cta: "Open Solo map",
  },
  {
    href: "/campaign",
    title: "Campaign",
    tagline: "Compete",
    body: "3-day seasons, shared prompts, leaderboard. Google sign-in required when seasons ship.",
    icon: Trophy,
    accent: "border-rose-500/30 hover:border-rose-400/50",
    iconClass: "text-rose-400",
    cta: "View Campaign",
  },
  {
    href: "/practice",
    title: "Practice",
    tagline: "Rehearse",
    body: "Full canvas problems with SpaceXAI scoring. No unlocks, no season pressure.",
    icon: Target,
    accent: "border-violet-500/30 hover:border-violet-400/50",
    iconClass: "text-violet-400",
    cta: "Browse problems",
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.15),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.08),_transparent_40%)]" />

      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-14">
        <header className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            System design teaching game · SpaceXAI
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Learn system design.
            <span className="block text-zinc-400">Practice. Play Solo. Compete in Campaign.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
            Train on a real architecture canvas — load balancers, caches, queues, databases.
            Then free practice, personal{" "}
            <span className="text-zinc-200">Solo Mode</span> levels, or competitive{" "}
            <span className="text-zinc-200">Campaign</span> seasons.{" "}
            <span className="text-zinc-200">SpaceXAI</span> is interviewer and scorer.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/training"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-500"
            >
              Learn · training
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/solo"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-900/30 hover:bg-amber-500"
            >
              Play Solo Mode
            </Link>
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-zinc-300 hover:bg-white/5"
            >
              Free practice
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Bot,
                title: "Learn",
                body: "Training + guided builds for the building blocks of real system design.",
              },
              {
                icon: Target,
                title: "Practice",
                body: "Full canvas problems. SpaceXAI scores scale, bottlenecks, and failure modes.",
              },
              {
                icon: Trophy,
                title: "Play & compete",
                body: "Solo Mode for personal levels. Campaign for 3-day seasons and leaderboards.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-zinc-900/50 p-4"
              >
                <Icon className="mb-2 h-5 w-5 text-sky-400" />
                <p className="text-sm font-medium text-zinc-100">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{body}</p>
              </div>
            ))}
          </div>
        </header>

        <section aria-label="Modes">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
            Choose a mode
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <Link
                  key={mode.href}
                  href={mode.href}
                  className={`group flex flex-col rounded-2xl border bg-zinc-900/40 p-5 transition hover:bg-zinc-900/80 ${mode.accent}`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <Icon className={`h-6 w-6 ${mode.iconClass}`} />
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                      {mode.tagline}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{mode.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500">
                    {mode.body}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-300 group-hover:text-white">
                    {mode.cta}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-zinc-600">
          Powered by SpaceXAI (xAI) · set <code className="text-zinc-400">XAI_API_KEY</code> in{" "}
          <code className="text-zinc-400">.env.local</code>
        </footer>
      </div>
    </div>
  );
}
