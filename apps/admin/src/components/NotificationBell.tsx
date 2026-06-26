import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, X, ExternalLink } from "lucide-react";
import { notifs, type Notification } from "@/lib/notifications";
import { adminNavigate } from "@/lib/adminNavigate";

interface PopupEntry extends Notification {
  popupId: number;
}

let popupSeq = 0;

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function notifIcon(type: Notification["type"]) {
  switch (type) {
    case "new_order": return "🛎️";
    case "mesa_opened": return "🪑";
    case "mesa_closed": return "✓";
    case "mesa_transferred": return "↔️";
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [popups, setPopups] = useState<PopupEntry[]>([]);
  const lastIdRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return notifs.subscribe(({ notifications: ns, soundEnabled: se }) => {
      setNotifications(ns);
      setSoundEnabled(se);

      // Detecta notificação nova para spawnar popup
      if (ns.length > 0 && ns[0].id !== lastIdRef.current) {
        const newest = ns[0];
        lastIdRef.current = newest.id;
        const popupId = ++popupSeq;
        setPopups((prev) => [...prev, { ...newest, popupId }].slice(-3));
        const t = setTimeout(() => {
          setPopups((prev) => prev.filter((p) => p.popupId !== popupId));
        }, 6000);
        return () => clearTimeout(t);
      }
    });
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = notifications.filter((n) => !n.read).length;

  const handleOpenBell = () => {
    setOpen((v) => !v);
  };

  const handleClickNotif = (n: Notification) => {
    notifs.markRead(n.id);
    setOpen(false);
    if (n.tableNumber !== undefined) adminNavigate.toMesa(n.tableNumber);
  };

  const dismissPopup = (popupId: number) => {
    setPopups((prev) => prev.filter((p) => p.popupId !== popupId));
  };

  const handleClickPopup = (popup: PopupEntry) => {
    notifs.markRead(popup.id);
    dismissPopup(popup.popupId);
    if (popup.tableNumber !== undefined) adminNavigate.toMesa(popup.tableNumber);
  };

  return (
    <>
      {/* ── Botão do sininho ── */}
      <div className="relative" ref={panelRef}>
        <button
          onClick={handleOpenBell}
          className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          title="Notificações"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>

        {/* ── Painel de histórico ── */}
        {open && (
          <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            {/* Header do painel */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm text-foreground">Notificações</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => notifs.toggleSound()}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                  title={soundEnabled ? "Silenciar som" : "Ativar som"}
                >
                  {soundEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                </button>
                {unread > 0 && (
                  <button
                    onClick={() => notifs.markAllRead()}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Lista */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma notificação ainda
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClickNotif(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0 ${
                      !n.read ? "bg-muted/30" : ""
                    }`}
                  >
                    <span className="text-base mt-0.5 shrink-0">{notifIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.timestamp)}</p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Popups flutuantes (novo pedido) ── */}
      <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {popups.map((popup) => (
          <div
            key={popup.popupId}
            className="pointer-events-auto w-72 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-right-4 duration-300"
          >
            <div className="flex items-start gap-3 p-4">
              <span className="text-xl shrink-0">{notifIcon(popup.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug">{popup.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">agora</p>
              </div>
              <button
                onClick={() => dismissPopup(popup.popupId)}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
            {popup.tableNumber !== undefined && (
              <button
                onClick={() => handleClickPopup(popup)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-400 hover:text-red-300 border-t border-border hover:bg-muted/40 transition-colors"
              >
                <ExternalLink size={12} />
                Ver mesa {String(popup.tableNumber).padStart(2, "0")}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
