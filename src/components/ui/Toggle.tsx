import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ToggleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed: boolean;
};

export function Toggle({ pressed, className, ...props }: ToggleProps) {
  return (
    <button
      aria-pressed={pressed}
      className={clsx(
        "inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-200 cursor-pointer",
        "hover:border-accent hover:text-accent hover:bg-surface-raised hover:shadow-sm transform hover:scale-105",
        pressed ? "border-accent text-accent" : "text-muted",
        className
      )}
      {...props}
    />
  );
}
