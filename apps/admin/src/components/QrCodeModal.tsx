import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const WEB_URL = import.meta.env.VITE_WEB_URL ?? "http://localhost:5173";

interface Props {
  mesaNumber: number;
  onClose: () => void;
}

export default function QrCodeModal({ mesaNumber, onClose }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const url = `${WEB_URL}/?mesa=${mesaNumber}`;
  const mesaLabel = String(mesaNumber).padStart(2, "0");

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    // Cria um canvas maior com margem e rótulo
    const padding = 32;
    const labelH = 48;
    const out = document.createElement("canvas");
    out.width = canvas.width + padding * 2;
    out.height = canvas.height + padding * 2 + labelH;

    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, padding, padding);

    ctx.fillStyle = "#3D0C0C";
    ctx.font = `bold ${Math.round(canvas.width * 0.07)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`Mesa ${mesaLabel} — Casa do Chico`, out.width / 2, canvas.height + padding + labelH * 0.7);

    const link = document.createElement("a");
    link.download = `qrcode-mesa-${mesaLabel}.png`;
    link.href = out.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">QR Code — Mesa {mesaLabel}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 break-all">{url}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* QR Code */}
        <div
          ref={canvasRef}
          className="bg-white p-4 rounded-xl shadow-inner"
        >
          <QRCodeCanvas
            value={url}
            size={220}
            bgColor="#ffffff"
            fgColor="#3D0C0C"
            level="M"
            marginSize={1}
          />
        </div>

        {/* Instruções */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Aponte a câmera do celular para o QR code para acessar o cardápio desta mesa diretamente.
        </p>

        {/* Botão download */}
        <Button className="w-full" onClick={handleDownload}>
          <Download size={15} className="mr-2" />
          Baixar PNG
        </Button>
      </div>
    </div>
  );
}
