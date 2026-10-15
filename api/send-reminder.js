import { createClient } from '@supabase/supabase-js';

/**
 * 🔒 In-memory rate limiter pre odosielanie e-mailových pripomienok (max 10 e-mailov za 10 minút na IP).
 * Chráni pred vyčerpaním Resend kvóty a pred použitím ako spam relay.
 */
const reminderAttempts = new Map();
const WINDOW_MS = 10 * 60 * 1_000;
const MAX_ATTEMPTS = 10;

function checkReminderRateLimit(ip) {
  const now = Date.now();
  const record = reminderAttempts.get(ip);
  if (!record || now - record.since > WINDOW_MS) {
    reminderAttempts.set(ip, { count: 1, since: now });
    return { allowed: true };
  }
  if (record.count >= MAX_ATTEMPTS) {
    const waitSec = Math.ceil((WINDOW_MS - (now - record.since)) / 1000);
    return { allowed: false, waitSec };
  }
  record.count += 1;
  return { allowed: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  // ── 1. IP Rate Limiting ────────────────────────────────────────────────────
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip']?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const rl = checkReminderRateLimit(ip);
  if (!rl.allowed) {
    return res.status(429).json({
      success: false,
      error: `Príliš veľa odoslaných e-mailových pripomienok. Skúste to znova o ${Math.ceil(rl.waitSec / 60)} minút.`
    });
  }

  try {
    let bodyData = req.body || {};
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch (e) { bodyData = {}; }
    }

    const { 
      projectId,
      projectTitle,
      clientName,
      clientEmail,
      freelancerName,
      freelancerEmail,
      portalUrl,
      deadline,
      missingItems = [],
      customMessage = '',
      customSubject = '',
      emailStyle = 'personal'
    } = bodyData;

    if (!clientEmail || !clientEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Invalid or missing client email address.' });
    }

    if (!projectTitle) {
      return res.status(400).json({ success: false, error: 'Missing project title.' });
    }

    // ── 2. Ochrana pred Open Email Relay (Overenie príjemcu voči DB) ───────────
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Chýba identifikátor zákazky (projectId).' });
    }

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
        let query = supabase.from('projects').select('id, client_email, freelancer_name');
        if (isUuid) {
          query = query.eq('id', projectId);
        } else {
          query = query.ilike('slug', projectId);
        }
        const { data: dbProj, error: dbErr } = await query.maybeSingle();

        if (dbErr || !dbProj) {
          return res.status(404).json({
            success: false,
            error: 'Zákazka s týmto identifikátorom sa nenašla v databáze.'
          });
        }

        // Striktná kontrola: e-mail príjemcu musí zodpovedať klientovi uloženému v zákazke!
        if (!dbProj.client_email || dbProj.client_email.trim().toLowerCase() !== clientEmail.trim().toLowerCase()) {
          console.warn(`[send-reminder] Blocked phishing relay attempt: ${clientEmail} does not match DB ${dbProj.client_email}`);
          return res.status(403).json({
            success: false,
            error: 'Bezpečnostná chyba: E-mailová adresa príjemcu sa nezhoduje s registrovaným e-mailom klienta v projekte.'
          });
        }
      } catch (dbCheckErr) {
        console.warn('[send-reminder] DB project verification check warning:', dbCheckErr.message);
        return res.status(500).json({
          success: false,
          error: 'Chyba overenia zákazky v databáze.'
        });
      }
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Missing RESEND_API_KEY. Create a free account at https://resend.com and add the key to Environment Variables in Vercel (or .env).' 
      });
    }

    // Sanitize names (strip linebreaks and quotes for clean RFC headers)
    const cleanFreelancerName = String(freelancerName || 'Freelancer')
      .replace(/[\r\n\t"]/g, '')
      .trim() || 'Freelancer';
    const cleanClientName = String(clientName || 'Valued Client')
      .replace(/[\r\n\t"]/g, '')
      .trim() || 'Valued Client';
    const cleanProjectTitle = String(projectTitle)
      .replace(/[„“"']/g, '')
      .replace(/[\r\n\t]/g, ' ')
      .trim();

    // 1. Clean HTTPS URL (without hash fragments):
    let safePortalUrl = String(portalUrl || '').trim();
    const matchSlug = safePortalUrl.match(/[?&](?:p|project)=([^&#]+)/);
    const slug = matchSlug ? matchSlug[1] : '';

    if (safePortalUrl.startsWith('https://') && !safePortalUrl.includes('localhost') && !safePortalUrl.includes('127.0.0.1')) {
      safePortalUrl = safePortalUrl.split('#')[0];
    } else if (slug) {
      safePortalUrl = `https://usedropbrief.xyz/?p=${encodeURIComponent(slug)}`;
    } else {
      safePortalUrl = 'https://usedropbrief.xyz';
    }

    // 2. Email Subject:
    const emailSubject = customSubject && customSubject.trim().length > 3
      ? customSubject.replace(/[\r\n\t]/g, ' ').trim()
      : `${cleanFreelancerName}: ${cleanProjectTitle} – pending project assets`;

    const uniqueRef = Math.random().toString(36).substring(2, 7).toUpperCase();
    const currentDateStr = new Date().toLocaleDateString('en-US');

    // Text items
    const itemsListText = missingItems.length > 0 
      ? missingItems.map((item, idx) => `  ${idx + 1}. ${item.title}${item.description ? ` (${item.description})` : ''}`).join('\n')
      : '  - All requested project deliverables';

    const customNoteText = customMessage && customMessage.trim()
      ? `\nNote from ${cleanFreelancerName}:\n"${customMessage.trim()}"\n`
      : '';

    // Plain text version
    const plainTextContent = `Hi ${cleanClientName},

I am reaching out regarding project ${cleanProjectTitle}. To keep our timeline moving forward smoothly, we need the following deliverables from you:

${itemsListText}
${deadline ? `\nTarget delivery deadline: ${deadline}\n` : ''}${customNoteText}
You can easily upload these files directly via your secure project link:
${safePortalUrl}

If you have any questions, feel free to reply directly to this email.

Best regards,
${cleanFreelancerName}

[Ref: DB-${uniqueRef}]
`;

    // 3. Email Styles (Card & Personal):
    let htmlContent = '';

    if (emailStyle === 'card') {
      const itemsHtml = missingItems.length > 0
        ? missingItems.map((item) => `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 12px; vertical-align: top; width: 20px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #4f46e5; margin-top: 6px;"></div>
            </td>
            <td style="padding: 10px 12px 10px 0; vertical-align: middle;">
              <div style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 2px;">
                ${escapeHtml(item.title)}
              </div>
              ${item.description ? `<div style="font-size: 12px; color: #64748b; line-height: 1.4;">${escapeHtml(item.description)}</div>` : ''}
            </td>
          </tr>
        `).join('')
        : `<tr><td style="padding: 14px; color: #64748b; font-size: 14px;">Requested project deliverables</td></tr>`;

      const customNoteHtml = customMessage && customMessage.trim() ? `
        <div style="margin: 0 0 20px 0; padding: 14px 16px; background: #f1f5f9; border-left: 3px solid #4f46e5; border-radius: 4px;">
          <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
            Message from ${escapeHtml(cleanFreelancerName)}:
          </div>
          <div style="font-size: 13.5px; color: #334155; line-height: 1.5;">
            ${escapeHtml(customMessage.trim()).replace(/\n/g, '<br>')}
          </div>
        </div>
      ` : '';

      htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(emailSubject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding: 24px 28px 20px 28px; border-bottom: 1px solid #f1f5f9; background: #ffffff;">
              <div style="font-size: 17px; font-weight: 700; color: #0f172a;">
                ${escapeHtml(cleanFreelancerName)}
              </div>
              <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
                Project: <strong>${escapeHtml(cleanProjectTitle)}</strong>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 28px 24px 28px;">
              <p style="font-size: 15px; line-height: 1.5; color: #1e293b; margin: 0 0 16px 0;">
                Hi ${escapeHtml(cleanClientName)},
              </p>
              <p style="font-size: 14.5px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
                to keep work on <strong>${escapeHtml(cleanProjectTitle)}</strong> on schedule, we need to collect the following items:
              </p>
              ${customNoteHtml}
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #fafbfc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 20px;">
                ${itemsHtml}
              </table>
              ${deadline ? `
              <p style="font-size: 13.5px; color: #475569; margin: 0 0 22px 0;">
                <strong>Target deadline:</strong> ${escapeHtml(deadline)}
              </p>
              ` : ''}
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td align="left">
                    <a href="${escapeHtml(safePortalUrl)}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14.5px; font-weight: 600; text-decoration: none; padding: 12px 26px; border-radius: 6px;">
                      Upload Project Assets
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0 0 24px 0; word-break: break-all;">
                Direct link: <a href="${escapeHtml(safePortalUrl)}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${escapeHtml(safePortalUrl)}</a>
              </p>
              <p style="font-size: 13.5px; line-height: 1.5; color: #64748b; margin: 0;">
                If you have any questions, feel free to reply directly to this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; font-size: 12px; color: #94a3b8;">
              <div>Sender: <strong>${escapeHtml(cleanFreelancerName)}</strong> &bull; Ref: DB-${uniqueRef}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    } else {
      // Personal Style (default)
      const itemsListLi = missingItems.length > 0
        ? missingItems.map((item) => `
          <li style="margin-bottom: 6px;">
            <strong>${escapeHtml(item.title)}</strong>${item.description ? ` &ndash; <span style="color: #64748b;">${escapeHtml(item.description)}</span>` : ''}
          </li>
        `).join('')
        : `<li>Requested project deliverables</li>`;

      const customNoteBlock = customMessage && customMessage.trim() ? `
        <div style="margin: 12px 0 16px 0; padding: 10px 14px; background: #f8fafc; border-left: 3px solid #2563eb;">
          <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 3px;">Note from ${escapeHtml(cleanFreelancerName)}:</div>
          <div style="font-size: 14px; color: #334155;">${escapeHtml(customMessage.trim()).replace(/\n/g, '<br>')}</div>
        </div>
      ` : '';

      htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(emailSubject)}</title>
</head>
<body style="margin: 0; padding: 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b; background-color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto;">
    <p style="margin: 0 0 14px 0;">Hi ${escapeHtml(cleanClientName)},</p>
    
    <p style="margin: 0 0 14px 0;">
      I am reaching out regarding project <strong>${escapeHtml(cleanProjectTitle)}</strong>. To keep our timeline moving forward smoothly, we need the following deliverables from you:
    </p>

    ${customNoteBlock}

    <ul style="margin: 0 0 18px 0; padding-left: 22px; color: #1e293b;">
      ${itemsListLi}
    </ul>

    ${deadline ? `<p style="margin: 0 0 16px 0; color: #475569;">Target deadline: <strong>${escapeHtml(deadline)}</strong></p>` : ''}

    <p style="margin: 18px 0 18px 0;">
      You can easily upload these files directly via your secure project link:<br>
      <a href="${escapeHtml(safePortalUrl)}" style="color: #2563eb; text-decoration: underline; font-weight: 600; word-break: break-all;">
        ${escapeHtml(safePortalUrl)}
      </a>
    </p>

    <p style="margin: 0 0 16px 0;">
      If you have any questions about any of the items, feel free to reply directly to this email.
    </p>

    <p style="margin: 22px 0 0 0; color: #1e293b;">
      Best regards,<br>
      <strong>${escapeHtml(cleanFreelancerName)}</strong>
    </p>

    <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
      Delivered via DropBrief (${currentDateStr}) &bull; Ref: DB-${uniqueRef}
    </div>
  </div>
</body>
</html>`;
    }

    // Send via Resend API
    const safeSenderName = cleanFreelancerName.replace(/[<>"'\r\n]/g, '').trim() || 'DropBrief';
    let emailOnly = 'notifikacie@mail.usedropbrief.xyz';
    if (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.includes('@')) {
      emailOnly = process.env.RESEND_FROM_EMAIL.trim();
    } else if (process.env.RESEND_FROM) {
      const match = process.env.RESEND_FROM.match(/<([^>]+)>/);
      if (match) emailOnly = match[1].trim();
    }

    // Striktné zabezpečenie odosielania cez subdoménu
    if (emailOnly.toLowerCase().endsWith('@usedropbrief.xyz')) {
      const localPart = emailOnly.split('@')[0];
      emailOnly = `${localPart}@mail.usedropbrief.xyz`;
    }

    const resendFrom = `${safeSenderName} via DropBrief <${emailOnly}>`;

    const fromEmailMatch = resendFrom.match(/<([^>]+)>/);
    const cleanFromEmail = fromEmailMatch ? fromEmailMatch[1] : (process.env.RESEND_FROM_EMAIL || 'notifikacie@mail.usedropbrief.xyz');

    const resendPayload = {
      from: resendFrom,
      to: [clientEmail],
      subject: emailSubject,
      text: plainTextContent,
      html: htmlContent,
      headers: {
        'X-Entity-Ref-ID': `DB-${uniqueRef}`,
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All',
        'List-Unsubscribe': `<mailto:${cleanFromEmail}?subject=Unsubscribe>`,
      },
    };

    if (freelancerEmail && freelancerEmail.includes('@') && !freelancerEmail.includes('client.com')) {
      resendPayload.reply_to = freelancerEmail.trim();
    }

    let resendResponse;
    try {
      resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendPayload),
        signal: AbortSignal.timeout(8000), // 8s timeout pre prevenciu zaseknutia Serverless funkcie
      });
    } catch (networkErr) {
      if (networkErr.name === 'TimeoutError' || networkErr.name === 'AbortError') {
        throw new Error('Požiadavka na e-mailovú službu Resend vypršala (timeout 8s). Skontrolujte internetové spojenie a skúste to znovu.');
      }
      throw networkErr;
    }

    const resendData = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      let errText = resendData.error?.message || resendData.message || `Resend API error (${resendResponse.status})`;
      if (errText.includes('only send to') || errText.includes('verified email') || errText.includes('testing')) {
        errText += ' — Tip: In Resend free test mode without a custom domain, you can only send to your registration email. To send to external clients, verify a custom domain in Resend (resend.com/domains).';
      }
      throw new Error(errText);
    }

    return res.status(200).json({
      success: true,
      provider: 'resend',
      messageId: resendData.id,
      sentTo: clientEmail,
      subject: emailSubject,
      portalUrl: safePortalUrl,
      sentAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Resend email reminder error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred while sending email via Resend.',
    });
  }
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
