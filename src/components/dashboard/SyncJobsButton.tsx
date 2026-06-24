"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/contexts/LocaleProvider";

interface SyncJobsButtonProps {
  className?: string;
}

/**
 * Triggers a manual sync from configured job connectors.
 */
export function SyncJobsButton({ className }: SyncJobsButtonProps) {
  const t = useT();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    setIsError(false);

    const res = await fetch("/api/jobs/sync", { method: "POST" });
    const data = (await res.json()) as {
      error?: string;
      totals?: { inserted: number; fetched: number; skipped: number; errors: number };
    };

    setSyncing(false);

    if (!res.ok) {
      setIsError(true);
      setMessage(data.error ?? t("sync.failed"));
      return;
    }

    const { inserted = 0, fetched = 0 } = data.totals ?? {};
    const keywordsUsed = (data as { keywordsUsed?: string[] }).keywordsUsed ?? [];
    const keywordHint =
      keywordsUsed.length > 0
        ? ` ${t("sync.keywordsUsed", { keywords: keywordsUsed.slice(0, 5).join(", ") })}`
        : "";
    setMessage(
      `${t("sync.success", { inserted: String(inserted), fetched: String(fetched) })}${keywordHint}`
    );
    router.refresh();
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-card-border)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-60"
      >
        <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
        {syncing ? t("sync.syncing") : t("sync.button")}
      </button>
      {message && (
        <p
          className={cn(
            "text-sm",
            isError ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
