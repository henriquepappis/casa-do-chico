import { cn } from "../../lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
}

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "default" && "bg-[#dc2626] text-white",
        variant === "outline" && "border text-[var(--muted-foreground)] bg-transparent",
        variant === "ghost" && "bg-transparent text-[var(--muted-foreground)] hover:bg-white/5",
        size === "default" && "px-4 py-2.5 text-sm",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "icon" && "w-9 h-9",
        className
      )}
      style={variant === "outline" ? { borderColor: "var(--border)" } : undefined}
      {...props}
    />
  );
}
