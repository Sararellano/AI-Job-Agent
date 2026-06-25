"use client";

import type { ReactNode } from "react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useT } from "@/contexts/LocaleProvider";
import type { EnKeys } from "@/lib/i18n";

interface AuthPageShellProps {
  titleKey: EnKeys;
  subtitleKey: EnKeys;
  children: ReactNode;
}

export function AuthPageShell({ titleKey, subtitleKey, children }: AuthPageShellProps) {
  const t = useT();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-4">
      <ScrollReveal className="w-full max-w-md">
        <div className="surface-card p-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
            {t("app.name")}
          </p>
          <p className="mb-4 text-xs text-[var(--color-muted)]">{t("app.tagline")}</p>
          <h1 className="mb-1 text-2xl font-semibold">{t(titleKey)}</h1>
          <p className="mb-6 text-sm text-[var(--color-muted)]">{t(subtitleKey)}</p>
          {children}
        </div>
      </ScrollReveal>
    </main>
  );
}
