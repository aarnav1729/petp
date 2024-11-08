// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://leaf.premierenergiesphotovoltaic.com',
        changeOrigin: true,
        secure: false, // Set to true if your backend has a valid SSL certificate
      },
    },
  },
});
