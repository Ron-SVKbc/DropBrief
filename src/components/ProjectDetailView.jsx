import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  ExternalLink, 
  Send, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  FileCheck, 
  FileX, 
  FileText, 
  Upload, 
  Calendar, 
  User, 
  Mail, 
  Layers, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  Eye, 
  File, 
  Image as ImageIcon, 
  X,
  BellRing,
  Info
} from 'lucide-react';

const isImageFile = (fileName, mimeType) => {
  if (mimeType && mimeType.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|svg|heic|heif|bmp|avif)$/i.test(fileName || '');
};

const QUICK_PRESETS = [
  { title: 'Vektorové logo (SVG / AI / PDF)', description: 'Logo v krivkách na transparentnom pozadí pre web a tlač.', type: 'file', required: true },
  { title: 'Texty a podklady na hlavnú stránku', description: 'Popis firmy, služby, príbeh značky a kontaktné údaje.', type: 'text', required: true },
  { title: 'Fotografie priestorov, produktov a tímu (5-15 ks)', description: 'Kvalitné reprezentatívne fotografie vo vysokom rozlíšení.', type: 'file', required: true },
  { title: 'Prístupy do hostingu a k doméne', description: 'Prihlasovacie údaje k registrátorovi domény alebo delegovaný prístup.', type: 'text', required: false },
  { title: 'Fakturačné a firemné údaje (IČO, DIČ, IBAN)', description: 'Oficiálne údaje spoločnosti pre fakturáciu a pätičku webu.', type: 'text', required: true },
  { title: 'Zmluva alebo podpísaná objednávka (PDF)', description: 'Obojstranne potvrdená zmluva o dielo alebo akceptovaná cenová ponuka.', type: 'file', required: false },
];

