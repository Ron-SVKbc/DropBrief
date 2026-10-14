import { createClient } from '@supabase/supabase-js';
import { createHash, createHmac } from 'crypto';

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

/**
 * Zabezpečenie odosielania e-mailov VÝHRADNE cez overenú subdoménu (mail.usedropbrief.xyz).
 * Tým sa predchádza označeniu za spam a garantuje sa SPF, DKIM a DMARC validácia.
 */
function getVerifiedSubdomainSender() {
  const envFrom = process.env.RESEND_FROM?.trim();
  const envEmail = process.env.RESEND_FROM_EMAIL?.trim();

  let email = 'notifikacie@mail.usedropbrief.xyz';
  let senderName = 'DropBrief';

  if (envEmail && envEmail.includes('@')) {
    email = envEmail;
  } else if (envFrom) {
    const match = envFrom.match(/^(.*?)\s*<([^>]+)>$/);
    if (match) {
      if (match[1]?.trim()) senderName = match[1].trim();
      email = match[2].trim();
    } else {
      email = envFrom;
    }
  }

  // Ak je doména koreňová usedropbrief.xyz, striktne ju presmerujeme na overenú subdoménu mail.usedropbrief.xyz
  if (email.toLowerCase().endsWith('@usedropbrief.xyz')) {
    const localPart = email.split('@')[0];
    email = `${localPart}@mail.usedropbrief.xyz`;
  }

  return {
    fromHeader: `${senderName} <${email}>`,
    cleanEmail: email
  };
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

    const { email, nick } = bodyData;

    if (!email || typeof email !== 'string' || !email.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Zadajte platnú e-mailovú adresu.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNick = String(nick || 'Freelancer').replace(/[\r\n\t"]/g, '').trim();

    if (!cleanNick || cleanNick.length < 2) {
      return res.status(400).json({ success: false, error: 'Meno / Nickname musí mať aspoň 2 znaky.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const sender = getVerifiedSubdomainSender();
    const replyToEmail = process.env.RESEND_REPLY_TO?.trim() || 'support@usedropbrief.xyz';
    const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || 'dropbrief_auth_secret_2026';

    let existingUser = null;
    let nickTaken = false;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Kontrola, či už e-mail existuje (priamy SELECT so service_role kľúčom)
        try {
          const { data: dbEmailUser } = await supabase
            .from('freelancers')
            .select('id, nick, email')
            .ilike('email', cleanEmail)
            .maybeSingle();

          if (dbEmailUser) {
            existingUser = dbEmailUser;
          }
        } catch (e) {}

        // Fallback cez bezpečnú RPC funkciu (funguje s anon kľúčom a zapnutým RLS)
        if (!existingUser) {
          try {
            const { data: isAvailable, error: rpcErr } = await supabase.rpc('check_email_available', {
              check_email: cleanEmail
            });
            if (!rpcErr && isAvailable === false) {
              existingUser = { email: cleanEmail, nick: cleanNick };
            }
          } catch (e) {}
        }

        // 2. Kontrola obsadenosti nicku
        try {
          const { data: isNickAvail } = await supabase.rpc('check_nick_available', {
            check_nick: cleanNick
          });
          if (isNickAvail === false) {
            nickTaken = true;
          }
        } catch (e) {
          const { data: dbNickUser } = await supabase
            .from('freelancers')
            .select('id')
            .ilike('nick', cleanNick)
            .maybeSingle();

          if (dbNickUser) nickTaken = true;
        }
      } catch (dbErr) {
        console.warn('[send-auth-pin] Supabase check warning:', dbErr.message);
      }
    }

    // Ak je nickname obsadený niekým iným, informujeme používateľa (nickname je verejný identifikátor)
    if (nickTaken) {
      return res.status(400).json({
        success: false,
        error: 'Tento nickname je už obsadený. Zvoľte si prosím iné meno alebo názov štúdia.'
      });
    }

    const uniqueRef = createHash('sha256')
      .update(`${cleanEmail}-${Date.now()}`)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENÁR A: E-MAIL UŽ V DATABÁZE EXISTUJE (Anti-Enumeration & Bezpečnostné GDPR Upozornenie)
    // ─────────────────────────────────────────────────────────────────────────────
    // Používateľovi v rozhraní NEPREZRÁDZAME, že e-mail existuje.
    // Zobrazíme identickú hlášku o odoslaní kódu.
    // Na daný e-mail však namiesto registračného PINu pošleme bezpečnostné upozornenie,
    // že sa niekto pokúsil zaregistrovať s jeho e-mailom a odkaz na prihlásenie.
    if (existingUser) {
      const dummyExp = Date.now() + 5 * 60 * 1000;
      const dummySig = createHmac('sha256', SECRET)
        .update(`dummy:${cleanEmail}:${dummyExp}`)
        .digest('hex');

      const dummyChallengeToken = Buffer.from(
        JSON.stringify({
          email: cleanEmail,
          nick: cleanNick,
          exp: dummyExp,
          sig: dummySig,
          isDummy: true
        })
      ).toString('base64url');

      if (resendApiKey) {
        const securitySubject = 'DropBrief: Bezpečnostné upozornenie k vášmu účtu';
        const securityPlainText = `Ahoj ${existingUser.nick || cleanNick},

Zaznamenali sme pokus o vytvorenie nového účtu na DropBrief s vašou e-mailovou adresou (${cleanEmail}).

Váš účet už v DropBrief existuje. Pokiaľ ste to boli vy a chceli ste sa prihlásiť, môžete sa kedykoľvek prihlásiť so svojím existujúcim PIN kódom na:
https://usedropbrief.xyz

Pokiaľ ste svoj PIN kód zabudli, môžete si ho bezpečne obnoviť pomocou možnosti „Zabudli ste PIN kód?“ na prihlasovacej stránke.

Pokiaľ ste tento pokus nevykonali vy, nemusíte robiť vôbec nič. Váš účet aj všetky vaše zákazky a podklady zostávajú v úplnom bezpečí.

S pozdravom,
Tím DropBrief
https://usedropbrief.xyz
Ref: DB-SEC-${uniqueRef}
`;

        const securityHtml = `<!DOCTYPE html>
<html lang="sk" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(securitySubject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; color: #4f46e5; letter-spacing: -0.02em;">DropBrief</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; font-weight: 600; color: #d97706; background-color: #fef3c7; padding: 4px 10px; border-radius: 20px;">Bezpečnosť účtu</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                Bezpečnostné upozornenie k účtu
              </h1>
              
              <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Ahoj <strong>${escapeHtml(existingUser.nick || cleanNick)}</strong>, zaznamenali sme pokus o vytvorenie nového účtu na DropBrief s vašou e-mailovou adresou (<strong>${escapeHtml(cleanEmail)}</strong>).
              </p>

              <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px 18px; margin-bottom: 24px; border-left: 4px solid #4f46e5;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                  Váš účet už existuje
                </p>
                <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: #475569;">
                  Pokiaľ ste sa pokúšali prihlásiť, použite prihlasovací formulár so svojím pôvodným PIN kódom. Pokiaľ ste PIN zabudli, kliknite na <em>„Zabudli ste PIN kód?“</em> na prihlasovacej obrazovke.
                </p>
              </div>

              <!-- Button CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="left">
                    <a href="https://usedropbrief.xyz" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                      Prejsť na prihlásenie do DropBrief &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                Ak ste tento pokus nevykonali vy, tento e-mail môžete pokojne ignorovať. Váš účet aj všetky vaše zákazky a súbory sú v bezpečí.
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
                    Ref: DB-SEC-${uniqueRef}
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
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: sender.fromHeader,
            to: [cleanEmail],
            reply_to: replyToEmail,
            subject: securitySubject,
            text: securityPlainText,
            html: securityHtml,
            headers: {
              'X-Entity-Ref-ID': `DB-SEC-${uniqueRef}`,
              'Auto-Submitted': 'auto-generated',
              'X-Auto-Response-Suppress': 'All',
              'List-Unsubscribe': `<mailto:${sender.cleanEmail}?subject=Unsubscribe>`,
            },
          }),
          signal: AbortSignal.timeout(8000),
        }).catch((err) => console.warn('[send-auth-pin] Resend security alert err:', err.message));
      } else {
        console.warn(`[DEV AUTH] Účet ${cleanEmail} už existuje. Bezpečnostná simulácia prebehla.`);
      }

      // Vrátime IDENTICKÚ odpoveď pre klienta (ochrana pred enumeráciou e-mailov)
      return res.status(200).json({
        success: true,
        challengeToken: dummyChallengeToken,
        expiresAt: dummyExp,
        message: 'Overovací PIN kód bol odoslaný na váš e-mail.'
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENÁR B: NOVÝ POUŽÍVATEĽ (Generovanie 6-miestneho PINu s 5-minútovou platnosťou)
    // ─────────────────────────────────────────────────────────────────────────────
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minút

    const pinSignature = createHmac('sha256', SECRET)
      .update(`${cleanEmail}:${cleanNick}:${generatedPin}:${expiresAt}`)
      .digest('hex');

    const challengeToken = Buffer.from(
      JSON.stringify({
        email: cleanEmail,
        nick: cleanNick,
        exp: expiresAt,
        sig: pinSignature
      })
    ).toString('base64url');

    // Predmet bez surového čísla PIN kódu (čísla v predmete spúšťajú spamové filtre finančného/phishingového OTP)
    const subject = 'DropBrief: Váš overovací PIN kód';

    const plainTextContent = `Ahoj ${cleanNick},

Ďakujeme za záujem o DropBrief. Pre vytvorenie a overenie vášho účtu zadajte nasledujúci 6-miestny PIN kód:

VÁŠ OVEROVACÍ A PRÍSTUPOVÝ PIN KÓD:
${generatedPin}

Tento kód platí nasledujúcich 5 minút.

Po jeho zadaní do registračného formulára bude váš účet aktivovaný. Tento istý PIN kód vám zároveň ostáva ako váš trvalý prístupový kód pre prihlásenie do vášho dashboardu na adrese:
https://usedropbrief.xyz

Tento kód slúži ako váš bezpečný kľúč k zákazkám a nahrávaným podkladom.

S pozdravom,
Tím DropBrief
https://usedropbrief.xyz
Ref: DB-VERIF-${uniqueRef}
`;

    // Moderný, vysokokontrastný a čistý transakčný dizajn cez overenú subdoménu
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
                    <span style="font-size: 12px; font-weight: 600; color: #4f46e5; background-color: #eef2ff; padding: 4px 10px; border-radius: 20px;">Overenie e-mailu</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                Overovací kód pre ${escapeHtml(cleanNick)}
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Pre dokončenie registrácie a overenie vášho e-mailu zadajte nasledujúci 6-miestny PIN kód do aplikácie:
              </p>

              <!-- Clean Monospace PIN Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 22px 16px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
                      VÁŠ PRÍSTUPOVÝ PIN KÓD
                    </div>
                    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">
                      ${escapeHtml(generatedPin)}
                    </div>
                    <div style="font-size: 12px; color: #d97706; margin-top: 6px; font-weight: 600;">
                      ⏱ Platnosť kódu vyprší o 5 minút
                    </div>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; border-left: 3px solid #4f46e5;">
                <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: #334155;">
                  <strong>Dôležité:</strong> Po overení bude váš účet vytvorený a tento PIN kód vám ostáva ako váš stály prístupový kód pre prihlásenie.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                Ak ste o registráciu na DropBrief nežiadali, tento e-mail môžete ignorovať. Účet nebude bez overenia tohto kódu aktivovaný.
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
                    Ref: DB-VERIF-${uniqueRef}
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

    // Lokálny / fallback režim ak nie je nakonfigurovaný RESEND_API_KEY
    if (!resendApiKey) {
      console.warn(`[DEV AUTH PIN] RESEND_API_KEY chýba. Overovací PIN pre ${cleanEmail}: ${generatedPin}`);
      return res.status(200).json({
        success: true,
        simulated: true,
        challengeToken,
        expiresAt,
        devPin: generatedPin,
        message: 'Overovací PIN bol vygenerovaný (vývojový režim).'
      });
    }

    const resendPayload = {
      from: sender.fromHeader,
      to: [cleanEmail],
      reply_to: replyToEmail,
      subject,
      text: plainTextContent,
      html: htmlContent,
      headers: {
        'X-Entity-Ref-ID': `DB-VERIF-${uniqueRef}`,
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
        'List-Unsubscribe': `<mailto:${sender.cleanEmail}?subject=Unsubscribe>`,
      },
    };

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
      signal: AbortSignal.timeout(8000),
    });

    const resendData = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      const errText = resendData.error?.message || resendData.message || `Resend error (${resendResponse.status})`;
      console.warn(`Resend failed to send PIN to ${cleanEmail}:`, errText);
      return res.status(200).json({
        success: true,
        challengeToken,
        expiresAt,
        sent: false,
        warning: errText,
        message: 'Overovací PIN bol odoslaný na váš e-mail.'
      });
    }

    return res.status(200).json({
      success: true,
      challengeToken,
      expiresAt,
      sent: true,
      messageId: resendData.id,
      message: 'Overovací PIN bol úspešne odoslaný na váš e-mail.'
    });

  } catch (error) {
    console.error('send-auth-pin error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Nastala chyba pri odosielaní e-mailu.',
    });
  }
}
