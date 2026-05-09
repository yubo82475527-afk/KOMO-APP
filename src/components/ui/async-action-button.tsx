"use client";

import { cx } from "@/components/ui/class-name";

type AsyncActionButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  isPending: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
};

export function AsyncActionButton({
  idleLabel,
  pendingLabel,
  isPending,
  disabled = false,
  className,
  type = "button",
  onClick,
}: AsyncActionButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isPending}
      aria-busy={isPending}
      onClick={onClick}
      className={cx("transition disabled:cursor-not-allowed disabled:opacity-60", className)}
    >
      {isPending ? pendingLabel : idleLabel}
    </button>
  );
}
