import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
    force: false,
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, "/");
          if (!normalized.includes("/node_modules/")) return;

          if (
            /\/node_modules\/(?:react|react-dom|react-router|react-router-dom)\//.test(
              normalized,
            )
          ) {
            return "react";
          }
          if (normalized.includes("/node_modules/@tanstack/react-query/")) {
            return "query";
          }
          if (/\/node_modules\/(?:uplot|uplot-react)\//.test(normalized)) {
            return "charts";
          }
          if (normalized.includes("/node_modules/zod/")) {
            return "validation";
          }
          // Additional splits for app code
          if (normalized.includes("/src/pages/")) {
            return "pages";
          }
          if (normalized.includes("/src/components/")) {
            return "components";
          }
          if (normalized.includes("/src/hooks/")) {
            return "hooks";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
