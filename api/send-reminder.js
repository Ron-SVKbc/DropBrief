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
      missingItems = []
    } = req.body || {};

    if (!clientEmail || !clientEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Neplatný alebo chýbajúci e-mail klienta.' });
    }

    if (!projectTitle) {
      return res.status(400).json({ success: false, error: 'Chýba názov projektu.' });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      return res.status(500).json({ 
        success: false, 
        error: 'Chýbajú Gmail SMTP údaje (GMAIL_USER alebo GMAIL_APP_PASSWORD v .env).' 
      });
    }

    const cleanPassword = gmailPassword.replace(/\s+/g, '');

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

    const cleanFreelancerName = (freelancerName || 'Freelancer').trim();
    const cleanClientName = (clientName || 'Vážený klient').trim();
    const replyToEmail = (freelancerEmail && freelancerEmail.includes('@')) ? freelancerEmail : gmailUser;

    // 🛡️ KRITICKÉ PRE ANTISPAM:
    // Nikdy nesmie odísť odkaz s "http://" alebo "localhost"!
    // Filtre ako Google a Outlook linky na localhost okamžite vyhodnotia ako phishing.
    let safePortalUrl = String(portalUrl || '').trim();
    if (!safePortalUrl || safePortalUrl.includes('localhost') || safePortalUrl.includes('127.0.0.1') || safePortalUrl.startsWith('http://')) {
      const matchSlug = safePortalUrl.match(/[?&]p=([^&]+)/);
      const slug = matchSlug ? matchSlug[1] : '';
      safePortalUrl = slug 
        ? `https://dropbrief.vercel.app/#client-portal?p=${slug}`
        : 'https://dropbrief.vercel.app';
    }

    // Čistý predmet bez emotikonov a špeciálnych úvodzoviek (zabraňuje spam-triggerom)
    const cleanProjectTitle = projectTitle.replace(/[„“"']/g, '').trim();
    const emailSubject = `Pripomienka: Podklady k zákazke - ${cleanProjectTitle}`;

    // 1. Čistá textová verzia (Spam skóre klesne na minimum)
    const itemsListText = missingItems.length > 0 
      ? missingItems.map((item, idx) => `  ${idx + 1}. ${item.title}${item.description ? ` (${item.description})` : ''}`).join('\n')
      : '  - Všetky požadované podklady k zákazke';

    const plainTextContent = `Dobrý deň, ${cleanClientName},

pripomínam sa s dodaním podkladov pre projekt ${cleanProjectTitle}.

K úspešnému pokračovaniu prác nám v zozname zostáva:
${itemsListText}

${deadline ? `Termín odovzdania: ${deadline}\n` : ''}
Podklady môžete jednoducho nahrať bez nutnosti prihlasovania alebo zadávania hesiel kliknutím na tento odkaz:
${safePortalUrl}

V prípade akýchkoľvek otázok môžete odpovedať priamo na tento e-mail.

S pozdravom,
${cleanFreelancerName}
`;

    // 2. Čistá, dôveryhodná HTML šablóna bez agresívnych spamových prvkov
    const itemsHtml = missingItems.length > 0
      ? missingItems.map((item) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 14px; vertical-align: middle; width: 24px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #4f46e5;"></div>
          </td>
          <td style="padding: 12px 14px 12px 0; vertical-align: middle;">
            <div style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 2px;">
              ${escapeHtml(item.title)}
            </div>
            ${item.description ? `<div style="font-size: 12px; color: #64748b;">${escapeHtml(item.description)}</div>` : ''}
          </td>
        </tr>
      `).join('')
      : `<tr><td style="padding: 14px; color: #64748b; font-size: 14px;">Požadované podklady k zákazke</td></tr>`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(emailSubject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 24px 28px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 18px; font-weight: 700; color: #0f172a;">
                      ${escapeHtml(cleanFreelancerName)}
                    </div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
                      Pripomienka k zákazke: <strong>${escapeHtml(cleanProjectTitle)}</strong>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 28px 28px 24px 28px;">
              <p style="font-size: 15px; line-height: 1.5; color: #1e293b; margin: 0 0 16px 0;">
                Dobrý deň, ${escapeHtml(cleanClientName)},
              </p>
              <p style="font-size: 14.5px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
                pripomínam sa s dodaním podkladov pre projekt <strong>${escapeHtml(cleanProjectTitle)}</strong>. Aby sme mohli plynule pokračovať v prácach, prosím o doplnenie zostávajúcich položiek:
              </p>

              <!-- Items List -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 24px;">
                ${itemsHtml}
              </table>

              ${deadline ? `
              <p style="font-size: 13.5px; color: #475569; margin: 0 0 24px 0;">
                <strong>Termín dokončenia / odovzdania:</strong> ${escapeHtml(deadline)}
              </p>
              ` : ''}

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="left">
                    <a href="${escapeHtml(safePortalUrl)}" target="_blank" style="display: inline-block; background: #4f46e5; color: #ffffff; font-size: 14.5px; font-weight: 600; text-decoration: none; padding: 13px 26px; border-radius: 6px;">
                      Nahrať požadované podklady
                    </a>
                    <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                      Odkaz nevyžaduje heslo ani registráciu.
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13.5px; line-height: 1.5; color: #64748b; margin: 0;">
                Ak máte akékoľvek otázky alebo potrebujete niečo upresniť, stačí odpovedať priamo na tento e-mail.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 28px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
              <div>Odosielateľ: <strong>${escapeHtml(cleanFreelancerName)}</strong> (${escapeHtml(replyToEmail)})</div>
              <div style="margin-top: 4px;">Bezpečný portál zberu podkladov pre klientov DropBrief.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // 🛡️ Nastavenie čistých hlavičiek (Ziadny "List-Unsubscribe" na osobných mailoch, lebo to spúšťa bulk marketing filter)
    const mailOptions = {
      from: `"${cleanFreelancerName}" <${gmailUser}>`,
      to: clientEmail,
      replyTo: replyToEmail,
      subject: emailSubject,
      text: plainTextContent,
      html: htmlContent,
      headers: {
        'X-Entity-Ref-ID': `dropbrief-${projectId || Date.now()}`,
      },
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      sentTo: clientEmail,
      sentAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Email reminder sending error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Nastala neočakávaná chyba pri odosielaní e-mailu cez Gmail SMTP.',
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
