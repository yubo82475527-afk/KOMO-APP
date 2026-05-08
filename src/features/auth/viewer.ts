import type { SupportedLocale } from "@/lib/i18n";
import { getAuthenticatedAppContext } from "./app-context";

export type AppViewer =
  | { state: "signed_out" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      user: {
        id: string;
        email: string | null;
      };
      profile: {
        id: string;
        employeeNo: string | null;
        fullName: string;
        departmentName: string | null;
        status: "active" | "disabled";
        preferredLocale: SupportedLocale | null;
      };
      roles: string[];
      locale: SupportedLocale;
    };

export async function getAppViewer(): Promise<AppViewer> {
  const context = await getAuthenticatedAppContext();
  if (context.state !== "ready") {
    return context;
  }

  return {
    state: "ready",
    user: {
      id: context.user.id,
      email: context.user.email,
    },
    profile: {
      id: context.profile.id,
      employeeNo: context.profile.employee_no,
      fullName: context.profile.full_name,
      departmentName: context.departmentName,
      status: context.profile.status,
      preferredLocale: context.profile.preferred_locale,
    },
    roles: context.roles,
    locale: context.locale,
  };
}
