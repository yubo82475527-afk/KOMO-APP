import { cookies, headers } from "next/headers";
import { defaultLocale, resolveLocaleFromAcceptLanguage, type SupportedLocale } from "./i18n";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "./locale-cookie";

export async function getRequestLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale) {
    return normalizeLocale(cookieLocale);
  }

  const headerStore = await headers();
  return resolveLocaleFromAcceptLanguage(headerStore.get("accept-language")) ?? defaultLocale;
}
