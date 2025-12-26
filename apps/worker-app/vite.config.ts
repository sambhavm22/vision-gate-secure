import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@vision-gate/supabase"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@vision-gate/supabase": path.resolve(__dirname, "../../packages/supabase"),
    },
  },
})
