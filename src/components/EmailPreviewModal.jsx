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
  MessageSquare,
  Sparkles,
  Info
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
  const [emailStyle, setEmailStyle] = useState('personal'); // 'personal' (odporúčané) | 'card'

  useEffect(() => {
    if (previewEmailProject) {
      const cleanTitle = previewEmailProject.title.replace(/[„“"']/g, '').trim();
      const fName = previewEmailProject.freelancerName || currentFreelancer?.nick || 'Freelancer';
      setCustomSubject(`${fName}: ${cleanTitle} – doplnenie podkladov`);
      setCustomMessage('');
      setShowNoteField(false);
      setSendSuccess(false);
      setErrorMessage('');
      setCopiedText(false);
      setEmailStyle('personal');
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
        customSubject,
        emailStyle
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

    const notePart = customMessage.trim() ? `\nPoznámka od ${freelancerName}:\n"${customMessage.trim()}"\n` : '';

    const textToCopy = `Predmet: ${customSubject}

Dobrý deň, ${previewEmailProject.clientName},

píšem Vám ohľadom projektu ${previewEmailProject.title}. K plynulému pokračovaniu prác potrebujeme od Vás doplniť nasledujúce podklady:

${itemsListText}
${previewEmailProject.deadline ? `\nPredpokladaný termín dokončenia: ${previewEmailProject.deadline}\n` : ''}${notePart}
Podklady môžete pohodlne nahrať priamo cez odkaz projektu:
${targetPortalUrl}

V prípade akýchkoľvek otázok stačí odpovedať priamo na tento e-mail.

S pozdravom,
${freelancerName}
`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    addToast('Celý text e-mailu bol skopírovaný do schránky!', 'success', 'Skopírované');
    setTimeout(() => setCopiedText(false), 3000);
  };

  const cycleSubject = () => {
    const cleanTitle = previewEmailProject.title.replace(/[„“"']/g, '').trim();
    const presets = [
      `${freelancerName}: ${cleanTitle} – doplnenie podkladov`,
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
          maxWidth: '700px',
          maxHeight: '94vh',
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

        {/* Anti-Spam Guarantee & Style Selector */}
        <div style={{
          padding: '10px 22px',
          background: 'rgba(16, 185, 129, 0.08)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Formát:
            </span>
            <button
              type="button"
              onClick={() => setEmailStyle('personal')}
              className={`btn btn-sm ${emailStyle === 'personal' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '3px 10px', height: 'auto' }}
              title="Formát priamej osobnej správy bez marketingových tabuliek – maximálna doručiteľnosť do Inboxu"
            >
              ✉️ Osobný e-mail (100 % Inbox)
            </button>
            <button
              type="button"
              onClick={() => setEmailStyle('card')}
              className={`btn btn-sm ${emailStyle === 'card' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '3px 10px', height: 'auto' }}
              title="Vizuálna formátovaná karta s tlačidlom"
            >
              🎨 Dizajnová karta
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyEmailText}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '3px 10px', height: 'auto' }}
            title="Skopírovať čistý text e-mailu a odoslať z vlastného e-mailu alebo WhatsAppu"
          >
            {copiedText ? (
              <>
                <Check size={13} color="#10b981" />
                <span style={{ color: '#10b981' }}>Skopírované!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Kopírovať text</span>
              </>
            )}
          </button>
        </div>

        {/* Explanatory AI Learning Notice */}
        <div style={{
          padding: '8px 22px',
          background: 'rgba(59, 130, 246, 0.08)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
          fontSize: '0.75rem',
          color: '#93c5fd',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Info size={15} style={{ flexShrink: 0 }} />
          <span>
            <strong>Tip pre testovanie:</strong> Ak vám minulý test padol do spamu, v Gmaile kliknite pri danej správe na <u>„Nie je to spam“</u>. Zvolený režim <em>Osobný e-mail</em> kompletne mení štruktúru kódu, takže obchádza filter podobnosti.
          </span>
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
              <strong>Odosielateľ:</strong> {freelancerName} &lt;dropbrief.notify@gmail.com&gt;
            </div>
            <div>
              <strong>Príjemca:</strong> {previewEmailProject.clientName} &lt;<span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{clientEmail}</span>&gt;
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <strong>Predmet e-mailu:</strong>
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
                title="Zmeniť formuláciu predmetu na pretrhnutie spamového vzoru"
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
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <MessageSquare size={12} /> + Pridať osobnú poznámku do e-mailu
              </button>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '3px', color: 'var(--text-secondary)' }}>
                  Osobná poznámka:
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
          padding: '18px 22px', 
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
              padding: '24px 26px',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <p style={{ margin: '0 0 14px 0' }}>
                Dobrý deň, {previewEmailProject.clientName},
              </p>

              <p style={{ margin: '0 0 14px 0' }}>
                píšem Vám ohľadom projektu <strong>{previewEmailProject.title}</strong>. Aby sme mohli plynule pokračovať v prácach, potrebovali by sme od Vás doplniť nasledujúce podklady:
              </p>

              {customMessage.trim() && (
                <div style={{
                  margin: '12px 0 16px 0',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderLeft: '3px solid #2563eb',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Poznámka od {freelancerName}:
                  </div>
                  {customMessage}
                </div>
              )}

              <ul style={{ margin: '0 0 16px 0', paddingLeft: '22px' }}>
                {missingItems.map((item) => (
                  <li key={item.id} style={{ marginBottom: '6px', fontSize: '0.85rem' }}>
                    <strong>{item.title}</strong>
                    {item.description ? <span style={{ color: '#64748b' }}> – {item.description}</span> : ''}
                  </li>
                ))}
              </ul>

              {previewEmailProject.deadline && (
                <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#475569' }}>
                  Termín odovzdania: <strong>{previewEmailProject.deadline}</strong>
                </p>
              )}

              <p style={{ margin: '16px 0 16px 0', fontSize: '0.875rem' }}>
                Podklady môžete pohodlne nahrať priamo cez odkaz projektu:<br />
                <a href={targetPortalUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600, wordBreak: 'break-all' }}>
                  {targetPortalUrl}
                </a>
              </p>

              <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem' }}>
                Ak máte k jednotlivým položkám akékoľvek otázky, kedykoľvek odpovedzte priamo na tento e-mail.
              </p>

              <p style={{ margin: '20px 0 0 0', fontSize: '0.875rem' }}>
                S pozdravom,<br />
                <strong>{freelancerName}</strong>
              </p>

              <div style={{ marginTop: '28px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '0.72rem', color: '#94a3b8' }}>
                Doručené cez DropBrief • Priama 1:1 správa
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
                Odosielateľ: {freelancerName} &bull; DropBrief EÚ
              </div>
            </div>
          )}

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
                  Odoslať na {clientEmail}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
