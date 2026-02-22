import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
  build: {
    // Target modern WebView (Android 5+, Chrome 90+)
    target: ["es2020", "chrome90", "safari14"],
    // Use esbuild for fast, efficient minification
    minify: "esbuild",
    cssMinify: true,
    // Raise warning threshold — 621kB is expected for a rich app
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Manual chunks: isolate heavy deps so they're cached independently
        manualChunks: {
          // React core — rarely changes, cached forever
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Framer Motion — single largest dep
          "vendor-motion": ["framer-motion"],
          // Radix UI components — large but stable
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-popover",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-accordion",
          ],
          // Data / form utilities
          "vendor-utils": [
            "@tanstack/react-query",
            "react-hook-form",
            "@hookform/resolvers",
            "zod",
            "clsx",
            "tailwind-merge",
          ],
        },
        // Content-hash filenames for long-term caching
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Enable source maps only in dev
    sourcemap: mode !== "production",
  },
  esbuild: {
    // Remove console.log in production build
    drop: mode === "production" ? ["console", "debugger"] : [],
    // Keep class names for debugging
    keepNames: false,
    // Fast tree-shaking
    treeShaking: true,
  },
}));
