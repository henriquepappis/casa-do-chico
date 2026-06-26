import type { MenuItem } from "../AppContext";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Sem conexão com o servidor. Tente novamente em instantes.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Erro ao processar sua solicitação (${res.status}).`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface CreateOrderPayload {
  tableNumber: number;
  customerName: string;
  clientId: string;
  items: {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    observation: string;
  }[];
}

export interface CreateOrderResponse {
  id: string;
  status: string;
}

export interface BackendOrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  observation: string;
}

export interface BackendOrder {
  id: string;
  clientId: string;
  customerName: string;
  createdAt: string;
  items: BackendOrderItem[];
}

export const api = {
  getCardapio: () =>
    request<MenuItem[]>("/cardapio"),

  getMesa: (number: number) =>
    request<{ id: number; number: number; status: string; sessao: unknown }>(`/mesas/${number}`),

  getComanda: (clientId: string) =>
    request<{ tableNumber: number | null }>(`/clientes/${encodeURIComponent(clientId)}/comanda`),

  getMeusOrders: (tableNumber: number, clientId: string) =>
    request<BackendOrder[]>(`/mesas/${tableNumber}/meus-pedidos?clientId=${encodeURIComponent(clientId)}`),

  sendOrder: (payload: CreateOrderPayload) =>
    request<CreateOrderResponse>("/pedidos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
