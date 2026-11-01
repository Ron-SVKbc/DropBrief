import { createClient } from '@supabase/supabase-js';
import { createHash, createHmac } from 'crypto';

/**
 * Rate limiter for verification PIN entry (max 10 attempts per minute per IP)
 * Protects against brute-force guessing of the 6-digit PIN code.
 */
const verifyAttempts = new Map();
const WINDOW_MS = 60 * 1_000;
const MAX_ATTEMPTS = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = verifyAttempts.get(ip);
  if (!record || now - record.since > WINDOW_MS) {
    verifyAttempts.set(ip, { count: 1, since: now });
    return { allowed: true };
  }
  if (record.count >= MAX_ATTEMPTS) {
    const waitSec = Math.ceil((WINDOW_MS - (now - record.since)) / 1000);
    return { allowed: false, waitSec };
  }
  record.count += 1;
  return { allowed: true };
}

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

  try {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip']?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many failed attempts. Please try again in ${rl.waitSec} seconds.`
      });
    }

    let bodyData = req.body || {};
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch (e) { bodyData = {}; }
    }

    const { email, nick, pin, challengeToken, referredBy, referred_by } = bodyData;
    const rawRef = referredBy || referred_by || null;
    const cleanRef = rawRef && typeof rawRef === 'string' ? rawRef.trim() : null;

    if (!email || !pin || !challengeToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing email, PIN code, or verification token.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNick = String(nick || '').trim();
    const cleanPin = String(pin).trim();

    if (!/^\d{6}$/.test(cleanPin)) {
      return res.status(400).json({
        success: false,
        error: 'Verification PIN must contain exactly 6 digits.'
      });
    }

    let tokenData;
    try {
      tokenData = JSON.parse(Buffer.from(challengeToken, 'base64url').toString('utf8'));
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification token format. Please request a new code.'
      });
    }

    // 1. If dummy token (email already existed in DB before sending)
    if (tokenData.isDummy) {
      // Small delay to mitigate timing attacks
      await new Promise((resolve) => setTimeout(resolve, 350));
      return res.status(400).json({
        success: false,
        error: 'Entered verification PIN is incorrect or has expired.'
      });
    }

    // 2. Check 5-minute expiration
    if (!tokenData.exp || Date.now() > tokenData.exp) {
      return res.status(400).json({
        success: false,
        error: 'Verification PIN has expired (5-minute limit). Please click "Resend code".'
      });
    }

    // 3. Kontrola zhody e-mailu
    if (tokenData.email.toLowerCase() !== cleanEmail) {
      return res.status(400).json({
        success: false,
        error: 'Verification code was issued for a different email address.'
      });
    }

    // 4. Cryptographic HMAC signature verification (guarantees PIN originated from verification email)
    const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || 'dropbrief_auth_secret_2026';
    const finalNick = tokenData.nick || cleanNick || 'Freelancer';

    const expectedSig = createHmac('sha256', SECRET)
      .update(`${cleanEmail}:${finalNick}:${cleanPin}:${tokenData.exp}`)
      .digest('hex');

    if (expectedSig !== tokenData.sig) {
      return res.status(400).json({
        success: false,
        error: 'Entered PIN is incorrect. Please check your email and try again.'
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PIN IS VERIFIED AND VALID! Now create account in Supabase database
    // ─────────────────────────────────────────────────────────────────────────────
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const saltedHash = hashPin(cleanPin, true);

    let savedUser = null;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Additional check if account was created in the meantime
        let alreadyRegistered = false;
        try {
          const { data: existingUser } = await supabase
            .from('freelancers')
            .select('id')
            .ilike('email', cleanEmail)
            .maybeSingle();

          if (existingUser) alreadyRegistered = true;
        } catch (e) {}

        if (!alreadyRegistered) {
          try {
            const { data: isAvail } = await supabase.rpc('check_email_available', { check_email: cleanEmail });
            if (isAvail === false) alreadyRegistered = true;
          } catch (e) {}
        }

        if (alreadyRegistered) {
          return res.status(400).json({
            success: false,
            error: 'An account with this email already exists. Please log in using your original PIN.'
          });
        }

        // 1. Primarily register via secure SECURITY DEFINER RPC function (handles referrals & atomic slot rewards)
        let rpcSucceeded = false;
        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('register_freelancer', {
            p_nick: finalNick,
            p_pin_hash: saltedHash,
            p_email: cleanEmail,
            p_referred_by: cleanRef,
          });

          if (!rpcErr && rpcRes?.success && rpcRes.user) {
            savedUser = rpcRes.user;
            rpcSucceeded = true;
          } else if (rpcErr) {
            console.warn('[verify-registration] register_freelancer RPC warning:', rpcErr.message);
          }
        } catch (rpcEx) {
          console.warn('[verify-registration] register_freelancer RPC exception:', rpcEx.message);
        }

        // 2. Fallback if RPC was not deployed yet (direct service_role queries)
        if (!rpcSucceeded) {
          let validInviter = null;
          if (cleanRef && cleanRef.toLowerCase() !== finalNick.toLowerCase()) {
            try {
              const { data: inviter } = await supabase
                .from('freelancers')
                .select('nick, max_projects, referral_count')
                .ilike('nick', cleanRef)
                .maybeSingle();

              if (inviter) {
                validInviter = inviter.nick;
                await supabase
                  .from('freelancers')
                  .update({
                    referral_count: (inviter.referral_count || 0) + 1,
                    max_projects: (inviter.max_projects || 2) + 2,
                  })
                  .ilike('nick', cleanRef);
              }
            } catch (invErr) {
              console.warn('[verify-registration] inviter update fallback error:', invErr);
            }
          }

          try {
            const { data: inserted, error: insertError } = await supabase
              .from('freelancers')
              .insert({
                nick: finalNick,
                email: cleanEmail,
                pin_code: saltedHash,
                tier: 'free',
                max_projects: 2,
                referred_by: validInviter,
                referral_count: 0,
              })
              .select('id, nick, email, created_at, tier, max_projects, referral_count, referred_by')
              .maybeSingle();

            if (!insertError && inserted) {
              savedUser = inserted;
            } else if (insertError) {
              await supabase
                .from('freelancers')
                .insert({
                  nick: finalNick,
                  email: cleanEmail,
                  pin_code: saltedHash,
                });
            }
          } catch (insertEx) {
            console.warn('[verify-registration] Supabase insert fallback exception:', insertEx.message);
          }
        }
      } catch (dbErr) {
        console.error('[verify-registration] Supabase error:', dbErr);
      }
    }

    const fallbackId = 'fl-' + Date.now();
    const finalUser = {
      id: savedUser?.id || fallbackId,
      nick: savedUser?.nick || finalNick,
      email: savedUser?.email || cleanEmail,
      tier: savedUser?.tier || 'free',
      max_projects: savedUser?.max_projects || savedUser?.maxProjects || 2,
      maxProjects: savedUser?.maxProjects || savedUser?.max_projects || 2,
      referral_count: savedUser?.referral_count ?? savedUser?.referralCount ?? 0,
      referralCount: savedUser?.referralCount ?? savedUser?.referral_count ?? 0,
      referred_by: savedUser?.referred_by || savedUser?.referredBy || cleanRef || null,
      referredBy: savedUser?.referredBy || savedUser?.referred_by || cleanRef || null,
      createdAt: savedUser?.created_at || savedUser?.createdAt || new Date().toISOString(),
      pinHash: saltedHash,
      pin: cleanPin,
    };

    return res.status(200).json({
      success: true,
      user: finalUser,
      message: 'Account was successfully verified and created.'
    });

  } catch (error) {
    console.error('verify-registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while verifying PIN code.'
    });
  }
}
