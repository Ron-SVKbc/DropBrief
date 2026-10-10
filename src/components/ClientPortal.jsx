import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { uploadClientFile, isSupabaseConfigured } from '../lib/supabase';
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
  Check
} from 'lucide-react';

const isImageFile = (fileName, mimeType) => {
  if (mimeType && mimeType.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|svg|heic|heif|bmp|avif)$/i.test(fileName || '');
};

export default function ClientPortal() {
  const { 
    projects, 
    activeProjectSlug, 
    openDashboard, 
    updateItemValue, 
    addToast,
    fetchProjectBySlug,
    isLoadingDb
  } = useApp();

  const [loadingInitial, setLoadingInitial] = useState(false);
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

  const project = projects.find((p) => p.slug === activeProjectSlug) || projects[0];

  useEffect(() => {
    if (activeProjectSlug && !projects.some((p) => p.slug === activeProjectSlug)) {
      setLoadingInitial(true);
      fetchProjectBySlug(activeProjectSlug).finally(() => setLoadingInitial(false));
    }
  }, [activeProjectSlug, projects, fetchProjectBySlug]);

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

  if (loadingInitial || (isLoadingDb && !project)) {
    return (
      <div className="container" style={{ padding: '120px 20px', textAlign: 'center' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 18px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Pripravujem klientsky portál...</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '6px' }}>
          Načítavam požiadavky na podklady v reálnom čase
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Projekt nebol nájdený</h2>
        <p style={{ color: 'var(--text-muted)', margin: '14px 0 24px', fontSize: '0.95rem' }}>
          Tento odkaz na projekt už nemusí byť platný alebo bol odstránený zadávateľom.
        </p>
        <button onClick={openDashboard} className="btn btn-primary btn-pill">
          Späť na Dashboard
        </button>
      </div>
    );
  }

  const completedCount = project.items.filter((i) => i.isCompleted).length;
  const totalCount = project.items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && completedCount === totalCount;

  // Trigger confetti when 100% completed
  const handleCheckCompletion = (newPercent) => {
    if (newPercent === 100) {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 }
      });
      addToast('Úžasné! Všetky podklady boli úspešne odovzdané.', 'success', 'Kompletne hotovo');
    }
  };

  // 1. Stage local files
  const handleStageFiles = (itemId, filesInput) => {
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

      addToast(
        filesToUpload.length === 1 
          ? `Nahrávam ${filesToUpload[0].name} do cloudu...` 
          : `Nahrávam ${filesToUpload.length} súborov do cloudu...`, 
        'info', 
        'Odosielanie'
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
        fileName: allFiles.length === 1 ? allFiles[0].fileName : `${allFiles.length} súborov`,
        fileSize: allFiles.length === 1 ? allFiles[0].fileSize : `${allFiles.length} súborov`,
        url: allFiles[0]?.url,
      };

      await updateItemValue(project.slug, itemId, payload, true);
      handleClearStagedFiles(itemId);

      addToast(
        filesToUpload.length === 1 
          ? `Súbor "${filesToUpload[0].name}" bol úspešne uložený!`
          : `Bolo úspešne nahraných ${filesToUpload.length} súborov!`,
        'success',
        'Podklady uložené'
      );

      const newCompleted = project.items.filter((i) => (i.id === itemId ? true : i.isCompleted)).length;
      const newPercent = Math.round((newCompleted / totalCount) * 100);
      handleCheckCompletion(newPercent);
    } catch (err) {
      console.error('File upload error:', err);
      addToast(err.message || 'Nahrávanie súboru zlyhalo.', 'warning', 'Chyba pri nahrávaní');
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleRemoveSingleFile = async (itemId, fileIdentifier) => {
    const currentItem = project.items.find((i) => i.id === itemId);
    if (!currentItem || !currentItem.value) return;

    let existingFiles = [];
    if (Array.isArray(currentItem.value.files)) {
      existingFiles = [...currentItem.value.files];
    } else if (currentItem.value.fileName) {
      existingFiles = [currentItem.value];
    }

    const filtered = existingFiles.filter((f, idx) => (f.id ? f.id !== fileIdentifier : idx !== fileIdentifier));

    if (filtered.length === 0) {
      await updateItemValue(project.slug, itemId, null, false);
      addToast('Všetky súbory boli odstránené.', 'info', 'Položka resetovaná');
    } else {
      const payload = {
        files: filtered,
        fileName: filtered.length === 1 ? filtered[0].fileName : `${filtered.length} súborov`,
        fileSize: filtered.length === 1 ? filtered[0].fileSize : `${filtered.length} súborov`,
        url: filtered[0]?.url,
      };
      await updateItemValue(project.slug, itemId, payload, true);
      addToast('Súbor bol odstránený.', 'info', 'Súbor zmazaný');
    }
  };

  const handleTextSave = async (itemId) => {
    const val = textInputs[itemId];
    if (!val || val.trim().length === 0) {
      addToast('Prosím zadajte text pred uložením.', 'warning', 'Chýba text');
      return;
    }

    await updateItemValue(project.slug, itemId, val.trim(), true);
    addToast('Textové podklady boli uložené!', 'success', 'Text zaznamenaný');

    const newCompleted = project.items.filter((i) => (i.id === itemId ? true : i.isCompleted)).length;
    const newPercent = Math.round((newCompleted / totalCount) * 100);
    handleCheckCompletion(newPercent);
  };

  const handleRemoveItemValue = async (itemId) => {
    await updateItemValue(project.slug, itemId, null, false);
    setTextInputs((prev) => ({ ...prev, [itemId]: '' }));
    addToast('Položka bola vymazaná, môžete nahrať nové podklady.', 'info', 'Položka resetovaná');
  };

  return (
    <div style={{ flex: 1, paddingBottom: '70px', position: 'relative' }}>
      
      {/* Simulation Banner for the Freelancer */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.12)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.25)',
        padding: '10px 0',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <Eye size={16} color="var(--accent-primary)" />
            <span><strong>Náhľad klientskeho pohľadu:</strong> Tento odkaz vidí váš klient (žiadne heslá, nahráva priamo).</span>
          </span>
          <button 
            id="btn-back-to-dashboard"
            onClick={openDashboard} 
            className="btn btn-secondary btn-sm btn-pill"
            style={{ padding: '5px 12px', fontSize: '0.8rem' }}
          >
            <ArrowLeft size={14} /> Späť do administrácie
          </button>
        </div>
      </div>

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
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(20px)'
          }} />

          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: '10px' }}>
                <Sparkles size={11} /> Klientsky portál &bull; Bez registrácie
              </span>
              <h1 style={{ fontSize: 'clamp(1.7rem, 3.5vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '8px', color: 'var(--text-primary)' }}>
                {project.title}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem', lineHeight: 1.55, maxWidth: '520px' }}>
                Dobrý deň <strong>{project.clientName}</strong>, pripravili sme pre vás prehľadný zoznam podkladov, ktoré potrebujeme k úspešnému dokončeniu zákazky.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '14px 20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'right'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Zadávateľ zákazky:</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block', marginTop: '1px' }}>
                {project.freelancerName}
              </strong>
              {project.deadline && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Termín dodania: <strong>{project.deadline}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Progress Tracker */}
          <div style={{ marginTop: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '0.925rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                Váš postup odovzdávania: <strong>{completedCount} z {totalCount} podkladov splnených</strong>
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
                  Výborne! Všetky požadované podklady sú kompletné.
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                  {project.freelancerName} má k dispozícii všetky materiály a môže začať naplno pracovať na vašom projekte.
                </span>
              </div>
            </div>
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
                        Povinné
                      </span>
                    ) : (
                      <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                        Voliteľné
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
                              Nahrávam súbory do zabezpečeného cloudového úložiska...
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Prosím počkajte chvíľku, kým sa všetky materiály bezpečne uložia
                            </div>
                          </div>
                        )}

                        {/* 2. Empty Dropzone */}
                        {!isUploadingThis && !hasAny && (
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
                              Pretiahnite súbory sem alebo <span style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>kliknite pre výber</span>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Môžete vybrať viacero fotiek naraz &bull; Podpora PDF, PNG, JPG, ZIP a všetkých formátov
                            </span>
                          </div>
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
                                <div>Pustite súbory sem pre pridanie</div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                                  Nové súbory sa pridajú k existujúcim bez prepísania
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
                                    Pripravené na odoslanie
                                  </span>
                                )}
                                
                                <strong style={{ fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                                  {hasBoth ? (
                                    <>
                                      Fotografie: {fileList.length + stagedList.length} celkovo
                                      <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.825rem', marginLeft: '6px' }}>
                                        ({fileList.length} v cloude + {stagedList.length} nových čaká na uloženie)
                                      </span>
                                    </>
                                  ) : hasFiles ? (
                                    <>
                                      Uložené v cloude: {fileList.length} {fileList.length === 1 ? 'súbor' : (fileList.length < 5 ? 'súbory' : 'súborov')}
                                    </>
                                  ) : (
                                    <>
                                      Vybrané fotky: {stagedList.length} {stagedList.length === 1 ? 'súbor' : (stagedList.length < 5 ? 'súbory' : 'súborov')}
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
                                  title="Pridať ďalšie fotky"
                                >
                                  <Plus size={14} /> Pridať fotky
                                </button>

                                {hasStaged && (
                                  <button 
                                    type="button"
                                    onClick={() => handleClearStagedFiles(item.id)}
                                    className="btn btn-secondary btn-sm btn-pill"
                                    style={{ padding: '6px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}
                                    title="Zrušiť novovybrané fotky"
                                  >
                                    <X size={14} /> Zrušiť nové
                                  </button>
                                )}

                                {hasFiles && !hasStaged && (
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      if (confirm('Naozaj chcete odstrániť všetky nahrané súbory z tejto položky?')) {
                                        handleRemoveItemValue(item.id);
                                      }
                                    }}
                                    className="btn btn-secondary btn-sm btn-pill"
                                    style={{ padding: '6px 12px', color: 'var(--danger)', fontSize: '0.8rem' }}
                                    title="Zmazať všetky nahrané súbory z cloudu"
                                  >
                                    <Trash2 size={14} /> Zmazať z cloudu
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
                                          title="Kliknutím otvoríte fotku v plnej veľkosti"
                                          style={{ display: 'block', flexShrink: 0 }}
                                        >
                                          <img 
                                            src={f.url} 
                                            alt={f.fileName || 'Náhľad fotky'}
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
                                          {f.fileName || 'Súbor'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                          <span>{f.fileSize || ''}</span>
                                          <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                                            ✓ Uložené v cloude
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
                                          title="Stiahnuť / Zobraziť súbor v plnej veľkosti"
                                        >
                                          <Download size={13} /> Náhľad
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSingleFile(item.id, f.id || idx)}
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '6px 8px', color: 'var(--danger)', borderRadius: 'var(--radius-full)' }}
                                        title="Odstrániť tento súbor z cloudu"
                                      >
                                        <X size={14} />
                                      </button>
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
                                    <span>Novo pridané fotky (čakajú na uloženie)</span>
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
                                            ★ Nová fotka (čaká na uloženie)
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveStagedFile(item.id, idx)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: '6px 8px', color: 'var(--danger)', borderRadius: 'var(--radius-full)' }}
                                      title="Odstrániť z tohto výberu"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Mini Dropzone Underneath */}
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
                                Pretiahnite sem ďalšie fotky (Drag & Drop) alebo <strong style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>kliknite pre výber</strong>
                              </span>
                            </div>

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
                                    ? `Uložiť a pridať nové fotky do zákazky (+${stagedList.length} ${stagedList.length === 1 ? 'nová fotka' : (stagedList.length < 5 ? 'nové fotky' : 'nových fotiek')})` 
                                    : `Nahrať a odoslať do zákazky (${stagedList.length} ${stagedList.length === 1 ? 'fotka' : (stagedList.length < 5 ? 'fotky' : 'fotiek')})`
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
                                    <span>Vašich <strong>{fileList.length} doteraz uložených fotiek</strong> zostane zachovaných v cloude — nové fotky sa k nim bezpečne pridajú.</span>
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
                        <div>
                          <textarea
                            id={`textarea-${item.id}`}
                            className="textarea"
                            rows={3}
                            placeholder="Sem napíšte požadované informácie alebo texty..."
                            value={textInputs[item.id] || ''}
                            onChange={(e) => setTextInputs({ ...textInputs, [item.id]: e.target.value })}
                            style={{ marginBottom: '12px', borderRadius: 'var(--radius-lg)' }}
                          />
                          <button 
                            id={`btn-save-text-${item.id}`}
                            onClick={() => handleTextSave(item.id)}
                            className="btn btn-primary btn-sm btn-pill"
                          >
                            <CheckCircle2 size={15} /> Uložiť a odovzdať text
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid var(--success-border)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '16px 18px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircle2 size={15} /> Odovzdaný text:
                            </span>
                            <button 
                              onClick={() => handleRemoveItemValue(item.id)}
                              className="btn btn-secondary btn-sm btn-pill"
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            >
                              Upraviť
                            </button>
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
                  Vaše dáta sú v bezpečí (End-to-End ochrana)
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Súbory sú chránené bankovým šifrovaním a prístupné výhradne pre {project.freelancerName}.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>🔒 256-bit SSL</span>
              <span>🇪🇺 Frankfurt EÚ (GDPR)</span>
              <span>⏱️ Auto-delete po 30 dňoch</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
