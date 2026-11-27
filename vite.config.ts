import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        // Split the ~1MB bundle into cacheable vendor chunks:
        // react core, router/query, radix UI kit, heavy libs
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router") || id.includes("@tanstack") || id.includes("vaul")) return "vendor-app";
          if (id.includes("@radix-ui") || id.includes("cmdk")) return "vendor-ui";
          if (id.includes("recharts") || id.includes("d3-") || id.includes("framer-motion")) return "vendor-charts";
          if (id.includes("react") || id.includes("scheduler")) return "vendor-react";
        },
      },
    },
  },
}));
