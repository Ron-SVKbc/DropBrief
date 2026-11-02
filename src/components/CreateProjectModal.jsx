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
  Users,
  ShieldAlert
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
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="auth-modal-card animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-modal-title"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 24px 50px -12px rgba(15, 23, 42, 0.18)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-hairline)',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: isLimitReached ? 'rgba(234, 88, 12, 0.1)' : 'var(--accent-primary-bg)',
              color: isLimitReached ? 'var(--accent-cta)' : 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {isLimitReached ? <ShieldAlert size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
            </div>
            <div>
              <h2 
                id="create-project-modal-title" 
                style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 800, 
                  color: 'var(--text-primary)', 
                  margin: 0,
                  letterSpacing: '-0.02em',
                  textWrap: 'balance'
                }}
              >
                {isLimitReached ? 'Project slot limit reached' : 'Create new asset collection'}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                {isLimitReached 
                  ? `${myActiveProjects.length} / ${maxProjects} active slots in use` 
                  : 'Choose a template or custom brief. A client link is generated with zero registration.'}
              </p>
            </div>
          </div>

          <button 
            id="btn-close-modal"
            onClick={onClose} 
            aria-label="Close project creation dialog"
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        {isLimitReached ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', overflowY: 'auto', flex: 1 }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(234, 88, 12, 0.1)',
              color: 'var(--accent-cta)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <ShieldAlert size={28} aria-hidden="true" />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                Active Slots Full
              </span>
              <span className="tabular-nums" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {myActiveProjects.length} / {maxProjects} slots
              </span>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Limit of {maxProjects} Active Project Slots Reached
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.55 }}>
              Share your personal invite link with another designer: <strong>you get +2 extra project slots</strong> and <strong>+50&nbsp;MB storage</strong> for each designer who joins!
            </p>

            {/* Referral Link & Copy Card */}
            <div style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px',
              maxWidth: '520px',
              margin: '0 auto 20px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Your Invite Link
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: referralCount > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
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
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    padding: '8px 12px',
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  id="btn-copy-invite-modal"
                  onClick={handleCopyInviteLink}
                  className="btn btn-primary btn-pill"
                  style={{ whiteSpace: 'nowrap', gap: '5px', padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  {copiedInvite ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  <span>{copiedInvite ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                marginTop: '14px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-hairline)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Gift size={14} color="var(--accent-cta)" aria-hidden="true" />
                  <span><strong>+2 Project Slots</strong> per designer</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} color="var(--accent-primary)" aria-hidden="true" />
                  <span><strong>+50 MB Storage</strong> per designer</span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              Tip: Marking any finished commission as <strong>completed</strong> in your dashboard immediately frees up an active project slot.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary btn-pill"
                style={{ padding: '8px 20px' }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '22px 24px', flex: 1 }}>

            {/* Step 1: Template Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                1. Choose Industry Template
              </label>
              <div 
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }} 
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
                      style={{
                        padding: '12px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--accent-primary-bg)' : '#ffffff',
                        border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'inherit',
                        font: 'inherit'
                      }}
                    >
                      <IconComponent 
                        size={20} 
                        color={isSelected ? 'var(--accent-primary)' : 'var(--text-tertiary)'} 
                        aria-hidden="true" 
                        style={{ marginBottom: '6px' }} 
                      />
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)', marginBottom: '4px' }}>
                        {tpl.name}
                      </div>
                      <span 
                        style={{ 
                          fontSize: '0.66rem', 
                          padding: '1px 7px', 
                          borderRadius: 'var(--radius-full)', 
                          background: isSelected ? '#ffffff' : 'var(--bg-base)', 
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                          border: '1px solid var(--border-hairline)',
                          fontWeight: 600
                        }}
                      >
                        {tpl.id === 'social-media' ? 'Ongoing' : tpl.id === 'custom' ? 'Custom' : 'One-off'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Project Type (One-off vs Ongoing) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                2. Engagement Type
              </label>
              <div 
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }} 
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
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: projectType === 'one-off' ? 'var(--accent-primary-bg)' : '#ffffff',
                    border: projectType === 'one-off' ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'left',
                    color: 'inherit',
                    font: 'inherit'
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: projectType === 'one-off' ? '#ffffff' : 'var(--bg-base)',
                    color: projectType === 'one-off' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Zap size={16} aria-hidden="true" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: projectType === 'one-off' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                      One-off Project
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      Single delivery (websites, branding)
                    </div>
                  </div>
                  {projectType === 'one-off' && <Check size={15} color="var(--accent-primary)" aria-hidden="true" />}
                </button>

                {/* Ongoing */}
                <button 
                  id="btn-select-ongoing"
                  type="button"
                  role="radio"
                  aria-checked={projectType === 'ongoing'}
                  onClick={() => setProjectType('ongoing')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: projectType === 'ongoing' ? 'rgba(124, 58, 237, 0.08)' : '#ffffff',
                    border: projectType === 'ongoing' ? '1.5px solid var(--accent-violet)' : '1px solid var(--border-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'left',
                    color: 'inherit',
                    font: 'inherit'
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: projectType === 'ongoing' ? '#ffffff' : 'var(--bg-base)',
                    color: projectType === 'ongoing' ? 'var(--accent-violet)' : 'var(--text-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <RefreshCw size={16} aria-hidden="true" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: projectType === 'ongoing' ? 'var(--accent-violet)' : 'var(--text-primary)' }}>
                      Ongoing Retainer
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      Recurring asset delivery
                    </div>
                  </div>
                  {projectType === 'ongoing' && <Check size={15} color="var(--accent-violet)" aria-hidden="true" />}
                </button>
              </div>

              {/* Cadence picker for recurring projects */}
              {projectType === 'ongoing' && (
                <div style={{
                  marginTop: '12px',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(124, 58, 237, 0.04)',
                  border: '1px solid rgba(124, 58, 237, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Calendar size={14} color="var(--accent-violet)" aria-hidden="true" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Recurring frequency: portal resets every:
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    {[
                      { days: 1, label: '1 day (Daily)' },
                      { days: 2, label: '2 days' },
                      { days: 7, label: '7 days (Weekly)' },
                      { days: 30, label: '30 days (Monthly)' }
                    ].map((opt) => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setCadenceDays(opt.days)}
                        className="badge"
                        style={{
                          padding: '5px 10px',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          background: cadenceDays === opt.days ? 'var(--accent-violet)' : '#ffffff',
                          color: cadenceDays === opt.days ? '#ffffff' : 'var(--text-secondary)',
                          border: '1px solid var(--border-medium)'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Basic Info */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                3. Project &amp; Client Details
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                
                <div style={{ gridColumn: selectedTemplateId === 'custom' ? '1 / -1' : 'auto' }}>
                  <label htmlFor="input-project-title" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Project Title *
                  </label>
                  <input
                    id="input-project-title"
                    type="text"
                    className="input"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Acme Website Redesign…"
                    autoFocus={selectedTemplateId === 'custom'}
                  />
                </div>

                <div>
                  <label htmlFor="input-client-name" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Client Name *
                  </label>
                  <input
                    id="input-client-name"
                    type="text"
                    className="input"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Peter Novak…"
                  />
                </div>

                <div>
                  <label htmlFor="input-client-email" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Client Email (for reminders)
                  </label>
                  <input
                    id="input-client-email"
                    type="email"
                    className="input"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@company.com…"
                  />
                </div>

                <div>
                  <label htmlFor="input-project-deadline" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Target Delivery Deadline
                  </label>
                  <input
                    id="input-project-deadline"
                    type="date"
                    className="input"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

              </div>
            </div>

            {/* Reminder Config */}
            <div style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BellRing size={15} color="var(--warning)" aria-hidden="true" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Automated email follow-up:
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Send every:</span>
                <select
                  id="select-reminder-frequency"
                  className="select"
                  style={{ width: 'auto', padding: '4px 28px 4px 10px', fontSize: '0.8rem' }}
                  value={reminderFrequency}
                  onChange={(e) => setReminderFrequency(e.target.value)}
                >
                  <option value="2">2 days</option>
                  <option value="3">3 days (Recommended)</option>
                  <option value="5">5 days</option>
                  <option value="7">7 days (Weekly)</option>
                </select>
              </div>
            </div>

            {/* Step 4: Checklist Items */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  4. Checklist Items ({items.length})
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    type="button" 
                    onClick={() => handleAddItem('file')} 
                    className="btn btn-secondary btn-sm btn-pill"
                    style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                  >
                    <Upload size={12} aria-hidden="true" />
                    <span>+ File</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleAddItem('text')} 
                    className="btn btn-secondary btn-sm btn-pill"
                    style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                  >
                    <FileText size={12} aria-hidden="true" />
                    <span>+ Text</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div style={{ color: item.type === 'file' ? 'var(--accent-primary)' : 'var(--warning)', flexShrink: 0 }}>
                      {item.type === 'file' ? <Upload size={16} aria-hidden="true" /> : <FileText size={16} aria-hidden="true" />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                        type="text"
                        className="input"
                        style={{ padding: '6px 10px', fontSize: '0.84rem', marginBottom: '3px' }}
                        value={item.title}
                        onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)}
                        placeholder="Item title…"
                      />
                      <input
                        type="text"
                        className="input"
                        placeholder="Instructions for client…"
                        style={{ padding: '4px 10px', fontSize: '0.76rem', background: 'transparent', borderColor: 'transparent' }}
                        value={item.description || ''}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      aria-label={`Remove requirement ${item.title || idx + 1}`}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      title="Remove item"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-hairline)'
            }}>
              <button 
                type="button" 
                onClick={onClose} 
                className="btn btn-secondary btn-pill"
                style={{ padding: '8px 18px', fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button 
                id="btn-submit-create-project"
                type="submit" 
                className="btn btn-primary btn-pill"
                style={{
                  gap: '6px',
                  padding: '8px 20px',
                  fontSize: '0.84rem'
                }}
              >
                <Check size={15} aria-hidden="true" />
                <span>Create &amp; Get Link</span>
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
