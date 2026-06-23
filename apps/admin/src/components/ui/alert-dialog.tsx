import type { HTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function AlertDialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => onOpenChange(false)}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function AlertDialogContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl p-6 w-full max-w-md", className)}
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      {...props}
    />
  );
}

export function AlertDialogHeader(props: HTMLAttributes<HTMLDivElement>) {
  return <div className="mb-4" {...props} />;
}

export function AlertDialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-bold mb-1", className)} style={{ color: "var(--foreground)" }} {...props} />;
}

export function AlertDialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm", className)} style={{ color: "var(--muted-foreground)" }} {...props} />;
}

export function AlertDialogAction({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90", className)}
      style={{ background: "#dc2626", color: "#fff" }}
      {...props}
    />
  );
}

export function AlertDialogCancel({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80", className)}
      style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "transparent" }}
      {...props}
    />
  );
}
