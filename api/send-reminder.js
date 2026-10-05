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
      customSubject = ''
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

    // 🛡️ 1. OCHRANA PRED SPAMOM - ČISTÁ, ŠTANDARDNÁ HTTPS DOMÉNA:
    // Nikdy nesmie odísť odkaz s localhostom, neštandardným portom alebo fragmentom #client-portal?p=...
    // Vytvárame štandardné a dôveryhodné HTTPS URL bez podozrivých znakov: https://dropbrief.vercel.app/?p=slug
    let safePortalUrl = String(portalUrl || '').trim();
    const matchSlug = safePortalUrl.match(/[?&](?:p|project)=([^&#]+)/);
    const slug = matchSlug ? matchSlug[1] : '';

    if (slug) {
      safePortalUrl = `https://dropbrief.vercel.app/?p=${encodeURIComponent(slug)}`;
    } else if (safePortalUrl.startsWith('https://') && !safePortalUrl.includes('localhost') && !safePortalUrl.includes('127.0.0.1')) {
      safePortalUrl = safePortalUrl.split('#')[0]; // odstránenie fragmentu
    } else {
      safePortalUrl = 'https://dropbrief.vercel.app';
    }

    // 🛡️ 2. OCHRANA PRED SPAMOM - ČISTÝ PREDMET BEZ SPAMOVÝCH SPÚŠŤAČOV:
    // Vyhýbame sa slovám ako "Pripomienka:", "URGENTNÉ", výkričníkom a emotikonom,
    // ktoré algoritmy Gmailu a Outlooku okamžite radia do Spamu alebo Reklám.
    const emailSubject = customSubject && customSubject.trim().length > 3
      ? customSubject.replace(/[\r\n\t]/g, ' ').trim()
      : `Podklady k projektu: ${cleanProjectTitle}`;

    // 🛡️ 3. OCHRANA PRED SPAMOM - TEXT BEZ PHISHINGOVÝCH KĽÚČOVÝCH SLOV:
    // Nikdy nepoužívame slová ako "heslo", "zadávanie hesiel", "registrácia", "kliknite na odkaz".
    // Heuristické antispam filtre tieto slová priraďujú k phishingu / zberu prihlasovacích údajov!
    const itemsListText = missingItems.length > 0 
      ? missingItems.map((item, idx) => `  ${idx + 1}. ${item.title}${item.description ? ` (${item.description})` : ''}`).join('\n')
      : '  - Všetky požadované podklady k projektu';

    const customNoteText = customMessage && customMessage.trim()
      ? `\nOsobná správa od ${cleanFreelancerName}:\n"${customMessage.trim()}"\n`
      : '';

    const plainTextContent = `Dobrý deň, ${cleanClientName},

pre úspešné pokračovanie prác na projekte ${cleanProjectTitle} by sme potrebovali doplniť nasledujúce podklady:

${itemsListText}
${deadline ? `\nPredpokladaný termín dokončenia: ${deadline}\n` : ''}${customNoteText}
Podklady môžete pohodlne nahrať priamo cez zabezpečený portál projektu:
${safePortalUrl}

V prípade akýchkoľvek otázok stačí odpovedať na tento e-mail.

S pozdravom,
${cleanFreelancerName}
DropBrief • Portál zberu podkladov
`;

    // 🛡️ 4. OCHRANA PRED SPAMOM - PROFESIONÁLNA, ČISTÁ HTML ŠABLÓNA:
    // - Vysoký pomer textu voči HTML kódu (Text-to-HTML ratio)
    // - Neviditeľný preheader text pre pekný náhľad v doručenej pošte
    // - Transparentné zobrazenie cieľového odkazu (zabraňuje označeniu ako skrytý phishing)
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

    const htmlContent = `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(emailSubject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Neviditeľný preheader pre náhľad v schránke -->
  <div style="display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Prehľad podkladov potrebných k projektu ${escapeHtml(cleanProjectTitle)} od ${escapeHtml(cleanFreelancerName)}.
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          
          <!-- Hlavička -->
          <tr>
            <td style="padding: 24px 28px 20px 28px; border-bottom: 1px solid #f1f5f9; background: #ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.2px;">
                      ${escapeHtml(cleanFreelancerName)}
                    </div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
                      Zákazka: <strong>${escapeHtml(cleanProjectTitle)}</strong>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Telo správy -->
          <tr>
            <td style="padding: 28px 28px 24px 28px;">
              <p style="font-size: 15px; line-height: 1.5; color: #1e293b; margin: 0 0 16px 0;">
                Dobrý deň, ${escapeHtml(cleanClientName)},
              </p>
              <p style="font-size: 14.5px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
                pre plynulé pokračovanie prác na projekte <strong>${escapeHtml(cleanProjectTitle)}</strong> potrebujeme doplniť nasledujúce podklady:
              </p>

              ${customNoteHtml}

              <!-- Zoznam položiek -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #fafbfc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 20px;">
                ${itemsHtml}
              </table>

              ${deadline ? `
              <p style="font-size: 13.5px; color: #475569; margin: 0 0 22px 0;">
                <strong>Predpokladaný termín dokončenia:</strong> ${escapeHtml(deadline)}
              </p>
              ` : ''}

              <!-- Tlačidlo na portál -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                <tr>
                  <td align="left">
                    <a href="${escapeHtml(safePortalUrl)}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14.5px; font-weight: 600; text-decoration: none; padding: 12px 26px; border-radius: 6px;">
                      Nahrať podklady k projektu
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Transparentný odkaz (zásadné pre anti-phishing overenie filtrov) -->
              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0 0 24px 0; word-break: break-all;">
                Priamy odkaz: <a href="${escapeHtml(safePortalUrl)}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${escapeHtml(safePortalUrl)}</a>
              </p>

              <p style="font-size: 13.5px; line-height: 1.5; color: #64748b; margin: 0;">
                V prípade akýchkoľvek otázok stačí odpovedať priamo na tento e-mail.
              </p>

            </td>
          </tr>

          <!-- Pätička -->
          <tr>
            <td style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
              <div>Odosielateľ: <strong>${escapeHtml(cleanFreelancerName)}</strong></div>
              <div style="margin-top: 2px;">Doručené cez DropBrief • Zabezpečený zber podkladov (GDPR EÚ).</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // 🛡️ 5. OCHRANA PRED SPAMOM - ČISTÉ EMAIL HLAVIČKY (RFC 2822):
    // Zodpovedajúci odosielateľ, korektné Reply-To bez duplicity, štandardná priorita.
    const isCustomReplyEmail = freelancerEmail && 
      freelancerEmail.includes('@') && 
      freelancerEmail.toLowerCase().trim() !== gmailUser.toLowerCase().trim() &&
      !freelancerEmail.includes('klient.sk');

    const mailOptions = {
      from: `"${cleanFreelancerName} (DropBrief)" <${gmailUser}>`,
      to: `"${cleanClientName}" <${clientEmail}>`,
      subject: emailSubject,
      text: plainTextContent,
      html: htmlContent,
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
      },
    };

    if (isCustomReplyEmail) {
      mailOptions.replyTo = `"${cleanFreelancerName}" <${freelancerEmail.trim()}>`;
    }

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      sentTo: clientEmail,
      subject: emailSubject,
      portalUrl: safePortalUrl,
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
