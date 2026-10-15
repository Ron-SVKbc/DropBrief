import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  getTodayDateString, 
  formatDateSlovak, 
  formatCadenceDays, 
  formatCadenceBadge, 
  getCurrentBatch, 
  isTodaySubmitted, 
  getProjectBatches,
  getRetentionStatus 
} from '../utils/cadenceUtils';
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
  { title: 'Vector logo (SVG / AI / PDF)', description: 'Vector logo with transparent background for web and print.', type: 'file', required: true },
  { title: 'Homepage copy & messaging', description: 'Company description, services, brand story, and contact details.', type: 'text', required: true },
  { title: 'Photos of location, products & team (5-15 pcs)', description: 'High-resolution representative imagery.', type: 'file', required: true },
  { title: 'Hosting & domain credentials or access', description: 'Domain registrar login or delegated manager access.', type: 'text', required: false },
  { title: 'Billing & corporate details (Tax ID, VAT, IBAN)', description: 'Official company details for invoices and website footer.', type: 'text', required: true },
  { title: 'Contract or signed proposal (PDF)', description: 'Countersigned agreement or accepted project estimate.', type: 'file', required: false },
];

export default function ProjectDetailView() {
  const { 
    projects, 
    activeProjectSlug, 
    openDashboard, 
    openClientPortal, 
    openReminderModal, 
    openExportModal,
    addItemToProject, 
    updateItemInProject, 
    deleteItemFromProject, 
    toggleProjectType,
    updateProjectCadence,
    addToast,
    currentFreelancer,
    purgeProjectFilesNow
  } = useApp();

  const project = projects.find((p) => p.slug === activeProjectSlug || p.id === activeProjectSlug);

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'missing' | 'completed'
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedBatchTextId, setCopiedBatchTextId] = useState(null);
  
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

  // Escape key handler to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isAddItemModalOpen) setIsAddItemModalOpen(false);
        if (isEditItemModalOpen) {
          setIsEditItemModalOpen(false);
          setEditingItem(null);
        }
      }
    };
    if (isAddItemModalOpen || isEditItemModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isAddItemModalOpen, isEditItemModalOpen]);

  const isOwner = Boolean(
    project &&
    currentFreelancer && (
      (project.freelancerId && project.freelancerId === currentFreelancer.id) ||
      (project.freelancerName && project.freelancerName.toLowerCase() === currentFreelancer.nick.toLowerCase()) ||
      (currentFreelancer.id === 'fl-demo-marko' && (project.id === 'proj-alfa' || project.id === 'proj-dental'))
    )
  );

  if (!project || !isOwner) {
    return (
      <div className="container" style={{ padding: '48px 24px', flex: 1 }}>
        <div className="glass-card empty-state" style={{ padding: '48px 24px' }}>
          <AlertCircle size={40} color="var(--warning)" style={{ marginBottom: '12px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
            {!project ? 'Project Not Found' : 'Access Denied'}
          </h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '20px' }}>
            {!project 
              ? 'Selected project does not exist or has been removed.' 
              : 'You do not have permission to manage this project. It belongs to another account.'}
          </p>
          <button onClick={openDashboard} className="btn btn-primary btn-pill">
            <ArrowLeft size={16} /> Back to Dashboard
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
    addToast('Private client link copied to clipboard!', 'success', 'Link Copied');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyClientEmail = () => {
    if (!project.clientEmail) return;
    navigator.clipboard.writeText(project.clientEmail);
    setCopiedEmail(true);
    addToast(`Email ${project.clientEmail} copied!`, 'success', 'Email Copied');
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleDownloadAll = () => {
    openExportModal(project.id);
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
      addToast('Please enter item title.', 'warning', 'Missing Title');
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
      addToast('Failed to add item.', 'danger', 'Error');
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
      addToast('Please enter item title.', 'warning', 'Missing Title');
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
      addToast('Failed to update item.', 'danger', 'Error');
    }
  };

  // Delete Item handler
  const handleDeleteItem = async (item) => {
    const hasFiles = item.isCompleted && item.value;
    const confirmMsg = hasFiles 
      ? `Notice: Item "${item.title}" already contains submitted client files. Do you really want to permanently remove it?`
      : `Are you sure you want to remove item "${item.title}" from this project?`;

    if (window.confirm(confirmMsg)) {
      try {
        await deleteItemFromProject(project.id, item.id);
      } catch (err) {
        addToast('Failed to remove item.', 'danger', 'Error');
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
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Dashboard
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
            title="Click to toggle project type"
            aria-label="Toggle project type between One-off and Ongoing Retainer"
          >
            {project.projectType === 'ongoing' ? <RefreshCw size={11} aria-hidden="true" /> : <Zap size={11} aria-hidden="true" />}
            {project.projectType === 'ongoing' ? `Ongoing Retainer (${formatCadenceBadge(project.cadenceDays || 1)})` : 'One-off Project'}
          </button>

          {/* Status badge */}
          {project.projectType === 'ongoing' ? (
            isTodaySubmitted(project) ? (
              <span className="badge badge-success" style={{ padding: '4px 10px', gap: '5px' }}>
                <CheckCircle2 size={12} aria-hidden="true" />
                Delivered today (Ready)
              </span>
            ) : (
              <span className="badge badge-warning" style={{ padding: '4px 10px', gap: '5px' }}>
                <Clock size={12} aria-hidden="true" />
                Pending for today
              </span>
            )
          ) : (
            isCompleted ? (
              <span className="badge badge-success" style={{ padding: '4px 10px', gap: '5px' }}>
                <CheckCircle2 size={12} aria-hidden="true" />
                Complete (100% submitted)
              </span>
            ) : (
              <span className="badge badge-warning" style={{ padding: '4px 10px', gap: '5px' }}>
                <Clock size={12} aria-hidden="true" />
                Waiting on client ({missingCount} pending)
              </span>
            )
          )}

          <span className="badge badge-neutral" style={{ padding: '4px 10px', gap: '5px' }}>
            <BellRing size={11} aria-hidden="true" />
            Reminder: every {project.reminderFrequency || 3} days
          </span>

          {/* Retention / Purge badge */}
          {(() => {
            const retention = getRetentionStatus(project);
            if (!retention) return null;
            return (
              <span 
                className="badge" 
                style={{ 
                  padding: '4px 10px', 
                  gap: '5px',
                  background: retention.isPurged ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                  color: retention.isPurged ? '#f87171' : 'var(--success)',
                  border: retention.isPurged ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--success-border)',
                  fontWeight: 600,
                  fontSize: '0.74rem'
                }}
                title={retention.isPurged ? 'Files were permanently purged in compliance with 30-day GDPR policy' : 'Automated 30-day retention purge'}
              >
                <ShieldCheck size={11} aria-hidden="true" />
                {retention.badgeText}
              </span>
            );
          })()}

          {/* Purge now button if completed and not yet purged */}
          {isCompleted && !project.filesPurged && !project.purgedAt && (
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('Are you sure you want to permanently purge all uploaded files for this project from cloud storage now? (Ensure you have downloaded the ZIP archive first)')) {
                  await purgeProjectFilesNow(project.slug);
                }
              }}
              className="btn btn-secondary btn-sm"
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',
                gap: '4px',
                color: 'var(--text-muted)',
                borderColor: 'rgba(239, 68, 68, 0.25)'
              }}
              title="Immediately purge project files from cloud storage (GDPR)"
              aria-label="Immediately purge project files from cloud storage (GDPR)"
            >
              <Trash2 size={11} color="var(--danger)" aria-hidden="true" />
              Purge files now
            </button>
          )}
        </div>
      </div>

      {/* ── Main Project Header Card ─────────────────────────── */}
      <div className="glass-card" style={{
        padding: 'clamp(20px, 3vw, 28px)',
        marginBottom: '24px',
        borderLeft: `4px solid ${isCompleted ? 'var(--success)' : 'var(--warning)'}`,
        boxShadow: 'var(--shadow-lg), var(--shadow-inner-highlight)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Ambient Radial Highlight */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '260px',
          height: '260px',
          background: isCompleted 
            ? 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.14) 0%, transparent 70%)',
          pointerEvents: 'none',
          contain: 'strict'
        }} />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ flex: '1 1 360px' }}>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              marginBottom: '10px',
              color: 'var(--text-primary)',
              lineHeight: 1.2
            }}>
              {project.title}
            </h1>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-hairline)'
              }}>
                <User size={13} color="var(--accent-primary)" aria-hidden="true" />
                <strong style={{ color: 'var(--text-secondary)' }}>{project.clientName}</strong>
              </span>

              <button 
                type="button"
                onClick={copyClientEmail}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  transition: 'var(--transition)'
                }}
                title="Copy client email"
                aria-label={`Copy client email: ${project.clientEmail}`}
              >
                <Mail size={13} color="var(--accent-primary)" aria-hidden="true" />
                <span>{project.clientEmail}</span>
                {copiedEmail ? <Check size={12} color="var(--success)" aria-hidden="true" /> : <Copy size={11} style={{ opacity: 0.7 }} aria-hidden="true" />}
              </button>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-hairline)'
              }}>
                <Calendar size={13} color="var(--text-muted)" aria-hidden="true" />
                <span>Deadline: <strong style={{ color: 'var(--text-secondary)' }}>{project.deadline || 'Not set'}</strong></span>
              </span>

              {project.lastReminderSent && (
                <span style={{ color: 'var(--warning-light)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Send size={12} aria-hidden="true" />
                  Last reminder: {project.lastReminderSent}
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
                title="Send reminder to client"
                aria-label={`Send reminder to client (${missingCount} pending)`}
              >
                <Send size={14} aria-hidden="true" />
                Send Reminder ({missingCount} pending)
              </button>
            ) : (
              <button
                id="btn-detail-send-again"
                onClick={() => openReminderModal(project.id)}
                className="btn btn-secondary btn-sm btn-pill"
                style={{ fontSize: '0.8rem' }}
                title="Message client"
                aria-label="Message client"
              >
                <Send size={13} aria-hidden="true" />
                Message Client
              </button>
            )}

            {/* Export Assets Button */}
            <button
              id="btn-detail-export"
              onClick={handleDownloadAll}
              className="btn btn-secondary btn-sm btn-pill"
              title="Download all delivered assets"
              aria-label={`Download all delivered assets (${completedCount} completed)`}
            >
              <Download size={14} aria-hidden="true" />
              Export Assets ({completedCount})
            </button>

            {/* Add New Item Button */}
            <button
              id="btn-detail-add-item"
              onClick={handleOpenAddItemModal}
              className="btn btn-secondary btn-sm btn-pill"
              style={{ borderColor: 'var(--accent-primary)', color: '#c7d2fe' }}
              title="Add new checklist requirement"
              aria-label="Add new checklist requirement"
            >
              <Plus size={14} color="var(--accent-primary)" aria-hidden="true" />
              Add Item
            </button>
          </div>
        </div>

        {/* ── Client Portal Link Row ───────────────────────────── */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            <div style={{
              width: '34px', height: '34px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.18)',
              color: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.25)'
            }} aria-hidden="true">
              <ExternalLink size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Private Client Portal Link &bull; Zero Login Required
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em' }} className="truncate">
                {window.location.origin.includes('localhost') ? 'https://usedropbrief.xyz' : window.location.origin}/?p={project.slug}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <button
              id="btn-detail-copy-link"
              onClick={copyClientLink}
              className="btn btn-primary btn-sm btn-pill"
              style={{
                padding: '6px 16px',
                fontSize: '0.82rem',
                gap: '6px',
                boxShadow: copiedLink ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'var(--accent-glow)'
              }}
              aria-label="Copy private client portal link"
            >
              {copiedLink ? <Check size={13} color="#fff" aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              {copiedLink ? 'Link Copied!' : 'Copy Link'}
            </button>

            <button
              id="btn-detail-preview-portal"
              onClick={() => openClientPortal(project.slug)}
              className="btn btn-secondary btn-sm btn-pill"
              style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
              title="Preview client portal"
              aria-label="Preview client portal"
            >
              <Eye size={13} aria-hidden="true" />
              Client Preview
            </button>
          </div>
        </div>
      </div>

      {/* ── Recurring Collection (Cadence Hub & Daily Batches) ─────────────────── */}
      {project.projectType === 'ongoing' && (
        <div className="glass-card" style={{
          padding: '24px 28px',
          marginBottom: '26px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(10, 14, 25, 0.95) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.12)'
        }}>
          {/* Header Row: Cadence Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.25)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.4)', fontWeight: 700 }}>
                  <RefreshCw size={11} aria-hidden="true" /> Ongoing Retainer
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Permanent client upload link
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Deliverables cadence: <span style={{ color: '#c084fc' }}>{formatCadenceDays(project.cadenceDays || 1)}</span>
              </h3>
            </div>

            {/* Quick cadence selector buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }} role="group" aria-label="Cadence frequency options">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>Change cadence:</span>
              {[
                { days: 1, label: 'Every day' },
                { days: 2, label: 'Every 2 days' },
                { days: 3, label: 'Every 3 days' },
                { days: 7, label: 'Every week' },
                { days: 30, label: 'Every month' },
              ].map((opt) => {
                const isActive = (project.cadenceDays || 1) === opt.days;
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => updateProjectCadence(project.id, opt.days)}
                    className="badge"
                    style={{
                      padding: '5px 10px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: isActive ? 'rgba(168, 85, 247, 0.35)' : 'rgba(255, 255, 255, 0.04)',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      border: isActive ? '1px solid #c084fc' : '1px solid var(--border-subtle)',
                      transition: 'all 0.15s ease'
                    }}
                    aria-label={`Set cadence to: ${opt.label}`}
                    aria-pressed={isActive}
                  >
                    {isActive && <Check size={11} color="#c084fc" style={{ marginRight: '4px' }} aria-hidden="true" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today status / Today batch */}
          {(() => {
            const todayStr = getTodayDateString();
            const todayBatch = getCurrentBatch(project, todayStr);
            const isDelivered = Boolean(todayBatch && (todayBatch.status === 'completed' || todayBatch.files?.length > 0 || todayBatch.note));
            
            return (
              <div style={{
                padding: '18px 22px',
                borderRadius: 'var(--radius-lg)',
                background: isDelivered ? 'rgba(168, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.08)',
                border: isDelivered ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px', height: '44px',
                    borderRadius: 'var(--radius-md)',
                    background: isDelivered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: isDelivered ? 'var(--success)' : 'var(--warning)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }} aria-hidden="true">
                    {isDelivered ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '1rem', color: '#fff' }}>
                        {formatDateSlovak(todayStr)}
                      </strong>
                      <span className={`badge ${isDelivered ? 'badge-success' : 'badge-warning'}`}>
                        {isDelivered ? 'Assets ready for processing' : 'Waiting for today deliverables'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      {isDelivered ? (
                        <>Client submitted today batch: <strong>{todayBatch.files?.length || 0} files</strong> {todayBatch.note ? `• ${todayBatch.note.substring(0, 60)}...` : ''}</>
                      ) : (
                        <>Client has not uploaded today deliverables yet. You can send a 1-click reminder.</>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {isDelivered ? (
                    <>
                      <button
                        type="button"
                        onClick={handleDownloadAll}
                        className="btn btn-primary btn-sm btn-pill"
                        style={{ gap: '6px' }}
                        aria-label="Download today submitted assets"
                      >
                        <Download size={13} aria-hidden="true" />
                        Download Today Assets
                      </button>
                      {todayBatch?.note && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(todayBatch.note);
                            addToast('Today note copied to clipboard!', 'success', 'Copied');
                          }}
                          className="btn btn-secondary btn-sm btn-pill"
                          style={{ gap: '6px' }}
                          aria-label="Copy today note from client"
                        >
                          <Copy size={13} aria-hidden="true" />
                          Copy Note
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openReminderModal(project.id)}
                      className="btn btn-primary btn-sm btn-pill"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        gap: '6px'
                      }}
                      aria-label="Send reminder to client for today"
                    >
                      <Send size={13} aria-hidden="true" />
                      Send Reminder for Today
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Submission history / Batches feed */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={15} color="#c084fc" aria-hidden="true" />
                Submission History ({getProjectBatches(project).length})
              </div>
            </div>

            {getProjectBatches(project).length === 0 ? (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed var(--border-subtle)',
                color: 'var(--text-tertiary)',
                fontSize: '0.85rem'
              }}>
                No previous batches recorded yet. When the client submits today deliverables, they will be archived here automatically.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {getProjectBatches(project).map((batch) => {
                  const filesCount = batch.files?.length || 0;
                  return (
                    <div 
                      key={batch.id || batch.date}
                      style={{
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: '32px', height: '32px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(168, 85, 247, 0.15)',
                          color: '#c084fc',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }} aria-hidden="true">
                          <Calendar size={15} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {formatDateSlovak(batch.date)}
                            </strong>
                            <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                              {filesCount} {filesCount === 1 ? 'file' : 'files'}
                            </span>
                          </div>
                          {batch.note && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }} className="truncate">
                              {batch.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {batch.note && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(batch.note);
                              addToast('Batch note copied to clipboard!', 'success', 'Copied');
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                            title="Copy note"
                            aria-label={`Copy note for batch ${batch.date}`}
                          >
                            <Copy size={12} aria-hidden="true" /> Copy Note
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleDownloadAll}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                          title="Download assets"
                          aria-label={`Download assets for batch ${batch.date}`}
                        >
                          <Download size={12} aria-hidden="true" /> Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bento Metrics & Zero-Friction Info ─────────────────── */}
      <div className="bento-grid bento-grid-3" style={{ marginBottom: '28px' }}>
        
        {/* Metric 1 — Delivered */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span className="metric-label">Delivered by client</span>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--success-border)',
              flexShrink: 0
            }} aria-hidden="true">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--success-light)' }}>
            {completedCount} <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>/ {totalCount}</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {progressPercent}% of deliverables completed
          </div>
          
          <div 
            className="progress-track" 
            style={{ marginTop: '12px' }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress of client deliverables: ${progressPercent}%`}
          >
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
            <span className="metric-label">Pending from client (Missing)</span>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--warning-border)',
              flexShrink: 0
            }} aria-hidden="true">
              <Clock size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: missingCount > 0 ? 'var(--warning-light)' : 'var(--text-secondary)' }}>
            {missingCount}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {missingCount === 0 ? 'No missing deliverables' : 'Requires client attention & upload'}
          </div>

          <div style={{ marginTop: '12px' }}>
            {missingCount > 0 ? (
              <button 
                onClick={() => openReminderModal(project.id)}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', fontSize: '0.76rem', color: 'var(--warning-light)', borderColor: 'var(--warning-border)', padding: '5px 10px' }}
                aria-label="Send reminder to client for missing deliverables"
              >
                <Send size={12} aria-hidden="true" /> Send reminder to client
              </button>
            ) : (
              <div style={{ fontSize: '0.76rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={13} aria-hidden="true" /> All deliverables received
              </div>
            )}
          </div>
        </div>

        {/* Metric 3 — Client Submission Rule Info */}
        <div className="glass-card" style={{ padding: '18px 20px', background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(13, 18, 32, 0.6) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={18} color="var(--accent-primary)" aria-hidden="true" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e0e7ff' }}>Secure Deliverables Collection</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: '10px' }}>
            Files and text are submitted exclusively by the client through their dedicated link. As a freelancer, you manage the list of requirements here and review submitted deliverables.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--accent-primary-light)', fontWeight: 600 }}>
            <Sparkles size={12} aria-hidden="true" /> Zero-friction: client needs no password or login
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
              Project Deliverables Checklist
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              Detailed overview of received deliverables and missing items for this project.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter pills */}
            <div className="segmented-control" role="group" aria-label="Filter checklist items">
              <button
                onClick={() => setActiveFilter('all')}
                className={`btn btn-sm btn-pill ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', padding: '5px 12px', fontSize: 'var(--text-xs)', fontWeight: 700 }}
                aria-pressed={activeFilter === 'all'}
              >
                All &bull; {totalCount}
              </button>
              <button
                onClick={() => setActiveFilter('missing')}
                className={`btn btn-sm btn-pill ${activeFilter === 'missing' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', padding: '5px 12px', fontSize: 'var(--text-xs)', fontWeight: 700, color: activeFilter === 'missing' ? '#fff' : 'var(--warning-light)' }}
                aria-pressed={activeFilter === 'missing'}
              >
                Missing &bull; {missingCount}
              </button>
              <button
                onClick={() => setActiveFilter('completed')}
                className={`btn btn-sm btn-pill ${activeFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', padding: '5px 12px', fontSize: 'var(--text-xs)', fontWeight: 700, color: activeFilter === 'completed' ? '#fff' : 'var(--success-light)' }}
                aria-pressed={activeFilter === 'completed'}
              >
                Delivered &bull; {completedCount}
              </button>
            </div>

            {/* Add Item Button */}
            <button
              id="btn-add-item-checklist"
              onClick={handleOpenAddItemModal}
              className="btn btn-primary btn-sm btn-pill"
              style={{ gap: '6px' }}
              aria-label="Add new checklist requirement"
            >
              <Plus size={14} aria-hidden="true" />
              Add Requirement
            </button>
          </div>
        </div>

        {/* Items List */}
        {displayedItems.length === 0 ? (
          <div className="glass-card empty-state" style={{ padding: '48px 24px' }}>
            <CheckCircle2 size={36} color="var(--accent-primary)" style={{ marginBottom: '8px' }} aria-hidden="true" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px' }}>
              {activeFilter === 'missing' ? 'All items have been submitted! 🎉' : activeFilter === 'completed' ? 'No deliverables submitted yet.' : 'This project has no requirements yet.'}
            </h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.825rem', maxWidth: '420px', lineHeight: 1.5, marginBottom: '16px' }}>
              {activeFilter === 'missing' 
                ? 'The client has successfully submitted all requested deliverables.' 
                : activeFilter === 'completed' 
                  ? 'Send the client a reminder or share their link so they can upload required files.' 
                  : 'Add your first requirement by clicking the button below.'}
            </p>
            {activeFilter === 'all' && (
              <button onClick={handleOpenAddItemModal} className="btn btn-primary btn-sm btn-pill" aria-label="Add first requirement">
                <Plus size={14} aria-hidden="true" /> Add First Requirement
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
                    padding: '20px 24px',
                    borderLeft: `4px solid ${isItemDone ? 'var(--success)' : 'rgba(245, 158, 11, 0.7)'}`,
                    borderRadius: 'var(--radius-xl)',
                    background: isItemDone 
                      ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.035) 0%, rgba(13, 18, 30, 0.6) 100%)' 
                      : 'var(--bg-glass)',
                    boxShadow: isItemDone ? '0 8px 24px -8px rgba(16, 185, 129, 0.12)' : 'var(--shadow-sm)',
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
                            width: '28px', height: '28px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            color: 'var(--success)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 0 10px rgba(16, 185, 129, 0.25)'
                          }} aria-hidden="true">
                            <CheckCircle2 size={16} />
                          </div>
                        ) : (
                          <div style={{
                            width: '28px', height: '28px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(245, 158, 11, 0.12)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            color: 'var(--warning)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }} aria-hidden="true">
                            <Clock size={16} />
                          </div>
                        )}

                        <h3 style={{ fontSize: '1.025rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
                          {item.title}
                        </h3>

                        {/* Badges */}
                        <span className={`badge ${isFile ? 'badge-accent' : 'badge-violet'}`} style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                          {isFile ? <Upload size={10} aria-hidden="true" /> : <FileText size={10} aria-hidden="true" />}
                          {isFile ? 'File' : 'Text / Details'}
                        </span>

                        {item.required ? (
                          <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '2px 6px', color: 'var(--warning-light)' }}>
                            Required
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '2px 6px', opacity: 0.7 }}>
                            Optional
                          </span>
                        )}

                        {item.purged || project.filesPurged ? (
                          <span className="badge badge-neutral" style={{ fontSize: '0.68rem', padding: '2px 7px', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <Trash2 size={10} aria-hidden="true" /> Purged (GDPR 30d)
                          </span>
                        ) : isItemDone ? (
                          <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                            <Check size={10} aria-hidden="true" /> Submitted by client
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                            <Clock size={10} aria-hidden="true" /> Missing &bull; Pending
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
                          Submitted: <strong style={{ color: 'var(--text-secondary)' }}>{new Date(item.completedAt).toLocaleString('en-US')}</strong>
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
                        title="Edit title, instructions, or requirement type"
                        aria-label={`Edit requirement: ${item.title}`}
                      >
                        <Edit3 size={13} aria-hidden="true" />
                        Edit
                      </button>

                      <button
                        id={`btn-delete-item-${item.id}`}
                        onClick={() => handleDeleteItem(item)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 8px', fontSize: '0.78rem', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}
                        title="Delete requirement from project"
                        aria-label={`Delete requirement: ${item.title}`}
                      >
                        <Trash2 size={13} aria-hidden="true" />
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
                              Files delivered by client ({fileList.length}):
                            </div>

                            {fileList.length === 0 ? (
                              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                                File submitted: {item.value?.fileName || 'File'} ({item.value?.fileSize || 'N/A'})
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
                                            alt={f.fileName || 'Preview of client upload'} 
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
                                          }} aria-hidden="true">
                                            {isImg ? <ImageIcon size={18} /> : <File size={18} />}
                                          </div>
                                        )}

                                        <div style={{ minWidth: 0 }}>
                                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }} className="truncate">
                                            {f.fileName}
                                          </div>
                                          <div style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)' }}>
                                            {f.fileSize || 'Size unknown'} {f.uploadedAt ? `• ${f.uploadedAt}` : ''}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Download Link */}
                                      {project.filesPurged || f.purged ? (
                                        <span style={{ fontSize: '0.74rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: 'var(--radius-xs)' }}>
                                          <Trash2 size={11} aria-hidden="true" /> Purged (GDPR 30d)
                                        </span>
                                      ) : f.url ? (
                                        <a 
                                          href={f.url} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          download={f.fileName}
                                          className="btn btn-secondary btn-sm"
                                          style={{ fontSize: '0.78rem', padding: '5px 12px', gap: '5px' }}
                                          aria-label={`Download file ${f.fileName}`}
                                        >
                                          <Download size={12} aria-hidden="true" /> Download file
                                        </a>
                                      ) : (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                          Local demo file
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
                                Text / Information submitted by client:
                              </span>
                              <button
                                onClick={() => {
                                  const textVal = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
                                  navigator.clipboard.writeText(textVal);
                                  addToast('Text copied to clipboard!', 'success', 'Copied');
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '3px 8px', fontSize: '0.74rem', gap: '4px' }}
                                aria-label={`Copy submitted text for ${item.title}`}
                              >
                                <Copy size={11} aria-hidden="true" /> Copy text
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
                          <AlertCircle size={16} color="var(--warning)" style={{ flexShrink: 0 }} aria-hidden="true" />
                          <div style={{ fontSize: '0.825rem', color: 'var(--warning-light)' }}>
                            <strong>Client has not submitted this deliverable yet.</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                              This item will be available here as soon as the client uploads it via their private link.
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => openReminderModal(project.id)}
                          className="btn btn-secondary btn-sm btn-pill"
                          style={{ color: 'var(--warning-light)', borderColor: 'var(--warning-border)', fontSize: '0.76rem', padding: '4px 12px' }}
                          aria-label={`Remind client for ${item.title}`}
                        >
                          <Send size={11} aria-hidden="true" /> Remind client
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
          <Sparkles size={16} color="var(--accent-primary)" aria-hidden="true" />
          <span>Overall status: <strong>{completedCount} of {totalCount}</strong> requirements completed ({progressPercent}%)</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={openDashboard} 
            className="btn btn-secondary btn-sm btn-pill"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={13} aria-hidden="true" /> Back to Dashboard
          </button>
          
          <button
            onClick={handleOpenAddItemModal}
            className="btn btn-primary btn-sm btn-pill"
            aria-label="Add another requirement"
          >
            <Plus size={14} aria-hidden="true" /> Add Another Requirement
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL: ADD NEW REQUIREMENT (ADD ITEM)
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-item-modal-title"
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
                }} aria-hidden="true">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 id="add-item-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Add Requirement to Project
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Specify what deliverables the client needs to submit through their link.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsAddItemModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
                aria-label="Close dialog"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmitAddItem} style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>
              
              {/* Presets */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  Quick 1-click presets:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {QUICK_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}
                      aria-label={`Apply preset: ${p.title}`}
                    >
                      {p.title.split('(')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="new-item-title-input" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Requirement Title *
                </label>
                <input
                  id="new-item-title-input"
                  type="text"
                  className="input"
                  placeholder="e.g. Vector logo (SVG, AI) or Website copy"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="new-item-desc-input" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Instructions & details for client
                </label>
                <textarea
                  id="new-item-desc-input"
                  className="textarea"
                  rows={3}
                  placeholder="Explain the requirement to the client (e.g. Transparent background logo, SVG or high-resolution PNG)..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                />
              </div>

              {/* Type and Required row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                <div>
                  <label htmlFor="new-item-type-select" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Deliverable Type
                  </label>
                  <select 
                    id="new-item-type-select"
                    className="select"
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value)}
                  >
                    <option value="file">📁 File (Photos, PDF, Logo, ZIP)</option>
                    <option value="text">📝 Text / Content (Descriptions, credentials, copy)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Requirement Status
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
                      Required item
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
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm btn-pill"
                  style={{ gap: '6px' }}
                >
                  <Plus size={14} aria-hidden="true" /> Add to Project
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: EDIT REQUIREMENT (EDIT ITEM)
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-item-modal-title"
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
                }} aria-hidden="true">
                  <Edit3 size={17} />
                </div>
                <div>
                  <h3 id="edit-item-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Edit Requirement
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Update title, instructions, and client settings.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsEditItemModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
                aria-label="Close dialog"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmitEditItem} style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>
              
              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="edit-item-title-input" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Requirement Title *
                </label>
                <input
                  id="edit-item-title-input"
                  type="text"
                  className="input"
                  value={editItemTitle}
                  onChange={(e) => setEditItemTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="edit-item-desc-input" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Instructions & details for client
                </label>
                <textarea
                  id="edit-item-desc-input"
                  className="textarea"
                  rows={3}
                  value={editItemDesc}
                  onChange={(e) => setEditItemDesc(e.target.value)}
                />
              </div>

              {/* Type and Required row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                <div>
                  <label htmlFor="edit-item-type-select" style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Deliverable Type
                  </label>
                  <select 
                    id="edit-item-type-select"
                    className="select"
                    value={editItemType}
                    onChange={(e) => setEditItemType(e.target.value)}
                  >
                    <option value="file">📁 File</option>
                    <option value="text">📝 Text / Copy</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Requirement Status
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
                      Required item
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
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm btn-pill"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
