import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, ShieldCheck, Lock, FileCheck, Server, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';

export default function LegalModal() {
  const { isLegalModalOpen, setIsLegalModalOpen, currentFreelancer, openAccountModal } = useApp();

  // Close modal on Escape key press (WCAG 2.1.2)
  useEffect(() => {
    if (!isLegalModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsLegalModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLegalModalOpen, setIsLegalModalOpen]);

  if (!isLegalModalOpen) return null;

  return (
    <div 
      className="modal-overlay"
      style={{ zIndex: 120 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsLegalModalOpen(false);
      }}
    >
      <div 
        className="auth-modal-card animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        style={{
          width: '100%',
          maxWidth: '700px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#090e1a',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 26px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(16, 185, 129, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
              <ShieldCheck size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 id="legal-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Data Security, GDPR & Legal Privacy
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                How DropBrief protects users and secures cloud data in the European Union
              </span>
            </div>
          </div>

          <button 
            id="btn-close-legal-modal"
            onClick={() => setIsLegalModalOpen(false)}
            aria-label="Zatvoriť informácie o GDPR a bezpečnosti"
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '26px', overflowY: 'auto', flex: 1, fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <strong style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.95rem' }}>
              <Lock size={17} /> 1. Data Encryption & EU Hosting (GDPR)
            </strong>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
              All data in transit is encrypted using modern TLS 1.3 certificates. Files at rest are stored in certified data centers in the European Union (Frankfurt / Ireland) with AES-256 encryption. No data leaves EU territory.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '6px', fontSize: '0.95rem' }}>
              2. Data Processor Role (GDPR Compliance)
            </strong>
            <p style={{ lineHeight: 1.55, fontSize: '0.85rem' }}>
              Under the GDPR, DropBrief acts strictly as a <strong>Technical Data Processor</strong>. The Data Controller is the freelancer or agency creating the collection, who maintains lawful responsibility for requesting specific assets from their clients.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '6px', fontSize: '0.95rem' }}>
              3. Automated Storage Purge (30-day Retention)
            </strong>
            <p style={{ lineHeight: 1.55, fontSize: '0.85rem' }}>
              Unlike open cloud drives where client files linger indefinitely, DropBrief runs an automated daily cron job that permanently deletes all uploaded files from cloud storage 30 days following project completion (or immediately on-demand by the freelancer), strictly complying with GDPR Art. 5(1)(e) storage limitation.
            </p>
          </div>

          <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <strong style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.95rem' }}>
              <FileCheck size={17} /> 4. Email Processing & Zero-Marketing Guarantee
            </strong>
            <p style={{ lineHeight: 1.55, fontSize: '0.85rem' }}>
              DropBrief processes email addresses strictly for <strong>operational and transactional purposes</strong> (GDPR Art. 6(1)(b)):
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '6px', marginBottom: 0, fontSize: '0.825rem', lineHeight: 1.6 }}>
              <li><strong>Freelancer Emails:</strong> Used exclusively for account authentication, delivering access PIN codes, and secure account recovery.</li>
              <li><strong>Client Emails:</strong> Used solely by freelancers to transmit transactional reminders about pending deliverables for their specific project.</li>
              <li><strong>Zero Marketing & No SMS:</strong> We do not send marketing newsletters, advertisements, or SMS messages. Contact information is never sold or shared with commercial third parties.</li>
            </ul>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <strong style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.95rem' }}>
              <AlertTriangle size={17} /> 5. Terms of Service & Liability
            </strong>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              The software is provided on an "as-is" basis. DropBrief assumes no liability for the content of files uploaded by clients or unexpected third-party interruptions. Freelancers are advised to download completed asset packages to their local archives upon completion.
            </p>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <strong style={{ color: 'var(--danger-light)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.95rem' }}>
              <Trash2 size={17} /> 6. Right to Erasure & Account Deletion (GDPR Art. 17)
            </strong>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Every freelancer has the right to immediately and permanently delete their user account at any time. Upon deletion, DropBrief irrevocably purges all associated projects, client upload links, and uploaded assets from secure European cloud storage.
            </p>
            {currentFreelancer && (
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsLegalModalOpen(false);
                    openAccountModal();
                  }}
                  className="btn btn-outline-danger btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Trash2 size={13} />
                  Manage account & request data deletion
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '18px 26px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(7, 9, 14, 0.95)' }}>
          <button onClick={() => setIsLegalModalOpen(false)} className="btn btn-primary btn-sm btn-pill">
            Understood, close
          </button>
        </div>

      </div>
    </div>
  );
}
