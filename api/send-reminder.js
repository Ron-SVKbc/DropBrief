import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Povolenie iba POST metódy
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

    // 1. Validácia vstupných dát
    if (!clientEmail || !clientEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Neplatný alebo chýbajúci e-mail klienta.' });
    }

    if (!projectTitle || !portalUrl) {
      return res.status(400).json({ success: false, error: 'Chýbajú povinné údaje o projekte alebo odkaz na portál.' });
    }

    // 2. Kontrola prihlasovacích údajov Gmail SMTP
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      return res.status(500).json({ 
        success: false, 
        error: 'Chýbajú Gmail SMTP údaje v prostredí servera (GMAIL_USER alebo GMAIL_APP_PASSWORD).' 
      });
    }

    // Odstránenie prípadných medzier z 16-miestneho hesla aplikácie
    const cleanPassword = gmailPassword.replace(/\s+/g, '');

    // 3. Konfigurácia Nodemailer Gmail SMTP transportéra
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL port 465
      auth: {
        user: gmailUser,
        pass: cleanPassword,
      },
      // Zvýšený timeout pre spoľahlivosť
      connectionTimeout: 10000,
    });

    const cleanFreelancerName = (freelancerName || 'Váš freelancer').trim();
    const cleanClientName = (clientName || 'Vážený klient').trim();
    const replyToEmail = (freelancerEmail && freelancerEmail.includes('@')) ? freelancerEmail : gmailUser;

    // 4. Príprava textovej verzie (Antispam: multipart text/plain je nevyhnutný pre 100 % doručiteľnosť)
    const itemsListText = missingItems.length > 0 
      ? missingItems.map((item, idx) => `  ${idx + 1}. ${item.title}${item.description ? ` (${item.description})` : ''}`).join('\n')
      : '  - Všetky požadované podklady k zákazke';

    const plainTextContent = `Dobrý deň, ${cleanClientName},

pripomíname sa s dodaním podkladov pre projekt „${projectTitle}“ od zadávateľa ${cleanFreelancerName}.

K úspešnému pokračovaniu a dokončeniu nám v zozname zostáva:
${itemsListText}

${deadline ? `Termín odovzdania: ${deadline}\n` : ''}
Podklady môžete jednoducho nahrať bez nutnosti prihlasovania alebo zadávania hesiel kliknutím na tento odkaz:
${portalUrl}

Stačí súbory pretiahnuť a potvrdiť.

V prípade akýchkoľvek otázok môžete odpovedať priamo na tento e-mail.

S pozdravom,
${cleanFreelancerName}
Prostredníctvom DropBrief • Bezpečný zber podkladov
`;

    // 5. Príprava modernej a bezpečnej HTML šablóny s inline CSS (funguje bezchybne v Gmaili, Outlooku aj Apple Mail)
    const itemsHtml = missingItems.length > 0
      ? missingItems.map((item) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 14px; vertical-align: top; width: 28px;">
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #fef3c7; color: #d97706; text-align: center; line-height: 22px; font-size: 13px; font-weight: bold;">
              ⏳
            </div>
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
  <title>Pripomienka: Podklady k zákazke ${escapeHtml(projectTitle)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
          
          <!-- Top Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 24px 28px; color: #ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255, 255, 255, 0.85); margin-bottom: 4px;">
                      DropBrief • Portál zberu podkladov
                    </div>
                    <div style="font-size: 20px; font-weight: 800; color: #ffffff; line-height: 1.3;">
                      ⏳ Pripomienka k zákazke
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <div style="background: rgba(255, 255, 255, 0.2); padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #ffffff; display: inline-block;">
                      ${cleanFreelancerName}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 28px 20px 28px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0;">
                Dobrý deň, ${escapeHtml(cleanClientName)},
              </h2>
              <p style="font-size: 14.5px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
                pripomíname sa s dodaním podkladov pre projekt <strong>${escapeHtml(projectTitle)}</strong>. Aby sme mohli plynule pokračovať v prácach, potrebujeme od vás doplniť zostávajúce položky:
              </p>

              <!-- Items List Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 24px;">
                ${itemsHtml}
              </table>

              ${deadline ? `
              <div style="font-size: 13px; color: #64748b; margin-bottom: 22px; display: flex; align-items: center;">
                📅 <strong>Termín dokončenia / odovzdania:</strong>&nbsp;<span style="color: #0f172a; font-weight: 600;">${escapeHtml(deadline)}</span>
              </div>
              ` : ''}

              <!-- Big CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${escapeHtml(portalUrl)}" target="_blank" style="display: inline-block; background: #6366f1; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); text-align: center;">
                      🚀 Otvoriť portál a nahrať podklady
                    </a>
                    <div style="font-size: 12px; color: #64748b; margin-top: 10px;">
                      ✓ Bez nutnosti registrácie a zadávania hesiel • Stačí kliknúť
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Explanation box -->
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 14px; font-size: 12.5px; color: #166534; line-height: 1.5;">
                <strong>Ako to funguje?</strong> Po kliknutí na odkaz vyššie sa vám otvorí zabezpečený portál priamo pre váš projekt, kde môžete súbory jednoducho pretiahnuť (drag & drop) alebo zadať požadovaný text.
              </div>

            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 28px; font-size: 12px; color: #94a3b8; line-height: 1.6;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div>Odoslané používateľom <strong>${escapeHtml(cleanFreelancerName)}</strong> (${escapeHtml(replyToEmail)}).</div>
                    <div>Ak máte otázky, stačí <strong>odpovedať na tento e-mail</strong>.</div>
                    <div style="margin-top: 8px; font-size: 11px; color: #cbd5e1;">
                      Bezpečný prenos dát • DropBrief EÚ (GDPR Compliant)
                    </div>
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
</html>
`;

    // 6. Odoslanie e-mailu cez Gmail SMTP
    const info = await transporter.sendMail({
      from: `"${cleanFreelancerName} via DropBrief" <${gmailUser}>`,
      to: clientEmail,
      replyTo: replyToEmail,
      subject: `⏳ Pripomienka: Chýbajúce podklady k zákazke „${projectTitle}“`,
      text: plainTextContent,
      html: htmlContent,
      headers: {
        'X-DropBrief-Project': String(projectId || ''),
        'List-Unsubscribe': `<mailto:${replyToEmail}?subject=Unsubscribe%20DropBrief>`,
      },
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
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
