"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { cx } from "@/components/ui/class-name";

type AppLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    activeClassName?: string;
    pendingClassName?: string;
    exact?: boolean;
  };

export function AppLink({
  href,
  className,
  activeClassName,
  pendingClassName,
  exact = false,
  onClick,
  children,
  ...props
}: AppLinkProps) {
  const pathname = usePathname();
  const [pendingSourcePath, setPendingSourcePath] = useState<string | null>(null);
  const hrefValue = typeof href === "string" ? href : href.pathname ?? "";

  const isActive = useMemo(() => {
    if (!hrefValue) return false;
    if (hrefValue === "/") return pathname === "/";
    return exact ? pathname === hrefValue : pathname === hrefValue || pathname.startsWith(`${hrefValue}/`);
  }, [exact, hrefValue, pathname]);
  const isPending = pendingSourcePath === pathname && !isActive;

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          isActive ||
          !hrefValue
        ) {
          return;
        }

        setPendingSourcePath(pathname);
      }}
      aria-busy={isPending}
      className={cx(className, isActive && activeClassName, isPending && pendingClassName)}
      {...props}
    >
      {children}
    </Link>
  );
}
