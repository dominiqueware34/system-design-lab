import { notFound } from "next/navigation";
import { DesignWorkspace } from "@/components/canvas/DesignWorkspace";
import { getProblemById, PROBLEMS } from "@/lib/problems";
import { getCampaignLevel } from "@/lib/campaign";
import { getSoloLevel, getSoloLevelProblem } from "@/lib/solo-levels";

export default async function DesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ problemId: string }>;
  searchParams: Promise<{ solo?: string; campaign?: string }>;
}) {
  const { problemId } = await params;
  const sp = await searchParams;
  const problem = getProblemById(problemId);

  if (!problem) {
    notFound();
  }

  // Prefer multi-problem Solo levels (?solo=solo-l1)
  let soloLevelId: string | undefined;
  if (sp.solo) {
    const soloLevel = getSoloLevel(sp.solo);
    if (soloLevel && getSoloLevelProblem(soloLevel.id, problemId)) {
      soloLevelId = soloLevel.id;
    }
  }

  // Legacy 15-level map: ?campaign=w1-l1 or old ?solo=w1-l1 when not a solo level id
  let campaignLevelId: string | undefined;
  if (!soloLevelId) {
    const levelParam = sp.campaign || sp.solo;
    if (levelParam) {
      const level = getCampaignLevel(levelParam);
      if (level && level.problemId === problemId) {
        campaignLevelId = level.id;
      }
    }
  }

  return (
    <DesignWorkspace
      problem={problem}
      soloLevelId={soloLevelId}
      campaignLevelId={campaignLevelId}
    />
  );
}

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ problemId: p.id }));
}
