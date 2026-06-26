/**
 * AppContext — Estado global do Cardápio Digital Casa do Chico
 * Gerencia: identificação da mesa, nome do cliente, carrinho e pedidos enviados
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { api } from "./lib/api";
import type { BackendOrder } from "./lib/api";
import { useWebSocket } from "./lib/useWebSocket";
import { toast } from "./lib/toast";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "bebidas" | "petiscos" | "refeicoes" | "sobremesas";
  image: string;
  badge?: string; // ex: "Mais Pedido", "Novo", "Destaque"
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  observation: string;
}

export interface OrderItem {
  id: string;
  item: MenuItem;
  quantity: number;
  observation: string;
  sentAt: Date;
  status: "preparando" | "pronto" | "entregue";
}

interface AppState {
  tableNumber: number;
  customerName: string;
  isLoggedIn: boolean;
  menuItems: MenuItem[];
  menuLoading: boolean;
  cart: CartItem[];
  orders: OrderItem[];
  screen: "login" | "menu" | "cart" | "receipt" | "blocked";
  activeCategory: MenuItem["category"];
  cartBounce: boolean;
  sendingOrder: boolean;
  tableError: string | null;
  blockedTable: number | null;
}

interface AppContextType extends AppState {
  login: (name: string) => void;
  logout: () => void;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  updateObservation: (itemId: string, obs: string) => void;
  clearCart: () => void;
  sendOrder: () => Promise<void>;
  setScreen: (screen: AppState["screen"]) => void;
  setCategory: (cat: MenuItem["category"]) => void;
  cartTotal: number;
  cartCount: number;
  orderTotal: number;
}

const AppContext = createContext<AppContextType | null>(null);

const NAME_KEY      = "casa-do-chico-name";
const CART_KEY      = "casa-do-chico-cart";
const CLIENT_ID_KEY = "casa-do-chico-client-id";

function getOrCreateClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
    return id;
  } catch { return crypto.randomUUID(); }
}

function getTableNumberFromUrl(): number {
  const params = new URLSearchParams(window.location.search);
  const n = Number(params.get("mesa"));
  return n > 0 ? n : 0;
}

function loadSavedName(): string {
  try { return localStorage.getItem(NAME_KEY) ?? ""; } catch { return ""; }
}

function loadSavedCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}



export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const tableNumber = getTableNumberFromUrl();
    return {
      tableNumber,
      customerName: loadSavedName(),
      isLoggedIn: false,
      menuItems: [],
      menuLoading: true,
      cart: loadSavedCart(),
      orders: [],
      screen: "login",
      activeCategory: "bebidas",
      cartBounce: false,
      sendingOrder: false,
      tableError: tableNumber === 0 ? "Número de mesa inválido. Use o QR Code da mesa." : null,
      blockedTable: null,
    };
  });

  // Carrega cardápio do backend
  useEffect(() => {
    api.getCardapio()
      .then((items) => setState((s) => ({ ...s, menuItems: items, menuLoading: false })))
      .catch(() => setState((s) => ({ ...s, menuLoading: false })));
  }, []);

  // Bloqueia mesa diferente da comanda aberta + restaura sessão ativa
  useEffect(() => {
    const tableNumber = getTableNumberFromUrl();
    if (!tableNumber) return;
    const clientId = localStorage.getItem(CLIENT_ID_KEY);
    if (!clientId) return;

    let cancelled = false;
    (async () => {
      // 1) Se o cliente já tem comanda aberta em OUTRA mesa, bloqueia o acesso
      try {
        const comanda = await api.getComanda(clientId);
        if (cancelled) return;
        if (comanda.tableNumber && comanda.tableNumber !== tableNumber) {
          setState((s) => ({ ...s, screen: "blocked", blockedTable: comanda.tableNumber }));
          return;
        }
      } catch { /* segue para restauração */ }

      // 2) Restaura a sessão desta mesa (só se houver nome salvo)
      const name = loadSavedName();
      if (!name) return;

      const mesa = await api.getMesa(tableNumber).catch(() => null);
      if (cancelled || !mesa || mesa.status === "INATIVA") return;

      const [backendOrders, menuItems] = await Promise.all([
        api.getMeusOrders(tableNumber, clientId).catch(() => [] as BackendOrder[]),
        api.getCardapio().catch(() => [] as MenuItem[]),
      ]);

      const menuMap = new Map(menuItems.map((m) => [m.id, m]));

      const restoredOrders: OrderItem[] = backendOrders.flatMap((o) =>
        o.items.map((item) => ({
          id: item.id,
          item: menuMap.get(item.menuItemId) ?? {
            id: item.menuItemId,
            name: item.name,
            price: item.price,
            description: "",
            category: "bebidas" as const,
            image: "",
          },
          quantity: item.quantity,
          observation: item.observation,
          sentAt: new Date(o.createdAt),
          status: "preparando" as const,
        }))
      );

      if (cancelled) return;
      setState((s) => ({ ...s, customerName: name, isLoggedIn: true, screen: "menu", orders: restoredOrders, menuItems: menuItems.length ? menuItems : s.menuItems }));
    })();

    return () => { cancelled = true; };
  }, []);

  // Persiste apenas nome e carrinho
  useEffect(() => {
    try { localStorage.setItem(NAME_KEY, state.customerName); } catch {}
  }, [state.customerName]);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch {}
  }, [state.cart]);

