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
  Info
} from 'lucide-react';

const ICONS_MAP = {
  Globe: Globe,
  Palette: Palette,
  Share2: Share2,
  Sparkles: Sparkles,
};

export default function CreateProjectModal({ isOpen, onClose }) {
  const { createProject, openClientPortal, currentFreelancer } = useApp();

  const [selectedTemplateId, setSelectedTemplateId] = useState('web-design');
  const [projectType, setProjectType] = useState('one-off'); // 'one-off' | 'ongoing'
  const [title, setTitle] = useState('Website Design & Development for Client');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [freelancerName, setFreelancerName] = useState(() => currentFreelancer?.nick || 'Freelancer');
  const [deadline, setDeadline] = useState('2026-10-25');
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

  if (!isOpen) return null;

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplateId(tpl.id);
    if (tpl.id === 'custom') {
      setTitle('');
    } else {
      setTitle(`${tpl.name} for Client`);
    }
    setProjectType(tpl.projectType || 'one-off');
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
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0a0e19',
          border: '1px solid var(--border-active)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), var(--accent-glow)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 26px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(99, 102, 241, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
            }}>
              <Plus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Create New Asset Collection
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Choose a template or custom brief. Link is generated with zero registration for client.
              </p>
            </div>
          </div>

          <button 
            id="btn-close-modal"
            onClick={onClose} 
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '26px', flex: 1 }}>
          
          {/* Step 1: Template Selection */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
              1. Choose Industry Template
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {PROJECT_TEMPLATES.map((tpl) => {
                const IconComponent = ICONS_MAP[tpl.icon] || Globe;
                const isSelected = selectedTemplateId === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    id={`tpl-card-${tpl.id}`}
                    onClick={() => handleSelectTemplate(tpl)}
                    style={{
                      padding: '14px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.16)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <IconComponent size={22} color={isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'} style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-primary)', marginBottom: '4px' }}>
                      {tpl.name}
                    </div>
                    {tpl.id === 'social-media' ? (
                      <span style={{ fontSize: '0.67rem', padding: '2px 7px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <RefreshCw size={9} /> Ongoing
                      </span>
                    ) : tpl.id === 'custom' ? (
                      <span style={{ fontSize: '0.67rem', padding: '2px 7px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Sparkles size={9} /> Custom
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.67rem', padding: '2px 7px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Zap size={9} /> One-off
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Project Type (One-off vs Ongoing) */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span>2. Engagement Type *</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {/* Option 1: One-off */}
              <div 
                id="btn-select-one-off"
                onClick={() => setProjectType('one-off')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: projectType === 'one-off' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                  border: projectType === 'one-off' ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                  boxShadow: projectType === 'one-off' ? '0 0 16px rgba(56, 189, 248, 0.22)' : 'none',
                  transition: 'var(--transition)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '34px', height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: projectType === 'one-off' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                  color: projectType === 'one-off' ? '#38bdf8' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Zap size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: projectType === 'one-off' ? '#fff' : 'var(--text-primary)' }}>
                    One-off Project
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                    Web design, branding, redesign, single delivery
                  </div>
                </div>
                {projectType === 'one-off' && <Check size={16} color="#38bdf8" />}
              </div>

              {/* Option 2: Ongoing */}
              <div 
                id="btn-select-ongoing"
                onClick={() => setProjectType('ongoing')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: projectType === 'ongoing' ? 'rgba(168, 85, 247, 0.14)' : 'rgba(255, 255, 255, 0.02)',
                  border: projectType === 'ongoing' ? '2px solid #a855f7' : '1px solid var(--border-subtle)',
                  boxShadow: projectType === 'ongoing' ? '0 0 16px rgba(168, 85, 247, 0.22)' : 'none',
                  transition: 'var(--transition)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '34px', height: '34px',
                  borderRadius: 'var(--radius-sm)',
                  background: projectType === 'ongoing' ? 'rgba(168, 85, 247, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                  color: projectType === 'ongoing' ? '#c084fc' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <RefreshCw size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: projectType === 'ongoing' ? '#fff' : 'var(--text-primary)' }}>
                    Ongoing / Retainer
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                    Social media, monthly management, recurring retainer
                  </div>
                </div>
                {projectType === 'ongoing' && <Check size={16} color="#c084fc" />}
              </div>
            </div>
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
                Automated Email Follow-up (Resend API)
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
                    background: 'rgba(255, 255, 255, 0.025)',
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
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
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
            >
              <Check size={16} /> Create & Get Link
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
