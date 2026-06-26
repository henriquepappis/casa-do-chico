import { useState, useEffect } from "react";

function formatElapsed(isoDate: string): string {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return "< 1min";
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function ElapsedTime({ isoDate }: { isoDate: string }) {
  const [text, setText] = useState(() => formatElapsed(isoDate));

  useEffect(() => {
    setText(formatElapsed(isoDate));
    const id = setInterval(() => setText(formatElapsed(isoDate)), 30_000);
    return () => clearInterval(id);
  }, [isoDate]);

  return <>{text}</>;
}
