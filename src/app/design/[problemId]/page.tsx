import { notFound } from "next/navigation";
import { DesignWorkspace } from "@/components/canvas/DesignWorkspace";
import { getProblemById, PROBLEMS } from "@/lib/problems";
import { getCampaignLevel } from "@/lib/campaign";

export default async function DesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ problemId: string }>;
  searchParams: Promise<{ campaign?: string }>;
}) {
  const { problemId } = await params;
  const { campaign } = await searchParams;
  const problem = getProblemById(problemId);

  if (!problem) {
    notFound();
  }

  // Validate campaign level points at this problem
  let campaignLevelId: string | undefined;
  if (campaign) {
    const level = getCampaignLevel(campaign);
    if (level && level.problemId === problemId) {
      campaignLevelId = level.id;
    }
  }

  return <DesignWorkspace problem={problem} campaignLevelId={campaignLevelId} />;
}

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ problemId: p.id }));
}
