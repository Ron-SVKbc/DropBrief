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
  const isMasterAuthorized = isVercelCron || (Boolean(cronSecret) && providedSecret === cronSecret);

  // Získanie prihlasovacích údajov freelancera pri manuálnom spustení z dashboardu
  const reqNick = (req.headers['x-freelancer-nick'] || bodyData.nick || '').trim();
  const reqAuth = (req.headers['x-freelancer-auth'] || bodyData.pinHash || '').trim();

  // Neautorizované volanie bez CRON tajomstva a bez prihláseného freelancera je prísne zakázané
  if (!isMasterAuthorized && (!targetSlug || !reqNick || !reqAuth)) {
    console.warn('[cron-purge] Unauthorized attempt to trigger purge without valid secret or freelancer credentials.');
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: Pre spustenie skartácie sa vyžaduje platný CRON_SECRET alebo overenie freelancera.' 
    });
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

  const FUNCTION_START_MS = Date.now();
  const MAX_EXECUTION_TIME_MS = 8000; // 8s bezpečný časový rozpočet (Vercel Hobby limit je 10s)
  const MAX_CANDIDATES_LIMIT = 25;   // Limit stránkovania kandidátov na jeden beh

  try {
    // ── 4. Výber kandidátov na purge (so striktným limitom stránkovania) ──────
    let query = supabase
      .from('projects')
      .select('id, slug, title, status, completed_at, created_at, files_purged, purged_at, batches, freelancer_name');

    if (targetSlug) {
      query = query.ilike('slug', targetSlug).limit(1);
    } else {
      query = query.eq('status', 'completed').limit(MAX_CANDIDATES_LIMIT);
    }

    const { data: candidateProjects, error: fetchErr } = await query;

    if (fetchErr) {
      console.error('[cron-purge] Failed to fetch projects:', fetchErr.message);
      return res.status(500).json({ success: false, error: fetchErr.message });
    }

    // ── 4b. Overenie vlastníctva pri manuálnom purge bez CRON_SECRET ─────────
    if (!isMasterAuthorized && targetSlug) {
      const targetProj = candidateProjects?.[0];
      if (!targetProj) {
        return res.status(404).json({ success: false, error: 'Projekt pre skartáciu sa nenašiel.' });
      }
      if (!targetProj.freelancer_name || targetProj.freelancer_name.trim().toLowerCase() !== reqNick.toLowerCase()) {
        console.warn(`[cron-purge] Unauthorized purge attempt: ${reqNick} does not own project ${targetSlug}`);
        return res.status(403).json({ success: false, error: 'Nemáte oprávnenie skartovať tento projekt.' });
      }

      // Overenie PIN hashu v databáze
      const { data: isAuthValid } = await supabase.rpc('is_freelancer_authenticated', {
        p_nick: reqNick,
        p_pin_hash: reqAuth,
      });

      if (!isAuthValid) {
        return res.status(401).json({ success: false, error: 'Neplatné overenie PIN kódu freelancera.' });
      }
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
    let timedOutEarly = false;

    // ── 5. Vykonanie mazania pre každý projekt (strážené time budgetom) ───────
    for (const project of eligibleProjects) {
      // Base-case ochrana pred timeoutom Serverless funkcie
      if (Date.now() - FUNCTION_START_MS > MAX_EXECUTION_TIME_MS) {
        console.warn(`[cron-purge] Serverless time budget exceeded (${Date.now() - FUNCTION_START_MS}ms). Yielding remaining projects for subsequent cron run.`);
        timedOutEarly = true;
        break;
      }

      const filesToDelete = new Set();

      // A) Zoznam súborov priamo v Storage pod priečinkom slug/ (s limitom 500 súborov)
      try {
        const { data: listedFiles, error: listErr } = await supabase.storage
          .from('client-uploads')
          .list(project.slug, { limit: 500 });

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

      // B) Zoznam súborov z položiek checklistu (project_items) s limitom 100
      try {
        const { data: items, error: itemsErr } = await supabase
          .from('project_items')
          .select('id, type, value')
          .eq('project_id', project.id)
          .limit(100);

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

      // ── Fyzické zmazanie zo Supabase Storage v bezpečných dávkach po 50 ──────
      let deletedStorageCount = 0;
      let storageError = null;

      if (pathsArray.length > 0) {
        try {
          const STORAGE_BATCH_SIZE = 50;
          for (let b = 0; b < pathsArray.length; b += STORAGE_BATCH_SIZE) {
            const chunk = pathsArray.slice(b, b + STORAGE_BATCH_SIZE);
            const { error: removeErr } = await supabase.storage
              .from('client-uploads')
              .remove(chunk);

            if (removeErr) {
              storageError = removeErr.message;
              console.error(`[cron-purge] Failed to remove storage batch for ${project.slug}:`, removeErr);
              break;
            } else {
              deletedStorageCount += chunk.length;
            }
          }
        } catch (storageEx) {
          storageError = storageEx.message;
        }
      }

      // ── Aktualizácia záznamov položiek checklistu (paralelne v dávkach po 5) ─
      try {
        const { data: itemsToUpdate } = await supabase
          .from('project_items')
          .select('id, value')
          .eq('project_id', project.id)
          .limit(100);

        if (Array.isArray(itemsToUpdate)) {
          const eligibleItems = itemsToUpdate.filter(
            (it) => it.value && typeof it.value === 'object'
          );

          // Spracovanie po dávkach (chunking) pre prevenciu preťaženia spojenia
          const CHUNK_SIZE = 5;
          for (let i = 0; i < eligibleItems.length; i += CHUNK_SIZE) {
            const chunk = eligibleItems.slice(i, i + CHUNK_SIZE);
            await Promise.allSettled(
              chunk.map((it) => {
                const updatedValue = {
                  ...it.value,
                  purged: true,
                  purgedAt: new Date().toISOString(),
                  url: null,
                };
                return supabase
                  .from('project_items')
                  .update({ value: updatedValue, purged: true })
                  .eq('id', it.id);
              })
            );
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
      timedOutEarly,
      executionDurationMs: Date.now() - FUNCTION_START_MS,
      results: purgeResults,
    });
  } catch (error) {
    console.error('[cron-purge] Fatal error during purge run:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
