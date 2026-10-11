import React from 'react';
import { useApp } from '../context/AppContext';
import { X, ShieldCheck, Lock, FileCheck, Server, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function LegalModal() {
  const { isLegalModalOpen, setIsLegalModalOpen } = useApp();

  if (!isLegalModalOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 120,
      padding: '20px'
    }}>
      <div 
        className="glass-panel animate-fade-in"
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
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
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
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
          >
            <X size={16} />
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
              Unlike open cloud drives where files linger for years, DropBrief marks and permanently removes uploaded files 30 days following project completion, strictly minimizing long-term data breach exposure.
            </p>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <strong style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.95rem' }}>
              <AlertTriangle size={17} /> 4. Terms of Service & Liability
            </strong>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              The software is provided on an "as-is" basis. DropBrief assumes no liability for the content of files uploaded by clients or unexpected third-party interruptions. Freelancers are advised to download completed asset packages to their local archives upon completion.
            </p>
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
