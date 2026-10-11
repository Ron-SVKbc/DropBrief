import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { uploadClientFile, isSupabaseConfigured } from '../lib/supabase';
import { 
  getTodayDateString, 
  formatDateSlovak, 
  formatCadenceDays, 
  getCurrentBatch, 
  isBatchSubmitted, 
  isTodaySubmitted, 
  getProjectBatches 
} from '../utils/cadenceUtils';
import { 
  CheckCircle2, 
  Upload, 
  FileText, 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  FileCheck2, 
  AlertCircle,
  Sparkles,
  Lock,
  Trash2,
  File,
  Eye,
  Download,
  Loader2,
  Plus,
  X,
  User,
  Calendar,
  Check,
  FlaskConical,
  RotateCcw,
  Zap,
  RefreshCw,
  Layers
} from 'lucide-react';

const isImageFile = (fileName, mimeType) => {
  if (mimeType && mimeType.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|svg|heic|heif|bmp|avif)$/i.test(fileName || '');
};

// Initial state for sandbox interactive preview (1 item completed, 3 pending)
const createInitialDemoProject = () => ({
  id: 'demo-sandbox-project',
  slug: 'demo-preview',
  title: 'Tvorba webstránky & Vizuálna identita – Kaviareň Aurora',
  projectType: 'one-off',
  clientName: 'Peter Novák (Bistro & Café Aurora)',
  clientEmail: 'peter.novak@auroracafe.sk',
  freelancerName: 'Štúdio Creative / Marko',
  freelancerEmail: 'kontakt@studio-creative.sk',
  deadline: '2026-10-30',
  reminderFrequency: 3,
  lastReminderSent: null,
  createdAt: '2026-10-01',
  status: 'pending',
  isDemoSandbox: true,
  items: [
    {
      id: 'demo-item-1',
      title: 'Vektorové logo firmy (SVG / AI / PDF)',
      description: 'Preferovaný vektorový formát (.SVG, .AI) alebo grafika vo vysokom rozlíšení s priehľadným pozadím (.PNG).',
      type: 'file',
      required: true,
      isCompleted: true, // Ukážkovo nahratá položka, aby návštevník videl stav hotového súboru
      completedAt: '2026-10-02T10:30:00Z',
      value: {
        fileName: 'aurora_logo_vector_final.svg',
        fileSize: '420 KB',
        fileType: 'image/svg+xml',
        url: null,
        uploadedAt: '02.10.2026 10:30',
      },
    },
    {
      id: 'demo-item-2',
      title: 'Texty pre web (O nás, Príbeh kaviarne a ponuka špecialít)',
      description: 'Vložte texty pre novú webstránku, popis ponuky alebo kľúčové body vášho podnikania.',
      type: 'text',
      required: true,
      isCompleted: false, // Čaká na zadanie textu
      completedAt: null,
      value: null,
    },
    {
      id: 'demo-item-3',
      title: 'Fotografie priestorov a kávy (5 až 10 fotiek)',
      description: 'Nahrajte reprezentatívne fotografie interiéru, kávy a dezertov vo vysokej kvalite.',
      type: 'file',
      required: true,
      isCompleted: false, // Čaká na nahratie fotografií
      completedAt: null,
      value: null,
    },
    {
      id: 'demo-item-4',
      title: 'Dizajnový manuál & Farebná paleta (PDF)',
      description: 'Firemné farby (HEX kódy) alebo existujúci brand manuál, ak ho máte k dispozícii.',
      type: 'file',
      required: false,
      isCompleted: false, // Voliteľná položka
      completedAt: null,
      value: null,
    },
  ],
});

