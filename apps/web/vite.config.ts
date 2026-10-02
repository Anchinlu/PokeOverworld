import { defineConfig, type Plugin } from 'vite';
import path from 'node:path';
import fs from 'node:fs';

function serveGraphicsPlugin(): Plugin {
  return {
    name: 'serve-graphics',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url?.split('?')[0];
        if (rawUrl && rawUrl.startsWith('/Graphics/')) {
          const decoded = decodeURIComponent(rawUrl.slice(1));
          const filePath = path.resolve(__dirname, '../../', decoded);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mime =
              ext === '.png'
                ? 'image/png'
                : ext === '.ttf'
                  ? 'font/ttf'
                  : 'application/octet-stream';
            res.setHeader('Content-Type', mime);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [serveGraphicsPlugin()],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: ['../..'],
    },
  },
  build: {
    sourcemap: true,
  },
});
