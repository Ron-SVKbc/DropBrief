import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-url') &&
  !supabaseAnonKey.includes('your-anon-key')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Configure authorization and context headers for Supabase PostgREST (RLS)
 * Ensures client sends verified x-project-slug or x-freelancer-nick + x-freelancer-auth.
 */
export function setSupabaseSessionHeaders({ nick, pinHash, slug } = {}) {
  if (!supabase || !supabase.rest || !supabase.rest.headers) return;

  if (nick) {
    supabase.rest.headers.set('x-freelancer-nick', String(nick).trim());
  } else if (nick === null) {
    supabase.rest.headers.delete('x-freelancer-nick');
  }

  if (pinHash) {
    supabase.rest.headers.set('x-freelancer-auth', String(pinHash).trim());
  } else if (pinHash === null) {
    supabase.rest.headers.delete('x-freelancer-auth');
  }

  if (slug) {
    supabase.rest.headers.set('x-project-slug', String(slug).trim());
  } else if (slug === null) {
    supabase.rest.headers.delete('x-project-slug');
  }
}

/**
 * Secure check of nickname availability via RPC function (prevents hash and email leakage)
 */
export async function isNickAvailable(nick) {
  if (!supabase || !nick) return true;
  const cleanNick = nick.trim().toLowerCase();

  // 1. Primarily try secure Postgres RPC function (SECURITY DEFINER)
  try {
    const { data, error } = await supabase.rpc('check_nick_available', { check_nick: cleanNick });
    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch (e) {}

  // 2. Fallback for backward compatibility if RPC is not yet deployed in DB
  try {
    const existing = await getCloudFreelancer(cleanNick);
    return !existing;
  } catch (e) {
    return true;
  }
}

/**
 * Secure check of email availability (prevents duplicate registrations and collisions)
 */
export async function isEmailAvailable(email) {
  if (!supabase || !email) return true;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Primarily try secure Postgres RPC function
  try {
    const { data, error } = await supabase.rpc('check_email_available', { check_email: cleanEmail });
    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch (e) {}

  // 2. Fallback priamy dotaz
  try {
    const { data: dbUser, error } = await supabase
      .from('freelancers')
      .select('id')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (!error && dbUser) {
      return false;
    }
    return true;
  } catch (e) {
    return true;
  }
}


/**
 * Retrieve freelancer account from cloud (DB table or Storage profile)
 */
export async function getCloudFreelancer(nick) {
  if (!supabase || !nick) return null;
  const cleanNick = nick.trim().toLowerCase();
  const safeNick = cleanNick.replace(/[^a-z0-9]/g, '_');

  // 1. Primarily try SQL table in Supabase
  try {
    const { data: dbUser, error } = await supabase
      .from('freelancers')
      .select('id, nick, created_at')
      .ilike('nick', cleanNick)
      .maybeSingle();

    if (!error) {
      if (dbUser) {
        return {
          id: dbUser.id,
          nick: dbUser.nick,
          createdAt: dbUser.created_at,
        };
      }
      // If table exists and returned null, user with this nickname does not exist in DB.
      return null;
    }
  } catch (e) {}

  return null;
}

/**
 * Secure PIN code hashing using SHA-256 with salt
 */
export async function hashPin(pin, useSalt = true) {
  if (!pin) return '';
  const encoder = new TextEncoder();
  const rawString = useSalt 
    ? String(pin).trim() + '_dropbrief_salt_2026'
    : String(pin).trim();
  const data = encoder.encode(rawString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify PIN code against stored profile
 */
export async function verifyCloudPin(inputPin, storedUser) {
  if (!inputPin || !storedUser) return false;
  const cleanInput = String(inputPin).trim();
  const targetHash = storedUser.pinHash || storedUser.pin || storedUser.pin_code;
  if (!targetHash) return false;

  // 1. Primary verification: SHA-256 with salt
  const saltedHash = await hashPin(cleanInput, true);
  if (targetHash === saltedHash) return true;

  // 2. Backward compatibility: SHA-256 without salt (e.g. manual DB record)
  const unsaltedHash = await hashPin(cleanInput, false);
  if (targetHash === unsaltedHash) return true;

  return false;
}

/**
 * Save new freelancer account to cloud (DB + encrypted Storage profile fallback)
 */
export async function saveCloudFreelancer(freelancer) {
  if (!supabase || !freelancer) return freelancer;
  const rawNick = freelancer.nick.trim();
  const rawEmail = freelancer.email ? freelancer.email.trim().toLowerCase() : '';
  const pinHash = await hashPin(freelancer.pin, true);

  // 🛡️ Set authorization headers before writing so PostgREST RLS policy on SELECT (RETURNING) does not fail
  setSupabaseSessionHeaders({ nick: rawNick, pinHash });

  let savedUserRecord = null;

  // 1. Primary attempt: INSERT returning generated ID and created_at
  try {
    const { data: insertedUser, error: insertErr } = await supabase
      .from('freelancers')
      .insert({
        nick: rawNick,
        pin_code: pinHash, // Store hash only, never plaintext PIN
        email: rawEmail,
      })
      .select('id, nick, created_at')
      .single();

    if (!insertErr && insertedUser) {
      savedUserRecord = insertedUser;
    } else if (insertErr) {
      console.warn('saveCloudFreelancer insert.select error:', insertErr.message);
    }
  } catch (e) {
    console.warn('saveCloudFreelancer insert.select exception:', e);
  }

  // 2. Secondary attempt: Bare INSERT without .select() (in case RLS SELECT policy disallowed reading)
  if (!savedUserRecord) {
    try {
      const { error: bareInsertErr } = await supabase
        .from('freelancers')
        .insert({
          nick: rawNick,
          pin_code: pinHash,
          email: rawEmail,
        });

      if (!bareInsertErr) {
        // After successful bare insert, fetch official ID and creation timestamp via RPC
        try {
          const { data: rpcData } = await supabase.rpc('verify_freelancer_pin', {
            p_nick: rawNick,
            p_salted_hash: pinHash,
            p_unsalted_hash: await hashPin(freelancer.pin, false),
          });
          if (rpcData?.success && rpcData.user) {
            savedUserRecord = rpcData.user;
          }
        } catch (rpcErr) {
          console.warn('saveCloudFreelancer RPC fetch error:', rpcErr);
        }
      } else {
        console.warn('saveCloudFreelancer bare insert error:', bareInsertErr.message);
      }
    } catch (e) {
      console.warn('saveCloudFreelancer bare insert exception:', e);
    }
  }

  return {
    ...freelancer,
    id: savedUserRecord?.id || freelancer.id,
    createdAt: savedUserRecord?.created_at || savedUserRecord?.createdAt || freelancer.createdAt,
    pinHash: pinHash,
  };
}

/**
 * Upload file to Supabase Storage bucket 'client-uploads'
 */
// Allowed file types (whitelist)
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/heic', 'image/heif',
  // Dokumenty
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain', 'text/csv',
  // Archives
  'application/zip', 'application/x-zip-compressed',
  'application/x-rar-compressed', 'application/x-7z-compressed',
  // Dizajn
  'application/postscript', 'image/vnd.adobe.photoshop',
  // Videos
  'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4',
];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function uploadClientFile(file, projectSlug, itemId) {
  if (!supabase) throw new Error('Supabase is not configured');

  // File size validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large. Maximum allowed size is 50 MB (current size: ${(file.size / 1024 / 1024).toFixed(1)} MB).`);
  }

  // File type validation (whitelist)
  const mimeType = file.type || 'application/octet-stream';
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`File type "${mimeType}" is not allowed. We accept images, videos, PDFs, Office documents, and archives.`);
  }

  // ✅ File name sanitization
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_') // safe characters only
    .replace(/\.{2,}/g, '.')           // prevent path traversal (../../)
    .substring(0, 200);                // max name length

  const uniqueId = Math.random().toString(36).substring(2, 7);
  const filePath = `${projectSlug}/${itemId}-${Date.now()}-${uniqueId}-${safeName}`;

  const { data, error } = await supabase.storage
    .from('client-uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: mimeType,
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw error;
  }

  // Get public URL for download
  const { data: publicUrlData } = supabase.storage
    .from('client-uploads')
    .getPublicUrl(filePath);

  return {
    id: 'f-' + Date.now() + '-' + uniqueId,
    path: filePath,
    url: publicUrlData.publicUrl,
    fileName: file.name,
    fileSize: (file.size / 1024).toFixed(1) + ' KB',
    fileType: mimeType,
    uploadedAt: new Date().toISOString()
  };
}


