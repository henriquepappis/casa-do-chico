import { useApp } from "./AppContext";

export default function BlockedScreen() {
  const { blockedTable } = useApp();

  const irParaMinhaMesa = () => {
    if (!blockedTable) return;
    window.location.href = `${window.location.pathname}?mesa=${blockedTable}`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl mb-6">
        🪑
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sua comanda está na Mesa {blockedTable}</h1>
      <p className="text-gray-600 mb-1">
        Seus pedidos ficam todos na mesma mesa.
      </p>
      <p className="text-gray-500 text-sm mb-10 mt-8 max-w-xs">
        Volte para a <span className="font-semibold">Mesa {blockedTable}</span> e continue pedindo normalmente por lá.
      </p>
      <button
        onClick={irParaMinhaMesa}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
      >
        Voltar para a Mesa {blockedTable}
      </button>
    </div>
  );
}
