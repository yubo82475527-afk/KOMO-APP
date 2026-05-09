import { getDictionary } from "@/lib/i18n";
import { AppLink } from "@/components/ui/app-link";
import { Section } from "@/components/ui/section";
import type { AppViewer } from "@/features/auth/viewer";

export function HomeView({ viewer }: { viewer: Extract<AppViewer, { state: "ready" }> }) {
  const dictionary = getDictionary(viewer.locale);
  const avatar = viewer.profile.fullName.slice(0, 1);
  const departmentLabel = viewer.profile.departmentName ?? dictionary.home.unassignedDepartment;
  const roleLabel = viewer.roles.length > 0 ? viewer.roles.join(" / ") : dictionary.home.noRole;

  return (
    <>
      <section className="rounded-3xl bg-[linear-gradient(135deg,#8a5a2f_0%,#c2874d_55%,#e8c08e_100%)] p-5 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-full bg-white/20 text-lg font-semibold">{avatar}</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">{dictionary.common.komoWorkspace}</p>
            <h2 className="mt-1 text-xl font-semibold">{viewer.profile.fullName}</h2>
            <p className="text-sm text-white/85">
              {departmentLabel} 路 {viewer.user.email ?? dictionary.home.unboundEmail}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {dictionary.home.quickActions.map((item) => (
          <AppLink
            key={item.title}
            href={item.href}
            className="rounded-2xl border border-[#eadfce] bg-white p-4 shadow-sm transition"
            pendingClassName="scale-[0.99] bg-[#f8f3ec]"
          >
            <p className="font-semibold">{item.title}</p>
            <p className="mt-2 text-xs leading-5 text-[#607089]">{item.description}</p>
          </AppLink>
        ))}
      </section>

      <Section title={dictionary.home.accountInfo}>
        <div className="space-y-3">
          <div className="rounded-xl bg-[#f8f3ec] p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {dictionary.home.employeeNo} {viewer.profile.employeeNo ?? dictionary.common.notSet}
              </p>
              <span className="rounded-full bg-[#8a5a2f] px-2 py-1 text-xs text-white">
                {viewer.profile.status === "active" ? dictionary.common.enabled : dictionary.common.disabled}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#6b5845]">{dictionary.home.welcome}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#fff8f1] p-3">
              <p className="text-sm text-[#607089]">{dictionary.home.loginEmail}</p>
              <p className="mt-1 break-all text-base font-semibold text-[#17202f]">{viewer.user.email ?? dictionary.common.notSet}</p>
            </div>
            <div className="rounded-xl bg-[#f6f1ea] p-3">
              <p className="text-sm text-[#607089]">{dictionary.home.accountRole}</p>
              <p className="mt-1 text-sm font-semibold text-[#17202f]">{roleLabel}</p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
