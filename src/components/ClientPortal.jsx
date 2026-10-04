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
  X
} from 'lucide-react';

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
      <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 16px' }} />
        <h2>Pripravujem klientsky portál...</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
          Načítavam požiadavky na podklady
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Projekt nebol nájdený</h2>
        <p style={{ color: 'var(--text-muted)', margin: '12px 0 20px' }}>
          Tento odkaz na projekt už nemusí byť platný alebo bol odstránený.
        </p>
        <button onClick={openDashboard} className="btn btn-primary">
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
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      addToast('Úžasné! Všetky podklady boli úspešne odovzdané.', 'success', 'Kompletne hotovo');
    }
  };

  const handleFileUpload = async (itemId, filesInput) => {
    if (!filesInput) return;
    const fileArray = Array.from(
      filesInput instanceof FileList ? filesInput : (Array.isArray(filesInput) ? filesInput : [filesInput])
    );
    if (fileArray.length === 0) return;

    try {
      setUploadingItemId(itemId);

      // Zistíme existujúce súbory v tejto položke
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
        fileArray.length === 1 
          ? `Nahrávam ${fileArray[0].name} do cloudu...` 
          : `Nahrávam ${fileArray.length} súborov do cloudu...`, 
        'info', 
        'Odosielanie'
      );

      const uploadedFiles = [];
      for (const file of fileArray) {
        let uploadedPayload;
        if (isSupabaseConfigured) {
          uploadedPayload = await uploadClientFile(file, project.slug, itemId);
        } else {
          uploadedPayload = {
            id: 'f-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(1) + ' KB',
            fileType: file.type || 'application/octet-stream',
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
      addToast(
        fileArray.length === 1 
          ? `Súbor "${fileArray[0].name}" bol bezpečne uložený!`
          : `Bolo úspešne nahraných ${fileArray.length} súborov!`,
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
    <div style={{ flex: 1, paddingBottom: '60px' }}>
      
      {/* Simulation Bar for the user */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.15)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
        padding: '10px 0',
        textAlign: 'center',
        fontSize: '0.85rem'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={15} /> <strong>Simulácia klientskeho pohľadu:</strong> Tento odkaz dostane váš klient (žiadne heslá, nahráva priamo).
          </span>
          <button 
            id="btn-back-to-dashboard"
            onClick={openDashboard} 
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
          >
            <ArrowLeft size={14} /> Späť do administrácie
          </button>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '840px', marginTop: '36px' }}>
        
        {/* Client Portal Header */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: '8px' }}>
                Zber podkladov
              </span>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
                {project.title}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Ahoj <strong>{project.clientName}</strong>, pripravili sme pre vás prehľadný zoznam podkladov, ktoré potrebujeme k úspešnému dokončeniu zákazky.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'right'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Zadávateľ zákazky:</span>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{project.freelancerName}</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Termín: {project.deadline}</div>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                Váš postup: <strong>{completedCount} z {totalCount} podkladov splnených</strong>
              </span>
              <span style={{ fontWeight: 800, color: isAllDone ? 'var(--success)' : 'var(--accent-primary)', fontSize: '1.05rem' }}>
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
              marginTop: '20px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--success)'
            }}>
              <Sparkles size={24} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.95rem', display: 'block' }}>
                  Výborne! Všetky požadované podklady sú kompletné.
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                  {project.freelancerName} bol automaticky upozornený a môže začať pracovať na vašom projekte.
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Checklist Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          {project.items.map((item, index) => {
            const isDone = item.isCompleted;
            const isUploadingThis = uploadingItemId === item.id;

            return (
              <div 
                key={item.id}
                className="glass-card"
                style={{
                  padding: '24px',
                  borderLeft: isDone ? '4px solid var(--success)' : '4px solid var(--border-subtle)',
                  transition: 'var(--transition)'
                }}
              >
                
                {/* Item Top Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-full)',
                      background: isDone ? 'var(--success)' : 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDone ? '#fff' : 'var(--text-muted)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {isDone ? <CheckCircle2 size={16} /> : (index + 1)}
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {item.title}
                      </h3>
                      {item.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    {item.required ? (
                      <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                        Povinné
                      </span>
                    ) : (
                      <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                        Voliteľné
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Input or Upload Area */}
                <div style={{ marginTop: '16px', paddingLeft: '40px' }}>
                  
                  {/* File Upload Type */}
                  {item.type === 'file' && (() => {
                    const fileList = Array.isArray(item.value?.files)
                      ? item.value.files
                      : (item.value?.fileName ? [item.value] : []);
                    const hasFiles = fileList.length > 0;

                    return (
                      <div>
                        {isUploadingThis ? (
                          <div style={{
                            padding: '24px',
                            textAlign: 'center',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(99, 102, 241, 0.08)',
                            border: '1px dashed var(--accent-primary)'
                          }}>
                            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-primary)', margin: '0 auto 8px' }} />
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              Nahrávam súbory do šifrovaného cloudového úložiska...
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Prosím počkajte chvíľku, kým sa všetky súbory uložia
                            </div>
                          </div>
                        ) : !hasFiles ? (
                          <div 
                            className={`dropzone ${dragActiveId === item.id ? 'active' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setDragActiveId(item.id); }}
                            onDragLeave={() => setDragActiveId(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragActiveId(null);
                              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                handleFileUpload(item.id, e.dataTransfer.files);
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
                                  handleFileUpload(item.id, e.target.files);
                                }
                              }}
                            />
                            <Upload size={24} style={{ color: 'var(--accent-primary)', margin: '0 auto 8px', opacity: 0.8 }} />
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              Pretiahnite súbory sem alebo <span style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>kliknite pre výber</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Môžete označiť aj viacero fotiek či súborov naraz (max. 50 MB na súbor)
                            </span>
                          </div>
                        ) : (
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.05)',
                            border: '1px solid var(--success-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px'
                          }}>
                            {/* Header */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '10px',
                              marginBottom: '12px',
                              paddingBottom: '10px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileCheck2 size={18} color="var(--success)" />
                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                  Nahraných: {fileList.length} {fileList.length === 1 ? 'súbor' : (fileList.length < 5 ? 'súbory' : 'súborov')}
                                </strong>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input 
                                  id={`file-input-add-${item.id}`}
                                  type="file" 
                                  multiple
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      handleFileUpload(item.id, e.target.files);
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`file-input-add-${item.id}`);
                                    if (input) input.click();
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                  title="Pridať ďalšie fotky alebo súbory do tejto položky"
                                >
                                  <Plus size={14} /> Pridať ďalšie súbory
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleRemoveItemValue(item.id)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '6px 10px', color: 'var(--danger)', fontSize: '0.8rem' }}
                                  title="Zmazať všetky nahrané súbory"
                                >
                                  <Trash2 size={14} /> Zmazať všetko
                                </button>
                              </div>
                            </div>

                            {/* Files List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {fileList.map((f, idx) => (
                                <div
                                  key={f.id || idx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'rgba(0, 0, 0, 0.25)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '8px 12px',
                                    gap: '12px'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                    <FileText size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}>
                                        {f.fileName || 'Súbor'}
                                      </div>
                                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        {f.fileSize || ''}
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    {f.url && (
                                      <a
                                        href={f.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                        title="Stiahnuť / Zobraziť súbor"
                                      >
                                        <Download size={13} /> Náhľad
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSingleFile(item.id, f.id || idx)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ padding: '4px 8px', color: 'var(--danger)', fontSize: '0.75rem' }}
                                      title="Odstrániť tento súbor"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
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
                            placeholder="Sem napíšte požadované informácie..."
                            value={textInputs[item.id] || ''}
                            onChange={(e) => setTextInputs({ ...textInputs, [item.id]: e.target.value })}
                            style={{ marginBottom: '10px' }}
                          />
                          <button 
                            id={`btn-save-text-${item.id}`}
                            onClick={() => handleTextSave(item.id)}
                            className="btn btn-primary btn-sm"
                          >
                            <CheckCircle2 size={14} /> Uložiť a odovzdať text
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid var(--success-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '14px 16px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                              ✅ Odovzdaný text:
                            </span>
                            <button 
                              onClick={() => handleRemoveItemValue(item.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              Upraviť
                            </button>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
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
        <div className="glass-card" style={{ padding: '20px 24px', background: 'rgba(0, 0, 0, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--success-bg)', color: 'var(--success)' }}>
                <Lock size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block' }}>
                  Vaše dáta sú v bezpečí (End-to-End šifrovanie)
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Súbory sú chránené 256-bitovým šifrovaním a prístupné výhradne pre {project.freelancerName}.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
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
