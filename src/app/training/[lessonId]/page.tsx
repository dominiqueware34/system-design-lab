import { notFound } from "next/navigation";
import { TrainingWorkspace } from "@/components/training/TrainingWorkspace";
import { getLesson, TRAINING_LESSONS } from "@/lib/training-lessons";

export default async function TrainingLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();
  return <TrainingWorkspace lesson={lesson} />;
}

export function generateStaticParams() {
  return TRAINING_LESSONS.map((l) => ({ lessonId: l.id }));
}
