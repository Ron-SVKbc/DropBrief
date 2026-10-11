/**
 * Helper utility pre správu pravidelného zberu podkladov (cadence / ongoing batches)
 * Umožňuje jednoduché denné, 2-dňové, týždenné či mesačné cykly zberu podkladov.
 */

export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDatePretty(dateStr) {
  if (!dateStr) return '';
  try {
    const todayStr = getTodayDateString();
    
    // Yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[0], 10);
      const dObj = new Date(year, month, day);
      const monthName = dObj.toLocaleString('en-US', { month: 'short' });

      if (dateStr === todayStr) {
        return `Today (${monthName} ${day}, ${year})`;
      }
      if (dateStr === yesterdayStr) {
        return `Yesterday (${monthName} ${day}, ${year})`;
      }
      return `${monthName} ${day}, ${year}`;
    }

    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

// Backward-compatible alias
export const formatDateSlovak = formatDatePretty;

export function formatCadenceDays(days) {
  const d = Number(days) || 1;
  if (d === 1) return 'Every day (Daily)';
  if (d === 2) return 'Every 2 days';
  if (d === 3) return 'Every 3 days';
  if (d === 7) return 'Every week (7 days)';
  if (d === 14) return 'Every 2 weeks (14 days)';
  if (d === 30) return 'Every month (30 days)';
  return `Every ${d} days`;
}

export function formatCadenceBadge(days) {
  const d = Number(days) || 1;
  if (d === 1) return 'Daily';
  if (d === 2) return 'Every 2d';
  if (d === 7) return 'Weekly';
  if (d === 30) return 'Monthly';
  return `${d} days`;
}

export function getProjectBatches(project) {
  if (!project || !Array.isArray(project.batches)) return [];
  return [...project.batches].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function getCurrentBatch(project, targetDate = getTodayDateString()) {
  const batches = getProjectBatches(project);
  return batches.find((b) => b.date === targetDate) || null;
}

export function isBatchSubmitted(batch) {
  if (!batch) return false;
  if (batch.status === 'completed') return true;
  const hasFiles = Array.isArray(batch.files) && batch.files.length > 0;
  const hasItemsFiles = Array.isArray(batch.items) && batch.items.some((i) => i.isCompleted || i.value);
  const hasNote = Boolean(batch.note && batch.note.trim());
  return hasFiles || hasItemsFiles || hasNote;
}

export function isTodaySubmitted(project) {
  if (!project) return false;
  const todayBatch = getCurrentBatch(project, getTodayDateString());
  return isBatchSubmitted(todayBatch);
}