// Expulsa o cliente se a mesa for fechada pelo garçom
  const stateRef = useRef(state);
  stateRef.current = state;
  useWebSocket((event) => {
    if (event.type === "mesa_closed" && event.tableNumber === stateRef.current.tableNumber) {
      setState((s) => ({
        ...s,
        isLoggedIn: false,
        screen: "login",
        cart: [],
        orders: [],
      }));
      try {
        localStorage.removeItem(CART_KEY);
      } catch {}
    }

    if (event.type === "mesa_transferred" && event.tableNumber === stateRef.current.tableNumber) {
      setState((s) => ({
        ...s,
        isLoggedIn: false,
        screen: "blocked",
        blockedTable: event.destinoNumber,
        cart: [],
        orders: [],
      }));
      try {
        localStorage.removeItem(CART_KEY);
      } catch {}
    }
  });

  const login = useCallback((name: string) => {
    getOrCreateClientId(); // garante que o clientId existe antes do primeiro pedido
    setState((s) => ({
      ...s,
      customerName: name,
      isLoggedIn: true,
      screen: "menu",
      tableError: null,
    }));
  }, []);

  const logout = useCallback(() => {
    setState((s) => ({
      ...s,
      customerName: "",
      isLoggedIn: false,
      screen: "login",
      cart: [],
      orders: [],
    }));
  }, []);

  const addToCart = useCallback((item: MenuItem) => {
    setState((s) => {
      const existing = s.cart.find((c) => c.item.id === item.id);
      const newCart = existing
        ? s.cart.map((c) =>
            c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
          )
        : [...s.cart, { item, quantity: 1, observation: "" }];
      return { ...s, cart: newCart, cartBounce: true };
    });
    // Reset bounce animado
    setTimeout(() => setState((s) => ({ ...s, cartBounce: false })), 400);
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setState((s) => ({
      ...s,
      cart: s.cart.filter((c) => c.item.id !== itemId),
    }));
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setState((s) => {
      const newCart = s.cart
        .map((c) =>
          c.item.id === itemId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0);
      return { ...s, cart: newCart };
    });
  }, []);

  const updateObservation = useCallback((itemId: string, obs: string) => {
    setState((s) => ({
      ...s,
      cart: s.cart.map((c) =>
        c.item.id === itemId ? { ...c, observation: obs } : c
      ),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setState((s) => ({ ...s, cart: [] }));
  }, []);

  const sendOrder = useCallback(async () => {
    setState((s) => ({ ...s, sendingOrder: true }));
    try {
      const s = await new Promise<AppState>((resolve) => {
        setState((current) => { resolve(current); return current; });
      });

      await api.sendOrder({
        tableNumber: s.tableNumber,
        customerName: s.customerName,
        clientId: getOrCreateClientId(),
        items: s.cart.map((c) => ({
          menuItemId: c.item.id,
          name: c.item.name,
          price: c.item.price,
          quantity: c.quantity,
          observation: c.observation,
        })),
      });

      setState((current) => {
        const newOrders: OrderItem[] = current.cart.map((c) => ({
          id: `${Date.now()}-${c.item.id}`,
          item: c.item,
          quantity: c.quantity,
          observation: c.observation,
          sentAt: new Date(),
          status: "preparando",
        }));
        return {
          ...current,
          orders: [...current.orders, ...newOrders],
          cart: [],
          screen: "receipt",
          sendingOrder: false,
        };
      });
    } catch (err) {
      setState((s) => ({ ...s, sendingOrder: false }));
      toast.error((err as Error).message ?? "Erro ao enviar pedido. Tente novamente.");
    }
  }, []);

  const setScreen = useCallback((screen: AppState["screen"]) => {
    setState((s) => ({ ...s, screen }));
  }, []);

  const setCategory = useCallback((cat: MenuItem["category"]) => {
    setState((s) => ({ ...s, activeCategory: cat }));
  }, []);

  const cartTotal = state.cart.reduce(
    (sum, c) => sum + c.item.price * c.quantity,
    0
  );
  const cartCount = state.cart.reduce((sum, c) => sum + c.quantity, 0);
  const orderTotal = state.orders.reduce(
    (sum, o) => sum + o.item.price * o.quantity,
    0
  );

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateObservation,
        clearCart,
        sendOrder,
        setScreen,
        setCategory,
        cartTotal,
        cartCount,
        orderTotal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
