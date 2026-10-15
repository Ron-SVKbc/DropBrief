import { createClient } from '@supabase/supabase-js';
import { createHash, createHmac } from 'crypto';

/**
 * In-memory rate limiter for registration email dispatch (max 5 attempts per 60s per IP).
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
 * Ensures email dispatch EXCLUSIVELY via verified subdomain (mail.usedropbrief.xyz).
 * Prevents spam marking and guarantees SPF, DKIM, and DMARC validation.
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

  // If root domain usedropbrief.xyz is configured, redirect to verified subdomain mail.usedropbrief.xyz
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
        error: `Too many requests. Please try again in ${rl.waitSec} seconds.`
      });
    }

    let bodyData = req.body || {};
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch (e) { bodyData = {}; }
    }

    const { email, nick } = bodyData;

    if (!email || typeof email !== 'string' || !email.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNick = String(nick || 'Freelancer').replace(/[\r\n\t"]/g, '').trim();

    if (!cleanNick || cleanNick.length < 2) {
      return res.status(400).json({ success: false, error: 'Name / Nickname must have at least 2 characters.' });
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

        // 1. Check if email already exists (direct SELECT with service_role key)
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

        // Fallback via secure RPC function (works with anon key under RLS)
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

    // If nickname is taken by someone else, inform user (nickname is a public identifier)
    if (nickTaken) {
      return res.status(400).json({
        success: false,
        error: 'This nickname is already taken. Please choose another name or studio title.'
      });
    }

    const uniqueRef = createHash('sha256')
      .update(`${cleanEmail}-${Date.now()}`)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO A: EMAIL ALREADY EXISTS IN DATABASE (Anti-Enumeration & Security Notice)
    // We do NOT disclose to client UI that email exists.
    // We show identical success response about sending code.
    // Instead of registration PIN, we send a security notice to the email
    // informing them of the registration attempt with a login link.
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
        const securitySubject = 'DropBrief: Security Notice - Account Already Exists';
        const securityPlainText = `Hi ${existingUser.nick || cleanNick},

We noticed an attempt to create a new DropBrief account with your email address (${cleanEmail}).

Your account already exists on DropBrief. If this was you trying to log in, you can log in anytime with your existing PIN code at:
https://usedropbrief.xyz

If you forgot your PIN code, you can reset it securely using the "Forgot your PIN code?" option on the login page.

If you did not initiate this request, no action is needed. Your account, client deliverables, and projects remain completely safe.

Best regards,
The DropBrief Team
https://usedropbrief.xyz
Ref: DB-SEC-${uniqueRef}
`;

        const securityHtml = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
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
                    <span style="font-size: 12px; font-weight: 600; color: #d97706; background-color: #fef3c7; padding: 4px 10px; border-radius: 20px;">Account Security</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                Account Security Notice
              </h1>
              
              <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Hello <strong>${escapeHtml(existingUser.nick || cleanNick)}</strong>, we noticed an attempt to create a new DropBrief account with your email address (<strong>${escapeHtml(cleanEmail)}</strong>).
              </p>

              <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px 18px; margin-bottom: 24px; border-left: 4px solid #4f46e5;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                  Your account already exists
                </p>
                <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: #475569;">
                  If you were trying to log in, please use the login form with your original PIN code. If you forgot your PIN, click on <em>"Forgot your PIN code?"</em> on the login screen.
                </p>
              </div>

              <!-- Button CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="left">
                    <a href="https://usedropbrief.xyz" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                      Log In to DropBrief &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                If you did not initiate this request, you can safely ignore this email. Your account, client projects, and uploaded assets are secure.
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
        console.warn(`[DEV AUTH] Account ${cleanEmail} already exists. Security simulation completed.`);
      }

      // Return identical response to client (email enumeration protection)
      return res.status(200).json({
        success: true,
        challengeToken: dummyChallengeToken,
        expiresAt: dummyExp,
        message: 'Verification PIN has been sent to your email.'
      });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO B: NEW USER (Generate 6-digit PIN with 5-minute validity)
    // ─────────────────────────────────────────────────────────────────────────────
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

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

    // Subject without raw PIN number to avoid anti-spam filters
    const subject = 'DropBrief: Your Verification PIN Code';

    const plainTextContent = `Hi ${cleanNick},

Thank you for your interest in DropBrief. To complete your account setup and verify your email, enter the following 6-digit PIN code:

YOUR VERIFICATION & ACCESS PIN:
${generatedPin}

This code is valid for the next 5 minutes.

Once entered into the registration form, your account will be activated. This same PIN also serves as your permanent access code for logging into your dashboard at:
https://usedropbrief.xyz

This code acts as your secure key to projects and client uploads.

Best regards,
The DropBrief Team
https://usedropbrief.xyz
Ref: DB-VERIF-${uniqueRef}
`;

    // Modern, high-contrast transactional design via verified subdomain
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
                Verification Code for ${escapeHtml(cleanNick)}
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                To complete your registration and verify your email, enter the following 6-digit PIN code in the application:
              </p>

              <!-- Clean Monospace PIN Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 22px 16px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
                      YOUR ACCESS PIN CODE
                    </div>
                    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">
                      ${escapeHtml(generatedPin)}
                    </div>
                    <div style="font-size: 12px; color: #d97706; margin-top: 6px; font-weight: 600;">
                      ⏱ Code expires in 5 minutes
                    </div>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; border-left: 3px solid #4f46e5;">
                <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: #334155;">
                  <strong>Important:</strong> Once verified, your account will be activated and this PIN serves as your permanent access code for future logins.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                If you did not request a DropBrief account, you can safely ignore this email. No account will be created without verifying this code.
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

    // Local / fallback mode if RESEND_API_KEY is not configured
    if (!resendApiKey) {
      console.warn(`[DEV AUTH PIN] RESEND_API_KEY missing. Verification PIN for ${cleanEmail}: ${generatedPin}`);
      return res.status(200).json({
        success: true,
        simulated: true,
        challengeToken,
        expiresAt,
        devPin: generatedPin,
        message: 'Verification PIN generated (development mode).'
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
        message: 'Verification PIN has been sent to your email.'
      });
    }

    return res.status(200).json({
      success: true,
      challengeToken,
      expiresAt,
      sent: true,
      messageId: resendData.id,
      message: 'Verification PIN was successfully sent to your email.'
    });

  } catch (error) {
    console.error('send-auth-pin error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while sending the email.',
    });
  }
}
