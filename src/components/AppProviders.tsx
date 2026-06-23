"use client";

import type { ReactNode } from "react";
import { LocaleProvider } from "@/contexts/LocaleProvider";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <div className="relative min-h-screen">
        <div className="pointer-events-none fixed right-4 top-4 z-[100]">
          <div className="pointer-events-auto rounded-lg border border-[var(--color-card-border)] bg-[var(--color-card)]/95 p-1 shadow-sm backdrop-blur">
            <LanguageSwitch />
          </div>
        </div>
        {children}
      </div>
    </LocaleProvider>
  );
}
