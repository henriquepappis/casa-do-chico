// Categorias do cardápio
export type Category = "bebidas" | "petiscos" | "refeicoes" | "sobremesas";

// Item do cardápio
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  badge?: string;
}

// Item no carrinho
export interface CartItem {
  item: MenuItem;
  quantity: number;
  observation: string;
}

// Status de um pedido
export type OrderStatus = "preparando" | "pronto" | "entregue";

// Item de pedido enviado
export interface OrderItem {
  id: string;
  item: MenuItem;
  quantity: number;
  observation: string;
  sentAt: Date;
  status: OrderStatus;
}

// Mesa
export type TableStatus = "livre" | "ocupada";

export interface Table {
  id: number;
  number: number;
  status: TableStatus;
}

// Sessão de uma mesa (agrupa pedidos de múltiplos clientes)
export interface TableSession {
  id: string;
  tableId: number;
  openedAt: Date;
  closedAt?: Date;
  orders: OrderItem[];
  total: number;
}

// Payload para criar um pedido (frontend → backend)
export interface CreateOrderPayload {
  tableNumber: number;
  customerName: string;
  items: {
    menuItemId: string;
    quantity: number;
    observation: string;
  }[];
}

// Resposta do backend ao criar pedido
export interface CreateOrderResponse {
  orderId: string;
  status: OrderStatus;
  estimatedMinutes?: number;
}
