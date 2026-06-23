import { createRequire } from "module";

const require = createRequire(import.meta.url);

interface PrinterLib {
  Printer: new (adapter: unknown, options?: unknown) => EscPosPrinter;
  Network: new (address: string, port?: number) => NetworkAdapter;
}

interface EscPosPrinter {
  open(cb: (err: Error | null) => void): void;
  align(a: "CT" | "LT" | "RT"): EscPosPrinter;
  style(s: "B" | "NORMAL" | "I" | "U"): EscPosPrinter;
  size(w: number, h: number): EscPosPrinter;
  text(t: string, enc?: string): EscPosPrinter;
  feed(n?: number): EscPosPrinter;
  drawLine(): EscPosPrinter;
  cut(): EscPosPrinter;
  close(cb?: () => void): void;
}

interface NetworkAdapter {
  open(cb: (err: Error | null) => void): void;
  close(cb?: () => void): void;
}

export interface PrintOrderData {
  tableNumber: number;
  customerName: string;
  orderId: string;
  createdAt: Date;
  items: {
    name: string;
    quantity: number;
    observation: string;
  }[];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function padLine(left: string, right: string, width = 32): string {
  const spaces = Math.max(1, width - left.length - right.length);
  return left + " ".repeat(spaces) + right;
}

async function printToDevice(data: PrintOrderData): Promise<void> {
  const escpos = require("escpos") as PrinterLib;
  const Network = require("escpos-network") as new (address: string, port?: number) => NetworkAdapter;

  const ip = process.env.PRINTER_IP!;
  const port = Number(process.env.PRINTER_PORT ?? 9100);

  return new Promise((resolve, reject) => {
    const device = new Network(ip, port);
    const printer = new escpos.Printer(device, { encoding: "CP860" });

    device.open((err) => {
      if (err) return reject(err);

      printer
        .align("CT")
        .style("B")
        .size(1, 1)
        .text("CASA DO CHICO")
        .size(0, 0)
        .text("Bar & Restaurante")
        .feed(1)
        .drawLine()
        .align("LT")
        .style("NORMAL")
        .text(`Mesa: ${String(data.tableNumber).padStart(2, "0")}`)
        .text(`Cliente: ${data.customerName}`)
        .text(`Hora: ${formatTime(data.createdAt)}`)
        .text(`Pedido: #${data.orderId.slice(-6).toUpperCase()}`)
        .drawLine()
        .style("B")
        .text("ITENS:")
        .style("NORMAL");

      for (const item of data.items) {
        printer.text(padLine(`${item.quantity}x ${item.name}`, ""));
        if (item.observation) {
          printer.text(`   OBS: ${item.observation}`);
        }
      }

      printer
        .drawLine()
        .feed(3)
        .cut()
        .close(resolve);
    });
  });
}

function logToConsole(data: PrintOrderData): void {
  const line = "=".repeat(32);
  console.log("\n" + line);
  console.log("       CASA DO CHICO");
  console.log("      Bar & Restaurante");
  console.log(line);
  console.log(`Mesa:    ${String(data.tableNumber).padStart(2, "0")}`);
  console.log(`Cliente: ${data.customerName}`);
  console.log(`Hora:    ${formatTime(data.createdAt)}`);
  console.log(`Pedido:  #${data.orderId.slice(-6).toUpperCase()}`);
  console.log(line);
  console.log("ITENS:");
  for (const item of data.items) {
    console.log(`  ${item.quantity}x ${item.name}`);
    if (item.observation) console.log(`     OBS: ${item.observation}`);
  }
  console.log(line + "\n");
}

export async function printOrder(data: PrintOrderData): Promise<void> {
  if (!process.env.PRINTER_IP) {
    logToConsole(data);
    return;
  }

  try {
    await printToDevice(data);
  } catch (err) {
    console.error("[printer] Falha ao imprimir:", err);
    console.warn("[printer] Exibindo pedido no console como fallback:");
    logToConsole(data);
  }
}
