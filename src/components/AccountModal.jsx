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
  ArrowLeft,
  ExternalLink,
  Shield,
  Layers,
  FileCheck
} from 'lucide-react';
import '../styles/dashboard-brutalist.css';

export default function AccountModal() {
  const { 
    isAccountModalOpen, 
    closeAccountModal, 
    currentFreelancer, 
    projects, 
    deleteFreelancerAccount,
    logoutFreelancer,
    openLegalModal,
    addToast
  } = useApp();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [showMyPin, setShowMyPin] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Reset state on modal open/close
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

  // Close on Escape key press
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

  // Freelancer project statistics
  const myProjects = (projects || []).filter((p) => {
    if (p.freelancerId && p.freelancerId === currentFreelancer.id) return true;
    if (p.freelancerName && p.freelancerName.toLowerCase() === currentFreelancer.nick.toLowerCase()) return true;
    if (currentFreelancer.email && p.freelancerEmail && p.freelancerEmail.toLowerCase() === currentFreelancer.email.toLowerCase()) return true;
    if (currentFreelancer.id === 'fl-demo-marko' && (p.id === 'proj-alfa' || p.id === 'proj-dental')) return true;
    return false;
  });

  const totalFilesCount = myProjects.reduce((acc, p) => {
    const itemFiles = p.items ? p.items.filter((i) => i.isCompleted && i.value).length : 0;
    return acc + itemFiles;
  }, 0);

  const formattedDate = currentFreelancer.createdAt
    ? new Date(currentFreelancer.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recently';

  const isGoogleUser = currentFreelancer?.authProvider === 'google';
  const tier = currentFreelancer?.tier || 'free';
  const isVipPro = tier === 'pro';

  const handleCopyPin = () => {
    if (!currentFreelancer.pin) return;
    navigator.clipboard.writeText(String(currentFreelancer.pin));
    setCopiedPin(true);
    if (addToast) {
      addToast('PIN code copied to clipboard.', 'success', 'PIN Copied');
    }
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isGoogleUser) {
      const cleanConfirm = pinInput.trim().toUpperCase();
      if (cleanConfirm !== 'DELETE' && cleanConfirm !== 'ZMAZAŤ') {
        setErrorMessage('Please type DELETE or ZMAZAŤ to confirm deletion.');
        return;
      }
    } else {
      const cleanPin = pinInput.trim();
      if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
        setErrorMessage('Please enter your 6-digit numeric PIN code.');
        return;
      }
    }

    setIsDeleting(true);
    try {
      await deleteFreelancerAccount(pinInput.trim());
      // Successful deletion closes modal and logs out in AppContext
    } catch (err) {
      setIsDeleting(false);
      setErrorMessage(err.message || 'Failed to delete account.');
    }
  };

  return (
    <div 
      className="account-modal-overlay"
      onClick={() => {
        if (!isDeleting) closeAccountModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
    >
      <div 
        className="account-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ── Modal Header ─────────────────────────────────────── */}
        <header className="account-modal-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div 
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '6px',
                background: isConfirmingDelete ? 'var(--red-light)' : 'var(--amber-light)',
                border: `2px solid ${isConfirmingDelete ? 'var(--red)' : '#18181B'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isConfirmingDelete ? 'var(--red)' : '#18181B',
                boxShadow: '2px 2px 0px #18181B',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              {isConfirmingDelete ? (
                <AlertTriangle size={22} />
              ) : currentFreelancer?.avatarUrl && !avatarError ? (
                <img 
                  src={currentFreelancer.avatarUrl} 
                  alt={currentFreelancer.nick}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User size={22} />
              )}
            </div>

            <div>
              <div className="account-header-kicker">
                <Shield size={12} aria-hidden="true" />
                <span>{isConfirmingDelete ? 'GDPR ART. 17 ERASURE' : 'STUDIO SECURITY DOSSIER'}</span>
              </div>

              <h2 id="account-modal-title" className="account-header-title">
                {isConfirmingDelete ? 'Delete Account & Data' : 'Profile & Security'}
              </h2>

              <p className="account-header-sub">
                {isConfirmingDelete 
                  ? 'Irreversible purge of your studio account and files' 
                  : `Credentials and privacy management for @${currentFreelancer.nick}`}
              </p>
            </div>
          </div>

          <button
            onClick={closeAccountModal}
            disabled={isDeleting}
            aria-label="Close account modal"
            className="account-modal-close-btn"
          >
            <X size={16} />
          </button>
        </header>

        {/* ── Modal Body ───────────────────────────────────────── */}
        <div className="account-modal-body">

          {!isConfirmingDelete ? (
            /* ── Step 1: Profile & Credentials Overview ─────────── */
            <div>
              
              {/* Account Credentials Card */}
              <div className="account-section-card">
                
                {/* Nickname */}
                <div className="account-field-row">
                  <span className="account-field-label">
                    <User size={14} color="var(--amber-dark)" />
                    Studio Nickname:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="account-field-val">
                      @{currentFreelancer.nick}
                    </span>
                    <span 
                      className="badge-stamp" 
                      style={{ 
                        background: isVipPro ? 'var(--amber-light)' : '#E5E7EB',
                        color: isVipPro ? 'var(--amber-dark)' : '#374151',
                        fontSize: '0.68rem',
                        padding: '1px 6px'
                      }}
                    >
                      {isVipPro ? '⭐ VIP PRO' : 'STARTER'}
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div className="account-field-row">
                  <span className="account-field-label">
                    <Mail size={14} color="var(--amber-dark)" />
                    Email Address:
                  </span>
                  <span className="account-field-val" style={{ fontFamily: currentFreelancer.email ? 'var(--font-mono)' : 'inherit', fontSize: '0.84rem' }}>
                    {currentFreelancer.email || 'Not set (PIN only)'}
                  </span>
                </div>

                {/* Registration Date */}
                <div className="account-field-row">
                  <span className="account-field-label">
                    <Calendar size={14} color="var(--amber-dark)" />
                    Member Since:
                  </span>
                  <span className="account-field-val" style={{ fontSize: '0.84rem' }}>
                    {formattedDate}
                  </span>
                </div>

                {/* Sign-in Method / Security PIN */}
                {isGoogleUser ? (
                  <div className="account-field-row">
                    <span className="account-field-label">
                      <ShieldCheck size={14} color="var(--emerald)" />
                      Sign-in Method:
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--ink-primary)',
                      background: '#FFFFFF',
                      border: '1px solid var(--border-subtle)',
                      padding: '3px 8px',
                      borderRadius: '4px'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Google Account (Verified)
                    </span>
                  </div>
                ) : currentFreelancer.pin ? (
                  <div className="account-field-row">
                    <span className="account-field-label">
                      <KeyRound size={14} color="var(--amber-dark)" />
                      Security PIN:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        letterSpacing: showMyPin ? '0.12em' : '0.22em',
                        color: 'var(--ink-primary)',
                        background: 'var(--amber-light)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--amber)'
                      }}>
                        {showMyPin ? currentFreelancer.pin : '••••••'}
                      </span>

                      <button
                        type="button"
                        onClick={() => setShowMyPin(!showMyPin)}
                        aria-label={showMyPin ? 'Hide PIN' : 'Show PIN'}
                        title={showMyPin ? 'Hide PIN' : 'Show PIN'}
                        className="btn-tactile-sm"
                        style={{ padding: '4px 6px', height: '26px' }}
                      >
                        {showMyPin ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyPin}
                        aria-label="Copy PIN code"
                        title="Copy PIN code"
                        className="btn-tactile-sm"
                        style={{ padding: '4px 6px', height: '26px', background: copiedPin ? 'var(--emerald-light)' : '#FFFFFF' }}
                      >
                        {copiedPin ? <Check size={13} color="var(--emerald-dark)" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                ) : null}

              </div>

              {/* Studio Metrics Grid */}
              <div className="account-metrics-grid">
                <div className="account-metric-box">
                  <div className="account-metric-num" style={{ color: 'var(--ink-primary)' }}>
                    {myProjects.length}
                  </div>
                  <div className="account-metric-label">Active Dockets</div>
                </div>

                <div className="account-metric-box">
                  <div className="account-metric-num" style={{ color: 'var(--emerald-dark)' }}>
                    {totalFilesCount}
                  </div>
                  <div className="account-metric-label">Delivered Files</div>
                </div>
              </div>

              {/* GDPR Compliance & Legal Center Box */}
              <div className="account-gdpr-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} color="var(--emerald-dark)" style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: '0.86rem', color: 'var(--ink-primary)', display: 'block' }}>
                        EU Data Privacy &amp; GDPR Compliance
                      </strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--emerald-dark)', fontWeight: 600 }}>
                        Ireland EU cloud &bull; AES-256 encrypted &bull; 100% cookie-free
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      closeAccountModal();
                      openLegalModal('overview');
                    }}
                    className="btn-tactile-sm"
                    style={{ fontSize: '0.72rem', padding: '4px 8px', background: '#FFFFFF' }}
                  >
                    <span>Legal Spec ↗</span>
                  </button>
                </div>

                {/* Quick links to DPA, TOS, Retention */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '10px', marginTop: '10px', borderTop: '1px dashed #A7F3D0' }}>
                  <button
                    type="button"
                    onClick={() => {
                      closeAccountModal();
                      openLegalModal('dpa');
                    }}
                    className="badge-stamp"
                    style={{ background: '#FFFFFF', border: '1px solid #A7F3D0', color: 'var(--ink-secondary)', cursor: 'pointer', fontSize: '0.7rem' }}
                  >
                    📑 Art. 28 DPA Contract
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeAccountModal();
                      openLegalModal('tos');
                    }}
                    className="badge-stamp"
                    style={{ background: '#FFFFFF', border: '1px solid #A7F3D0', color: 'var(--ink-secondary)', cursor: 'pointer', fontSize: '0.7rem' }}
                  >
                    📜 Terms of Service
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeAccountModal();
                      openLegalModal('retention');
                    }}
                    className="badge-stamp"
                    style={{ background: '#FFFFFF', border: '1px solid #A7F3D0', color: 'var(--ink-secondary)', cursor: 'pointer', fontSize: '0.7rem' }}
                  >
                    ⏱️ 30-Day Purge Policy
                  </button>
                </div>
              </div>

              {/* Danger Zone (Account Deletion) */}
              <div className="account-danger-box">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Trash2 size={18} color="var(--red)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--red)', margin: 0 }}>
                      Danger Zone – Permanent Account Erasure
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#7F1D1D', margin: '4px 0 0', lineHeight: 1.45 }}>
                      Under GDPR Art. 17 (Right to Erasure), you can permanently delete your studio account, all dockets, and cloud files at any time.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    id="btn-trigger-delete-account"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="btn-tactile-sm"
                    style={{ 
                      background: '#FFFFFF', 
                      color: 'var(--red)', 
                      borderColor: 'var(--red)',
                      fontWeight: 800
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete account and all data...</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* ── Step 2: Confirm Deletion and Enter PIN ──────────── */
            <form onSubmit={handleDeleteSubmit}>
              
              {/* Warning Alert Banner */}
              <div style={{
                background: 'var(--red-light)',
                border: '1.5px solid var(--red)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertTriangle size={18} color="var(--red)" />
                  <strong style={{ fontSize: '0.88rem', color: 'var(--red)', fontWeight: 800 }}>
                    Final Warning! Irreversible Operation
                  </strong>
                </div>

                <ul style={{
                  margin: 0,
                  paddingLeft: '18px',
                  fontSize: '0.8rem',
                  color: '#7F1D1D',
                  lineHeight: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <li>
                    All <strong>{myProjects.length} client dockets</strong> will be permanently deleted.
                  </li>
                  <li>
                    All <strong>{totalFilesCount} client-uploaded files</strong> will be purged immediately from cloud storage.
                  </li>
                  <li>
                    All client upload links (<code>?p=...</code>) will instantly stop working.
                  </li>
                  <li>
                    Your account and PIN will be permanently wiped (GDPR Art. 17).
                  </li>
                </ul>
              </div>

              {/* Confirmation Input Field */}
              <div style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="input-delete-account-pin"
                  style={{
                    display: 'block',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    marginBottom: '8px'
                  }}
                >
                  {isGoogleUser 
                    ? 'Type "DELETE" or "ZMAZAŤ" below to confirm deletion:' 
                    : 'Enter your 6-digit Security PIN to verify your identity:'}
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    id="input-delete-account-pin"
                    type={isGoogleUser ? 'text' : (showPinInput ? 'text' : 'password')}
                    inputMode={isGoogleUser ? 'text' : 'numeric'}
                    pattern={isGoogleUser ? undefined : '[0-9]*'}
                    maxLength={isGoogleUser ? 20 : 6}
                    value={pinInput}
                    onChange={(e) => {
                      const val = isGoogleUser ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 6);
                      setPinInput(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder={isGoogleUser ? 'Type DELETE to confirm' : '••••••'}
                    autoFocus
                    disabled={isDeleting}
                    style={{
                      width: '100%',
                      padding: isGoogleUser ? '12px 14px' : '12px 42px 12px 14px',
                      fontSize: isGoogleUser ? '0.95rem' : '1.3rem',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: isGoogleUser ? '0.04em' : '0.35em',
                      textAlign: isGoogleUser ? 'left' : 'center',
                      background: '#FAF9F6',
                      border: `2px solid ${errorMessage ? 'var(--red)' : '#18181B'}`,
                      borderRadius: '6px',
                      color: 'var(--ink-primary)',
                      outline: 'none',
                      fontWeight: 800
                    }}
                  />

                  {!isGoogleUser && (
                    <button
                      type="button"
                      onClick={() => setShowPinInput(!showPinInput)}
                      tabIndex={-1}
                      aria-label={showPinInput ? 'Hide PIN' : 'Show PIN'}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--ink-muted)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      {showPinInput ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>

                {errorMessage && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--red)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    marginTop: '8px'
                  }}>
                    <AlertTriangle size={14} />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
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
                  className="btn-tactile-secondary"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  id="btn-confirm-delete-account-permanently"
                  disabled={
                    isGoogleUser 
                      ? (pinInput.trim().toUpperCase() !== 'DELETE' && pinInput.trim().toUpperCase() !== 'ZMAZAŤ') || isDeleting
                      : pinInput.length !== 6 || isDeleting
                  }
                  className="btn-tactile-primary"
                  style={{
                    background: 'var(--red)',
                    color: '#FFFFFF',
                    borderColor: '#18181B'
                  }}
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Purging cloud data...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Yes, permanently delete my account</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
