"use client";

import type { MainView } from "@/features/shared/types";

type PendingNavigation = {
  href: string;
  view: MainView;
} | null;

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
  const view = resolveMobileMainView(href);
  if (!view) return;
  pendingNavigation = { href, view };
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
