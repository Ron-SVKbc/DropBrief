import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

/**
 * In-memory rate limiter for PIN code reset (max 3 attempts per 10 minutes per IP).
 * Protects against abuse of email dispatch.
 */
const resetAttempts = new Map();
const WINDOW_MS = 10 * 60 * 1_000; // 10 minutes
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
        error: `Too many PIN reset requests. Please try again in ${Math.ceil(rl.waitSec / 60)} minutes.`
      });
    }

    let bodyData = req.body || {};
    if (typeof bodyData === 'string') {
      try { bodyData = JSON.parse(bodyData); } catch (e) { bodyData = {}; }
    }

    const { email } = bodyData;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
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

      // Generate new 6-digit PIN and hash
      newGeneratedPin = Math.floor(100000 + Math.random() * 900000).toString();
      const newSaltedHash = hashPin(newGeneratedPin, true);

      // 1. Primary: Secure RPC function (SECURITY DEFINER bypasses RLS and works with anon or service_role)
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

      // 2. Secondary (fallback): Direct query via service-role key
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

    // Send email via Resend (if user exists and Resend is configured)
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

        // Guarantee verified subdomain
        if (emailToUse.toLowerCase().endsWith('@usedropbrief.xyz')) {
          const localPart = emailToUse.split('@')[0];
          emailToUse = `${localPart}@mail.usedropbrief.xyz`;
        }

        const resendFrom = `${senderName} <${emailToUse}>`;
        const replyToEmail = process.env.RESEND_REPLY_TO?.trim() || 'support@usedropbrief.xyz';

        // Subject without raw PIN code to avoid anti-spam filters
        const subject = 'DropBrief: Access PIN Reset';

        const uniqueRef = createHash('sha256')
          .update(`${cleanEmail}-${Date.now()}-${newGeneratedPin}`)
          .digest('hex')
          .substring(0, 8)
          .toUpperCase();

        const plainTextContent = `Hi ${userNick},

Based on your request, we have generated a new 6-digit PIN code for your account.

YOUR NEW ACCESS PIN CODE:
${newGeneratedPin}

You can log into your dashboard anytime by entering your name (${userNick}) or your email (${cleanEmail}) and this new PIN at:
https://usedropbrief.xyz

Your previous PIN code has been invalidated for security reasons.

Best regards,
The DropBrief Team
https://usedropbrief.xyz
Ref: DB-RESET-${uniqueRef}
`;

        const htmlContent = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
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
                    <span style="font-size: 12px; font-weight: 600; color: #d97706; background-color: #fef3c7; padding: 4px 10px; border-radius: 20px;">PIN Code Reset</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                Hi ${escapeHtml(userNick)},
              </h1>
              
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Based on your request, we have generated a new 6-digit numeric PIN for your account. Your previous PIN code has been invalidated for security reasons:
              </p>

              <!-- Clean Monospace PIN Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 22px 16px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
                      YOUR NEW PIN CODE
                    </div>
                    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">
                      ${escapeHtml(newGeneratedPin)}
                    </div>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; border-left: 3px solid #4f46e5;">
                <p style="margin: 0; font-size: 13.5px; line-height: 1.5; color: #334155;">
                  <strong>How to log in:</strong> Enter your username <strong>${escapeHtml(userNick)}</strong> or email <strong>${escapeHtml(cleanEmail)}</strong> and this new PIN code.
                </p>
              </div>

              <!-- Button CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="left">
                    <a href="https://usedropbrief.xyz" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                      Log In to DropBrief &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                If you did not request a PIN reset, we recommend logging in to verify your projects. This code was delivered exclusively to your email inbox.
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
        console.warn(`[DEV RESET PIN] RESEND_API_KEY missing. New PIN for ${cleanEmail}: ${newGeneratedPin}`);
      }
    }

    // Security response (identical regardless of whether email exists in DB – enumeration prevention)
    return res.status(200).json({
      success: true,
      message: 'If this email is registered with us, a new PIN code has just been sent to your inbox.'
    });

  } catch (error) {
    console.error('reset-pin unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing your request.'
    });
  }
}
