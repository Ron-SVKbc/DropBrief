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
 * Získanie účtu freelancera z cloudu (DB tabuľka alebo Storage profil)
 */
export async function getCloudFreelancer(nick) {
  if (!supabase || !nick) return null;
  const cleanNick = nick.trim().toLowerCase();
  const safeNick = cleanNick.replace(/[^a-z0-9]/g, '_');

  // 1. Skúsiť najprv SQL tabuľku v Supabase
  try {
    const { data: dbUser, error } = await supabase
      .from('freelancers')
      .select('*')
      .ilike('nick', cleanNick)
      .maybeSingle();

    if (!error && dbUser) {
      return {
        id: dbUser.id,
        nick: dbUser.nick,
        pin: dbUser.pin_code,
        pinHash: dbUser.pin_code,
        email: dbUser.email || '',
        createdAt: dbUser.created_at,
      };
    }
  } catch (e) {}

  // 2. Ak tabuľka neexistuje alebo používateľ nebol nájdený, skúsiť Storage profil
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
 * Uloženie nového účtu freelancera do cloudu (DB + šifrovaný Storage profil)
 */
export async function saveCloudFreelancer(freelancer) {
  if (!supabase || !freelancer) return freelancer;
  const cleanNick = freelancer.nick.trim().toLowerCase();
  const safeNick = cleanNick.replace(/[^a-z0-9]/g, '_');
  const filePath = `_profiles/fl_${safeNick}.json`;

  const pinHash = await hashPin(freelancer.pin);

  // 1. Uložiť do SQL tabuľky – výhradne hashed PIN, nikdy plain-text
  try {
    await supabase.from('freelancers').insert({
      nick: freelancer.nick.trim(),
      pin_code: pinHash, // Ukladáme len hash, nie čistý PIN
      email: freelancer.email || '',
    });
  } catch (e) {}

  // 2. Uložiť do Storage bucketu – len hash, bez plain-text PINu
  try {
    const safePayload = {
      id: freelancer.id,
      nick: freelancer.nick,
      pinHash: pinHash,
      email: freelancer.email || '',
      createdAt: freelancer.createdAt || new Date().toISOString(),
      // POZOR: plain-text PIN sa nikdy neukladá do cloudu
    };

    const blob = new Blob([JSON.stringify(safePayload, null, 2)], { type: 'application/json' });
    
    await supabase.storage.from('client-uploads').remove([filePath]);
    const { error: upErr } = await supabase.storage
      .from('client-uploads')
      .upload(filePath, blob, { contentType: 'application/json' });

    if (upErr) {
      console.warn('Storage profile upload error:', upErr);
    }
  } catch (e) {
    console.error('Failed to sync freelancer to storage:', e);
  }

  return freelancer;
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
  if (!supabase) throw new Error('Supabase nie je nakonfigurovaný');

  // ✅ Validácia veľkosti súboru
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Súbor je príliš veľký. Maximálna povolená veľkosť je 50 MB (aktuálna veľkosť: ${(file.size / 1024 / 1024).toFixed(1)} MB).`);
  }

  // ✅ Validácia typu súboru (whitelist)
  const mimeType = file.type || 'application/octet-stream';
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Typ súboru "${mimeType}" nie je povolený. Akceptujeme obrázky, videá, PDF, dokumenty Office a archívy.`);
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
      upsert: true,
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


