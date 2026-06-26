export type ToastType = "error" | "success" | "info";
export type ToastEntry = { id: number; message: string; type: ToastType };
type Listener = (toasts: ToastEntry[]) => void;

let toasts: ToastEntry[] = [];
let counter = 0;
const listeners = new Set<Listener>();

function notify() {
  const copy = [...toasts];
  listeners.forEach((fn) => fn(copy));
}

function add(message: string, type: ToastType) {
  const id = ++counter;
  toasts = [...toasts, { id, message, type }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 4500);
}

export const toast = {
  error: (msg: string) => add(msg, "error"),
  success: (msg: string) => add(msg, "success"),
  info: (msg: string) => add(msg, "info"),
  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
};
