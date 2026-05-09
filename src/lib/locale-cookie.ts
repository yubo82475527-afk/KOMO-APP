import { defaultLocale, isSupportedLocale, type SupportedLocale } from "@/lib/i18n";

export const LOCALE_COOKIE_NAME = "komo-locale";

export function normalizeLocale(value: string | null | undefined): SupportedLocale {
  if (!value) return defaultLocale;
  if (isSupportedLocale(value)) return value;
  if (value.toLowerCase().startsWith("en")) return "en";
  return "zh-CN";
}
