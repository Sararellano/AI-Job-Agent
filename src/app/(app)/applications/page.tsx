import { loadAppUserContext, loadJobsWithApplications } from "@/lib/server/app-data";
import { ApplicationsClient } from "@/components/applications/ApplicationsClient";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const ctx = await loadAppUserContext();
  if (!ctx) return null;

  const jobs = await loadJobsWithApplications(ctx.userId);

  return <ApplicationsClient jobs={jobs} />;
}
