import { ApprovalDetailPageView } from "@/features/approval/approval-detail-page";

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApprovalDetailPageView id={id} />;
}
