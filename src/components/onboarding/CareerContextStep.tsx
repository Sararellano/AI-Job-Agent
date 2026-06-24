"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { UserCareerContext } from "@/types/career";
import { getSectorDefinitions, getRoleFamilies } from "@/lib/skills/registry";
import { useT } from "@/contexts/LocaleProvider";

interface CareerContextStepProps {
  onContinue: (context: UserCareerContext) => void;
}

/**
 * Step 2: Confirm employment sector, role family, and target role.
 */
export function CareerContextStep({ onContinue }: CareerContextStepProps) {
  const t = useT();
  const sectors = getSectorDefinitions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sector, setSector] = useState<UserCareerContext["sector"]>("tech");
  const [roleFamily, setRoleFamily] = useState("general");
  const [targetRole, setTargetRole] = useState("");

  useEffect(() => {
    fetch("/api/cv/career-context")
      .then((r) => r.json())
      .then(
        (data: {
          careerContext?: UserCareerContext;
          suggested?: UserCareerContext;
        }) => {
          const ctx = data.careerContext ?? data.suggested;
          if (ctx) {
            setSector(ctx.sector);
            setRoleFamily(ctx.roleFamily);
            setTargetRole(ctx.targetRole);
          }
          setLoading(false);
        }
      )
      .catch(() => setLoading(false));
  }, []);

  const roleFamilies = getRoleFamilies(sector);

  function handleSectorChange(nextSector: UserCareerContext["sector"]) {
    setSector(nextSector);
    const families = getRoleFamilies(nextSector);
    setRoleFamily(families[0]?.id ?? "general");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/cv/career-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sector, roleFamily, targetRole }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? t("common.error"));
      return;
    }

    onContinue({ sector, roleFamily, targetRole });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-8">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted)]" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-6"
    >
      <h2 className="mb-1 text-lg font-semibold">{t("onboarding.stepSectorTitle")}</h2>
      <p className="mb-4 text-sm text-[var(--color-muted)]">
        {t("onboarding.stepSectorSubtitle")}
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="sector"
            className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]"
          >
            {t("career.sectorLabel")}
          </label>
          <select
            id="sector"
            value={sector}
            onChange={(e) =>
              handleSectorChange(e.target.value as UserCareerContext["sector"])
            }
            className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          >
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {t(s.labelKey as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="roleFamily"
            className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]"
          >
            {t("career.roleFamilyLabel")}
          </label>
          <select
            id="roleFamily"
            value={roleFamily}
            onChange={(e) => setRoleFamily(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          >
            {roleFamilies.map((r) => (
              <option key={r.id} value={r.id}>
                {t(r.labelKey as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="targetRole"
            className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]"
          >
            {t("profile.targetRole")}
          </label>
          <input
            id="targetRole"
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder={t("career.targetRolePlaceholder")}
            className="w-full rounded-lg border border-[var(--color-card-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-6 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {saving ? t("onboarding.saving") : t("onboarding.continueReview")}
      </button>
    </form>
  );
}
