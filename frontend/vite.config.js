import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern'
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Permite acceder a Vite dentro del contenedor Docker.
    watch: {
      usePolling: true
    }
  },
  preview: {
    host: true,
    port: 5173
  }
});
