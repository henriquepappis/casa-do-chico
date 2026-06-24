import { useState } from "react";
import { getToken, getUser } from "./lib/auth";
import LoginPage from "./pages/LoginPage";
import MesasPage from "./pages/MesasPage";
import MesaDetailPage from "./pages/MesaDetailPage";
import UsuariosPage from "./pages/UsuariosPage";
import CardapioPage from "./pages/CardapioPage";
import RelatorioPage from "./pages/RelatorioPage";
import VisaoGeralPage from "./pages/VisaoGeralPage";

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
    return <LoginPage onLogin={() => setView(telaInicial())} />;
  }

  const handleLogout = () => setView({ screen: "login" });
  const navigate = (item: NavItem) => setView({ screen: item });

  if (view.screen === "mesa") {
    return (
      <MesaDetailPage
        mesaNumber={view.number}
        onBack={() => setView({ screen: "mesas" })}
        onLogout={handleLogout}
        onMesaChanged={() => setMesasKey((k) => k + 1)}
        onNavigate={navigate}
      />
    );
  }

  if (view.screen === "visao") {
    return <VisaoGeralPage onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (view.screen === "cardapio") {
    return <CardapioPage onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (view.screen === "historico") {
    return <RelatorioPage onLogout={handleLogout} onNavigate={navigate} />;
  }

  if (view.screen === "usuarios") {
    return <UsuariosPage onLogout={handleLogout} onNavigate={navigate} />;
  }

  return (
    <MesasPage
      key={mesasKey}
      onLogout={handleLogout}
      onNavigate={navigate}
      onSelectMesa={(number) => setView({ screen: "mesa", number })}
    />
  );
}
