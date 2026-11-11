import React, { useState, useEffect } from 'react';
import { useApp, getChecklistStats } from '../context/AppContext';
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
  BellRing
} from 'lucide-react';
import '../styles/project-detail-brutalist.css';

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
      <div className="pdv-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pdv-hero-card" style={{ maxWidth: '500px', textAlign: 'center', margin: '24px' }}>
          <AlertCircle size={42} color="#D97706" style={{ margin: '0 auto 12px' }} />
          <h2 className="pdv-hero-title" style={{ fontSize: '1.4rem' }}>
            {!project ? 'Project Not Found' : 'Access Denied'}
          </h2>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', marginBottom: '22px', lineHeight: 1.55 }}>
            {!project 
              ? 'Selected project docket does not exist or has been removed.' 
              : 'You do not have permission to manage this docket. It belongs to another studio account.'}
          </p>
          <button onClick={openDashboard} className="pdv-btn-primary">
            <ArrowLeft size={15} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const items = project.items || [];
  const completedItems = items.filter((i) => i.isCompleted);
  const missingItems = items.filter((i) => !i.isCompleted);
  const {
    totalCount,
    completedCount,
    missingTotalCount: missingCount,
    hasRequiredItems,
    requiredCompletedCount,
    requiredTotalCount,
    optionalTotalCount,
    missingRequiredCount,
    progressPercent,
    isReady,
    isAllDone,
  } = getChecklistStats(items);
  const isCompleted = project.status === 'completed' || isReady;

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

  const retention = getRetentionStatus(project);

  return (
    <div className="pdv-page" role="region" aria-label="Project Management Inspector">
      <div className="pdv-container">

        {/* ── Breadcrumb & Top Status Strip ────────────────────── */}
        <div className="pdv-top-bar">
          <button 
            id="btn-back-to-dashboard"
            onClick={openDashboard}
            className="pdv-btn-secondary"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Back to Dashboard</span>
          </button>

          <div className="pdv-status-group">
            {/* Ongoing / One-off toggle */}
            <button 
              type="button"
              id={`btn-toggle-type-${project.id}`}
              onClick={() => toggleProjectType(project.id)}
              className="pdv-stamp-badge is-button"
              style={{
                background: project.projectType === 'ongoing' ? '#F5F3FF' : '#EFF6FF',
                color: project.projectType === 'ongoing' ? '#6D28D9' : '#1D4ED8',
                borderColor: project.projectType === 'ongoing' ? '#6D28D9' : '#1D4ED8'
              }}
              title="Click to switch between One-off Docket and Recurring Retainer"
              aria-label="Toggle project type between One-off and Ongoing Retainer"
            >
              {project.projectType === 'ongoing' ? <RefreshCw size={12} aria-hidden="true" /> : <Zap size={12} aria-hidden="true" />}
              <span>
                {project.projectType === 'ongoing' ? `Ongoing (${formatCadenceBadge(project.cadenceDays || 1)})` : 'One-off Docket'}
              </span>
            </button>

            {/* Completion / Today status */}
            {project.projectType === 'ongoing' ? (
              isTodaySubmitted(project) ? (
                <span className="pdv-stamp-badge" style={{ background: '#ECFDF5', color: '#065F46', borderColor: '#10B981' }}>
                  <CheckCircle2 size={12} aria-hidden="true" />
                  <span>Delivered Today</span>
                </span>
              ) : (
                <span className="pdv-stamp-badge" style={{ background: '#FEF3C7', color: '#92400E', borderColor: '#F59E0B' }}>
                  <Clock size={12} aria-hidden="true" />
                  <span>Pending Today</span>
                </span>
              )
            ) : (
              isCompleted ? (
                <span className="pdv-stamp-badge" style={{ background: '#ECFDF5', color: '#065F46', borderColor: '#10B981' }}>
                  <CheckCircle2 size={12} aria-hidden="true" />
                  <span>{isAllDone ? '100% Complete' : 'Ready (Required Met)'}</span>
                </span>
              ) : (
                <span className="pdv-stamp-badge" style={{ background: '#FEF3C7', color: '#92400E', borderColor: '#F59E0B' }}>
                  <Clock size={12} aria-hidden="true" />
                  <span>
                    Waiting ({hasRequiredItems && optionalTotalCount > 0 ? `${missingRequiredCount} req pending` : `${missingCount} pending`})
                  </span>
                </span>
              )
            )}

            {/* Reminder interval */}
            <span className="pdv-stamp-badge" style={{ background: '#FFFFFF', color: '#4B5563' }}>
              <BellRing size={12} aria-hidden="true" />
              <span>Follow-up: {project.reminderFrequency || 3}d</span>
            </span>

            {/* Retention / Purge badge */}
            {retention && (
              <span 
                className="pdv-stamp-badge"
                style={{
                  background: retention.isPurged ? '#FEF2F2' : '#ECFDF5',
                  color: retention.isPurged ? '#B91C1C' : '#065F46',
                  borderColor: retention.isPurged ? '#EF4444' : '#10B981'
                }}
                title={retention.isPurged ? 'Files purged per 30-day GDPR policy' : 'Automated 30-day retention purge'}
              >
                <ShieldCheck size={12} aria-hidden="true" />
                <span>{retention.badgeText}</span>
              </span>
            )}

            {/* Purge now button if completed and not yet purged */}
            {isCompleted && !project.filesPurged && !project.purgedAt && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to permanently purge all uploaded files for this project from cloud storage now? (Ensure you have downloaded the ZIP archive first)')) {
                    await purgeProjectFilesNow(project.slug);
                  }
                }}
                className="pdv-stamp-badge is-button"
                style={{ background: '#FEF2F2', color: '#DC2626', borderColor: '#DC2626' }}
                title="Immediately purge project files from cloud storage (GDPR)"
                aria-label="Immediately purge project files from cloud storage (GDPR)"
              >
                <Trash2 size={12} aria-hidden="true" />
                <span>Purge Files Now</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Main Project Ledger Card ─────────────────────────── */}
        <div className="pdv-hero-card" style={{ borderTop: `6px solid ${isCompleted ? '#10B981' : '#F59E0B'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: '1 1 380px' }}>
              <div className="pdv-hero-kicker">
                <span>DOCKET INSPECTOR // COMMISSION RECORD</span>
              </div>
              <h1 className="pdv-hero-title">
                {project.title}
              </h1>

              <div className="pdv-meta-chips">
                <span className="pdv-meta-chip">
                  <User size={13} color="#18181B" aria-hidden="true" />
                  <strong style={{ color: '#111827' }}>{project.clientName}</strong>
                </span>

                <button 
                  type="button"
                  onClick={copyClientEmail}
                  className="pdv-meta-chip is-clickable"
                  title="Copy client email"
                  aria-label={`Copy client email: ${project.clientEmail}`}
                >
                  <Mail size={13} color="#18181B" aria-hidden="true" />
                  <span>{project.clientEmail}</span>
                  {copiedEmail ? <Check size={12} color="#059669" aria-hidden="true" /> : <Copy size={11} style={{ opacity: 0.6 }} aria-hidden="true" />}
                </button>

                <span className="pdv-meta-chip">
                  <Calendar size={13} color="#18181B" aria-hidden="true" />
                  <span>Deadline: <strong style={{ color: '#111827' }}>{project.deadline || 'Not set'}</strong></span>
                </span>

                {project.lastReminderSent && (
                  <span className="pdv-meta-chip" style={{ background: '#FFFBEB', borderColor: '#F59E0B', color: '#92400E' }}>
                    <Send size={12} aria-hidden="true" />
                    <span>Last reminder: {project.lastReminderSent}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions Deck */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {!isCompleted ? (
                <button
                  id="btn-detail-send-reminder"
                  onClick={() => openReminderModal(project.id)}
                  className="pdv-btn-primary"
                  title="Send reminder to client"
                  aria-label={`Send reminder to client (${missingCount} pending)`}
                >
                  <Send size={14} aria-hidden="true" />
                  <span>Send Reminder ({missingCount})</span>
                </button>
              ) : (
                <button
                  id="btn-detail-send-again"
                  onClick={() => openReminderModal(project.id)}
                  className="pdv-btn-secondary"
                  title="Message client"
                  aria-label="Message client"
                >
                  <Send size={13} aria-hidden="true" />
                  <span>Message Client</span>
                </button>
              )}

              <button
                id="btn-detail-export"
                onClick={handleDownloadAll}
                className="pdv-btn-secondary"
                title="Download all delivered assets as ZIP"
                aria-label={`Download all delivered assets (${completedCount} completed)`}
              >
                <Download size={14} aria-hidden="true" />
                <span>Export ZIP ({completedCount})</span>
              </button>

              <button
                id="btn-detail-add-item"
                onClick={handleOpenAddItemModal}
                className="pdv-btn-dark"
                title="Add new checklist requirement"
                aria-label="Add new checklist requirement"
              >
                <Plus size={14} aria-hidden="true" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Private Client Portal Link Console */}
          <div className="pdv-link-console">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 280px' }}>
              <div className="pdv-link-icon" aria-hidden="true">
                <ExternalLink size={17} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: 'var(--ink-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Private Client Portal Link &bull; Zero Login Required
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  color: 'var(--ink)'
                }} className="truncate">
                  {window.location.origin.includes('localhost') ? 'https://usedropbrief.xyz' : window.location.origin}/?p={project.slug}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              <button
                id="btn-detail-copy-link"
                onClick={copyClientLink}
                className="pdv-btn-yellow"
                style={{
                  background: copiedLink ? '#DCFCE7' : 'var(--yellow)',
                  borderColor: copiedLink ? '#10B981' : '#18181B'
                }}
                aria-label="Copy private client portal link"
              >
                {copiedLink ? <Check size={14} color="#065F46" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <button
                id="btn-detail-preview-portal"
                onClick={() => openClientPortal(project.slug)}
                className="pdv-btn-secondary"
                title="Preview client portal"
                aria-label="Preview client portal"
              >
                <Eye size={14} aria-hidden="true" />
                <span>Client Preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Recurring Collection (Cadence Hub & Daily Batches) ── */}
        {project.projectType === 'ongoing' && (
          <div className="pdv-ongoing-hub">
            {/* Header Row: Cadence Switcher */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              marginBottom: '18px',
              paddingBottom: '16px',
              borderBottom: '1.5px dashed #D8B4FE'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="pdv-stamp-badge" style={{ background: '#F5F3FF', color: '#6D28D9', borderColor: '#6D28D9' }}>
                    <RefreshCw size={11} aria-hidden="true" />
                    <span>Ongoing Retainer</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
                    Permanent client upload link
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)', margin: '4px 0 0' }}>
                  DELIVERABLES CADENCE: <span style={{ color: '#6D28D9' }}>{formatCadenceDays(project.cadenceDays || 1).toUpperCase()}</span>
                </h3>
              </div>

              {/* Quick cadence selector buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }} role="group" aria-label="Cadence frequency options">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-muted)', marginRight: '4px' }}>
                  CADENCE:
                </span>
                {[
                  { days: 1, label: 'Daily' },
                  { days: 2, label: 'Every 2d' },
                  { days: 3, label: 'Every 3d' },
                  { days: 7, label: 'Weekly' },
                  { days: 30, label: 'Monthly' },
                ].map((opt) => {
                  const isActive = (project.cadenceDays || 1) === opt.days;
                  return (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => updateProjectCadence(project.id, opt.days)}
                      className={`pdv-cadence-pill ${isActive ? 'is-active' : ''}`}
                      aria-label={`Set cadence to: ${opt.label}`}
                      aria-pressed={isActive}
                    >
                      {isActive && <Check size={11} aria-hidden="true" />}
                      <span>{opt.label}</span>
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
                  padding: '16px 20px',
                  borderRadius: '8px',
                  background: isDelivered ? '#ECFDF5' : '#FFFBEB',
                  border: isDelivered ? '1.5px solid #10B981' : '1.5px solid #F59E0B',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '42px', height: '42px',
                      borderRadius: '6px',
                      background: isDelivered ? '#10B981' : '#F59E0B',
                      border: '1.5px solid #18181B',
                      boxShadow: '2px 2px 0px #18181B',
                      color: isDelivered ? '#FFFFFF' : '#111827',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }} aria-hidden="true">
                      {isDelivered ? <CheckCircle2 size={22} /> : <Clock size={22} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#111827' }}>
                          {formatDateSlovak(todayStr)}
                        </strong>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '3px',
                          background: isDelivered ? '#DCFCE7' : '#FEF3C7',
                          color: isDelivered ? '#065F46' : '#92400E',
                          border: isDelivered ? '1px solid #10B981' : '1px solid #F59E0B'
                        }}>
                          {isDelivered ? 'ASSETS READY FOR PROCESSING' : 'WAITING FOR TODAY DELIVERABLES'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginTop: '4px' }}>
                        {isDelivered ? (
                          <>Client submitted today batch: <strong>{todayBatch.files?.length || 0} files</strong> {todayBatch.note ? `• ${todayBatch.note.substring(0, 60)}...` : ''}</>
                        ) : (
                          <>Client has not uploaded today deliverables yet. You can send a 1-click reminder.</>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {isDelivered ? (
                      <>
                        <button
                          type="button"
                          onClick={handleDownloadAll}
                          className="pdv-btn-primary"
                          aria-label="Download today submitted assets"
                        >
                          <Download size={13} aria-hidden="true" />
                          <span>Download Today</span>
                        </button>
                        {todayBatch?.note && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(todayBatch.note);
                              addToast('Today note copied to clipboard!', 'success', 'Copied');
                            }}
                            className="pdv-btn-secondary"
                            aria-label="Copy today note from client"
                          >
                            <Copy size={13} aria-hidden="true" />
                            <span>Copy Note</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openReminderModal(project.id)}
                        className="pdv-btn-primary"
                        aria-label="Send reminder to client for today"
                      >
                        <Send size={13} aria-hidden="true" />
                        <span>Remind for Today</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Submission history / Batches feed */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', textTransform: 'uppercase' }}>
                <Layers size={15} color="#6D28D9" aria-hidden="true" />
                <span>Submission History ({getProjectBatches(project).length})</span>
              </div>

              {getProjectBatches(project).length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  borderRadius: '8px',
                  background: '#FAF9F6',
                  border: '1.5px dashed #D1D5DB',
                  color: 'var(--ink-muted)',
                  fontSize: '0.84rem'
                }}>
                  No previous batches recorded yet. When the client submits today deliverables, they will be archived here automatically.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {getProjectBatches(project).map((batch) => {
                    const filesCount = batch.files?.length || 0;
                    const batchId = batch.id || batch.date;
                    return (
                      <div 
                        key={batchId}
                        className="pdv-file-entry"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: '32px', height: '32px',
                            borderRadius: '6px',
                            background: '#F5F3FF',
                            border: '1px solid #8B5CF6',
                            color: '#6D28D9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }} aria-hidden="true">
                            <Calendar size={15} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink)' }}>
                                {formatDateSlovak(batch.date)}
                              </strong>
                              <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                background: '#ECFDF5',
                                color: '#065F46',
                                border: '1px solid #10B981',
                                padding: '1px 6px',
                                borderRadius: '3px'
                              }}>
                                {filesCount} {filesCount === 1 ? 'FILE' : 'FILES'}
                              </span>
                            </div>
                            {batch.note && (
                              <p style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', marginTop: '2px', marginBottom: 0 }} className="truncate">
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
                                setCopiedBatchTextId(batchId);
                                addToast('Batch note copied to clipboard!', 'success', 'Copied');
                                setTimeout(() => setCopiedBatchTextId(null), 2000);
                              }}
                              className="pdv-btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                              title="Copy note"
                              aria-label={`Copy note for batch ${batch.date}`}
                            >
                              {copiedBatchTextId === batchId ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                              <span>{copiedBatchTextId === batchId ? 'Copied' : 'Copy Note'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleDownloadAll}
                            className="pdv-btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            title="Download assets"
                            aria-label={`Download assets for batch ${batch.date}`}
                          >
                            <Download size={11} aria-hidden="true" /> <span>Download</span>
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

        {/* ── 3-Column Bento Metrics ───────────────────────────── */}
        <div className="pdv-bento-grid">
          
          {/* Metric 1 — Delivered */}
          <div className="pdv-metric-card">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="pdv-metric-label">Delivered by Client</span>
                <CheckCircle2 size={18} color="#10B981" aria-hidden="true" />
              </div>
              <div className="pdv-metric-num" style={{ color: '#059669' }}>
                {completedCount} <span style={{ fontSize: '1.1rem', color: 'var(--ink-muted)', fontWeight: 700 }}>/ {totalCount}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', fontWeight: 600 }}>
                {hasRequiredItems && optionalTotalCount > 0
                  ? `${progressPercent}% required (${requiredCompletedCount}/${requiredTotalCount} req)`
                  : `${progressPercent}% fulfillment rate`}
              </div>
            </div>
            
            <div 
              className="pdv-progress-track"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progress of client deliverables: ${progressPercent}%`}
            >
              <div 
                className={`pdv-progress-fill ${isCompleted ? 'is-done' : ''}`}
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>

          {/* Metric 2 — Pending */}
          <div className="pdv-metric-card">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="pdv-metric-label">Pending Deliverables</span>
                <Clock size={18} color={missingCount > 0 ? '#D97706' : '#10B981'} aria-hidden="true" />
              </div>
              <div className="pdv-metric-num" style={{ color: missingCount > 0 ? '#D97706' : 'var(--ink)' }}>
                {missingCount}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', fontWeight: 600 }}>
                {missingCount === 0
                  ? 'All deliverables received!'
                  : (hasRequiredItems && missingRequiredCount === 0
                    ? 'All required met (optional open)'
                    : 'Awaiting client upload')}
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              {missingCount > 0 ? (
                <button 
                  onClick={() => openReminderModal(project.id)}
                  className="pdv-btn-secondary"
                  style={{ width: '100%', justifyContent: 'center', background: '#FFFBEB', borderColor: '#F59E0B', color: '#92400E', fontSize: '0.76rem' }}
                  aria-label="Send reminder to client for missing deliverables"
                >
                  <Send size={12} aria-hidden="true" /> <span>Send Reminder to Client</span>
                </button>
              ) : (
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: '#065F46',
                  background: '#ECFDF5',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #10B981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle2 size={14} aria-hidden="true" /> READY FOR PRODUCTION
                </div>
              )}
            </div>
          </div>

          {/* Metric 3 — Zero-Friction Info */}
          <div className="pdv-metric-card" style={{ background: '#FAF9F6' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={18} color="#18181B" aria-hidden="true" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 800, color: '#111827', textTransform: 'uppercase' }}>
                  Zero-Friction Collection
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', lineHeight: 1.5, margin: 0 }}>
                Files and copy are uploaded exclusively by your client via their link. Manage checklist requirements and download submitted ZIPs here.
              </p>
            </div>
            <div style={{
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: '#059669',
              fontWeight: 800
            }}>
              <Sparkles size={13} aria-hidden="true" /> NO CLIENT PASSWORDS NEEDED
            </div>
          </div>

        </div>

        {/* ── Checklist Items Ledger ──────────────────────────── */}
        <div>
          <div className="pdv-checklist-head">
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 2px 0', letterSpacing: '-0.02em' }}>
                Project Deliverables Checklist
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)', margin: 0 }}>
                Detailed inspector view of received assets and pending requirements.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Filter Tabs */}
              <div className="pdv-filter-tabs" role="group" aria-label="Filter checklist items">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`pdv-filter-tab ${activeFilter === 'all' ? 'is-active' : ''}`}
                  aria-pressed={activeFilter === 'all'}
                >
                  All • {totalCount}
                </button>
                <button
                  onClick={() => setActiveFilter('missing')}
                  className={`pdv-filter-tab ${activeFilter === 'missing' ? 'is-active' : ''}`}
                  aria-pressed={activeFilter === 'missing'}
                >
                  Missing • {missingCount}
                </button>
                <button
                  onClick={() => setActiveFilter('completed')}
                  className={`pdv-filter-tab ${activeFilter === 'completed' ? 'is-active' : ''}`}
                  aria-pressed={activeFilter === 'completed'}
                >
                  Delivered • {completedCount}
                </button>
              </div>

              <button
                id="btn-add-item-checklist"
                onClick={handleOpenAddItemModal}
                className="pdv-btn-primary"
                aria-label="Add new checklist requirement"
              >
                <Plus size={14} aria-hidden="true" />
                <span>Add Requirement</span>
              </button>
            </div>
          </div>

          {/* Items List */}
          {displayedItems.length === 0 ? (
            <div className="pdv-hero-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <CheckCircle2 size={38} color="#10B981" style={{ margin: '0 auto 10px' }} aria-hidden="true" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
                {activeFilter === 'missing' ? 'All items have been submitted! 🎉' : activeFilter === 'completed' ? 'No deliverables submitted yet.' : 'This project has no requirements yet.'}
              </h3>
              <p style={{ color: 'var(--ink-secondary)', fontSize: '0.86rem', maxWidth: '420px', margin: '0 auto 18px', lineHeight: 1.5 }}>
                {activeFilter === 'missing' 
                  ? 'The client has successfully submitted all requested deliverables.' 
                  : activeFilter === 'completed' 
                    ? 'Send the client a reminder or share their link so they can upload required files.' 
                    : 'Add your first requirement by clicking the button below.'}
              </p>
              {activeFilter === 'all' && (
                <button onClick={handleOpenAddItemModal} className="pdv-btn-primary" aria-label="Add first requirement">
                  <Plus size={14} aria-hidden="true" /> Add First Requirement
                </button>
              )}
            </div>
          ) : (
            <div className="pdv-items-list">
              {displayedItems.map((item, index) => {
                const isItemDone = item.isCompleted;
                const isFile = item.type === 'file';
                const fileList = Array.isArray(item.value?.files) 
                  ? item.value.files 
                  : (item.value?.fileName ? [item.value] : []);

                return (
                  <div 
                    key={item.id || index}
                    className={`pdv-item-card ${isItemDone ? 'is-done' : ''}`}
                  >
                    {/* Top Item Row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          {/* Status Icon Box */}
                          <div style={{
                            width: '32px', height: '32px',
                            borderRadius: '6px',
                            background: isItemDone ? '#10B981' : '#FEF3C7',
                            border: '1.5px solid #18181B',
                            boxShadow: '1.5px 1.5px 0px #18181B',
                            color: isItemDone ? '#FFFFFF' : '#92400E',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }} aria-hidden="true">
                            {isItemDone ? <Check size={17} strokeWidth={3} /> : <Clock size={16} />}
                          </div>

                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                            {item.title}
                          </h3>

                          {/* Badges */}
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '3px',
                            background: isFile ? '#EFF6FF' : '#F5F3FF',
                            color: isFile ? '#1D4ED8' : '#6D28D9',
                            border: isFile ? '1px solid #93C5FD' : '1px solid #DDD6FE',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {isFile ? <Upload size={10} aria-hidden="true" /> : <FileText size={10} aria-hidden="true" />}
                            {isFile ? 'FILE' : 'TEXT'}
                          </span>

                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background: item.required ? '#FEE2E2' : '#F3F4F6',
                            color: item.required ? '#991B1B' : '#6B7280',
                            border: item.required ? '1px solid #FECACA' : '1px solid #E5E7EB'
                          }}>
                            {item.required ? 'REQUIRED' : 'OPTIONAL'}
                          </span>

                          {item.purged || project.filesPurged ? (
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '3px',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Trash2 size={10} aria-hidden="true" /> PURGED (GDPR 30D)
                            </span>
                          ) : isItemDone ? (
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '3px',
                              background: '#ECFDF5',
                              color: '#065F46',
                              border: '1px solid #10B981',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Check size={10} aria-hidden="true" /> SUBMITTED
                            </span>
                          ) : (
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '3px',
                              background: '#FFFBEB',
                              color: '#92400E',
                              border: '1px solid #F59E0B',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Clock size={10} aria-hidden="true" /> PENDING
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)', marginLeft: '42px', marginBottom: '4px', marginTop: '4px', lineHeight: 1.5 }}>
                            {item.description}
                          </p>
                        )}

                        {isItemDone && item.completedAt && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-muted)', marginLeft: '42px', marginTop: '4px' }}>
                            SUBMITTED AT: <strong style={{ color: 'var(--ink)' }}>{new Date(item.completedAt).toLocaleString('en-US')}</strong>
                          </div>
                        )}
                      </div>

                      {/* Edit & Delete Buttons */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                        <button
                          id={`btn-edit-item-${item.id}`}
                          onClick={() => handleOpenEditItemModal(item)}
                          className="pdv-btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '0.74rem' }}
                          title="Edit title, instructions, or requirement type"
                          aria-label={`Edit requirement: ${item.title}`}
                        >
                          <Edit3 size={13} aria-hidden="true" />
                          <span>Edit</span>
                        </button>

                        <button
                          id={`btn-delete-item-${item.id}`}
                          onClick={() => handleDeleteItem(item)}
                          className="pdv-btn-secondary"
                          style={{ padding: '5px 8px', color: '#DC2626', borderColor: '#DC2626' }}
                          title="Delete requirement from project"
                          aria-label={`Delete requirement: ${item.title}`}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Submitted Content vs Missing Notice */}
                    {isItemDone ? (
                      <div className="pdv-item-content-box">
                        {isFile ? (
                          <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--ink-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                              Files Delivered by Client ({fileList.length}):
                            </div>

                            {fileList.length === 0 ? (
                              <div style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
                                File submitted: {item.value?.fileName || 'File'} ({item.value?.fileSize || 'N/A'})
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {fileList.map((f, fIdx) => {
                                  const isImg = isImageFile(f.fileName, f.fileType);
                                  return (
                                    <div key={f.id || fIdx} className="pdv-file-entry">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                        {isImg && f.url ? (
                                          <a href={f.url} target="_blank" rel="noreferrer" title="Open full size">
                                            <img 
                                              src={f.url} 
                                              alt={f.fileName || 'Preview of client upload'} 
                                              style={{
                                                width: '40px', height: '40px',
                                                objectFit: 'cover',
                                                borderRadius: '4px',
                                                border: '1.5px solid #18181B',
                                                flexShrink: 0
                                              }} 
                                            />
                                          </a>
                                        ) : (
                                          <div style={{
                                            width: '40px', height: '40px',
                                            borderRadius: '4px',
                                            background: '#FEF3C7',
                                            border: '1.5px solid #18181B',
                                            color: '#111827',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                          }} aria-hidden="true">
                                            {isImg ? <ImageIcon size={18} /> : <File size={18} />}
                                          </div>
                                        )}

                                        <div style={{ minWidth: 0 }}>
                                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--ink)' }} className="truncate">
                                            {f.fileName}
                                          </div>
                                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                                            {f.fileSize || 'Size unknown'} {f.uploadedAt ? `• ${f.uploadedAt}` : ''}
                                          </div>
                                        </div>
                                      </div>

                                      {project.filesPurged || f.purged ? (
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 800, color: '#DC2626', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF2F2', border: '1px solid #FECACA', padding: '4px 8px', borderRadius: '4px' }}>
                                          <Trash2 size={11} aria-hidden="true" /> PURGED (GDPR 30D)
                                        </span>
                                      ) : f.url ? (
                                        <a 
                                          href={f.url} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          download={f.fileName}
                                          className="pdv-btn-secondary"
                                          style={{ fontSize: '0.74rem', padding: '5px 12px' }}
                                          aria-label={`Download file ${f.fileName}`}
                                        >
                                          <Download size={12} aria-hidden="true" /> <span>Download</span>
                                        </a>
                                      ) : (
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
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
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--ink-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Text / Information Submitted by Client:
                              </span>
                              <button
                                onClick={() => {
                                  const textVal = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
                                  navigator.clipboard.writeText(textVal);
                                  addToast('Text copied to clipboard!', 'success', 'Copied');
                                }}
                                className="pdv-btn-secondary"
                                style={{ padding: '3px 10px', fontSize: '0.72rem' }}
                                aria-label={`Copy submitted text for ${item.title}`}
                              >
                                <Copy size={11} aria-hidden="true" /> <span>Copy text</span>
                              </button>
                            </div>
                            <div style={{
                              background: '#FFFFFF',
                              border: '1.5px solid #18181B',
                              borderRadius: '6px',
                              padding: '12px 14px',
                              fontSize: '0.88rem',
                              color: 'var(--ink)',
                              lineHeight: 1.6,
                              whiteSpace: 'pre-wrap'
                            }}>
                              {typeof item.value === 'string' ? item.value : JSON.stringify(item.value, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pdv-missing-notice">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0 }} aria-hidden="true" />
                          <div>
                            <strong style={{ fontSize: '0.85rem', color: '#92400E', display: 'block' }}>
                              Client has not submitted this deliverable yet.
                            </strong>
                            <span style={{ fontSize: '0.76rem', color: 'var(--ink-secondary)' }}>
                              Assets appear automatically here as soon as the client uploads them.
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => openReminderModal(project.id)}
                          className="pdv-btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.74rem' }}
                          aria-label={`Remind client for ${item.title}`}
                        >
                          <Send size={12} aria-hidden="true" /> <span>Remind Client</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Quick Footer Action Bar ───────────────────────────── */}
        <div className="pdv-action-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 700, color: 'var(--ink)' }}>
            <Sparkles size={16} color="#D97706" aria-hidden="true" />
            <span>Overall status: <strong>{completedCount} of {totalCount}</strong> requirements completed ({progressPercent}%)</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={openDashboard} 
              className="pdv-btn-secondary"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft size={13} aria-hidden="true" /> <span>Back to Dashboard</span>
            </button>
            
            <button
              onClick={handleOpenAddItemModal}
              className="pdv-btn-primary"
              aria-label="Add another requirement"
            >
              <Plus size={14} aria-hidden="true" /> <span>Add Another Requirement</span>
            </button>
          </div>
        </div>

        {/* ── Studio Telemetry Strip Footer ─────────────────────── */}
        <footer className="pdv-studio-footer" role="contentinfo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--orange)', fontWeight: 900 }}>⚡</span>
            <span>DROPBRIEF STUDIO INSPECTOR</span>
            <span style={{ opacity: 0.35 }} aria-hidden="true">•</span>
            <span>ZERO PASSWORDS &bull; REALTIME SYNC</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>ENCRYPTED AES-256</span>
            <span style={{ opacity: 0.35 }} aria-hidden="true">•</span>
            <span>IRELAND EU STORAGE</span>
            <span style={{ opacity: 0.35 }} aria-hidden="true">•</span>
            <span style={{ color: '#059669' }}>GDPR ART. 5 (30-DAY PURGE)</span>
          </div>
        </footer>

      </div>

      {/* ══════════════════════════════════════════════════════════
          MODAL: ADD NEW REQUIREMENT (ADD ITEM)
          ══════════════════════════════════════════════════════════ */}
      {isAddItemModalOpen && (
        <div 
          className="pdv-modal-overlay" 
          onClick={() => setIsAddItemModalOpen(false)}
        >
          <div 
            className="pdv-modal-window"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-item-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="pdv-modal-header">
              <div>
                <div className="pdv-modal-kicker">
                  <span>STAMP // ADD REQUIREMENT</span>
                </div>
                <h3 id="add-item-modal-title" className="pdv-modal-title">
                  Add Requirement to Docket
                </h3>
                <p className="pdv-modal-sub">
                  Specify deliverables the client needs to provide via their link.
                </p>
              </div>

              <button 
                onClick={() => setIsAddItemModalOpen(false)}
                className="pdv-modal-close"
                aria-label="Close dialog"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmitAddItem} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="pdv-modal-body">
                
                {/* Presets */}
                <div style={{ marginBottom: '18px' }}>
                  <label className="pdv-field-label">
                    Quick 1-Click Presets
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {QUICK_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        className="pdv-preset-pill"
                        aria-label={`Apply preset: ${p.title}`}
                      >
                        + {p.title.split('(')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="new-item-title-input" className="pdv-field-label">
                    Requirement Title *
                  </label>
                  <input
                    id="new-item-title-input"
                    type="text"
                    className="pdv-input"
                    placeholder="e.g. Vector logo (SVG, AI) or Website copy"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="new-item-desc-input" className="pdv-field-label">
                    Instructions &amp; Details for Client
                  </label>
                  <textarea
                    id="new-item-desc-input"
                    className="pdv-textarea"
                    rows={3}
                    placeholder="Explain what the client should submit (e.g. Transparent background SVG or high-resolution PNG)..."
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                  />
                </div>

                {/* Type and Required row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div>
                    <label htmlFor="new-item-type-select" className="pdv-field-label">
                      Deliverable Type
                    </label>
                    <select 
                      id="new-item-type-select"
                      className="pdv-select"
                      value={newItemType}
                      onChange={(e) => setNewItemType(e.target.value)}
                    >
                      <option value="file">📁 File (Photos, PDF, Logo, ZIP)</option>
                      <option value="text">📝 Text / Copy (Answers, credentials)</option>
                    </select>
                  </div>

                  <div>
                    <label className="pdv-field-label">
                      Requirement Status
                    </label>
                    <label className="pdv-checkbox-box">
                      <input 
                        type="checkbox"
                        checked={newItemRequired}
                        onChange={(e) => setNewItemRequired(e.target.checked)}
                        style={{ accentColor: '#18181B', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.84rem', color: '#111827', fontWeight: 700 }}>
                        Required item
                      </span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="pdv-modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsAddItemModalOpen(false)} 
                  className="pdv-btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="pdv-btn-primary"
                >
                  <Plus size={14} aria-hidden="true" /> <span>Add to Project</span>
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
          className="pdv-modal-overlay" 
          onClick={() => setIsEditItemModalOpen(false)}
        >
          <div 
            className="pdv-modal-window"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-item-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="pdv-modal-header">
              <div>
                <div className="pdv-modal-kicker">
                  <span>STAMP // EDIT REQUIREMENT</span>
                </div>
                <h3 id="edit-item-modal-title" className="pdv-modal-title">
                  Edit Requirement
                </h3>
                <p className="pdv-modal-sub">
                  Update requirement title, instructions, and client specifications.
                </p>
              </div>

              <button 
                onClick={() => setIsEditItemModalOpen(false)}
                className="pdv-modal-close"
                aria-label="Close dialog"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmitEditItem} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="pdv-modal-body">
                
                {/* Title */}
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="edit-item-title-input" className="pdv-field-label">
                    Requirement Title *
                  </label>
                  <input
                    id="edit-item-title-input"
                    type="text"
                    className="pdv-input"
                    value={editItemTitle}
                    onChange={(e) => setEditItemTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="edit-item-desc-input" className="pdv-field-label">
                    Instructions &amp; Details for Client
                  </label>
                  <textarea
                    id="edit-item-desc-input"
                    className="pdv-textarea"
                    rows={3}
                    value={editItemDesc}
                    onChange={(e) => setEditItemDesc(e.target.value)}
                  />
                </div>

                {/* Type and Required row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div>
                    <label htmlFor="edit-item-type-select" className="pdv-field-label">
                      Deliverable Type
                    </label>
                    <select 
                      id="edit-item-type-select"
                      className="pdv-select"
                      value={editItemType}
                      onChange={(e) => setEditItemType(e.target.value)}
                    >
                      <option value="file">📁 File</option>
                      <option value="text">📝 Text / Copy</option>
                    </select>
                  </div>

                  <div>
                    <label className="pdv-field-label">
                      Requirement Status
                    </label>
                    <label className="pdv-checkbox-box">
                      <input 
                        type="checkbox"
                        checked={editItemRequired}
                        onChange={(e) => setEditItemRequired(e.target.checked)}
                        style={{ accentColor: '#18181B', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.84rem', color: '#111827', fontWeight: 700 }}>
                        Required item
                      </span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="pdv-modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsEditItemModalOpen(false)} 
                  className="pdv-btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="pdv-btn-primary"
                >
                  <Check size={14} aria-hidden="true" /> <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}