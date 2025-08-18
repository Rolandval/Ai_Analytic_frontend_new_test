import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

const BACKEND_ORIGIN = "http://localhost:8002";
const MCP_ORIGIN = "http://localhost:8080";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/batteries/backend': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/inverters/backend': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/solar_panels/backend': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/batteries/upload': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/inverters/upload': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/solar_panels/upload': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/batteries/analytics': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/inverters/analytics': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/solar_panels/analytics': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/batteries/exports': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/inverters/exports': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/solar_panels/exports': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/tasks': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/chat': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/reports': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/ads_manager': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/characters': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/health': {
        target: MCP_ORIGIN,
        changeOrigin: true,
      },
      '/content': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/extentions': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/analytics': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
    },
  },
})
