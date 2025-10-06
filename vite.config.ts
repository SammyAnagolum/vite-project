import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  base: "/portal/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      // 👇 Only proxy API calls, not your SPA routes
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        // /api/...  ->  http://localhost:3001/portal/api/...
        rewrite: (path) => path.replace(/^\/api/, "/portal/api"),
      },
    },
  },
});
