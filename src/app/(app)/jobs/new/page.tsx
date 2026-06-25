import { Suspense } from "react";
import { NewJobClient } from "@/components/jobs/NewJobClient";

export const dynamic = "force-dynamic";

export default function NewJobPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--color-muted)]">…</p>}>
      <NewJobClient />
    </Suspense>
  );
}
