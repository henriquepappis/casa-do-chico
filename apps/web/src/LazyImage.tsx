import { useState } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function LazyImage({ src, alt, className = "" }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const noImage = !src || error;

  return (
    <div className="relative w-full h-full">
      {!loaded && !noImage && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ background: "linear-gradient(90deg, #e8ddd0 25%, #f0e8dd 50%, #e8ddd0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }}
        />
      )}
      {(error || !src) && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "#f0e8dd" }}
        >
          <img src="/logo.jpeg" alt="Casa do Chico" className="w-3/5 h-3/5 object-contain opacity-30" />
        </div>
      )}
      {!noImage && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true); }}
          loading="lazy"
        />
      )}
    </div>
  );
}
