import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  server: {
    host: true, // Expose on local network (0.0.0.0)
  },
});
