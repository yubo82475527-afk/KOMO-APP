import { headers } from "next/headers";
import { defaultLocale, resolveLocaleFromAcceptLanguage, type SupportedLocale } from "./i18n";

export async function getRequestLocale(): Promise<SupportedLocale> {
  const headerStore = await headers();
  return resolveLocaleFromAcceptLanguage(headerStore.get("accept-language")) ?? defaultLocale;
}
