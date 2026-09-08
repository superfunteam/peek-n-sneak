import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  root: root + 'netlify/client',
  publicDir: root + 'public',
  resolve: { alias: { '@': root } },
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  build: { outDir: root + 'dist-netlify', emptyOutDir: true },
});
