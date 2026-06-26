/**
 * MenuScreen — Tela 2: Cardápio Digital
 * Design: Rústico Nordestino Quente
 * Cabeçalho fixo, categorias deslizantes, lista de produtos
 */

import { useRef, useEffect } from "react";
import { ShoppingCart, MapPin, ChevronRight, ArrowLeft, Receipt } from "lucide-react";
// Alterado para buscar da mesma pasta (raiz de src)
import { useApp, type MenuItem } from "./AppContext";
import LazyImage from "./LazyImage";

const CATEGORIES: { id: MenuItem["category"]; label: string; emoji: string }[] =
  [
    { id: "bebidas", label: " Bebidas", emoji: "🍺" },
    { id: "petiscos", label: " Petiscos", emoji: "🍟" },
    { id: "refeicoes", label: " Refeições", emoji: "🍲" },
    { id: "sobremesas", label: " Sobremesas", emoji: "🍰" },
  ];

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MenuScreen() {
  const {
    tableNumber,
    customerName,
    cart,
    cartCount,
    cartBounce,
    menuItems,
    menuLoading,
    addToCart,
    updateQuantity,
    logout,
    setScreen,
    activeCategory,
    setCategory,
  } = useApp();
  const categoryBarRef = useRef<HTMLDivElement>(null);

  const filteredItems = menuItems.filter((i) => i.category === activeCategory);

  // Scroll active category pill into view
  useEffect(() => {
    const bar = categoryBarRef.current;
    if (!bar) return;
    const active = bar.querySelector("[data-active='true']") as HTMLElement;
    if (active) {
      active.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategory]);

  // Mouse wheel + drag-to-scroll on category bar
  useEffect(() => {
    const bar = categoryBarRef.current;
    if (!bar) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      bar.scrollBy({ left: e.deltaY, behavior: "smooth" });
    };

    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.pageX - bar.offsetLeft;
      scrollLeft = bar.scrollLeft;
      bar.style.cursor = "grabbing";
      bar.style.userSelect = "none";
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - bar.offsetLeft;
      bar.scrollLeft = scrollLeft - (x - startX);
    };
    const onMouseUp = () => {
      isDragging = false;
      bar.style.cursor = "grab";
      bar.style.userSelect = "";
    };

    bar.style.cursor = "grab";
    bar.addEventListener("wheel", onWheel, { passive: false });
    bar.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      bar.removeEventListener("wheel", onWheel);
      bar.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div
      className="app-shell flex flex-col min-h-dvh"
      style={{ background: "#FDF6EC" }}
    >
      {/* ── Fixed Header ── */}
      <header
        className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{
          background: "#3D0C0C",
          boxShadow: "0 2px 12px rgba(61,12,12,0.3)",
        }}
      >
        {/* Back to login */}
        <button
          onClick={logout}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.1)" }}
          title="Voltar ao início"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        {/* Mini logo */}
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-white flex-shrink-0">
          <img
            src="logo.jpeg"
            alt="Casa do Chico"
            className="w-full h-full object-contain p-0.5"
          />
        </div>

        {/* Mesa info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-red-400 flex-shrink-0" />
            <span
              className="text-white/90 text-sm font-bold truncate"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Mesa {String(tableNumber).padStart(2, "0")}
              {customerName && (
                <span className="text-white/60 font-normal">
                  {" "}
                  · {customerName}
                </span>
              )}
            </span>
          </div>
          <p
            className="text-white/40 text-xs"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            Casa do Chico — Bar &amp; Restaurante
          </p>
        </div>

        {/* Receipt button */}
        <button
          onClick={() => setScreen("receipt")}
          className="flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-150 active:scale-90"
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1.5px solid rgba(255,255,255,0.15)",
          }}
        >
          <Receipt size={20} className="text-white" />
        </button>

        {/* Cart button */}
        <button
          onClick={() => setScreen("cart")}
          className="relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-150 active:scale-90"
          style={{
            background: "rgba(192,57,43,0.2)",
            border: "1.5px solid rgba(192,57,43,0.4)",
          }}
        >
          <ShoppingCart size={20} className="text-white" />
          {cartCount > 0 && (
            <span
              className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                cartBounce ? "animate-bounce-badge" : ""
              }`}
              style={{
                background: "#C0392B",
                fontFamily: "'Lato', sans-serif",
              }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </header>

      {/* ── Hero banner ── */}
      <div
        className="relative h-32 overflow-hidden"
        style={{ background: "#3D0C0C" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url(/background.webp)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center px-5">
          <h2
            className="text-white text-2xl font-bold leading-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              textShadow: "0 1px 6px rgba(0,0,0,0.5)",
            }}
          >
            Cardápio
          </h2>
          <p className="text-white/70 text-sm mt-0.5">
            Escolha o que vai pedir hoje 🤤
          </p>
        </div>
      </div>

      {/* ── Category bar ── */}
      <div
        className="sticky z-20 px-4 py-3"
        style={{
          top: "64px",
          background: "#FDF6EC",
          borderBottom: "1px solid rgba(61,12,12,0.08)",
        }}
      >
        <div
          ref={categoryBarRef}
          className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-0.5"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              data-active={activeCategory === cat.id}
              onClick={() => setCategory(cat.id)}
              className={`category-pill flex-shrink-0 ${
                activeCategory === cat.id ? "active" : "inactive"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Product list ── */}
      <div className="flex-1 px-4 py-4 pb-24 space-y-3">
        {menuLoading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-sm" style={{ color: "#7B3F2A", opacity: 0.6 }}>Carregando cardápio...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-sm" style={{ color: "#7B3F2A", opacity: 0.6 }}>Nenhum item disponível.</p>
          </div>
        ) : null}
        {!menuLoading && filteredItems.map((item, idx) => {
          const inCart = cart.find((c) => c.item.id === item.id);

          return (
            <div
              key={item.id}
              className="product-card animate-fade-in-up"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex gap-0">
                {/* Product image */}
                <div className="relative w-28 h-28 flex-shrink-0">
                  <LazyImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  {item.badge && (
                    <span
                      className="absolute top-1.5 left-1.5 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background:
                          item.badge === "Destaque"
                            ? "#D4A017"
                            : item.badge === "Novo"
                            ? "#27AE60"
                            : "#C0392B",
                        fontFamily: "'Lato', sans-serif",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                  <div>
                    <h3
                      className="font-bold text-sm leading-tight line-clamp-2"
                      style={{
                        color: "#3D0C0C",
                        fontFamily: "'Playfair Display', serif",
                      }}
                    >
                      {item.name}
                    </h3>
                    <p
                      className="text-xs mt-0.5 line-clamp-2 leading-relaxed"
                      style={{ color: "#7B3F2A" }}
                    >
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span
                      className="text-base font-black"
                      style={{
                        color: "#C0392B",
                        fontFamily: "'Lato', sans-serif",
                      }}
                    >
                      {formatPrice(item.price)}
                    </span>

                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black transition-all active:scale-90"
                          style={{ background: "#C0392B", color: "white" }}
                        >
                          −
                        </button>
                        <span
                          className="w-5 text-center text-sm font-black"
                          style={{ color: "#3D0C0C", fontFamily: "'Lato', sans-serif" }}
                        >
                          {inCart.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black transition-all active:scale-90"
                          style={{ background: "#C0392B", color: "white" }}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all duration-150 active:scale-90"
                        style={{
                          background: "#C0392B",
                          boxShadow: "0 2px 8px rgba(192,57,43,0.35)",
                          fontFamily: "'Lato', sans-serif",
                        }}
                      >
                        + Adicionar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom CTA (cart) ── */}
      {cartCount > 0 && (
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-6 pt-3 z-40"
          style={{
            background: "linear-gradient(to top, #FDF6EC 70%, transparent)",
          }}
        >
          <button
            onClick={() => setScreen("cart")}
            className="btn-brand w-full py-4 rounded-xl flex items-center justify-between px-5"
          >
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-xs font-black">
                {cartCount}
              </span>
              <span className="text-sm font-bold">Carrinho</span>
            </span>
            <span className="flex items-center gap-1 text-sm font-bold">
              {formatPrice(
                cart.reduce((s, c) => s + c.item.price * c.quantity, 0)
              )}
              <ChevronRight size={16} />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
