import { MobileShell } from "@/components/layout/mobile-shell";
import type { SupportedLocale } from "@/lib/i18n";
import { AuthCard } from "@/features/auth/auth-card";
import type { MainView } from "@/features/shared/types";

export function SignedOutState({
  active,
  redirectTo,
  title,
  description,
  locale = "zh-CN",
}: {
  active: MainView;
  redirectTo: string;
  title: string;
  description: string;
  locale?: SupportedLocale;
}) {
  return (
    <MobileShell active={active} locale={locale}>
      <section className="rounded-3xl border border-[#d9dee8] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-[#17202f]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#607089]">{description}</p>
      </section>
      <AuthCard redirectTo={redirectTo} locale={locale} />
    </MobileShell>
  );
}

export function ErrorState({ active, title, message, locale = "zh-CN" }: { active: MainView; title: string; message: string; locale?: SupportedLocale }) {
  return (
    <MobileShell active={active} locale={locale}>
      <section className="rounded-3xl border border-[#ffd6d6] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-[#17202f]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#607089]">{message}</p>
      </section>
    </MobileShell>
  );
}
