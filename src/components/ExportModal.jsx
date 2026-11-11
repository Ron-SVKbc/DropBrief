import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import '../styles/export-modal-brutalist.css';
import {
  X,
  Download,
  Copy,
  Check,
  FolderDown,
  FileText,
  File,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Send,
  ShieldCheck,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileArchive,
  RotateCcw
} from 'lucide-react';

const isImageFile = (fileName, mimeType) => {
  if (mimeType && mimeType.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|svg|heic|heif|bmp|avif)$/i.test(fileName || '');
};

const sanitizeFolderName = (name) => {
  if (!name || typeof name !== 'string') return 'Deliverables';
  return name
    .replace(/[\x00-\x1f]/g, '')
    .replace(/[\\/]/g, ' - ')
    .replace(/[:]/g, ' - ')
    .replace(/[*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*-+\s*/g, ' - ')
    .replace(/^[. ]+|[. ]+$/g, '')
    .substring(0, 100)
    .trim() || 'Deliverables';
};

export default function ExportModal() {
  const {
    projects,
    exportModalProject,
    closeExportModal,
    openReminderModal,
    addToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'completed' | 'files' | 'texts' | 'missing'
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [expandedTextIds, setExpandedTextIds] = useState({});

  // Reset transient filters/copy state when opening a different docket
  useEffect(() => {
    setSearchQuery('');
    setActiveFilter('all');
    setExpandedTextIds({});
    setCopiedKey(null);
  }, [exportModalProject?.id]);

  // Close modal on Escape key press (WCAG 2.1.2)
  useEffect(() => {
    if (!exportModalProject) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeExportModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exportModalProject, closeExportModal]);

  if (!exportModalProject) return null;

  const project = (projects || []).find((p) => p.id === exportModalProject.id) || exportModalProject;
  const items = project.items || [];
  const completedItems = items.filter((i) => i.isCompleted);
  const missingItems = items.filter((i) => !i.isCompleted);
  const totalCount = items.length;
  const completedCount = completedItems.length;
  const missingCount = missingItems.length;
  const fileItemsCount = items.filter((i) => i.type === 'file').length;
  const textItemsCount = items.filter((i) => i.type === 'text').length;

  // Helper to extract files array from an item
  const getItemFiles = (item) => {
    if (item.type !== 'file' || !item.isCompleted || !item.value) return [];
    if (Array.isArray(item.value.files)) return item.value.files;
    if (item.value.fileName) return [item.value];
    return [];
  };

  // Helper to extract text from an item
  const getItemText = (item) => {
    if (item.type !== 'text' || !item.isCompleted || !item.value) return '';
    if (typeof item.value === 'string') return item.value;
    if (item.value.text) return item.value.text;
    return typeof item.value === 'object' ? JSON.stringify(item.value, null, 2) : String(item.value);
  };

  // Counts
  const totalFilesCount = items.reduce((acc, it) => acc + getItemFiles(it).length, 0);
  const totalTextsCount = items.filter((it) => it.type === 'text' && it.isCompleted).length;

  // Filtered items
  const filteredItems = items.filter((item) => {
    const term = searchQuery.toLowerCase().trim();
    const files = getItemFiles(item);
    const text = getItemText(item);

    const matchesSearch = 
      !term ||
      item.title.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      text.toLowerCase().includes(term) ||
      files.some((f) => (f.fileName && f.fileName.toLowerCase().includes(term)));

    if (!matchesSearch) return false;

    if (activeFilter === 'completed') return item.isCompleted;
    if (activeFilter === 'missing') return !item.isCompleted;
    if (activeFilter === 'files') return item.type === 'file';
    if (activeFilter === 'texts') return item.type === 'text';
    return true;
  });

  // Copy with visual feedback
  const handleCopy = (text, key, successMsg) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast(successMsg || 'Copied to clipboard!', 'success', 'Copied');
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2200);
  };

  // Download single file
  const handleDownloadSingleFile = async (file) => {
    const fileName = file.fileName || 'file';
    
    if (file.url) {
      try {
        const resp = await fetch(file.url, { signal: AbortSignal.timeout(12000) });
        if (!resp.ok) throw new Error('Fetch failed');
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        addToast(`File "${fileName}" was successfully downloaded.`, 'success', 'File Downloaded');
        return;
      } catch (err) {
        // Fallback for CORS or direct downloads
        const a = document.createElement('a');
        a.href = file.url;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast(`Download of "${fileName}" started.`, 'info', 'Downloading');
        return;
      }
    }

    // Demo/offline simulated file download
    const demoContent = `DropBrief — Deliverable from project: ${project.title}\nFile name: ${fileName}\nSize: ${file.fileSize || 'N/A'}\nDelivered: ${file.uploadedAt || new Date().toLocaleString('en-US')}\n\nThis file was recorded in DropBrief.`;
    const blob = new Blob([demoContent], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    addToast(`File "${fileName}" was downloaded.`, 'success', 'File Downloaded');
  };

  // Download single text item as .txt
  const handleDownloadTextItem = (item) => {
    const text = getItemText(item);
    if (!text) return;
    const cleanTitle = sanitizeFolderName(item.title);
    const fileContent = `Requirement: ${item.title}\nProject: ${project.title}\nClient: ${project.clientName} (${project.clientEmail})\nDelivered: ${item.completedAt ? new Date(item.completedAt).toLocaleString('en-US') : 'N/A'}\n${'='.repeat(60)}\n\n${text}\n`;
    
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanTitle}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast(`Text requirement "${item.title}" downloaded as .txt file.`, 'success', 'Text Downloaded');
  };

  // Download all files from a single item as sub-zip
  const handleDownloadItemFilesZip = async (item) => {
    const files = getItemFiles(item);
    if (files.length === 0) return;
    if (files.length === 1) {
      handleDownloadSingleFile(files[0]);
      return;
    }

    try {
      const zip = new JSZip();
      const folderName = sanitizeFolderName(item.title);
      const folder = zip.folder(folderName);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.url) {
          try {
            const resp = await fetch(file.url, { signal: AbortSignal.timeout(15000) });
            const blob = await resp.blob();
            folder.file(file.fileName, blob);
          } catch (e) {
            folder.file(`${file.fileName}_link.txt`, `URL: ${file.url}\nFile: ${file.fileName}`);
          }
        } else {
          folder.file(file.fileName, `DropBrief file: ${file.fileName}\nSize: ${file.fileSize || 'N/A'}`);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast(`Files from "${item.title}" downloaded in ZIP.`, 'success', 'ZIP Downloaded');
    } catch (err) {
      addToast('Failed to create archive for this item.', 'danger', 'Error');
    }
  };

  // Download EVERYTHING as a folder (.ZIP archive)
  const handleDownloadAllAsFolder = async () => {
    if (completedItems.length === 0) {
      addToast('This project does not contain any delivered assets yet.', 'warning', 'No Deliverables');
      return;
    }

    setIsZipping(true);
    setZipProgress('Preparing folder structure in ZIP...');

    try {
      const zip = new JSZip();

      // 1. Text Summary File (DELIVERABLES_OVERVIEW.txt)
      let summaryText = `======================================================================\n`;
      summaryText += `DROPBRIEF — COMPLETE PROJECT DELIVERABLES EXPORT\n`;
      summaryText += `======================================================================\n\n`;
      summaryText += `Project:         ${project.title}\n`;
      summaryText += `Client:          ${project.clientName} <${project.clientEmail}>\n`;
      summaryText += `Freelancer:      ${project.freelancerName || 'Freelancer'}\n`;
      summaryText += `Deadline:        ${project.deadline || 'None'}\n`;
      summaryText += `Export Date:     ${new Date().toLocaleString('en-US')}\n`;
      summaryText += `Progress:        ${completedCount} of ${totalCount} requirements completed (${totalCount > 0 ? Math.round((completedCount/totalCount)*100) : 0}%)\n\n`;
      summaryText += `----------------------------------------------------------------------\n`;
      summaryText += `LIST OF COMPLETED AND PENDING ITEMS\n`;
      summaryText += `----------------------------------------------------------------------\n\n`;

      items.forEach((item, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        const statusStr = item.isCompleted ? '[DELIVERED]' : '[MISSING - PENDING CLIENT]';
        summaryText += `${num}. ${statusStr} ${item.title} (${item.type === 'file' ? 'File' : 'Text'})\n`;
        if (item.description) summaryText += `    Description: ${item.description}\n`;
        if (item.isCompleted && item.completedAt) {
          summaryText += `    Delivered At: ${new Date(item.completedAt).toLocaleString('en-US')}\n`;
        }
        if (item.type === 'file' && item.isCompleted) {
          const fs = getItemFiles(item);
          summaryText += `    Number of files: ${fs.length}\n`;
          fs.forEach((f) => {
            summaryText += `      - ${f.fileName} (${f.fileSize || 'N/A'})\n`;
          });
        }
        summaryText += `\n`;
      });

      zip.file('DELIVERABLES_OVERVIEW.txt', summaryText);

      // 2. Structured JSON export
      const jsonExport = {
        project: project.title,
        slug: project.slug,
        client: project.clientName,
        clientEmail: project.clientEmail,
        freelancer: project.freelancerName,
        deadline: project.deadline,
        exportedAt: new Date().toISOString(),
        items: items.map((i) => ({
          title: i.title,
          type: i.type,
          required: i.required,
          isCompleted: i.isCompleted,
          completedAt: i.completedAt,
          value: i.value,
        }))
      };
      zip.file('deliverables_structure.json', JSON.stringify(jsonExport, null, 2));

      // 3. Process each completed item into its dedicated clean subfolder
      const usedFolderNames = new Map();

      for (let idx = 0; idx < completedItems.length; idx++) {
        const item = completedItems[idx];
        const baseFolderName = sanitizeFolderName(item.title);

        let folderName = baseFolderName;
        if (usedFolderNames.has(baseFolderName)) {
          const count = usedFolderNames.get(baseFolderName) + 1;
          usedFolderNames.set(baseFolderName, count);
          folderName = `${baseFolderName} (${count})`;
        } else {
          usedFolderNames.set(baseFolderName, 1);
        }

        const itemFolder = zip.folder(folderName);
        const files = getItemFiles(item);
        const textVal = getItemText(item);

        // A. File Requirement: Save uploaded files directly into this item's subfolder
        if (item.type === 'file' || files.length > 0) {
          if (files.length > 0) {
            const usedFileNames = new Set();

            for (let fIdx = 0; fIdx < files.length; fIdx++) {
              const file = files[fIdx];
              setZipProgress(`Downloading [${folderName}]: ${file.fileName}...`);

              let finalFileName = file.fileName || `file_${fIdx + 1}`;
              if (usedFileNames.has(finalFileName)) {
                const ext = finalFileName.includes('.') ? finalFileName.slice(finalFileName.lastIndexOf('.')) : '';
                const base = finalFileName.includes('.') ? finalFileName.slice(0, finalFileName.lastIndexOf('.')) : finalFileName;
                finalFileName = `${base} (${fIdx + 1})${ext}`;
              }
              usedFileNames.add(finalFileName);

              if (file.url) {
                try {
                  const resp = await fetch(file.url, { signal: AbortSignal.timeout(15000) });
                  if (!resp.ok) throw new Error('Fetch failed');
                  const blob = await resp.blob();
                  itemFolder.file(finalFileName, blob);
                } catch (fetchErr) {
                  // Fallback info text if direct cross-origin fetch is blocked
                  itemFolder.file(`${finalFileName}_link.txt`, `File: ${file.fileName}\nSize: ${file.fileSize || 'N/A'}\nDirect URL:\n${file.url}`);
                }
              } else {
                // Demo simulated file
                itemFolder.file(finalFileName, `DropBrief deliverable: ${file.fileName}\nSize: ${file.fileSize || 'N/A'}\nDelivered: ${file.uploadedAt || 'N/A'}`);
              }
            }
          }
        }

        // B. Text Requirement: Save the submitted text directly into this item's subfolder
        if (item.type === 'text' || textVal) {
          setZipProgress(`Saving text [${folderName}]...`);
          const textContent = `Requirement: ${item.title}\nProject: ${project.title}\nClient: ${project.clientName} <${project.clientEmail}>\nDelivered: ${item.completedAt ? new Date(item.completedAt).toLocaleString('en-US') : 'N/A'}\n${'='.repeat(60)}\n\n${textVal || ''}\n`;
          const textFileName = `${folderName}.txt`;
          itemFolder.file(textFileName, textContent);
        }
      }

      // 4. Compress to ZIP
      setZipProgress('Compressing deliverables into ZIP archive...');
      const zipBlob = await zip.generateAsync(
        { 
          type: 'blob', 
          compression: 'DEFLATE', 
          compressionOptions: { level: 6 } 
        }, 
        (meta) => {
          if (meta.percent) {
            setZipProgress(`Compressing ZIP: ${Math.round(meta.percent)}%...`);
          }
        }
      );

      // 5. Trigger download
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${project.slug || 'dropbrief'}-complete-deliverables.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      // 6. Confetti & notification
      confetti({
        particleCount: 130,
        spread: 85,
        origin: { y: 0.6 }
      });

      addToast(
        `Complete ZIP archive (${completedCount} items) was successfully created and downloaded!`,
        'success',
        'ZIP Downloaded'
      );
    } catch (err) {
      console.error('Failed to create ZIP folder:', err);
      addToast('An error occurred while creating the ZIP folder.', 'danger', 'Error');
    } finally {
      setIsZipping(false);
      setZipProgress('');
    }
  };

  // Quick JSON export
  const handleDownloadJson = () => {
    const exportData = {
      project: project.title,
      slug: project.slug,
      client: project.clientName,
      clientEmail: project.clientEmail,
      freelancer: project.freelancerName,
      deadline: project.deadline,
      exportedAt: new Date().toISOString(),
      summary: {
        totalItems: totalCount,
        completedItems: completedCount,
        missingItems: missingCount,
      },
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        required: item.required,
        isCompleted: item.isCompleted,
        completedAt: item.completedAt,
        files: getItemFiles(item),
        textValue: getItemText(item),
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.slug || 'deliverables'}-export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast(`JSON export for "${project.title}" downloaded.`, 'success', 'JSON Downloaded');
  };

  const toggleExpandText = (itemId) => {
    setExpandedTextIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <div
      className="ed-modal-overlay"
      onClick={closeExportModal}
    >
      <div
        className="ed-modal-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ─────────────────────────────────────── */}
        <div className="ed-header">
          <div className="ed-header-left">
            <div className="ed-header-icon" aria-hidden="true">
              <FolderDown size={22} />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="ed-kicker-row">
                <span className="ed-kicker-stamp">ARCHIVE // EXPORT</span>
                <span className={`ed-ready-pill ${totalCount > 0 && completedCount === totalCount ? 'is-complete' : ''}`}>
                  {totalCount > 0 && completedCount === totalCount && <CheckCircle2 size={11} aria-hidden="true" />}
                  <span>{completedCount} / {totalCount} READY</span>
                </span>
              </div>

              <h2 id="export-modal-title" className="ed-title">
                Export &amp; Deliverables
              </h2>

              <div className="ed-meta-row">
                <span className="ed-meta-chip">
                  Project: <strong>{project.title}</strong>
                </span>
                <span className="ed-meta-sep" aria-hidden="true">&bull;</span>
                <span className="ed-meta-chip">
                  Client: <strong>{project.clientName}</strong>
                  {project.clientEmail ? ` (${project.clientEmail})` : ''}
                </span>
                {project.deadline && (
                  <>
                    <span className="ed-meta-sep" aria-hidden="true">&bull;</span>
                    <span className="ed-meta-chip">
                      Due: <strong>{project.deadline}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeExportModal}
            aria-label="Close export modal"
            className="ed-close-btn"
            title="Close window"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* ── In-progress ZIP Banner ───────────────────────────── */}
        {isZipping && (
          <div className="ed-zip-banner" role="status" aria-live="polite">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            <span>{zipProgress || 'Preparing archive and downloading files...'}</span>
          </div>
        )}

        {/* ── Scrollable / Adaptive Body Shell ─────────────────── */}
        <div className="ed-scroll-shell">
          {/* ── Studio Telemetry Bento Strip ─────────────────────── */}
          <div className="ed-telemetry-strip">
          <div className="ed-stat-card">
            <div className="ed-stat-icon is-files" aria-hidden="true">
              <File size={17} />
            </div>
            <div>
              <div className="ed-stat-label">Received Files</div>
              <div className="ed-stat-value">
                {totalFilesCount}{' '}
                <span className="ed-stat-sub">
                  file{totalFilesCount === 1 ? '' : 's'} uploaded
                </span>
              </div>
            </div>
          </div>

          <div className="ed-stat-card">
            <div className="ed-stat-icon is-texts" aria-hidden="true">
              <FileText size={17} />
            </div>
            <div>
              <div className="ed-stat-label">Text Submissions</div>
              <div className="ed-stat-value">
                {totalTextsCount}{' '}
                <span className="ed-stat-sub">
                  response{totalTextsCount === 1 ? '' : 's'} ready
                </span>
              </div>
            </div>
          </div>

          <div className="ed-stat-card">
            <div className={`ed-stat-icon ${missingCount > 0 ? 'is-pending' : 'is-ready'}`} aria-hidden="true">
              {missingCount > 0 ? <Clock size={17} /> : <CheckCircle2 size={17} />}
            </div>
            <div>
              <div className="ed-stat-label">Collection Status</div>
              <div className={`ed-stat-value ${missingCount > 0 ? 'is-pending' : 'is-complete'}`}>
                {missingCount === 0
                  ? 'All delivered (100%)'
                  : `${missingCount} item${missingCount === 1 ? '' : 's'} pending`}
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter & Search Toolbar ──────────────────────────── */}
        <div className="ed-toolbar">
          <div className="ed-search-wrap">
            <Search size={14} className="ed-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="ed-search-input"
              aria-label="Filter deliverables by title, file name, or text"
              placeholder="Search items, files, or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="ed-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                title="Clear search"
              >
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="ed-filter-tabs" role="group" aria-label="Filter deliverables by status or type">
            {[
              { id: 'all', label: `All (${totalCount})` },
              { id: 'completed', label: `Ready (${completedCount})` },
              { id: 'files', label: `Files (${fileItemsCount})` },
              { id: 'texts', label: `Texts (${textItemsCount})` },
              { id: 'missing', label: `Missing (${missingCount})`, isMissing: true }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                aria-pressed={activeFilter === tab.id}
                className={`ed-filter-tab ${activeFilter === tab.id ? 'is-active' : ''} ${tab.isMissing ? 'is-missing-tab' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable Ledger Cards Body ─────────────────────── */}
        <div className="ed-body">
          {filteredItems.length === 0 ? (
            <div className="ed-empty-state">
              <AlertCircle size={30} color="#6B7280" aria-hidden="true" />
              <h3>
                {totalCount === 0 ? 'No deliverables configured yet' : 'No matching deliverables'}
              </h3>
              <p>
                {totalCount === 0
                  ? 'Add checklist items to this docket to collect and export client assets.'
                  : 'Try adjusting your search query or switching filter tabs.'}
              </p>
              {(activeFilter !== 'all' || searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="ed-btn-sm is-outline"
                >
                  <RotateCcw size={12} aria-hidden="true" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="ed-item-list">
              {filteredItems.map((item, idx) => {
                const isDone = item.isCompleted;
                const isFile = item.type === 'file';
                const files = getItemFiles(item);
                const text = getItemText(item);
                const isTextExpanded = Boolean(expandedTextIds[item.id]);
                const firstFileCopied = copiedKey === `item-${item.id}`;
                const textCopied = copiedKey === `item-text-${item.id}`;

                return (
                  <div
                    key={item.id || idx}
                    className={`ed-item-card ${isDone ? 'is-done' : 'is-pending'}`}
                  >
                    <div className="ed-item-head">
                      {/* Left: Number + Title + Badges */}
                      <div className="ed-item-title-cluster">
                        <div className={`ed-index-badge ${isDone ? 'is-done' : 'is-pending'}`}>
                          {String(idx + 1).padStart(2, '0')}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="ed-item-title-row">
                            <span className="ed-item-title">{item.title}</span>
                          </div>

                          <div className="ed-item-badges">
                            <span className={`ed-micro-pill ${isFile ? 'ed-pill-file' : 'ed-pill-text'}`}>
                              {isFile ? 'File' : 'Text'}
                            </span>
                            <span className={`ed-micro-pill ${item.required ? 'ed-pill-req' : 'ed-pill-opt'}`}>
                              {item.required ? 'Required' : 'Optional'}
                            </span>
                            {isDone ? (
                              <span className="ed-micro-pill ed-pill-delivered">
                                <CheckCircle2 size={10} aria-hidden="true" />
                                <span>Delivered</span>
                              </span>
                            ) : (
                              <span className="ed-micro-pill ed-pill-pending">
                                <Clock size={10} aria-hidden="true" />
                                <span>Pending Client</span>
                              </span>
                            )}
                            {isDone && item.completedAt && (
                              <span className="ed-timestamp">
                                {new Date(item.completedAt).toLocaleDateString('en-US', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="ed-item-desc">{item.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Item Quick Actions */}
                      <div className="ed-item-actions">
                        {isDone ? (
                          isFile ? (
                            <>
                              {files.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadItemFilesZip(item)}
                                  className="ed-btn-sm is-dark"
                                  title={`Download all ${files.length} files for this item as ZIP`}
                                >
                                  <FileArchive size={13} aria-hidden="true" />
                                  <span>ZIP ({files.length})</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSingleFile(files[0] || item.value)}
                                  className="ed-btn-sm is-yellow"
                                  title="Download this file"
                                >
                                  <Download size={13} aria-hidden="true" />
                                  <span>Download</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  const linkToCopy = files[0]?.url || files[0]?.fileName || 'file';
                                  handleCopy(linkToCopy, `item-${item.id}`, 'File link copied!');
                                }}
                                className={`ed-btn-sm ${firstFileCopied ? 'is-copied' : 'is-outline'}`}
                                title="Copy download link"
                              >
                                {firstFileCopied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                                <span>{firstFileCopied ? 'Copied!' : 'Copy Link'}</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCopy(text, `item-text-${item.id}`, 'Text copied to clipboard!')}
                                className={`ed-btn-sm ${textCopied ? 'is-copied' : 'is-yellow'}`}
                                title="Copy submitted text to clipboard"
                              >
                                {textCopied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                                <span>{textCopied ? 'Copied!' : 'Copy Text'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownloadTextItem(item)}
                                className="ed-btn-sm is-outline"
                                title="Download copy as .txt file"
                              >
                                <FileText size={12} aria-hidden="true" />
                                <span>.TXT</span>
                              </button>
                            </>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              closeExportModal();
                              openReminderModal(project.id);
                            }}
                            className="ed-btn-sm is-remind"
                            title="Send client a reminder for this requirement"
                          >
                            <Send size={12} aria-hidden="true" />
                            <span>Remind Client</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Item Payload Preview */}
                    <div className="ed-item-payload">
                      {isDone ? (
                        isFile ? (
                          files.length === 0 ? (
                            <div className="ed-file-chip">
                              <span style={{ fontSize: '0.82rem', color: 'var(--ed-ink-secondary)', fontWeight: 600 }}>
                                File submitted by client
                              </span>
                            </div>
                          ) : (
                            <div className="ed-file-stack">
                              {files.map((f, fIdx) => {
                                const isImg = isImageFile(f.fileName, f.fileType);
                                const fileCopyKey = `file-${item.id}-${fIdx}`;
                                const isFileCopied = copiedKey === fileCopyKey;

                                return (
                                  <div key={f.id || fIdx} className="ed-file-chip">
                                    <div className="ed-file-info">
                                      {isImg && f.url ? (
                                        <img
                                          src={f.url}
                                          alt={f.fileName || 'Preview of uploaded image'}
                                          className="ed-file-thumb"
                                        />
                                      ) : (
                                        <div className="ed-file-icon-tile" aria-hidden="true">
                                          {isImg ? <ImageIcon size={15} /> : <File size={15} />}
                                        </div>
                                      )}

                                      <div style={{ minWidth: 0, flex: 1 }}>
                                        <div className="ed-file-name" title={f.fileName}>
                                          {f.fileName}
                                        </div>
                                        <div className="ed-file-size">
                                          {f.fileSize || 'File ready'}
                                        </div>
                                      </div>
                                    </div>

                                    {(f.url || files.length > 1) && (
                                      <div className="ed-file-mini-actions">
                                        {f.url && (
                                          <a
                                            href={f.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ed-icon-btn"
                                            title="Open file in new tab"
                                            aria-label={`Open ${f.fileName} in new tab`}
                                          >
                                            <ExternalLink size={13} aria-hidden="true" />
                                          </a>
                                        )}

                                        {files.length > 1 && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => handleDownloadSingleFile(f)}
                                              className="ed-icon-btn"
                                              title="Download this file"
                                              aria-label={`Download ${f.fileName}`}
                                            >
                                              <Download size={13} aria-hidden="true" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleCopy(f.url || f.fileName, fileCopyKey, 'File link copied!')}
                                              className="ed-icon-btn"
                                              title="Copy link to file"
                                              aria-label={`Copy link for ${f.fileName}`}
                                            >
                                              {isFileCopied ? <Check size={13} color="#065F46" aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )
                        ) : (
                          <div>
                            <div className={`ed-text-box ${!isTextExpanded && text && text.length > 140 ? 'is-clamped' : ''}`}>
                              {text || 'Empty text'}
                            </div>
                            {text && text.length > 140 && (
                              <button
                                type="button"
                                onClick={() => toggleExpandText(item.id)}
                                className="ed-expand-btn"
                              >
                                {isTextExpanded ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
                                <span>{isTextExpanded ? 'Collapse text' : 'Show full text'}</span>
                              </button>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="ed-missing-strip">
                          <AlertCircle size={14} aria-hidden="true" />
                          <span>Not submitted yet &mdash; waiting on client upload</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>

        {/* ── Sticky Action Footer ─────────────────────────────── */}
        <div className="ed-footer">
          <div className="ed-trust-note">
            <ShieldCheck size={16} color="#059669" aria-hidden="true" />
            <span>EU cloud encrypted &bull; ZIP includes per-item folders, summary &amp; JSON</span>
          </div>

          <div className="ed-footer-actions">
            <button
              type="button"
              onClick={closeExportModal}
              className="ed-btn-lg is-secondary"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="ed-btn-lg is-secondary"
              title="Download structured project metadata in JSON format"
            >
              <Download size={14} aria-hidden="true" />
              <span>JSON</span>
            </button>

            <button
              id="btn-export-download-all-zip"
              type="button"
              onClick={handleDownloadAllAsFolder}
              disabled={isZipping || completedCount === 0}
              className="ed-btn-lg is-primary-zip"
              title="Download all delivered assets neatly organized in a single ZIP folder"
            >
              {isZipping ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <FolderDown size={15} aria-hidden="true" />}
              <span>{isZipping ? 'Packing ZIP...' : 'Download All (.ZIP)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
