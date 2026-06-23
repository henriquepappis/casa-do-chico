import { useState } from "react";
import { getUser, clearAuth } from "../lib/auth";
import { LogOut, Menu, X } from "lucide-react";

export default function Shell({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout: () => void;
}) {
  const user = getUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    onLogout();
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      {/* Sidebar desktop — no fluxo normal do flex */}
      <aside
        className="hidden lg:flex flex-col w-72 shrink-0 sticky top-0 h-screen overflow-y-auto"
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)" }}
      >
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
          <span className="font-bold" style={{ color: "var(--foreground)", fontFamily: "'Playfair Display', serif" }}>Menu</span>
          <button onClick={() => setMobileOpen(false)} style={{ color: "var(--muted-foreground)" }} className="hover:opacity-70 transition-opacity">
            <X size={20} />
          </button>
        </div>
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar mobile */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-30"
          style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Menu size={20} />
          </button>
          <span className="font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--foreground)" }}>
            Casa do Chico
          </span>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  user,
  onLogout,
}: {
  user: { username: string; role: string } | null;
  onLogout: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-6 py-6" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="Casa do Chico"
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div>
            <p className="text-sm font-bold leading-tight" style={{ fontFamily: "'Playfair Display', serif", color: "var(--foreground)" }}>
              Casa do Chico
            </p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Painel Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-3" style={{ color: "var(--muted-foreground)" }}>
          Operações
        </p>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: "rgba(220,38,38,0.15)", color: "#dc2626" }}
        >
          <span>🪑</span>
          Mesas
        </div>
      </nav>

      {/* Usuário + logout */}
      <div className="px-4 py-5" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold uppercase"
            style={{ background: "rgba(220,38,38,0.2)", color: "#dc2626" }}
          >
            {user?.username?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{user?.username}</p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {user?.role === "DONO" ? "Dono" : "Garçom"}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
          style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </>
  );
}
