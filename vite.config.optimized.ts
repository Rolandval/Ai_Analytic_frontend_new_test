import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Оптимізація bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks для кращого кешування
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast'
          ],
          'chart-vendor': ['chart.js', 'react-chartjs-2', 'recharts'],
          'form-vendor': ['react-select', 'react-date-range'],
          'utils-vendor': ['axios', 'date-fns', 'clsx', 'class-variance-authority'],
          // Lazy-loaded chunks
          'suppliers': [
            './src/pages/inverters/Suppliers',
            './src/pages/solar-panels/Suppliers',
            './src/pages/batteries/Suppliers'
          ],
          'price-comparison': [
            './src/pages/prices/inverters/PriceComparison',
            './src/pages/prices/solar-panels/PriceComparison',
            './src/pages/prices/batteries/PriceComparison'
          ]
        },
        // Оптимізація імен файлів для кешування
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `img/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext || '')) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      },
      // Tree shaking оптимізації
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },
    // Мінімізація
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    // Розмір chunk warning
    chunkSizeWarningLimit: 1000,
    // Source maps тільки для dev
    sourcemap: false
  },
  // Оптимізація dev server
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'axios',
      'lucide-react'
    ],
    exclude: [
      // Виключаємо важкі бібліотеки з pre-bundling
      'framer-motion',
      'react-select',
      'recharts'
    ]
  },
  // Compression
  server: {
    compress: true
  }
})
