import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: 'src/threeApp/worker/RenderWorker.ts',
      output: {
        dir: 'dist',
        entryFileNames: 'worker.js',
      },
    },
  },
});
