const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("admin_token");
  const hasBody = !!options?.body;
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem("admin_token");
    window.location.href = "/";
    throw new Error("Sessão expirada");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface Mesa {
  id: number;
  number: number;
  status: "LIVRE" | "OCUPADA";
  sessao: {
    id: string;
    openedAt: string;
    orders: Order[];
    total: number;
  } | null;
}

export interface User {
  id: string;
  username: string;
  role: "DONO" | "GARCOM";
  createdAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  clientId: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  observation: string;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string; role: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getMesas: () => request<Mesa[]>("/mesas"),

  getMesaPedidos: (number: number) =>
    request<{ sessaoId: string; openedAt: string; orders: Order[]; total: number }>(
      `/mesas/${number}/pedidos`
    ),

  abrirMesa: (number: number) =>
    request<{ id: string }>(`/mesas/${number}/abrir`, { method: "POST" }),

  fecharMesa: (number: number) =>
    request<{ id: string }>(`/mesas/${number}/fechar`, { method: "POST" }),

  criarMesa: (number: number) =>
    request<Mesa>("/mesas", { method: "POST", body: JSON.stringify({ number }) }),

  deletarMesa: (number: number) =>
    request<void>(`/mesas/${number}`, { method: "DELETE" }),

  getUsers: () => request<User[]>("/users"),

  criarUsuario: (username: string, password: string, role: User["role"]) =>
    request<User>("/users", {
      method: "POST",
      body: JSON.stringify({ username, password, role }),
    }),

  atualizarUsuario: (id: string, data: { password?: string; role?: User["role"] }) =>
    request<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deletarUsuario: (id: string) =>
    request<void>(`/users/${id}`, { method: "DELETE" }),
};
