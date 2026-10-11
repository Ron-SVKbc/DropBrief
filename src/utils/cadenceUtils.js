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

export function formatDateSlovak(dateStr) {
  if (!dateStr) return '';
  try {
    const todayStr = getTodayDateString();
    
    // Včerajší dátum
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10);
      const year = parts[0];

      if (dateStr === todayStr) {
        return `Dnes (${day}. ${month}. ${year})`;
      }
      if (dateStr === yesterdayStr) {
        return `Včera (${day}. ${month}. ${year})`;
      }
      return `${day}. ${month}. ${year}`;
    }

    const d = new Date(dateStr);
    return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

export function formatCadenceDays(days) {
  const d = Number(days) || 1;
  if (d === 1) return 'Každý 1 deň (denne)';
  if (d === 2) return 'Každé 2 dni';
  if (d === 3) return 'Každé 3 dni';
  if (d === 7) return 'Každý týždeň (7 dní)';
  if (d === 14) return 'Každé 2 týždne (14 dní)';
  if (d === 30) return 'Každý mesiac (30 dní)';
  if (d >= 2 && d <= 4) return `Každé ${d} dni`;
  return `Každých ${d} dní`;
}

export function formatCadenceBadge(days) {
  const d = Number(days) || 1;
  if (d === 1) return 'Denne';
  if (d === 2) return 'Každé 2 dni';
  if (d === 7) return 'Týždenne';
  if (d === 30) return 'Mesačne';
  return `${d} dní`;
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
