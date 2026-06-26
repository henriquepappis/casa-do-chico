import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import type { Order } from '../lib/api';
import { toast } from '../lib/toast';
import { useWebSocket } from '../lib/useWebSocket';
import TransferirMesaModal from '../components/TransferirMesaModal';
import ElapsedTime from '../components/ElapsedTime';
import type { NavItem } from '../App';

interface SessionData {
  sessaoId: string;
  openedAt: string;
  orders: Order[];
  total: number;
}

function groupByClient(orders: Order[]) {
  const groups = new Map<string, Order[]>();
  for (const order of orders) {
    const key = order.clientId || order.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(order);
  }
  return Array.from(groups.values());
}

export default function MesaDetailPage({
  mesaNumber,
  onBack,
  onLogout,
  onMesaChanged,
  onNavigate,
}: {
  mesaNumber: number;
  onBack: () => void;
  onLogout: () => void;
  onMesaChanged: () => void;
  onNavigate: (item: NavItem) => void;
}) {
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<'abrir' | 'fechar' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.getMesaPedidos(mesaNumber));
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('sessão ativa')) setData(null);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [mesaNumber]);
  useWebSocket((event) => {
    if ('tableNumber' in event && event.tableNumber === mesaNumber) load();
  });

  const handleAbrir = async () => {
    setActionLoading('abrir');
    try {
      await api.abrirMesa(mesaNumber);
      await load();
      onMesaChanged();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFechar = async () => {
    setActionLoading('fechar');
    try {
      await api.fecharMesa(mesaNumber);
      setData(null);
      setShowConfirm(false);
      onMesaChanged();
      onBack();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const mesaNumero = String(mesaNumber).padStart(2, '0');
  const groups = data ? groupByClient(data.orders) : [];
  const totalClientes = groups.length;
  const totalPedidos = data?.orders.length ?? 0;
  const totalItems = data?.orders.flatMap(o => o.items).reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <DashboardLayout onLogout={onLogout} current="mesas" onNavigate={onNavigate}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-4 mb-12">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-muted rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-5xl font-bold text-foreground">Mesa {mesaNumero}</h1>
            <p className="text-muted-foreground mt-1">
              {data ? <>Detalhes e resumo de pedidos • Aberta às {formatTime(data.openedAt)}</> : 'Detalhes e resumo de pedidos'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="ml-1.5 hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg text-sm bg-red-600/10 border border-red-600/30 text-red-400">
            {error}
          </div>
        ) : !data ? (
          /* Mesa livre */
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 text-4xl bg-green-600/10 border border-green-600/20">
              🟢
            </div>
            <h2 className="mb-2 text-foreground" style={{ fontSize: '1.75rem' }}>Mesa livre</h2>
            <p className="text-sm mb-2 text-muted-foreground max-w-sm">
              A sessão abre sozinha quando o cliente faz o 1º pedido pelo QR-code.
            </p>
            <p className="text-xs mb-8 text-muted-foreground">Ou abra manualmente para lançar pedidos no balcão:</p>
            <Button variant="outline" onClick={handleAbrir} disabled={actionLoading === 'abrir'} className="px-10 py-3">
              {actionLoading === 'abrir' ? 'Abrindo...' : 'Abrir mesa manualmente'}
            </Button>
          </div>
        ) : (
          /* Layout duas colunas */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Coluna esquerda — Pedidos */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {data.orders.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <p>Nenhum pedido ainda</p>
                  </div>
                ) : (
                  groups.map((orders) => {
                    const allItems = orders.flatMap(o => o.items);
                    const subtotal = allItems.reduce((s, i) => s + i.price * i.quantity, 0);
                    const first = orders[0];
                    const last = orders[orders.length - 1];
                    return (
                      <Card key={first.clientId || first.id} className="p-6 bg-card border-border">
                        {/* Cliente */}
                        <div className="mb-6 pb-4 border-b border-border flex items-center justify-between">
                          <h3 className="text-xl font-bold text-foreground">{first.customerName}</h3>
                          <div className="flex items-center gap-3">
                            {orders.length > 1 && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {orders.length} envios
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">{formatTime(last.createdAt)}</span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-4 mb-6">
                          {allItems.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                              <div className="flex-1">
                                <p className="font-medium text-foreground">
                                  <span className="font-bold mr-2 text-red-400">{item.quantity}×</span>
                                  {item.name}
                                </p>
                                {item.observation && (
                                  <p className="text-xs mt-0.5 italic text-muted-foreground">Obs: {item.observation}</p>
                                )}
                                <p className="text-sm mt-0.5 text-muted-foreground">
                                  {item.quantity}x {formatMoney(item.price)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-foreground">
                                  {formatMoney(item.quantity * item.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Subtotal */}
                        <div className="flex justify-between items-center pt-4 border-t border-border">
                          <p className="font-semibold text-foreground">Subtotal</p>
                          <p className="text-xl font-bold text-foreground">{formatMoney(subtotal)}</p>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>

            {/* Coluna direita — Resumo sticky */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-card border-border sticky top-4 lg:top-6 rounded-lg">
                <h3 className="text-2xl font-bold mb-8 text-foreground">Resumo</h3>

                {/* Stats */}
                <div className="space-y-4 mb-8 pb-8 border-b border-border">
                  {[
                    { label: 'Clientes', value: totalClientes },
                    { label: 'Pedidos', value: totalPedidos },
                    { label: 'Itens', value: totalItems },
                  ].map(s => (
                    <div key={s.label} className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Tempo aberta</p>
                    <p className="text-2xl font-bold text-foreground">
                      <ElapsedTime isoDate={data.openedAt} />
                    </p>
                  </div>
                </div>

                {/* Total */}
                <div className="mb-6 lg:mb-8">
                  <p className="text-sm text-muted-foreground mb-2">Total</p>
                  <p className="text-3xl lg:text-4xl font-bold text-foreground">{formatMoney(data.total)}</p>
                </div>

                {/* Botão Fechar Mesa */}
                <Button
                  onClick={() => setShowConfirm(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-5 lg:py-6 transition-all duration-200"
                >
                  Fechar Mesa
                </Button>

                {/* Transferir mesa */}
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() => setShowTransfer(true)}
                >
                  Transferir mesa
                </Button>

                {/* Info */}
                <p className="text-xs text-muted-foreground text-center mt-3 lg:mt-4">
                  Aberta às {formatTime(data.openedAt)}
                </p>

              </Card>
            </div>
          </div>
        )}

        {/* Dialog de confirmação */}
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Fechar Mesa {mesaNumero}?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Total a receber:{' '}
                <span className="font-bold text-foreground">{formatMoney(data?.total ?? 0)}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end mt-6">
              <AlertDialogCancel onClick={() => setShowConfirm(false)} className="border-border hover:bg-muted">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleFechar}
                disabled={actionLoading === 'fechar'}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading === 'fechar' ? 'Fechando...' : 'Confirmar Fechamento'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {showTransfer && (
          <TransferirMesaModal
            origem={mesaNumber}
            onClose={() => setShowTransfer(false)}
            onTransferida={() => {
              setShowTransfer(false);
              onMesaChanged();
              onBack();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
