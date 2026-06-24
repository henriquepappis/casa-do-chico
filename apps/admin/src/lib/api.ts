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

  // Só trata como "sessão expirada" quando havia token (requisição autenticada).
  // No login não há token, então um 401 cai no tratamento abaixo e mostra
  // a mensagem real da API ("Credenciais inválidas").
  if (res.status === 401 && token) {
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
  status: "LIVRE" | "OCUPADA" | "INATIVA";
  sessao: {
    id: string;
    openedAt: string;
    orders: Order[];
    total: number;
  } | null;
}

export type MenuCategory = "bebidas" | "petiscos" | "refeicoes" | "sobremesas";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image: string;
  badge: string | null;
  active: boolean;
  position: number;
  createdAt: string;
}

export type MenuItemInput = {
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image: string;
  badge: string | null;
  position: number;
  active: boolean;
};

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

  ativarMesa: (number: number) =>
    request<Mesa>(`/mesas/${number}/ativar`, { method: "PATCH" }),

  desativarMesa: (number: number) =>
    request<Mesa>(`/mesas/${number}/desativar`, { method: "PATCH" }),

  transferirMesa: (origem: number, destino: number) =>
    request<{ origem: number; destino: number }>(`/mesas/${origem}/transferir`, {
      method: "POST",
      body: JSON.stringify({ destino }),
    }),

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

  getCardapio: () => request<MenuItem[]>("/cardapio/all"),

  criarItem: (data: MenuItemInput) =>
    request<MenuItem>("/cardapio", { method: "POST", body: JSON.stringify(data) }),

  atualizarItem: (id: string, data: Partial<MenuItemInput>) =>
    request<MenuItem>(`/cardapio/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deletarItem: (id: string) =>
    request<void>(`/cardapio/${id}`, { method: "DELETE" }),
};
