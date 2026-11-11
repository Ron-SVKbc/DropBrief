import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PROJECT_TEMPLATES } from '../data/templates';
import { 
  X, 
  Plus, 
  Trash2, 
  Check, 
  FileText, 
  Upload, 
  Sparkles, 
  Globe, 
  Palette, 
  Share2,
  Calendar,
  BellRing,
  Zap,
  RefreshCw,
  Copy,
  Gift,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

const ICONS_MAP = {
  Globe: Globe,
  Palette: Palette,
  Share2: Share2,
  Sparkles: Sparkles,
};

export default function CreateProjectModal({ isOpen, onClose }) {
  const { createProject, currentFreelancer, projects, addToast } = useApp();

  const maxProjects = currentFreelancer?.max_projects || currentFreelancer?.maxProjects || 2;
  const myActiveProjects = (projects || []).filter((p) => {
    if (!currentFreelancer) return false;
    const isOwner = (p.freelancerId && p.freelancerId === currentFreelancer.id) ||
      (p.freelancerName && p.freelancerName.toLowerCase() === currentFreelancer.nick.toLowerCase()) ||
      (currentFreelancer.id === 'fl-demo-marko' && (p.id === 'proj-alfa' || p.id === 'proj-dental'));
    return isOwner && p.status !== 'completed';
  });

  const isLimitReached = Boolean(currentFreelancer && myActiveProjects.length >= maxProjects);

  const [copiedInvite, setCopiedInvite] = useState(false);
  const referralUrl = `https://usedropbrief.xyz/?ref=${encodeURIComponent(currentFreelancer?.nick || '')}`;
  const referralCount = currentFreelancer?.referral_count ?? currentFreelancer?.referralCount ?? 0;
  const bonusSlots = referralCount * 2;

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedInvite(true);
    addToast('Invite link copied to clipboard!', 'success', 'Referral');
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  // Inform the user with toast immediately when attempting to create a project with full slots
  useEffect(() => {
    if (isOpen && isLimitReached) {
      addToast(
        `You've reached your limit of ${maxProjects} active project slots. Share your invite link to get +2 extra project slots for every designer who joins!`,
        'warning',
        'Project Limit Reached'
      );
    }
  }, [isOpen, isLimitReached, maxProjects, addToast]);

  const [selectedTemplateId, setSelectedTemplateId] = useState('web-design');
  const [projectType, setProjectType] = useState('one-off'); // 'one-off' | 'ongoing'
  const [cadenceDays, setCadenceDays] = useState(1); // 1 = daily, 2, 7 = weekly, 30 = monthly
  const [title, setTitle] = useState('Website Design & Development for Client');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [freelancerName, setFreelancerName] = useState(() => currentFreelancer?.nick || 'Freelancer');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [reminderFrequency, setReminderFrequency] = useState(3);

  // Sync freelancer name if currentFreelancer changes
  useEffect(() => {
    if (currentFreelancer?.nick) {
      setFreelancerName(currentFreelancer.nick);
    }
  }, [currentFreelancer]);

  const [items, setItems] = useState(() => {
    return PROJECT_TEMPLATES[0].items.map((i) => ({ ...i }));
  });

  // Close modal on Escape key press (WCAG 2.1.2)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    if (tpl.id === 'custom') {
      setTitle('');
    } else {
      setTitle(`${tpl.name} for Client`);
    }
    setProjectType(tpl.projectType || 'one-off');
    if (tpl.cadenceDays) {
      setCadenceDays(tpl.cadenceDays);
    } else if (tpl.projectType === 'ongoing') {
      setCadenceDays(1);
    }
    setItems(tpl.items.map((i) => ({ ...i })));
  };

  const handleAddItem = (type = 'file') => {
    setItems([
      ...items,
      {
        id: 'new-' + Date.now(),
        title: type === 'file' ? 'New requested file' : 'New requested text/copy',
        description: 'Explain to the client what you need here.',
        type: type,
        required: true,
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLimitReached) {
      addToast(
        `You've reached your limit of ${maxProjects} active project slots. Share your invite link to get +2 extra project slots for every designer who joins!`,
        'warning',
        'Project Limit Reached'
      );
      return;
    }

    if (!clientName.trim()) {
      alert('Please enter client name.');
      return;
    }

    const finalTitle = title.trim() || (selectedTemplateId === 'custom' ? 'Custom Project' : 'New Project');

    createProject({
      title: finalTitle,
      clientName,
      clientEmail: clientEmail || `${clientName.toLowerCase().replace(/\s+/g, '')}@client.com`,
      freelancerName,
      deadline,
      reminderFrequency,
      projectType,
      cadenceDays: projectType === 'ongoing' ? Number(cadenceDays) || 1 : null,
      items
    });

    onClose();
  };

  return (
    <div 
      className="create-docket-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="create-docket-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-modal-title"
      >
        {/* Modal Header */}
        <div className="create-docket-header">
          <div>
            <div className="create-docket-kicker">
              {isLimitReached ? (
                <>
                  <ShieldAlert size={12} aria-hidden="true" />
                  <span>CAPACITY // SLOTS FULL</span>
                </>
              ) : (
                <>
                  <span>STAMP // DOCKET CREATION</span>
                </>
              )}
            </div>
            <h2 id="create-project-modal-title" className="create-docket-title">
              {isLimitReached ? 'Active Slot Limit Reached' : 'New Asset Docket'}
            </h2>
            <p className="create-docket-sub">
              {isLimitReached 
                ? `${myActiveProjects.length} / ${maxProjects} commission slots in active rotation` 
                : 'Configure brief specifications. Client uploads directly with zero friction and zero login.'}
            </p>
          </div>

          <button 
            id="btn-close-modal"
            onClick={onClose} 
            aria-label="Close project creation dialog"
            className="create-docket-close-btn"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        {isLimitReached ? (
          <div className="create-limit-wrap">
            <div className="create-limit-shield">
              <ShieldAlert size={30} aria-hidden="true" />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.74rem',
                fontWeight: 800,
                background: '#FEF3C7',
                border: '1.5px solid #18181B',
                boxShadow: '1.5px 1.5px 0px #18181B',
                color: '#92400E',
                padding: '3px 10px',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                Active Slots Full
              </span>
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.86rem',
                fontWeight: 800,
                color: '#111827'
              }}>
                {myActiveProjects.length} / {maxProjects} SLOTS
              </span>
            </div>

            <h3 style={{
              fontFamily: 'var(--font-display, "Cabinet Grotesk", sans-serif)',
              fontSize: '1.35rem',
              fontWeight: 900,
              color: '#111827',
              margin: '0 0 10px 0',
              textTransform: 'uppercase',
              letterSpacing: '-0.02em'
            }}>
              Limit of {maxProjects} Active Project Slots Reached
            </h3>

            <p style={{
              fontSize: '0.9rem',
              color: '#4B5563',
              maxWidth: '490px',
              margin: '0 auto 22px',
              lineHeight: 1.55
            }}>
              Share your personal invite link with fellow designers: <strong>you unlock +2 extra project slots</strong> and <strong>+50&nbsp;MB storage</strong> for each peer who starts using DropBrief!
            </p>

            {/* Referral Link & Copy Card */}
            <div className="create-referral-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Personal Referral Key
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: referralCount > 0 ? '#059669' : '#6B7280'
                }}>
                  Referred: {referralCount} (+{bonusSlots} bonus slots)
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  onClick={(e) => e.target.select()}
                  aria-label="Your personal referral link"
                  style={{
                    flex: '1 1 240px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.82rem',
                    padding: '9px 12px',
                    background: '#FFFFFF',
                    border: '1.5px solid #18181B',
                    borderRadius: '6px',
                    color: '#111827',
                    boxShadow: '1.5px 1.5px 0px #18181B',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  id="btn-copy-invite-modal"
                  onClick={handleCopyInviteLink}
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '9px 16px',
                    background: copiedInvite ? '#10B981' : '#F59E0B',
                    color: '#111827',
                    border: '1.5px solid #18181B',
                    borderRadius: '6px',
                    boxShadow: '2px 2px 0px #18181B',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.12s'
                  }}
                >
                  {copiedInvite ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  <span>{copiedInvite ? 'COPIED' : 'COPY LINK'}</span>
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1.5px dashed #D1D5DB',
                fontSize: '0.8rem',
                color: '#374151'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gift size={15} color="#D97706" aria-hidden="true" />
                  <span><strong>+2 Project Slots</strong> / peer</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={15} color="#4F46E5" aria-hidden="true" />
                  <span><strong>+50 MB Storage</strong> / peer</span>
                </div>
              </div>
            </div>

            <p style={{
              fontSize: '0.82rem',
              color: '#6B7280',
              maxWidth: '480px',
              margin: '0 auto 24px',
              lineHeight: 1.5
            }}>
              💡 <strong>Pro-Tip:</strong> Marking any finished commission as <strong>completed</strong> in your dashboard ledger immediately frees up an active project slot.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  padding: '10px 24px',
                  background: '#FFFFFF',
                  color: '#111827',
                  border: '2px solid #18181B',
                  borderRadius: '6px',
                  boxShadow: '3px 3px 0px #18181B',
                  cursor: 'pointer'
                }}
              >
                RETURN TO DASHBOARD
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="create-docket-body">

              {/* Step 1: Template Selection */}
              <div className="create-step-card">
                <div className="create-step-head">
                  <div>
                    <span className="create-step-tag">01 // TEMPLATE</span>
                    <span className="create-step-title">Choose Preset Scope</span>
                  </div>
                </div>

                <div 
                  className="create-tpl-grid"
                  role="radiogroup" 
                  aria-label="Template selection"
                >
                  {PROJECT_TEMPLATES.map((tpl) => {
                    const IconComponent = ICONS_MAP[tpl.icon] || Globe;
                    const isSelected = selectedTemplateId === tpl.id;

                    return (
                      <button
                        key={tpl.id}
                        id={`tpl-card-${tpl.id}`}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleSelectTemplate(tpl)}
                        className={`create-tpl-btn ${isSelected ? 'is-active' : ''}`}
                      >
                        <IconComponent 
                          size={22} 
                          color={isSelected ? '#18181B' : '#4B5563'} 
                          aria-hidden="true" 
                        />
                        <div className="create-tpl-name">
                          {tpl.name}
                        </div>
                        <span className="create-tpl-badge">
                          {tpl.id === 'social-media' ? 'Ongoing' : tpl.id === 'custom' ? 'Custom' : 'One-off'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Project Type (One-off vs Ongoing) */}
              <div className="create-step-card">
                <div className="create-step-head">
                  <div>
                    <span className="create-step-tag">02 // ENGAGEMENT</span>
                    <span className="create-step-title">Delivery Model</span>
                  </div>
                </div>

                <div 
                  className="create-type-grid"
                  role="radiogroup" 
                  aria-label="Engagement type"
                >
                  {/* One-off */}
                  <button 
                    id="btn-select-one-off"
                    type="button"
                    role="radio"
                    aria-checked={projectType === 'one-off'}
                    onClick={() => setProjectType('one-off')}
                    className={`create-type-btn ${projectType === 'one-off' ? 'is-active' : ''}`}
                  >
                    <div className="create-type-icon">
                      <Zap size={18} aria-hidden="true" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="create-type-title">
                        One-off Docket
                      </div>
                      <div className="create-type-desc">
                        Single delivery target (website, branding)
                      </div>
                    </div>
                    {projectType === 'one-off' && (
                      <Check size={18} color="#18181B" style={{ strokeWidth: 3 }} aria-hidden="true" />
                    )}
                  </button>

                  {/* Ongoing */}
                  <button 
                    id="btn-select-ongoing"
                    type="button"
                    role="radio"
                    aria-checked={projectType === 'ongoing'}
                    onClick={() => setProjectType('ongoing')}
                    className={`create-type-btn is-ongoing ${projectType === 'ongoing' ? 'is-active' : ''}`}
                  >
                    <div className="create-type-icon">
                      <RefreshCw size={18} aria-hidden="true" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="create-type-title">
                        Recurring Retainer
                      </div>
                      <div className="create-type-desc">
                        Cyclic deliveries (socials, reports)
                      </div>
                    </div>
                    {projectType === 'ongoing' && (
                      <Check size={18} color="#6D28D9" style={{ strokeWidth: 3 }} aria-hidden="true" />
                    )}
                  </button>
                </div>

                {/* Cadence picker for recurring projects */}
                {projectType === 'ongoing' && (
                  <div className="create-cadence-box">
                    <div className="create-cadence-label">
                      <Calendar size={15} color="#7C3AED" aria-hidden="true" />
                      <span>Cadence: Portal reset cycle:</span>
                    </div>

                    <div className="create-cadence-options">
                      {[
                        { days: 1, label: '1 DAY (DAILY)' },
                        { days: 2, label: '2 DAYS' },
                        { days: 7, label: '7 DAYS (WEEKLY)' },
                        { days: 30, label: '30 DAYS (MONTHLY)' }
                      ].map((opt) => (
                        <button
                          key={opt.days}
                          type="button"
                          onClick={() => setCadenceDays(opt.days)}
                          className={`create-cadence-pill ${cadenceDays === opt.days ? 'is-active' : ''}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Basic Info */}
              <div className="create-step-card">
                <div className="create-step-head">
                  <div>
                    <span className="create-step-tag">03 // PARAMETERS</span>
                    <span className="create-step-title">Docket Details</span>
                  </div>
                </div>
                
                <div className="create-fields-grid">
                  <div className="create-field-group full-width">
                    <label htmlFor="input-project-title" className="create-field-label">
                      <span>Project Title *</span>
                      <span style={{ color: '#9CA3AF', fontSize: '0.68rem' }}>Visible to client</span>
                    </label>
                    <input
                      id="input-project-title"
                      type="text"
                      className="create-text-input"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Acme Website Redesign & Assets…"
                      autoFocus={selectedTemplateId === 'custom'}
                    />
                  </div>

                  <div className="create-field-group">
                    <label htmlFor="input-client-name" className="create-field-label">
                      <span>Client Contact Name *</span>
                    </label>
                    <input
                      id="input-client-name"
                      type="text"
                      className="create-text-input"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Peter Novak"
                    />
                  </div>

                  <div className="create-field-group">
                    <label htmlFor="input-client-email" className="create-field-label">
                      <span>Client Email</span>
                    </label>
                    <input
                      id="input-client-email"
                      type="email"
                      className="create-text-input"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@company.com"
                    />
                  </div>

                  <div className="create-field-group">
                    <label htmlFor="input-project-deadline" className="create-field-label">
                      <span>Target Delivery Deadline</span>
                    </label>
                    <input
                      id="input-project-deadline"
                      type="date"
                      className="create-text-input"
                      style={{ fontFamily: 'var(--font-mono, monospace)' }}
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>

                  <div className="create-field-group">
                    <label htmlFor="select-reminder-frequency" className="create-field-label">
                      <span>Automated Follow-Up</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        id="select-reminder-frequency"
                        className="create-select-input"
                        style={{ width: '100%', height: '42px' }}
                        value={reminderFrequency}
                        onChange={(e) => setReminderFrequency(e.target.value)}
                      >
                        <option value="2">Every 2 days</option>
                        <option value="3">Every 3 days (Recommended)</option>
                        <option value="5">Every 5 days</option>
                        <option value="7">Every 7 days (Weekly)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Checklist Items */}
              <div className="create-step-card" style={{ marginBottom: 0 }}>
                <div className="create-specs-toolbar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="create-step-tag">04 // CHECKLIST</span>
                    <span className="create-step-title">Requirements</span>
                    <span className="create-specs-count">{items.length} ITEMS</span>
                  </div>

                  <div className="create-specs-actions">
                    <button 
                      type="button" 
                      onClick={() => handleAddItem('file')} 
                      className="create-specs-btn"
                    >
                      <Upload size={13} aria-hidden="true" />
                      <span>+ FILE SPEC</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleAddItem('text')} 
                      className="create-specs-btn"
                    >
                      <FileText size={13} aria-hidden="true" />
                      <span>+ TEXT SPEC</span>
                    </button>
                  </div>
                </div>

                <div className="create-spec-list">
                  {items.map((item, idx) => (
                    <div key={item.id || idx} className="create-spec-item">
                      <div className={`create-spec-type-tag ${item.type === 'file' ? 'type-file' : 'type-text'}`}>
                        {item.type === 'file' ? <Upload size={12} aria-hidden="true" /> : <FileText size={12} aria-hidden="true" />}
                        <span>{item.type === 'file' ? 'FILE' : 'TEXT'}</span>
                      </div>

                      <div className="create-spec-inputs">
                        <input
                          type="text"
                          className="create-spec-title-input"
                          value={item.title}
                          onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)}
                          placeholder="Requirement title (e.g. Vector Logo)…"
                        />
                        <input
                          type="text"
                          className="create-spec-desc-input"
                          placeholder="Client guidance (e.g. Upload SVG or transparent PNG)…"
                          value={item.description || ''}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        aria-label={`Remove requirement ${item.title || idx + 1}`}
                        className="create-spec-delete-btn"
                        title="Remove requirement"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="create-docket-footer">
              <div className="create-footer-note">
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10B981',
                  display: 'inline-block'
                }}></span>
                <span>ZERO-FRICTION CLIENT ACCESS (NO PASSWORDS)</span>
              </div>

              <div className="create-footer-btns">
                <button 
                  type="button" 
                  onClick={onClose} 
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    padding: '9px 18px',
                    background: '#FFFFFF',
                    color: '#111827',
                    border: '1.5px solid #18181B',
                    borderRadius: '6px',
                    boxShadow: '2px 2px 0px #18181B',
                    cursor: 'pointer',
                    transition: 'all 0.12s'
                  }}
                >
                  CANCEL
                </button>
                <button 
                  id="btn-submit-create-project"
                  type="submit" 
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    padding: '9px 22px',
                    background: '#F59E0B',
                    color: '#111827',
                    border: '2px solid #18181B',
                    borderRadius: '6px',
                    boxShadow: '3px 3px 0px #18181B',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.12s'
                  }}
                >
                  <Check size={16} aria-hidden="true" style={{ strokeWidth: 3 }} />
                  <span>CREATE DOCKET &amp; GET LINK</span>
                </button>
              </div>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}