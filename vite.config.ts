import { defineConfig } from 'vite';

// Relative base: the same build works at /specroots/ on GitHub Pages and at / locally.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
});
