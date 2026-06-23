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
import { RefreshCw, Trash2, KeyRound } from "lucide-react";
import { api } from "../lib/api";
import type { User } from "../lib/api";
import { getUser } from "../lib/auth";
import NovoUsuarioModal from "../components/NovoUsuarioModal";

export default function UsuariosPage({
  onLogout,
  onNavigate,
}: {
  onLogout: () => void;
  onNavigate: (item: "mesas" | "usuarios") => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNovo, setShowNovo] = useState(false);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [toReset, setToReset] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const me = getUser();

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      setUsers(await api.getUsers());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalDonos = users.filter((u) => u.role === "DONO").length;
  const totalGarcons = users.filter((u) => u.role === "GARCOM").length;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const handleDelete = async () => {
    if (!toDelete) return;
    setActionLoading(true);
    try {
      await api.deletarUsuario(toDelete.id);
      setToDelete(null);
      await load(true);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(false);
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
    <DashboardLayout onLogout={onLogout} current="usuarios" onNavigate={onNavigate}>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-display-lg mb-2">Usuários</h1>
            <p className="text-muted-foreground">Gerencie quem tem acesso ao painel</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span className="ml-1.5">Atualizar</span>
            </Button>
            <Button size="sm" onClick={() => setShowNovo(true)}>
              + Novo Usuário
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard label="Total de Usuários" value={users.length} acento="bg-red-600/20 text-red-400" icon="👥" />
          <StatCard label="Donos" value={totalDonos} acento="bg-amber-600/20 text-amber-400" icon="👑" />
          <StatCard label="Garçons" value={totalGarcons} acento="bg-green-600/20 text-green-400" icon="🧑‍🍳" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((u) => {
              const isMe = u.id === me?.id;
              const isDono = u.role === "DONO";
              return (
                <Card key={u.id} className="p-6 bg-card border-border">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-full bg-sidebar-accent/20 flex items-center justify-center text-base font-bold uppercase flex-shrink-0"
                        style={{ color: "#dc2626" }}
                      >
                        {u.username[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{u.username}</p>
                        <p className="text-xs text-muted-foreground">Desde {formatDate(u.createdAt)}</p>
                      </div>
                    </div>
                    {isMe && (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                        Você
                      </Badge>
                    )}
                  </div>

                  <div className="mb-5">
                    <Badge
                      variant="outline"
                      className={isDono ? "bg-amber-600/20 text-amber-300 border-amber-600/30" : "bg-green-600/20 text-green-300 border-green-600/30"}
                    >
                      {isDono ? "👑 Dono" : "🧑‍🍳 Garçom"}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setToReset(u)}>
                      <KeyRound size={13} />
                      <span className="ml-1.5">Resetar senha</span>
                    </Button>
                    {!isMe && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-400 border-red-600/30 hover:bg-red-600/10"
                        onClick={() => setToDelete(u)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {showNovo && (
        <NovoUsuarioModal
          onClose={() => setShowNovo(false)}
          onCreated={() => {
            setShowNovo(false);
            load(true);
          }}
        />
      )}

      {toReset && (
        <ResetSenhaModal
          user={toReset}
          onClose={() => setToReset(null)}
          onDone={() => setToReset(null)}
        />
      )}

      {/* Confirmação de remoção */}
      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Remover {toDelete?.username}?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta ação é permanente e o usuário perderá o acesso ao painel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end mt-6">
            <AlertDialogCancel onClick={() => setToDelete(null)} className="border-border hover:bg-muted">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function ResetSenhaModal({ user, onClose, onDone }: { user: User; onClose: () => void; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.atualizarUsuario(user.id, { password });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6">
        <h2 className="text-foreground font-bold text-lg mb-1">Resetar senha</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Defina uma nova senha para <span className="font-semibold text-foreground">{user.username}</span>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-input/40 text-foreground border border-border focus:outline-none focus:border-red-500 transition-colors"
            placeholder="Nova senha (mínimo 6 caracteres)"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
