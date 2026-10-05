import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración mínima de Vite: proxy /api hacia el backend Express local,
// según docs/architecture.md §4 (comunicación por proxy en desarrollo).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
