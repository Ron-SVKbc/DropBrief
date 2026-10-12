import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

/**
 * In-memory rate limiter pre obnovu PIN kódu (max 3 pokusy za 10 minút na IP).
 * Chráni pred zneužitím e-mailového odosielania.
 */
const resetAttempts = new Map();
const WINDOW_MS = 10 * 60 * 1_000; // 10 minút
const MAX_ATTEMPTS = 3;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = resetAttempts.get(ip);
  if (!record || now - record.since > WINDOW_MS) {
    resetAttempts.set(ip, { count: 1, since: now });
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
        error: `Príliš veľa žiadostí o obnovu PIN kódu. Skúste znova o ${Math.ceil(rl.waitSec / 60)} minút.`
      });
    }

    let bodyData = req.body || {};
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch (e) { bodyData = {}; }
    }

    const { email } = bodyData;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Zadajte platnú e-mailovú adresu.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    let userFound = false;
    let newGeneratedPin = null;
    let userNick = 'Freelancer';

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Vyhľadanie používateľa podľa e-mailu
      const { data: dbUser, error } = await supabase
        .from('freelancers')
        .select('id, nick, email')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (!error && dbUser) {
        userFound = true;
        userNick = dbUser.nick || 'Freelancer';
        // Generovanie nového 6-miestneho PIN kódu
        newGeneratedPin = Math.floor(100000 + Math.random() * 900000).toString();
        const newSaltedHash = hashPin(newGeneratedPin, true);

        // Aktualizácia v databáze
        await supabase
          .from('freelancers')
          .update({ pin_code: newSaltedHash })
          .eq('id', dbUser.id);
      }
    }

    // Odoslanie e-mailu cez Resend (ak používateľ existuje a Resend je konfigurovaný)
    const resendApiKey = process.env.RESEND_API_KEY;

    if (userFound && newGeneratedPin) {
      if (resendApiKey) {
        let resendFrom = process.env.RESEND_FROM;
        if (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.includes('@')) {
          const emailOnly = process.env.RESEND_FROM_EMAIL.trim();
          resendFrom = `DropBrief Bezpečnosť <${emailOnly}>`;
        } else if (!resendFrom) {
          resendFrom = `DropBrief <onboarding@resend.dev>`;
        }

        const subject = `DropBrief: Váš nový prístupový PIN kód: ${newGeneratedPin}`;

        const plainTextContent = `Ahoj ${userNick},

Na základe vašej žiadosti sme pre váš účet vygenerovali nový 6-miestny PIN kód.

VÁŠ NOVÝ PRÍSTUPOVÝ PIN KÓD:
${newGeneratedPin}

Do svojho dashboardu sa môžete ihneď prihlásiť zadaním vášho mena (${userNick}) alebo vášho e-mailu (${cleanEmail}) a tohto nového PIN kódu:
https://usedropbrief.xyz

DÔLEŽITÉ BEZPEČNOSTNÉ UPOZORNENIE:
Ak ste o zmenu PIN kódu nežiadali, odporúčame prihlásiť sa do dashboardu a overiť svoje údaje. Pôvodný PIN kód bol zneplatnený a nový PIN kód bol doručený iba do tejto e-mailovej schránky.

Tím DropBrief
https://usedropbrief.xyz
`;

        const htmlContent = `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background: #111827; border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.3); overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(17, 24, 39, 0) 100%);">
              <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                DropBrief
              </div>
              <div style="font-size: 13px; color: #f59e0b; margin-top: 4px; font-weight: 600;">
                Obnova prístupového PIN kódu
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <p style="font-size: 16px; line-height: 1.5; color: #f8fafc; margin: 0 0 16px 0; font-weight: 600;">
                Ahoj ${escapeHtml(userNick)},
              </p>
              
              <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0;">
                Na základe vašej žiadosti o obnovu prístupu sme pre váš účet vygenerovali nový 6-miestny numerický PIN kód. Váš predchádzajúci PIN kód bol z bezpečnostných dôvodov zneplatnený:
              </p>

              <!-- Glowing PIN Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 26px;">
                <tr>
                  <td align="center" style="background: rgba(0, 0, 0, 0.45); border: 2px dashed #f59e0b; border-radius: 10px; padding: 24px 16px;">
                    <div style="font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                      VÁŠ NOVÝ PIN KÓD
                    </div>
                    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 16px rgba(245, 158, 11, 0.7);">
                      ${escapeHtml(newGeneratedPin)}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13.5px; line-height: 1.6; color: #cbd5e1; margin: 0 0 18px 0;">
                <strong>Ako sa prihlásiť:</strong><br>
                Zadajte vaše prihlasovacie meno <code>${escapeHtml(userNick)}</code> alebo váš e-mail <code>${escapeHtml(cleanEmail)}</code> a vyššie uvedený nový PIN kód.
              </p>

              <!-- Warning Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 14px;">
                    <div style="font-size: 12.5px; color: #fca5a5; line-height: 1.5;">
                      <strong>Bezpečnostné upozornenie:</strong> Ak ste o túto zmenu nežiadali, odporúčame prihlásiť sa do dashboardu. Pôvodný PIN bol okamžite zrušený a nový kód bol doručený iba do tejto vašej e-mailovej schránky.
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left">
                    <a href="https://usedropbrief.xyz" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 6px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);">
                      Prihlásiť sa do DropBrief &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #0d121f; border-top: 1px solid rgba(255, 255, 255, 0.06); padding: 16px 32px; font-size: 11.5px; color: #64748b; line-height: 1.5;">
              <div>
                Tento e-mail je bezpečnostnou transakčnou správou pre obnovu účtu na <strong>DropBrief</strong>.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [cleanEmail],
            subject,
            text: plainTextContent,
            html: htmlContent,
          }),
          signal: AbortSignal.timeout(8000),
        }).catch((err) => console.warn('Resend reset-pin error:', err));
      } else {
        console.warn(`[DEV RESET PIN] RESEND_API_KEY chýba. Nový PIN pre ${cleanEmail}: ${newGeneratedPin}`);
      }
    }

    // Bezpečnostná odpoveď (rovnaká bez ohľadu na to, či e-mail v DB existuje – prevencia enumerácie)
    return res.status(200).json({
      success: true,
      message: 'Pokiaľ je tento e-mail u nás registrovaný, nový PIN kód bol práve odoslaný do vašej schránky.'
    });

  } catch (error) {
    console.error('reset-pin unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Nastala neočakávaná chyba pri spracovaní požiadavky.'
    });
  }
}
