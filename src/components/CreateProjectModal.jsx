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
  FileSpreadsheet, 
  Share2,
  Calendar,
  BellRing,
  User,
  Layers
} from 'lucide-react';

const ICONS_MAP = {
  Globe: Globe,
  Palette: Palette,
  FileSpreadsheet: FileSpreadsheet,
  Share2: Share2,
};

export default function CreateProjectModal({ isOpen, onClose }) {
  const { createProject, openClientPortal, currentFreelancer } = useApp();

  const [selectedTemplateId, setSelectedTemplateId] = useState('web-design');
  const [title, setTitle] = useState('Tvorba webstránky pre klienta');
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
    setTitle(`${tpl.name} pre klienta`);
    setItems(tpl.items.map((i) => ({ ...i })));
  };

  const handleAddItem = (type = 'file') => {
    setItems([
      ...items,
      {
        id: 'new-' + Date.now(),
        title: type === 'file' ? 'Nový požadovaný súbor' : 'Nový požadovaný text',
        description: 'Vysvetlite klientovi, čo presne potrebujete.',
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
      alert('Prosím zadajte meno klienta.');
      return;
    }

    createProject({
      title,
      clientName,
      clientEmail: clientEmail || `${clientName.toLowerCase().replace(/\s+/g, '')}@klient.sk`,
      freelancerName,
      deadline,
      reminderFrequency,
      items
    });

    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div 
        className="glass-panel animate-fade-in"
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
                Vytvoriť nový zber podkladov
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Vyberte šablónu a systém pripraví bezpečný odkaz pre vášho klienta.
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
          <div style={{ marginBottom: '26px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
              1. Vyberte šablónu odboru
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {PROJECT_TEMPLATES.map((tpl) => {
                const IconComponent = ICONS_MAP[tpl.icon] || Globe;
                const isSelected = selectedTemplateId === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    style={{
                      padding: '14px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.16)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      textAlign: 'center'
                    }}
                  >
                    <IconComponent size={22} color={isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'} style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '0.825rem', fontWeight: 700, color: isSelected ? '#fff' : 'var(--text-primary)' }}>
                      {tpl.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '26px' }}>
            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Názov zákazky / projektu *
              </label>
              <input
                id="input-project-title"
                type="text"
                className="input"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="napr. Redizajn e-shopu"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Meno a priezvisko klienta *
              </label>
              <input
                id="input-client-name"
                type="text"
                className="input"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="napr. Martin Horváth"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                E-mail klienta (pre pripomienky)
              </label>
              <input
                id="input-client-email"
                type="email"
                className="input"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="klient@firma.sk"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Požadovaný termín dodania podkladov
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

          {/* Step 3: Automated Reminders Config */}
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
                Automatický e-mailový robot (Resend API)
              </strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
              Ak klient podklady neodošle, systém mu automaticky pošle priateľskú pripomienku s priamym odkazom na dohranie.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Pripomenúť každé:</span>
              <select
                id="select-reminder-frequency"
                className="select"
                style={{ width: 'auto', padding: '6px 14px', fontSize: '0.825rem' }}
                value={reminderFrequency}
                onChange={(e) => setReminderFrequency(e.target.value)}
              >
                <option value="2">2 dni</option>
                <option value="3">3 dni (Odporúčané)</option>
                <option value="5">5 dní</option>
                <option value="7">7 dní (Týždenne)</option>
              </select>
            </div>
          </div>

          {/* Step 4: Checklist Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                2. Položky checklistu ({items.length})
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => handleAddItem('file')} 
                  className="btn btn-secondary btn-sm btn-pill"
                  style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                >
                  <Upload size={13} /> + Súbor
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
                      placeholder="Inštrukcia pre klienta..."
                      style={{ padding: '5px 12px', fontSize: '0.78rem', background: 'transparent', borderColor: 'transparent' }}
                      value={item.description || ''}
                      onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                    title="Odstrániť položku"
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
              Zrušiť
            </button>
            <button 
              id="btn-submit-create-project"
              type="submit" 
              className="btn btn-primary btn-pill"
            >
              <Check size={16} /> Vytvoriť a získať odkaz
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
