import { notFound } from "next/navigation";
import { DesignWorkspace } from "@/components/canvas/DesignWorkspace";
import { getProblemById, PROBLEMS } from "@/lib/problems";
import { getCampaignLevel } from "@/lib/campaign";

export default async function DesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ problemId: string }>;
  searchParams: Promise<{ solo?: string; campaign?: string }>;
}) {
  const { problemId } = await params;
  const sp = await searchParams;
  // Prefer ?solo=; accept legacy ?campaign= as Solo map alias
  const levelParam = sp.solo || sp.campaign;
  const problem = getProblemById(problemId);

  if (!problem) {
    notFound();
  }

  // Validate Solo map level points at this problem
  let campaignLevelId: string | undefined;
  if (levelParam) {
    const level = getCampaignLevel(levelParam);
    if (level && level.problemId === problemId) {
      campaignLevelId = level.id;
    }
  }

  return <DesignWorkspace problem={problem} campaignLevelId={campaignLevelId} />;
}

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ problemId: p.id }));
}
