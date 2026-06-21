// src/App.tsx
import { AppProvider, useApp } from "./AppContext";
import LoginScreen from "./LoginScreen";
import MenuScreen from "./MenuScreen";
import CartScreen from "./CartScreen";
import ReceiptScreen from "./ReceiptScreen";

// Componente interno isolado para escutar o contexto e chavear as telas
function ScreenRouter() {
  const { screen } = useApp();

  switch (screen) {
    case "login":
      return <LoginScreen />;
    case "menu":
      return <MenuScreen />;
    case "cart":
      return <CartScreen />;
    case "receipt":
      return <ReceiptScreen />;
    default:
      return <LoginScreen />;
  }
}

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        {/* Renderiza as telas dinamicamente de acordo com o estado global */}
        <ScreenRouter />
      </div>
    </AppProvider>
  );
}

export default App;
