import react from "@vitejs/plugin-react";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  optimizeDeps: {
    include: ["@supabase/supabase-js"],
    exclude: ["@vision-gate/supabase"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@vision-gate/supabase": path.resolve(__dirname, "../../packages/supabase"),
      "@vision-gate/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
}));
