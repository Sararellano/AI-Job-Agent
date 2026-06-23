"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleProvider";
import type { Locale } from "@/lib/i18n";

interface LanguageSwitchProps {
  className?: string;
}

/**
 * Toggle between English (default) and Spanish for the UI.
 */
export function LanguageSwitch({ className }: LanguageSwitchProps) {
  const { locale, setLocale, t } = useLocale();

  function select(next: Locale) {
    setLocale(next);
  }

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      role="group"
      aria-label={t("lang.switch")}
    >
      {(["en", "es"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => select(code)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            locale === code
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          )}
          aria-pressed={locale === code}
        >
          {t(code === "en" ? "lang.en" : "lang.es")}
        </button>
      ))}
    </div>
  );
}
