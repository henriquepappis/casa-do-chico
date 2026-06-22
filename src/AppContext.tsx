/**
 * AppContext — Estado global do Cardápio Digital Casa do Chico
 * Gerencia: identificação da mesa, nome do cliente, carrinho e pedidos enviados
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

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
  cart: CartItem[];
  orders: OrderItem[];
  screen: "login" | "menu" | "cart" | "receipt"; // Padronizado para 'screen'
  activeCategory: MenuItem["category"];
  cartBounce: boolean;
}

interface AppContextType extends AppState {
  login: (name: string) => void;
  logout: () => void;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  updateObservation: (itemId: string, obs: string) => void;
  clearCart: () => void;
  sendOrder: () => void;
  setScreen: (screen: AppState["screen"]) => void;
  setCategory: (cat: MenuItem["category"]) => void;
  cartTotal: number;
  cartCount: number;
  orderTotal: number;
}

const AppContext = createContext<AppContextType | null>(null);

const TABLE_NUMBER = 5; // Mesa padrão para testes locais
const STORAGE_KEY = "casa-do-chico-session";
const NAME_KEY    = "casa-do-chico-name";

function loadSession(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed.orders) {
      parsed.orders = parsed.orders.map((o: OrderItem) => ({
        ...o,
        sentAt: new Date(o.sentAt),
      }));
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveSession(state: AppState) {
  try {
    const { cartBounce, ...toSave } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    // Nome salvo separadamente para sobreviver a logouts e trocas de mesa
    if (state.customerName) {
      localStorage.setItem(NAME_KEY, state.customerName);
    }
  } catch {}
}

function loadSavedName(): string {
  try { return localStorage.getItem(NAME_KEY) ?? ""; }
  catch { return ""; }
}

export const MENU_ITEMS: MenuItem[] = [
  // ── BEBIDAS ──
  {
    id: "beb-01",
    name: "Cerveja Gelada",
    description: "Long neck 355ml trincando de gelada",
    price: 9.9,
    category: "bebidas",
    image:
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80",
    badge: "Mais Pedido",
  },
  {
    id: "beb-02",
    name: "Caipirinha da Casa",
    description: "Cachaça artesanal, limão, açúcar e bastante gelo",
    price: 18.0,
    category: "bebidas",
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80",
  },
  {
    id: "beb-03",
    name: "Suco Natural",
    description: "Suco da fruta de 400ml — Caju, manga, goiaba ou maracujá",
    price: 12.0,
    category: "bebidas",
    image:
      "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80",
  },
  {
    id: "beb-04",
    name: "Refrigerante Zero",
    description: "Lata 350ml trincando — Coca-Cola Zero, Guaraná Antárctica",
    price: 7.0,
    category: "bebidas",
    image:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80",
  },

  // ── PETISCOS ──
  {
    id: "pet-01",
    name: "Tábua de Petiscos",
    description:
      "Macaxeira crocante frita, queijo coalho assado na chapa e coxinhas artesanais (serve 2 pessoas)",
    price: 42.9,
    category: "petiscos",
    image:
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80",
    badge: "Mais Pedido",
  },
  {
    id: "pet-02",
    name: "Macaxeira Frita",
    description:
      "Porção de macaxeira frita bem crocante salpicada com manteiga de garrafa",
    price: 22.0,
    category: "petiscos",
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80",
  },
  {
    id: "pet-03",
    name: "Queijo Coalho Grelhado",
    description:
      "Espetinhos de queijo coalho dourados na chapa com fio de mel de engenho legítimo",
    price: 24.0,
    category: "petiscos",
    image:
      "https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400&q=80",
  },
  {
    id: "pet-04",
    name: "Coxinha de Catupiry",
    description:
      "Coxinhas fritas na hora com recheio cremoso de frango desfiado e catupiry legítimo (6 unidades)",
    price: 28.0,
    category: "petiscos",
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80",
  },

  // ── REFEIÇÕES ──
  {
    id: "ref-01",
    name: "Picanha Inteira na Chapa",
    description:
      "Picanha fatiada grelhada (300g), acompanhada de batatas fritas douradas, farofa caseira e vinagrete",
    price: 79.9,
    category: "refeicoes",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
    badge: "Destaque",
  },
  {
    id: "ref-02",
    name: "Carne do Sol Acetrinada",
    description:
      "Autêntica carne do sol desfiada na manteiga de garrafa puxada na cebola roxa, acompanha fritas",
    price: 65.9,
    category: "refeicoes",
    image:
      "https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=400&q=80",
    badge: "Mais Pedido",
  },
  {
    id: "ref-03",
    name: "Baião de Dois Especial",
    description:
      "Arroz cozido no caldo de feijão verde, queijo coalho em cubos, linguiça defumada e bacon",
    price: 45.0,
    category: "refeicoes",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  },

  // ── SOBREMESAS ──
  {
    id: "sob-01",
    name: "Bolo de Rolo Pernambucano",
    description:
      "Fatia generosa do tradicional bolo de rolo artesanal com recheio denso de goiabada cascão",
    price: 16.0,
    category: "sobremesas",
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80",
    badge: "Novo",
  },
  {
    id: "sob-02",
    name: "Cartola Tradicional",
    description:
      "Banana prata frita na chapa, coberta com queijo coalho derretido, açúcar refinado e canela em pó",
    price: 22.0,
    category: "sobremesas",
    image:
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80",
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = loadSession();
    const savedName = loadSavedName();
    const nameToUse = saved.customerName || savedName;
    return {
      tableNumber: TABLE_NUMBER,
      customerName: "",
      isLoggedIn: false,
      cart: [],
      orders: [],
      screen: "login",
      activeCategory: "bebidas",
      cartBounce: false,
      ...saved,
      // Se há nome salvo, entra direto no menu independente do estado anterior
      ...(nameToUse && !saved.isLoggedIn ? {
        customerName: nameToUse,
        isLoggedIn: true,
        screen: "menu" as const,
      } : {}),
    };
  });

  useEffect(() => {
    saveSession(state);
  }, [state]);

  const login = useCallback((name: string) => {
    setState((s) => ({
      ...s,
      customerName: name,
      isLoggedIn: true,
      screen: "menu",
    }));
  }, []);

  const logout = useCallback(() => {
    // Limpa a sessão mas mantém o nome salvo para próxima visita
    localStorage.removeItem(STORAGE_KEY);
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

  const sendOrder = useCallback(() => {
    setState((s) => {
      const newOrders: OrderItem[] = s.cart.map((c) => ({
        id: `ord-${Date.now()}-${c.item.id}`,
        item: c.item,
        quantity: c.quantity,
        observation: c.observation,
        sentAt: new Date(),
        status: "preparando",
      }));
      return {
        ...s,
        orders: [...s.orders, ...newOrders],
        cart: [],
        screen: "receipt",
      };
    });
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
