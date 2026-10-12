import { createClient } from '@supabase/supabase-js';

/**
 * 🧹 DropBrief - Automated 30-Day Storage Purge Endpoint (Vercel Cron & Manual Trigger)
 *
 * Plní GDPR článok 5(1)(e) (obmedzenie uloženia):
 * Trvalo maže súbory zo Supabase Storage bucketu 'client-uploads' pre všetky
 * projekty, ktoré sú v stave 'completed' po dobu dlhšiu ako 30 dní.
 *
 * Podpora:
 * - Vercel Cron (GET /api/cron-purge cez CRON_SECRET)
 * - Manuálny trigger / webhook (POST /api/cron-purge s { slug, force: true })
 * - Dry-run testovanie (GET /api/cron-purge?dry_run=true)
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use GET or POST.' });
  }

  // ── 1. Spracovanie parametrov ──────────────────────────────────────────────
  let bodyData = req.body || {};
  if (typeof bodyData === 'string') {
    try { bodyData = JSON.parse(bodyData); } catch { bodyData = {}; }
  }

  const urlObj = req.url ? new URL(req.url, 'http://localhost') : null;
  const isDryRun = (urlObj?.searchParams.get('dry_run') === 'true') || Boolean(bodyData.dryRun);
  const targetSlug = urlObj?.searchParams.get('slug') || bodyData.slug;
  const forceImmediate = (urlObj?.searchParams.get('force') === 'true') || Boolean(bodyData.force);

  // ── 2. Overenie oprávnenia (Security check) ─────────────────────────────────
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const querySecret = urlObj?.searchParams.get('secret') || urlObj?.searchParams.get('token');
  const providedSecret = token || querySecret;

  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = req.headers['x-vercel-cron'] === '1' || (req.headers['user-agent'] && req.headers['user-agent'].includes('vercel-cron'));

  // V produkcii chránime hromadný výmaz (keď nie je špecifikovaný konkrétny slug):
  if (isProduction && !targetSlug) {
    const isAuthorized = isVercelCron || (Boolean(cronSecret) && providedSecret === cronSecret);
    if (!isAuthorized) {
      console.warn('[cron-purge] Unauthorized attempt to trigger bulk purge.');
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or missing cron secret.' });
    }
  }

  // ── 3. Inicializácia Supabase ──────────────────────────────────────────────
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = serviceRoleKey || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[cron-purge] Missing Supabase environment variables.');
    return res.status(500).json({ success: false, error: 'Server configuration missing (Supabase).' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const cutoffDate = new Date(now - THIRTY_DAYS_MS);

  try {
    // ── 4. Výber kandidátov na purge ──────────────────────────────────────────
    let query = supabase
      .from('projects')
      .select('id, slug, title, status, completed_at, created_at, files_purged, purged_at, batches');

    if (targetSlug) {
      query = query.ilike('slug', targetSlug);
    } else {
      query = query.eq('status', 'completed');
    }

    const { data: candidateProjects, error: fetchErr } = await query;

    if (fetchErr) {
      console.error('[cron-purge] Failed to fetch projects:', fetchErr.message);
      return res.status(500).json({ success: false, error: fetchErr.message });
    }

    const eligibleProjects = (candidateProjects || []).filter((proj) => {
      // Už skartované projekty preskočíme
      if (proj.files_purged || proj.purged_at) return false;

      // Ak ide o manuálny force purge konkrétneho projektu
      if (forceImmediate && targetSlug && proj.slug?.toLowerCase() === targetSlug.toLowerCase()) {
        return true;
      }

      // Musí byť v stave completed
      if (proj.status !== 'completed') return false;

      // Dátum dokončenia: prioritne completed_at, fallback created_at
      const completionDate = proj.completed_at || proj.created_at;
      if (!completionDate) return false;

      const completionMs = new Date(completionDate).getTime();
      return (now - completionMs) >= THIRTY_DAYS_MS;
    });

    console.log(`[cron-purge] Found ${eligibleProjects.length} projects eligible for auto-purge.`);

    const purgeResults = [];

    // ── 5. Vykonanie mazania pre každý projekt ────────────────────────────────
    for (const project of eligibleProjects) {
      const filesToDelete = new Set();

      // A) Zoznam súborov priamo v Storage pod priečinkom slug/
      try {
        const { data: listedFiles, error: listErr } = await supabase.storage
          .from('client-uploads')
          .list(project.slug, { limit: 1000 });

        if (!listErr && Array.isArray(listedFiles)) {
          for (const item of listedFiles) {
            if (item.name && item.name !== '.emptyFolderPlaceholder') {
              filesToDelete.add(`${project.slug}/${item.name}`);
            }
          }
        }
      } catch (err) {
        console.warn(`[cron-purge] Could not list storage for slug ${project.slug}:`, err.message);
      }

      // B) Zoznam súborov z položiek checklistu (project_items)
      try {
        const { data: items, error: itemsErr } = await supabase
          .from('project_items')
          .select('id, type, value')
          .eq('project_id', project.id);

        if (!itemsErr && Array.isArray(items)) {
          for (const item of items) {
            const val = item.value;
            if (!val) continue;

            if (typeof val === 'object') {
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
        }
      } catch (err) {
        console.warn(`[cron-purge] Could not query items for project ${project.id}:`, err.message);
      }

      // C) Zoznam súborov z batches (ongoing projekt)
      if (Array.isArray(project.batches)) {
        for (const batch of project.batches) {
          if (Array.isArray(batch.files)) {
            for (const f of batch.files) {
              if (f?.path) filesToDelete.add(f.path);
              if (f?.filePath) filesToDelete.add(f.filePath);
            }
          }
        }
      }

      const pathsArray = Array.from(filesToDelete);

      if (isDryRun) {
        purgeResults.push({
          slug: project.slug,
          projectId: project.id,
          dryRun: true,
          filesCount: pathsArray.length,
          files: pathsArray,
          completedAt: project.completed_at || project.created_at,
        });
        continue;
      }

      // ── Fyzické zmazanie zo Supabase Storage ───────────────────────────────
      let deletedStorageCount = 0;
      let storageError = null;

      if (pathsArray.length > 0) {
        try {
          const { data: removedData, error: removeErr } = await supabase.storage
            .from('client-uploads')
            .remove(pathsArray);

          if (removeErr) {
            storageError = removeErr.message;
            console.error(`[cron-purge] Failed to remove storage paths for ${project.slug}:`, removeErr);
          } else {
            deletedStorageCount = pathsArray.length;
          }
        } catch (storageEx) {
          storageError = storageEx.message;
        }
      }

      // ── Aktualizácia záznamov položiek checklistu ─────────────────────────
      try {
        const { data: itemsToUpdate } = await supabase
          .from('project_items')
          .select('id, value')
          .eq('project_id', project.id);

        if (Array.isArray(itemsToUpdate)) {
          for (const it of itemsToUpdate) {
            if (it.value && typeof it.value === 'object') {
              const updatedValue = {
                ...it.value,
                purged: true,
                purgedAt: new Date().toISOString(),
                url: null, // Odkaz už neexistuje
              };
              await supabase
                .from('project_items')
                .update({ value: updatedValue, purged: true })
                .eq('id', it.id);
            }
          }
        }
      } catch (itemUpdateErr) {
        console.warn(`[cron-purge] Could not update item values for ${project.id}:`, itemUpdateErr);
      }

      // ── Aktualizácia statusu projektu v DB ─────────────────────────────────
      const updatePayload = {
        files_purged: true,
        purged_at: new Date().toISOString(),
      };
      if (!project.completed_at) {
        updatePayload.completed_at = project.created_at;
      }

      await supabase
        .from('projects')
        .update(updatePayload)
        .eq('id', project.id);

      purgeResults.push({
        slug: project.slug,
        projectId: project.id,
        filesPurgedCount: deletedStorageCount,
        files: pathsArray,
        storageError,
        purgedAt: updatePayload.purged_at,
      });
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      dryRun: isDryRun,
      cutoffDate: cutoffDate.toISOString(),
      eligibleProjectsCount: eligibleProjects.length,
      purgedCount: purgeResults.length,
      results: purgeResults,
    });
  } catch (error) {
    console.error('[cron-purge] Fatal error during purge run:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
