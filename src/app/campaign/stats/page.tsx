import { redirect } from "next/navigation";
import { CampaignMyStats } from "@/components/campaign/CampaignMyStats";
import { getOptionalUser } from "@/lib/supabase/server";

export const metadata = {
  title: "My Campaign stats · System Design Lab",
  description:
    "Private per-prompt campaign times and attempt history (owner only).",
};

/**
 * My stats — auth required (private durations from /me).
 */
export default async function CampaignStatsPage() {
  const user = await getOptionalUser();
  if (!user) {
    redirect("/campaign?signin=1&next=/campaign/stats");
  }
  return <CampaignMyStats />;
}
