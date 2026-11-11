import React, { useState, useEffect, useRef } from 'react';
import { useApp, areProjectItemsComplete } from '../context/AppContext';
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
  Layers,
  Globe,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import '../styles/client-portal-brutalist.css';

const isImageFile = (fileName, mimeType) => {
  if (mimeType && mimeType.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|svg|heic|heif|bmp|avif)$/i.test(fileName || '');
};

// Initial state for sandbox interactive preview (1 item completed, 3 pending)
const createInitialDemoProject = () => ({
  id: 'demo-sandbox-project',
  slug: 'demo-preview',
  title: 'Website Creation & Visual Identity – Aurora Cafe',
  projectType: 'one-off',
  clientName: 'Peter Novak (Bistro & Cafe Aurora)',
  clientEmail: 'peter.novak@auroracafe.com',
  freelancerName: 'Studio Creative / Alex',
  freelancerEmail: 'contact@studio-creative.com',
  deadline: '2026-10-30',
  reminderFrequency: 3,
  lastReminderSent: null,
  createdAt: '2026-10-01',
  status: 'pending',
  isDemoSandbox: true,
  items: [
    {
      id: 'demo-item-1',
      title: 'Vector company logo (SVG / AI / PDF)',
      description: 'Preferred vector format (.SVG, .AI) or high-resolution graphic with transparent background (.PNG).',
      type: 'file',
      required: true,
      isCompleted: true, // Sample uploaded item so visitors can see a completed state
      completedAt: '2026-10-02T10:30:00Z',
      value: {
        fileName: 'aurora_logo_vector_final.svg',
        fileSize: '420 KB',
        fileType: 'image/svg+xml',
        url: null,
        uploadedAt: 'Oct 02, 2026 10:30 AM',
      },
    },
    {
      id: 'demo-item-2',
      title: 'Website copy (About us, Cafe story, and specials menu)',
      description: 'Enter copy for the new website, description of offerings, or key highlights of your business.',
      type: 'text',
      required: true,
      isCompleted: false, // Awaiting copy input
      completedAt: null,
      value: null,
    },
    {
      id: 'demo-item-3',
      title: 'Interior & coffee photos (5 to 10 photos)',
      description: 'Upload representative high-resolution photos of the interior, coffee, and pastries.',
      type: 'file',
      required: true,
      isCompleted: false, // Awaiting photo upload
      completedAt: null,
      value: null,
    },
    {
      id: 'demo-item-4',
      title: 'Design manual & brand color palette (PDF)',
      description: 'Brand colors (HEX codes) or existing brand manual if available.',
      type: 'file',
      required: false,
      isCompleted: false, // Optional item
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
    currentFreelancer,
    openAuthModal,
    openLegalModal
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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [celebrationCount, setCelebrationCount] = useState(0);
  const [attentionItemId, setAttentionItemId] = useState(null);
  const [clientConfirmedDone, setClientConfirmedDone] = useState(false);

  // Reset transient completion state when opening a different docket slug
  useEffect(() => {
    setShowCompletionModal(false);
    setClientConfirmedDone(false);
    setAttentionItemId(null);
  }, [activeProjectSlug]);

  // Close completion celebration overlay on Escape key (WCAG 2.1.2)
  useEffect(() => {
    if (!showCompletionModal) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowCompletionModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showCompletionModal]);

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
    setShowCompletionModal(false);
    setClientConfirmedDone(false);
    addToast('Interactive demo preview has been reset to defaults.', 'info', 'Reset');
  };

  const attemptedSlugsRef = useRef(new Set());

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
      // Prevent infinite repeated querying of non-existent project
      if (attemptedSlugsRef.current.has(cleanActiveSlug)) {
        setHasAttemptedFetch(true);
        return;
      }
      attemptedSlugsRef.current.add(cleanActiveSlug);

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
      <div className="client-portal-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="cp-state-card">
          <Loader2 size={44} className="animate-spin" style={{ color: '#111111', margin: '0 auto 20px' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase' }}>
            Preparing Client Portal...
          </h2>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            Securely loading deliverables checklist from EU cloud
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="client-portal-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="cp-state-card">
          <AlertCircle size={44} color="#DC2626" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
            Project Not Found
          </h2>
          <p style={{ color: 'var(--ink-secondary)', margin: '0 0 24px', fontSize: '0.95rem', lineHeight: 1.55 }}>
            This project link may have expired or been moved. Please verify the copied link address or contact your studio lead.
          </p>
          <button onClick={openDashboard} className="cp-btn-primary">
            Back to DropBrief
          </button>
        </div>
      </div>
    );
  }

  const items = project.items || [];
  const requiredItems = items.filter((i) => i.required !== false);
  const optionalItems = items.filter((i) => i.required === false);
  const hasRequiredItems = requiredItems.length > 0;
  const completedCount = items.filter((i) => i.isCompleted).length;
  const requiredCompletedCount = requiredItems.filter((i) => i.isCompleted).length;
  const optionalCompletedCount = optionalItems.filter((i) => i.isCompleted).length;
  const totalCount = items.length;
  const isAllDone = totalCount > 0 && completedCount === totalCount;
  const isRequiredComplete = areProjectItemsComplete(items);
  const progressPercent = hasRequiredItems
    ? Math.round((requiredCompletedCount / requiredItems.length) * 100)
    : (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);

  // Cadence & Batches (ongoing projects)
  const isOngoing = Boolean(project.projectType === 'ongoing' || project.project_type === 'ongoing');
  const todayDateStr = getTodayDateString();
  const todayBatch = getCurrentBatch(project, todayDateStr);
  const isTodayDone = isBatchSubmitted(todayBatch) || (isOngoing && isRequiredComplete);

  const triggerCompletionCelebration = () => {
    setCelebrationCount((c) => c + 1);
    setShowCompletionModal(true);
    confetti({
      particleCount: 140,
      spread: 85,
      origin: { y: 0.58 },
      colors: ['#FFE500', '#FF4400', '#10B981', '#111111']
    });
  };

  // Trigger celebratory handoff screen & confetti when required items become complete
  const handleCheckCompletion = (nextItems) => {
    const wasReady = isRequiredComplete;
    const isNowReady = areProjectItemsComplete(nextItems);
    const allSubmitted = nextItems.length > 0 && nextItems.every((i) => i.isCompleted);

    if (isNowReady && !wasReady) {
      triggerCompletionCelebration();
      addToast(
        allSubmitted
          ? 'Awesome! All requested assets have been successfully submitted.'
          : 'All required deliverables are in! Optional items can remain empty.',
        'success',
        allSubmitted ? 'All Done!' : 'Required Complete!'
      );
    } else if (wasReady && !isAllDone && allSubmitted) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.62 },
        colors: ['#FFE500', '#10B981', '#111111']
      });
      addToast('All optional extras delivered too — 100% complete!', 'success', '100% Delivered');
    }
  };

  const handleDoneClick = () => {
    const missingRequired = items.filter((i) => i.required !== false && !i.isCompleted);

    if (hasRequiredItems && missingRequired.length > 0) {
      const firstMissing = missingRequired[0];
      const targetEl = document.getElementById(`cp-item-card-${firstMissing.id}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setAttentionItemId(firstMissing.id);
      setTimeout(() => setAttentionItemId(null), 1600);
      addToast(
        `Please complete the ${missingRequired.length} remaining required item${missingRequired.length === 1 ? '' : 's'} first — optional items can remain empty.`,
        'warning',
        'Required Items Remaining'
      );
      return;
    }

    setClientConfirmedDone(true);
    triggerCompletionCelebration();
  };

  const MAX_STAGED_FILES_PER_ITEM = 20;

  // 1. Stage local files (guarded by file count limit)
  const handleStageFiles = (itemId, filesInput) => {
    if (isFreelancerReadOnly) {
      addToast('As a freelancer, you are viewing a preview. Files and text are uploaded exclusively by the client.', 'warning', 'Client Only');
      return;
    }
    if (!filesInput) return;
    const fileArray = Array.from(
      filesInput instanceof FileList ? filesInput : (Array.isArray(filesInput) ? filesInput : [filesInput])
    );
    if (fileArray.length === 0) return;

    setStagedFiles((prev) => {
      const current = prev[itemId] || [];
      if (current.length + fileArray.length > MAX_STAGED_FILES_PER_ITEM) {
        addToast(`Maximum ${MAX_STAGED_FILES_PER_ITEM} files per item allowed.`, 'warning', 'Limit Reached');
        const allowedSlice = fileArray.slice(0, Math.max(0, MAX_STAGED_FILES_PER_ITEM - current.length));
        return {
          ...prev,
          [itemId]: [...current, ...allowedSlice]
        };
      }
      return {
        ...prev,
        [itemId]: [...current, ...fileArray]
      };
    });
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
      addToast('As a freelancer, you cannot upload files on behalf of the client.', 'warning', 'Client Only');
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
          const reqDone = areProjectItemsComplete(updatedItems);
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

        const nextItems = project.items.map((i) => (i.id === itemId ? { ...i, isCompleted: true } : i));
        handleCheckCompletion(nextItems);
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

      const nextItems = project.items.map((i) => (i.id === itemId ? { ...i, isCompleted: true } : i));
      handleCheckCompletion(nextItems);
    } catch (err) {
      console.error('File upload error:', err);
      addToast(err.message || 'File upload failed.', 'warning', 'Upload Error');
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleRemoveSingleFile = async (itemId, fileIdentifier) => {
    if (isFreelancerReadOnly) {
      addToast('As a freelancer, you cannot delete client files in the client portal.', 'warning', 'Client Only');
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
        const reqDone = areProjectItemsComplete(updatedItems);
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
      addToast('As a freelancer, you cannot enter text on behalf of the client.', 'warning', 'Client Only');
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
        const reqDone = areProjectItemsComplete(updatedItems);
        return { ...prev, items: updatedItems, status: reqDone ? 'completed' : 'pending' };
      });

      addToast('Copy recorded in sample preview!', 'success', 'Text Simulation');
      const nextItems = project.items.map((i) => (i.id === itemId ? { ...i, isCompleted: true } : i));
      handleCheckCompletion(nextItems);
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

    const nextItems = project.items.map((i) => (i.id === itemId ? { ...i, isCompleted: true } : i));
    handleCheckCompletion(nextItems);
  };

  const handleRemoveItemValue = async (itemId) => {
    if (isFreelancerReadOnly) {
      addToast('As a freelancer, you cannot edit client text through the client portal.', 'warning', 'Client Only');
      return;
    }

    if (isDemoMode) {
      setDemoProject((prev) => {
        const updatedItems = prev.items.map((item) => {
          if (item.id !== itemId) return item;
          return { ...item, value: null, isCompleted: false, completedAt: null };
        });
        const reqDone = areProjectItemsComplete(updatedItems);
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
    <div className="client-portal-page">
      
      {/* ── Context Banners ───────────────────────────────────── */}
      {isDemoMode ? (
        <div className="cp-demo-banner">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                background: '#FFE500',
                color: '#111111',
                border: '1.5px solid #FFE500',
                padding: '2px 8px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 900,
                fontSize: '0.72rem',
                borderRadius: '3px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Sparkles size={12} color="#111111" aria-hidden="true" />
                LIVE CLIENT EXPERIENCE
              </span>

              <span style={{
                background: '#10B981',
                color: '#FFFFFF',
                padding: '2px 8px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                fontSize: '0.7rem',
                borderRadius: '3px'
              }}>
                100% READY APP
              </span>
              
              <div style={{ fontSize: '0.84rem', color: '#F3F4F6', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <strong style={{ color: '#FFFFFF' }}>This is exactly what your client experiences (zero passwords & instant upload).</strong>
                <span style={{ color: '#D1D5DB', fontSize: '0.8rem' }}>
                  • Test dragging files or saving copy right in your browser.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                id="btn-reset-demo"
                onClick={handleResetDemo}
                className="cp-btn-secondary"
                style={{ padding: '5px 12px', fontSize: '0.76rem' }}
                title="Reset interactive preview to initial state"
              >
                <RotateCcw size={13} aria-hidden="true" />
                <span>Reset test</span>
              </button>

              <button 
                id="btn-back-to-dashboard"
                onClick={openDashboard} 
                className="cp-btn-secondary"
                style={{ padding: '5px 12px', fontSize: '0.76rem' }}
                title="Return to freelancer view"
              >
                <ArrowLeft size={13} aria-hidden="true" />
                <span>{currentFreelancer ? 'Dashboard' : 'Freelancer View'}</span>
              </button>

              {!currentFreelancer && (
                <button
                  id="btn-banner-signup"
                  onClick={() => openAuthModal('register')}
                  className="cp-btn-primary"
                  style={{ padding: '5px 14px', fontSize: '0.76rem' }}
                  title="Create your free freelancer account in 5 seconds"
                >
                  <UserPlus size={13} aria-hidden="true" />
                  <span>Sign Up Free</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : currentFreelancer ? (
        <div className="cp-preview-banner">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ color: '#111111', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 600 }}>
              <Lock size={15} color="#111111" />
              <span><strong>Client Portal Preview (Read-only mode):</strong> You are previewing the client view. Uploading files and text is reserved for the client.</span>
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                id="btn-back-to-project-detail"
                onClick={() => openProjectDetail(project.slug)} 
                className="cp-btn-primary"
                style={{ padding: '5px 14px', fontSize: '0.78rem' }}
              >
                <Layers size={13} /> Project Management
              </button>
              <button 
                id="btn-back-to-dashboard"
                onClick={openDashboard} 
                className="cp-btn-secondary"
                style={{ padding: '5px 12px', fontSize: '0.78rem' }}
              >
                <ArrowLeft size={13} /> Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="cp-container">
        
        {/* ── Main Manifest Card (Docket Intake Header) ───────── */}
        <div className="cp-manifest-card">
          
          {/* Perforated Top Receipt Header */}
          <div className="cp-manifest-perforation">
            <span className="cp-manifest-barcode">
              ||| |||| || ||||| |||| #DB-{project.slug ? project.slug.slice(0, 8).toUpperCase() : 'INTAKE'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="cp-manifest-kicker">
                <Sparkles size={11} aria-hidden="true" />
                <span>CLIENT PORTAL • ZERO REGISTRATION</span>
              </span>
              {isOngoing ? (
                <span className="cp-manifest-badge-ongoing">
                  <RefreshCw size={11} aria-hidden="true" />
                  <span>Recurring Retainer</span>
                </span>
              ) : (
                <span className="cp-manifest-badge-oneoff">
                  <Zap size={11} aria-hidden="true" />
                  <span>One-Off Docket</span>
                </span>
              )}
              {isDemoMode && (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  background: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  color: '#92400E',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  textTransform: 'uppercase'
                }}>
                  Interactive Sandbox
                </span>
              )}
            </div>
          </div>

          {/* Main Title Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: '1 1 360px' }}>
              <h1 className="cp-manifest-title">
                {project.title}
              </h1>
              <p className="cp-manifest-desc">
                {isDemoMode ? (
                  <>Welcome to the interactive preview, <strong>{project.clientName}</strong>! This is the live asset checklist requested by your studio lead. Upload files or submit copy to test the instant sync experience.</>
                ) : (
                  <>Hello <strong>{project.clientName}</strong>, below is the organized deliverables checklist needed to kick off your project. Simply drop your files or answers below — no login or account creation required.</>
                )}
              </p>
            </div>

            <div className="cp-commission-box">
              <span className="cp-commission-label">Commissioned By</span>
              <strong className="cp-commission-name">
                {project.freelancerName}
              </strong>
              {project.deadline && (
                <div className="cp-commission-deadline">
                  Target Deadline: <strong>{project.deadline}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Progress / Daily Cadence Tracker */}
          {isOngoing ? (
            <div className={`cp-cadence-box ${isTodayDone ? 'is-done' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px', height: '42px',
                  borderRadius: '6px',
                  background: isTodayDone ? '#10B981' : '#F5F3FF',
                  border: '2px solid #111111',
                  boxShadow: '2px 2px 0px #111111',
                  color: isTodayDone ? '#FFFFFF' : '#6D28D9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: '1rem', color: '#111111', display: 'block', fontWeight: 800 }}>
                    {formatDateSlovak(todayDateStr)} – Today's Deliverables
                  </strong>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                    Recurring Collection • {formatCadenceDays(project.cadenceDays || 1)}
                  </span>
                </div>
              </div>

              {isTodayDone ? (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: '#ECFDF5',
                  color: '#065F46',
                  border: '1.5px solid #10B981',
                  boxShadow: '1.5px 1.5px 0px #10B981',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle2 size={15} /> Delivered successfully today
                </span>
              ) : (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: '#FFFBEB',
                  color: '#92400E',
                  border: '1.5px solid #F59E0B',
                  boxShadow: '1.5px 1.5px 0px #F59E0B',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Clock size={15} /> Pending today's deliverables
                </span>
              )}
            </div>
          ) : (
            <div className="cp-progress-dock">
              <div className="cp-progress-label-row">
                <span style={{ color: 'var(--ink-secondary)' }}>
                  {hasRequiredItems && optionalItems.length > 0 ? (
                    <>
                      REQUIRED DELIVERABLES: <strong>{requiredCompletedCount} OF {requiredItems.length} DELIVERED</strong>
                      <span style={{ opacity: 0.72, marginLeft: '6px' }}>
                        ({optionalCompletedCount}/{optionalItems.length} optional)
                      </span>
                    </>
                  ) : (
                    <>
                      DELIVERABLES FULFILLMENT: <strong>{completedCount} OF {totalCount} DELIVERED</strong>
                    </>
                  )}
                </span>
                <span style={{ color: isRequiredComplete ? '#059669' : '#111111', fontSize: '1.1rem' }}>
                  {progressPercent}%
                </span>
              </div>
              
              <div 
                className="cp-progress-track" 
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Asset submission progress: ${progressPercent}%`}
              >
                <div 
                  className={`cp-progress-fill ${isRequiredComplete ? 'is-complete' : ''}`}
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>

              {/* 100% / Required Complete Celebration Banner */}
              {isRequiredComplete && (
                <div className="cp-all-done-banner">
                  <Sparkles size={24} style={{ flexShrink: 0, color: '#059669' }} />
                  <div>
                    <strong style={{ fontSize: '0.98rem', display: 'block', fontWeight: 800 }}>
                      {isAllDone
                        ? 'Outstanding! All requested assets and information are 100% complete.'
                        : 'All required deliverables are submitted! Ready for kickoff.'}
                    </strong>
                    <span style={{ fontSize: '0.84rem', color: '#065F46' }}>
                      {isAllDone
                        ? `${project.freelancerName} has everything needed to execute your deliverables without friction.`
                        : `${project.freelancerName} can now start right away — remaining open items below are optional extras.`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Checklist Items Stack ───────────────────────────── */}
        <div className="cp-items-stack">
          {project.items.map((item, index) => {
            const isDone = item.isCompleted;
            const isUploadingThis = uploadingItemId === item.id;

            return (
              <div 
                key={item.id}
                id={`cp-item-card-${item.id}`}
                className={`cp-item-card ${isDone ? 'is-completed' : ''} ${attentionItemId === item.id ? 'is-attention' : ''}`}
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
                
                {/* Item Head */}
                <div className="cp-item-head">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div className="cp-item-number-box">
                      {isDone ? <Check size={18} strokeWidth={3} /> : String(index + 1).padStart(2, '0')}
                    </div>

                    <div>
                      <h3 className="cp-item-title">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="cp-item-desc">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    {item.required ? (
                      <span className="cp-item-badge-req">
                        Required
                      </span>
                    ) : (
                      <span className="cp-item-badge-opt">
                        Optional
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Input or Upload Area */}
                <div className="cp-item-content">
                  
                  {/* ── File Upload Section ─────────────────────── */}
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
                            borderRadius: '8px',
                            background: '#FEF3C7',
                            border: '2px dashed #111111'
                          }}>
                            <Loader2 size={26} className="animate-spin" style={{ color: '#111111', margin: '0 auto 10px' }} />
                            <div style={{ fontSize: '0.95rem', color: '#111111', fontWeight: 800 }}>
                              Uploading files to encrypted EU storage...
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                              Please wait while materials are securely transferred
                            </div>
                          </div>
                        )}

                        {/* 2. Empty Dropzone */}
                        {!isUploadingThis && !hasAny && (
                          isFreelancerReadOnly ? (
                            <div style={{
                              border: '2px dashed #9CA3AF',
                              borderRadius: '8px',
                              padding: '24px 18px',
                              textAlign: 'center',
                              background: '#FAF9F6'
                            }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '6px',
                                background: '#E5E7EB',
                                border: '1.5px solid #111111',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 10px'
                              }}>
                                <Lock size={18} />
                              </div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--ink-primary)', marginBottom: '2px' }}>
                                Preview Mode: Uploads reserved for client
                              </div>
                              <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                                Files are uploaded directly by your client through their link. As a freelancer, you cannot submit files in preview mode.
                              </span>
                            </div>
                          ) : (
                            <div 
                              className={`cp-dropzone ${dragActiveId === item.id ? 'active' : ''}`}
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
                              tabIndex={0}
                              role="button"
                              aria-label={`Click or press Enter to choose files for: ${item.title}`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  const input = document.getElementById(`file-input-${item.id}`);
                                  if (input) input.click();
                                }
                              }}
                            >
                              <input 
                                id={`file-input-${item.id}`}
                                type="file" 
                                multiple
                                style={{ display: 'none' }}
                                aria-hidden="true"
                                tabIndex={-1}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleStageFiles(item.id, e.target.files);
                                  }
                                }}
                              />
                              <div className="cp-dropzone-icon">
                                <Upload size={22} aria-hidden="true" />
                              </div>
                              <div className="cp-dropzone-heading">
                                Drag & drop files here or <span style={{ textDecoration: 'underline' }}>click to browse</span>
                              </div>
                              <span className="cp-dropzone-hint">
                                Multi-file support • PDF, PNG, JPG, SVG, ZIP, and all standard formats
                              </span>
                            </div>
                          )
                        )}

                        {/* 3. Unified Container (Uploaded + Staged) */}
                        {!isUploadingThis && hasAny && (
                          <div 
                            className="cp-file-box"
                            style={{
                              borderColor: dragActiveId === `zone-${item.id}` ? '#FF4400' : '#111111',
                              background: dragActiveId === `zone-${item.id}` ? '#FEF3C7' : '#FAF9F6'
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
                            {/* Header */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '12px',
                              marginBottom: '14px',
                              paddingBottom: '12px',
                              borderBottom: '1.5px solid #E5E7EB'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {hasFiles ? (
                                  <FileCheck2 size={18} color="#059669" style={{ flexShrink: 0 }} />
                                ) : (
                                  <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    background: '#FEF3C7',
                                    border: '1px solid #111111',
                                    padding: '2px 6px',
                                    borderRadius: '3px'
                                  }}>
                                    READY TO UPLOAD
                                  </span>
                                )}
                                
                                <strong style={{ fontSize: '0.9rem', color: 'var(--ink-primary)', fontFamily: 'var(--font-mono)' }}>
                                  {hasBoth ? (
                                    <>
                                      FILES: {fileList.length + stagedList.length} TOTAL ({fileList.length} IN CLOUD + {stagedList.length} NEW)
                                    </>
                                  ) : hasFiles ? (
                                    <>
                                      {isDemoMode ? 'PREVIEW FILES' : 'SAVED IN CLOUD'}: {fileList.length} {fileList.length === 1 ? 'FILE' : 'FILES'}
                                    </>
                                  ) : (
                                    <>
                                      SELECTED: {stagedList.length} {stagedList.length === 1 ? 'FILE' : 'FILES'}
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
                                  className="cp-btn-secondary"
                                  style={{ fontSize: '0.76rem', padding: '5px 12px' }}
                                  title="Add more files"
                                >
                                  <Plus size={13} /> Add files
                                </button>

                                {hasStaged && (
                                  <button 
                                    type="button"
                                    onClick={() => handleClearStagedFiles(item.id)}
                                    className="cp-btn-secondary"
                                    style={{ padding: '5px 10px', color: 'var(--ink-muted)', fontSize: '0.76rem' }}
                                    title="Cancel newly selected files"
                                  >
                                    <X size={13} /> Cancel
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
                                    className="cp-btn-secondary"
                                    style={{ padding: '5px 10px', color: '#DC2626', borderColor: '#DC2626', fontSize: '0.76rem' }}
                                    title={isDemoMode ? "Delete files from preview" : "Delete all uploaded files from cloud"}
                                  >
                                    <Trash2 size={13} /> {isDemoMode ? 'Clear preview' : 'Delete all'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Files List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              
                              {/* 1. Already Uploaded Files */}
                              {hasFiles && fileList.map((f, idx) => {
                                const isImg = isImageFile(f.fileName, f.fileType);

                                return (
                                  <div key={f.id || idx} className="cp-file-row">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                      {/* Thumbnail */}
                                      {isImg && f.url ? (
                                        <a
                                          href={f.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title="Click to open full size image"
                                          aria-label={`View image ${f.fileName || 'in full size'}`}
                                          style={{ display: 'block', flexShrink: 0 }}
                                        >
                                          <img 
                                            src={f.url} 
                                            alt={f.fileName || 'Preview of uploaded image'}
                                            className="cp-file-thumb"
                                          />
                                        </a>
                                      ) : (
                                        <div className="cp-file-doc-icon">
                                          <FileText size={20} aria-hidden="true" />
                                        </div>
                                      )}

                                      <div style={{ minWidth: 0 }}>
                                        <div className="cp-file-name">
                                          {f.fileName || 'File'}
                                        </div>
                                        <div className="cp-file-meta">
                                          <span>{f.fileSize || ''}</span>
                                          <span style={{
                                            background: '#ECFDF5',
                                            color: '#065F46',
                                            border: '1px solid #10B981',
                                            borderRadius: '3px',
                                            padding: '1px 6px',
                                            fontWeight: 800
                                          }}>
                                            {isDemoMode ? '✓ SAMPLE SAVE' : '✓ SAVED IN CLOUD'}
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
                                          className="cp-btn-secondary"
                                          style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                                          title="Download / View full size file"
                                          aria-label={`Download file ${f.fileName || ''}`}
                                        >
                                          <Download size={12} aria-hidden="true" /> View
                                        </a>
                                      )}
                                      {!isFreelancerReadOnly && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSingleFile(item.id, f.id || idx)}
                                          className="cp-btn-secondary"
                                          style={{ padding: '5px 8px', color: '#DC2626' }}
                                          title={isDemoMode ? "Remove this file from preview" : "Remove this file from cloud"}
                                          aria-label={`Remove file ${f.fileName || 'from project'}`}
                                        >
                                          <X size={13} aria-hidden="true" />
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
                                  gap: '10px',
                                  margin: '6px 0',
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  color: '#92400E'
                                }}>
                                  <div style={{ flex: 1, height: '1.5px', background: '#D1D5DB' }} />
                                  <span>★ NEWLY ADDED FILES (PENDING SAVE: +{stagedList.length})</span>
                                  <div style={{ flex: 1, height: '1.5px', background: '#D1D5DB' }} />
                                </div>
                              )}

                              {/* 2. Newly Staged Files */}
                              {hasStaged && stagedList.map((f, idx) => {
                                const isImg = isImageFile(f.name, f.type);
                                const previewUrl = stagedPreviews[item.id]?.[idx] || (isImg ? URL.createObjectURL(f) : null);

                                return (
                                  <div
                                    key={idx}
                                    className="cp-file-row"
                                    style={{ background: '#FFFBEB', borderColor: '#F59E0B' }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                      {/* Thumbnail */}
                                      {isImg && previewUrl ? (
                                        <img 
                                          src={previewUrl} 
                                          alt={f.name || 'Preview of selected file'}
                                          className="cp-file-thumb"
                                        />
                                      ) : (
                                        <div className="cp-file-doc-icon" style={{ background: '#FEF3C7' }}>
                                          <FileText size={20} aria-hidden="true" />
                                        </div>
                                      )}

                                      <div style={{ minWidth: 0 }}>
                                        <div className="cp-file-name">
                                          {f.name}
                                        </div>
                                        <div className="cp-file-meta">
                                          <span>{f.size ? (f.size > 1024 * 1024 ? (f.size / 1024 / 1024).toFixed(1) + ' MB' : (f.size / 1024).toFixed(1) + ' KB') : ''}</span>
                                          <span style={{
                                            background: '#FEF3C7',
                                            color: '#92400E',
                                            border: '1px solid #F59E0B',
                                            borderRadius: '3px',
                                            padding: '1px 6px',
                                            fontWeight: 800
                                          }}>
                                            ★ NEW FILE
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveStagedFile(item.id, idx)}
                                      className="cp-btn-secondary"
                                      style={{ padding: '5px 8px', color: '#DC2626' }}
                                      title="Remove from selection"
                                      aria-label={`Remove selected file ${f.name}`}
                                    >
                                      <X size={13} aria-hidden="true" />
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
                                tabIndex={0}
                                role="button"
                                aria-label={`Add more files for: ${item.title}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    const input = document.getElementById(`file-input-unified-${item.id}`);
                                    if (input) input.click();
                                  }
                                }}
                                style={{
                                  marginTop: '12px',
                                  border: '1.5px dashed #9CA3AF',
                                  borderRadius: '6px',
                                  padding: '10px 14px',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  background: '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  color: 'var(--ink-secondary)'
                                }}
                              >
                                <Upload size={14} color="#111111" aria-hidden="true" />
                                <span>+ DROP OR CLICK TO ADD MORE FILES</span>
                              </div>
                            )}

                            {/* Save Confirmation Button */}
                            {hasStaged && (
                              <div style={{
                                marginTop: '14px',
                                paddingTop: '14px',
                                borderTop: '1.5px solid #E5E7EB',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                              }}>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmUpload(item.id)}
                                  className="cp-btn-primary"
                                  style={{
                                    width: '100%',
                                    justifyContent: 'center',
                                    padding: '11px 20px',
                                    fontSize: '0.88rem'
                                  }}
                                >
                                  <Upload size={16} /> 
                                  <span>{hasFiles 
                                    ? `SAVE & ADD TO DOCKET (+${stagedList.length} ${stagedList.length === 1 ? 'NEW FILE' : 'NEW FILES'})` 
                                    : `UPLOAD & SUBMIT TO DOCKET (${stagedList.length} ${stagedList.length === 1 ? 'FILE' : 'FILES'})`
                                  }</span>
                                </button>

                                {hasFiles && (
                                  <div style={{
                                    textAlign: 'center',
                                    fontSize: '0.74rem',
                                    fontFamily: 'var(--font-mono)',
                                    color: 'var(--ink-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                  }}>
                                    <ShieldCheck size={13} color="#059669" />
                                    <span>Previously saved files remain intact in cloud — new files are safely appended.</span>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        )}

                      </div>
                    );
                  })()}

                  {/* ── Text Input Section ──────────────────────── */}
                  {item.type === 'text' && (
                    <div>
                      {!isDone ? (
                        isFreelancerReadOnly ? (
                          <div style={{
                            padding: '16px 18px',
                            background: '#FAF9F6',
                            border: '2px dashed #9CA3AF',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '6px',
                              background: '#E5E7EB',
                              border: '1.5px solid #111111',
                              color: 'var(--ink-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Lock size={16} />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--ink-primary)' }}>
                                Preview Mode: Text entry reserved for client
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                                Deliverables and text instructions are entered directly by your client through their link.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <textarea
                              id={`textarea-${item.id}`}
                              className="cp-textarea"
                              rows={3}
                              placeholder="Type requested details, answers, links, or website copy here..."
                              aria-label={`Enter text for item ${item.title}`}
                              value={textInputs[item.id] || ''}
                              onChange={(e) => setTextInputs({ ...textInputs, [item.id]: e.target.value })}
                              style={{ marginBottom: '10px' }}
                            />
                            <button 
                              id={`btn-save-text-${item.id}`}
                              onClick={() => handleTextSave(item.id)}
                              aria-label={`Save text for item ${item.title}`}
                              className="cp-btn-primary"
                            >
                              <CheckCircle2 size={15} aria-hidden="true" />
                              <span>SAVE &amp; SUBMIT COPY</span>
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="cp-submitted-text-box">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.78rem',
                              color: '#065F46',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <CheckCircle2 size={15} /> SUBMITTED COPY:
                            </span>
                            {!isFreelancerReadOnly && (
                              <button 
                                onClick={() => handleRemoveItemValue(item.id)}
                                className="cp-btn-secondary"
                                style={{ padding: '3px 10px', fontSize: '0.74rem' }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          <p style={{
                            fontSize: '0.92rem',
                            color: 'var(--ink-primary)',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.55,
                            margin: 0
                          }}>
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

        {/* ── Bottom Finish / Handoff Action Dock ───────────────── */}
        {(!isFreelancerReadOnly || isRequiredComplete) && (() => {
          const canFinishNow = !hasRequiredItems || isRequiredComplete;
          const missingReqCount = Math.max(0, requiredItems.length - requiredCompletedCount);
          const unsubmittedOptCount = Math.max(0, optionalItems.length - optionalCompletedCount);

          return (
            <div className={`cp-done-dock ${canFinishNow ? 'is-ready' : ''}`}>
              <div className="cp-done-dock-info">
                <div className="cp-done-icon-box" aria-hidden="true">
                  {canFinishNow ? <Check size={22} strokeWidth={3} /> : <Clock size={20} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <strong style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.05rem',
                    color: 'var(--ink-primary)',
                    display: 'block',
                    lineHeight: 1.25
                  }}>
                    {!hasRequiredItems
                      ? 'Ready whenever you are'
                      : isRequiredComplete
                        ? (clientConfirmedDone
                          ? `All set — ${project.freelancerName} takes it from here`
                          : 'All required deliverables are uploaded!')
                        : `${missingReqCount} required item${missingReqCount === 1 ? '' : 's'} remaining`}
                  </strong>
                  <span style={{
                    fontSize: '0.82rem',
                    color: canFinishNow ? '#065F46' : 'var(--ink-secondary)',
                    display: 'block',
                    marginTop: '2px'
                  }}>
                    {!hasRequiredItems
                      ? 'All fields above are optional. Add anything helpful or click Done to wrap up.'
                      : isRequiredComplete
                        ? (unsubmittedOptCount > 0
                          ? `${unsubmittedOptCount} optional field${unsubmittedOptCount === 1 ? '' : 's'} left blank — completely fine, click Done anytime.`
                          : `Everything is safely stored. Click Done to wrap up and confirm handoff to ${project.freelancerName}.`)
                        : (optionalItems.length > 0
                          ? 'Complete the required items above first — optional fields can stay empty.'
                          : 'Complete the remaining required items above, then click Done.')}
                  </span>
                </div>
              </div>

              <button
                id="btn-client-done"
                type="button"
                onClick={handleDoneClick}
                className={`cp-btn-done ${canFinishNow ? 'is-ready' : 'is-waiting'}`}
              >
                {canFinishNow ? (
                  <>
                    <CheckCircle2 size={17} aria-hidden="true" />
                    <span>Done</span>
                  </>
                ) : (
                  <span>Done ({requiredCompletedCount}/{requiredItems.length})</span>
                )}
              </button>
            </div>
          );
        })()}

        {/* ── Archive of Previous Submissions (Ongoing Projects) ─ */}
        {isOngoing && getProjectBatches(project).length > 0 && (
          <div className="cp-manifest-card" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Layers size={20} color="#6D28D9" />
              <div>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--ink-primary)', textTransform: 'uppercase' }}>
                  Archive of Previous Submissions ({getProjectBatches(project).length})
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', display: 'block' }}>
                  All previously submitted batches and files are safely stored with {project.freelancerName}.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {getProjectBatches(project).map((batch) => {
                const count = batch.files?.length || 0;
                return (
                  <div 
                    key={batch.id || batch.date}
                    className="cp-file-row"
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', fontWeight: 800, color: 'var(--ink-primary)' }}>
                          {formatDateSlovak(batch.date)}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          background: '#ECFDF5',
                          color: '#065F46',
                          border: '1px solid #10B981',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          fontWeight: 800
                        }}>
                          {count} {count === 1 ? 'FILE' : 'FILES'}
                        </span>
                      </div>
                      {batch.note && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginTop: '2px', marginBottom: 0 }} className="truncate">
                          {batch.note}
                        </p>
                      )}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#065F46', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 800 }}>
                      <CheckCircle2 size={13} /> SECURELY RECEIVED
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Security & Trust Card ───────────────────────────── */}
        <div className="cp-security-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: '#ECFDF5',
                border: '2px solid #111111',
                boxShadow: '2px 2px 0px #111111',
                color: '#065F46',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink-primary)', display: 'block', textTransform: 'uppercase' }}>
                  Bank-Grade Security &amp; End-to-End Encryption
                </strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
                  Deliverables are encrypted at rest and accessible exclusively by {project.freelancerName}.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => openLegalModal('privacy')}
                className="cp-security-pill"
                title="Inspect DropBrief data privacy and encryption details"
              >
                <Lock size={12} color="#111111" /> <span>256-BIT SSL</span>
              </button>
              <button
                type="button"
                onClick={() => openLegalModal('privacy')}
                className="cp-security-pill"
                title="Read GDPR compliance and European data hosting policy"
              >
                <Globe size={12} color="#059669" /> <span>IRELAND EU (GDPR)</span>
              </button>
              <button
                type="button"
                onClick={() => openLegalModal('retention')}
                className="cp-security-pill"
                title="Learn about automated 30-day cloud storage purge"
              >
                <Clock size={12} color="#D97706" /> <span>AUTO-PURGE 30D</span>
              </button>
              <button
                type="button"
                onClick={() => openLegalModal('cookies')}
                className="cp-security-pill"
                title="DropBrief uses zero tracking cookies"
              >
                <ShieldCheck size={12} color="#10B981" /> <span>100% COOKIE-FREE</span>
              </button>
            </div>
          </div>

          {/* Legal Links Footer */}
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1.5px dashed #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink-muted)'
          }}>
            <span>
              Files are stored temporarily and delivered exclusively to your creative lead.
            </span>
            <div style={{ display: 'flex', gap: '14px' }}>
              <button
                type="button"
                onClick={() => openLegalModal('tos')}
                style={{ background: 'none', border: 'none', color: 'var(--ink-primary)', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit', fontWeight: 700 }}
              >
                Terms of Service
              </button>
              <button
                type="button"
                onClick={() => openLegalModal('privacy')}
                style={{ background: 'none', border: 'none', color: 'var(--ink-primary)', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit', fontWeight: 700 }}
              >
                Privacy &amp; GDPR
              </button>
              <button
                type="button"
                onClick={() => openLegalModal('aup')}
                style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}
              >
                Report link (DSA)
              </button>
            </div>
          </div>
        </div>

        {/* ── Powered by DropBrief - Elegant Viral Loop ─────────── */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a
            href="https://usedropbrief.xyz"
            target="_blank"
            rel="noopener noreferrer"
            title="Create your own free client asset portal with DropBrief"
            className="cp-viral-pill"
          >
            <span>POWERED BY</span>
            <strong style={{ color: '#111111', fontWeight: 900, letterSpacing: '0.04em' }}>
              DROPBRIEF ⚡
            </strong>
            <span style={{ color: 'var(--ink-muted)' }}>•</span>
            <span style={{ color: 'var(--ink-secondary)' }}>Free Client Portal for Freelancers</span>
          </a>
        </div>

      </div>

      {/* ── Completion Handoff Animation Modal ────────────────── */}
      {showCompletionModal && (() => {
        const unsubmittedOptCount = Math.max(0, optionalItems.length - optionalCompletedCount);

        return (
          <div
            className="cp-celebration-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cp-celebration-heading"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCompletionModal(false);
            }}
          >
            <div key={`celebration-${celebrationCount}`} className="cp-celebration-card">
              <button
                type="button"
                className="cp-celebration-close"
                onClick={() => setShowCompletionModal(false)}
                aria-label="Close completion overlay"
              >
                <X size={16} aria-hidden="true" />
              </button>

              <div className="cp-celebration-stamp">
                <Sparkles size={12} aria-hidden="true" />
                <span>SUBMITTED &bull; IN CREATOR&apos;S HANDS</span>
              </div>

              {/* Choreographed SVG Studio Seal */}
              <div className="cp-seal-stage" aria-hidden="true">
                <svg className="cp-seal-ring" viewBox="0 0 112 112" fill="none">
                  <circle
                    cx="56"
                    cy="56"
                    r="50"
                    stroke="#111111"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    opacity="0.32"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeDasharray="18 8"
                  />
                </svg>

                <div className="cp-seal-disc">
                  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                    <path
                      className="cp-seal-check"
                      d="M8 20L15.5 27.5L30.5 11.5"
                      stroke="#FFFFFF"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Radial Geometric Sparks */}
                <svg className="cp-seal-spark sp-1" width="16" height="16" viewBox="0 0 16 16">
                  <rect x="4" y="4" width="8" height="8" rx="1.5" transform="rotate(45 8 8)" fill="#FFE500" stroke="#111111" strokeWidth="1.5" />
                </svg>
                <svg className="cp-seal-spark sp-2" width="14" height="14" viewBox="0 0 14 14">
                  <circle cx="7" cy="7" r="5" fill="#FF4400" stroke="#111111" strokeWidth="1.5" />
                </svg>
                <svg className="cp-seal-spark sp-3" width="14" height="14" viewBox="0 0 14 14">
                  <circle cx="7" cy="7" r="4.5" fill="#10B981" stroke="#111111" strokeWidth="1.5" />
                </svg>
                <svg className="cp-seal-spark sp-4" width="16" height="16" viewBox="0 0 16 16">
                  <rect x="4" y="4" width="8" height="8" rx="1.5" transform="rotate(45 8 8)" fill="#FFE500" stroke="#111111" strokeWidth="1.5" />
                </svg>
              </div>

              <h2 id="cp-celebration-heading" className="cp-celebration-title">
                Everything&apos;s Complete!
              </h2>

              <p className="cp-celebration-copy">
                Thanks, <strong>{project.clientName}</strong> — all required files and details have been securely received. From here on, it&apos;s completely up to <strong>{project.freelancerName}</strong> to take over and kick off your project.
              </p>

              {/* Baton Handoff Relay */}
              <div className="cp-handoff-relay">
                <div>
                  <span className="cp-handoff-node-label">Your Part</span>
                  <strong className="cp-handoff-node-name">{project.clientName}</strong>
                  <span
                    className="cp-handoff-node-status"
                    style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #10B981' }}
                  >
                    {hasRequiredItems
                      ? `${requiredCompletedCount}/${requiredItems.length} Required ✓`
                      : `${completedCount}/${totalCount} Sent ✓`}
                  </span>
                </div>

                <div className="cp-handoff-arrow" aria-hidden="true">
                  <ArrowRight size={14} strokeWidth={2.5} />
                </div>

                <div>
                  <span className="cp-handoff-node-label">Up Next</span>
                  <strong className="cp-handoff-node-name">{project.freelancerName}</strong>
                  <span
                    className="cp-handoff-node-status"
                    style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B' }}
                  >
                    Handling From Here
                  </span>
                </div>
              </div>

              {unsubmittedOptCount > 0 && (
                <div className="cp-celebration-opt-note">
                  Left <strong>{unsubmittedOptCount} optional field{unsubmittedOptCount === 1 ? '' : 's'}</strong> blank — totally fine, {project.freelancerName} already has everything needed to start.
                </div>
              )}

              <div className="cp-celebration-actions">
                <button
                  id="btn-celebration-confirm"
                  type="button"
                  onClick={() => {
                    setClientConfirmedDone(true);
                    setShowCompletionModal(false);
                  }}
                  className="cp-btn-done is-ready"
                >
                  <CheckCircle2 size={17} aria-hidden="true" />
                  <span>Done &mdash; Looks Great</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  className="cp-btn-secondary"
                >
                  Review Checklist
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}