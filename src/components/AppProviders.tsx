"use client";

import type { ReactNode } from "react";
import { LocaleProvider } from "@/contexts/LocaleProvider";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <div className="relative min-h-screen">
        <div className="pointer-events-none fixed right-4 top-4 z-[100]">
          <div className="pointer-events-auto surface-card rounded-xl p-1 backdrop-blur-sm">
            <LanguageSwitch />
          </div>
        </div>
        {children}
      </div>
    </LocaleProvider>
  );
}
