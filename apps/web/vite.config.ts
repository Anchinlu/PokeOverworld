import { defineConfig, type Plugin } from 'vite';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function serveGraphicsPlugin(): Plugin {
  return {
    name: 'serve-graphics',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url?.split('?')[0];
        // Serve Graphics files
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
        // Serve Audio files
        if (rawUrl && rawUrl.startsWith('/Audio/')) {
          const decoded = decodeURIComponent(rawUrl.slice(1));
          const filePath = path.resolve(__dirname, '../../', decoded);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const stat = fs.statSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const mime =
              ext === '.ogg'
                ? 'audio/ogg'
                : ext === '.wav'
                  ? 'audio/wav'
                  : ext === '.mp3'
                    ? 'audio/mpeg'
                    : 'application/octet-stream';
            res.setHeader('Content-Type', mime);
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Accept-Ranges', 'bytes');
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

function emitLegacyGraphicsPlugin(): Plugin {
  const directories = [
    'Fonts',
    'Icons',
    'Pokedex',
    'Battle',
    'Battle animations',
    'Items',
    'Move',
    'Party',
    'Bag',
    'Storage',
    'Intro',
  ];

  return {
    name: 'emit-legacy-graphics',
    apply: 'build',
    resolveId(source) {
      if (!source.startsWith('/Graphics/')) return null;

      const relativePath = decodeURIComponent(source.split('?')[0].slice(1));
      const absolutePath = path.resolve(__dirname, '../../', relativePath);
      return fs.existsSync(absolutePath) ? absolutePath : null;
    },
    buildStart() {
      const projectRoot = path.resolve(__dirname, '../../');
      const publicRoot = path.resolve(__dirname, 'public');
      const cssAssets = [
        'Graphics/Fonts/power green narrow.ttf',
        'Graphics/Fonts/power red and blue.ttf',
        'Graphics/Fonts/power clear.ttf',
        'Graphics/Fonts/vt323.ttf',
        'Graphics/Fonts/Tiny5-Regular.ttf',
        'Graphics/Pokedex/bg_list.png',
        'Graphics/Pokedex/bg_search_bar.png',
        'Graphics/Pokedex/icon_search_ball.png',
        'Graphics/Pokedex/tab_pokemon.png',
        'Graphics/Pokedex/tab_moves.png',
        'Graphics/Pokedex/tab_items.png',
        'Graphics/Pokedex/cursor_tab.png',
        'Graphics/Pokedex/cursor_list.png',
        'Graphics/Pokedex/cursor_list_row.png',
        'Graphics/Pokedex/icon_slider.png',
        'Graphics/Pokedex/bg_info.png',
        'Graphics/Pokedex/overlay_info.png',
        'Graphics/Move/status move/category.png',
        'Graphics/Storage/bg.png',
        'Graphics/Storage/boxgrab.PNG',
        'Graphics/Storage/boxfist.PNG',
        'Graphics/Pokemon/Icons type/types_ico.png',
      ];

      for (const relativePath of cssAssets) {
        const source = path.resolve(projectRoot, relativePath);
        if (!fs.existsSync(source)) continue;
        const target = path.resolve(publicRoot, relativePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
      }
    },
    generateBundle() {
      const projectRoot = path.resolve(__dirname, '../../');
      const files = new Set<string>();

      for (const directory of directories) {
        const root = path.resolve(projectRoot, 'Graphics', directory);
        if (!fs.existsSync(root)) continue;

        const visit = (current: string): void => {
          for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const absolutePath = path.join(current, entry.name);
            if (entry.isDirectory()) {
              visit(absolutePath);
              continue;
            }

            files.add(path.relative(projectRoot, absolutePath));
          }
        };

        visit(root);
      }

      const databasePath = path.resolve(projectRoot, 'packages/game-data/pokemon-db.json');
      const database = JSON.parse(fs.readFileSync(databasePath, 'utf8')) as {
        pokemon: Record<string, { sprites: Record<string, string> }>;
      };
      for (const pokemon of Object.values(database.pokemon)) {
        for (const spritePath of Object.values(pokemon.sprites)) {
          if (spritePath.startsWith('Graphics/')) files.add(spritePath);
          // Add cry audio files
          if (spritePath.startsWith('Audio/')) files.add(spritePath);
        }
      }

      // Add battle music, SE, and Misic backgound files
      for (const audioSub of ['Battle', 'SE', 'Misic backgound']) {
        const audioDir = path.resolve(projectRoot, 'Audio', audioSub);
        if (fs.existsSync(audioDir)) {
          for (const entry of fs.readdirSync(audioDir, { withFileTypes: true })) {
            if (entry.isFile()) {
              files.add(`Audio/${audioSub}/${entry.name}`);
            }
          }
        }
      }

      files.add('Graphics/Pokemon/Icons type/types.png');
      files.add('Graphics/Pokemon/shiny.png');

      for (const relativePath of files) {
        const absolutePath = path.resolve(projectRoot, relativePath);
        if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) continue;
        this.emitFile({
          type: 'asset',
          fileName: relativePath.split(path.sep).join('/'),
          source: fs.readFileSync(absolutePath),
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [serveGraphicsPlugin(), emitLegacyGraphicsPlugin()],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: ['../..'],
    },
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (
            normalized.includes('pokemon-db.json') ||
            normalized.includes('/data/pokemon-catalog') ||
            normalized.includes('/data/index')
          ) {
            return 'pokemon-data';
          }
          if (normalized.includes('moves-db.json') || normalized.includes('/battle/moves-db')) {
            return 'moves-data';
          }
          if (normalized.includes('items-db.json') || normalized.includes('/data/items-db')) {
            return 'items-data';
          }
          if (normalized.includes('/src/assets/')) {
            return 'game-assets';
          }
          if (
            normalized.includes('/src/battle/') ||
            normalized.includes('party-screen') ||
            normalized.includes('bag-screen')
          ) {
            return 'gameplay-ui';
          }
          if (normalized.includes('/pokedex')) {
            return 'pokedex';
          }
        },
      },
    },
  },
});
