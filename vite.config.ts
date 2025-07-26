import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwind()
  ],
  // 如果需要给 src 加别名，可以打开下面这段
  // resolve: {
  //   alias: {
  //     '@': new URL('./src', import.meta.url).pathname
  //   }
  // }
});
