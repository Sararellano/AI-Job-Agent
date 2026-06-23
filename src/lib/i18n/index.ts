import { en, type EnKeys } from "./en";
import { es } from "./es";
import type { Locale } from "./types";

const dictionaries = { en, es } as const;

export function translate(
  locale: Locale,
  key: EnKeys,
  vars?: Record<string, string | number>
): string {
  let text = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return text;
}

export { en, es };
export type { EnKeys, Locale };
