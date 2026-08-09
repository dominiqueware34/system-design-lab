import { CampaignMap } from "@/components/campaign/CampaignMap";

export const metadata = {
  title: "Solo Mode · System Design Lab",
  description:
    "Solo Mode: personal progression through architecture levels. Temporary 15-level map until multi-problem levels ship.",
};

export default function SoloPage() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <CampaignMap />
    </div>
  );
}
