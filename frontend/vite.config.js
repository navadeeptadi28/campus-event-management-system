import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxy = {
  '/api': {
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
    secure: false,
  },
  '/uploads': {
    target: 'http://127.0.0.1:5000',
    changeOrigin: true,
    secure: false,
  },
};

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, allowedHosts: true, proxy },
  preview: { host: true, port: 5173, allowedHosts: true, proxy },
});