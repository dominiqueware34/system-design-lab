import { SoloHub } from "@/components/solo/SoloHub";

export const metadata = {
  title: "Solo Mode · System Design Lab",
  description:
    "Solo Mode: personal multi-problem levels. Clear Foundations, unlock Agentic Frontier. Progress and duration — no wrenches, no ranking.",
};

export default function SoloPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.10),_transparent_50%)]" />
      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-10">
        <SoloHub />
        <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-zinc-600">
          Content via{" "}
          <code className="text-zinc-400">GET /api/solo/levels</code> · progress{" "}
          <code className="text-zinc-400">sdl-solo-progress-v1</code> + cloud when
          signed in
        </footer>
      </div>
    </div>
  );
}
