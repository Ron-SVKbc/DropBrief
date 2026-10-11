import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import sendReminderHandler from './api/send-reminder.js';
import verifyPinHandler from './api/verify-pin.js';

export default defineConfig(({ mode }) => {
  // Načítanie .env premenných pre lokálny dev server
  const env = loadEnv(mode, process.cwd(), '');

  // Serverové API premenné (Resend + Supabase service role)
  if (env.RESEND_API_KEY)          process.env.RESEND_API_KEY          = env.RESEND_API_KEY;
  if (env.RESEND_FROM)             process.env.RESEND_FROM             = env.RESEND_FROM;
  if (env.RESEND_FROM_EMAIL)       process.env.RESEND_FROM_EMAIL       = env.RESEND_FROM_EMAIL;
  if (env.SUPABASE_SERVICE_ROLE_KEY) process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  // VITE_ premenné sú v process.env dostupné len pre klientský kód;
  // pre verify-pin.js (server) ich explicitne skopírujeme:
  if (env.VITE_SUPABASE_URL)      process.env.VITE_SUPABASE_URL      = env.VITE_SUPABASE_URL;
  if (env.VITE_SUPABASE_ANON_KEY) process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

  return {
    plugins: [
      react(),
      {
        name: 'dev-api-handlers',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            // ── Spoločný body parser ───────────────────────────────────────
            const parseBody = () =>
              new Promise((resolve) => {
                let raw = '';
                req.on('data', (chunk) => { raw += chunk; });
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

            // ── Route matching ─────────────────────────────────────────────
            if (req.method === 'POST' && req.url === '/api/send-reminder') {
              return runHandler(sendReminderHandler);
            }

            if (req.method === 'POST' && req.url === '/api/verify-pin') {
              return runHandler(verifyPinHandler);
            }

            next();
          });
        },
      },
    ],
    server: {
      port: 3000,
      open: false,
    },
  };
});
