import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "outline" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-accent text-onAccent shadow-glow hover:bg-accentStrong",
  outline: "border border-border text-foreground hover:border-accent",
  ghost: "text-foreground hover:bg-surfaceRaised",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
          variantStyles[variant],
          (disabled || isLoading) && "cursor-not-allowed opacity-60",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? "Loading" : children}
      </button>
    );
  }
);

Button.displayName = "Button";
