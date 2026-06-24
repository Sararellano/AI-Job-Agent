"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/contexts/LocaleProvider";
import type { Job, JobSource } from "@/types/database";
import { ALL_JOB_SOURCES } from "@/lib/jobs/job-sources";

interface AddJobFormProps {
  onJobAdded: (job: Job) => void;
}

/**
 * Collapsible form to add a job posting with a real application URL.
 */
export function AddJobForm({ onJobAdded }: AddJobFormProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState("");
  const [source, setSource] = useState<JobSource>("manual");
  const [summary, setSummary] = useState("");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setCompany("");
    setUrl("");
    setSource("manual");
    setSummary("");
    setSalary("");
    setDescription("");
    setRequirements("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        company,
        url,
        source,
        summary,
        salary,
        description,
        requirements,
      }),
    });

    setSaving(false);

    if (res.ok) {
      const data = (await res.json()) as { job: Job };
      onJobAdded(data.job);
      resetForm();
      setMessage(t("addJob.success"));
      setOpen(false);
      return;
    }

    const data = (await res.json()) as { error?: string; jobId?: string };
    if (res.status === 409 && data.jobId) {
      setMessage(t("addJob.duplicate"));
      return;
    }
    setMessage(data.error ?? t("addJob.failed"));
  }

  return (
    <section className="mb-6 rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-lg bg-[var(--color-accent)]/15 p-2 text-[var(--color-accent)]">
            <Plus className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-semibold">{t("addJob.title")}</h2>
            <p className="text-sm text-[var(--color-muted)]">
              {t("addJob.subtitle")}
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-[var(--color-muted)]" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-[var(--color-muted)]" />
        )}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-[var(--color-card-border)] p-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("addJob.fieldTitle")}</span>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("addJob.fieldCompany")}</span>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t("addJob.fieldUrl")}</span>
            <input
              type="url"
              required
              inputMode="url"
              placeholder="https://boards.greenhouse.io/company/jobs/12345"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
            <span className="mt-1 block text-xs text-[var(--color-muted)]">
              {t("addJob.fieldUrlHint")}
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("addJob.fieldSource")}</span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as JobSource)}
                className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              >
                {ALL_JOB_SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {t(`addJob.source.${value}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">{t("addJob.fieldSalary")}</span>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder={t("profile.salaryRangePlaceholder")}
                className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t("addJob.fieldSummary")}</span>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t("addJob.fieldDescription")}</span>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t("addJob.fieldRequirements")}</span>
            <textarea
              rows={3}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          {message && (
            <p
              className={cn(
                "text-sm",
                message === t("addJob.success")
                  ? "text-[var(--color-success)]"
                  : "text-[var(--color-danger)]"
              )}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? t("addJob.saving") : t("addJob.submit")}
          </button>
        </form>
      )}
    </section>
  );
}
