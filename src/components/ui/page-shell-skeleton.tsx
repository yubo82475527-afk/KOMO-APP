import { MobileShell } from "@/components/layout/mobile-shell";
import type { MainView } from "@/features/shared/types";

export function PageShellSkeleton({ active }: { active: MainView }) {
  return (
    <MobileShell active={active}>
      <div className="space-y-4 animate-pulse">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="h-4 w-24 rounded-full bg-[#eadfce]" />
          <div className="mt-3 h-7 w-40 rounded-full bg-[#e2d4c1]" />
          <div className="mt-4 space-y-2">
            <div className="h-4 rounded-full bg-[#f0e5d7]" />
            <div className="h-4 w-5/6 rounded-full bg-[#f0e5d7]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 rounded-2xl bg-white shadow-sm" />
          <div className="h-28 rounded-2xl bg-white shadow-sm" />
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="h-5 w-32 rounded-full bg-[#eadfce]" />
          <div className="mt-4 space-y-3">
            <div className="h-16 rounded-2xl bg-[#f6f1ea]" />
            <div className="h-16 rounded-2xl bg-[#f6f1ea]" />
            <div className="h-16 rounded-2xl bg-[#f6f1ea]" />
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
