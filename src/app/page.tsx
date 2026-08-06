import Link from "next/link";
import { DIFFICULTY_META, PROBLEMS } from "@/lib/problems";
import type { Difficulty } from "@/lib/types";
import { ArrowRight, Layers, Sparkles, Target, Workflow } from "lucide-react";

const ORDER: Difficulty[] = ["easy", "medium", "hard"];

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.15),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.08),_transparent_40%)]" />

      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-16">
        <header className="mb-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            SpaceXAI system design interviewer
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Design systems.
            <span className="block text-zinc-400">Defend them under fire.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
            Drag components onto a canvas, tune attributes for latency and scale, then submit
            your architecture. Grok scores the design and asks failure-mode follow-ups until
            your system holds up.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Layers,
                title: "Component catalog",
                body: "DBs, queues, LBs, CDNs, caches — with real attributes.",
              },
              {
                icon: Workflow,
                title: "Wire the graph",
                body: "Connect services and export the design as JSON.",
              },
              {
                icon: Target,
                title: "Socratic follow-ups",
                body: "Miss redundancy? What happens when X fails?",
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

        <div className="space-y-10">
          {ORDER.map((difficulty) => {
            const meta = DIFFICULTY_META[difficulty];
            const problems = PROBLEMS.filter((p) => p.difficulty === difficulty);
            return (
              <section key={difficulty}>
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 className={`text-lg font-semibold ${meta.color}`}>{meta.label}</h2>
                  <p className="text-sm text-zinc-600">{meta.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {problems.map((problem) => (
                    <Link
                      key={problem.id}
                      href={`/design/${problem.id}`}
                      className="group flex flex-col rounded-xl border border-white/10 bg-zinc-900/40 p-4 transition hover:border-violet-500/40 hover:bg-zinc-900/80"
                    >
                      <h3 className="font-medium text-zinc-50 group-hover:text-white">
                        {problem.title}
                      </h3>
                      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-zinc-500">
                        {problem.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {problem.evaluationFocus.slice(0, 3).map((f) => (
                          <span
                            key={f}
                            className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-400 opacity-0 transition group-hover:opacity-100">
                        Open canvas
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-zinc-600">
          Powered by SpaceXAI (xAI) · set <code className="text-zinc-400">XAI_API_KEY</code> in{" "}
          <code className="text-zinc-400">.env.local</code>
        </footer>
      </div>
    </div>
  );
}
