import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { RefreshCw, Pencil, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import type { MenuItem, MenuCategory } from "../lib/api";
import ItemCardapioModal from "../components/ItemCardapioModal";
import type { NavItem } from "../App";

const CATEGORIA_LABEL: Record<MenuCategory, string> = {
  bebidas: "Bebidas",
  petiscos: "Petiscos",
  refeicoes: "Refeições",
  sobremesas: "Sobremesas",
};
const ORDEM: MenuCategory[] = ["bebidas", "petiscos", "refeicoes", "sobremesas"];

export default function CardapioPage({
  onLogout,
  onNavigate,
}: {
  onLogout: () => void;
  onNavigate: (item: NavItem) => void;
}) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNovo, setShowNovo] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [toDelete, setToDelete] = useState<MenuItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      setItems(await api.getCardapio());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const ativos = items.filter((i) => i.active).length;
  const inativos = items.length - ativos;
  const formatMoney = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleDelete = async () => {
    if (!toDelete) return;
    setActionLoading(true);
    try {
      await api.deletarItem(toDelete.id);
      setToDelete(null);
      await load(true);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleActive = async (item: MenuItem) => {
    try {
      await api.atualizarItem(item.id, { active: !item.active });
      await load(true);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const StatCard = ({ label, value, acento, icon }: { label: string; value: string | number; acento: string; icon: string }) => (
    <Card className="p-6 bg-card border-border hover:border-border/80 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${acento}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </Card>
  );

  return (
    <DashboardLayout onLogout={onLogout} current="cardapio" onNavigate={onNavigate}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-display-lg mb-2">Cardápio</h1>
            <p className="text-muted-foreground">Gerencie os itens do menu do cliente</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span className="ml-1.5">Atualizar</span>
            </Button>
            <Button size="sm" onClick={() => setShowNovo(true)}>+ Novo Item</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard label="Total de Itens" value={items.length} acento="bg-red-600/20 text-red-400" icon="📋" />
          <StatCard label="Ativos" value={ativos} acento="bg-green-600/20 text-green-400" icon="🟢" />
          <StatCard label="Inativos" value={inativos} acento="bg-amber-600/20 text-amber-400" icon="🚫" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-medium mb-2 text-foreground">Nenhum item no cardápio</p>
            <p className="text-sm mb-6 text-muted-foreground">Adicione itens para montar o menu do cliente.</p>
            <Button onClick={() => setShowNovo(true)}>Adicionar primeiro item</Button>
          </div>
        ) : (
          ORDEM.filter((cat) => items.some((i) => i.category === cat)).map((cat) => (
            <div key={cat} className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-foreground">{CATEGORIA_LABEL[cat]}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items
                  .filter((i) => i.category === cat)
                  .map((item) => (
                    <Card key={item.id} className={`p-4 bg-card border-border ${!item.active ? "opacity-60" : ""}`}>
                      <div className="flex gap-4">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-muted" loading="lazy" />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-foreground truncate">{item.name}</h3>
                            <span className="font-bold text-foreground whitespace-nowrap">{formatMoney(item.price)}</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {item.badge && (
                              <Badge variant="outline" className="bg-red-600/20 text-red-300 border-red-600/30">{item.badge}</Badge>
                            )}
                            {!item.active && (
                              <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Inativo</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(item)}>
                          <Pencil size={13} />
                          <span className="ml-1.5">Editar</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleActive(item)}>
                          {item.active ? "Ocultar" : "Ativar"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-400 border-red-600/30 hover:bg-red-600/10"
                          onClick={() => setToDelete(item)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showNovo && (
        <ItemCardapioModal onClose={() => setShowNovo(false)} onSaved={() => { setShowNovo(false); load(true); }} />
      )}
      {editing && (
        <ItemCardapioModal item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(true); }} />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Remover {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              O item será removido do cardápio permanentemente. Para apenas escondê-lo, use "Ocultar".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end mt-6">
            <AlertDialogCancel onClick={() => setToDelete(null)} className="border-border hover:bg-muted">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={actionLoading} className="bg-red-600 hover:bg-red-700 text-white">
              {actionLoading ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
