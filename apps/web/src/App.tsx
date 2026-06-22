// src/App.tsx
import { AppProvider, useApp } from "./AppContext";
import LoginScreen from "./LoginScreen";
import MenuScreen from "./MenuScreen";
import CartScreen from "./CartScreen";
import ReceiptScreen from "./ReceiptScreen";
import OfflineBanner from "./OfflineBanner";

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
      <OfflineBanner />
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <ScreenRouter />
      </div>
    </AppProvider>
  );
}

export default App;
