import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "icons/favicon-16x16.png",
        "icons/favicon-32x32.png",
        "icons/pwa-192x192.png",
        "icons/pwa-512x512.png",
        "icons/pwa-192x192-maskable.png",
        "icons/pwa-512x512-maskable.png",
        "icons/apple-touch-icon.png",
        "images/logo/*.svg",
        "images/logo/*.png",
        "images/logo/*.webp",
        "images/logo/*.ico",
      ],
      manifest: {
        id: "/",
        name: "Komari-Theme-LuminaPlus-19y",
        short_name: "LuminaPlus",
        description: "Komari monitor theme with offline shell support.",
        lang: "zh-CN",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#0b0c10",
        theme_color: "#0b0c10",
        icons: [
          // Install UI: PNG only (no favicon.ico — some clients mis-parse ICO as solid blob).
          {
            src: "/icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/pwa-192x192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/pwa-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        // 国旗 SVG 数量大，不进 precache；走下方 runtime image 缓存。
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2,webmanifest}"],
        globIgnores: ["**/assets/flags/**"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
          },
          {
            urlPattern: ({ request }) =>
              request.destination === "style" ||
              request.destination === "script" ||
              request.destination === "worker" ||
              request.destination === "font" ||
              request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-runtime",
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
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
