import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Send, 
  Mail, 
  CheckCircle2, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Zap,
  Check
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
  const [customMessage, setCustomMessage] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);
  const [emailStyle, setEmailStyle] = useState('personal'); // 'personal' | 'card'

  useEffect(() => {
    if (previewEmailProject) {
      const cleanTitle = previewEmailProject.title.replace(/[„“"']/g, '').trim();
      const fName = previewEmailProject.freelancerName || currentFreelancer?.nick || 'Freelancer';
      setCustomSubject(`${fName}: ${cleanTitle} – potrebné podklady`);
      setCustomMessage('');
      setShowNoteField(false);
      setSendSuccess(false);
      setErrorMessage('');
      setEmailStyle('personal');
    }
  }, [previewEmailProject]);

  if (!previewEmailProject) return null;

  const missingItems = previewEmailProject.items.filter((i) => !i.isCompleted);
  const clientEmail = previewEmailProject.clientEmail;
  const freelancerName = previewEmailProject.freelancerName || currentFreelancer?.nick || 'Freelancer';
  const slug = previewEmailProject.slug || '';
  const currentOrigin = typeof window !== 'undefined' && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')
    ? window.location.origin
    : 'https://usedropbrief.xyz';
  const targetPortalUrl = `${currentOrigin}/?p=${slug}`;

  const handleSendReminder = async () => {
    setIsSending(true);
    setErrorMessage('');
    setSendSuccess(false);

    try {
      await sendActualReminder(previewEmailProject.id, {
        customMessage,
        customSubject,
        emailStyle
      });
      setSendSuccess(true);
    } catch (err) {
      console.error('Failed to send reminder via Resend:', err);
      setErrorMessage(err.message || 'Nepodarilo sa odoslať e-mail cez Resend.');
    } finally {
      setIsSending(false);
    }
  };

  const cycleSubject = () => {
    const cleanTitle = previewEmailProject.title.replace(/[„“"']/g, '').trim();
    const presets = [
      `${freelancerName}: ${cleanTitle} – potrebné podklady`,
      `Podklady k zákazke: ${cleanTitle}`,
      `Doplnenie materiálov pre projekt ${cleanTitle}`,
      `Prosba o podklady – ${cleanTitle} (${freelancerName})`
    ];
    const currentIndex = presets.indexOf(customSubject);
    const nextIndex = (currentIndex + 1) % presets.length;
    setCustomSubject(presets[nextIndex]);
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
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '16px'
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '700px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#090e1a',
          border: '1px solid var(--border-active)',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9), var(--accent-glow)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(99, 102, 241, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
            }}>
              <Zap size={18} color="#ffffff" />
            </div>
            <div>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'block' }}>
                Odoslanie pripomienky cez Resend
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Transakčné e-mailové API &bull; Vysoká doručiteľnosť do schránky klienta
              </span>
            </div>
          </div>

          <button 
            id="btn-close-email-modal"
            onClick={handleClose}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Resend Guarantee Banner */}
        <div style={{
          padding: '12px 24px',
          background: 'rgba(56, 189, 248, 0.08)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#7dd3fc' }}>
            <ShieldCheck size={16} color="#38bdf8" />
            <span><strong>Resend API aktívne:</strong> Oficiálne DKIM & SPF overenie &bull; 3 000 e-mailov/mesiac zadarmo</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Štýl:</span>
            <button
              type="button"
              onClick={() => setEmailStyle('personal')}
              className={`btn btn-sm btn-pill ${emailStyle === 'personal' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '3px 10px', height: 'auto' }}
            >
              ✉️ Osobný
            </button>
            <button
              type="button"
              onClick={() => setEmailStyle('card')}
              className={`btn btn-sm btn-pill ${emailStyle === 'card' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '3px 10px', height: 'auto' }}
            >
              🎨 Karta
            </button>
          </div>
        </div>

        {/* Email Controls */}
        <div style={{ 
          padding: '14px 24px', 
          borderBottom: '1px solid var(--border-subtle)', 
          fontSize: '0.825rem', 
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <strong>Odosielateľ:</strong> DropBrief (Resend API)
            </div>
            <div>
              <strong>Príjemca:</strong> {previewEmailProject.clientName} &lt;<span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{clientEmail}</span>&gt;
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <strong>Predmet správy:</strong>
              </label>
              <button
                type="button"
                onClick={cycleSubject}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={11} /> Zmeniť formuláciu
              </button>
            </div>
            <input 
              type="text"
              className="input"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '6px 12px' }}
            />
          </div>

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
                <MessageSquare size={13} /> + Pridať vlastnú poznámku k správe
              </button>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Osobná poznámka pre klienta:
                </label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Napr.: Ahoj Peter, prebehol som zadanie a chýba nám už len zopár detailov..."
                  style={{ fontSize: '0.825rem', resize: 'vertical' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Email Rendered Preview (Scrollable) */}
        <div style={{ 
          padding: '18px 24px', 
          overflowY: 'auto', 
          flex: 1, 
          background: 'rgba(0, 0, 0, 0.3)' 
        }}>
          
          {emailStyle === 'personal' ? (
            /* Direct Conversational Email Style */
            <div style={{ 
              background: '#ffffff', 
              color: '#1e293b', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid #e2e8f0',
              padding: '24px 26px',
              fontSize: '0.88rem',
              lineHeight: 1.6,
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              <p style={{ margin: '0 0 12px 0' }}>
                Dobrý deň, {previewEmailProject.clientName},
              </p>

              <p style={{ margin: '0 0 12px 0' }}>
                píšem Vám ohľadom projektu <strong>{previewEmailProject.title}</strong>. Aby sme mohli plynule pokračovať v prácach, potrebovali by sme od Vás doplniť nasledujúce podklady:
              </p>

              {customMessage.trim() && (
                <div style={{
                  margin: '12px 0 14px 0',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderLeft: '3px solid #2563eb',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Poznámka od {freelancerName}:
                  </div>
                  {customMessage}
                </div>
              )}

              <ul style={{ margin: '0 0 14px 0', paddingLeft: '20px' }}>
                {missingItems.map((item) => (
                  <li key={item.id} style={{ marginBottom: '5px', fontSize: '0.85rem' }}>
                    <strong>{item.title}</strong>
                    {item.description ? <span style={{ color: '#64748b' }}> – {item.description}</span> : ''}
                  </li>
                ))}
              </ul>

              {previewEmailProject.deadline && (
                <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: '#475569' }}>
                  Termín odovzdania: <strong>{previewEmailProject.deadline}</strong>
                </p>
              )}

              <p style={{ margin: '14px 0', fontSize: '0.88rem' }}>
                Podklady môžete pohodlne nahrať priamo cez odkaz projektu:<br />
                <a href={targetPortalUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600, wordBreak: 'break-all' }}>
                  {targetPortalUrl}
                </a>
              </p>

              <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem' }}>
                Ak máte k jednotlivým položkám akékoľvek otázky, kedykoľvek odpovedzte priamo na tento e-mail.
              </p>

              <p style={{ margin: '18px 0 0 0', fontSize: '0.88rem' }}>
                S pozdravom,<br />
                <strong>{freelancerName}</strong>
              </p>

              <div style={{ marginTop: '24px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#94a3b8' }}>
                Doručené cez DropBrief &bull; Resend Infrastructure
              </div>
            </div>
          ) : (
            /* Card Style */
            <div style={{ 
              background: '#ffffff', 
              color: '#1e293b', 
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '18px 24px', 
                borderBottom: '1px solid #f1f5f9',
                background: '#ffffff'
              }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  {freelancerName}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Projekt: <strong>{previewEmailProject.title}</strong>
                </div>
              </div>

              <div style={{ padding: '22px 24px' }}>
                <p style={{ fontSize: '0.9rem', color: '#1e293b', margin: '0 0 12px 0' }}>
                  Dobrý deň, {previewEmailProject.clientName},
                </p>
                <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  pre plynulé pokračovanie prác na projekte <strong>{previewEmailProject.title}</strong> potrebujeme doplniť nasledujúce podklady:
                </p>

                {customMessage.trim() && (
                  <div style={{
                    margin: '0 0 16px 0',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    borderLeft: '3px solid #4f46e5',
                    fontSize: '0.85rem'
                  }}>
                    {customMessage}
                  </div>
                )}

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '18px' }}>
                  {missingItems.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155', marginBottom: idx !== missingItems.length - 1 ? '8px' : '0' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4f46e5', flexShrink: 0 }}></div>
                      <span><strong>{item.title}</strong>{item.description ? ` (${item.description})` : ''}</span>
                    </div>
                  ))}
                </div>

                <div style={{ margin: '18px 0 12px' }}>
                  <div style={{ display: 'inline-block', background: '#4f46e5', color: '#ffffff', fontWeight: 700, fontSize: '0.9rem', padding: '10px 24px', borderRadius: 'var(--radius-md)' }}>
                    Nahrať podklady k projektu
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#64748b', wordBreak: 'break-all', marginTop: '12px' }}>
                  Priamy odkaz: <span style={{ color: '#4f46e5', textDecoration: 'underline' }}>{targetPortalUrl}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', background: '#f8fafc', padding: '12px 24px', fontSize: '0.75rem', color: '#94a3b8' }}>
                Odosielateľ: {freelancerName} &bull; DropBrief (Resend)
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {sendSuccess && (
            <div style={{
              marginTop: '16px',
              padding: '14px 18px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid var(--success-border)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.9rem'
            }}>
              <CheckCircle2 size={20} />
              <div>
                <strong>E-mail bol úspešne odoslaný cez Resend!</strong> Pripomienka odišla na adresu <u>{clientEmail}</u>.
              </div>
            </div>
          )}

          {errorMessage && (
            <div style={{
              marginTop: '16px',
              padding: '14px 18px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--danger-border)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              fontSize: '0.88rem'
            }}>
              <AlertCircle size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>Odoslanie zlyhalo:</strong> {errorMessage}
              </div>
            </div>
          )}

        </div>

        {/* Modal Action Footer */}
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid var(--border-subtle)', 
          background: 'rgba(7, 9, 14, 0.95)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <button 
            type="button"
            onClick={handleClose} 
            className="btn btn-secondary btn-sm btn-pill"
          >
            {sendSuccess ? 'Hotovo, zavrieť' : 'Zavrieť'}
          </button>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                handleClose();
                openClientPortal(previewEmailProject.slug);
              }}
              className="btn btn-secondary btn-sm btn-pill"
              title="Zobraziť portál tak, ako ho uvidí klient"
            >
              <ExternalLink size={14} />
              Otvoriť portál
            </button>

            <button
              id="btn-send-resend-reminder"
              type="button"
              onClick={handleSendReminder}
              disabled={isSending || sendSuccess}
              className="btn btn-primary btn-sm btn-pill"
              style={{
                boxShadow: sendSuccess ? 'none' : 'var(--accent-glow)',
                background: sendSuccess ? 'var(--success)' : undefined
              }}
            >
              {isSending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Odosielam cez Resend...
                </>
              ) : sendSuccess ? (
                <>
                  <Check size={15} />
                  Odoslané!
                </>
              ) : (
                <>
                  <Send size={15} />
                  Odoslať e-mail cez Resend
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
