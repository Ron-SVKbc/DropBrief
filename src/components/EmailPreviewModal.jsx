import React, { useState, useEffect } from 'react';
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
  Copy,
  Check,
  MessageSquare
} from 'lucide-react';

export default function EmailPreviewModal() {
  const { 
    previewEmailProject, 
    setPreviewEmailProject, 
    openClientPortal, 
    sendActualReminder,
    currentFreelancer,
    addToast
  } = useApp();

  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);

  useEffect(() => {
    if (previewEmailProject) {
      const cleanTitle = previewEmailProject.title.replace(/[„“"']/g, '').trim();
      setCustomSubject(`Podklady k projektu: ${cleanTitle}`);
      setCustomMessage('');
      setShowNoteField(false);
      setSendSuccess(false);
      setErrorMessage('');
      setCopiedText(false);
    }
  }, [previewEmailProject]);

  if (!previewEmailProject) return null;

  const missingItems = previewEmailProject.items.filter((i) => !i.isCompleted);
  const clientEmail = previewEmailProject.clientEmail;
  const freelancerName = previewEmailProject.freelancerName || currentFreelancer?.nick || 'Freelancer';
  const replyEmail = previewEmailProject.freelancerEmail || currentFreelancer?.email || 'dropbrief.notify@gmail.com';
  const slug = previewEmailProject.slug;
  const targetPortalUrl = `https://dropbrief.vercel.app/?p=${slug}`;

  const handleSendReminder = async () => {
    setIsSending(true);
    setErrorMessage('');
    setSendSuccess(false);

    try {
      await sendActualReminder(previewEmailProject.id, {
        customMessage,
        customSubject
      });
      setSendSuccess(true);
    } catch (err) {
      console.error('Failed to send reminder:', err);
      setErrorMessage(err.message || 'Nepodarilo sa odoslať e-mail cez Gmail SMTP.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyEmailText = () => {
    const itemsListText = missingItems.length > 0 
      ? missingItems.map((item, idx) => `  ${idx + 1}. ${item.title}${item.description ? ` (${item.description})` : ''}`).join('\n')
      : '  - Všetky požadované podklady k projektu';

    const notePart = customMessage.trim() ? `\nPoznámka od odosielateľa:\n"${customMessage.trim()}"\n` : '';

    const textToCopy = `Predmet: ${customSubject}

Dobrý deň, ${previewEmailProject.clientName},

pre úspešné pokračovanie prác na projekte ${previewEmailProject.title} by sme potrebovali doplniť nasledujúce podklady:

${itemsListText}
${previewEmailProject.deadline ? `\nPredpokladaný termín dokončenia: ${previewEmailProject.deadline}\n` : ''}${notePart}
Podklady môžete pohodlne nahrať priamo cez zabezpečený portál projektu:
${targetPortalUrl}

V prípade akýchkoľvek otázok stačí odpovedať na tento e-mail.

S pozdravom,
${freelancerName}
`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    addToast('Celý text e-mailu bol skopírovaný do schránky!', 'success', 'Skopírované');
    setTimeout(() => setCopiedText(false), 3000);
  };

  const handleClose = () => {
    setPreviewEmailProject(null);
    setSendSuccess(false);
    setErrorMessage('');
    setCopiedText(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
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
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0d1322',
          border: '1px solid var(--accent-primary)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
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
                Google SMTP • 100 % doručiteľnosť do Inboxu
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

        {/* Anti-Spam Guarantee Banner */}
        <div style={{
          padding: '10px 22px',
          background: 'rgba(16, 185, 129, 0.1)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#34d399' }}>
            <ShieldCheck size={16} />
            <span><strong>Anti-Spam Ochrana:</strong> Čisté HTTPS URL • Bez spamových spúšťačov • Overené cez Google SMTP</span>
          </div>

          <button
            type="button"
            onClick={handleCopyEmailText}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '4px 10px', height: 'auto' }}
            title="Skopírovať čistý text e-mailu a odoslať z vlastného e-mailového klienta alebo WhatsAppu"
          >
            {copiedText ? (
              <>
                <Check size={13} color="#10b981" />
                <span style={{ color: '#10b981' }}>Skopírované!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Kopírovať text e-mailu</span>
              </>
            )}
          </button>
        </div>

        {/* Email Metadata Controls */}
        <div style={{ 
          padding: '14px 22px', 
          borderBottom: '1px solid var(--border-subtle)', 
          fontSize: '0.8rem', 
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <strong>Odosielateľ:</strong> {freelancerName} (DropBrief)
            </div>
            <div>
              <strong>Príjemca:</strong> {previewEmailProject.clientName} &lt;<span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{clientEmail}</span>&gt;
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '3px', color: 'var(--text-secondary)' }}>
              <strong>Predmet e-mailu</strong> (optimalizovaný proti spamu):
            </label>
            <input 
              type="text"
              className="input-field"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              style={{ fontSize: '0.825rem', padding: '6px 10px' }}
            />
          </div>

          {/* Toggle optional note */}
          <div>
            {!showNoteField ? (
              <button 
                type="button"
                onClick={() => setShowNoteField(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <MessageSquare size={13} /> + Pridať osobnú poznámku pre klienta do e-mailu
              </button>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '3px', color: 'var(--text-secondary)' }}>
                  Osobná poznámka pre klienta:
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Napr.: Ahoj Peter, prebehol som zadanie a chýba nám už len zopár detailov..."
                  style={{ fontSize: '0.8rem', resize: 'vertical' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Email Rendered Preview (Scrollable) */}
        <div style={{ 
          padding: '20px 22px', 
          overflowY: 'auto', 
          flex: 1, 
          background: 'rgba(0, 0, 0, 0.25)' 
        }}>
          
          {/* Simulated Email Card (Inbox preview) */}
          <div style={{ 
            background: '#ffffff', 
            color: '#1e293b', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ 
              padding: '18px 22px 14px 22px', 
              borderBottom: '1px solid #f1f5f9',
              background: '#ffffff'
            }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                {freelancerName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                Zákazka: <strong>{previewEmailProject.title}</strong>
              </div>
            </div>

            <div style={{ padding: '20px 22px' }}>
              <p style={{ fontSize: '0.9rem', color: '#1e293b', margin: '0 0 12px 0' }}>
                Dobrý deň, {previewEmailProject.clientName},
              </p>
              
              <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                pre plynulé pokračovanie prác na projekte <strong>{previewEmailProject.title}</strong> potrebujeme doplniť nasledujúce podklady:
              </p>

              {customMessage.trim() && (
                <div style={{
                  margin: '0 0 16px 0',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderLeft: '3px solid #4f46e5',
                  borderRadius: '4px',
                  fontSize: '0.825rem',
                  color: '#334155'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>
                    Správa od {freelancerName}:
                  </div>
                  {customMessage}
                </div>
              )}

              {/* Items Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px' }}>
                {missingItems.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#334155', marginBottom: idx !== missingItems.length - 1 ? '6px' : '0' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4f46e5', flexShrink: 0 }}></div>
                    <span><strong>{item.title}</strong>{item.description ? ` (${item.description})` : ''}</span>
                  </div>
                ))}
              </div>

              {previewEmailProject.deadline && (
                <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '16px' }}>
                  <strong>Predpokladaný termín dokončenia:</strong> {previewEmailProject.deadline}
                </p>
              )}

              {/* Button in email */}
              <div style={{ margin: '18px 0 10px' }}>
                <div
                  style={{
                    display: 'inline-block',
                    background: '#4f46e5',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    padding: '10px 22px',
                    borderRadius: '6px',
                  }}
                >
                  Nahrať podklady k projektu
                </div>
              </div>

              {/* Transparent Direct Link */}
              <div style={{ fontSize: '0.75rem', color: '#64748b', wordBreak: 'break-all', marginTop: '10px' }}>
                Priamy odkaz: <span style={{ color: '#4f46e5', textDecoration: 'underline' }}>{targetPortalUrl}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', background: '#f8fafc', padding: '12px 22px', fontSize: '0.72rem', color: '#94a3b8' }}>
              <div>Odosielateľ: <strong>{freelancerName}</strong> • Doručené cez DropBrief (GDPR EÚ).</div>
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
                  Uistite sa, že v súbore <code>.env</code> na Verceli máte správne nastavené <code>GMAIL_USER</code> a 16-miestne heslo <code>GMAIL_APP_PASSWORD</code>.
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
