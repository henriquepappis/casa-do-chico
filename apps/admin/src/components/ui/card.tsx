import { cn } from "../../lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg", className)}
      style={{ background: "var(--card)", border: "1px solid var(--border)", ...style }}
      {...props}
    />
  );
}
