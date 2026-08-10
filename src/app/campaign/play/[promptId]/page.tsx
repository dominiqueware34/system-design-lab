import { redirect } from "next/navigation";
import { CampaignPlayClient } from "@/components/campaign/CampaignPlayClient";
import { getOptionalUser } from "@/lib/supabase/server";

/**
 * Competitive Campaign play — Google sign-in required (not only on submit).
 * Guests are redirected away from /campaign/play/*.
 */
export default async function CampaignPlayPage({
  params,
}: {
  params: Promise<{ promptId: string }>;
}) {
  const { promptId } = await params;

  if (!promptId) {
    redirect("/campaign");
  }

  const user = await getOptionalUser();
  if (!user) {
    redirect(
      `/campaign?signin=1&next=${encodeURIComponent(`/campaign/play/${promptId}`)}`
    );
  }

  return <CampaignPlayClient promptId={promptId} />;
}
