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
  User,
  Layers,
  Zap,
  RefreshCw,
  Info,
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
  const { createProject, openClientPortal, currentFreelancer, projects, addToast } = useApp();

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
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 60px rgba(15, 23, 42, 0.2)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 26px',
          borderBottom: '1px solid var(--border-hairline)',
          background: 'var(--bg-base)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: isLimitReached ? 'rgba(234, 88, 12, 0.12)' : 'var(--accent-gradient)',
              color: isLimitReached ? 'var(--accent-cta)' : '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isLimitReached ? 'none' : '0 0 15px rgba(99, 102, 241, 0.4)',
              border: isLimitReached ? '1px solid rgba(234, 88, 12, 0.25)' : 'none'
            }}>
              {isLimitReached ? <ShieldAlert size={20} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />}
            </div>
            <div>
              <h2 id="create-project-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isLimitReached ? 'Active Project Limit Reached' : 'Create New Asset Collection'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                {isLimitReached ? `${myActiveProjects.length} / ${maxProjects} active slots in use` : 'Choose a template or custom brief. Link is generated with zero registration for client.'}
              </p>
            </div>
          </div>

          <button 
            id="btn-close-modal"
            onClick={onClose} 
            aria-label="Close project creation modal"
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        {isLimitReached ? (
          <div style={{ padding: '36px 28px', textAlign: 'center', overflowY: 'auto', flex: 1 }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'rgba(234, 88, 12, 0.1)',
              color: 'var(--accent-cta)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
              border: '1px solid rgba(234, 88, 12, 0.25)',
              boxShadow: '0 8px 24px rgba(234, 88, 12, 0.12)'
            }}>
              <ShieldAlert size={34} aria-hidden="true" />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span className="badge" style={{
                background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
                color: '#c2410c',
                border: '1px solid #fdba74',
                fontWeight: 800,
                padding: '5px 14px',
                fontSize: '0.825rem'
              }}>
                Active Slots Full
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {myActiveProjects.length} / {maxProjects} slots used
              </span>
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.025em' }}>
              You've Reached Your Limit of {maxProjects} Active Project Slots
            </h3>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              You currently have <strong style={{ color: 'var(--text-primary)' }}>{myActiveProjects.length} active collections</strong> in your workspace. Share your personal invite link with a fellow web designer: <strong style={{ color: 'var(--accent-primary)' }}>you get +2 extra project slots</strong> and <strong style={{ color: 'var(--accent-primary)' }}>+50 MB storage</strong> for every designer who joins!
            </p>

            {/* Referral Link & 1-Click Copy Card */}
            <div style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '22px',
              maxWidth: '560px',
              margin: '0 auto 22px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
                  Your Personal Invite Link
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: referralCount > 0 ? 'var(--success)' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Users size={14} aria-hidden="true" />
                  Designers referred: {referralCount} (+{bonusSlots} bonus slots)
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  onClick={(e) => e.target.select()}
                  aria-label="Your personal invite link"
                  style={{
                    flex: '1 1 260px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    padding: '10px 14px',
                    background: '#ffffff',
                    border: '1px solid var(--border-subtle)',
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
                  style={{ whiteSpace: 'nowrap', gap: '6px', padding: '10px 18px', fontWeight: 700, boxShadow: 'var(--glow-accent)' }}
                >
                  {copiedInvite ? (
                    <>
                      <Check size={16} aria-hidden="true" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} aria-hidden="true" />
                      <span>Copy Invite Link</span>
                    </>
                  )}
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-hairline)',
                fontSize: '0.825rem',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Gift size={16} color="var(--accent-cta)" aria-hidden="true" />
                  <span><strong>+2 Project Slots</strong> per designer</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color="var(--accent-primary)" aria-hidden="true" />
                  <span><strong>+50 MB Storage</strong> per designer</span>
                </div>
              </div>
            </div>

            {/* Completion Tip */}
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 28px', lineHeight: 1.5 }}>
              💡 <strong>Alternative:</strong> Have you finished collecting assets for a client? Marking that project as <span style={{ color: 'var(--success)', fontWeight: 700 }}>completed</span> in your dashboard will immediately free up an active project slot.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary btn-pill"
                style={{ padding: '10px 24px', fontWeight: 600 }}
              >
                Back to Dashboard
              </button>
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="btn btn-primary btn-pill"
                style={{ padding: '10px 24px', gap: '8px', fontWeight: 700, boxShadow: 'var(--glow-accent)' }}
              >
                <Share2 size={16} aria-hidden="true" />
                <span>{copiedInvite ? 'Link Copied!' : 'Copy & Share Invite Link'}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '26px', flex: 1 }}>

            {/* Step 1: Template Selection */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
              1. Choose Industry Template
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }} role="radiogroup" aria-label="Template selection">
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
                      padding: '16px 12px',
                      borderRadius: 'var(--radius-lg)',
                      background: isSelected 
                        ? 'var(--accent-primary-bg)' 
                        : 'var(--bg-base)',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      boxShadow: isSelected ? '0 0 16px rgba(37, 99, 235, 0.15)' : 'none',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'inherit',
                      font: 'inherit'
                    }}
                  >
                    <IconComponent size={22} color={isSelected ? 'var(--accent-primary)' : 'var(--text-tertiary)'} aria-hidden="true" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)', marginBottom: '6px' }}>
                      {tpl.name}
                    </div>
                    {tpl.id === 'social-media' ? (
                      <span style={{ fontSize: '0.67rem', padding: '2px 8px', borderRadius: '12px', background: '#f3e8ff', color: '#7e22ce', border: '1px solid #e9d5ff', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <RefreshCw size={9} aria-hidden="true" /> Ongoing
                      </span>
                    ) : tpl.id === 'custom' ? (
                      <span style={{ fontSize: '0.67rem', padding: '2px 8px', borderRadius: '12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Sparkles size={9} aria-hidden="true" /> Custom
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.67rem', padding: '2px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Zap size={9} aria-hidden="true" /> One-off
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Project Type (One-off vs Ongoing) */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span>2. Engagement Type *</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }} role="radiogroup" aria-label="Engagement type">
              {/* Option 1: One-off */}
              <button 
                id="btn-select-one-off"
                type="button"
                role="radio"
                aria-checked={projectType === 'one-off'}
                onClick={() => setProjectType('one-off')}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  background: projectType === 'one-off' 
                    ? 'rgba(37, 99, 235, 0.08)' 
                    : 'var(--bg-base)',
                  border: projectType === 'one-off' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  boxShadow: projectType === 'one-off' ? '0 4px 14px rgba(37, 99, 235, 0.12)' : 'none',
                  transition: 'var(--transition)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  color: 'inherit',
                  font: 'inherit'
                }}
              >
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: projectType === 'one-off' ? 'rgba(37, 99, 235, 0.16)' : 'var(--bg-card)',
                  color: projectType === 'one-off' ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Zap size={18} aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: projectType === 'one-off' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    One-off Project
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Web design, branding, redesign, single delivery
                  </div>
                </div>
                {projectType === 'one-off' && <Check size={16} color="var(--accent-primary)" aria-hidden="true" />}
              </button>

              {/* Option 2: Ongoing */}
              <button 
                id="btn-select-ongoing"
                type="button"
                role="radio"
                aria-checked={projectType === 'ongoing'}
                onClick={() => setProjectType('ongoing')}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer',
                  background: projectType === 'ongoing' 
                    ? 'rgba(124, 58, 237, 0.08)' 
                    : 'var(--bg-base)',
                  border: projectType === 'ongoing' ? '2px solid var(--accent-violet)' : '1px solid var(--border-subtle)',
                  boxShadow: projectType === 'ongoing' ? '0 4px 14px rgba(124, 58, 237, 0.12)' : 'none',
                  transition: 'var(--transition)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  color: 'inherit',
                  font: 'inherit'
                }}
              >
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: projectType === 'ongoing' ? 'rgba(124, 58, 237, 0.16)' : 'var(--bg-card)',
                  color: projectType === 'ongoing' ? 'var(--accent-violet)' : 'var(--text-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <RefreshCw size={18} aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: projectType === 'ongoing' ? 'var(--accent-violet)' : 'var(--text-primary)' }}>
                    Ongoing / Retainer
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Social media, monthly management, recurring retainer
                  </div>
                </div>
                {projectType === 'ongoing' && <Check size={16} color="var(--accent-violet)" aria-hidden="true" />}
              </button>
            </div>

            {/* Cadence picker for recurring projects */}
            {projectType === 'ongoing' && (
              <div style={{
                marginTop: '14px',
                padding: '16px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.28)',
                animation: 'fadeIn 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f3e8ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={15} color="#c084fc" />
                    Recurring Deliverables Frequency *
                  </label>
                  <span style={{ fontSize: '0.73rem', color: '#c084fc', fontWeight: 700, background: 'rgba(168, 85, 247, 0.2)', padding: '2px 8px', borderRadius: '10px' }}>
                    1 permanent client link
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                  How often should the system request new assets from the client? The client has 1 link — every <strong>{cadenceDays === 1 ? '1 day (Daily)' : `${cadenceDays} days`}</strong> the portal automatically resets for a fresh batch (e.g. today's reels, stories, or weekly records).
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  {[
                    { days: 1, label: 'Every 1 day (Daily)' },
                    { days: 2, label: 'Every 2 days' },
                    { days: 3, label: 'Every 3 days' },
                    { days: 7, label: 'Every week (7 days)' },
                    { days: 30, label: 'Every month (30 days)' },
                  ].map((opt) => {
                    const isSel = cadenceDays === opt.days;
                    return (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setCadenceDays(opt.days)}
                        className="badge"
                        style={{
                          padding: '7px 13px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: isSel ? 'rgba(168, 85, 247, 0.28)' : 'rgba(255, 255, 255, 0.04)',
                          color: isSel ? '#fff' : 'var(--text-secondary)',
                          border: isSel ? '1px solid #c084fc' : '1px solid var(--border-subtle)',
                          boxShadow: isSel ? '0 0 12px rgba(168, 85, 247, 0.35)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSel && <Check size={12} color="#c084fc" style={{ marginRight: '5px' }} />}
                        {opt.label}
                      </button>
                    );
                  })}

                  {/* Custom day interval */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>or:</span>
                    <input 
                      type="number"
                      min="1"
                      max="365"
                      value={cadenceDays}
                      onChange={(e) => setCadenceDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="input"
                      style={{ width: '64px', padding: '4px 8px', fontSize: '0.78rem', textAlign: 'center' }}
                      title="Custom day interval"
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>days</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Basic Info */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
              3. Project & Client Details
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ gridColumn: selectedTemplateId === 'custom' ? '1 / -1' : 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {selectedTemplateId === 'custom' ? 'Project Title & Scope *' : 'Project / Commission Title *'}
                  </label>
                  {selectedTemplateId === 'custom' && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      Custom Scope
                    </span>
                  )}
                </div>
                <input
                  id="input-project-title"
                  type="text"
                  className="input"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={selectedTemplateId === 'custom' ? "e.g. SEO Audit, Video Editing, Monthly Consulting, Web Store Build..." : "e.g. E-Commerce Store Redesign"}
                  autoFocus={selectedTemplateId === 'custom'}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Client Full Name *
                </label>
                <input
                  id="input-client-name"
                  type="text"
                  className="input"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Martin Vance"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Client Email (for reminders)
                </label>
                <input
                  id="input-client-email"
                  type="email"
                  className="input"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@company.com"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
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

          {/* Automated Reminders Config */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid var(--warning-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '26px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <BellRing size={16} color="var(--warning)" />
              <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Automated Email Follow-up
              </strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
              If the client has pending items, the system can send polite automated reminders with a direct upload link.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Remind every:</span>
              <select
                id="select-reminder-frequency"
                className="select"
                style={{ width: 'auto', padding: '6px 14px', fontSize: '0.825rem' }}
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
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                4. Checklist Items ({items.length})
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => handleAddItem('file')} 
                  className="btn btn-secondary btn-sm btn-pill"
                  style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                >
                  <Upload size={13} /> + File
                </button>
                <button 
                  type="button" 
                  onClick={() => handleAddItem('text')} 
                  className="btn btn-secondary btn-sm btn-pill"
                  style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                >
                  <FileText size={13} /> + Text
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ color: item.type === 'file' ? 'var(--accent-primary)' : 'var(--warning)', flexShrink: 0 }}>
                    {item.type === 'file' ? <Upload size={17} /> : <FileText size={17} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      className="input"
                      style={{ padding: '7px 12px', fontSize: '0.875rem', marginBottom: '4px' }}
                      value={item.title}
                      onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Instructions for client..."
                      style={{ padding: '5px 12px', fontSize: '0.78rem', background: 'transparent', borderColor: 'transparent' }}
                      value={item.description || ''}
                      onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    aria-label={`Remove requirement ${item.title || idx + 1}`}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                    title="Remove item"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '32px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-pill">
              Cancel
            </button>
            <button 
              id="btn-submit-create-project"
              type="submit" 
              className="btn btn-primary btn-pill"
              style={{
                boxShadow: 'var(--accent-glow)',
                gap: '8px',
                padding: '10px 22px',
                fontWeight: 700
              }}
            >
              <Check size={16} aria-hidden="true" /> Create & Get Link
            </button>
          </div>

        </form>
        )}
      </div>
    </div>
  );
}
