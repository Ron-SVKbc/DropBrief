import React, { useState } from 'react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
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
  Sparkles, 
  Send, 
  ShieldCheck, 
  Loader2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileArchive,
  Layers
} from 'lucide-react';

const isImageFile = (fileName, mimeType) => {
  if (mimeType && mimeType.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|svg|heic|heif|bmp|avif)$/i.test(fileName || '');
};

const sanitizeFileName = (name) => {
  return (name || 'file')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 80);
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

  if (!exportModalProject) return null;

  const project = exportModalProject;
  const items = project.items || [];
  const completedItems = items.filter((i) => i.isCompleted);
  const missingItems = items.filter((i) => !i.isCompleted);
  const totalCount = items.length;
  const completedCount = completedItems.length;
  const missingCount = missingItems.length;

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
      className="modal-overlay"
      onClick={closeExportModal}
    >
      <div 
        className="export-modal-card animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ── Modal Header ─────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-medium)',
          background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(13, 18, 34, 0.95) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              width: '42px', height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-gradient)',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--glow-accent)',
              flexShrink: 0
            }}>
              <FolderDown size={22} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Export & Deliverables Download
                </h2>
                <span className="badge badge-accent" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  {completedCount} of {totalCount} ready
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }} className="truncate">
                Project: <strong style={{ color: 'var(--text-primary)' }}>{project.title}</strong> &bull; Client: <strong style={{ color: 'var(--text-primary)' }}>{project.clientName}</strong> ({project.clientEmail})
              </p>
            </div>
          </div>

          {/* Top Actions in Header */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Primary Action: Download Everything as a Folder (ZIP) */}
            <button
              id="btn-export-download-all-zip"
              onClick={handleDownloadAllAsFolder}
              disabled={isZipping || completedCount === 0}
              className="btn btn-primary btn-pill"
              style={{
                boxShadow: completedCount > 0 ? 'var(--glow-accent)' : 'none',
                fontWeight: 700,
                gap: '8px'
              }}
              title="Download all delivered assets neatly organized in a single ZIP folder"
            >
              {isZipping ? <Loader2 size={16} className="animate-spin" /> : <FolderDown size={16} />}
              {isZipping ? (zipProgress || 'Creating folder...') : 'Download All as Folder (.ZIP)'}
            </button>

            {/* JSON Export */}
            <button
              onClick={handleDownloadJson}
              className="btn btn-secondary btn-pill"
              style={{ fontSize: '0.8rem', padding: '8px 12px' }}
              title="Download raw data in JSON format"
            >
              <Download size={13} />
              JSON
            </button>

            {/* Close */}
            <button
              onClick={closeExportModal}
              className="btn btn-secondary"
              style={{ borderRadius: 'var(--radius-full)', padding: '7px' }}
              title="Close window"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ── In-progress ZIP Banner ────────────────────────────── */}
        {isZipping && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.18) 0%, rgba(139, 92, 246, 0.22) 100%)',
            borderBottom: '1px solid var(--border-accent)',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Loader2 size={16} className="animate-spin" color="var(--accent-primary)" />
            <div style={{ fontSize: '0.84rem', color: '#e0e7ff', fontWeight: 600 }}>
              {zipProgress || 'Preparing archive and downloading files...'}
            </div>
          </div>
        )}

        {/* ── Subheader Metric Bento Chips ──────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '16px 24px',
          background: 'rgba(7, 10, 18, 0.65)',
          borderBottom: '1px solid var(--border-hairline)'
        }}>
          {/* Files count */}
          <div style={{
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.14)',
              color: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <File size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Received Files
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {totalFilesCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>files in project</span>
              </div>
            </div>
          </div>

          {/* Texts count */}
          <div style={{
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(168, 85, 247, 0.14)',
              color: '#c084fc',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FileText size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Text Deliverables
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {totalTextsCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>text submissions</span>
              </div>
            </div>
          </div>

          {/* Missing items */}
          <div style={{
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: missingCount > 0 ? 'var(--warning-bg)' : 'var(--success-bg)',
              color: missingCount > 0 ? 'var(--warning)' : 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {missingCount > 0 ? <Clock size={16} /> : <CheckCircle2 size={16} />}
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Pending from Client
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: missingCount > 0 ? 'var(--warning-light)' : 'var(--success-light)' }}>
                {missingCount === 0 ? 'All delivered (100%)' : `${missingCount} requirements pending`}
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter & Search Toolbar ───────────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 24px',
          background: 'rgba(9, 13, 24, 0.85)',
          borderBottom: '1px solid var(--border-hairline)'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              className="input"
              placeholder="Filter by title, file name, or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '34px',
                paddingRight: searchQuery ? '32px' : '12px',
                fontSize: '0.8rem',
                paddingTop: '7px',
                paddingBottom: '7px'
              }}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Segmented Filter Pills */}
          <div className="segmented-control">
            <button
              onClick={() => setActiveFilter('all')}
              className={`btn btn-sm btn-pill ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 11px', fontSize: '0.74rem' }}
            >
              All &bull; {totalCount}
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`btn btn-sm btn-pill ${activeFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 11px', fontSize: '0.74rem', color: activeFilter === 'completed' ? '#fff' : 'var(--success-light)' }}
            >
              Delivered &bull; {completedCount}
            </button>
            <button
              onClick={() => setActiveFilter('files')}
              className={`btn btn-sm btn-pill ${activeFilter === 'files' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 11px', fontSize: '0.74rem' }}
            >
              Files Only
            </button>
            <button
              onClick={() => setActiveFilter('texts')}
              className={`btn btn-sm btn-pill ${activeFilter === 'texts' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 11px', fontSize: '0.74rem' }}
            >
              Text Only
            </button>
            <button
              onClick={() => setActiveFilter('missing')}
              className={`btn btn-sm btn-pill ${activeFilter === 'missing' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 11px', fontSize: '0.74rem', color: activeFilter === 'missing' ? '#fff' : 'var(--warning-light)' }}
            >
              Missing &bull; {missingCount}
            </button>
          </div>
        </div>

        {/* ── Table Container ───────────────────────────────────── */}
        <div className="export-table-container" style={{ margin: '0 24px 16px', borderRadius: 'var(--radius-lg)' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <AlertCircle size={36} color="var(--text-tertiary)" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>No matching items</h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.825rem' }}>
                Adjust your filter or search query to view requirements.
              </p>
            </div>
          ) : (
            <table className="export-table">
              <thead>
                <tr>
                  <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                  <th style={{ minWidth: '220px' }}>Requirement & Type</th>
                  <th style={{ minWidth: '130px' }}>Submission Status</th>
                  <th style={{ minWidth: '320px' }}>Received Content</th>
                  <th style={{ minWidth: '220px', textAlign: 'right' }}>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const isDone = item.isCompleted;
                  const isFile = item.type === 'file';
                  const files = getItemFiles(item);
                  const text = getItemText(item);
                  const isTextExpanded = Boolean(expandedTextIds[item.id]);

                  return (
                    <tr key={item.id || idx}>
                      {/* 1. Index & Type Icon */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{
                          width: '28px', height: '28px',
                          borderRadius: 'var(--radius-xs)',
                          background: isDone ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: isDone ? 'var(--success)' : 'var(--warning)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.74rem', fontWeight: 700
                        }}>
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                      </td>

                      {/* 2. Title & Type badges */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {item.title}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className={`badge ${isFile ? 'badge-accent' : 'badge-violet'}`} style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                            {isFile ? 'File' : 'Text'}
                          </span>
                          {item.required ? (
                            <span className="badge badge-neutral" style={{ fontSize: '0.64rem', padding: '1px 5px', color: 'var(--warning-light)' }}>
                              Required
                            </span>
                          ) : (
                            <span className="badge badge-neutral" style={{ fontSize: '0.64rem', padding: '1px 5px', opacity: 0.7 }}>
                              Optional
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', marginTop: '4px', lineHeight: 1.4 }}>
                            {item.description}
                          </div>
                        )}
                      </td>

                      {/* 3. Status Column */}
                      <td>
                        {isDone ? (
                          <div>
                            <span className="badge badge-success" style={{ gap: '4px', fontSize: '0.72rem', padding: '3px 8px' }}>
                              <CheckCircle2 size={12} />
                              Delivered
                            </span>
                            {item.completedAt && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                                {new Date(item.completedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="badge badge-warning" style={{ gap: '4px', fontSize: '0.72rem', padding: '3px 8px' }}>
                              <Clock size={12} />
                              Pending from client
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 4. Submitted Content */}
                      <td>
                        {isDone ? (
                          isFile ? (
                            /* File(s) list */
                            files.length === 0 ? (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                File submitted by client
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {files.map((f, fIdx) => {
                                  const isImg = isImageFile(f.fileName, f.fileType);
                                  const fileCopyKey = `file-${item.id}-${fIdx}`;
                                  const isFileCopied = copiedKey === fileCopyKey;

                                  return (
                                    <div 
                                      key={f.id || fIdx} 
                                      className="export-file-chip"
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                        {/* Image thumbnail or File icon */}
                                        {isImg && f.url ? (
                                          <img 
                                            src={f.url} 
                                            alt={f.fileName} 
                                            style={{
                                              width: '32px', height: '32px',
                                              objectFit: 'cover',
                                              borderRadius: 'var(--radius-xs)',
                                              border: '1px solid var(--border-subtle)',
                                              flexShrink: 0
                                            }} 
                                          />
                                        ) : (
                                          <div style={{
                                            width: '32px', height: '32px',
                                            borderRadius: 'var(--radius-xs)',
                                            background: 'rgba(99, 102, 241, 0.12)',
                                            color: 'var(--accent-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                          }}>
                                            {isImg ? <ImageIcon size={15} /> : <File size={15} />}
                                          </div>
                                        )}

                                        <div style={{ minWidth: 0 }}>
                                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }} className="truncate" title={f.fileName}>
                                            {f.fileName}
                                          </div>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                            {f.fileSize || 'Unknown size'}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Sub-actions per file if multi */}
                                      {files.length > 1 && (
                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                          <button
                                            type="button"
                                            onClick={() => handleDownloadSingleFile(f)}
                                            className="btn btn-secondary btn-sm"
                                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                            title="Download this file"
                                          >
                                            <Download size={11} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleCopy(f.url || f.fileName, fileCopyKey, 'File link copied!')}
                                            className="btn btn-secondary btn-sm"
                                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                            title="Copy link to file"
                                          >
                                            {isFileCopied ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          ) : (
                            /* Text submission */
                            <div>
                              <div style={{
                                background: 'rgba(0, 0, 0, 0.35)',
                                border: '1px solid var(--border-hairline)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '8px 12px',
                                fontSize: '0.82rem',
                                color: '#f1f5f9',
                                lineHeight: 1.5,
                                maxHeight: isTextExpanded ? 'none' : '90px',
                                overflow: 'hidden',
                                position: 'relative',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'var(--font-sans)'
                              }}>
                                {text || 'Empty text'}
                              </div>
                              {text && text.length > 140 && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandText(item.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--accent-primary-light)',
                                    fontSize: '0.72rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    marginTop: '4px',
                                    cursor: 'pointer',
                                    padding: 0
                                  }}
                                >
                                  {isTextExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  {isTextExpanded ? 'Collapse text' : 'Show full text'}
                                </button>
                              )}
                            </div>
                          )
                        ) : (
                          /* Missing placeholder */
                          <div style={{
                            padding: '8px 12px',
                            background: 'rgba(245, 158, 11, 0.04)',
                            border: '1px dashed rgba(245, 158, 11, 0.22)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--warning-light)',
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <AlertCircle size={13} />
                            <span>Not submitted yet</span>
                          </div>
                        )}
                      </td>

                      {/* 5. Actions Column (Download / Copy) */}
                      <td style={{ textAlign: 'right' }}>
                        {isDone ? (
                          isFile ? (
                            /* Actions for File Item */
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {/* Download file / archive */}
                              {files.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadItemFilesZip(item)}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.76rem', padding: '5px 10px', gap: '5px' }}
                                  title={`Download all ${files.length} files for this item`}
                                >
                                  <FileArchive size={12} />
                                  Download files ({files.length})
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSingleFile(files[0] || item.value)}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '0.76rem', padding: '5px 10px', gap: '5px' }}
                                  title="Download this file"
                                >
                                  <Download size={12} />
                                  Download file
                                </button>
                              )}

                              {/* Copy link */}
                              <button
                                type="button"
                                onClick={() => {
                                  const linkToCopy = files[0]?.url || files[0]?.fileName || 'file';
                                  handleCopy(linkToCopy, `item-${item.id}`, 'File link copied!');
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.76rem', padding: '5px 9px', gap: '5px' }}
                                title="Copy download link"
                              >
                                {copiedKey === `item-${item.id}` ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                                {copiedKey === `item-${item.id}` ? 'Copied!' : 'Copy link'}
                              </button>
                            </div>
                          ) : (
                            /* Actions for Text Item */
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {/* Copy text */}
                              <button
                                type="button"
                                onClick={() => handleCopy(text, `item-text-${item.id}`, 'Text copied to clipboard!')}
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.76rem', padding: '5px 10px', gap: '5px' }}
                                title="Copy submitted text to clipboard"
                              >
                                {copiedKey === `item-text-${item.id}` ? <Check size={12} /> : <Copy size={12} />}
                                {copiedKey === `item-text-${item.id}` ? 'Copied!' : 'Copy text'}
                              </button>

                              {/* Download as .txt */}
                              <button
                                type="button"
                                onClick={() => handleDownloadTextItem(item)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.76rem', padding: '5px 9px', gap: '5px' }}
                                title="Download copy as .txt file"
                              >
                                <FileText size={12} />
                                Download .txt
                              </button>
                            </div>
                          )
                        ) : (
                          /* Actions for Missing Item */
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => {
                                closeExportModal();
                                openReminderModal(project.id);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--warning-light)', borderColor: 'var(--warning-border)', fontSize: '0.76rem', padding: '5px 10px', gap: '5px' }}
                              title="Send client a reminder for this requirement"
                            >
                              <Send size={11} />
                              Remind client
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Modal Footer ─────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 24px',
          borderTop: '1px solid var(--border-medium)',
          background: 'rgba(7, 10, 18, 0.95)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            <ShieldCheck size={16} color="var(--success)" />
            <span>Files are encrypted in EU cloud storage and ready for immediate workflow processing.</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={closeExportModal}
              className="btn btn-secondary btn-sm btn-pill"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDownloadAllAsFolder}
              disabled={isZipping || completedCount === 0}
              className="btn btn-primary btn-sm btn-pill"
              style={{ fontWeight: 700, gap: '6px' }}
            >
              {isZipping ? <Loader2 size={14} className="animate-spin" /> : <FolderDown size={14} />}
              Download All as Folder (.ZIP)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
