import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "../lib/api";
import type { User } from "../lib/api";

export default function NovoUsuarioModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<User["role"]>("GARCOM");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Preencha usuário e senha");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.criarUsuario(username.trim(), password, role);
      onCreated();
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
      <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground font-bold text-lg">Novo Usuário</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Usuário</label>
            <input
              type="text"
              autoCapitalize="none"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              placeholder="Ex: maria"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Função</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as User["role"])}
              className={inputClass}
            >
              <option value="GARCOM">Garçom</option>
              <option value="DONO">Dono</option>
            </select>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
