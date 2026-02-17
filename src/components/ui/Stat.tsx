import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Stat({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-md border border-border bg-surfaceRaised px-4 py-3",
        className
      )}
      {...props}
    />
  );
}

export function StatLabel({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={clsx("text-xs uppercase tracking-wide text-muted", className)} {...props} />
  );
}

export function StatValue({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={clsx("font-display text-2xl font-semibold", className)}
      {...props}
    />
  );
}

export function StatMeta({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={clsx("text-xs text-muted", className)} {...props} />;
}
