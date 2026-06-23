import { cn } from "../../lib/utils";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline";
}

export function Badge({ className, variant = "default", style, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full",
        variant === "outline" && "border",
        className
      )}
      style={variant === "outline" ? { borderColor: "var(--border)", ...style } : style}
      {...props}
    />
  );
}
