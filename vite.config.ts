import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

const BACKEND_ORIGIN = "http://185.233.44.234:8002";
const MCP_ORIGIN = "http://185.233.44.234:8080";
const Upload = 'http://185.233.44.234:8003'
const ANALYTICS_ORIGIN = 'http://185.233.44.234:8003'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
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
        target: Upload,
        changeOrigin: true,
      },
      '/inverters/upload': {
        target: Upload,
        changeOrigin: true,
      },
      '/solar_panels/upload': {
        target: Upload,
        changeOrigin: true,
      },
      '/batteries/analytics': {
        target: ANALYTICS_ORIGIN,
        changeOrigin: true,
      },
      '/inverters/analytics': {
        target: ANALYTICS_ORIGIN,
        changeOrigin: true,
      }, 
      '/solar_panels/analytics': {
        target: ANALYTICS_ORIGIN,
        changeOrigin: true,
      },
      // Деякі ендпоїнти використовують дефіси в шляху
      '/solar-panels/analytics': {
        target: ANALYTICS_ORIGIN,
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
      '/users': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/auth': {
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
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/extentions': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
      },
      '/analytics': {
        target: ANALYTICS_ORIGIN,
        changeOrigin: true,
      },
    },
  },
})
