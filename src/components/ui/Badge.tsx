import type { HTMLAttributes } from "react";
import clsx from "clsx";

type BadgeTone = "default" | "success" | "warning" | "danger";

const toneStyles: Record<BadgeTone, string> = {
  default: "bg-surfaceRaised text-foreground",
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  danger: "bg-danger/20 text-danger",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold",
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}
