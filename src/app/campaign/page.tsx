import Link from "next/link";
import { CampaignMap } from "@/components/campaign/CampaignMap";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Campaign · System Design Lab",
  description:
    "Progressive path of system design levels—practice architectures and harden them under AI incident drills.",
};

export default function CampaignPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="border-b border-white/10 px-4 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
      </div>
      <CampaignMap />
    </div>
  );
}
