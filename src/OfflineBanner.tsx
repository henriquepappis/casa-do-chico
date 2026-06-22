import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 flex items-center gap-2.5 px-4 py-3"
      style={{
        background: "#3D0C0C",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <WifiOff size={16} className="text-red-400 flex-shrink-0" />
      <p
        className="text-white text-sm font-medium"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        Sem conexão — suas alterações serão mantidas.
      </p>
    </div>
  );
}
