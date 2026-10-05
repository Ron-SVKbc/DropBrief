import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metóda nie je povolená. Použite POST.' });
  }

  try {
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
      emailStyle = 'personal' // 'personal' (odporúčané pre 100% inbox) | 'card'
    } = req.body || {};

    if (!clientEmail || !clientEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Neplatný alebo chýbajúci e-mail klienta.' });
    }

    if (!projectTitle) {
      return res.status(400).json({ success: false, error: 'Chýba názov projektu.' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!resendApiKey && (!gmailUser || !gmailPassword)) {
      return res.status(500).json({ 
        success: false, 
        error: 'Chýbajú e-mailové konfiguračné údaje (RESEND_API_KEY alebo GMAIL_USER v .env).' 
      });
    }

    // Sanitizácia mien (odstránenie úvodzoviek a nebezpečných znakov pre RFC hlavičky)
    const cleanFreelancerName = String(freelancerName || 'Freelancer')
      .replace(/[\r\n\t"]/g, '')
      .trim() || 'Freelancer';
    const cleanClientName = String(clientName || 'Vážený klient')
      .replace(/[\r\n\t"]/g, '')
      .trim() || 'Vážený klient';
    const cleanProjectTitle = String(projectTitle)
      .replace(/[„“"']/g, '')
      .replace(/[\r\n\t]/g, ' ')
      .trim();

    // 🛡️ 1. ČISTÉ HTTPS URL (bez fragmentu a bez podozrivých portov):
    let safePortalUrl = String(portalUrl || '').trim();
    const matchSlug = safePortalUrl.match(/[?&](?:p|project)=([^&#]+)/);
    const slug = matchSlug ? matchSlug[1] : '';

    if (slug) {
      safePortalUrl = `https://dropbrief.vercel.app/?p=${encodeURIComponent(slug)}`;
    } else if (safePortalUrl.startsWith('https://') && !safePortalUrl.includes('localhost') && !safePortalUrl.includes('127.0.0.1')) {
      safePortalUrl = safePortalUrl.split('#')[0];
    } else {
      safePortalUrl = 'https://dropbrief.vercel.app';
    }

    // 🛡️ 2. VARIABILNÝ PREDMET BEZ SPAMOVÝCH SPÚŠŤAČOV (pretrhne hash predchádzajúceho spamu):
    const emailSubject = customSubject && customSubject.trim().length > 3
      ? customSubject.replace(/[\r\n\t]/g, ' ').trim()
      : `${cleanFreelancerName}: ${cleanProjectTitle} – doplnenie podkladov`;

    // Unikátny referenčný kód na pretrhnutie odtlačku predchádzajúceho spamu
    const uniqueRef = Math.random().toString(36).substring(2, 7).toUpperCase();
    const currentDateStr = new Date().toLocaleDateString('sk-SK');

    // Text položiek
    const itemsListText = missingItems.length > 0 
      ? missingItems.map((item, idx) => `  ${idx + 1}. ${item.title}${item.description ? ` (${item.description})` : ''}`).join('\n')
      : '  - Všetky požadované podklady k projektu';

    const customNoteText = customMessage && customMessage.trim()
      ? `\nPoznámka od ${cleanFreelancerName}:\n"${customMessage.trim()}"\n`
      : '';

    // Čistá textová verzia
    const plainTextContent = `Dobrý deň, ${cleanClientName},

píšem Vám ohľadom projektu ${cleanProjectTitle}. K plynulému pokračovaniu prác potrebujeme od Vás doplniť nasledujúce podklady:

${itemsListText}
${deadline ? `\nPredpokladaný termín: ${deadline}\n` : ''}${customNoteText}
Podklady môžete nahrať priamo cez odkaz projektu:
${safePortalUrl}

V prípade akýchkoľvek otázok stačí odpovedať priamo na tento e-mail.

S pozdravom,
${cleanFreelancerName}

[Ref: DB-${uniqueRef}]
`;

    // 🛡️ 3. DVA ŠTÝLY E-MAILU:
    // A) OSOBNÝ PRIRODZENÝ ŠTÝL (100% Inbox garancia - žiadny marketingový table wrapper, pôsobí ako ručne písaný e-mail)
    // B) DIZAJNOVÁ KARTA (Formátovaná karta s tlačidlom)

    let htmlContent = '';

    if (emailStyle === 'personal') {
      const itemsListLi = missingItems.length > 0
        ? missingItems.map((item) => `
          <li style="margin-bottom: 6px;">
            <strong>${escapeHtml(item.title)}</strong>${item.description ? ` &ndash; <span style="color: #64748b;">${escapeHtml(item.description)}</span>` : ''}
          </li>
        `).join('')
        : `<li>Požadované podklady k projektu</li>`;

      const customNoteBlock = customMessage && customMessage.trim() ? `
        <div style="margin: 12px 0 16px 0; padding: 10px 14px; background: #f8fafc; border-left: 3px solid #2563eb;">
          <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 3px;">Poznámka od ${escapeHtml(cleanFreelancerName)}:</div>
          <div style="font-size: 14px; color: #334155;">${escapeHtml(customMessage.trim()).replace(/\n/g, '<br>')}</div>
        </div>
      ` : '';

      htmlContent = `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(emailSubject)}</title>
</head>
<body style="margin: 0; padding: 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b; background-color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto;">
    <p style="margin: 0 0 14px 0;">Dobrý deň, ${escapeHtml(cleanClientName)},</p>
    
    <p style="margin: 0 0 14px 0;">
      píšem Vám ohľadom projektu <strong>${escapeHtml(cleanProjectTitle)}</strong>. Aby sme mohli plynule pokračovať v prácach, potrebovali by sme od Vás doplniť nasledujúce podklady:
    </p>

    ${customNoteBlock}

    <ul style="margin: 0 0 18px 0; padding-left: 22px; color: #1e293b;">
      ${itemsListLi}
    </ul>

    ${deadline ? `<p style="margin: 0 0 16px 0; color: #475569;">Termín odovzdania: <strong>${escapeHtml(deadline)}</strong></p>` : ''}

    <p style="margin: 18px 0 18px 0;">
      Podklady môžete pohodlne nahrať priamo cez odkaz projektu:<br>
      <a href="${escapeHtml(safePortalUrl)}" style="color: #2563eb; text-decoration: underline; font-weight: 600; word-break: break-all;">
        ${escapeHtml(safePortalUrl)}
      </a>
    </p>

    <p style="margin: 0 0 16px 0;">
      Ak máte k jednotlivým položkám akékoľvek otázky, kedykoľvek odpovedzte priamo na tento e-mail.
    </p>

    <p style="margin: 22px 0 0 0; color: #1e293b;">
      S pozdravom,<br>
      <strong>${escapeHtml(cleanFreelancerName)}</strong>
    </p>

    <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
      Doručené cez DropBrief (${currentDateStr}) &bull; Ref: DB-${uniqueRef}
    </div>
  </div>
</body>
</html>`;
    } else {
      // Dizajnová karta
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
        : `<tr><td style="padding: 14px; color: #64748b; font-size: 14px;">Požadované podklady k zákazke</td></tr>`;

      const customNoteHtml = customMessage && customMessage.trim() ? `
        <div style="margin: 0 0 20px 0; padding: 14px 16px; background: #f1f5f9; border-left: 3px solid #4f46e5; border-radius: 4px;">
          <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
            Správa od ${escapeHtml(cleanFreelancerName)}:
          </div>
          <div style="font-size: 13.5px; color: #334155; line-height: 1.5;">
            ${escapeHtml(customMessage.trim()).replace(/\n/g, '<br>')}
          </div>
        </div>
      ` : '';

      htmlContent = `<!DOCTYPE html>
<html lang="sk">
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
                Projekt: <strong>${escapeHtml(cleanProjectTitle)}</strong>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 28px 24px 28px;">
              <p style="font-size: 15px; line-height: 1.5; color: #1e293b; margin: 0 0 16px 0;">
                Dobrý deň, ${escapeHtml(cleanClientName)},
              </p>
              <p style="font-size: 14.5px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
                pre plynulé pokračovanie prác na projekte <strong>${escapeHtml(cleanProjectTitle)}</strong> potrebujeme doplniť nasledujúce podklady:
              </p>
              ${customNoteHtml}
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #fafbfc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 20px;">
                ${itemsHtml}
              </table>
              ${deadline ? `
              <p style="font-size: 13.5px; color: #475569; margin: 0 0 22px 0;">
                <strong>Termín dokončenia:</strong> ${escapeHtml(deadline)}
              </p>
              ` : ''}
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td align="left">
                    <a href="${escapeHtml(safePortalUrl)}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14.5px; font-weight: 600; text-decoration: none; padding: 12px 26px; border-radius: 6px;">
                      Nahrať podklady k projektu
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0 0 24px 0; word-break: break-all;">
                Priamy odkaz: <a href="${escapeHtml(safePortalUrl)}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${escapeHtml(safePortalUrl)}</a>
              </p>
              <p style="font-size: 13.5px; line-height: 1.5; color: #64748b; margin: 0;">
                V prípade otázok stačí odpovedať na tento e-mail.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; font-size: 12px; color: #94a3b8;">
              <div>Odosielateľ: <strong>${escapeHtml(cleanFreelancerName)}</strong> &bull; Ref: DB-${uniqueRef}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }

    const isCustomReplyEmail = freelancerEmail && 
      freelancerEmail.includes('@') && 
      freelancerEmail.toLowerCase().trim() !== (gmailUser || '').toLowerCase().trim() &&
      !freelancerEmail.includes('klient.sk');

    // 🚀 A. ODOSIELANIE CEZ TRANSAKČNÝ RESEND API (ak je nakonfigurovaný RESEND_API_KEY)
    if (resendApiKey) {
      const resendFrom = process.env.RESEND_FROM || `DropBrief <onboarding@resend.dev>`;
      const resendPayload = {
        from: resendFrom,
        to: [clientEmail],
        subject: emailSubject,
        text: plainTextContent,
        html: htmlContent,
      };

      if (isCustomReplyEmail) {
        resendPayload.reply_to = freelancerEmail.trim();
      }

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendPayload),
      });

      const resendData = await resendResponse.json();
      if (!resendResponse.ok) {
        throw new Error(resendData.message || 'Chyba Resend API pri odosielaní.');
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
    }

    // 🚀 B. ODOSIELANIE CEZ GMAIL SMTP (Fallback)
    const cleanPassword = gmailPassword ? gmailPassword.replace(/\s+/g, '') : '';

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: cleanPassword,
      },
      connectionTimeout: 10000,
    });

    const mailOptions = {
      from: `"${cleanFreelancerName}" <${gmailUser}>`,
      to: `"${cleanClientName}" <${clientEmail}>`,
      subject: emailSubject,
      text: plainTextContent,
      html: htmlContent,
    };

    if (isCustomReplyEmail) {
      mailOptions.replyTo = `"${cleanFreelancerName}" <${freelancerEmail.trim()}>`;
    }

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      provider: 'gmail_smtp',
      messageId: info.messageId,
      sentTo: clientEmail,
      subject: emailSubject,
      portalUrl: safePortalUrl,
      emailStyle: emailStyle,
      refId: uniqueRef,
      sentAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Email reminder sending error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Nastala neočakávaná chyba pri odosielaní e-mailu.',
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
