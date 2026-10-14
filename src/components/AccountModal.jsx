import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  User, 
  KeyRound, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  Trash2, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  FolderSync, 
  FileCheck,
  Lock,
  ArrowLeft
} from 'lucide-react';

export default function AccountModal() {
  const { 
    isAccountModalOpen, 
    closeAccountModal, 
    currentFreelancer, 
    projects, 
    deleteFreelancerAccount,
    logoutFreelancer,
    setIsLegalModalOpen,
    addToast
  } = useApp();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [showMyPin, setShowMyPin] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset stavov pri otvorení alebo zatvorení modálu
  useEffect(() => {
    if (isAccountModalOpen) {
      setIsConfirmingDelete(false);
      setPinInput('');
      setErrorMessage('');
      setIsDeleting(false);
      setShowPinInput(false);
      setShowMyPin(false);
    }
  }, [isAccountModalOpen]);

  // Escape klávesa na zatvorenie
  useEffect(() => {
    if (!isAccountModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        closeAccountModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAccountModalOpen, isDeleting, closeAccountModal]);

  if (!isAccountModalOpen || !currentFreelancer) return null;

  // Štatistika projektov freelancera
  const myProjects = projects.filter((p) => {
    if (p.freelancerId && p.freelancerId === currentFreelancer.id) return true;
    if (p.freelancerName && p.freelancerName.toLowerCase() === currentFreelancer.nick.toLowerCase()) return true;
    if (currentFreelancer.id === 'fl-demo-marko' && (p.id === 'proj-alfa' || p.id === 'proj-dental')) return true;
    return false;
  });

  const totalFilesCount = myProjects.reduce((acc, p) => {
    const itemFiles = p.items ? p.items.filter((i) => i.isCompleted && i.value).length : 0;
    return acc + itemFiles;
  }, 0);

  const formattedDate = currentFreelancer.createdAt
    ? new Date(currentFreelancer.createdAt).toLocaleDateString('sk-SK', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Nedávno';

  const handleCopyPin = () => {
    if (!currentFreelancer.pin) return;
    navigator.clipboard.writeText(String(currentFreelancer.pin));
    setCopiedPin(true);
    addToast('PIN kód bol skopírovaný do schránky.', 'success', 'PIN Skopírovaný');
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPin = pinInput.trim();
    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      setErrorMessage('Zadajte váš 6-miestny numerický PIN kód.');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteFreelancerAccount(cleanPin);
      // Úspešné zmazanie vyvolá v AppContext zatvorenie modálu a odhlásenie
    } catch (err) {
      setIsDeleting(false);
      setErrorMessage(err.message || 'Nepodarilo sa zmazať účet. Skontrolujte PIN kód.');
    }
  };

  return (
    <div 
      className="modal-overlay animate-fade-in"
      onClick={() => {
        if (!isDeleting) closeAccountModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
    >
      <div 
        className="auth-modal-card animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: 'clamp(20px, 4vw, 32px)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow pozadie */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '180px',
          height: '180px',
          background: isConfirmingDelete ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
          filter: 'blur(50px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          transition: 'background 0.3s ease'
        }} />

        {/* ── Hlavička ──────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: isConfirmingDelete 
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: `1px solid ${isConfirmingDelete ? 'var(--danger-border)' : 'var(--border-accent)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isConfirmingDelete ? 'var(--danger)' : 'var(--accent-primary-light)',
              boxShadow: isConfirmingDelete ? 'var(--glow-red)' : 'var(--glow-accent)',
              transition: 'var(--transition)'
            }}>
              {isConfirmingDelete ? <AlertTriangle size={22} /> : <User size={22} />}
            </div>
            <div>
              <h2 id="account-modal-title" style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: 0
              }}>
                {isConfirmingDelete ? 'Zmazanie účtu & Dát' : 'Profil & Bezpečnosť'}
              </h2>
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--text-tertiary)',
                margin: '2px 0 0'
              }}>
                {isConfirmingDelete ? 'Potvrďte trvalé a nezvratné odstránenie' : 'Prehľad prihlásenia a správa údajov'}
              </p>
            </div>
          </div>

          <button
            onClick={closeAccountModal}
            disabled={isDeleting}
            aria-label="Zatvoriť nastavenia účtu"
            className="btn btn-secondary btn-icon btn-sm"
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Krok 1: Štandardný prehľad profilu ──────────────────────── */}
        {!isConfirmingDelete ? (
          <div style={{ position: 'relative', zIndex: 1 }}>
            
            {/* Box s detailmi účtu */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '20px'
            }}>
              
              {/* Riadok 1: Nick */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="var(--accent-primary-light)" />
                  Prezývka (Nick):
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentFreelancer.nick}
                </span>
              </div>

              {/* Riadok 2: E-mail */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} color="var(--accent-primary-light)" />
                  E-mailová adresa:
                </span>
                <span style={{ fontSize: '0.84rem', color: currentFreelancer.email ? 'var(--text-secondary)' : 'var(--text-quaternary)', fontFamily: currentFreelancer.email ? 'var(--font-mono)' : 'inherit' }}>
                  {currentFreelancer.email || 'Nenastavený'}
                </span>
              </div>

              {/* Riadok 3: Dátum registrácie */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="var(--accent-primary-light)" />
                  Vytvorený:
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {formattedDate}
                </span>
              </div>

              {/* Riadok 4: PIN kód (ak je dostupný) */}
              {currentFreelancer.pin && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <KeyRound size={14} color="var(--accent-primary-light)" />
                    Bezpečnostný PIN:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      letterSpacing: showMyPin ? '0.12em' : '0.2em',
                      color: 'var(--text-primary)',
                      background: 'rgba(99, 102, 241, 0.1)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-accent)'
                    }}>
                      {showMyPin ? currentFreelancer.pin : '••••••'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowMyPin(!showMyPin)}
                      aria-label={showMyPin ? 'Skryť PIN' : 'Zobraziť PIN'}
                      title={showMyPin ? 'Skryť PIN' : 'Zobraziť PIN'}
                      className="btn btn-secondary btn-icon btn-sm"
                      style={{ width: '26px', height: '26px', padding: 0 }}
                    >
                      {showMyPin ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyPin}
                      aria-label="Skopírovať PIN kód"
                      title="Skopírovať PIN kód"
                      className="btn btn-secondary btn-icon btn-sm"
                      style={{ width: '26px', height: '26px', padding: 0 }}
                    >
                      {copiedPin ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Metriky a GDPR info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary-light)' }}>
                  {myProjects.length}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Aktívne projekty
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                  {totalFilesCount}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Doručené súbory
                </div>
              </div>
            </div>

            {/* GDPR garancia */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.04)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="var(--success)" flexShrink={0} />
                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  Dáta uložené v EÚ (GDPR čl. 17 – Právo na zabudnutie)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeAccountModal();
                  setIsLegalModalOpen(true);
                }}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.7rem', padding: '3px 8px', height: 'auto' }}
              >
                Viac info
              </button>
            </div>

            {/* ── Nebezpečná zóna (Danger Zone) ──────────────────────── */}
            <div style={{
              border: '1px solid var(--danger-border)',
              background: 'rgba(239, 68, 68, 0.035)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Trash2 size={18} color="var(--danger)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h3 style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--danger-light)',
                    margin: 0,
                    lineHeight: 1.3
                  }}>
                    Nebezpečná zóna – Trvalé zmazanie účtu
                  </h3>
                  <p style={{
                    fontSize: '0.76rem',
                    color: 'var(--text-tertiary)',
                    margin: '4px 0 0',
                    lineHeight: 1.4
                  }}>
                    Máte právo kedykoľvek natrvalo odstrániť váš účet, všetky briefy a súbory z cloudu. Táto akcia je nezvratná.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
                <button
                  type="button"
                  id="btn-trigger-delete-account"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="btn btn-outline-danger btn-sm"
                  style={{ gap: '6px' }}
                >
                  <Trash2 size={13} />
                  Zmazať môj účet a dáta...
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* ── Krok 2: Potvrdenie zmazania a zadanie PINu ─────────────── */
          <form onSubmit={handleDeleteSubmit} style={{ position: 'relative', zIndex: 1 }}>
            
            {/* Varovné hlásenie */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <AlertTriangle size={18} color="var(--danger)" />
                <strong style={{ fontSize: '0.88rem', color: 'var(--danger-light)' }}>
                  Pozor! Táto operácia je definitívna a nezvratná.
                </strong>
              </div>

              <ul style={{
                margin: 0,
                paddingLeft: '18px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <li>
                  Všetky vaše <strong>projekty ({myProjects.length})</strong> a klientske zberné formuláre budú vymazané.
                </li>
                <li>
                  Všetky <strong>súbory nahraté klientmi ({totalFilesCount})</strong> budú okamžite a natrvalo skartované z cloudového úložiska.
                </li>
                <li>
                  Všetky verejné odkazy pre klientov (napr. <code>?p=...</code>) prestanú existovať.
                </li>
                <li>
                  Váš používateľský profil a prístupový PIN kód budú trvalo odstránené z databázy (GDPR čl. 17).
                </li>
              </ul>
            </div>

            {/* Vstupné pole pre potvrdenie PIN kódom */}
            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="input-delete-account-pin"
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}
              >
                Pre potvrdenie identity zadajte váš 6-miestny PIN kód:
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  id="input-delete-account-pin"
                  type={showPinInput ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPinInput(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="••••••"
                  autoFocus
                  disabled={isDeleting}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    fontSize: '1.25rem',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.3em',
                    textAlign: 'center',
                    background: 'var(--bg-input-filled)',
                    border: `1px solid ${errorMessage ? 'var(--danger)' : 'var(--border-medium)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'var(--transition)'
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPinInput(!showPinInput)}
                  tabIndex={-1}
                  aria-label={showPinInput ? 'Skryť PIN' : 'Zobraziť PIN'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPinInput ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {errorMessage && (
                <div className="animate-shake" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--danger-light)',
                  fontSize: '0.78rem',
                  marginTop: '8px'
                }}>
                  <AlertTriangle size={13} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Akčné tlačidlá */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingDelete(false);
                  setPinInput('');
                  setErrorMessage('');
                }}
                disabled={isDeleting}
                className="btn btn-secondary"
              >
                <ArrowLeft size={14} />
                Späť
              </button>

              <button
                type="submit"
                id="btn-confirm-delete-account-permanently"
                disabled={pinInput.length !== 6 || isDeleting}
                className="btn btn-danger-solid"
                style={{ gap: '6px' }}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    Skartujem dáta v cloude...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Áno, natrvalo zmazať môj účet
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
