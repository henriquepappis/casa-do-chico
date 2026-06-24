import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "../lib/api";
import type { MenuItem, MenuCategory } from "../lib/api";

const CATEGORIAS: { value: MenuCategory; label: string }[] = [
  { value: "bebidas", label: "Bebidas" },
  { value: "petiscos", label: "Petiscos" },
  { value: "refeicoes", label: "Refeições" },
  { value: "sobremesas", label: "Sobremesas" },
];

export default function ItemCardapioModal({
  item,
  onClose,
  onSaved,
}: {
  item?: MenuItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = !!item;
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [category, setCategory] = useState<MenuCategory>(item?.category ?? "bebidas");
  const [image, setImage] = useState(item?.image ?? "");
  const [badge, setBadge] = useState(item?.badge ?? "");
  const [active, setActive] = useState(item?.active ?? true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const precoNum = Number(price.replace(",", "."));
    if (!name.trim()) {
      setError("Informe o nome do item");
      return;
    }
    if (!price || isNaN(precoNum) || precoNum < 0) {
      setError("Informe um preço válido");
      return;
    }
    setError("");
    setLoading(true);
    const data = {
      name: name.trim(),
      description: description.trim(),
      price: precoNum,
      category,
      image: image.trim(),
      badge: badge.trim() || null,
      position: item?.position ?? 0,
      active,
    };
    try {
      if (editing) await api.atualizarItem(item!.id, data);
      else await api.criarItem(data);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg bg-input/40 text-foreground border border-border focus:outline-none focus:border-red-500 transition-colors";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground font-bold text-lg">{editing ? "Editar item" : "Novo item"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Ex: Cerveja Gelada" autoFocus />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Breve descrição do item" />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Preço (R$)</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} placeholder="9.90" inputMode="decimal" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as MenuCategory)} className={inputClass}>
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">URL da imagem</label>
            <input value={image} onChange={(e) => setImage(e.target.value)} className={inputClass} placeholder="https://..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Selo (opcional)</label>
            <input value={badge} onChange={(e) => setBadge(e.target.value)} className={inputClass} placeholder="Ex: Mais Pedido" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 accent-red-600" />
            <span className="text-sm text-foreground">Item ativo (visível no cardápio)</span>
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
