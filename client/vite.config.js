import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Development: Forward /api/* to the Python backend (http://localhost:8080)
      // and rewrite to /v1 (Python API uses /v1/assistant)
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1'),
        ws: true // Support WebSocket if needed in future
      }
    }
  },
  define: {
    // Make environment variables available to client code
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '')
  }
});

