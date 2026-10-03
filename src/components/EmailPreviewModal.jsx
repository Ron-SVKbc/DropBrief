import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Send, Mail, CheckCircle2, Clock, ExternalLink } from 'lucide-react';

export default function EmailPreviewModal() {
  const { previewEmailProject, setPreviewEmailProject, openClientPortal } = useApp();

  if (!previewEmailProject) return null;

  const missingItems = previewEmailProject.items.filter((i) => !i.isCompleted);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '20px'
    }}>
      <div 
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '620px',
          background: '#0d1322',
          border: '1px solid var(--accent-primary)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}
      >
        {/* Email Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(99, 102, 241, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} color="var(--accent-primary)" />
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Ukážka automatickej e-mailovej pripomienky
            </strong>
          </div>

          <button 
            id="btn-close-email-modal"
            onClick={() => setPreviewEmailProject(null)}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '5px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Email Metadata */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div><strong>Odosielateľ:</strong> DropBrief Bot &lt;reminders@dropbrief.sk&gt; (v mene {previewEmailProject.freelancerName})</div>
          <div><strong>Príjemca:</strong> {previewEmailProject.clientName} &lt;{previewEmailProject.clientEmail}&gt;</div>
          <div><strong>Predmet:</strong> ⏳ Pripomienka: Chýbajúce podklady k zákazke „{previewEmailProject.title}“</div>
        </div>

        {/* Email Rendered Body */}
        <div style={{ padding: '24px 20px', background: '#ffffff', color: '#1e293b', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
          <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: '14px', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 700, margin: 0 }}>
              Dobrý deň, {previewEmailProject.clientName},
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: '4px' }}>
              pripomíname sa s dodaním podkladov pre projekt <strong>{previewEmailProject.title}</strong> od zadávateľa <strong>{previewEmailProject.freelancerName}</strong>.
            </p>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '14px' }}>
            K úspešnému dokončeniu a spusteniu prác nám v zozname zostáva ešte <strong>{missingItems.length} položiek</strong>:
          </p>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
            {missingItems.map((item, idx) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#475569', marginBottom: idx !== missingItems.length - 1 ? '6px' : '0' }}>
                <Clock size={14} color="#f59e0b" />
                <span><strong>{item.title}</strong></span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', margin: '24px 0' }}>
            <button
              onClick={() => {
                setPreviewEmailProject(null);
                openClientPortal(previewEmailProject.slug);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#6366f1',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
              }}
            >
              <ExternalLink size={15} /> Otvoriť klientsky portál & nahrať súbory
            </button>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
              Nemusíte sa prihlasovať, stačí kliknúť a pretiahnuť súbory.
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
            Ďakujeme za spoluprácu • Zabezpečené cez DropBrief (Šifrované servery EÚ)
          </div>
        </div>

      </div>
    </div>
  );
}
