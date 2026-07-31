import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Enforces relative paths so Android WebView finds assets
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
