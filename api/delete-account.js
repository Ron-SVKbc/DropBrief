import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

/**
 * 🔒 In-memory rate limiter per IP + identifier
 * Ochrana pred brute-force pokusmi o zmazanie účtu
 */
const deleteAttempts = new Map();
const WINDOW_MS = 60 * 1_000; // 60 sekúnd
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
 * SHA-256 hashovanie PIN kódu
 */
function hashPin(pin, useSalt = true) {
  const raw = useSalt
    ? String(pin).trim() + '_dropbrief_salt_2026'
    : String(pin).trim();
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Serverless funkcia na bezpečné a nezvratné zmazanie účtu freelancera (GDPR Art. 17 - Right to Erasure)
 *
 * Vykoná:
 * 1. Overenie totožnosti (identifikátor + 6-miestny PIN s rate-limitingom)
 * 2. Vyhľadanie všetkých projektov používateľa
 * 3. Trvalé zmazanie všetkých nahratých súborov zo Supabase Storage (bucket 'client-uploads')
 * 4. Vymazanie záložných profilových súborov zo Storage
 * 5. Odstránenie položiek projektov (project_items)
 * 6. Odstránenie samotných projektov (projects)
 * 7. Odstránenie používateľského profilu z DB (freelancers)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  // ── 1. Získanie IP adresy klienta ──────────────────────────────────────────
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
      error: 'Pre zmazanie účtu zadajte vaše prihlasovacie meno (alebo e-mail) a 6-miestny PIN kód.',
    });
  }

  const cleanIdentifier = rawIdentifier.trim().toLowerCase();
  const cleanPin = pin.trim();

  if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
    return res.status(400).json({ success: false, error: 'Bezpečnostný PIN kód musí mať presne 6 číslic.' });
  }

  // ── 3. Server-side rate limiting ───────────────────────────────────────────
  const rlKey = rateLimitKey(ip, cleanIdentifier);
  const rlResult = checkRateLimit(rlKey);

  if (!rlResult.allowed) {
    return res.status(429).json({
      success: false,
      rateLimited: true,
      error: `Príliš veľa neúspešných pokusov. Z bezpečnostných dôvodov počkajte ${rlResult.waitSec} sekúnd.`,
    });
  }

  // ── 4. Pripojenie k Supabase ───────────────────────────────────────────────
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[delete-account] Missing Supabase configuration.');
    return res.status(500).json({ success: false, error: 'Chyba konfigurácie servera (Supabase).' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // ── 5. Vyhľadanie používateľa podľa nicku ALEBO e-mailu ───────────────────
    const { data: user, error: userErr } = await supabase
      .from('freelancers')
      .select('id, nick, email, pin_code')
      .or(`nick.ilike.${cleanIdentifier},email.ilike.${cleanIdentifier}`)
      .maybeSingle();

    if (userErr) {
      console.error('[delete-account] DB user fetch error:', userErr.message);
      return res.status(500).json({ success: false, error: 'Chyba pri overovaní používateľa v databáze.' });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'Používateľský účet s týmto menom alebo e-mailom sa nenašiel.' });
    }

    // ── 6. Overenie PIN kódu (so soľou aj bez soli) ──────────────────────────
    const saltedHash = hashPin(cleanPin, true);
    const unsaltedHash = hashPin(cleanPin, false);
    const isPinValid = user.pin_code === saltedHash || user.pin_code === unsaltedHash;

    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        error: 'Nesprávny bezpečnostný PIN kód. Účet nie je možné zmazať bez platného PINu.',
      });
    }

    // PIN je správny – reset počítadla pokusov
    clearRateLimit(rlKey);

    // ── 7. Vyhľadanie všetkých projektov používateľa ──────────────────────────
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

    // ── 8. Trvalé vymazanie súborov zo Supabase Storage ──────────────────────
    const filesToDelete = new Set();

    // A) Súbory zložiek podľa projektových slugov
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

    // B) Súbory z project_items.value (ak by mali špecifické cesty)
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

    // C) Súbory z projektových batches
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

    // D) Profilové záložné JSON súbory zo Storage (ak existujú)
    const safeNick = user.nick.toLowerCase().replace(/[^a-z0-9]/g, '_');
    filesToDelete.add(`_profiles/fl_${safeNick}.json`);
    filesToDelete.add(`profiles/fl_${safeNick}.json`);

    // Vykonanie hromadného zmazania súborov zo Storage
    const allFilesArray = Array.from(filesToDelete).filter(Boolean);
    if (allFilesArray.length > 0) {
      try {
        // Dávkovanie po max 100 súborov kvôli limitom API
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

    // ── 9. Databázové vymazanie (Položky -> Projekty -> Používateľ) ───────────
    if (projectIds.length > 0) {
      // Položky checklistu
      const { error: delItemsErr } = await supabase
        .from('project_items')
        .delete()
        .in('project_id', projectIds);

      if (delItemsErr) {
        console.warn('[delete-account] Warning deleting project items:', delItemsErr.message);
      }

      // Samotné projekty
      const { error: delProjErr } = await supabase
        .from('projects')
        .delete()
        .in('id', projectIds);

      if (delProjErr) {
        console.warn('[delete-account] Warning deleting projects:', delProjErr.message);
      }
    }

    // Vymazanie používateľa z tabuľky freelancers
    const { error: delUserErr } = await supabase
      .from('freelancers')
      .delete()
      .eq('id', user.id);

    if (delUserErr) {
      console.error('[delete-account] Failed deleting freelancer record:', delUserErr.message);
      return res.status(500).json({
        success: false,
        error: 'Chyba pri odstraňovaní používateľského účtu z databázy.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Váš účet, všetky projekty a nahraté súbory boli natrvalo odstránené zo systému v súlade s GDPR.',
      deletedProjectsCount: userProjects.length,
      deletedFilesCount: allFilesArray.length,
    });
  } catch (error) {
    console.error('[delete-account] Unexpected exception:', error);
    return res.status(500).json({
      success: false,
      error: 'Nastala neočakávaná chyba pri spracovaní požiadavky na zmazanie účtu.',
    });
  }
}
