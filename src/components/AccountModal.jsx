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
    ? new Date(currentFreelancer.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';

  const handleCopyPin = () => {
    if (!currentFreelancer.pin) return;
    navigator.clipboard.writeText(String(currentFreelancer.pin));
    setCopiedPin(true);
    addToast('PIN code copied to clipboard.', 'success', 'PIN Copied');
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPin = pinInput.trim();
    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      setErrorMessage('Please enter your 6-digit numeric PIN code.');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteFreelancerAccount(cleanPin);
      // Successful deletion closes modal and logs out in AppContext
    } catch (err) {
      setIsDeleting(false);
      setErrorMessage(err.message || 'Failed to delete account. Please check your PIN code.');
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
        {/* Ambient Glow */}
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

        {/* ── Header ────────────────────────────────────────────────── */}
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
                {isConfirmingDelete ? 'Delete Account & Data' : 'Profile & Security'}
              </h2>
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--text-tertiary)',
                margin: '2px 0 0'
              }}>
                {isConfirmingDelete ? 'Confirm permanent and irreversible deletion' : 'Login overview and data management'}
              </p>
            </div>
          </div>

          <button
            onClick={closeAccountModal}
            disabled={isDeleting}
            aria-label="Close account settings"
            className="btn btn-secondary btn-icon btn-sm"
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Step 1: Standard Profile View ─────────────────────────── */}
        {!isConfirmingDelete ? (
          <div style={{ position: 'relative', zIndex: 1 }}>
            
            {/* Account Details Box */}
            <div style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '20px'
            }}>
              
              {/* Row 1: Nickname */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="var(--accent-primary-light)" />
                  Nickname:
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentFreelancer.nick}
                </span>
              </div>

              {/* Row 2: Email */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} color="var(--accent-primary-light)" />
                  Email address:
                </span>
                <span style={{ fontSize: '0.84rem', color: currentFreelancer.email ? 'var(--text-secondary)' : 'var(--text-quaternary)', fontFamily: currentFreelancer.email ? 'var(--font-mono)' : 'inherit' }}>
                  {currentFreelancer.email || 'Not set'}
                </span>
              </div>

              {/* Row 3: Created At */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="var(--accent-primary-light)" />
                  Created:
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {formattedDate}
                </span>
              </div>

              {/* Row 4: PIN code */}
              {currentFreelancer.pin && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-hairline)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <KeyRound size={14} color="var(--accent-primary-light)" />
                    Security PIN:
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
                      aria-label={showMyPin ? 'Hide PIN' : 'Show PIN'}
                      title={showMyPin ? 'Hide PIN' : 'Show PIN'}
                      className="btn btn-secondary btn-icon btn-sm"
                      style={{ width: '26px', height: '26px', padding: 0 }}
                    >
                      {showMyPin ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyPin}
                      aria-label="Copy PIN code"
                      title="Copy PIN code"
                      className="btn btn-secondary btn-icon btn-sm"
                      style={{ width: '26px', height: '26px', padding: 0 }}
                    >
                      {copiedPin ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Metrics and GDPR info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {myProjects.length}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Active Projects
                </div>
              </div>

              <div style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                  {totalFilesCount}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Delivered Files
                </div>
              </div>
            </div>

            {/* GDPR guarantee */}
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
                  Data stored in EU (GDPR Art. 17 – Right to erasure)
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
                Learn more
              </button>
            </div>

            {/* ── Danger Zone ───────────────────────────────────────── */}
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
                    color: 'var(--danger)',
                    margin: 0,
                    lineHeight: 1.3
                  }}>
                    Danger Zone – Permanent Account Deletion
                  </h3>
                  <p style={{
                    fontSize: '0.76rem',
                    color: 'var(--text-tertiary)',
                    margin: '4px 0 0',
                    lineHeight: 1.4
                  }}>
                    You have the right to permanently delete your account, all briefs, and cloud files at any time. This action is irreversible.
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
                  Delete my account and data...
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* ── Step 2: Confirm Deletion and Enter PIN ──────────────── */
          <form onSubmit={handleDeleteSubmit} style={{ position: 'relative', zIndex: 1 }}>
            
            {/* Warning Alert */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <AlertTriangle size={18} color="var(--danger)" />
                <strong style={{ fontSize: '0.88rem', color: 'var(--danger)' }}>
                  Warning! This operation is final and irreversible.
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
                  All your <strong>projects ({myProjects.length})</strong> and client collection forms will be deleted.
                </li>
                <li>
                  All <strong>client-uploaded files ({totalFilesCount})</strong> will be immediately and permanently purged from cloud storage.
                </li>
                <li>
                  All public client links (e.g. <code>?p=...</code>) will cease to exist.
                </li>
                <li>
                  Your user profile and access PIN will be permanently removed from the database (GDPR Art. 17).
                </li>
              </ul>
            </div>

            {/* PIN Input Field */}
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
                Enter your 6-digit PIN code to confirm your identity:
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
                  aria-label={showPinInput ? 'Hide PIN' : 'Show PIN'}
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
                className="btn btn-secondary"
              >
                <ArrowLeft size={14} />
                Back
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
                    Purging cloud data...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Yes, permanently delete my account
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
