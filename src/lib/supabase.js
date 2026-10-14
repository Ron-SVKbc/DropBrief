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
 * Nastavenie autorizačných a kontextových hlavičiek pre Supabase PostgREST (RLS)
 * Zabezpečuje, že klient posiela overený x-project-slug alebo x-freelancer-nick + x-freelancer-auth.
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
 * Bezpečná kontrola dostupnosti nicku cez RPC funkciu (chráni pred únikom hashov a e-mailov)
 */
export async function isNickAvailable(nick) {
  if (!supabase || !nick) return true;
  const cleanNick = nick.trim().toLowerCase();

  // 1. Primárne vyskúšať bezpečnú Postgres RPC funkciu (SECURITY DEFINER)
  try {
    const { data, error } = await supabase.rpc('check_nick_available', { check_nick: cleanNick });
    if (!error && typeof data === 'boolean') {
      return data;
    }
  } catch (e) {}

  // 2. Fallback pre spätnú kompatibilitu ak RPC ešte nie je v DB nasadené
  try {
    const existing = await getCloudFreelancer(cleanNick);
    return !existing;
  } catch (e) {
    return true;
  }
}

/**
 * Bezpečná kontrola dostupnosti e-mailu (chráni pred duplicitnou registráciou a kolíziami)
 */
export async function isEmailAvailable(email) {
  if (!supabase || !email) return true;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Primárne vyskúšať bezpečnú Postgres RPC funkciu
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
 * Získanie účtu freelancera z cloudu (DB tabuľka alebo Storage profil)
 */
export async function getCloudFreelancer(nick) {
  if (!supabase || !nick) return null;
  const cleanNick = nick.trim().toLowerCase();
  const safeNick = cleanNick.replace(/[^a-z0-9]/g, '_');

  // 1. Skúsiť primárne SQL tabuľku v Supabase
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
      // Ak tabuľka existuje a vrátila null, používateľ s týmto nickom v DB neexistuje.
      // Netreba robiť pomalé zbytočné volanie do Storage (404 Object not found).
      return null;
    }
  } catch (e) {}

  // 2. Iba ak SQL tabuľka vyhodila chybu (napr. neexistuje tabuľka v DB), skúsime Storage fallback
  try {
    const filePath = `_profiles/fl_${safeNick}.json`;
    const { data: fileData, error: dErr } = await supabase.storage
      .from('client-uploads')
      .download(filePath);

    if (!dErr && fileData) {
      const text = await fileData.text();
      return JSON.parse(text);
    }
  } catch (e) {}

  return null;
}

/**
 * Bezpečné hashovanie PIN kódu pomocou SHA-256 so soľou
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
 * Overenie PIN kódu voči uloženému profilu
 */
export async function verifyCloudPin(inputPin, storedUser) {
  if (!inputPin || !storedUser) return false;
  const cleanInput = String(inputPin).trim();
  const targetHash = storedUser.pinHash || storedUser.pin || storedUser.pin_code;
  if (!targetHash) return false;

  // 1. Primárne overenie: SHA-256 so soľou
  const saltedHash = await hashPin(cleanInput, true);
  if (targetHash === saltedHash) return true;

  // 2. Spätná kompatibilita: SHA-256 bez soli (napr. manuálny záznam v DB)
  const unsaltedHash = await hashPin(cleanInput, false);
  if (targetHash === unsaltedHash) return true;

  return false;
}

/**
 * Uloženie nového účtu freelancera do cloudu (DB + šifrovaný Storage profil fallback)
 */
export async function saveCloudFreelancer(freelancer) {
  if (!supabase || !freelancer) return freelancer;
  const rawNick = freelancer.nick.trim();
  const rawEmail = freelancer.email ? freelancer.email.trim().toLowerCase() : '';
  const pinHash = await hashPin(freelancer.pin, true);

  // 🛡️ Nastaviť autorizačné hlavičky pred zápisom, aby PostgREST RLS politika na SELECT (RETURNING) nezlyhala
  setSupabaseSessionHeaders({ nick: rawNick, pinHash });

  let savedUserRecord = null;

  // 1. Primárny pokus: INSERT s návratom vygenerovaného ID a created_at
  try {
    const { data: insertedUser, error: insertErr } = await supabase
      .from('freelancers')
      .insert({
        nick: rawNick,
        pin_code: pinHash, // Ukladáme len hash, nie čistý PIN
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

  // 2. Sekundárny pokus: Čistý INSERT bez .select() (pre prípad, že RLS SELECT policy nepovolila čítanie)
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
        // Po úspešnom čistom vložení načítame oficiálne ID a dátum vytvorenia cez RPC
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

  // 3. Fallback do Storage (ak by databáza vôbec nereagovala)
  if (!savedUserRecord) {
    try {
      const safeNick = rawNick.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filePath = `profiles/fl_${safeNick}.json`;
      const safePayload = {
        id: freelancer.id,
        nick: rawNick,
        pinHash: pinHash,
        email: rawEmail,
        createdAt: freelancer.createdAt || new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(safePayload, null, 2)], { type: 'application/json' });
      await supabase.storage
        .from('client-uploads')
        .upload(filePath, blob, { contentType: 'application/json', upsert: true });
    } catch (e) {
      console.warn('Storage fallback sync failed:', e);
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
 * Nahranie súboru do Supabase Storage bucketu 'client-uploads'
 */
// Povolené typy súborov (whitelist)
const ALLOWED_MIME_TYPES = [
  // Obrázky
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
  // Archívy
  'application/zip', 'application/x-zip-compressed',
  'application/x-rar-compressed', 'application/x-7z-compressed',
  // Dizajn
  'application/postscript', 'image/vnd.adobe.photoshop',
  // Videá
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

  // ✅ Sanitizácia názvu súboru
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_') // len bezpečné znaky
    .replace(/\.{2,}/g, '.')           // zabrání path traversal (../../)
    .substring(0, 200);                // max dĺžka názvu

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

  // Získanie verejnej URL adresy pre stiahnutie
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


