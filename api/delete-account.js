import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

/**
 * 🔒 In-memory rate limiter per IP + identifier
 * Protection against brute-force account deletion attempts
 */
const deleteAttempts = new Map();
const WINDOW_MS = 60 * 1_000; // 60 seconds
const MAX_ATTEMPTS = 5;

function rateLimitKey(ip, identifier) {
  return `${ip}___del___${(identifier || '').toLowerCase()}`;
}

function checkRateLimit(key) {
  const now = Date.now();
  const record = deleteAttempts.get(key);

  if (!record || now - record.since > WINDOW_MS) {
    deleteAttempts.set(key, { count: 1, since: now });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const waitSec = Math.ceil((WINDOW_MS - (now - record.since)) / 1000);
    return { allowed: false, waitSec };
  }

  record.count += 1;
  return { allowed: true };
}

function clearRateLimit(key) {
  deleteAttempts.delete(key);
}

/**
 * SHA-256 PIN code hashing
 */
function hashPin(pin, useSalt = true) {
  const raw = useSalt
    ? String(pin).trim() + '_dropbrief_salt_2026'
    : String(pin).trim();
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Serverless function for secure and irreversible freelancer account deletion (GDPR Art. 17 - Right to Erasure)
 *
 * Executes:
 * 1. Identity verification (identifier + 6-digit PIN with rate-limiting)
 * 2. Querying all projects of the user
 * 3. Permanent deletion of all uploaded files from Supabase Storage (bucket 'client-uploads')
 * 4. Deletion of backup profile files from Storage
 * 5. Deletion of checklist items (project_items)
 * 6. Deletion of projects (projects)
 * 7. Deletion of user profile from DB (freelancers)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  // ── 1. Get client IP address ──────────────────────────────────────────
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip']?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  // ── 2. Body parsing ────────────────────────────────────────────────────────
  let bodyData = req.body || {};
  if (typeof bodyData === 'string') {
    try { bodyData = JSON.parse(bodyData); } catch { bodyData = {}; }
  }

  const rawIdentifier = bodyData.identifier || bodyData.nick || bodyData.email;
  const { pin } = bodyData;

  if (!rawIdentifier || typeof rawIdentifier !== 'string' || !pin || typeof pin !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'To delete your account, please enter your username (or email) and 6-digit PIN code.',
    });
  }

  const cleanIdentifier = rawIdentifier.trim().toLowerCase();
  const cleanPin = pin.trim();

  if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
    return res.status(400).json({ success: false, error: 'Security PIN code must contain exactly 6 digits.' });
  }

  // ── 3. Server-side rate limiting ───────────────────────────────────────────
  const rlKey = rateLimitKey(ip, cleanIdentifier);
  const rlResult = checkRateLimit(rlKey);

  if (!rlResult.allowed) {
    return res.status(429).json({
      success: false,
      rateLimited: true,
      error: `Too many failed attempts. For security reasons, please wait ${rlResult.waitSec} seconds.`,
    });
  }

  // ── 4. Pripojenie k Supabase ───────────────────────────────────────────────
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[delete-account] Missing Supabase configuration.');
    return res.status(500).json({ success: false, error: 'Server configuration error (Supabase).' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // ── 5. Find user by nickname OR email ───────────────────
    const { data: user, error: userErr } = await supabase
      .from('freelancers')
      .select('id, nick, email, pin_code')
      .or(`nick.ilike.${cleanIdentifier},email.ilike.${cleanIdentifier}`)
      .maybeSingle();

    if (userErr) {
      console.error('[delete-account] DB user fetch error:', userErr.message);
      return res.status(500).json({ success: false, error: 'Error verifying user in database.' });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User account with this name or email was not found.' });
    }

    // ── 6. Verify PIN code (salted and unsalted) ──────────────────────────
    const saltedHash = hashPin(cleanPin, true);
    const unsaltedHash = hashPin(cleanPin, false);
    const isPinValid = user.pin_code === saltedHash || user.pin_code === unsaltedHash;

    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect security PIN. Account cannot be deleted without a valid PIN.',
      });
    }

    // PIN is valid – reset attempts counter
    clearRateLimit(rlKey);

    // ── 7. Find all projects of the user ──────────────────────────
    const { data: projects, error: projErr } = await supabase
      .from('projects')
      .select('id, slug, batches')
      .or(`freelancer_id.eq.${user.id},freelancer_name.ilike.${user.nick}`);

    if (projErr) {
      console.warn('[delete-account] Could not fetch projects:', projErr.message);
    }

    const userProjects = Array.isArray(projects) ? projects : [];
    const projectIds = userProjects.map((p) => p.id);
    const projectSlugs = userProjects.map((p) => p.slug).filter(Boolean);

    // ── 8. Permanent file deletion from Supabase Storage ──────────────────────
    const filesToDelete = new Set();

    // A) Folder files according to project slugs
    for (const slug of projectSlugs) {
      try {
        const { data: listedFiles, error: listErr } = await supabase.storage
          .from('client-uploads')
          .list(slug, { limit: 500 });

        if (!listErr && Array.isArray(listedFiles)) {
          for (const item of listedFiles) {
            if (item.name && item.name !== '.emptyFolderPlaceholder') {
              filesToDelete.add(`${slug}/${item.name}`);
            }
          }
        }
      } catch (storageListErr) {
        console.warn(`[delete-account] Failed listing storage for slug ${slug}:`, storageListErr.message);
      }
    }

    // B) Files from project_items.value (if having specific paths)
    if (projectIds.length > 0) {
      try {
        const { data: items } = await supabase
          .from('project_items')
          .select('id, value')
          .in('project_id', projectIds)
          .limit(500);

        if (Array.isArray(items)) {
          for (const item of items) {
            const val = item.value;
            if (!val || typeof val !== 'object') continue;
            if (val.path) filesToDelete.add(val.path);
            if (val.filePath) filesToDelete.add(val.filePath);
            if (Array.isArray(val.files)) {
              for (const sub of val.files) {
                if (sub?.path) filesToDelete.add(sub.path);
                if (sub?.filePath) filesToDelete.add(sub.filePath);
              }
            }
          }
        }
      } catch (itemFilesErr) {
        console.warn('[delete-account] Failed checking project item file paths:', itemFilesErr.message);
      }
    }

    // C) Files from project batches
    for (const proj of userProjects) {
      if (Array.isArray(proj.batches)) {
        for (const batch of proj.batches) {
          if (Array.isArray(batch.files)) {
            for (const f of batch.files) {
              if (f?.path) filesToDelete.add(f.path);
              if (f?.filePath) filesToDelete.add(f.filePath);
            }
          }
        }
      }
    }

    // D) Profile backup JSON files from Storage (if existing)
    const safeNick = user.nick.toLowerCase().replace(/[^a-z0-9]/g, '_');
    filesToDelete.add(`_profiles/fl_${safeNick}.json`);
    filesToDelete.add(`profiles/fl_${safeNick}.json`);

    // Execute bulk deletion of files from Storage
    const allFilesArray = Array.from(filesToDelete).filter(Boolean);
    if (allFilesArray.length > 0) {
      try {
        // Batching by max 100 files due to API limits
        for (let i = 0; i < allFilesArray.length; i += 100) {
          const chunk = allFilesArray.slice(i, i + 100);
          const { error: removeErr } = await supabase.storage
            .from('client-uploads')
            .remove(chunk);
          if (removeErr) {
            console.warn('[delete-account] Storage remove batch warning:', removeErr.message);
          }
        }
      } catch (storageDelErr) {
        console.warn('[delete-account] Storage batch deletion error:', storageDelErr.message);
      }
    }

    // ── 9. Database deletion (Items -> Projects -> User) ───────────
    if (projectIds.length > 0) {
      // Checklist items
      const { error: delItemsErr } = await supabase
        .from('project_items')
        .delete()
        .in('project_id', projectIds);

      if (delItemsErr) {
        console.warn('[delete-account] Warning deleting project items:', delItemsErr.message);
      }

      // Projects
      const { error: delProjErr } = await supabase
        .from('projects')
        .delete()
        .in('id', projectIds);

      if (delProjErr) {
        console.warn('[delete-account] Warning deleting projects:', delProjErr.message);
      }
    }

    // Delete user from freelancers table
    const { error: delUserErr } = await supabase
      .from('freelancers')
      .delete()
      .eq('id', user.id);

    if (delUserErr) {
      console.error('[delete-account] Failed deleting freelancer record:', delUserErr.message);
      return res.status(500).json({
        success: false,
        error: 'Error removing user account from database.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Your account, all projects, and uploaded client files were permanently removed from the system in compliance with GDPR.',
      deletedProjectsCount: userProjects.length,
      deletedFilesCount: allFilesArray.length,
    });
  } catch (error) {
    console.error('[delete-account] Unexpected exception:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing account deletion.',
    });
  }
}