export default function ClientPortal() {
  const { 
    projects, 
    activeProjectSlug, 
    openDashboard, 
    openProjectDetail, 
    updateItemValue, 
    submitOngoingBatch,
    addToast,
    fetchProjectBySlug,
    isLoadingDb,
    currentFreelancer
  } = useApp();

  // Demo mode is ONLY active if activeProjectSlug is explicitly 'demo-preview'
  const isDemoMode = Boolean(activeProjectSlug === 'demo-preview');

  // Freelancer cannot upload files or submit text on behalf of clients in real projects
  const isFreelancerReadOnly = Boolean(currentFreelancer && !isDemoMode);

  // Isolated demo state - lives in local memory and never sends to remote server
  const [demoProject, setDemoProject] = useState(createInitialDemoProject);

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState(null);
  const [textInputs, setTextInputs] = useState({});
  const [dragActiveId, setDragActiveId] = useState(null);
  const [stagedFiles, setStagedFiles] = useState({}); // { [itemId]: [File, File, ...] }
  const [stagedPreviews, setStagedPreviews] = useState({}); // { [itemId]: [url1, url2, ...] }

  // Prevent browser default behavior when dragging files onto the window
  useEffect(() => {
    const preventDefaultDrop = (e) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventDefaultDrop);
    window.addEventListener('drop', preventDefaultDrop);
    return () => {
      window.removeEventListener('dragover', preventDefaultDrop);
      window.removeEventListener('drop', preventDefaultDrop);
    };
  }, []);

  // Generate and cleanup local image previews
  useEffect(() => {
    const urls = {};
    Object.entries(stagedFiles).forEach(([itemId, files]) => {
      urls[itemId] = files.map((f) => (isImageFile(f.name, f.type) ? URL.createObjectURL(f) : null));
    });
    setStagedPreviews(urls);

    return () => {
      Object.values(urls).forEach((list) => {
        list.forEach((u) => {
          if (u) {
            try {
              URL.revokeObjectURL(u);
            } catch (e) {}
          }
        });
      });
    };
  }, [stagedFiles]);

  const cleanActiveSlug = (activeProjectSlug || '').trim().toLowerCase();
  const realProject = projects.find(
    (p) => (p.slug && p.slug.trim().toLowerCase() === cleanActiveSlug) || p.id === activeProjectSlug
  );

  const project = isDemoMode ? demoProject : realProject;

  const handleResetDemo = () => {
    setDemoProject(createInitialDemoProject());
    setTextInputs({});
    setStagedFiles({});
    addToast('Skúšobný náhľad bol obnovený do východzieho stavu.', 'info', 'Obnovené');
  };

  useEffect(() => {
    if (isDemoMode) {
      setHasAttemptedFetch(true);
      return;
    }
    if (!activeProjectSlug) return;

    const existsInMemory = projects.some(
      (p) => (p.slug && p.slug.trim().toLowerCase() === cleanActiveSlug) || p.id === activeProjectSlug
    );

    if (!existsInMemory) {
      setLoadingInitial(true);
      fetchProjectBySlug(activeProjectSlug)
        .catch((err) => {
          console.error('Failed to fetch project by slug:', err);
        })
        .finally(() => {
          setLoadingInitial(false);
          setHasAttemptedFetch(true);
        });
    } else {
      setHasAttemptedFetch(true);
    }
  }, [activeProjectSlug, projects, fetchProjectBySlug, isDemoMode, cleanActiveSlug]);

  useEffect(() => {
    if (project) {
      const initialText = {};
      project.items.forEach((item) => {
        if (item.type === 'text' && item.value) {
          initialText[item.id] = typeof item.value === 'string' ? item.value : (item.value.text || '');
        }
      });
      setTextInputs(initialText);
    }
  }, [project]);

  if (!isDemoMode && (!project && (loadingInitial || isLoadingDb || !hasAttemptedFetch))) {
    return (
      <div className="container" style={{ padding: '120px 20px', textAlign: 'center' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 18px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Pripravujem klientsky portál...</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '6px' }}>
          Zabezpečené načítanie požiadaviek na podklady
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Zákazka sa nenašla</h2>
        <p style={{ color: 'var(--text-muted)', margin: '14px 0 24px', fontSize: '0.95rem' }}>
          Tento odkaz na zákazku mohol expirovať alebo bol presunutý. Skontrolujte prosím skopírovanú adresu.
        </p>
        <button onClick={openDashboard} className="btn btn-primary btn-pill">
          Späť na DropBrief
        </button>
      </div>
    );
  }

  const completedCount = project.items.filter((i) => i.isCompleted).length;
  const totalCount = project.items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  // Pravidelný zber (Cadence & Batches)
  const isOngoing = Boolean(project.projectType === 'ongoing' || project.project_type === 'ongoing');
  const todayDateStr = getTodayDateString();
  const todayBatch = getCurrentBatch(project, todayDateStr);
  const isTodayDone = isBatchSubmitted(todayBatch) || (isOngoing && isAllDone);

  // Trigger confetti when 100% completed
  const handleCheckCompletion = (newPercent) => {
    if (newPercent === 100) {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 }
      });
      addToast('Awesome! All requested assets have been successfully submitted.', 'success', 'All Done!');
    }
  };

  // 1. Stage local files
  const handleStageFiles = (itemId, filesInput) => {
    if (isFreelancerReadOnly) {
      addToast('Ako freelancer si prezeráte náhľad. Súbory a texty nahráva výhradne zákazník.', 'warning', 'Len pre zákazníka');
      return;
    }
    if (!filesInput) return;
    const fileArray = Array.from(
      filesInput instanceof FileList ? filesInput : (Array.isArray(filesInput) ? filesInput : [filesInput])
    );
    if (fileArray.length === 0) return;

    setStagedFiles((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), ...fileArray]
    }));
  };

  // 2. Remove staged file
  const handleRemoveStagedFile = (itemId, indexToRemove) => {
    if (isFreelancerReadOnly) return;
    setStagedFiles((prev) => {
      const current = prev[itemId] || [];
      const updated = current.filter((_, idx) => idx !== indexToRemove);
      if (updated.length === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: updated };
    });
  };

  // 3. Clear staged files
  const handleClearStagedFiles = (itemId) => {
    setStagedFiles((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  // 4. Confirm upload to server
  const handleConfirmUpload = async (itemId) => {
    if (isFreelancerReadOnly) {
      addToast('Ako freelancer nemôžete nahrávať súbory za klienta.', 'warning', 'Len pre zákazníka');
      return;
    }
    const filesToUpload = stagedFiles[itemId];
    if (!filesToUpload || filesToUpload.length === 0) return;

    try {
      setUploadingItemId(itemId);

      const currentItem = project.items.find((i) => i.id === itemId);
      let existingFiles = [];
      if (currentItem && currentItem.value) {
        if (Array.isArray(currentItem.value.files)) {
          existingFiles = [...currentItem.value.files];
        } else if (currentItem.value.fileName) {
          existingFiles = [currentItem.value];
        }
      }

      // Demo preview mode - simulated local storage only
      if (isDemoMode) {
        addToast(
          filesToUpload.length === 1 
            ? `Processing "${filesToUpload[0].name}" in sample preview...` 
            : `Processing ${filesToUpload.length} files in sample preview...`, 
          'info', 
          'Upload Simulation'
        );

        await new Promise((resolve) => setTimeout(resolve, 600));

        const uploadedFiles = filesToUpload.map((file) => ({
          id: 'f-demo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          fileName: file.name,
          fileSize: file.size > 1024 * 1024 
            ? (file.size / 1024 / 1024).toFixed(1) + ' MB' 
            : (file.size / 1024).toFixed(1) + ' KB',
          fileType: file.type || 'application/octet-stream',
          url: isImageFile(file.name, file.type) ? URL.createObjectURL(file) : null,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        const allFiles = [...existingFiles, ...uploadedFiles];
        const payload = {
          files: allFiles,
          fileName: allFiles.length === 1 ? allFiles[0].fileName : `${allFiles.length} files`,
          fileSize: allFiles.length === 1 ? allFiles[0].fileSize : `${allFiles.length} files`,
          url: allFiles[0]?.url,
        };

        setDemoProject((prev) => {
          const updatedItems = prev.items.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              value: payload,
              isCompleted: true,
              completedAt: new Date().toISOString(),
            };
          });
          const reqDone = updatedItems.filter((i) => i.required).every((i) => i.isCompleted);
          return {
            ...prev,
            items: updatedItems,
            status: reqDone ? 'completed' : 'pending',
          };
        });

        handleClearStagedFiles(itemId);

        addToast(
          filesToUpload.length === 1 
            ? `File "${filesToUpload[0].name}" was added to sample preview!` 
            : `Added ${filesToUpload.length} files to sample preview!`, 
          'success', 
          'Assets Simulated'
        );

        const newCompleted = project.items.filter((i) => (i.id === itemId ? true : i.isCompleted)).length;
        const newPercent = Math.round((newCompleted / totalCount) * 100);
        handleCheckCompletion(newPercent);
        return;
      }

      // Live cloud upload
      addToast(
        filesToUpload.length === 1 
          ? `Uploading ${filesToUpload[0].name} to secure cloud...` 
          : `Uploading ${filesToUpload.length} files to secure cloud...`, 
        'info', 
        'Uploading'
      );

      const uploadedFiles = [];
      for (const file of filesToUpload) {
        let uploadedPayload;
        if (isSupabaseConfigured) {
          uploadedPayload = await uploadClientFile(file, project.slug, itemId);
        } else {
          uploadedPayload = {
            id: 'f-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(1) + ' KB',
            fileType: file.type || 'application/octet-stream',
            url: isImageFile(file.name, file.type) ? URL.createObjectURL(file) : null,
            uploadedAt: new Date().toLocaleTimeString()
          };
        }
        uploadedFiles.push(uploadedPayload);
      }

      const allFiles = [...existingFiles, ...uploadedFiles];
      const payload = {
        files: allFiles,
        fileName: allFiles.length === 1 ? allFiles[0].fileName : `${allFiles.length} files`,
        fileSize: allFiles.length === 1 ? allFiles[0].fileSize : `${allFiles.length} files`,
        url: allFiles[0]?.url,
      };

      await updateItemValue(project.slug, itemId, payload, true);
      handleClearStagedFiles(itemId);

      if (isOngoing && !isDemoMode) {
        const batchFiles = [];
        let batchNote = '';
        project.items.forEach((it) => {
          if (it.id === itemId) {
            batchFiles.push(...allFiles);
          } else if (it.type === 'file' && it.value?.files) {
            batchFiles.push(...it.value.files);
          } else if (it.type === 'text' && typeof it.value === 'string') {
            batchNote += (batchNote ? '\n' : '') + it.value;
          }
        });
        submitOngoingBatch(project.slug, {
          date: todayDateStr,
          files: batchFiles,
          note: batchNote
        });
      }

      addToast(
        filesToUpload.length === 1 
          ? `File "${filesToUpload[0].name}" successfully saved!`
          : `Successfully uploaded ${filesToUpload.length} files!`,
        'success',
        'Assets Saved'
      );

      const newCompleted = project.items.filter((i) => (i.id === itemId ? true : i.isCompleted)).length;
      const newPercent = Math.round((newCompleted / totalCount) * 100);
      handleCheckCompletion(newPercent);
    } catch (err) {
      console.error('File upload error:', err);
      addToast(err.message || 'File upload failed.', 'warning', 'Upload Error');
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleRemoveSingleFile = async (itemId, fileIdentifier) => {
    if (isFreelancerReadOnly) {
      addToast('Ako freelancer nemôžete odstraňovať súbory klienta v klientskom portáli.', 'warning', 'Len pre zákazníka');
      return;
    }

    const currentItem = project.items.find((i) => i.id === itemId);
    if (!currentItem || !currentItem.value) return;

    let existingFiles = [];
    if (Array.isArray(currentItem.value.files)) {
      existingFiles = [...currentItem.value.files];
    } else if (currentItem.value.fileName) {
      existingFiles = [currentItem.value];
    }

    const filtered = existingFiles.filter((f, idx) => (f.id ? f.id !== fileIdentifier : idx !== fileIdentifier));

    if (isDemoMode) {
      setDemoProject((prev) => {
        const updatedItems = prev.items.map((item) => {
          if (item.id !== itemId) return item;
          if (filtered.length === 0) {
            return { ...item, value: null, isCompleted: false, completedAt: null };
          }
          return {
            ...item,
            value: {
              files: filtered,
              fileName: filtered.length === 1 ? filtered[0].fileName : `${filtered.length} files`,
              fileSize: filtered.length === 1 ? filtered[0].fileSize : `${filtered.length} files`,
              url: filtered[0]?.url,
            },
            isCompleted: true,
          };
        });
        const reqDone = updatedItems.filter((i) => i.required).every((i) => i.isCompleted);
        return { ...prev, items: updatedItems, status: reqDone ? 'completed' : 'pending' };
      });
      addToast(filtered.length === 0 ? 'All files removed from sample preview.' : 'File removed from sample preview.', 'info', 'Simulation');
      return;
    }

    if (filtered.length === 0) {
      await updateItemValue(project.slug, itemId, null, false);
      addToast('All files removed.', 'info', 'Item Reset');
    } else {
      const payload = {
        files: filtered,
        fileName: filtered.length === 1 ? filtered[0].fileName : `${filtered.length} files`,
        fileSize: filtered.length === 1 ? filtered[0].fileSize : `${filtered.length} files`,
        url: filtered[0]?.url,
      };
      await updateItemValue(project.slug, itemId, payload, true);
      addToast('File removed.', 'info', 'File Deleted');
    }
  };

  const handleTextSave = async (itemId) => {
    if (isFreelancerReadOnly) {
      addToast('Ako freelancer nemôžete zadávať texty namiesto zákazníka.', 'warning', 'Len pre zákazníka');
      return;
    }

    const val = textInputs[itemId];
    if (!val || val.trim().length === 0) {
      addToast('Please enter text before saving.', 'warning', 'Missing Text');
      return;
    }

    if (isDemoMode) {
      setDemoProject((prev) => {
        const updatedItems = prev.items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            value: val.trim(),
            isCompleted: true,
            completedAt: new Date().toISOString(),
          };
        });
        const reqDone = updatedItems.filter((i) => i.required).every((i) => i.isCompleted);
        return { ...prev, items: updatedItems, status: reqDone ? 'completed' : 'pending' };
      });

      addToast('Copy recorded in sample preview!', 'success', 'Text Simulation');
      const newCompleted = project.items.filter((i) => (i.id === itemId ? true : i.isCompleted)).length;
      const newPercent = Math.round((newCompleted / totalCount) * 100);
      handleCheckCompletion(newPercent);
      return;
    }

    await updateItemValue(project.slug, itemId, val.trim(), true);

    if (isOngoing && !isDemoMode) {
      const batchFiles = [];
      let batchNote = val.trim();
      project.items.forEach((it) => {
        if (it.type === 'file' && it.value?.files) {
          batchFiles.push(...it.value.files);
        } else if (it.id !== itemId && it.type === 'text' && typeof it.value === 'string') {
          batchNote = (it.value ? it.value + '\n' : '') + batchNote;
        }
      });
      submitOngoingBatch(project.slug, {
        date: todayDateStr,
        files: batchFiles,
        note: batchNote
      });
    }

    addToast('Copy successfully saved!', 'success', 'Text Saved');

    const newCompleted = project.items.filter((i) => (i.id === itemId ? true : i.isCompleted)).length;
    const newPercent = Math.round((newCompleted / totalCount) * 100);
    handleCheckCompletion(newPercent);
  };

  const handleRemoveItemValue = async (itemId) => {
    if (isFreelancerReadOnly) {
      addToast('Ako freelancer nemôžete upravovať texty klienta cez klientsky portál.', 'warning', 'Len pre zákazníka');
      return;
    }

    if (isDemoMode) {
      setDemoProject((prev) => {
        const updatedItems = prev.items.map((item) => {
          if (item.id !== itemId) return item;
          return { ...item, value: null, isCompleted: false, completedAt: null };
        });
        const reqDone = updatedItems.filter((i) => i.required).every((i) => i.isCompleted);
        return { ...prev, items: updatedItems, status: reqDone ? 'completed' : 'pending' };
      });
      setTextInputs((prev) => ({ ...prev, [itemId]: '' }));
      addToast('Item cleared in sample preview.', 'info', 'Simulation');
      return;
    }

    await updateItemValue(project.slug, itemId, null, false);
    setTextInputs((prev) => ({ ...prev, [itemId]: '' }));
    addToast('Item cleared, you can now upload new assets.', 'info', 'Item Reset');
  };

  return (
    <div style={{ flex: 1, paddingBottom: '70px', position: 'relative' }}>
      
      {/* Simulation / Sandbox Banner */}
      {isDemoMode ? (
        <div style={{
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.22) 0%, rgba(139, 92, 246, 0.18) 100%)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.4)',
          padding: '12px 0',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35)'
        }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span className="badge" style={{
                background: 'rgba(99, 102, 241, 0.32)',
                border: '1px solid rgba(129, 140, 248, 0.6)',
                color: '#e0e7ff',
                padding: '4px 10px',
                fontWeight: 700,
                fontSize: '0.74rem',
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FlaskConical size={14} color="#a5b4fc" />
                SKÚŠOBNÝ INTERAKTÍVNY NÁHĽAD (DEMO)
              </span>
              
              <div style={{ fontSize: '0.86rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <strong style={{ color: '#fff' }}>Presne takto vidí klientsky portál váš zákazník — bez prihlasovania a bez hesiel.</strong>
                <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.8rem' }}>
                  • Vyskúšajte nahrávať súbory a meniť položky. Všetko funguje interaktívne v pamäti prehliadača a neodosiela sa na server.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                id="btn-reset-demo"
                onClick={handleResetDemo}
                className="btn btn-secondary btn-sm btn-pill"
                style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px' }}
                title="Obnoviť skúšobný náhľad do východzieho stavu"
              >
                <RotateCcw size={13} />
                Obnoviť demo
              </button>
              <button 
                id="btn-back-to-dashboard"
                onClick={openDashboard} 
                className="btn btn-primary btn-sm btn-pill"
                style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px' }}
              >
                <ArrowLeft size={13} /> {currentFreelancer ? 'Návrat na nástenku' : 'Späť na úvod'}
              </button>
            </div>
          </div>
        </div>
      ) : currentFreelancer ? (
        <div style={{
          background: 'rgba(99, 102, 241, 0.14)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '12px 0',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ color: '#e0e7ff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <Lock size={16} color="var(--accent-primary)" />
              <span><strong>Náhľad klientskeho portálu (Režim iba na čítanie):</strong> Ako freelancer si prezeráte rozhranie klienta. Nahrávanie súborov a textov je povolené iba zákazníkovi.</span>
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                id="btn-back-to-project-detail"
                onClick={() => openProjectDetail(project.slug)} 
                className="btn btn-primary btn-sm btn-pill"
                style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '5px' }}
              >
                <Layers size={13} /> Správa zákazky
              </button>
              <button 
                id="btn-back-to-dashboard"
                onClick={openDashboard} 
                className="btn btn-secondary btn-sm btn-pill"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <ArrowLeft size={13} /> Nástenka
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="container" style={{ maxWidth: '880px', marginTop: '36px' }}>
        
        {/* Client Portal Main Card */}
        <div className="glass-card" style={{
          padding: '36px',
          marginBottom: '28px',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, rgba(99, 102, 241, 0.04) 45%, transparent 70%)',
            pointerEvents: 'none',
            contain: 'strict'
          }} />

          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <span className="badge badge-accent">
                  <Sparkles size={11} /> Client Portal &bull; No Login Required
                </span>
                {(project.projectType === 'ongoing' || project.project_type === 'ongoing') ? (
                  <span className="badge" style={{
                    background: 'rgba(168, 85, 247, 0.14)',
                    color: '#c084fc',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700
                  }}>
                    <RefreshCw size={11} /> Ongoing
                  </span>
                ) : (
                  <span className="badge" style={{
                    background: 'rgba(56, 189, 248, 0.14)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700
                  }}>
                    <Zap size={11} /> One-off
                  </span>
                )}
                {isDemoMode && (
                  <span className="badge" style={{
                    background: 'rgba(245, 158, 11, 0.16)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 700
                  }}>
                    <FlaskConical size={11} /> Skúšobný náhľad (Zmeny sa neukladajú na server)
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: 'clamp(1.7rem, 3.5vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px', color: 'var(--text-primary)' }}>
                {project.title}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem', lineHeight: 1.55, maxWidth: '520px' }}>
                {isDemoMode ? (
                  <>Vítajte v ukážke, <strong>{project.clientName}</strong>! Toto je interaktívny zoznam podkladov, ktoré požaduje freelancer pre realizáciu projektu. Vyskúšajte do neho nahrať súbory alebo vpísať texty.</>
                ) : (
                  <>Dobrý deň <strong>{project.clientName}</strong>, tu je prehľadný kontrolný zoznam podkladov a informácií potrebných pre úspešné dokončenie vašej zákazky.</>
                )}
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '14px 20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'right'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Commissioned by:</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block', marginTop: '1px' }}>
                {project.freelancerName}
              </strong>
              {project.deadline && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Target Deadline: <strong>{project.deadline}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Progress / Daily Cadence Tracker */}
          {isOngoing ? (
            <div style={{ marginTop: '24px' }}>
              <div style={{
                padding: '18px 22px',
                borderRadius: 'var(--radius-lg)',
                background: isTodayDone ? 'rgba(16, 185, 129, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                border: isTodayDone ? '1px solid var(--success-border)' : '1px solid rgba(168, 85, 247, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px', height: '42px',
                    borderRadius: 'var(--radius-sm)',
                    background: isTodayDone ? 'rgba(16, 185, 129, 0.22)' : 'rgba(168, 85, 247, 0.22)',
                    color: isTodayDone ? 'var(--success)' : '#c084fc',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '1rem', color: '#fff', display: 'block' }}>
                      {formatDateSlovak(todayDateStr)} – Dnešné podklady
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Pravidelný zber dát &bull; {formatCadenceDays(project.cadenceDays || 1)}
                    </span>
                  </div>
                </div>

                {isTodayDone ? (
                  <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}>
                    <CheckCircle2 size={14} /> Dnes úspešne odovzdané
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ padding: '6px 14px', fontSize: '0.82rem', gap: '6px' }}>
                    <Clock size={14} /> Čaká sa na dnešné podklady
                  </span>
                )}
              </div>

              {isTodayDone && (
                <div style={{
                  marginTop: '14px',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.84rem',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  <Sparkles size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                  <span>
                    Ďakujeme! Dnešné materiály boli bezpečne doručené. {project.freelancerName} ich spracuje. Na ďalšiu dávku sa formulár automaticky pripraví podľa nastavenej frekvencie ({formatCadenceDays(project.cadenceDays || 1)}).
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Progress Tracker (One-off) */}
              <div style={{ marginTop: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '0.925rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Submission progress: <strong>{completedCount} of {totalCount} items completed</strong>
                  </span>
                  <span style={{ fontWeight: 800, color: isAllDone ? 'var(--success)' : 'var(--accent-primary)', fontSize: '1.2rem' }}>
                    {progressPercent}%
                  </span>
                </div>
                
                <div className="progress-track" style={{ height: '10px' }}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${progressPercent}%`,
                      background: isAllDone ? 'var(--success)' : 'var(--accent-gradient)'
                    }} 
                  />
                </div>
              </div>

              {/* 100% Celebration Banner */}
              {isAllDone && (
                <div style={{
                  marginTop: '24px',
                  padding: '18px 22px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid var(--success-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  color: 'var(--success)',
                  boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)'
                }}>
                  <Sparkles size={26} style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: '1rem', display: 'block' }}>
                      Great job! All requested assets and information are complete.
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                      {project.freelancerName} has all the materials needed and can proceed with full execution of your project.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Checklist Items Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '36px' }}>
          {project.items.map((item, index) => {
            const isDone = item.isCompleted;
            const isUploadingThis = uploadingItemId === item.id;

            return (
              <div 
                key={item.id}
                className="glass-card"
                style={{
                  padding: '26px',
                  borderLeft: isDone ? '4px solid var(--success)' : '4px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  transition: 'var(--transition)'
                }}
                onDragOver={(e) => {
                  if (item.type === 'file') {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }
                }}
                onDrop={(e) => {
                  if (item.type === 'file') {
                    e.preventDefault();
                    setDragActiveId(null);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleStageFiles(item.id, e.dataTransfer.files);
                    }
                  }
                }}
              >
                
                {/* Item Top Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-full)',
                      background: isDone ? 'var(--success)' : 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDone ? '#fff' : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      flexShrink: 0,
                      marginTop: '2px',
                      boxShadow: isDone ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none'
                    }}>
                      {isDone ? <Check size={18} /> : (index + 1)}
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {item.title}
                      </h3>
                      {item.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    {item.required ? (
                      <span className="badge badge-accent" style={{ fontSize: '0.68rem' }}>
                        Required
                      </span>
                    ) : (
                      <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                        Optional
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Input or Upload Area */}
                <div style={{ marginTop: '16px', paddingLeft: '46px' }}>
                  
                  {/* File Upload Type */}
                  {item.type === 'file' && (() => {
                    const fileList = Array.isArray(item.value?.files)
                      ? item.value.files
                      : (item.value?.fileName ? [item.value] : []);
                    const hasFiles = fileList.length > 0;
                    const stagedList = stagedFiles[item.id] || [];
                    const hasStaged = stagedList.length > 0;
                    const hasAny = hasFiles || hasStaged;
                    const hasBoth = hasFiles && hasStaged;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        
                        {/* 1. Loading State */}
                        {isUploadingThis && (
                          <div style={{
                            padding: '28px',
                            textAlign: 'center',
                            borderRadius: 'var(--radius-lg)',
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px dashed var(--accent-primary)'
                          }}>
                            <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 10px' }} />
                            <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                              Uploading files to secure cloud storage...
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Please wait a moment while all materials are securely saved
                            </div>
                          </div>
                        )}

                        {/* 2. Empty Dropzone */}
                        {!isUploadingThis && !hasAny && (
                          isFreelancerReadOnly ? (
                            <div 
                              style={{
                                border: '1.5px dashed var(--border-subtle)',
                                borderRadius: 'var(--radius-lg)',
                                padding: '24px 18px',
                                textAlign: 'center',
                                background: 'rgba(255, 255, 255, 0.015)',
                                position: 'relative'
                              }}
                            >
                              <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255, 255, 255, 0.04)',
                                color: 'var(--text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 10px'
                              }}>
                                <Lock size={20} />
                              </div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                                Režim náhľadu: Nahrávanie vyhradené pre klienta
                              </div>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                                Súbory nahráva zákazník priamo cez svoj odkaz. Ako freelancer tu nemôžete odovzdávať súbory za klienta.
                              </span>
                            </div>
                          ) : (
                            <div 
                              className={`dropzone ${dragActiveId === item.id ? 'active' : ''}`}
                              style={{ position: 'relative' }}
                              onDragEnter={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragActiveId(item.id);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = 'copy';
                                if (dragActiveId !== item.id) {
                                  setDragActiveId(item.id);
                                }
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                  setDragActiveId(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragActiveId(null);
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                  handleStageFiles(item.id, e.dataTransfer.files);
                                }
                              }}
                              onClick={() => {
                                const input = document.getElementById(`file-input-${item.id}`);
                                if (input) input.click();
                              }}
                            >
                              <input 
                                id={`file-input-${item.id}`}
                                type="file" 
                                multiple
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleStageFiles(item.id, e.target.files);
                                  }
                                }}
                              />
                              <div style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(99, 102, 241, 0.12)',
                                color: 'var(--accent-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 12px'
                              }}>
                                <Upload size={22} />
                              </div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                Drag & drop files here or <span style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>click to browse</span>
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Select multiple files at once &bull; Supports PDF, PNG, JPG, ZIP, and all standard formats
                              </span>
                            </div>
                          )
                        )}

                        {/* 3. Unified Container (Uploaded + Staged) */}
                        {!isUploadingThis && hasAny && (
                          <div 
                            style={{
                              background: dragActiveId === `zone-${item.id}` 
                                ? 'rgba(99, 102, 241, 0.16)' 
                                : (hasStaged ? 'rgba(99, 102, 241, 0.05)' : 'rgba(16, 185, 129, 0.04)'),
                              border: dragActiveId === `zone-${item.id}`
                                ? '2px dashed var(--accent-primary)'
                                : (hasStaged ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid var(--success-border)'),
                              borderRadius: 'var(--radius-lg)',
                              padding: '18px',
                              position: 'relative',
                              transition: 'var(--transition)'
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragActiveId(`zone-${item.id}`);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'copy';
                              if (dragActiveId !== `zone-${item.id}`) {
                                setDragActiveId(`zone-${item.id}`);
                              }
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!e.currentTarget.contains(e.relatedTarget)) {
                                setDragActiveId(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragActiveId(null);
                              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                handleStageFiles(item.id, e.dataTransfer.files);
                              }
                            }}
                          >
                            {/* Drag Overlay */}
                            {dragActiveId === `zone-${item.id}` && (
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(10, 14, 24, 0.92)',
                                border: '2px dashed var(--accent-primary)',
                                borderRadius: 'var(--radius-lg)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                backdropFilter: 'blur(6px)',
                                zIndex: 20,
                                pointerEvents: 'none'
                              }}>
                                <Upload size={32} style={{ color: 'var(--accent-primary)' }} />
                                <div>Drop files here to add</div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                                  New files will be appended to existing ones without overwriting
                                </span>
                              </div>
                            )}

                            {/* Common Header */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '12px',
                              marginBottom: '16px',
                              paddingBottom: '12px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                {hasFiles ? (
                                  <FileCheck2 size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                                ) : (
                                  <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>
                                    Ready to upload
                                  </span>
                                )}
                                
                                <strong style={{ fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                                  {hasBoth ? (
                                    <>
                                      Files: {fileList.length + stagedList.length} total
                                      <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.825rem', marginLeft: '6px' }}>
                                        ({fileList.length} in cloud + {stagedList.length} new pending save)
                                      </span>
                                    </>
                                  ) : hasFiles ? (
                                    <>
                                      {isDemoMode ? 'Uploaded in preview' : 'Saved in cloud'}: {fileList.length} {fileList.length === 1 ? 'file' : 'files'}
                                    </>
                                  ) : (
                                    <>
                                      Selected files: {stagedList.length} {stagedList.length === 1 ? 'file' : 'files'}
                                    </>
                                  )}
                                </strong>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input 
                                  id={`file-input-unified-${item.id}`}
                                  type="file" 
                                  multiple
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      handleStageFiles(item.id, e.target.files);
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`file-input-unified-${item.id}`);
                                    if (input) input.click();
                                  }}
                                  className="btn btn-secondary btn-sm btn-pill"
                                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                                  title="Add more files"
                                >
                                  <Plus size={14} /> Add files
                                </button>

                                {hasStaged && (
                                  <button 
                                    type="button"
                                    onClick={() => handleClearStagedFiles(item.id)}
                                    className="btn btn-secondary btn-sm btn-pill"
                                    style={{ padding: '6px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}
                                    title="Cancel newly selected files"
                                  >
                                    <X size={14} /> Cancel new
                                  </button>
                                )}

                                {hasFiles && !hasStaged && (
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      if (confirm(isDemoMode ? 'Are you sure you want to remove files from this preview item?' : 'Are you sure you want to remove all uploaded files from this item?')) {
                                        handleRemoveItemValue(item.id);
                                      }
                                    }}
                                    className="btn btn-secondary btn-sm btn-pill"
                                    style={{ padding: '6px 12px', color: 'var(--danger)', fontSize: '0.8rem' }}
                                    title={isDemoMode ? "Delete files from preview" : "Delete all uploaded files from cloud"}
                                  >
                                    <Trash2 size={14} /> {isDemoMode ? 'Delete from preview' : 'Delete from cloud'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Files List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              
                              {/* 1. Already Uploaded Files */}
                              {hasFiles && fileList.map((f, idx) => {
                                const isImg = isImageFile(f.fileName, f.fileType);

                                return (
                                  <div
                                    key={f.id || idx}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      background: 'rgba(0, 0, 0, 0.35)',
                                      border: '1px solid rgba(255, 255, 255, 0.08)',
                                      borderRadius: 'var(--radius-md)',
                                      padding: '10px 14px',
                                      gap: '14px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                      {/* Thumbnail */}
                                      {isImg && f.url ? (
                                        <a
                                          href={f.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title="Click to open full size image"
                                          style={{ display: 'block', flexShrink: 0 }}
                                        >
                                          <img 
                                            src={f.url} 
                                            alt={f.fileName || 'Image preview'}
                                            style={{
                                              width: '48px',
                                              height: '48px',
                                              borderRadius: 'var(--radius-sm)',
                                              objectFit: 'cover',
                                              border: '1px solid rgba(255, 255, 255, 0.25)',
                                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                                              display: 'block',
                                              cursor: 'zoom-in',
                                              transition: 'transform 0.15s ease'
                                            }}
                                            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                          />
                                        </a>
                                      ) : (
                                        <div style={{
                                          width: '48px',
                                          height: '48px',
                                          borderRadius: 'var(--radius-sm)',
                                          background: 'rgba(16, 185, 129, 0.12)',
                                          border: '1px solid rgba(16, 185, 129, 0.25)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0
                                        }}>
                                          <FileText size={22} color="var(--success)" />
                                        </div>
                                      )}

                                      <div style={{ minWidth: 0 }}>
                                        <div style={{
                                          fontSize: '0.875rem',
                                          fontWeight: 600,
                                          color: 'var(--text-primary)',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {f.fileName || 'File'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                          <span>{f.fileSize || ''}</span>
                                          <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                                            {isDemoMode ? '✓ Simulated save' : '✓ Saved in cloud'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                      {f.url && (
                                        <a
                                          href={f.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="btn btn-secondary btn-sm btn-pill"
                                          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                                          title="Download / View full size file"
                                        >
                                          <Download size={13} /> View
                                        </a>
                                      )}
                                      {!isFreelancerReadOnly && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSingleFile(item.id, f.id || idx)}
                                          className="btn btn-secondary btn-sm"
                                          style={{ padding: '6px 8px', color: 'var(--danger)', borderRadius: 'var(--radius-full)' }}
                                          title={isDemoMode ? "Remove this file from preview" : "Remove this file from cloud"}
                                        >
                                          <X size={14} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Divider when both existing and new files are present */}
                              {hasBoth && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  margin: '8px 0 4px 0',
                                  padding: '0 4px'
                                }}>
                                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.45))' }} />
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 14px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'rgba(99, 102, 241, 0.16)',
                                    border: '1px solid rgba(99, 102, 241, 0.35)',
                                    fontSize: '0.76rem',
                                    color: '#c7d2fe',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                  }}>
                                    <Sparkles size={13} color="var(--accent-primary)" />
                                    <span>Newly added files (pending save)</span>
                                    <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '0 6px' }}>+{stagedList.length}</span>
                                  </div>
                                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.45), transparent)' }} />
                                </div>
                              )}

                              {/* 2. Newly Staged Files */}
                              {hasStaged && stagedList.map((f, idx) => {
                                const isImg = isImageFile(f.name, f.type);
                                const previewUrl = stagedPreviews[item.id]?.[idx] || (isImg ? URL.createObjectURL(f) : null);

                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      background: 'rgba(99, 102, 241, 0.12)',
                                      border: '1px solid rgba(99, 102, 241, 0.35)',
                                      borderRadius: 'var(--radius-md)',
                                      padding: '10px 14px',
                                      gap: '14px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                      {/* Thumbnail */}
                                      {isImg && previewUrl ? (
                                        <img 
                                          src={previewUrl} 
                                          alt={f.name}
                                          style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: 'var(--radius-sm)',
                                            objectFit: 'cover',
                                            border: '1px solid rgba(99, 102, 241, 0.45)',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                                            flexShrink: 0
                                          }}
                                        />
                                      ) : (
                                        <div style={{
                                          width: '48px',
                                          height: '48px',
                                          borderRadius: 'var(--radius-sm)',
                                          background: 'rgba(99, 102, 241, 0.2)',
                                          border: '1px solid rgba(99, 102, 241, 0.35)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0
                                        }}>
                                          <FileText size={22} color="var(--accent-primary)" />
                                        </div>
                                      )}

                                      <div style={{ minWidth: 0 }}>
                                        <div style={{
                                          fontSize: '0.875rem',
                                          fontWeight: 600,
                                          color: 'var(--text-primary)',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }}>
                                          {f.name}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                          <span>{f.size ? (f.size > 1024 * 1024 ? (f.size / 1024 / 1024).toFixed(1) + ' MB' : (f.size / 1024).toFixed(1) + ' KB') : ''}</span>
                                          <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                                            ★ New file (pending save)
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveStagedFile(item.id, idx)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: '6px 8px', color: 'var(--danger)', borderRadius: 'var(--radius-full)' }}
                                      title="Remove from selection"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Mini Dropzone Underneath */}
                            {!isFreelancerReadOnly && (
                              <div
                                onClick={() => {
                                  const input = document.getElementById(`file-input-unified-${item.id}`);
                                  if (input) input.click();
                                }}
                                onDragEnter={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragActiveId(`zone-${item.id}`);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  e.dataTransfer.dropEffect = 'copy';
                                  setDragActiveId(`zone-${item.id}`);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragActiveId(null);
                                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    handleStageFiles(item.id, e.dataTransfer.files);
                                  }
                                }}
                                style={{
                                  marginTop: '14px',
                                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: '12px 16px',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  transition: 'var(--transition)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                }}
                              >
                                <Upload size={16} color="var(--accent-primary)" />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  Drag & drop more files here or <strong style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>click to browse</strong>
                                </span>
                              </div>
                            )}

                            {/* Save Confirmation Button */}
                            {hasStaged && (
                              <div style={{
                                marginTop: '16px',
                                paddingTop: '14px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                              }}>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmUpload(item.id)}
                                  className="btn btn-primary btn-lg btn-pill"
                                  style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    boxShadow: 'var(--accent-glow)'
                                  }}
                                >
                                  <Upload size={18} /> {hasFiles 
                                    ? `Save & add new files to project (+${stagedList.length} ${stagedList.length === 1 ? 'new file' : 'new files'})` 
                                    : `Upload & submit to project (${stagedList.length} ${stagedList.length === 1 ? 'file' : 'files'})`
                                  }
                                </button>

                                {hasFiles && (
                                  <div style={{
                                    textAlign: 'center',
                                    fontSize: '0.78rem',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                  }}>
                                    <ShieldCheck size={14} color="var(--success)" />
                                    <span>Your <strong>{fileList.length} previously saved files</strong> remain intact in the cloud — new files are safely appended.</span>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        )}

                      </div>
                    );
                  })()}

                  {/* Text Input Type */}
                  {item.type === 'text' && (
                    <div>
                      {!isDone ? (
                        isFreelancerReadOnly ? (
                          <div style={{
                            padding: '16px 18px',
                            background: 'rgba(255, 255, 255, 0.015)',
                            border: '1.5px dashed var(--border-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255, 255, 255, 0.04)',
                              color: 'var(--text-tertiary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Lock size={18} />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                Režim náhľadu: Text zadáva klient
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                                Textové podklady a odpovede vypĺňa zákazník priamo cez svoj odkaz. Ako freelancer tu nemôžete odosielať text namiesto klienta.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <textarea
                              id={`textarea-${item.id}`}
                              className="textarea"
                              rows={3}
                              placeholder="Type requested details, links, or copy here..."
                              value={textInputs[item.id] || ''}
                              onChange={(e) => setTextInputs({ ...textInputs, [item.id]: e.target.value })}
                              style={{ marginBottom: '12px', borderRadius: 'var(--radius-lg)' }}
                            />
                            <button 
                              id={`btn-save-text-${item.id}`}
                              onClick={() => handleTextSave(item.id)}
                              className="btn btn-primary btn-sm btn-pill"
                            >
                              <CheckCircle2 size={15} /> Save & Submit Copy
                            </button>
                          </div>
                        )
                      ) : (
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid var(--success-border)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '16px 18px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircle2 size={15} /> Submitted copy:
                            </span>
                            {!isFreelancerReadOnly && (
                              <button 
                                onClick={() => handleRemoveItemValue(item.id)}
                                className="btn btn-secondary btn-sm btn-pill"
                                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                            {typeof item.value === 'string' ? item.value : (item.value?.text || '')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>

        {/* Archív predchádzajúcich odovzdaní (pre dlhodobé zákazky) */}
        {isOngoing && getProjectBatches(project).length > 0 && (
          <div className="glass-card" style={{
            padding: '24px 28px',
            marginBottom: '32px',
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Layers size={18} color="#c084fc" />
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>
                  Archív vašich predchádzajúcich odovzdaní ({getProjectBatches(project).length})
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Všetky skôr odovzdané dávky a materiály sú bezpečne uložené u {project.freelancerName}.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {getProjectBatches(project).map((batch) => {
                const count = batch.files?.length || 0;
                return (
                  <div 
                    key={batch.id || batch.date}
                    style={{
                      padding: '12px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-hairline)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatDateSlovak(batch.date)}
                        </span>
                        <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '1px 7px' }}>
                          {count} {count === 1 ? 'súbor' : count < 5 ? 'súbory' : 'súborov'}
                        </span>
                      </div>
                      {batch.note && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }} className="truncate">
                          {batch.note}
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                      <CheckCircle2 size={13} /> Bezpečne odovzdané
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Security and Trust Footer */}
        <div className="glass-card" style={{
          padding: '24px 28px',
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 'var(--radius-xl)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', color: 'var(--success)' }}>
                <Lock size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.925rem', color: 'var(--text-primary)', display: 'block' }}>
                  Your data is protected (End-to-End Security)
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Files are secured with bank-grade encryption and accessible solely by {project.freelancerName}.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>🔒 256-bit SSL</span>
              <span>🇪🇺 Frankfurt EU (GDPR)</span>
              <span>⏱️ Auto-purge after 30 days</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
