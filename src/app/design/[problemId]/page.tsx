import { notFound } from "next/navigation";
import { DesignWorkspace } from "@/components/canvas/DesignWorkspace";
import { getProblemById, PROBLEMS } from "@/lib/problems";

export default async function DesignPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const { problemId } = await params;
  const problem = getProblemById(problemId);

  if (!problem) {
    notFound();
  }

  return <DesignWorkspace problem={problem} />;
}

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ problemId: p.id }));
}
