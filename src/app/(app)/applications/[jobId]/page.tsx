import { notFound } from "next/navigation";
import {
  loadAppUserContext,
  loadJobWithApplication,
} from "@/lib/server/app-data";
import { ApplicationWorkspace } from "@/components/applications/ApplicationWorkspace";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default async function ApplicationWorkspacePage({ params }: PageProps) {
  const { jobId } = await params;
  const ctx = await loadAppUserContext();
  if (!ctx) return null;

  const job = await loadJobWithApplication(ctx.userId, jobId);
  if (!job) notFound();

  return (
    <ApplicationWorkspace
      job={job}
      profile={ctx.profile}
      defaultCvExtraction={ctx.cvProfileExtraction}
      defaultCvInstructions={ctx.defaultCvInstructions}
      defaultCoverLetterInstructions={ctx.defaultCoverLetterInstructions}
      defaultCvPhotoUrl={ctx.defaultCvPhotoUrl}
      defaultCoverLetterPhotoUrl={ctx.defaultCoverLetterPhotoUrl}
      defaultCoverTemplateId={ctx.defaultCoverTemplateId}
    />
  );
}
