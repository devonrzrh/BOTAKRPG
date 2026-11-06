import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const headers = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};
export default defineConfig({
  plugins: [react()],
  server: { headers },
  preview: { headers },
  build: { chunkSizeWarningLimit: 1800 },
  test: {
    environment: "node",
    exclude: ["node_modules/**", "References/**", "dist/**"],
  },
} as Parameters<typeof defineConfig>[0]);
