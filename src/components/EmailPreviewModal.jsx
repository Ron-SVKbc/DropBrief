import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Send, 
  Mail, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function EmailPreviewModal() {
  const { 
    previewEmailProject, 
    setPreviewEmailProject, 
    openClientPortal, 
    sendActualReminder,
    currentFreelancer
  } = useApp();

  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!previewEmailProject) return null;

  const missingItems = previewEmailProject.items.filter((i) => !i.isCompleted);
  const clientEmail = previewEmailProject.clientEmail;
  const freelancerName = previewEmailProject.freelancerName || currentFreelancer?.nick || 'Freelancer';
  const replyEmail = previewEmailProject.freelancerEmail || currentFreelancer?.email || 'Váš e-mail';

  const handleSendReminder = async () => {
    setIsSending(true);
    setErrorMessage('');
    setSendSuccess(false);

    try {
      await sendActualReminder(previewEmailProject.id);
      setSendSuccess(true);
    } catch (err) {
      console.error('Failed to send reminder:', err);
      setErrorMessage(err.message || 'Nepodarilo sa odoslať e-mail cez Gmail SMTP.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setPreviewEmailProject(null);
    setSendSuccess(false);
    setErrorMessage('');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.78)',
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
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0d1322',
          border: '1px solid var(--accent-primary)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(99, 102, 241, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Mail size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>
                Odoslanie e-mailovej pripomienky
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Google SMTP • 100 % doručiteľnosť • Ochrana pred spamom
              </span>
            </div>
          </div>

          <button 
            id="btn-close-email-modal"
            onClick={handleClose}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '5px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Email Metadata Box */}
        <div style={{ 
          padding: '14px 22px', 
          borderBottom: '1px solid var(--border-subtle)', 
          fontSize: '0.8rem', 
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div><strong>Odosielateľ:</strong> {freelancerName} (cez overený Google SMTP)</div>
          <div><strong>Príjemca:</strong> {previewEmailProject.clientName} &lt;<span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{clientEmail}</span>&gt;</div>
          <div><strong>Odpovede prídu na (Reply-To):</strong> {replyEmail}</div>
          <div><strong>Predmet:</strong> Pripomienka: Podklady k zákazke - {previewEmailProject.title.replace(/[„“"']/g, '')}</div>
        </div>

        {/* Email Rendered Preview (Scrollable) */}
        <div style={{ 
          padding: '20px 22px', 
          overflowY: 'auto', 
          flex: 1, 
          background: 'rgba(0, 0, 0, 0.2)' 
        }}>
          
          {/* Simulated Email Card */}
          <div style={{ 
            background: '#ffffff', 
            color: '#1e293b', 
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {/* Top email mini-banner */}
            <div style={{ 
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', 
              padding: '14px 18px', 
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                DropBrief • Pripomienka
              </span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px' }}>
                {freelancerName}
              </span>
            </div>

            <div style={{ padding: '20px 18px' }}>
              <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: '12px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, margin: 0 }}>
                  Dobrý deň, {previewEmailProject.clientName},
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '4px', margin: '4px 0 0' }}>
                  pripomíname sa s dodaním podkladov pre projekt <strong>{previewEmailProject.title}</strong> od zadávateľa <strong>{freelancerName}</strong>.
                </p>
              </div>

              <p style={{ fontSize: '0.825rem', color: '#334155', marginBottom: '12px' }}>
                K úspešnému dokončeniu a spusteniu prác nám v zozname zostáva ešte <strong>{missingItems.length} položiek</strong>:
              </p>

              {/* Items Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '18px' }}>
                {missingItems.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#334155', marginBottom: idx !== missingItems.length - 1 ? '6px' : '0' }}>
                    <Clock size={13} color="#f59e0b" />
                    <span><strong>{item.title}</strong></span>
                  </div>
                ))}
              </div>

              {/* Button in email */}
              <div style={{ textAlign: 'center', margin: '18px 0 10px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#6366f1',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    padding: '11px 22px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
                  }}
                >
                  <ExternalLink size={14} /> Otvoriť klientsky portál & nahrať súbory
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px' }}>
                  Klient nahráva bez prihlasovania a hesiel.
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', background: '#f8fafc', padding: '12px 18px', fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
              Zabezpečený prenos dát • DropBrief EÚ (GDPR Compliant)
            </div>
          </div>

          {/* Feedback messages */}
          {sendSuccess && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid var(--success-border)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.875rem'
            }}>
              <CheckCircle2 size={18} />
              <div>
                <strong>E-mail bol úspešne odoslaný!</strong> Pripomienka odišla na adresu <u>{clientEmail}</u>.
              </div>
            </div>
          )}

          {errorMessage && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>Odoslanie zlyhalo:</strong> {errorMessage}
                <div style={{ marginTop: '6px', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Uistite sa, že v súbore <code>.env</code> máte správne nastavené <code>GMAIL_USER</code> a 16-miestne heslo <code>GMAIL_APP_PASSWORD</code>.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Action Footer */}
        <div style={{ 
          padding: '14px 22px', 
          borderTop: '1px solid var(--border-subtle)', 
          background: 'rgba(10, 13, 20, 0.95)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <button 
            type="button"
            onClick={handleClose} 
            className="btn btn-secondary btn-sm"
          >
            {sendSuccess ? 'Hotovo, zavrieť' : 'Zrušiť'}
          </button>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                handleClose();
                openClientPortal(previewEmailProject.slug);
              }}
              className="btn btn-secondary btn-sm"
              title="Zobraziť portál tak, ako ho uvidí klient"
            >
              <ExternalLink size={14} />
              Otvoriť portál klienta
            </button>

            <button
              id="btn-send-actual-reminder"
              type="button"
              onClick={handleSendReminder}
              disabled={isSending || sendSuccess}
              className="btn btn-primary btn-sm"
              style={{
                boxShadow: sendSuccess ? 'none' : 'var(--accent-glow)',
                background: sendSuccess ? 'var(--success)' : undefined
              }}
            >
              {isSending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Odosielam cez Gmail...
                </>
              ) : sendSuccess ? (
                <>
                  <CheckCircle2 size={15} />
                  Odoslané!
                </>
              ) : (
                <>
                  <Send size={15} />
                  Odoslať e-mail na {clientEmail}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
