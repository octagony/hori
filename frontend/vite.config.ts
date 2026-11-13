import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL('./index.html', import.meta.url)),
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const names = assetInfo.names ?? [];
          const isCss = names.some((n) => n.endsWith('.css'));
          return isCss ? 'css/[name]-[hash][extname]' : 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  server: {
    port: 3001,
    strictPort: true,
  },
});