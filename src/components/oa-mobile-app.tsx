"use client";

import { MobileShell } from "@/components/layout/mobile-shell";
import type { MainView } from "@/features/shared/types";

export function OaMobileApp({ view }: { view: MainView }) {
  return (
    <MobileShell active={view}>
      <section className="rounded-3xl border border-[#d9dee8] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#17202f]">页面已升级</h2>
        <p className="mt-2 text-sm leading-6 text-[#607089]">这个旧入口已经停用，请通过对应业务路由访问最新的真实数据版本。</p>
      </section>
    </MobileShell>
  );
}
