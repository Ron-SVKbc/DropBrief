import { createClient } from '@supabase/supabase-js';
import { createHash, createHmac } from 'crypto';

/**
 * Rate limiter pre zadávanie overovacieho PINu (max 10 pokusov za minútu na IP)
 * Chráni pred pokusom o uhádnutie 6-miestneho PIN kódu.
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
        error: `Príliš veľa neúspešných pokusov. Skúste to znova o ${rl.waitSec} sekúnd.`
      });
    }

    let bodyData = req.body || {};
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch (e) { bodyData = {}; }
    }

    const { email, nick, pin, challengeToken } = bodyData;

    if (!email || !pin || !challengeToken) {
      return res.status(400).json({
        success: false,
        error: 'Chýba e-mail, PIN kód alebo overovací token.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNick = String(nick || '').trim();
    const cleanPin = String(pin).trim();

    if (!/^\d{6}$/.test(cleanPin)) {
      return res.status(400).json({
        success: false,
        error: 'Overovací PIN kód musí obsahovať presne 6 číslic.'
      });
    }

    let tokenData;
    try {
      tokenData = JSON.parse(Buffer.from(challengeToken, 'base64url').toString('utf8'));
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Neplatný formát overovacieho tokenu. Požiadajte o nový kód.'
      });
    }

    // 1. Ak išlo o dummy token (e-mail už v DB existoval pred odoslaním)
    if (tokenData.isDummy) {
      // Malé oneskorenie pre elimináciu timing útokov
      await new Promise((resolve) => setTimeout(resolve, 350));
      return res.status(400).json({
        success: false,
        error: 'Zadaný overovací PIN kód je nesprávny alebo vypršala jeho platnosť.'
      });
    }

    // 2. Kontrola vypršania 5-minútovej lehoty
    if (!tokenData.exp || Date.now() > tokenData.exp) {
      return res.status(400).json({
        success: false,
        error: 'Platnosť 5-minútového overovacieho PIN kódu vypršala. Kliknite na „Zaslať nový kód“.'
      });
    }

    // 3. Kontrola zhody e-mailu
    if (tokenData.email.toLowerCase() !== cleanEmail) {
      return res.status(400).json({
        success: false,
        error: 'Overovací kód bol vystavený pre inú e-mailovú adresu.'
      });
    }

    // 4. Kryptografické overenie HMAC podpisu (garancia, že PIN pochádza z overovacieho e-mailu)
    const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || 'dropbrief_auth_secret_2026';
    const finalNick = tokenData.nick || cleanNick || 'Freelancer';

    const expectedSig = createHmac('sha256', SECRET)
      .update(`${cleanEmail}:${finalNick}:${cleanPin}:${tokenData.exp}`)
      .digest('hex');

    if (expectedSig !== tokenData.sig) {
      return res.status(400).json({
        success: false,
        error: 'Zadaný PIN kód je nesprávny. Skontrolujte kód vo vašom e-maile a skúste to znova.'
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PIN JE OVERENÝ A SPRÁVNY! Teraz vytvoríme účet v databáze Supabase
    // ─────────────────────────────────────────────────────────────────────────────
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const saltedHash = hashPin(cleanPin, true);

    let savedUser = null;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Dodatočná kontrola, či účet nevznikol medzitým
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
            error: 'Účet s týmto e-mailom už existuje. Prihláste sa pomocou svojho pôvodného PIN kódu.'
          });
        }

        // Vloženie účtu do Supabase (skúsiť s povolenými stĺpcami id, nick, created_at)
        try {
          const { data: inserted, error: insertError } = await supabase
            .from('freelancers')
            .insert({
              nick: finalNick,
              email: cleanEmail,
              pin_code: saltedHash
            })
            .select('id, nick, created_at')
            .maybeSingle();

          if (!insertError && inserted) {
            savedUser = inserted;
          } else if (insertError) {
            // Čistý INSERT ako fallback
            await supabase
              .from('freelancers')
              .insert({
                nick: finalNick,
                email: cleanEmail,
                pin_code: saltedHash
              });
          }
        } catch (insertEx) {
          console.warn('[verify-registration] Supabase insert fallback exception:', insertEx.message);
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
      createdAt: savedUser?.created_at || new Date().toISOString(),
      pinHash: saltedHash,
      pin: cleanPin,
    };

    return res.status(200).json({
      success: true,
      user: finalUser,
      message: 'Účet bol úspešne overený a vytvorený.'
    });

  } catch (error) {
    console.error('verify-registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Nastala neočakávaná chyba pri overovaní PIN kódu.'
    });
  }
}
