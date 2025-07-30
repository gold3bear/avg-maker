import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

// 创建简化的API代理插件
const apiProxyPlugin = () => {
  return {
    name: 'api-proxy',
    configureServer(server: any) {
      // 简单的CORS处理
      server.middlewares.use((req: any, res: any, next: any) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }
        
        next();
      });
    }
  };
};

export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    apiProxyPlugin()
  ],
  server: {
    cors: true,
    hmr: {
      port: 24678
    }
  }
});
