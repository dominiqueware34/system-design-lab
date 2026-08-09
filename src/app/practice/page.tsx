import { ProblemPicker } from "@/components/practice/ProblemPicker";
import { Target } from "lucide-react";

export const metadata = {
  title: "Practice · System Design Lab",
  description:
    "Free practice: full system design problems on the canvas. SpaceXAI scores scale, bottlenecks, and failure modes.",
};

export default function PracticePage() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.12),_transparent_50%)]" />
      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-10">
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
            <Target className="h-3.5 w-3.5" />
            Practice mode
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Free practice problems
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
            Full canvas designs with AI scoring. No Solo unlocks, no season rules — just
            rehearse architectures and get Socratic feedback from SpaceXAI.
          </p>
        </header>
        <ProblemPicker />
        <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-zinc-600">
          Powered by SpaceXAI (xAI) · set{" "}
          <code className="text-zinc-400">XAI_API_KEY</code> in{" "}
          <code className="text-zinc-400">.env.local</code>
        </footer>
      </div>
    </div>
  );
}
