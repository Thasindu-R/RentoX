import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server runs on 5173, which is the origin allowed by CorsConfig.java
// on the backend. Change both together if you move it.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
