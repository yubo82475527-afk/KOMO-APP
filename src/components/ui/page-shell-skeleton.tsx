import { MobileShell } from "@/components/layout/mobile-shell";
import { PageShellSkeletonContent } from "@/components/ui/page-shell-skeleton-content";
import type { MainView } from "@/features/shared/types";
import type { SupportedLocale } from "@/lib/i18n";

export function PageShellSkeleton({ active, locale = "zh-CN" }: { active: MainView; locale?: SupportedLocale }) {
  return (
    <MobileShell active={active} locale={locale}>
      <PageShellSkeletonContent />
    </MobileShell>
  );
}
