import { useEffect, useState } from "react";
import { toast, type ToastEntry } from "../lib/toast";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  useEffect(() => toast.subscribe(setToasts), []);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-[440px] px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-toast-in"
          style={{
            background:
              t.type === "error"
                ? "#C0392B"
                : t.type === "success"
                ? "#27AE60"
                : "#3D0C0C",
            color: "white",
            fontFamily: "'Lato', sans-serif",
          }}
        >
          {t.type === "error" ? (
            <AlertCircle size={16} className="shrink-0" />
          ) : t.type === "success" ? (
            <CheckCircle size={16} className="shrink-0" />
          ) : (
            <Info size={16} className="shrink-0" />
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
