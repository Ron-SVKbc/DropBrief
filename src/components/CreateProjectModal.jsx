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
  BellRing
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

    const created = createProject({
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
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div 
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0e1320',
          border: '1px solid var(--border-active)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Vytvoriť nový zber podkladov
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Vyberte šablónu a systém pripraví bezpečný odkaz pre vášho klienta.
            </p>
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
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          
          {/* Step 1: Template Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
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
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-glass)',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      textAlign: 'center'
                    }}
                  >
                    <IconComponent size={20} color={isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'} style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {tpl.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
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
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
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
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
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
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
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
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <BellRing size={16} color="var(--warning)" />
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                Automatický e-mailový robot (Zero-effort)
              </strong>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Ak klient podklady neodošle, systém mu automaticky pošle priateľskú pripomienku s odkazom na dohranie.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pripomenúť každé:</span>
              <select
                id="select-reminder-frequency"
                className="select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                2. Položky checklistu ({items.length})
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => handleAddItem('file')} 
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                >
                  <Upload size={13} /> + Súbor
                </button>
                <button 
                  type="button" 
                  onClick={() => handleAddItem('text')} 
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
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
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ color: item.type === 'file' ? 'var(--accent-primary)' : 'var(--warning)', flexShrink: 0 }}>
                    {item.type === 'file' ? <Upload size={16} /> : <FileText size={16} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      className="input"
                      style={{ padding: '6px 10px', fontSize: '0.85rem', marginBottom: '4px' }}
                      value={item.title}
                      onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Inštrukcia pre klienta..."
                      style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'transparent', borderColor: 'transparent' }}
                      value={item.description || ''}
                      onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    title="Odstrániť položku"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Zrušiť
            </button>
            <button 
              id="btn-submit-create-project"
              type="submit" 
              className="btn btn-primary"
            >
              <Check size={16} /> Vytvoriť a získať odkaz
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
