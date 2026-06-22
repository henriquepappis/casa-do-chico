/**
 * ReceiptScreen — Tela 4: Extrato da Mesa
 * Design: Rústico Nordestino Quente
 * Lista de pedidos enviados, total e ações (chamar garçom / fechar mesa)
 */

import { ArrowLeft, Receipt, Clock, CheckCircle, Package, MapPin, Plus } from "lucide-react";
import LazyImage from "./LazyImage";
import { useApp } from "./AppContext";

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_CONFIG = {
  preparando: { label: "Preparando", icon: Clock, color: "#D4A017", bg: "rgba(212,160,23,0.1)" },
  pronto:     { label: "Pronto",     icon: CheckCircle, color: "#27AE60", bg: "rgba(39,174,96,0.1)" },
  entregue:   { label: "Entregue",   icon: Package, color: "#7B3F2A", bg: "rgba(123,63,42,0.1)" },
};

export default function ReceiptScreen() {
  const { tableNumber, customerName, orders, orderTotal, setScreen } = useApp();
  return (
    <div className="app-shell flex flex-col min-h-dvh" style={{ background: "#FDF6EC" }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 px-4 py-4 flex items-center gap-3"
        style={{ background: "#3D0C0C", boxShadow: "0 2px 12px rgba(61,12,12,0.3)" }}
      >
        <button
          onClick={() => setScreen("menu")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <h1
            className="text-white font-bold text-lg leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Minha Conta
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin size={11} className="text-red-400" />
            <p className="text-white/50 text-xs">
              Mesa {String(tableNumber).padStart(2, "0")}
              {customerName ? ` · ${customerName}` : ""}
            </p>
          </div>
        </div>
        <div
          className="px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: "rgba(39,174,96,0.2)", color: "#4ADE80" }}
        >
          {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto pb-44">

        {/* Total destaque */}
        <div
          className="mx-4 mt-4 rounded-2xl p-4 animate-slide-up"
          style={{
            background: "linear-gradient(135deg, #3D0C0C 0%, #5C1A1A 100%)",
            boxShadow: "0 4px 20px rgba(61,12,12,0.25)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
                Total consumido
              </p>
              <p
                className="text-white text-3xl font-black"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {formatPrice(orderTotal)}
              </p>
              <p className="text-white/40 text-xs mt-1">
                {orders.reduce((s, o) => s + o.quantity, 0)} itens pedidos
              </p>
            </div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(192,57,43,0.3)" }}
            >
              <Receipt size={28} className="text-white" />
            </div>
          </div>
        </div>

        {/* Pedidos list */}
        <div className="px-4 mt-4 space-y-3">
          <h2
            className="text-sm font-bold uppercase tracking-wider mb-3"
            style={{ color: "#7B3F2A", fontFamily: "'Lato', sans-serif" }}
          >
            Histórico de Pedidos
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-10 animate-slide-up">
              <p className="text-3xl mb-3">🍽️</p>
              <p className="font-bold" style={{ color: "#3D0C0C", fontFamily: "'Playfair Display', serif" }}>
                Nenhum pedido ainda
              </p>
              <p className="text-sm mt-1" style={{ color: "#7B3F2A" }}>
                Adicione itens ao carrinho para fazer seu primeiro pedido
              </p>
              <button
                onClick={() => setScreen("menu")}
                className="btn-brand mt-4 px-6 py-3 rounded-xl font-bold text-sm"
              >
                Ver Cardápio
              </button>
            </div>
          ) : (
            orders.map((order, idx) => {
              const statusCfg = STATUS_CONFIG[order.status];
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={order.id}
                  className="product-card animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex gap-3 p-3">
                    {/* Image */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <LazyImage src={order.item.image} alt={order.item.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="font-bold text-sm leading-tight line-clamp-1 flex-1"
                          style={{ color: "#3D0C0C", fontFamily: "'Playfair Display', serif" }}
                        >
                          {order.quantity}× {order.item.name}
                        </h3>
                        <span
                          className="text-sm font-black flex-shrink-0"
                          style={{ color: "#C0392B", fontFamily: "'Lato', sans-serif" }}
                        >
                          {formatPrice(order.item.price * order.quantity)}
                        </span>
                      </div>

                      {order.observation && (
                        <p
                          className="text-xs mt-0.5 italic line-clamp-1"
                          style={{ color: "#7B3F2A" }}
                        >
                          📝 {order.observation}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs" style={{ color: "#7B3F2A", opacity: 0.6 }}>
                          {formatTime(order.sentAt)}
                        </span>
                        <span
                          className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            color: statusCfg.color,
                            background: statusCfg.bg,
                            fontFamily: "'Lato', sans-serif",
                          }}
                        >
                          <StatusIcon size={10} />
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pedir mais */}
        {orders.length > 0 && (
          <div className="px-4 mt-4 animate-fade-in-up" style={{ animationDelay: `${orders.length * 50}ms` }}>
            <button
              onClick={() => setScreen("menu")}
              className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-98"
              style={{
                background: "white",
                border: "2px dashed rgba(192,57,43,0.3)",
                color: "#C0392B",
                fontFamily: "'Lato', sans-serif",
              }}
            >
              <Plus size={16} />
              Pedir mais itens
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
