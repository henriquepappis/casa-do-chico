import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api } from "../lib/api";
import type { Relatorio, RelatorioSessao, Order } from "../lib/api";
import type { NavItem } from "../App";

type Periodo = "hoje" | "7d" | "mes" | "custom";

const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const formatMoney = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function localStr(d = new Date()): string {
  const o = d.getTimezoneOffset();
  return new Date(d.getTime() - o * 60000).toISOString().slice(0, 10);
}
const toISO = (dateStr: string, end = false) =>
  new Date(`${dateStr}T${end ? "23:59:59.999" : "00:00:00"}`).toISOString();

function rangeFor(periodo: Periodo, cFrom: string, cTo: string): { from: string; to: string } {
  const hojeStr = localStr();
  if (periodo === "hoje") return { from: toISO(hojeStr), to: toISO(hojeStr, true) };
  if (periodo === "7d") return { from: toISO(localStr(new Date(Date.now() - 6 * 86400000))), to: toISO(hojeStr, true) };
  if (periodo === "mes") return { from: toISO(`${hojeStr.slice(0, 7)}-01`), to: toISO(hojeStr, true) };
  return { from: toISO(cFrom), to: toISO(cTo, true) };
}

export default function RelatorioPage({
  onLogout,
  onNavigate,
}: {
  onLogout: () => void;
  onNavigate: (item: NavItem) => void;
}) {
  const [periodo, setPeriodo] = useState<Periodo>("hoje");
  const [cFrom, setCFrom] = useState(localStr);
  const [cTo, setCTo] = useState(localStr);
  const [data, setData] = useState<Relatorio | null>(null);
  const [loading, setLoading] = useState(true);
  const [detalhe, setDetalhe] = useState<RelatorioSessao | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = rangeFor(periodo, cFrom, cTo);
      setData(await api.getRelatorio(from, to));
    } finally {
      setLoading(false);
    }
  }, [periodo, cFrom, cTo]);

  useEffect(() => { load(); }, [load]);

  const resumo = data?.resumo;
  const maxDia = Math.max(...(data?.tendencia.map((t) => t.total) ?? [0]), 1);
  const maxHora = Math.max(...(data?.porHora.map((h) => h.total) ?? [0]), 1);
  const maxDow = Math.max(...(data?.porDiaSemana.map((d) => d.total) ?? [0]), 1);

  const PeriodoBtn = ({ p, label }: { p: Periodo; label: string }) => (
    <button
      onClick={() => setPeriodo(p)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        periodo === p ? "bg-red-600 text-white" : "bg-input/30 text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  const StatCard = ({ label, value, icon, acento }: { label: string; value: string | number; icon: string; acento: string }) => (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${acento}`}><span className="text-2xl">{icon}</span></div>
      </div>
    </Card>
  );

  const classeCor: Record<string, string> = {
    A: "bg-green-600/20 text-green-300 border-green-600/30",
    B: "bg-amber-600/20 text-amber-300 border-amber-600/30",
    C: "bg-muted text-muted-foreground border-border",
  };

  return (
    <DashboardLayout onLogout={onLogout} current="historico" onNavigate={onNavigate}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-display-lg mb-2">Relatórios</h1>
            <p className="text-muted-foreground">Vendas, horários de pico e produtos por período</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="mt-2">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span className="ml-1.5">Atualizar</span>
          </Button>
        </div>

        {/* Seletor de período */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <PeriodoBtn p="hoje" label="Hoje" />
          <PeriodoBtn p="7d" label="Últimos 7 dias" />
          <PeriodoBtn p="mes" label="Este mês" />
          <PeriodoBtn p="custom" label="Personalizado" />
          {periodo === "custom" && (
            <div className="flex items-center gap-2 ml-1">
              <input type="date" value={cFrom} max={localStr()} onChange={(e) => setCFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-input/40 text-foreground border border-border text-sm focus:outline-none focus:border-red-500" />
              <span className="text-muted-foreground text-sm">até</span>
              <input type="date" value={cTo} max={localStr()} onChange={(e) => setCTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-input/40 text-foreground border border-border text-sm focus:outline-none focus:border-red-500" />
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCard label="Total Vendido" value={formatMoney(resumo?.totalVendido ?? 0)} icon="💰" acento="bg-amber-600/20 text-amber-400" />
              <StatCard label="Ticket Médio" value={formatMoney(resumo?.ticketMedio ?? 0)} icon="📈" acento="bg-sky-600/20 text-sky-400" />
              <StatCard label="Mesas Atendidas" value={resumo?.mesasAtendidas ?? 0} icon="🪑" acento="bg-red-600/20 text-red-400" />
              <StatCard label="Pedidos" value={resumo?.totalPedidos ?? 0} icon="🧾" acento="bg-green-600/20 text-green-400" />
            </div>

            {/* Tendência diária */}
            <h2 className="text-2xl font-bold mb-6 text-foreground">Faturamento por dia</h2>
            <Card className="p-6 bg-card border-border mb-12">
              <div className="flex items-end gap-1.5 h-44 overflow-x-auto">
                {data?.tendencia.map((t, idx) => {
                  const isLast = idx === data.tendencia.length - 1;
                  const label = new Date(`${t.dia}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                  return (
                    <div key={t.dia} className="flex-1 min-w-[28px] flex flex-col items-center justify-end h-full gap-1.5">
                      <div className={`w-full rounded-t transition-all ${isLast ? "bg-red-600" : "bg-red-600/40"}`}
                        style={{ height: `${Math.max((t.total / maxDia) * 100, 2)}%` }} title={`${label}: ${formatMoney(t.total)}`} />
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">{label}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Horários de pico */}
            <h2 className="text-2xl font-bold mb-6 text-foreground">Horários de pico</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              <Card className="p-6 bg-card border-border">
                <p className="text-sm font-semibold text-muted-foreground mb-4">Por hora do dia</p>
                <div className="flex items-end gap-0.5 h-32">
                  {data?.porHora.map((h) => (
                    <div key={h.hora} className="flex-1 flex flex-col items-center justify-end h-full" title={`${h.hora}h: ${formatMoney(h.total)} • ${h.pedidos} pedidos`}>
                      <div className="w-full rounded-t bg-sky-500/60" style={{ height: `${Math.max((h.total / maxHora) * 100, 1)}%` }} />
                      {h.hora % 6 === 0 && <span className="text-[9px] text-muted-foreground mt-1">{h.hora}h</span>}
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-6 bg-card border-border">
                <p className="text-sm font-semibold text-muted-foreground mb-4">Por dia da semana</p>
                <div className="flex items-end gap-2 h-32">
                  {data?.porDiaSemana.map((d) => (
                    <div key={d.dow} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5" title={`${DOW[d.dow]}: ${formatMoney(d.total)}`}>
                      <div className="w-full rounded-t bg-sky-500/60" style={{ height: `${Math.max((d.total / maxDow) * 100, 1)}%` }} />
                      <span className="text-[10px] text-muted-foreground">{DOW[d.dow]}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Curva de produtos (ABC) */}
            {data && data.itens.length > 0 && (
              <>
                <h2 className="text-2xl font-bold mb-2 text-foreground">Produtos</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Curva ABC — <span className="text-green-300">A</span> = campeões (até 80% da receita),
                  {" "}<span className="text-amber-300">B</span> = intermediários, <span className="text-muted-foreground">C</span> = cauda.
                </p>
                <Card className="bg-card border-border divide-y divide-border mb-12">
                  {data.itens.map((it, idx) => (
                    <div key={it.name} className="flex items-center justify-between px-5 py-3 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-bold text-muted-foreground w-6">{idx + 1}º</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${classeCor[it.classe]}`}>{it.classe}</span>
                        <span className="text-foreground truncate">{it.name}</span>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                        <span className="text-sm text-muted-foreground">{it.quantidade}x</span>
                        <span className="text-sm text-muted-foreground w-12 text-right">{(it.share * 100).toFixed(0)}%</span>
                        <span className="font-semibold text-foreground w-24 text-right">{formatMoney(it.total)}</span>
                      </div>
                    </div>
                  ))}
                </Card>
              </>
            )}

            {/* Sessões encerradas */}
            <h2 className="text-2xl font-bold mb-6 text-foreground">Sessões encerradas</h2>
            {data && data.sessoes.length > 0 ? (
              <div className="space-y-3">
                {data.sessoes.map((s) => (
                  <Card key={s.id} onClick={() => setDetalhe(s)}
                    className="p-4 bg-card border-border cursor-pointer hover:border-border/80 transition-all flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center font-bold text-foreground flex-shrink-0">
                        {String(s.tableNumber).padStart(2, "0")}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">Mesa {String(s.tableNumber).padStart(2, "0")}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(s.closedAt).toLocaleDateString("pt-BR")} • {formatTime(s.openedAt)}–{formatTime(s.closedAt)} • {s.pedidos} {s.pedidos === 1 ? "pedido" : "pedidos"}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-foreground whitespace-nowrap">{formatMoney(s.total)}</span>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">Nenhuma sessão encerrada no período.</div>
            )}
          </>
        )}
      </div>

      {detalhe && <SessaoModal sessao={detalhe} onClose={() => setDetalhe(null)} />}
    </DashboardLayout>
  );
}

function groupByClient(orders: Order[]) {
  const groups = new Map<string, Order[]>();
  for (const o of orders) {
    const key = o.clientId || o.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(o);
  }
  return Array.from(groups.values());
}

function SessaoModal({ sessao, onClose }: { sessao: RelatorioSessao; onClose: () => void }) {
  const grupos = groupByClient(sessao.orders);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-foreground font-bold text-lg">Mesa {String(sessao.tableNumber).padStart(2, "0")}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          {new Date(sessao.closedAt).toLocaleDateString("pt-BR")} • {formatTime(sessao.openedAt)}–{formatTime(sessao.closedAt)}
        </p>
        <div className="space-y-5">
          {grupos.map((orders) => {
            const items = orders.flatMap((o) => o.items);
            const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
            const first = orders[0];
            return (
              <div key={first.clientId || first.id} className="border border-border rounded-lg p-4">
                <p className="font-semibold text-foreground mb-3">{first.customerName}</p>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex justify-between text-sm">
                      <span className="text-foreground"><span className="font-bold text-red-400 mr-2">{item.quantity}×</span>{item.name}</span>
                      <span className="text-muted-foreground">{formatMoney(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-border/50 text-sm font-semibold text-foreground">
                  <span>Subtotal</span><span>{formatMoney(subtotal)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-2xl font-bold text-foreground">{formatMoney(sessao.total)}</span>
        </div>
      </div>
    </div>
  );
}
