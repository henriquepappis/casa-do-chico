import { useState } from "react";
import { api } from "../lib/api";
import { saveAuth } from "../lib/auth";

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api.login(username.trim(), password);
      saveAuth(token, user);
      onLogin();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.jpeg"
            alt="Casa do Chico"
            className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4"
          />
          <h1
            className="mb-1"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", color: "var(--foreground)" }}
          >
            Casa do Chico
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Painel de Gestão</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-lg p-6 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="seu usuário"
              required
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#dc2626")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#dc2626")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "#f87171" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 mt-2"
            style={{ background: "#dc2626", color: "#fff" }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
