import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-sm hover:shadow-md focus-visible:ring-[var(--color-accent)]/40",
  secondary:
    "bg-[var(--color-background)] text-[var(--color-foreground)] border border-[var(--color-card-border)] hover:border-[var(--color-accent)] hover:bg-white shadow-sm",
  ghost:
    "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)]",
  outline:
    "border border-[var(--color-card-border)] text-[var(--color-foreground)] hover:border-[var(--color-accent)] hover:bg-white shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1",
  md: "px-4 py-2.5 text-sm gap-1.5",
  lg: "px-6 py-3 text-sm gap-2",
};

const baseStyles =
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 hover:-translate-y-px active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

interface ButtonLinkProps extends Omit<ComponentPropsWithoutRef<typeof Link>, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

/**
 * Animated button with primary, secondary, ghost and outline variants.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Link styled as an animated button.
 */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
