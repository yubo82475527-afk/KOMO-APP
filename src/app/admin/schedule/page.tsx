import { AdminSchedulePageView } from "@/features/admin-schedule/admin-schedule-page";

export default function AdminSchedulePage({ searchParams }: { searchParams: Promise<{ scopeDepartmentId?: string }> }) {
  return <AdminSchedulePageView searchParams={searchParams} />;
}
