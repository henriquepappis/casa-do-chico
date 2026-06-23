import type { Mesa } from "../lib/api";

export default function MesaCard({ mesa, onClick }: { mesa: Mesa; onClick: () => void }) {
  const ocupada = mesa.status === "OCUPADA";

  const formatMoney = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] relative group"
      style={{
        background: "var(--card)",
        border: `1px solid ${ocupada ? "rgba(220,38,38,0.4)" : "var(--border)"}`,
      }}
    >
      {/* Barra de acento no topo */}
      {ocupada && (
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: "linear-gradient(to right, #dc2626, #ef4444)" }}
        />
      )}

      <div className="p-6 pt-7">
        {/* Número da mesa */}
        <p
          className="font-bold leading-none mb-3 transition-colors"
          style={{
            fontSize: "4rem",
            color: ocupada ? "var(--foreground)" : "var(--muted-foreground)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {String(mesa.number).padStart(2, "0")}
        </p>

        {/* Badge de status */}
        <div className="mb-4">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={
              ocupada
                ? { background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.3)" }
                : { background: "rgba(22,163,74,0.15)", color: "#4ade80", border: "1px solid rgba(22,163,74,0.3)" }
            }
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ocupada ? "#ef4444" : "#22c55e" }} />
            {ocupada ? "Ocupada" : "Livre"}
          </span>
        </div>

        {/* Conteúdo */}
        {ocupada && mesa.sessao ? (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Total</p>
                <p className="text-xl font-bold" style={{ color: "var(--foreground)", fontFamily: "'Inter', sans-serif" }}>
                  {formatMoney(mesa.sessao.total)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Pedidos</p>
                <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                  {mesa.sessao.orders.length}
                </p>
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Aberta às {formatTime(mesa.sessao.openedAt)}
            </p>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
            <p className="text-sm text-center py-3" style={{ color: "var(--muted-foreground)" }}>
              Disponível
            </p>
          </div>
        )}
      </div>
    </button>
  );
}
