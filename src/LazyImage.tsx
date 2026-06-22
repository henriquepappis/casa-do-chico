import { useState } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function LazyImage({ src, alt, className = "" }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-full">
      {!loaded && !error && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ background: "linear-gradient(90deg, #e8ddd0 25%, #f0e8dd 50%, #e8ddd0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }}
        />
      )}
      {error && (
        <div
          className="absolute inset-0 flex items-center justify-center text-2xl"
          style={{ background: "#f0e8dd" }}
        >
          🍽️
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); }}
        loading="lazy"
      />
    </div>
  );
}
