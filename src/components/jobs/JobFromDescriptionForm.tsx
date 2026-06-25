"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { useT } from "@/contexts/LocaleProvider";
import type { Job } from "@/types/database";

interface JobFromDescriptionFormProps {
  onJobCreated: (job: Job) => void;
}

const inputClass =
  "w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]";

/**
 * Add a job by pasting the full description (no URL required).
 */
export function JobFromDescriptionForm({ onJobCreated }: JobFromDescriptionFormProps) {
  const t = useT();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || undefined,
        company: company || undefined,
        description,
        input_mode: "manual",
      }),
    });

    setCreating(false);

    if (res.ok) {
      const data = (await res.json()) as { job: Job };
      onJobCreated(data.job);
      router.push(`/applications/${data.job.id}`);
      return;
    }

    const data = (await res.json()) as { error?: string };
    setMessage(data.error ?? t("addJob.failed"));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-[var(--color-muted)]">{t("newJob.inferHint")}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">{t("addJob.fieldTitle")}</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t("addJob.fieldCompany")}</label>
          <input className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium">{t("newJob.fieldDescription")}</label>
        <p className="mb-1 text-xs text-[var(--color-muted)]">{t("newJob.fieldDescriptionHint")}</p>
        <textarea
          className={inputClass}
          rows={12}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={creating}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        <FileText className="h-4 w-4" />
        {creating ? t("newJob.creating") : t("newJob.createApplication")}
      </button>

      {message && <p className="text-sm text-[var(--color-danger)]">{message}</p>}
    </form>
  );
}
