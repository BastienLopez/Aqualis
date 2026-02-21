import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Ensure correct asset paths on GitHub Pages project site
  // When deployed at bastienlopez.github.io/Portfolio/, assets must be prefixed with /Portfolio/
  base: mode === "production" ? "/aquarium_apk/" : "/",
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
