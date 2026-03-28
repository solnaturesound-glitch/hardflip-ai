import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "accent" | "danger" | "warning";
}

export function Badge({
  variant = "default",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-surface-2 text-text-secondary border border-border",
    primary: "bg-primary/15 text-primary border border-primary/30",
    accent: "bg-accent/15 text-accent border border-accent/30",
    danger: "bg-danger/15 text-danger border border-danger/30",
    warning: "bg-warning/15 text-warning border border-warning/30",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
