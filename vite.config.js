import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  // Načítanie .env premenných pre lokálny dev server
  const env = loadEnv(mode, process.cwd(), '');

  // Serverové API premenné (Resend + Supabase service role)
  if (env.RESEND_API_KEY)          process.env.RESEND_API_KEY          = env.RESEND_API_KEY;
  if (env.RESEND_FROM)             process.env.RESEND_FROM             = env.RESEND_FROM;
  if (env.RESEND_FROM_EMAIL)       process.env.RESEND_FROM_EMAIL       = env.RESEND_FROM_EMAIL;
  if (env.SUPABASE_SERVICE_ROLE_KEY) process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  // VITE_ premenné sú v process.env dostupné len pre klientský kód;
  // pre verify-pin.js a cron-purge.js (server) ich explicitne skopírujeme:
  if (env.VITE_SUPABASE_URL)      process.env.VITE_SUPABASE_URL      = env.VITE_SUPABASE_URL;
  if (env.VITE_SUPABASE_ANON_KEY) process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

  const plugins = [react()];

  // Dev API middleware iba počas lokálneho vývoja (command === 'serve').
  // Použitie dynamického importu zabezpečí, že serverový kód (api/*.js) sa nikdy neimportuje na top-leveli
  // a neovplyvňuje produkčný build ani klientsky bundle.
  if (command === 'serve') {
    plugins.push({
      name: 'dev-api-handlers',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // ── Spoločný body parser (s limitom veľkosti 2 MB) ─────────────
          const parseBody = () =>
            new Promise((resolve) => {
              if (req.method === 'GET' || req.method === 'HEAD') {
                return resolve({});
              }
              let raw = '';
              const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024; // 2 MB bezpečnostný limit
              req.on('data', (chunk) => {
                raw += chunk;
                if (raw.length > MAX_PAYLOAD_BYTES) {
                  req.destroy();
                  resolve({});
                }
              });
              req.on('end', () => {
                try { resolve(raw ? JSON.parse(raw) : {}); }
                catch { resolve({}); }
              });
            });

          // ── Adapter: Vercel-style res objekt → Node http.ServerResponse ─
          const makeRes = () => ({
            status(code) { res.statusCode = code; return this; },
            json(data) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return this;
            },
          });

          const runHandler = async (handlerFn) => {
            req.body = await parseBody();
            try {
              await handlerFn(req, makeRes());
            } catch (err) {
              console.error(`[dev-api] Handler error (${req.url}):`, err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          };

          // ── Route matching s dynamickým načítaním handlerov ──────────────
          const pathname = req.url ? req.url.split('?')[0].replace(/\/+$/, '') : '';

          if (req.method === 'POST' && pathname === '/api/send-reminder') {
            const { default: sendReminderHandler } = await import('./api/send-reminder.js');
            return runHandler(sendReminderHandler);
          }

          if (req.method === 'POST' && pathname === '/api/verify-pin') {
            const { default: verifyPinHandler } = await import('./api/verify-pin.js');
            return runHandler(verifyPinHandler);
          }

          if (req.method === 'POST' && pathname === '/api/send-auth-pin') {
            const { default: sendAuthPinHandler } = await import('./api/send-auth-pin.js');
            return runHandler(sendAuthPinHandler);
          }

          if (req.method === 'POST' && pathname === '/api/verify-registration') {
            const { default: verifyRegistrationHandler } = await import('./api/verify-registration.js');
            return runHandler(verifyRegistrationHandler);
          }

          if (req.method === 'POST' && pathname === '/api/reset-pin') {
            const { default: resetPinHandler } = await import('./api/reset-pin.js');
            return runHandler(resetPinHandler);
          }

          if (pathname.startsWith('/api/cron-purge')) {
            const { default: cronPurgeHandler } = await import('./api/cron-purge.js');
            return runHandler(cronPurgeHandler);
          }

          next();
        });
      },
    });
  }

  return {
    plugins,
    server: {
      port: 3000,
      open: false,
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('jszip')) return 'vendor-jszip';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('canvas-confetti')) return 'vendor-confetti';
            }
          },
        },
      },
    },
  };
});
