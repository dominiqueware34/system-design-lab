"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/training",
    label: "Training",
    match: (p: string) => p.startsWith("/training"),
  },
  {
    href: "/solo",
    label: "Solo Mode",
    match: (p: string) => p.startsWith("/solo"),
  },
  {
    href: "/campaign",
    label: "Campaign",
    match: (p: string) => p.startsWith("/campaign"),
  },
  {
    href: "/practice",
    label: "Practice",
    match: (p: string) => p.startsWith("/practice"),
  },
] as const;

/**
 * Primary product nav: Training | Solo Mode | Campaign | Practice.
 * Hidden on full-screen design canvas (own chrome).
 */
export function AppNav() {
  const pathname = usePathname() ?? "/";

  // Full-screen canvas: design workspace + campaign season play
  if (
    pathname.startsWith("/design") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/campaign/play")
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/90 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 pr-36 sm:gap-2 sm:pr-44">
        <Link
          href="/"
          className="mr-2 shrink-0 text-xs font-semibold tracking-tight text-zinc-300 hover:text-white sm:mr-4 sm:text-sm"
        >
          System Design Lab
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-0.5 sm:gap-1">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
