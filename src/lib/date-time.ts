import type { SupportedLocale } from "./i18n";

export function getLocaleTag(locale: SupportedLocale) {
  return locale === "en" ? "en-US" : "zh-CN";
}

export function formatDateTime(value: string | null, locale: SupportedLocale, options?: Intl.DateTimeFormatOptions, timeZone?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    ...(options ?? {}),
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(value));
}

export function formatDate(value: string, locale: SupportedLocale, options?: Intl.DateTimeFormatOptions, timeZone?: string) {
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    ...(options ?? {}),
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(value));
}
