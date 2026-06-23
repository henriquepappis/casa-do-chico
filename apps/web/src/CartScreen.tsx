/**
 * CartScreen — Tela 3: Carrinho e Revisão do Pedido
 * Design: Rústico Nordestino Quente
 * Lista de itens com controle de quantidade, observações e botão de envio
 */

import { useState } from "react";
import { ArrowLeft, ShoppingCart, Trash2, MessageSquare, ChefHat } from "lucide-react";
import { useApp } from "./AppContext";
import LazyImage from "./LazyImage";

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CartScreen() {
  const {
    cart,
    cartTotal,
    cartCount,
    tableNumber,
    customerName,
    updateQuantity,
    removeFromCart,
    updateObservation,
    sendOrder,
    sendingOrder,
    setScreen,
  } = useApp();

  const [expandedObs, setExpandedObs] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleSend = async () => {
    if (cart.length === 0 || sendingOrder) return;
    setConfirming(true);
    await sendOrder();
    setConfirming(false);
  };

  if (cart.length === 0 && !confirming) {
    return (
      <div className="app-shell flex flex-col min-h-dvh" style={{ background: "#FDF6EC" }}>
        {/* Header */}
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
          <h1
            className="text-white font-bold text-lg"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Meu Carrinho
          </h1>
        </header>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center animate-slide-up">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: "rgba(192,57,43,0.1)" }}
          >
            <ShoppingCart size={36} style={{ color: "#C0392B" }} />
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: "#3D0C0C" }}
          >
            Carrinho vazio
          </h2>
          <p className="text-xs text-center" style={{ color: "#7B3F2A", opacity: 0.7, marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            Adicione itens do cardápio para fazer seu pedido
          </p>
          <button
            onClick={() => setScreen("menu")}
            className="btn-brand px-8 py-3.5 rounded-xl font-bold"
          >
            Ver Cardápio
          </button>
        </div>
      </div>
    );
  }

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
            Meu Carrinho
          </h1>
          <p className="text-white/50 text-xs">
            {cartCount} {cartCount === 1 ? "item" : "itens"} · Mesa {String(tableNumber).padStart(2, "0")}
            {customerName ? ` · ${customerName}` : ""}
          </p>
        </div>
        {cart.length > 0 && (
          <span
            className="text-white/80 text-xs px-2 py-1 rounded-full"
            style={{ background: "rgba(192,57,43,0.3)" }}
          >
            {cartCount} {cartCount === 1 ? "item" : "itens"}
          </span>
        )}
      </header>

      {/* ── Cart items ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-36 space-y-3">
        {cart.map((cartItem, idx) => (
          <div
            key={cartItem.item.id}
            className="product-card animate-fade-in-up"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Item row */}
            <div className="flex gap-3 p-3">
              {/* Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <LazyImage src={cartItem.item.image} alt={cartItem.item.name} className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3
                  className="font-bold text-sm leading-tight line-clamp-1"
                  style={{ color: "#3D0C0C", fontFamily: "'Playfair Display', serif" }}
                >
                  {cartItem.item.name}
                </h3>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#7B3F2A" }}>
                  {cartItem.item.description}
                </p>
                <p
                  className="text-sm font-black mt-1"
                  style={{ color: "#C0392B", fontFamily: "'Lato', sans-serif" }}
                >
                  {formatPrice(cartItem.item.price * cartItem.quantity)}
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromCart(cartItem.item.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
                style={{ background: "rgba(192,57,43,0.08)" }}
              >
                <Trash2 size={14} style={{ color: "#C0392B" }} />
              </button>
            </div>

            {/* Quantity control */}
            <div
              className="flex items-center justify-between px-3 py-2.5"
              style={{ borderTop: "1px solid rgba(61,12,12,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(cartItem.item.id, -1)}
                  className="qty-btn transition-all active:scale-90"
                  style={{
                    background: cartItem.quantity === 1 ? "rgba(192,57,43,0.1)" : "#C0392B",
                    color: cartItem.quantity === 1 ? "#C0392B" : "white",
                  }}
                >
                  −
                </button>
                <span
                  className="text-base font-black w-6 text-center"
                  style={{ color: "#3D0C0C", fontFamily: "'Lato', sans-serif" }}
                >
                  {cartItem.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(cartItem.item.id, 1)}
                  className="qty-btn transition-all active:scale-90"
                  style={{ background: "#C0392B", color: "white" }}
                >
                  +
                </button>
              </div>

              {/* Observation toggle */}
              <button
                onClick={() => setExpandedObs(expandedObs === cartItem.item.id ? null : cartItem.item.id)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
                style={{
                  color: cartItem.observation ? "#C0392B" : "#7B3F2A",
                  background: cartItem.observation ? "rgba(192,57,43,0.1)" : "rgba(61,12,12,0.06)",
                  fontFamily: "'Lato', sans-serif",
                  fontWeight: 600,
                }}
              >
                <MessageSquare size={12} />
                {cartItem.observation ? "Obs. ✓" : "Observação"}
              </button>
            </div>

            {/* Observation textarea */}
            {expandedObs === cartItem.item.id && (
              <div className="px-3 pb-3 animate-slide-up">
                <textarea
                  value={cartItem.observation}
                  onChange={e => updateObservation(cartItem.item.id, e.target.value)}
                  placeholder="Ex: Sem cebola, ponto da carne bem passado..."
                  rows={2}
                  maxLength={120}
                  className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none transition-all"
                  style={{
                    background: "#FDF6EC",
                    border: "1.5px solid rgba(192,57,43,0.3)",
                    color: "#3D0C0C",
                    fontFamily: "'Lato', sans-serif",
                  }}
                />
                <p className="text-right text-xs mt-1" style={{ color: "#7B3F2A", opacity: 0.5 }}>
                  {cartItem.observation.length}/120
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Order summary */}
        <div
          className="rounded-2xl p-4 mt-2 animate-fade-in-up"
          style={{
            background: "white",
            border: "1.5px solid rgba(61,12,12,0.08)",
            animationDelay: `${cart.length * 50}ms`,
          }}
        >
          <h3
            className="font-bold text-sm mb-3"
            style={{ color: "#3D0C0C", fontFamily: "'Playfair Display', serif" }}
          >
            Resumo do Pedido
          </h3>
          {cart.map(c => (
            <div key={c.item.id} className="flex justify-between text-sm mb-1.5">
              <span style={{ color: "#7B3F2A" }}>
                {c.quantity}× {c.item.name}
              </span>
              <span className="font-bold" style={{ color: "#3D0C0C" }}>
                {formatPrice(c.item.price * c.quantity)}
              </span>
            </div>
          ))}
          <div
            className="flex justify-between items-center mt-3 pt-3"
            style={{ borderTop: "1px dashed rgba(61,12,12,0.15)" }}
          >
            <span className="font-bold text-base" style={{ color: "#3D0C0C", fontFamily: "'Playfair Display', serif" }}>
              Total
            </span>
            <span className="font-black text-xl" style={{ color: "#C0392B", fontFamily: "'Lato', sans-serif" }}>
              {formatPrice(cartTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Fixed footer ── */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-6 pt-3 z-40"
        style={{ background: "linear-gradient(to top, #FDF6EC 70%, transparent)" }}
      >
        <button
          onClick={handleSend}
          disabled={confirming || sendingOrder || cart.length === 0}
          className="btn-brand w-full py-4 rounded-xl flex items-center justify-center gap-2.5 text-base font-bold disabled:opacity-70"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          {confirming ? (
            <>
              <ChefHat size={20} className="animate-bounce" />
              Processando...
            </>
          ) : (
            <>
              <ChefHat size={20} />
              Enviar Pedido
            </>
          )}
        </button>
      </div>
    </div>
  );
}
