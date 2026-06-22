import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), // Ativa o compilador do Tailwind v4 no Vite
  tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      // Define que qualquer import começando com @/ vai apontar para a pasta src/
      "@": path.resolve(__dirname, "./src"),
    },
  },
});