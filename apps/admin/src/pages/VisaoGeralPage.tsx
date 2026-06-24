import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowUp, ArrowDown } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "../lib/api";
import type { Dashboard } from "../lib/api";
import { getUser } from "../lib/auth";
import { useWebSocket } from "../lib/useWebSocket";
import type { NavItem } from "../App";

const formatMoney = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function VisaoGeralPage({
  onLogout,
  onNavigate,
}: {
  onLogout: () => void;
  onNavigate: (item: NavItem) => void;
}) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = getUser();

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      setData(await api.getDashboard());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  useWebSocket(() => load(true));

  const hoje = data?.hoje;
  const mesas = data?.mesas;
  const variacao = data?.ontem.variacao ?? null;
  const maxTend = Math.max(...(data?.tendencia.map((t) => t.total) ?? [0]), 1);

  return (
    <DashboardLayout onLogout={onLogout} current="visao" onNavigate={onNavigate}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-display-lg mb-2">{saudacao()}{user?.username ? `, ${user.username}` : ""}</h1>
            <p className="text-muted-foreground">Resumo de hoje, em tempo real</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing} className="mt-2">
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            <span className="ml-1.5">Atualizar</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* KPIs do dia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 bg-card border-border">
                <p className="text-sm text-muted-foreground mb-2">Faturamento de hoje</p>
                <p className="text-4xl font-bold text-foreground">{formatMoney(hoje?.faturamento ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatMoney(hoje?.faturamentoFechado ?? 0)} fechado + {formatMoney(hoje?.emAberto ?? 0)} em aberto
                </p>
              </Card>

              <Card className="p-6 bg-card border-border">
                <p className="text-sm text-muted-foreground mb-2">Ticket médio</p>
                <p className="text-4xl font-bold text-foreground">{formatMoney(hoje?.ticketMedio ?? 0)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {hoje?.mesasFechadas ?? 0} {hoje?.mesasFechadas === 1 ? "mesa fechada" : "mesas fechadas"}
                </p>
              </Card>

              <Card className="p-6 bg-card border-border">
                <p className="text-sm text-muted-foreground mb-2">Pedidos na última hora</p>
                <p className="text-4xl font-bold text-foreground">{hoje?.pedidosUltimaHora ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-2">ritmo recente</p>
              </Card>

              <Card className="p-6 bg-card border-border">
                <p className="text-sm text-muted-foreground mb-2">Vs. ontem</p>
                {variacao === null ? (
                  <p className="text-4xl font-bold text-muted-foreground">—</p>
                ) : (
                  <p className={`text-4xl font-bold flex items-center gap-1 ${variacao >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {variacao >= 0 ? <ArrowUp size={28} /> : <ArrowDown size={28} />}
                    {Math.abs(variacao).toFixed(0)}%
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  ontem: {formatMoney(data?.ontem.faturamento ?? 0)}
                </p>
              </Card>
            </div>

            {/* Mesas */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              <Card className="p-5 bg-card border-border text-center">
                <p className="text-3xl font-bold text-red-400">{mesas?.ocupadas ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Ocupadas</p>
              </Card>
              <Card className="p-5 bg-card border-border text-center">
                <p className="text-3xl font-bold text-green-400">{mesas?.livres ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Livres</p>
              </Card>
              <Card className="p-5 bg-card border-border text-center">
                <p className="text-3xl font-bold text-muted-foreground">{mesas?.inativas ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Inativas</p>
              </Card>
            </div>

            {/* Tendência 7 dias */}
            <h2 className="text-2xl font-bold mb-6 text-foreground">Últimos 7 dias</h2>
            <Card className="p-6 bg-card border-border">
              <div className="flex items-end justify-between gap-2 sm:gap-4 h-48">
                {data?.tendencia.map((t, idx) => {
                  const isHoje = idx === data.tendencia.length - 1;
                  const altura = Math.max((t.total / maxTend) * 100, 2);
                  const label = new Date(`${t.dia}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
                  return (
                    <div key={t.dia} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {t.total > 0 ? formatMoney(t.total).replace("R$", "").trim() : ""}
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all ${isHoje ? "bg-red-600" : "bg-red-600/40"}`}
                        style={{ height: `${altura}%` }}
                        title={formatMoney(t.total)}
                      />
                      <span className={`text-xs capitalize ${isHoje ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
