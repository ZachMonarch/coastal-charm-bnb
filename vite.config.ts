import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// Production-ready Vite configuration with security and performance optimizations
// Note: vite-plugin-imagemin removed due to dependency conflicts (cache cleared)
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Production security headers for dev server
    headers: mode === 'production' ? {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdn.gpteng.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://yhegaaqxmuhszesbjtdo.supabase.co wss://yhegaaqxmuhszesbjtdo.supabase.co; frame-src 'self' https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
    } : {},
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // 🚨 SECURITY: Block service role key imports at build time
    {
      name: 'block-service-role-imports',
      enforce: 'pre' as const,
      resolveId(id: string, importer?: string) {
        // Only check TypeScript/JavaScript files (not CSS/images/fonts)
        const JS_PATTERNS = /\.(mjs|cjs|js|ts|jsx|tsx)$/i;
        if (!importer || !JS_PATTERNS.test(importer)) {
          return null; // Ignore non-code files
        }

        const GUARDED_PATHS = ['supabaseServer', '/lib/supabaseServer', '/integrations/supabase/supabaseServer'];
        if (GUARDED_PATHS.some(path => id.includes(path))) {
          throw new Error(
            '\n🚨 SECURITY VIOLATION: Attempted to import supabaseServer.ts which contains SUPABASE_SERVICE_ROLE_KEY!\n\n' +
            'This file must NEVER be imported in client-side code as it would expose the service role key\n' +
            'in browser bundles, bypassing ALL RLS policies and granting complete database access.\n\n' +
            'Solution: Use Edge Functions for admin operations instead.\n'
          );
        }
        return null;
      }
    },
    VitePWA({
      registerType: 'prompt', // Changed from 'autoUpdate' to prevent auto-injection of blocking registerSW.js
      injectRegister: false, // Manual registration to prevent render blocking
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/yhegaaqxmuhszesbjtdo\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Monarch Property Management',
        short_name: 'Monarch PM',
        description: 'Professional property management platform for real estate professionals',
        theme_color: '#1a1a1a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-512.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'], // Prevent duplicate React bundles
  },
  build: {
    // Production optimizations - target modern browsers only
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    minify: 'terser',
    // Disable modulePreload to prevent React loading race conditions
    modulePreload: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 3, // Increased compression passes for better reduction
        unsafe_arrows: true,
        unsafe_methods: true,
      },
      mangle: {
        safari10: true
      }
    },
    rollupOptions: {
      output: {
        // Manual chunking for optimal code splitting and caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'scheduler'],
          'vendor-router': ['react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-accordion',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
          ],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['@react-pdf/renderer'],
          'vendor-utils': ['lodash-es', 'date-fns', 'zod'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1500,
    // Enable source maps for Lighthouse best-practices and debugging
    // Note: This exposes source maps publicly - acceptable for this application
    sourcemap: true,
    reportCompressedSize: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'scheduler'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  // Environment variable validation
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  // CSP and security for static assets
  assetsInclude: ['**/*.webp', '**/*.png', '**/*.jpg', '**/*.svg'],
}));
