import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

/**
 * In-memory rate limiter (per warm Vercel Function instance).
 *
 * NOTE: Vercel serverless functions are stateless – each cold start clears this
 * Map. For production-grade rate limiting consider Upstash Redis.  For an MVP
 * protecting a 6-digit PIN this is a significant improvement over localStorage-only.
 */
const loginAttempts = new Map();
const WINDOW_MS = 60 * 1_000; // 60 sekúnd
const MAX_ATTEMPTS = 5;

function rateLimitKey(ip, nick) {
  return `${ip}___${(nick || '').toLowerCase()}`;
}

function checkRateLimit(key) {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now - record.since > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, since: now });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const waitSec = Math.ceil((WINDOW_MS - (now - record.since)) / 1000);
    return { allowed: false, waitSec };
  }

  record.count += 1;
  return { allowed: true };
}

function clearRateLimit(key) {
  loginAttempts.delete(key);
}

/**
 * SHA-256 hashing (Node.js crypto – nepotrebujeme Web Crypto na serveri)
 */
function hashPin(pin, useSalt = true) {
  const raw = useSalt
    ? String(pin).trim() + '_dropbrief_salt_2026'
    : String(pin).trim();
  return createHash('sha256').update(raw).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  // ── Získanie IP adresy klienta ─────────────────────────────────────────────
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip']?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  // ── Body parsing ───────────────────────────────────────────────────────────
  let bodyData = req.body || {};
  if (typeof bodyData === 'string') {
    try { bodyData = JSON.parse(bodyData); } catch { bodyData = {}; }
  }

  const { nick, pin } = bodyData;

  if (!nick || typeof nick !== 'string' || !pin || typeof pin !== 'string') {
    return res.status(400).json({ success: false, error: 'Chýba nick alebo PIN.' });
  }

  const cleanNick = nick.trim().toLowerCase();
  const cleanPin  = pin.trim();

  if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
    return res.status(400).json({ success: false, error: 'PIN musí mať 6 číslic.' });
  }

  // ── Server-side rate limiting (podľa IP + nick) ────────────────────────────
  const rlKey    = rateLimitKey(ip, cleanNick);
  const rlResult = checkRateLimit(rlKey);

  if (!rlResult.allowed) {
    return res.status(429).json({
      success:     false,
      rateLimited: true,
      error:       `Príliš veľa neúspešných pokusov. Skúste znovu o ${rlResult.waitSec} sekúnd.`,
    });
  }

  // ── Pripojenie na Supabase (service-role key obchádza RLS pre čítanie hash) ─
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('verify-pin: Missing Supabase env vars.');
    return res.status(500).json({ success: false, error: 'Server nie je nakonfigurovaný.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: user, error } = await supabase
      .from('freelancers')
      .select('id, nick, email, created_at, pin_code')
      .ilike('nick', cleanNick)
      .maybeSingle();

    if (error) {
      console.error('verify-pin: DB error:', error.message);
      return res.status(500).json({ success: false, error: 'Chyba databázy.' });
    }

    if (!user) {
      // Nerozlišujeme "nesprávny nick" od "nesprávny PIN" – security best practice
      return res.status(401).json({
        success: false,
        error:   'Nesprávny nickname alebo PIN kód.',
      });
    }

    // ── Overenie PIN-u (salted + fallback unsalted pre staré záznamy) ──────────
    const saltedHash   = hashPin(cleanPin, true);
    const unsaltedHash = hashPin(cleanPin, false);
    const isValid = user.pin_code === saltedHash || user.pin_code === unsaltedHash;

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error:   'Nesprávny nickname alebo PIN kód.',
      });
    }

    // ── Úspech: vymazať rate-limit záznam pre túto IP+nick kombináciu ─────────
    clearRateLimit(rlKey);

    return res.status(200).json({
      success: true,
      user: {
        id:        user.id,
        nick:      user.nick,
        email:     user.email || '',
        createdAt: user.created_at,
        // pinHash je poslaný späť iba pre lokálnu cache (offline login) –
        // přenáša sa cez HTTPS a ukladá iba v localStorage, nikdy v plain texte
        pinHash:   user.pin_code,
      },
    });

  } catch (err) {
    console.error('verify-pin: Unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Interná chyba servera.' });
  }
}
