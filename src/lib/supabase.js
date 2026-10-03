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
