import { useEffect, useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "../lib/api";
import type { Mesa } from "../lib/api";

export default function TransferirMesaModal({
  origem,
  onClose,
  onTransferida,
}: {
  origem: number;
  onClose: () => void;
  onTransferida: (destino: number) => void;
}) {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [destino, setDestino] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMesas()
      .then((m) => setMesas(m.filter((x) => x.number !== origem && x.status !== "OCUPADA")))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [origem]);

  const handleConfirm = async () => {
    if (!destino) return;
    setError("");
    setSaving(true);
    try {
      await api.transferirMesa(origem, destino);
      onTransferida(destino);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-foreground font-bold text-lg">Transferir Mesa {String(origem).padStart(2, "0")}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Os pedidos e a comanda vão para a mesa escolhida. A Mesa {String(origem).padStart(2, "0")} fica livre.
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-24">
            <RefreshCw size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : mesas.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhuma mesa disponível para receber. (Todas estão ocupadas.)
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {mesas.map((m) => {
              const selecionada = destino === m.number;
              const inativa = m.status === "INATIVA";
              return (
                <button
                  key={m.id}
                  onClick={() => setDestino(m.number)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selecionada ? "border-red-600 bg-red-600/15" : "border-border hover:border-border/80 bg-input/30"
                  }`}
                >
                  <p className="text-xl font-bold text-foreground">{String(m.number).padStart(2, "0")}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{inativa ? "Inativa" : "Livre"}</p>
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" className="flex-1" disabled={!destino || saving} onClick={handleConfirm}>
            {saving ? "Transferindo..." : "Transferir"}
          </Button>
        </div>
      </div>
    </div>
  );
}
