"use client";

import type { MainView } from "@/features/shared/types";

export type AdminPendingView =
  | "overview"
  | "storeOperations"
  | "customerOperations"
  | "schedule"
  | "productsInventory"
  | "upload"
  | "reports"
  | "configs"
  | "organization"
  | "approval";

type PendingNavigation =
  | {
      href: string;
      type: "mobile";
      view: MainView;
    }
  | {
  href: string;
      type: "admin";
      view: AdminPendingView;
    }
  | null;

const listeners = new Set<() => void>();
let pendingNavigation: PendingNavigation = null;

export function subscribePendingNavigation(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPendingNavigationSnapshot() {
  return pendingNavigation;
}

export function getPendingNavigationServerSnapshot() {
  return null;
}

export function startPendingNavigation(href: string) {
  const mobileView = resolveMobileMainView(href);
  if (mobileView) {
    pendingNavigation = { href, type: "mobile", view: mobileView };
    emitPendingNavigationChange();
    return;
  }

  const adminView = resolveAdminView(href);
  if (!adminView) return;
  pendingNavigation = { href, type: "admin", view: adminView };
  emitPendingNavigationChange();
}

export function clearPendingNavigation() {
  if (!pendingNavigation) return;
  pendingNavigation = null;
  emitPendingNavigationChange();
}

function emitPendingNavigationChange() {
  listeners.forEach((listener) => listener());
}

function resolveMobileMainView(href: string): MainView | null {
  const path = href.split("?")[0]?.replace(/\/$/, "") || "/";
  if (path === "/") return "home";
  if (path === "/approval") return "approval";
  if (path === "/schedule") return "schedule";
  if (path === "/checkin") return "checkin";
  if (path === "/profile") return "profile";
  return null;
}

function resolveAdminView(href: string): AdminPendingView | null {
  const path = href.split("?")[0]?.replace(/\/$/, "") || "/";
  if (path === "/admin" || path === "/admin/overview") return "overview";
  if (path === "/admin/store-operations") return "storeOperations";
  if (path === "/admin/customer-operations") return "customerOperations";
  if (path === "/admin/schedule") return "schedule";
  if (path === "/admin/products-inventory") return "productsInventory";
  if (path === "/admin/data-upload") return "upload";
  if (path === "/admin/reports") return "reports";
  if (path === "/admin/configs") return "configs";
  if (path === "/admin/organization") return "organization";
  if (path === "/admin/approval") return "approval";
  return null;
}
