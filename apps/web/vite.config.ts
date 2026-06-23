import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.jpeg", "favicon.svg"],
      manifest: {
        name: "Casa do Chico — Cardápio",
        short_name: "Casa do Chico",
        description: "Cardápio digital do Casa do Chico Bar & Restaurante",
        theme_color: "#C0392B",
        background_color: "#3D0C0C",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/logo.jpeg", sizes: "192x192", type: "image/jpeg" },
          { src: "/logo.jpeg", sizes: "512x512", type: "image/jpeg" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,jpeg,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === "/cardapio",
            handler: "NetworkFirst",
            options: { cacheName: "cardapio-cache", networkTimeoutSeconds: 5 },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
