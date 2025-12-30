import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
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
})
