import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The app lives in app/ and imports the invoice engine from src/ directly.
// Vite resolves the engine's ".js" import specifiers to the ".ts" sources
// (the same resolution Vitest uses), so nothing in src/ needs to change.
export default defineConfig({
  root: "app",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
