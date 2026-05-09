"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { cx } from "@/components/ui/class-name";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/locale-cookie";

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
  onFocus,
  onMouseEnter,
  onPointerDown,
  onTouchStart,
  children,
  ...props
}: AppLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hasPrefetchedRef = useRef(false);
  const [pendingSourcePath, setPendingSourcePath] = useState<string | null>(null);
  const hrefValue = typeof href === "string" ? href : href.pathname ?? "";

  const isActive = useMemo(() => {
    if (!hrefValue) return false;
    if (hrefValue === "/") return pathname === "/";
    return exact ? pathname === hrefValue : pathname === hrefValue || pathname.startsWith(`${hrefValue}/`);
  }, [exact, hrefValue, pathname]);
  const isPending = pendingSourcePath === pathname && !isActive;
  const prefetchTarget = () => {
    if (!hrefValue || isActive || hasPrefetchedRef.current) return;
    hasPrefetchedRef.current = true;
    router.prefetch(hrefValue);
  };

  return (
    <Link
      href={href}
      onFocus={(event) => {
        onFocus?.(event);
        prefetchTarget();
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        prefetchTarget();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        prefetchTarget();
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        prefetchTarget();
      }}
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

        const currentLocale = normalizeLocale(document.documentElement.lang);
        document.cookie = `${LOCALE_COOKIE_NAME}=${currentLocale}; path=/; max-age=31536000; samesite=lax`;
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
