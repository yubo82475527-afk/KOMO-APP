"use client";

import { useMemo, useState } from "react";
import { getDictionary } from "@/lib/i18n";
import { Section } from "@/components/ui/section";
import { SignOutButton } from "@/features/auth/sign-out-button";
import type { AppViewer } from "@/features/auth/viewer";

export function ProfileView({ viewer }: { viewer: Extract<AppViewer, { state: "ready" }> }) {
  const dictionary = getDictionary(viewer.locale);
  const avatar = viewer.profile.fullName.slice(0, 1);
  const [localeState, setLocaleState] = useState<"zh-CN" | "en" | "browser">(viewer.profile.preferredLocale ?? "browser");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);

  async function updateLocale(value: "zh-CN" | "en" | "browser") {
    setLocaleState(value);
    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/profile/locale", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        preferredLocale: value === "browser" ? null : value,
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error ?? dictionary.profile.localeSaveFailed);
      return;
    }

    setStatus("saved");
    setMessage(dictionary.profile.localeSaved);
    window.location.reload();
  }

  return (
    <>
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-full bg-[#8a5a2f] text-xl font-semibold text-white">{avatar}</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a6b3d]">{dictionary.common.komoMember}</p>
            <h2 className="mt-1 text-lg font-semibold">
              {viewer.profile.fullName} · {viewer.profile.employeeNo ?? dictionary.profile.noEmployeeNo}
            </h2>
            <p className="text-sm text-[#607089]">{viewer.profile.departmentName ?? dictionary.profile.unassignedDepartment}</p>
            <p className="text-sm text-[#607089]">{viewer.user.email ?? dictionary.profile.unboundEmail}</p>
          </div>
        </div>
      </section>

      <MenuSection
        title={dictionary.profile.myAccount}
        items={[
          `${dictionary.profile.employeeStatus}：${viewer.profile.status === "active" ? dictionary.profile.normal : dictionary.profile.suspended}`,
          `${dictionary.profile.role}：${viewer.roles.join(" / ") || dictionary.profile.noRole}`,
          `${dictionary.profile.userId}：${viewer.user.id.slice(0, 8)}...`,
        ]}
        locale={viewer.locale}
      />
      <MenuSection title={dictionary.profile.records} items={[dictionary.profile.leaveRecords, dictionary.profile.attendanceRecords, dictionary.profile.scheduleHistory]} locale={viewer.locale} />

      <Section title={dictionary.profile.languageSetting}>
        <div className="space-y-3 text-sm">
          <p className="text-[#607089]">{dictionary.profile.languageDescription}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "browser" as const, label: dictionary.profile.followBrowser },
              { key: "zh-CN" as const, label: dictionary.profile.chinese },
              { key: "en" as const, label: dictionary.profile.english },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={status === "saving"}
                onClick={() => void updateLocale(item.key)}
                className={`rounded-xl px-3 py-3 text-sm font-medium ${localeState === item.key ? "bg-[#184e77] text-white" : "bg-[#eef2f6] text-[#526174]"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {message ? <p className={status === "error" ? "text-[#c1121f]" : "text-[#2d6a4f]"}>{message}</p> : null}
        </div>
      </Section>

      <Section title={dictionary.profile.timezoneDisplay}>
        <div className="space-y-2 text-sm">
          <p className="text-[#607089]">{dictionary.profile.timezoneDescription}</p>
          <div className="rounded-xl bg-[#f6f8fb] p-3 font-medium text-[#17202f]">
            {dictionary.profile.timezoneValuePrefix}：{timeZone}
          </div>
        </div>
      </Section>

      <SignOutButton redirectTo="/profile" locale={viewer.locale} />
    </>
  );
}

function MenuSection({ title, items, locale }: { title: string; items: string[]; locale: Extract<AppViewer, { state: "ready" }>["locale"] }) {
  const dictionary = getDictionary(locale);
  return (
    <Section title={title}>
      <div className="divide-y divide-[#e6eaf0]">
        {items.map((item) => (
          <div key={item} className="flex w-full items-center justify-between py-3 text-left">
            <span>{item}</span>
            <span className="text-[#8a97a8]">{dictionary.common.view}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
