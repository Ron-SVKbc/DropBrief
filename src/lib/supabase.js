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
export async function hashPin(pin) {
  if (!pin) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(String(pin).trim() + '_dropbrief_salt_2026');
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
  const inputHash = await hashPin(cleanInput);

  if (storedUser.pinHash && storedUser.pinHash === inputHash) return true;
  if (storedUser.pin && String(storedUser.pin).trim() === cleanInput) return true;
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

  // 1. Skúsiť vložiť do SQL tabuľky v Supabase (ak existuje)
  try {
    await supabase.from('freelancers').insert({
      nick: freelancer.nick.trim(),
      pin_code: freelancer.pin,
      email: freelancer.email || '',
    });
  } catch (e) {}

  // 2. Uložiť do Storage bucketu (s kryptografickým hashovaným PINom, nie v čistom texte)
  try {
    const safePayload = {
      id: freelancer.id,
      nick: freelancer.nick,
      pinHash: pinHash, // Uložený len kryptografický hash
      email: freelancer.email || '',
      createdAt: freelancer.createdAt || new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(safePayload, null, 2)], { type: 'application/json' });
    
    // Zmazať predchádzajúci ak existoval
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
export async function uploadClientFile(file, projectSlug, itemId) {
  if (!supabase) throw new Error('Supabase nie je nakonfigurovaný');

  const fileExt = file.name.split('.').pop();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${projectSlug}/${itemId}-${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from('client-uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
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
    path: filePath,
    url: publicUrlData.publicUrl,
    fileName: file.name,
    fileSize: (file.size / 1024).toFixed(1) + ' KB',
    fileType: file.type || 'application/octet-stream',
  };
}


