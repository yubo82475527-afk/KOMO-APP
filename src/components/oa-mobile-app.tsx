"use client";

import { MobileShell } from "@/components/layout/mobile-shell";
import type { MainView } from "@/features/shared/types";

export function OaMobileApp({ view }: { view: MainView }) {
  return (
    <MobileShell active={view}>
      <section className="rounded-3xl border border-[#e6ddd3] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#17202f]">KOMO 页面已迁移</h2>
        <p className="mt-2 text-sm leading-6 text-[#607089]">这个旧组件入口已经停用，请通过对应业务路由访问当前生产版本。</p>
      </section>
    </MobileShell>
  );
}
