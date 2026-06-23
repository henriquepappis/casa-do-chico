import { useState } from "react";
import { api } from "../lib/api";
import { X } from "lucide-react";

export default function NovaMesaModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(number);
    if (!n || n < 1) { setError("Informe um número válido"); return; }
    setError("");
    setLoading(true);
    try {
      await api.criarMesa(n);
      onCreated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-stone-800 rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">Nova Mesa</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-1.5">
              Número da mesa
            </label>
            <input
              type="number"
              min="1"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-700 text-white border border-stone-600 focus:outline-none focus:border-red-500 transition-colors"
              placeholder="Ex: 7"
              autoFocus
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-stone-600 text-stone-300 font-medium hover:bg-stone-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold transition-colors disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
