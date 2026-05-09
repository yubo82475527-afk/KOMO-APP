import { getRequestLocale } from "@/lib/i18n-server";
import { PageShellSkeleton } from "@/components/ui/page-shell-skeleton";

export default async function Loading() {
  return <PageShellSkeleton active="checkin" locale={await getRequestLocale()} />;
}
