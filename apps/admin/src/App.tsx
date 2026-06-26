import { useState } from "react";
import { getToken, getUser } from "./lib/auth";
import LoginPage from "./pages/LoginPage";
import MesasPage from "./pages/MesasPage";
import MesaDetailPage from "./pages/MesaDetailPage";
import UsuariosPage from "./pages/UsuariosPage";
import CardapioPage from "./pages/CardapioPage";
import RelatorioPage from "./pages/RelatorioPage";
import VisaoGeralPage from "./pages/VisaoGeralPage";
import { Toaster } from "./components/ui/toaster";

export type NavItem = "visao" | "mesas" | "cardapio" | "historico" | "usuarios";

type View =
  | { screen: "login" }
  | { screen: "visao" }
  | { screen: "mesas" }
  | { screen: "cardapio" }
  | { screen: "historico" }
  | { screen: "usuarios" }
  | { screen: "mesa"; number: number };

// O dono cai na Visão Geral; garçom vai direto pras Mesas.
function telaInicial(): View {
  if (!getToken()) return { screen: "login" };
  return getUser()?.role === "DONO" ? { screen: "visao" } : { screen: "mesas" };
}

export default function App() {
  const [view, setView] = useState<View>(telaInicial);
  const [mesasKey, setMesasKey] = useState(0);

  if (view.screen === "login") {
    return (
      <>
        <Toaster />
        <LoginPage onLogin={() => setView(telaInicial())} />
      </>
    );
  }

  const handleLogout = () => setView({ screen: "login" });
  const navigate = (item: NavItem) => setView({ screen: item });

  return (
    <>
      <Toaster />
      {view.screen === "mesa" ? (
        <MesaDetailPage
          mesaNumber={view.number}
          onBack={() => setView({ screen: "mesas" })}
          onLogout={handleLogout}
          onMesaChanged={() => setMesasKey((k) => k + 1)}
          onNavigate={navigate}
        />
      ) : view.screen === "visao" ? (
        <VisaoGeralPage onLogout={handleLogout} onNavigate={navigate} />
      ) : view.screen === "cardapio" ? (
        <CardapioPage onLogout={handleLogout} onNavigate={navigate} />
      ) : view.screen === "historico" ? (
        <RelatorioPage onLogout={handleLogout} onNavigate={navigate} />
      ) : view.screen === "usuarios" ? (
        <UsuariosPage onLogout={handleLogout} onNavigate={navigate} />
      ) : (
        <MesasPage
          key={mesasKey}
          onLogout={handleLogout}
          onNavigate={navigate}
          onSelectMesa={(number) => setView({ screen: "mesa", number })}
        />
      )}
    </>
  );
}

