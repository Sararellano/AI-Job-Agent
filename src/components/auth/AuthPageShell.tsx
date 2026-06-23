"use client";

import type { ReactNode } from "react";
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
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card)] p-8">
        <h1 className="mb-1 text-2xl font-semibold">{t(titleKey)}</h1>
        <p className="mb-6 text-sm text-[var(--color-muted)]">{t(subtitleKey)}</p>
        {children}
      </div>
    </main>
  );
}
