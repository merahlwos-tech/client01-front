import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Taille max d'un chunk avant avertissement (en Ko)
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Sépare les vendors lourds en chunks distincts
        // → le navigateur les met en cache indépendamment du code app
        manualChunks: {
          // React core — ne change quasiment jamais
          'vendor-react': ['react', 'react-dom'],
          // Router — change rarement
          'vendor-router': ['react-router-dom'],
          // UI libs
          'vendor-ui': ['lucide-react', 'react-hot-toast', 'axios'],
        },
      },
    },

    // Compression + source maps désactivés en prod (plus léger)
    sourcemap: false,
    minify: 'esbuild',  // Plus rapide que terser, résultat quasi identique

    // Optimise les assets CSS/JS
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline les assets < 4Ko en base64 (évite des requêtes HTTP)
  },
})