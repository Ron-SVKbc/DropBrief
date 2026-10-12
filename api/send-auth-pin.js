import { createHash } from 'crypto';

/**
 * In-memory rate limiter pre odosielanie registračných e-mailov (max 5 pokusov za 60s z jednej IP).
 */
const sendAttempts = new Map();
const WINDOW_MS = 60 * 1_000;
const MAX_ATTEMPTS = 5;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = sendAttempts.get(ip);
  if (!record || now - record.since > WINDOW_MS) {
    sendAttempts.set(ip, { count: 1, since: now });
    return { allowed: true };
  }
  if (record.count >= MAX_ATTEMPTS) {
    const waitSec = Math.ceil((WINDOW_MS - (now - record.since)) / 1000);
    return { allowed: false, waitSec };
  }
  record.count += 1;
  return { allowed: true };
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
        error: `Príliš veľa žiadostí. Skúste znova o ${rl.waitSec} sekúnd.`
      });
    }

    let bodyData = req.body || {};
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch (e) { bodyData = {}; }
    }

    const { email, nick, pin } = bodyData;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Zadajte platnú e-mailovú adresu.' });
    }

    if (!pin || typeof pin !== 'string' || !/^\d{6}$/.test(pin.trim())) {
      return res.status(400).json({ success: false, error: 'PIN musí mať presne 6 číslic.' });
    }

    const cleanEmail = email.trim();
    const cleanNick = String(nick || 'Freelancer').replace(/[\r\n\t"]/g, '').trim() || 'Freelancer';
    const cleanPin = pin.trim();

    const resendApiKey = process.env.RESEND_API_KEY;

    // Lokálny / fallback režim ak nie je nakonfigurovaný RESEND_API_KEY
    if (!resendApiKey) {
      console.warn(`[DEV AUTH EMAIL] RESEND_API_KEY chýba. Simulácia odoslania PIN pre ${cleanEmail}: ${cleanPin}`);
      return res.status(200).json({
        success: true,
        simulated: true,
        message: 'PIN bol vygenerovaný (vývojový režim bez kľúča Resend).'
      });
    }

    let resendFrom = process.env.RESEND_FROM;
    if (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.includes('@')) {
      const emailOnly = process.env.RESEND_FROM_EMAIL.trim();
      resendFrom = `DropBrief Bezpečnosť <${emailOnly}>`;
    } else if (!resendFrom) {
      resendFrom = `DropBrief <onboarding@resend.dev>`;
    }

    const subject = `Váš prístupový PIN kód do DropBrief: ${cleanPin}`;

    const plainTextContent = `Ahoj ${cleanNick},

Váš nový účet na DropBrief bol úspešne vytvorený!

VÁŠ PRÍSTUPOVÝ PIN KÓD:
${cleanPin}

Do svojho dashboardu sa môžete kedykoľvek prihlásiť zadaním vášho mena (${cleanNick}) alebo vášho e-mailu (${cleanEmail}) a tohto 6-miestneho PIN kódu:
https://usedropbrief.xyz

DÔLEŽITÉ BEZPEČNOSTNÉ UPOZORNENIE:
Tento PIN kód si bezpečne uschovajte a nezdieľajte ho s tretími stranami. V prípade, že PIN zabudnete, môžete si ho kedykoľvek obnoviť na prihlasovacej stránke cez možnosť "Zabudli ste PIN kód?".

Táto správa je transakčnou bezpečnostnou notifikáciou k vášmu účtu. DropBrief vám nikdy nezasiela marketingové ani reklamné ponuky.

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
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background: #111827; border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.25); overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(17, 24, 39, 0) 100%);">
              <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                DropBrief
              </div>
              <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">
                Bezpečný prístupový kód k vášmu účtu
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <p style="font-size: 16px; line-height: 1.5; color: #f8fafc; margin: 0 0 16px 0; font-weight: 600;">
                Vítajte v DropBrief, ${escapeHtml(cleanNick)}!
              </p>
              
              <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0;">
                Váš bezplatný účet bol úspešne vytvorený. Pre jednoduché, bezheslové prihlasovanie vám systém pridelil nasledujúci 6-miestny numerický PIN kód:
              </p>

              <!-- Glowing PIN Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 26px;">
                <tr>
                  <td align="center" style="background: rgba(0, 0, 0, 0.45); border: 2px dashed #6366f1; border-radius: 10px; padding: 24px 16px;">
                    <div style="font-size: 11px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                      VÁŠ PRÍSTUPOVÝ PIN KÓD
                    </div>
                    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 16px rgba(99, 102, 241, 0.7);">
                      ${escapeHtml(cleanPin)}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13.5px; line-height: 1.6; color: #cbd5e1; margin: 0 0 18px 0;">
                <strong>Ako sa prihlásiť:</strong><br>
                Do svojho dashboardu zadajte buď vaše meno <code>${escapeHtml(cleanNick)}</code> alebo tento e-mail <code>${escapeHtml(cleanEmail)}</code> a vyššie uvedený 6-miestny PIN kód.
              </p>

              <!-- Security Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(245, 158, 11, 0.08); border-left: 3px solid #f59e0b; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 14px;">
                    <div style="font-size: 12.5px; color: #fde68a; line-height: 1.5;">
                      <strong>Bezpečnostný tip:</strong> Tento e-mail si bezpečne uschovajte. V prípade straty PIN kódu si ho môžete kedykoľvek obnoviť na prihlasovacej stránke cez odkaz <em>„Zabudli ste PIN kód?“</em>.
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left">
                    <a href="https://usedropbrief.xyz" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 6px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);">
                      Otvoriť DropBrief Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer (GDPR & Transakčná doložka) -->
          <tr>
            <td style="background: #0d121f; border-top: 1px solid rgba(255, 255, 255, 0.06); padding: 16px 32px; font-size: 11.5px; color: #64748b; line-height: 1.5;">
              <div>
                Tento e-mail je transakčnou bezpečnostnou správou k vášmu účtu na <strong>DropBrief</strong>. Na túto adresu vám nebudú zasielané žiadne marketingové ani nevyžiadané správy.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resendPayload = {
      from: resendFrom,
      to: [cleanEmail],
      subject,
      text: plainTextContent,
      html: htmlContent,
    };

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
      signal: AbortSignal.timeout(8000),
    });

    const resendData = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      const errText = resendData.error?.message || resendData.message || `Resend error (${resendResponse.status})`;
      console.warn(`Resend failed to send PIN to ${cleanEmail}:`, errText);
      // Vraciame 200 s varovaním, aby registrácia nespadla, ak Resend nemá overenú doménu v testovacom režime
      return res.status(200).json({
        success: true,
        sent: false,
        warning: errText,
      });
    }

    return res.status(200).json({
      success: true,
      sent: true,
      messageId: resendData.id,
    });

  } catch (error) {
    console.error('send-auth-pin error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Nastala chyba pri odosielaní e-mailu.',
    });
  }
}
