"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/contexts/LocaleProvider";
import { inputClassName, textareaClassName } from "@/lib/ui/input-styles";
import type { Job } from "@/types/database";
import type { ScrapedJobDraft } from "@/services/job-scrape";

interface JobFromLinkFormProps {
  onJobCreated: (job: Job) => void;
}

/**
 * Add a job by pasting a URL — scrapes and parses with AI.
 */
export function JobFromLinkForm({ onJobCreated }: JobFromLinkFormProps) {
  const t = useT();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<ScrapedJobDraft | null>(null);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [requirements, setRequirements] = useState("");
  const [salary, setSalary] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setAnalyzing(true);
    setMessage(null);
    setDraft(null);

    let res: Response;
    try {
      res = await fetch("/api/jobs/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch {
      setAnalyzing(false);
      setMessage(t("newJob.scrapeFailed"));
      return;
    }

    setAnalyzing(false);

    if (res.ok) {
      const data = (await res.json()) as { draft: ScrapedJobDraft };
      setDraft(data.draft);
      setTitle(data.draft.title);
      setCompany(data.draft.company);
      setDescription(data.draft.description);
      setSummary(data.draft.summary);
      setRequirements(data.draft.requirements);
      setSalary(data.draft.salary);
      return;
    }

    let errorPayload: { error?: string; code?: string } = {};
    try {
      errorPayload = (await res.json()) as { error?: string; code?: string };
    } catch {
      // ignore: fall back to generic message
    }
    setMessage(errorPayload.error ?? t("newJob.scrapeFailed"));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        company,
        url,
        description,
        summary,
        requirements,
        salary,
        input_mode: "link",
      }),
    });

    setCreating(false);

    if (res.ok) {
      const data = (await res.json()) as { job: Job };
      onJobCreated(data.job);
      router.push(`/applications/${data.job.id}`);
      return;
    }

    const data = (await res.json()) as { error?: string; jobId?: string };
    if (res.status === 409 && data.jobId) {
      router.push(`/applications/${data.jobId}`);
      return;
    }
    setMessage(data.error ?? t("addJob.failed"));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAnalyze} className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium">
            {t("newJob.fieldUrl")}
          </label>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className={inputClassName}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={analyzing}>
            <Link2 className="h-4 w-4" />
            {analyzing ? t("newJob.analyzing") : t("newJob.analyzeUrl")}
          </Button>
        </div>
      </form>

      {(draft || description) && (
        <form onSubmit={handleCreate} className="surface-card space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">{t("addJob.fieldTitle")}</label>
              <input className={inputClassName} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">{t("addJob.fieldCompany")}</label>
              <input className={inputClassName} value={company} onChange={(e) => setCompany(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t("addJob.fieldDescription")}</label>
            <textarea className={textareaClassName} rows={8} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t("addJob.fieldRequirements")}</label>
            <textarea className={textareaClassName} rows={3} value={requirements} onChange={(e) => setRequirements(e.target.value)} />
          </div>
          <Button type="submit" disabled={creating} className="w-full">
            {creating ? t("newJob.creating") : t("newJob.createApplication")}
          </Button>
        </form>
      )}

      {message && (
        <p className="text-sm text-[var(--color-danger)]">{message}</p>
      )}
    </div>
  );
}
