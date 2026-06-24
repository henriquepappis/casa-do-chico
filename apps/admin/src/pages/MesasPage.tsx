import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import type { Mesa } from '../lib/api';
import { getUser } from '../lib/auth';
import { useWebSocket } from '../lib/useWebSocket';
import NovaMesaModal from '../components/NovaMesaModal';
import type { NavItem } from '../App';

export default function MesasPage({
  onLogout,
  onNavigate,
  onSelectMesa,
}: {
  onLogout: () => void;
  onNavigate: (item: NavItem) => void;
  onSelectMesa: (number: number) => void;
}) {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const user = getUser();

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      setMesas(await api.getMesas());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  useWebSocket(() => load(true));

  const mesasOcupadas = mesas.filter(m => m.status === 'OCUPADA');
  const mesasLivres = mesas.filter(m => m.status === 'LIVRE');
  const totalAberto = mesasOcupadas.reduce((sum, m) => sum + (m.sessao?.total ?? 0), 0);

  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

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

  const MesaCard = ({ mesa }: { mesa: Mesa }) => {
    const isOcupada = mesa.status === 'OCUPADA';
    const clientesUnicos = mesa.sessao
      ? new Set(mesa.sessao.orders.map(o => o.clientId).filter(Boolean)).size
      : 0;
    const borderColor = isOcupada ? 'border-red-600/50' : 'border-border';

    return (
      <button
        onClick={() => isOcupada && onSelectMesa(mesa.number)}
        disabled={!isOcupada}
        className={`relative p-6 rounded-lg border ${borderColor} ${isOcupada ? 'hover:border-red-600/70 hover:bg-red-950/20' : 'hover:border-border/80 hover:bg-muted/30'} transition-all duration-200 text-left disabled:cursor-default group overflow-hidden w-full bg-card`}
      >
        {/* Barra de acento no topo */}
        {isOcupada && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-red-500" />
        )}

        {/* Número da mesa */}
        <div className="mb-4 pt-2">
          <p className="text-6xl font-bold text-foreground" style={{ lineHeight: 1 }}>
            {String(mesa.number).padStart(2, '0')}
          </p>
        </div>

        {/* Status badge */}
        <div className="mb-4">
          <Badge
            className={isOcupada ? 'bg-red-600/20 text-red-300 border-red-600/30' : 'bg-green-600/20 text-green-300 border-green-600/30'}
            variant="outline"
          >
            {isOcupada ? '🔴 Ocupada' : '🟢 Livre'}
          </Badge>
        </div>

        {/* Conteúdo */}
        {isOcupada && mesa.sessao ? (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold text-foreground">{formatMoney(mesa.sessao.total)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Pedidos</p>
                <p className="text-lg font-semibold text-foreground">{mesa.sessao.orders.length}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Aberta às {formatTime(mesa.sessao.openedAt)}{clientesUnicos > 0 ? ` • ${clientesUnicos} ${clientesUnicos === 1 ? 'cliente' : 'clientes'}` : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Disponível para reserva</p>
          </div>
        )}
      </button>
    );
  };

  return (
    <DashboardLayout onLogout={onLogout} current="mesas" onNavigate={onNavigate}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-display-lg mb-2">Mesas</h1>
            <p className="text-muted-foreground">Gerenciamento de mesas e pedidos em tempo real</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span className="ml-1.5">Atualizar</span>
            </Button>
            {user?.role === 'DONO' && (
              <Button size="sm" onClick={() => setShowNova(true)}>
                + Nova Mesa
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard label="Mesas Ocupadas" value={mesasOcupadas.length} acento="bg-red-600/20 text-red-400" icon="🔴" />
          <StatCard label="Mesas Livres" value={mesasLivres.length} acento="bg-green-600/20 text-green-400" icon="🟢" />
          <StatCard label="Total em Aberto" value={formatMoney(totalAberto)} acento="bg-amber-600/20 text-amber-400" icon="💰" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Mesas Ocupadas */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Ocupadas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {mesasOcupadas.length > 0 ? (
                  mesasOcupadas.map(mesa => <MesaCard key={mesa.id} mesa={mesa} />)
                ) : (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Nenhuma mesa ocupada no momento
                  </div>
                )}
              </div>
            </div>

            {/* Mesas Livres */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-foreground">Livres</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {mesasLivres.length > 0 ? (
                  mesasLivres.map(mesa => <MesaCard key={mesa.id} mesa={mesa} />)
                ) : (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Todas as mesas estão ocupadas
                  </div>
                )}
              </div>
            </div>

            {mesas.length === 0 && (
              <div className="text-center py-20">
                <p className="text-lg font-medium mb-2 text-foreground">Nenhuma mesa cadastrada</p>
                <p className="text-sm mb-6 text-muted-foreground">Adicione mesas para começar a gerenciar o salão.</p>
                {user?.role === 'DONO' && (
                  <Button onClick={() => setShowNova(true)}>Adicionar primeira mesa</Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showNova && (
        <NovaMesaModal onClose={() => setShowNova(false)} onCreated={() => { setShowNova(false); load(); }} />
      )}
    </DashboardLayout>
  );
}
