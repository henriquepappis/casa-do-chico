export type NotifType = "new_order" | "mesa_opened" | "mesa_closed" | "mesa_transferred";

export interface Notification {
  id: number;
  type: NotifType;
  message: string;
  tableNumber?: number;
  timestamp: Date;
  read: boolean;
}

interface NotifState {
  notifications: Notification[];
  soundEnabled: boolean;
}

type Listener = (state: NotifState) => void;

const MAX = 50;
const SOUND_KEY = "admin-notif-sound";

let items: Notification[] = [];
let soundEnabled = localStorage.getItem(SOUND_KEY) !== "false";
let counter = 0;
let audioCtx: AudioContext | null = null;
const listeners = new Set<Listener>();

function emit() {
  const state: NotifState = { notifications: [...items], soundEnabled };
  listeners.forEach((fn) => fn(state));
}

function playDing() {
  if (!soundEnabled) return;
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    // Dois tons: mais grave → mais agudo
    for (const [freq, start, dur] of [
      [880, 0, 0.18],
      [1100, 0.15, 0.28],
    ] as [number, number, number][]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.28, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    }
  } catch {}
}

export const notifs = {
  add(type: NotifType, message: string, tableNumber?: number): Notification {
    const entry: Notification = {
      id: ++counter,
      type,
      message,
      tableNumber,
      timestamp: new Date(),
      read: false,
    };
    items = [entry, ...items].slice(0, MAX);
    emit();
    return entry;
  },

  markAllRead() {
    items = items.map((n) => ({ ...n, read: true }));
    emit();
  },

  markRead(id: number) {
    items = items.map((n) => (n.id === id ? { ...n, read: true } : n));
    emit();
  },

  toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, String(soundEnabled));
    emit();
  },

  playSound: playDing,

  subscribe(fn: Listener) {
    listeners.add(fn);
    fn({ notifications: [...items], soundEnabled });
    return () => { listeners.delete(fn); };
  },
};
