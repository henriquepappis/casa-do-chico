import { type ReactNode } from "react";
import { X } from "lucide-react";

interface SheetProps { open: boolean; onOpenChange: (v: boolean) => void; children: ReactNode }
interface SheetContentProps { side?: "left" | "right"; className?: string; children: ReactNode }
interface SheetTriggerProps { asChild?: boolean; children: ReactNode }

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return <SheetContext.Provider value={{ open, onOpenChange }}>{children}</SheetContext.Provider>;
}

import { createContext, useContext } from "react";
const SheetContext = createContext<{ open: boolean; onOpenChange: (v: boolean) => void }>({ open: false, onOpenChange: () => {} });

export function SheetTrigger({ asChild, children }: SheetTriggerProps) {
  const { onOpenChange } = useContext(SheetContext);
  if (asChild && typeof children === "object" && children !== null) {
    return <span onClick={() => onOpenChange(true)} style={{ display: "contents" }}>{children}</span>;
  }
  return <button onClick={() => onOpenChange(true)}>{children}</button>;
}

export function SheetContent({ side = "left", className = "", children }: SheetContentProps) {
  const { open, onOpenChange } = useContext(SheetContext);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => onOpenChange(false)} />
      <div
        className={`fixed inset-y-0 z-50 flex flex-col transition-transform duration-200 ${side === "left" ? "left-0" : "right-0"} ${className}`}
        style={{ background: "var(--card)", borderRight: side === "left" ? "1px solid var(--border)" : undefined, borderLeft: side === "right" ? "1px solid var(--border)" : undefined, width: "18rem" }}
      >
        <button className="absolute top-4 right-4 p-1 opacity-60 hover:opacity-100 transition-opacity" onClick={() => onOpenChange(false)} style={{ color: "var(--muted-foreground)" }}>
          <X size={18} />
        </button>
        {children}
      </div>
    </>
  );
}

export function Separator({ className = "" }: { className?: string }) {
  return <div className={className} style={{ height: "1px", background: "var(--border)" }} />;
}
