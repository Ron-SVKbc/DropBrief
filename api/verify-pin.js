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
const WINDOW_MS = 60 * 1_000; // 60 seconds
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

  // ── Get client IP address ─────────────────────────────────────────────
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

  const rawIdentifier = bodyData.identifier || bodyData.nick || bodyData.email;
  const { pin } = bodyData;

  if (!rawIdentifier || typeof rawIdentifier !== 'string' || !pin || typeof pin !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing username (or email) and PIN.' });
  }

  const cleanNick = rawIdentifier.trim().toLowerCase();
  const cleanPin  = pin.trim();

  if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
    return res.status(400).json({ success: false, error: 'PIN must have 6 digits.' });
  }

  // ── Server-side rate limiting (by IP + nick) ────────────────────────────
  const rlKey    = rateLimitKey(ip, cleanNick);
  const rlResult = checkRateLimit(rlKey);

  if (!rlResult.allowed) {
    return res.status(429).json({
      success:     false,
      rateLimited: true,
      error:       `Too many failed attempts. Please try again in ${rlResult.waitSec} seconds.`,
    });
  }

  // ── Connect to Supabase (service-role key bypasses RLS for reading hash) ─
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('verify-pin: Missing Supabase env vars.');
    return res.status(500).json({ success: false, error: 'Server is not configured.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const saltedHash   = hashPin(cleanPin, true);
    const unsaltedHash = hashPin(cleanPin, false);

    let user = null;
    let isValid = false;

    const withTimeout = (promise, ms = 6000) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase database operation timed out (6s)')), ms)
        ),
      ]);

    // 1. Primarily try direct SELECT (when service-role key is available)
    try {
      const { data: dbUser, error } = await withTimeout(
        supabase
          .from('freelancers')
          .select('id, nick, email, created_at, pin_code')
          .or(`nick.ilike.${cleanNick},email.ilike.${cleanNick}`)
          .maybeSingle()
      );

      if (!error && dbUser) {
        user = dbUser;
        isValid = user.pin_code === saltedHash || user.pin_code === unsaltedHash;
      }
    } catch (selectErr) {
      // Ignore RLS error and fall through to RPC fallback
    }

    // 2. Fallback: Secure RPC function (works even with anon key under strict RLS)
    if (!user) {
      try {
        const { data: rpcData, error: rpcErr } = await withTimeout(
          supabase.rpc('verify_freelancer_pin', {
            p_nick: cleanNick,
            p_salted_hash: saltedHash,
            p_unsalted_hash: unsaltedHash,
          })
        );

        if (!rpcErr && rpcData?.success && rpcData.user) {
          user = rpcData.user;
          isValid = true;
        }
      } catch (rpcEx) {
        console.error('verify-pin RPC error:', rpcEx);
      }
    }

    if (!user || !isValid) {
      return res.status(401).json({
        success: false,
        error:   'Incorrect nickname / email or PIN code.',
      });
    }

    // ── Success: clear rate-limit entry for this IP+nick combination ─────────
    clearRateLimit(rlKey);

    return res.status(200).json({
      success: true,
      user: {
        id:        user.id,
        nick:      user.nick,
        email:     user.email || '',
        createdAt: user.created_at || user.createdAt || new Date().toISOString(),
        // pinHash is returned only for local cache (offline login) –
        // transferred over HTTPS and stored only in localStorage, never in plaintext
        pinHash:   user.pin_code || user.pinHash || saltedHash,
      },
    });

  } catch (err) {
    console.error('verify-pin: Unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
}
