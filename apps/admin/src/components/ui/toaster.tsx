import { useEffect, useState } from "react";
import { toast, type ToastEntry } from "@/lib/toast";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

export function Toaster() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  useEffect(() => toast.subscribe(setToasts), []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium
            animate-in slide-in-from-right-4 duration-300
            ${
              t.type === "error"
                ? "bg-red-950 border-red-800 text-red-100"
                : t.type === "success"
                ? "bg-emerald-950 border-emerald-800 text-emerald-100"
                : "bg-zinc-800 border-zinc-700 text-zinc-100"
            }`}
        >
          {t.type === "error" ? (
            <AlertCircle size={16} className="mt-0.5 text-red-400 shrink-0" />
          ) : t.type === "success" ? (
            <CheckCircle size={16} className="mt-0.5 text-emerald-400 shrink-0" />
          ) : (
            <Info size={16} className="mt-0.5 text-zinc-400 shrink-0" />
          )}
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
