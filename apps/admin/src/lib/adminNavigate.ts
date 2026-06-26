type Handler = (screen: "mesa" | "mesas", mesaNumber?: number) => void;
let handler: Handler | null = null;

export const adminNavigate = {
  setHandler: (fn: Handler) => {
    handler = fn;
  },
  toMesa: (number: number) => handler?.("mesa", number),
  toMesas: () => handler?.("mesas"),
};
