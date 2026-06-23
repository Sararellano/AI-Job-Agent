export type Locale = "en" | "es";

export type TranslationKey = keyof typeof import("./en").en;
