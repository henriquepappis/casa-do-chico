import { useState } from "react";
import { getToken } from "./lib/auth";
import LoginPage from "./pages/LoginPage";
import MesasPage from "./pages/MesasPage";
import MesaDetailPage from "./pages/MesaDetailPage";
import UsuariosPage from "./pages/UsuariosPage";
import CardapioPage from "./pages/CardapioPage";

export type NavItem = "mesas" | "cardapio" | "usuarios";

type View =
  | { screen: "login" }
  | { screen: "mesas" }
  | { screen: "cardapio" }
  | { screen: "usuarios" }
  | { screen: "mesa"; number: number };

export default function App() {
  const [view, setView] = useState<View>(() =>
    getToken() ? { screen: "mesas" } : { screen: "login" }
  );
  const [mesasKey, setMesasKey] = useState(0);

  if (view.screen === "login") {
    return <LoginPage onLogin={() => setView({ screen: "mesas" })} />;
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

  if (view.screen === "cardapio") {
    return <CardapioPage onLogout={handleLogout} onNavigate={navigate} />;
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
