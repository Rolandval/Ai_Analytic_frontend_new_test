import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const BACKEND_ORIGIN = env.VITE_BACKEND_URL || "http://185.233.44.234:8002";
  const MCP_ORIGIN = env.VITE_MCP_URL || "http://185.233.44.234:8080";
  const UPLOAD_ORIGIN = env.VITE_UPLOAD_URL || "http://185.233.44.234:8003";
  const ANALYTICS_ORIGIN = env.VITE_ANALYTICS_URL || "http://185.233.44.234:8003";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['chart.js', 'react-chartjs-2', 'recharts'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-popover', '@radix-ui/react-tabs', '@radix-ui/react-toast'],
            query: ['@tanstack/react-query'],
            dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          },
        },
      },
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
    },
    server: {
      cors: true,
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      proxy: {
        '/batteries/backend': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/inverters/backend': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/solar_panels/backend': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/batteries/upload': { target: UPLOAD_ORIGIN, changeOrigin: true },
        '/inverters/upload': { target: UPLOAD_ORIGIN, changeOrigin: true },
        '/solar_panels/upload': { target: UPLOAD_ORIGIN, changeOrigin: true },
        '/batteries/analytics': { target: ANALYTICS_ORIGIN, changeOrigin: true },
        '/inverters/analytics': { target: ANALYTICS_ORIGIN, changeOrigin: true },
        '/solar_panels/analytics': { target: ANALYTICS_ORIGIN, changeOrigin: true },
        '/solar-panels/analytics': { target: ANALYTICS_ORIGIN, changeOrigin: true },
        '/batteries/exports': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/inverters/exports': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/solar_panels/exports': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/tasks': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/chat': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/reports': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/users': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/auth': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/ads_manager': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/characters': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/health': { target: MCP_ORIGIN, changeOrigin: true },
        '/content': {
          target: BACKEND_ORIGIN,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('[proxy /content] error:', err.message);
            });
          },
        },
        '/extentions': { target: BACKEND_ORIGIN, changeOrigin: true },
        '/analytics': { target: ANALYTICS_ORIGIN, changeOrigin: true },
        '/photo': {
          target: BACKEND_ORIGIN,
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            if (req.url?.startsWith('/photo-ai-seo') || !req.url?.startsWith('/photo/')) {
              return req.url;
            }
          },
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('[proxy /photo] error:', err.message);
            });
          },
        },
        '/stats': {
          target: BACKEND_ORIGIN,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('[proxy /stats] error:', err.message);
            });
          },
        },
      },
    },
  }
})
