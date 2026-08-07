import { notFound } from "next/navigation";
import { GuidedBuildWorkspace } from "@/components/training/GuidedBuildWorkspace";
import { getGuidedBuild, GUIDED_BUILDS } from "@/lib/guided-builds";

export default async function GuidedBuildPage({
  params,
}: {
  params: Promise<{ buildId: string }>;
}) {
  const { buildId } = await params;
  const build = getGuidedBuild(buildId);
  if (!build) notFound();
  return <GuidedBuildWorkspace build={build} />;
}

export function generateStaticParams() {
  return GUIDED_BUILDS.map((b) => ({ buildId: b.id }));
}
