/**
 * LoginScreen — Tela 1: Identificação do cliente na mesa
 * Design: Rústico Nordestino Quente
 * Fundo: imagem do restaurante com overlay escuro
 * Paleta: Vermelho #C0392B, Marrom #3D0C0C, Creme #FDF6EC
 */

import { useState } from "react";
import { useApp } from "./AppContext";
import { MapPin, ChefHat } from "lucide-react";

export default function LoginScreen() {
  const { tableNumber, login } = useApp();
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    login(name.trim());
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="app-shell flex flex-col min-h-dvh relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663781250167/V42Vrqav2DfacujANNnqEi/hero-login-bg-XNrFw7zEphAw8fg3PNHFdn.webp)`,
        }}
      />
      {/* Gradient overlay — dark at top and bottom, slightly transparent in middle */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-dvh">
        {/* Top section: Logo */}
        <div className="flex flex-col items-center pt-12 pb-6 px-6 animate-slide-up">
          <div className="w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 mb-4 bg-white">
            <img
              src="/logo.jpeg"
              alt="Casa do Chico — Bar & Restaurante"
              className="w-full h-full object-contain p-2"
            />
          </div>
          <h1
            className="text-white text-3xl font-bold text-center leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
          >
            Casa do Chico
          </h1>
          <p className="text-white/70 text-sm font-light tracking-widest uppercase mt-1">
            Bar &amp; Restaurante
          </p>
        </div>

        {/* Mesa badge */}
        <div className="flex justify-center animate-slide-up" style={{ animationDelay: "60ms" }}>
          <div
            className="flex items-center gap-2 px-5 py-2.5 rounded-full shadow-lg"
            style={{ backgroundColor: "#C0392B", boxShadow: "0 4px 16px rgba(192,57,43,0.5)" }}
          >
            <MapPin size={16} className="text-white" />
            <span className="text-white font-bold text-sm tracking-wide">
              📍 Mesa {String(tableNumber).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Card de login */}
        <div
          className="mx-4 mb-8 rounded-2xl overflow-hidden animate-slide-up"
          style={{
            animationDelay: "120ms",
            background: "rgba(253, 246, 236, 0.97)",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          {/* Card header */}
          <div
            className="px-6 pt-6 pb-4 text-center"
            style={{ borderBottom: "1px solid rgba(61,12,12,0.08)" }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <ChefHat size={20} style={{ color: "#C0392B" }} />
              <span
                className="font-bold text-lg"
                style={{ fontFamily: "'Playfair Display', serif", color: "#3D0C0C" }}
              >
                Bem-vindo(a)!
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#7B3F2A" }}>
              Como gostaria de ser chamado(a) na{" "}
              <strong style={{ color: "#C0392B" }}>Mesa {String(tableNumber).padStart(2, "0")}</strong>?
            </p>
          </div>

          {/* Input area */}
          <div className="px-6 pt-5 pb-6">
            <div
              className={`relative transition-all duration-200 ${shake ? "animate-[shake_0.4s_ease]" : ""}`}
              style={{
                animation: shake ? "shake 0.4s ease" : undefined,
              }}
            >
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={handleKey}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Ex: Mesa do Rodrigo, Aniversário da Amanda..."
                maxLength={40}
                className="w-full px-4 py-4 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: "#FDF6EC",
                  border: `2px solid ${focused ? "#C0392B" : "rgba(61,12,12,0.15)"}`,
                  color: "#3D0C0C",
                  fontFamily: "'Lato', sans-serif",
                  boxShadow: focused ? "0 0 0 3px rgba(192,57,43,0.12)" : "none",
                }}
              />
              {name && (
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: "#7B3F2A", opacity: 0.5 }}
                >
                  {name.length}/40
                </span>
              )}
            </div>

            <p className="text-xs text-center" style={{ color: "#7B3F2A", opacity: 0.7, marginTop: "0.5rem", marginBottom: "0.5rem" }}>
              Seu nome aparecerá nos pedidos enviados à cozinha.
            </p>

            <button
              onClick={handleSubmit}
              className="btn-brand w-full py-4 rounded-xl text-base font-bold tracking-wide"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Ver Cardápio
            </button>
          </div>

          {/* Footer ornament */}
          <div className="px-6 pb-5">
            <div className="ornament-divider text-xs" style={{ color: "#7B3F2A" }}>
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.1em", color: "#7B3F2A", opacity: 0.5 }}>
                ✦ CASA DO CHICO ✦
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shake keyframe */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
