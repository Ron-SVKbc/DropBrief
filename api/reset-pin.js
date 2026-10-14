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

      // Generovanie nového 6-miestneho PIN kódu a hashu
      newGeneratedPin = Math.floor(100000 + Math.random() * 900000).toString();
      const newSaltedHash = hashPin(newGeneratedPin, true);

      // 1. Primárne: Bezpečná RPC funkcia (SECURITY DEFINER obchádza RLS a funguje s anon aj service_role)
      let rpcSuccess = false;
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('reset_freelancer_pin', {
          p_email: cleanEmail,
          p_new_pin_hash: newSaltedHash,
        });

        if (!rpcErr && rpcRes?.success) {
          rpcSuccess = true;
          userFound = true;
          userNick = rpcRes.user?.nick || 'Freelancer';
        }
      } catch (rpcEx) {
        console.warn('reset-pin RPC warning:', rpcEx);
      }

      // 2. Sekundárne (fallback): Priamy dotaz cez service-role kľúč
      if (!rpcSuccess) {
        const { data: dbUser, error } = await supabase
          .from('freelancers')
          .select('id, nick, email')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (!error && dbUser) {
          const { error: updErr } = await supabase
            .from('freelancers')
            .update({ pin_code: newSaltedHash })
            .eq('id', dbUser.id);

          if (!updErr) {
            userFound = true;
            userNick = dbUser.nick || 'Freelancer';
          }
        }
      }
    }

    // Odoslanie e-mailu cez Resend (ak používateľ existuje a Resend je konfigurovaný)
    const resendApiKey = process.env.RESEND_API_KEY;

    if (userFound && newGeneratedPin) {
      if (resendApiKey) {
        let emailToUse = 'notifikacie@mail.usedropbrief.xyz';
        let senderName = 'DropBrief';
        const configuredFromEmail = process.env.RESEND_FROM_EMAIL?.trim();
        const configuredFrom = process.env.RESEND_FROM?.trim();

        if (configuredFromEmail && configuredFromEmail.includes('@')) {
          emailToUse = configuredFromEmail;
        } else if (configuredFrom) {
          const match = configuredFrom.match(/^(.*?)\s*<([^>]+)>$/);
          if (match) {
            if (match[1]?.trim()) senderName = match[1].trim();
            emailToUse = match[2].trim();
          } else {
            emailToUse = configuredFrom;
          }
        }

        // Vždy garantovať overenú subdoménu
        if (emailToUse.toLowerCase().endsWith('@usedropbrief.xyz')) {
          const localPart = emailToUse.split('@')[0];
          emailToUse = `${localPart}@mail.usedropbrief.xyz`;
        }

        const resendFrom = `${senderName} <${emailToUse}>`;
        const replyToEmail = process.env.RESEND_REPLY_TO?.trim() || 'support@usedropbrief.xyz';

        // Predmet bez surového čísla PIN kódu kvôli anti-spam filtrom
        const subject = 'DropBrief: Obnova prístupového PIN kódu';

        const uniqueRef = createHash('sha256')
          .update(`${cleanEmail}-${Date.now()}-${newGeneratedPin}`)
          .digest('hex')
          .substring(0, 8)
          .toUpperCase();

        const plainTextContent = `Ahoj ${userNick},

Na základe vašej žiadosti sme pre váš účet vygenerovali nový 6-miestny PIN kód.

VÁŠ NOVÝ PRÍSTUPOVÝ PIN KÓD:
${newGeneratedPin}

Do svojho dashboardu sa môžete kedykoľvek prihlásiť zadaním vášho mena (${userNick}) alebo vášho e-mailu (${cleanEmail}) a tohto nového PIN kódu na adrese:
https://usedropbrief.xyz

Pôvodný PIN kód bol z bezpečnostných dôvodov zneplatnený.

S pozdravom,
Tím DropBrief
https://usedropbrief.xyz
Ref: DB-RESET-${uniqueRef}
`;

        const htmlContent = `<!DOCTYPE html>
<html lang="sk" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; color: #4f46e5; letter-spacing: -0.02em;">DropBrief</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; font-weight: 600; color: #d97706; background-color: #fef3c7; padding: 4px 10px; border-radius: 20px;">Obnova PIN kódu</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                Ahoj ${escapeHtml(userNick)},
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Na základe vašej žiadosti sme pre váš účet vygenerovali nový 6-miestny numerický PIN kód. Váš predchádzajúci PIN kód bol z bezpečnostných dôvodov zneplatnený:
              </p>

              <!-- Clean Monospace PIN Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 22px 16px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
                      VÁŠ NOVÝ PIN KÓD
                    </div>
                    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">
                      ${escapeHtml(newGeneratedPin)}
                    </div>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; border-left: 3px solid #4f46e5;">
                <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: #334155;">
                  <strong>Ako sa prihlásiť:</strong> Zadajte vaše prihlasovacie meno <strong>${escapeHtml(userNick)}</strong> alebo e-mail <strong>${escapeHtml(cleanEmail)}</strong> a tento nový PIN kód.
                </p>
              </div>

              <!-- Button CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="left">
                    <a href="https://usedropbrief.xyz" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                      Prihlásiť sa do DropBrief &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                Ak ste o obnovu PIN kódu nežiadali, odporúčame prihlásiť sa a overiť svoje projekty. Kód bol doručený iba do tejto vašej e-mailovej schránky.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 1.5;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    DropBrief &bull; <a href="https://usedropbrief.xyz" style="color: #64748b; text-decoration: underline;">usedropbrief.xyz</a>
                  </td>
                  <td align="right">
                    Ref: DB-RESET-${uniqueRef}
                  </td>
                </tr>
              </table>
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
            reply_to: replyToEmail,
            subject,
            text: plainTextContent,
            html: htmlContent,
            headers: {
              'X-Entity-Ref-ID': `DB-RESET-${uniqueRef}`,
              'Auto-Submitted': 'auto-generated',
              'X-Auto-Response-Suppress': 'All',
            },
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
