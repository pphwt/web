import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow all hosts so tools like ngrok can access the local dev server without being blocked
    allowedHosts: true,
  },
})
