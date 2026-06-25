"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link2, FileText } from "lucide-react";
import { useT } from "@/contexts/LocaleProvider";
import { cn } from "@/lib/utils";
import { JobFromLinkForm } from "@/components/jobs/JobFromLinkForm";
import { JobFromDescriptionForm } from "@/components/jobs/JobFromDescriptionForm";
import type { Job } from "@/types/database";

type Tab = "link" | "description";

/**
 * New job offer page with link vs description tabs.
 */
export function NewJobClient() {
  const t = useT();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "description" ? "description" : "link";
  const [tab, setTab] = useState<Tab>(initialTab);

  function handleJobCreated(_job: Job) {
    // Navigation handled in child forms
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{t("newJob.title")}</h1>
        <p className="text-sm text-[var(--color-muted)]">{t("newJob.subtitle")}</p>
      </header>

      <div className="mb-6 flex gap-2 rounded-xl border border-[var(--color-card-border)] p-1">
        <TabButton
          active={tab === "link"}
          onClick={() => setTab("link")}
          icon={Link2}
          label={t("newJob.tabLink")}
        />
        <TabButton
          active={tab === "description"}
          onClick={() => setTab("description")}
          icon={FileText}
          label={t("newJob.tabDescription")}
        />
      </div>

      {tab === "link" ? (
        <JobFromLinkForm onJobCreated={handleJobCreated} />
      ) : (
        <JobFromDescriptionForm onJobCreated={handleJobCreated} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Link2;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--color-accent)] text-white"
          : "text-[var(--color-muted)] hover:bg-[var(--color-background)]"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
