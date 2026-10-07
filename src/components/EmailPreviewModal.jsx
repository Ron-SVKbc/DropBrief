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
  Zap
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
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '16px'
    }}>
      <div 
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0d1322',
          border: '1px solid var(--accent-primary)',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9)',
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
              background: 'linear-gradient(135deg, #000000 0%, #1e1e38 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Zap size={18} color="#38bdf8" />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>
                Odoslanie pripomienky cez Resend
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Transakčné e-mailové API • Vysoká doručiteľnosť do Inboxu
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

        {/* Resend Guarantee Banner */}
        <div style={{
          padding: '10px 22px',
          background: 'rgba(56, 189, 248, 0.08)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#7dd3fc' }}>
            <ShieldCheck size={16} color="#38bdf8" />
            <span><strong>Resend API aktívne:</strong> Oficiálne DKIM & SPF overenie • 3 000 e-mailov/mesiac zadarmo</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Formát:</span>
            <button
              type="button"
              onClick={() => setEmailStyle('personal')}
              className={`btn btn-sm ${emailStyle === 'personal' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '2px 8px', height: 'auto' }}
            >
              ✉️ Osobný
            </button>
            <button
              type="button"
              onClick={() => setEmailStyle('card')}
              className={`btn btn-sm ${emailStyle === 'card' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', padding: '2px 8px', height: 'auto' }}
            >
              🎨 Karta
            </button>
          </div>
        </div>

        {/* Email Controls */}
        <div style={{ 
          padding: '12px 22px', 
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
              <strong>Odosielateľ:</strong> DropBrief (Resend API)
            </div>
            <div>
              <strong>Príjemca:</strong> {previewEmailProject.clientName} &lt;<span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{clientEmail}</span>&gt;
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <strong>Predmet správy:</strong>
              </label>
              <button
                type="button"
                onClick={cycleSubject}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '0.72rem',
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
              className="input-field"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              style={{ fontSize: '0.825rem', padding: '5px 10px' }}
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
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <MessageSquare size={12} /> + Pridať vlastnú poznámku k správe
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
          padding: '16px 22px', 
          overflowY: 'auto', 
          flex: 1, 
          background: 'rgba(0, 0, 0, 0.25)' 
        }}>
          
          {emailStyle === 'personal' ? (
            /* Direct Conversational Email Style */
            <div style={{ 
              background: '#ffffff', 
              color: '#1e293b', 
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              padding: '22px 24px',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
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
                  fontSize: '0.825rem'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Poznámka od {freelancerName}:
                  </div>
                  {customMessage}
                </div>
              )}

              <ul style={{ margin: '0 0 14px 0', paddingLeft: '20px' }}>
                {missingItems.map((item) => (
                  <li key={item.id} style={{ marginBottom: '5px', fontSize: '0.825rem' }}>
                    <strong>{item.title}</strong>
                    {item.description ? <span style={{ color: '#64748b' }}> – {item.description}</span> : ''}
                  </li>
                ))}
              </ul>

              {previewEmailProject.deadline && (
                <p style={{ margin: '0 0 14px 0', fontSize: '0.825rem', color: '#475569' }}>
                  Termín odovzdania: <strong>{previewEmailProject.deadline}</strong>
                </p>
              )}

              <p style={{ margin: '14px 0', fontSize: '0.85rem' }}>
                Podklady môžete pohodlne nahrať priamo cez odkaz projektu:<br />
                <a href={targetPortalUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600, wordBreak: 'break-all' }}>
                  {targetPortalUrl}
                </a>
              </p>

              <p style={{ margin: '0 0 14px 0', fontSize: '0.825rem' }}>
                Ak máte k jednotlivým položkám akékoľvek otázky, kedykoľvek odpovedzte priamo na tento e-mail.
              </p>

              <p style={{ margin: '18px 0 0 0', fontSize: '0.85rem' }}>
                S pozdravom,<br />
                <strong>{freelancerName}</strong>
              </p>

              <div style={{ marginTop: '24px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '0.72rem', color: '#94a3b8' }}>
                Doručené cez DropBrief • Resend Infrastructure
              </div>
            </div>
          ) : (
            /* Card Style */
            <div style={{ 
              background: '#ffffff', 
              color: '#1e293b', 
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <div style={{ 
                padding: '16px 20px', 
                borderBottom: '1px solid #f1f5f9',
                background: '#ffffff'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  {freelancerName}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Projekt: <strong>{previewEmailProject.title}</strong>
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: '0 0 12px 0' }}>
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
                    fontSize: '0.825rem'
                  }}>
                    {customMessage}
                  </div>
                )}

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px' }}>
                  {missingItems.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#334155', marginBottom: idx !== missingItems.length - 1 ? '6px' : '0' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4f46e5', flexShrink: 0 }}></div>
                      <span><strong>{item.title}</strong>{item.description ? ` (${item.description})` : ''}</span>
                    </div>
                  ))}
                </div>

                <div style={{ margin: '16px 0 10px' }}>
                  <div style={{ display: 'inline-block', background: '#4f46e5', color: '#ffffff', fontWeight: 600, fontSize: '0.875rem', padding: '10px 22px', borderRadius: '6px' }}>
                    Nahrať podklady k projektu
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#64748b', wordBreak: 'break-all', marginTop: '10px' }}>
                  Priamy odkaz: <span style={{ color: '#4f46e5', textDecoration: 'underline' }}>{targetPortalUrl}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', background: '#f8fafc', padding: '10px 20px', fontSize: '0.72rem', color: '#94a3b8' }}>
                Odosielateľ: {freelancerName} &bull; DropBrief (Resend)
              </div>
            </div>
          )}

          {/* Feedback messages */}
          {sendSuccess && (
            <div style={{
              marginTop: '14px',
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
                <strong>E-mail bol úspešne odoslaný cez Resend!</strong> Pripomienka odišla na adresu <u>{clientEmail}</u>.
              </div>
            </div>
          )}

          {errorMessage && (
            <div style={{
              marginTop: '14px',
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
          gap: '10px'
        }}>
          <button 
            type="button"
            onClick={handleClose} 
            className="btn btn-secondary btn-sm"
          >
            {sendSuccess ? 'Hotovo, zavrieť' : 'Zavrieť'}
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
              Otvoriť portál
            </button>

            <button
              id="btn-send-resend-reminder"
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
                  Odosielam cez Resend...
                </>
              ) : sendSuccess ? (
                <>
                  <CheckCircle2 size={15} />
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
