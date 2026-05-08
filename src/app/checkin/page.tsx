import { MobileShell } from "@/components/layout/mobile-shell";
import { CheckinView } from "@/features/checkin/checkin-view";

export default function CheckinPage() {
  return (
    <MobileShell active="checkin">
      <CheckinView />
    </MobileShell>
  );
}