export default function ProjectDetailView() {
  const { 
    projects, 
    activeProjectSlug, 
    openDashboard, 
    openClientPortal, 
    openReminderModal, 
    addItemToProject, 
    updateItemInProject, 
    deleteItemFromProject, 
    toggleProjectType,
    addToast,
    currentFreelancer 
  } = useApp();

  const project = projects.find((p) => p.slug === activeProjectSlug || p.id === activeProjectSlug);

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'missing' | 'completed'
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  
  // Modals state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemType, setNewItemType] = useState('file');
  const [newItemRequired, setNewItemRequired] = useState(true);

  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');
  const [editItemType, setEditItemType] = useState('file');
  const [editItemRequired, setEditItemRequired] = useState(true);

  if (!project) {
    return (
      <div className="container" style={{ padding: '48px 24px', flex: 1 }}>
        <div className="glass-card empty-state" style={{ padding: '48px 24px' }}>
          <AlertCircle size={40} color="var(--warning)" style={{ marginBottom: '12px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>Zákazka sa nenašla</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '20px' }}>
            Zvolená zákazka neexistuje alebo bola odstránená.
          </p>
          <button onClick={openDashboard} className="btn btn-primary btn-pill">
            <ArrowLeft size={16} /> Späť na Nástěnku
          </button>
        </div>
      </div>
    );
  }

  const items = project.items || [];
  const completedItems = items.filter((i) => i.isCompleted);
  const missingItems = items.filter((i) => !i.isCompleted);
  const totalCount = items.length;
  const completedCount = completedItems.length;
  const missingCount = missingItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isCompleted = project.status === 'completed' || (totalCount > 0 && missingCount === 0);

  // Filter items for display
  const displayedItems = activeFilter === 'completed' 
    ? completedItems 
    : activeFilter === 'missing' 
      ? missingItems 
      : items;

  const copyClientLink = () => {
    const origin = window.location.origin;
    const baseUrl = origin.includes('localhost') || origin.includes('127.0.0.1')
      ? 'https://usedropbrief.xyz'
      : origin;
    const url = `${baseUrl}/?p=${project.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    addToast('Unikátny odkaz pre klienta bol skopírovaný do schránky!', 'success', 'Odkaz skopírovaný');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyClientEmail = () => {
    if (!project.clientEmail) return;
    navigator.clipboard.writeText(project.clientEmail);
    setCopiedEmail(true);
    addToast(`Email ${project.clientEmail} skopírovaný!`, 'success', 'Email skopírovaný');
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleDownloadAll = () => {
    if (completedItems.length === 0) {
      addToast('Klient zatiaľ neodovzdal žiadne podklady.', 'warning', 'Žiadne podklady');
      return;
    }

    const exportData = {
      project: project.title,
      slug: project.slug,
      client: project.clientName,
      clientEmail: project.clientEmail,
      freelancer: project.freelancerName || currentFreelancer?.nick || 'Freelancer',
      exportedAt: new Date().toISOString(),
      summary: {
        totalItems: totalCount,
        completedItems: completedCount,
        missingItems: missingCount,
      },
      submittedItems: completedItems.map((item) => {
        const fileList = Array.isArray(item.value?.files)
          ? item.value.files
          : (item.value?.fileName ? [item.value] : null);

        return {
          id: item.id,
          title: item.title,
          type: item.type,
          description: item.description,
          completedAt: item.completedAt,
          value: item.type === 'file' ? { fileCount: fileList?.length || 0, files: fileList } : item.value,
        };
      })
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.slug}-podklady.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast(`Export doručených podkladov pre "${project.title}" stiahnutý.`, 'success', 'Export stiahnutý');
  };

  // Add Item handler
  const handleOpenAddItemModal = () => {
    setNewItemTitle('');
    setNewItemDesc('');
    setNewItemType('file');
    setNewItemRequired(true);
    setIsAddItemModalOpen(true);
  };

  const handleApplyPreset = (preset) => {
    setNewItemTitle(preset.title);
    setNewItemDesc(preset.description);
    setNewItemType(preset.type);
    setNewItemRequired(preset.required);
  };

  const handleSubmitAddItem = async (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) {
      addToast('Zadajte názov požiadavky.', 'warning', 'Chýba názov');
      return;
    }

    try {
      await addItemToProject(project.id, {
        title: newItemTitle,
        description: newItemDesc,
        type: newItemType,
        required: newItemRequired,
      });
      setIsAddItemModalOpen(false);
    } catch (err) {
      addToast('Nepodarilo sa pridať položku.', 'danger', 'Chyba');
    }
  };

  // Edit Item handler
  const handleOpenEditItemModal = (item) => {
    setEditingItem(item);
    setEditItemTitle(item.title);
    setEditItemDesc(item.description || '');
    setEditItemType(item.type || 'file');
    setEditItemRequired(item.required !== false);
    setIsEditItemModalOpen(true);
  };

  const handleSubmitEditItem = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editItemTitle.trim()) {
      addToast('Zadajte názov požiadavky.', 'warning', 'Chýba názov');
      return;
    }

    try {
      await updateItemInProject(project.id, editingItem.id, {
        title: editItemTitle,
        description: editItemDesc,
        type: editItemType,
        required: editItemRequired,
      });
      setIsEditItemModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      addToast('Nepodarilo sa aktualizovať položku.', 'danger', 'Chyba');
    }
  };

  // Delete Item handler
  const handleDeleteItem = async (item) => {
    const hasFiles = item.isCompleted && item.value;
    const confirmMsg = hasFiles 
      ? `Pozor: Položka "${item.title}" už obsahuje odovzdané podklady od klienta. Naozaj ju chcete natrvalo odstrániť?`
      : `Naozaj chcete odstrániť položku "${item.title}" zo zákazky?`;

    if (window.confirm(confirmMsg)) {
      try {
        await deleteItemFromProject(project.id, item.id);
      } catch (err) {
        addToast('Nepodarilo sa odstrániť položku.', 'danger', 'Chyba');
      }
    }
  };

  return (
    <div className="container" style={{ padding: 'clamp(16px, 3vw, 32px) clamp(12px, 2vw, 24px) 72px', flex: 1 }}>

      {/* ── Breadcrumb & Top Bar ──────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <button 
          id="btn-back-to-dashboard"
          onClick={openDashboard}
          className="btn btn-secondary btn-sm btn-pill"
          style={{ gap: '6px' }}
        >
          <ArrowLeft size={14} />
          Späť na Nástěnku
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Ongoing / One-off toggle */}
          <button 
            type="button"
            id={`btn-toggle-type-${project.id}`}
            onClick={() => toggleProjectType(project.id)}
            className="badge" 
            style={{ 
              background: project.projectType === 'ongoing' ? 'rgba(168, 85, 247, 0.16)' : 'rgba(56, 189, 248, 0.16)', 
              color: project.projectType === 'ongoing' ? '#c084fc' : '#38bdf8', 
              border: project.projectType === 'ongoing' ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid rgba(56, 189, 248, 0.35)',
              gap: '5px',
              fontWeight: 700,
              fontSize: '0.74rem',
              padding: '4px 10px',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            title="Kliknutím zmeníte typ zákazky"
          >
            {project.projectType === 'ongoing' ? <RefreshCw size={11} /> : <Zap size={11} />}
            {project.projectType === 'ongoing' ? 'Dlhodobá zákazka (Ongoing)' : 'Jednorazová zákazka (One-off)'}
          </button>

          {/* Status badge */}
          {isCompleted ? (
            <span className="badge badge-success" style={{ padding: '4px 10px', gap: '5px' }}>
              <CheckCircle2 size={12} />
              Kompletné (100% odovzdané)
            </span>
          ) : (
            <span className="badge badge-warning" style={{ padding: '4px 10px', gap: '5px' }}>
              <Clock size={12} />
              Čaká sa na klienta ({missingCount} chýba)
            </span>
          )}

          <span className="badge badge-neutral" style={{ padding: '4px 10px', gap: '5px' }}>
            <BellRing size={11} />
            Pripomienka: každé {project.reminderFrequency || 3} dni
          </span>
        </div>
      </div>

      {/* ── Main Project Header Card ─────────────────────────── */}
      <div className="glass-card" style={{
        padding: '24px 28px',
        marginBottom: '24px',
        borderLeft: `4px solid ${isCompleted ? 'var(--success)' : 'var(--warning)'}`,
        boxShadow: 'var(--shadow-lg), var(--shadow-inner-highlight)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ flex: '1 1 360px' }}>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              marginBottom: '8px',
              color: 'var(--text-primary)',
              lineHeight: 1.2
            }}>
              {project.title}
            </h1>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} color="var(--accent-primary)" />
                <strong style={{ color: 'var(--text-secondary)' }}>{project.clientName}</strong>
              </span>

              <button 
                type="button"
                onClick={copyClientEmail}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  padding: 0
                }}
                title="Kopírovať email klienta"
              >
                <Mail size={14} />
                <span>{project.clientEmail}</span>
                {copiedEmail ? <Check size={12} color="var(--success)" /> : <Copy size={11} style={{ opacity: 0.7 }} />}
              </button>

              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} />
                <span>Termín (Deadline): <strong style={{ color: 'var(--text-secondary)' }}>{project.deadline || 'Nestanovený'}</strong></span>
              </span>

              {project.lastReminderSent && (
                <span style={{ color: 'var(--warning-light)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Send size={12} />
                  Posledná pripomienka: {project.lastReminderSent}
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Reminder Button */}
            {!isCompleted ? (
              <button
                id="btn-detail-send-reminder"
                onClick={() => openReminderModal(project.id)}
                className="btn btn-primary btn-sm btn-pill"
                style={{
                  boxShadow: '0 0 16px rgba(245, 158, 11, 0.3)',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700
                }}
                title="Poslať klientovi pripomienku cez Resend"
              >
                <Send size={14} />
                Poslať pripomienku ({missingCount} chýba)
              </button>
            ) : (
              <button
                id="btn-detail-send-again"
                onClick={() => openReminderModal(project.id)}
                className="btn btn-secondary btn-sm btn-pill"
                style={{ fontSize: '0.8rem' }}
                title="Poslať správu klientovi"
              >
                <Send size={13} />
                Správa klientovi
              </button>
            )}

            {/* Export Assets Button */}
            <button
              id="btn-detail-export"
              onClick={handleDownloadAll}
              className="btn btn-secondary btn-sm btn-pill"
              title="Stiahnuť všetky doručené podklady"
            >
              <Download size={14} />
              Export podkladov ({completedCount})
            </button>

            {/* Add New Item Button */}
            <button
              id="btn-detail-add-item"
              onClick={handleOpenAddItemModal}
              className="btn btn-secondary btn-sm btn-pill"
              style={{ borderColor: 'var(--accent-primary)', color: '#c7d2fe' }}
              title="Pridať novú požiadavku do checklistu"
            >
              <Plus size={14} color="var(--accent-primary)" />
              Pridať požiadavku
            </button>
          </div>
        </div>

        {/* ── Client Portal Link Row ───────────────────────────── */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div style={{
              width: '30px', height: '30px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <ExternalLink size={15} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Privátny odkaz pre klienta (Nahrávanie bez registrácie)
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }} className="truncate">
                {window.location.origin.includes('localhost') ? 'https://usedropbrief.xyz' : window.location.origin}/?p={project.slug}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <button
              id="btn-detail-copy-link"
              onClick={copyClientLink}
              className="btn btn-secondary btn-sm btn-pill"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              {copiedLink ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
              {copiedLink ? 'Skopírované!' : 'Kopírovať odkaz'}
            </button>

            <button
              id="btn-detail-preview-portal"
              onClick={() => openClientPortal(project.slug)}
              className="btn btn-secondary btn-sm btn-pill"
              style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
              title="Pozrieť si náhľad klientskeho portálu"
            >
              <Eye size={13} />
              Náhľad pre klienta
            </button>
          </div>
        </div>
      </div>

      {/* ── Bento Metrics & Zero-Friction Info ─────────────────── */}
      <div className="bento-grid bento-grid-3" style={{ marginBottom: '28px' }}>
        
        {/* Metric 1 — Delivered */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span className="metric-label">Odovzdané od klienta</span>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--success-border)',
              flexShrink: 0
            }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--success-light)' }}>
            {completedCount} <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>/ {totalCount}</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {progressPercent}% požiadaviek skompletizovaných
          </div>
          
          <div className="progress-track" style={{ marginTop: '12px' }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progressPercent}%`,
                background: isCompleted ? 'var(--success)' : 'var(--gradient-brand)'
              }} 
            />
          </div>
        </div>

        {/* Metric 2 — Missing */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span className="metric-label">Čaká sa na klienta (Chýba)</span>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--warning-border)',
              flexShrink: 0
            }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: missingCount > 0 ? 'var(--warning-light)' : 'var(--text-secondary)' }}>
            {missingCount}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {missingCount === 0 ? 'Žiadne chýbajúce podklady' : 'Vyžaduje pozornosť a nahratie klientom'}
          </div>

          <div style={{ marginTop: '12px' }}>
            {missingCount > 0 ? (
              <button 
                onClick={() => openReminderModal(project.id)}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', fontSize: '0.76rem', color: 'var(--warning-light)', borderColor: 'var(--warning-border)', padding: '5px 10px' }}
              >
                <Send size={12} /> Odoslať klientovi pripomienku
              </button>
            ) : (
              <div style={{ fontSize: '0.76rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={13} /> Všetky podklady doručené
              </div>
            )}
          </div>
        </div>

        {/* Metric 3 — Client Submission Rule Info */}
        <div className="glass-card" style={{ padding: '18px 20px', background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(13, 18, 32, 0.6) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e0e7ff' }}>Zabezpečený zber podkladov</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: '10px' }}>
            Súbory a texty nahráva výhradne zákazník cez svoj odkaz. Ako freelancer tu spravujete zoznam požiadaviek (pridávate, upravujete a uberáte elementy) a prezeráte doručené dáta.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--accent-primary-light)', fontWeight: 600 }}>
            <Sparkles size={12} /> Zero-friction: klient nepotrebuje žiadne heslo ani účet
          </div>
        </div>

      </div>

      {/* ── Checklist Items Section ───────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        
        {/* Section Header & Filters */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '3px' }}>
              Prehľad požiadaviek zákazky
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Detailný rozpis doručených podkladov a chýbajúcich položiek pre túto zákazku.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter pills */}
            <div className="segmented-control">
              <button
                onClick={() => setActiveFilter('all')}
                className={`btn btn-sm btn-pill ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', padding: '5px 12px', fontSize: 'var(--text-xs)', fontWeight: 700 }}
              >
                Všetky &bull; {totalCount}
              </button>
              <button
                onClick={() => setActiveFilter('missing')}
                className={`btn btn-sm btn-pill ${activeFilter === 'missing' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', padding: '5px 12px', fontSize: 'var(--text-xs)', fontWeight: 700, color: activeFilter === 'missing' ? '#fff' : 'var(--warning-light)' }}
              >
                Chýba &bull; {missingCount}
              </button>
              <button
                onClick={() => setActiveFilter('completed')}
                className={`btn btn-sm btn-pill ${activeFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', padding: '5px 12px', fontSize: 'var(--text-xs)', fontWeight: 700, color: activeFilter === 'completed' ? '#fff' : 'var(--success-light)' }}
              >
                Poslané &bull; {completedCount}
              </button>
            </div>

            {/* Add Item Button */}
            <button
              id="btn-add-item-checklist"
              onClick={handleOpenAddItemModal}
              className="btn btn-primary btn-sm btn-pill"
              style={{ gap: '6px' }}
            >
              <Plus size={14} />
              Pridať požiadavku
            </button>
          </div>
        </div>

        {/* Items List */}
        {displayedItems.length === 0 ? (
          <div className="glass-card empty-state" style={{ padding: '48px 24px' }}>
            <CheckCircle2 size={36} color="var(--accent-primary)" style={{ marginBottom: '8px' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px' }}>
              {activeFilter === 'missing' ? 'Všetky položky sú už poslané! 🎉' : activeFilter === 'completed' ? 'Zatiaľ neboli poslané žiadne podklady.' : 'Zákazka zatiaľ nemá žiadne požiadavky.'}
            </h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.825rem', maxWidth: '420px', lineHeight: 1.5, marginBottom: '16px' }}>
              {activeFilter === 'missing' 
                ? 'Klient úspešne odovzdal všetky požadované podklady.' 
                : activeFilter === 'completed' 
                  ? 'Pošlite klientovi pripomienku alebo odkaz, aby mohol nahrať potrebné súbory.' 
                  : 'Pridajte novú požiadavku kliknutím na tlačidlo nižšie.'}
            </p>
            {activeFilter === 'all' && (
              <button onClick={handleOpenAddItemModal} className="btn btn-primary btn-sm btn-pill">
                <Plus size={14} /> Pridať prvú požiadavku
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {displayedItems.map((item, index) => {
              const isItemDone = item.isCompleted;
              const isFile = item.type === 'file';
              const fileList = Array.isArray(item.value?.files) 
                ? item.value.files 
                : (item.value?.fileName ? [item.value] : []);

              return (
                <div 
                  key={item.id || index}
                  className="glass-card"
                  style={{
                    padding: '20px 22px',
                    borderLeft: `3px solid ${isItemDone ? 'var(--success)' : 'var(--warning)'}`,
                    background: isItemDone ? 'rgba(16, 185, 129, 0.025)' : 'rgba(255, 255, 255, 0.02)',
                    transition: 'var(--transition)'
                  }}
                >
                  {/* Top Item Row */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        {/* Status Icon */}
                        {isItemDone ? (
                          <div style={{
                            width: '24px', height: '24px',
                            borderRadius: 'var(--radius-xs)',
                            background: 'var(--success-bg)',
                            color: 'var(--success)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <CheckCircle2 size={15} />
                          </div>
                        ) : (
                          <div style={{
                            width: '24px', height: '24px',
                            borderRadius: 'var(--radius-xs)',
                            background: 'var(--warning-bg)',
                            color: 'var(--warning)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Clock size={15} />
                          </div>
                        )}

                        <h3 style={{ fontSize: '1.025rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
                          {item.title}
                        </h3>

                        {/* Badges */}
                        <span className={`badge ${isFile ? 'badge-accent' : 'badge-violet'}`} style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                          {isFile ? <Upload size={10} /> : <FileText size={10} />}
                          {isFile ? 'Súbor' : 'Text / Zadanie'}
                        </span>

                        {item.required ? (
                          <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '2px 6px', color: 'var(--warning-light)' }}>
                            Povinné
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '2px 6px', opacity: 0.7 }}>
                            Voliteľné
                          </span>
                        )}

                        {isItemDone ? (
                          <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                            <Check size={10} /> Klient odovzdal
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                            <Clock size={10} /> Chýba &bull; Čaká sa
                          </span>
                        )}
                      </div>

                      {/* Item Description / Instructions for client */}
                      {item.description && (
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-tertiary)', marginLeft: '32px', marginBottom: '4px', lineHeight: 1.5 }}>
                          {item.description}
                        </p>
                      )}

                      {/* Completed Timestamp */}
                      {isItemDone && item.completedAt && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', marginLeft: '32px', marginTop: '4px' }}>
                          Odovzdané: <strong style={{ color: 'var(--text-secondary)' }}>{new Date(item.completedAt).toLocaleString('sk-SK')}</strong>
                        </div>
                      )}
                    </div>

                    {/* Action buttons for item */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                      <button
                        id={`btn-edit-item-${item.id}`}
                        onClick={() => handleOpenEditItemModal(item)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 10px', fontSize: '0.78rem', borderRadius: 'var(--radius-sm)' }}
                        title="Upraviť názov, popis alebo typ požiadavky"
                      >
                        <Edit3 size={13} />
                        Upraviť
                      </button>

                      <button
                        id={`btn-delete-item-${item.id}`}
                        onClick={() => handleDeleteItem(item)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 8px', fontSize: '0.78rem', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}
                        title="Odstrániť požiadavku zo zákazky"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* ── Submitted Content Box (Read-only for Freelancer) ───── */}
                  <div style={{ marginLeft: '32px', marginTop: '12px' }}>
                    {isItemDone ? (
                      /* Content has been delivered by client */
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 16px'
                      }}>
                        {isFile ? (
                          /* Files delivered */
                          <div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                              Doručené súbory od klienta ({fileList.length}):
                            </div>

                            {fileList.length === 0 ? (
                              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                                Súbor odovzdaný: {item.value?.fileName || 'Súbor'} ({item.value?.fileSize || 'N/A'})
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {fileList.map((f, fIdx) => {
                                  const isImg = isImageFile(f.fileName, f.fileType);
                                  return (
                                    <div 
                                      key={f.id || fIdx}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                        padding: '8px 12px',
                                        background: 'rgba(255, 255, 255, 0.025)',
                                        border: '1px solid var(--border-hairline)',
                                        borderRadius: 'var(--radius-sm)'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                        {/* Thumbnail or File icon */}
                                        {isImg && f.url ? (
                                          <img 
                                            src={f.url} 
                                            alt={f.fileName} 
                                            style={{
                                              width: '36px', height: '36px',
                                              objectFit: 'cover',
                                              borderRadius: 'var(--radius-xs)',
                                              border: '1px solid var(--border-subtle)',
                                              flexShrink: 0
                                            }} 
                                          />
                                        ) : (
                                          <div style={{
                                            width: '36px', height: '36px',
                                            borderRadius: 'var(--radius-xs)',
                                            background: 'rgba(99, 102, 241, 0.12)',
                                            color: 'var(--accent-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                          }}>
                                            {isImg ? <ImageIcon size={18} /> : <File size={18} />}
                                          </div>
                                        )}

                                        <div style={{ minWidth: 0 }}>
                                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }} className="truncate">
                                            {f.fileName}
                                          </div>
                                          <div style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)' }}>
                                            {f.fileSize || 'Veľkosť neznáma'} {f.uploadedAt ? `• ${f.uploadedAt}` : ''}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Download Link */}
                                      {f.url ? (
                                        <a 
                                          href={f.url} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          download={f.fileName}
                                          className="btn btn-secondary btn-sm"
                                          style={{ fontSize: '0.78rem', padding: '5px 12px', gap: '5px' }}
                                        >
                                          <Download size={12} /> Stiahnuť súbor
                                        </a>
                                      ) : (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                          Lokálny demo súbor
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Text delivered */
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Text / Podklady zadané klientom:
                              </span>
                              <button
                                onClick={() => {
                                  const textVal = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
                                  navigator.clipboard.writeText(textVal);
                                  addToast('Text skopírovaný do schránky!', 'success', 'Skopírované');
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.74rem', gap: '4px' }}
                              >
                                <Copy size={11} /> Kopírovať text
                              </button>
                            </div>
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid var(--border-hairline)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '12px 14px',
                              fontSize: '0.86rem',
                              color: '#f8fafc',
                              lineHeight: 1.6,
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'var(--font-sans)'
                            }}>
                              {typeof item.value === 'string' ? item.value : JSON.stringify(item.value, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Item is missing - client hasn't uploaded yet */
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.05)',
                        border: '1px dashed rgba(245, 158, 11, 0.25)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <AlertCircle size={16} color="var(--warning)" style={{ flexShrink: 0 }} />
                          <div style={{ fontSize: '0.825rem', color: 'var(--warning-light)' }}>
                            <strong>Klient zatiaľ tento podklad neodovzdal.</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                              Podklad bude sprístupnený hneď po tom, ako ho zákazník nahrá cez svoj privátny odkaz.
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => openReminderModal(project.id)}
                          className="btn btn-secondary btn-sm btn-pill"
                          style={{ color: 'var(--warning-light)', borderColor: 'var(--warning-border)', fontSize: '0.76rem', padding: '4px 12px' }}
                        >
                          <Send size={11} /> Pripomenúť klientovi
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Quick Footer Action Bar ───────────────────────────── */}
      <div className="glass-card" style={{
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <Sparkles size={16} color="var(--accent-primary)" />
          <span>Celkový stav: <strong>{completedCount} z {totalCount}</strong> požiadaviek dokončených ({progressPercent}%)</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={openDashboard} 
            className="btn btn-secondary btn-sm btn-pill"
          >
            <ArrowLeft size={13} /> Návrat na Nástenku
          </button>
          
          <button
            onClick={handleOpenAddItemModal}
            className="btn btn-primary btn-sm btn-pill"
          >
            <Plus size={14} /> Pridať ďalšiu požiadavku
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL: PRIDAŤ NOVÚ POŽIADAVKU (ADD ITEM)
          ══════════════════════════════════════════════════════════ */}
      {isAddItemModalOpen && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 4, 9, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px'
          }}
          onClick={() => setIsAddItemModalOpen(false)}
        >
          <div 
            className="auth-modal-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#0a0e19',
              border: '1px solid var(--border-active)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), var(--accent-glow)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(99, 102, 241, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px', height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Plus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Pridať požiadavku do zákazky
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Definujte, čo presne má klient odovzdať cez svoj odkaz.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsAddItemModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmitAddItem} style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>
              
              {/* Presets */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  Rýchle predlohy na jeden klik:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {QUICK_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}
                    >
                      {p.title.split('(')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Názov požiadavky *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="napr. Vektorové logo (SVG, AI) alebo Texty na web"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Inštrukcie a popis pre klienta
                </label>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="Vysvetlite klientovi požiadavku (napr. Logo na priehľadnom pozadí, formát SVG alebo PNG vo vysokom rozlíšení)..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                />
              </div>

              {/* Type and Required row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Typ podkladu
                  </label>
                  <select 
                    className="select"
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value)}
                  >
                    <option value="file">📁 Súbor (Foto, PDF, Logo, ZIP)</option>
                    <option value="text">📝 Text / Zadanie (Popis, heslá, kópia)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Dôležitosť
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    height: '42px',
                    padding: '0 12px',
                    background: 'var(--bg-input-filled)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="checkbox"
                      checked={newItemRequired}
                      onChange={(e) => setNewItemRequired(e.target.checked)}
                      style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      Povinná položka
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-hairline)' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddItemModalOpen(false)} 
                  className="btn btn-secondary btn-sm btn-pill"
                >
                  Zrušiť
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm btn-pill"
                  style={{ gap: '6px' }}
                >
                  <Plus size={14} /> Pridať do zákazky
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: UPRAVIŤ POŽIADAVKU (EDIT ITEM)
          ══════════════════════════════════════════════════════════ */}
      {isEditItemModalOpen && editingItem && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 4, 9, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px'
          }}
          onClick={() => setIsEditItemModalOpen(false)}
        >
          <div 
            className="auth-modal-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#0a0e19',
              border: '1px solid var(--border-active)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), var(--accent-glow)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(99, 102, 241, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px', height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Edit3 size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Upraviť požiadavku
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Zmena názvu, popisu a pravidiel pre klienta.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsEditItemModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmitEditItem} style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>
              
              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Názov požiadavky *
                </label>
                <input
                  type="text"
                  className="input"
                  value={editItemTitle}
                  onChange={(e) => setEditItemTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Inštrukcie a popis pre klienta
                </label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={editItemDesc}
                  onChange={(e) => setEditItemDesc(e.target.value)}
                />
              </div>

              {/* Type and Required row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Typ podkladu
                  </label>
                  <select 
                    className="select"
                    value={editItemType}
                    onChange={(e) => setEditItemType(e.target.value)}
                  >
                    <option value="file">📁 Súbor</option>
                    <option value="text">📝 Text / Zadanie</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Dôležitosť
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    height: '42px',
                    padding: '0 12px',
                    background: 'var(--bg-input-filled)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}>
                    <input 
                      type="checkbox"
                      checked={editItemRequired}
                      onChange={(e) => setEditItemRequired(e.target.checked)}
                      style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      Povinná položka
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-hairline)' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditItemModalOpen(false)} 
                  className="btn btn-secondary btn-sm btn-pill"
                >
                  Zrušiť
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm btn-pill"
                >
                  Uložiť zmeny
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
