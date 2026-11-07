import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { 
  X, 
  KeyRound, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Mail, 
  Clock, 
  RefreshCw, 
  Edit2,
  ShieldCheck
} from 'lucide-react';

export default function AuthModal() {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalMode, 
    setAuthModalMode, 
    authRegisteredData,
    pendingRegistration,
    loginFreelancer, 
    loginWithGoogle,
    requestRegisterPin,
    verifyRegisterPin,
    resendRegisterPin,
    resetFreelancerPin,
    addToast,
    openLegalModal
  } = useApp();

  const [nick, setNick] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [verifyPin, setVerifyPin] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [referralRef, setReferralRef] = useState(() => {
    try {
      return localStorage.getItem('dropbrief_referral_ref') || null;
    } catch (e) {
      return null;
    }
  });

  // 5-minute countdown and resend cooldown
  const [timeLeft, setTimeLeft] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage('');
      setForgotSuccess('');
      try {
        setReferralRef(localStorage.getItem('dropbrief_referral_ref') || null);
      } catch (e) {}
      if (authModalMode === 'pin_reveal') {
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.6 },
            disableForReducedMotion: true
          });
        } catch (e) {}
      }
    }
  }, [isAuthModalOpen, authModalMode]);

  // 5-minute expiration countdown
  useEffect(() => {
    if (!isAuthModalOpen || authModalMode !== 'verify_register_pin' || !pendingRegistration?.expiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((pendingRegistration.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isAuthModalOpen, authModalMode, pendingRegistration?.expiresAt]);

  // Resend cooldown timer (30s)
  useEffect(() => {
    if (!isAuthModalOpen || authModalMode !== 'verify_register_pin') return;
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthModalOpen, authModalMode, pendingRegistration?.challengeToken]);

  // Close on Escape key press (WCAG 2.1.2)
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleGoogleAuth = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setIsGoogleLoading(false);
      setErrorMessage(err.message || 'Could not connect to Google. Please check your connection or use PIN.');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await loginFreelancer(nick, pin);
      setNick('');
      setPin('');
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your username/email and PIN code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Request verification PIN code via email
  const handleRegisterRequestSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await requestRegisterPin(nick, email);
      setVerifyPin('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send verification PIN code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify entered PIN code and complete registration
  const handleVerifyPinSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await verifyRegisterPin(verifyPin);
      setVerifyPin('');
      setNick('');
      setEmail('');
    } catch (err) {
      setErrorMessage(err.message || 'PIN verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend verification PIN code
  const handleResendPin = async () => {
    setErrorMessage('');
    setIsResending(true);
    try {
      await resendRegisterPin();
      setVerifyPin('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend verification PIN code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotPinSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setForgotSuccess('');
    setIsSubmitting(true);
    try {
      const res = await resetFreelancerPin(forgotEmail);
      setForgotSuccess(res.message || 'If this email is registered, a new PIN code has been sent to your inbox.');
    } catch (err) {
      setErrorMessage(err.message || 'PIN recovery failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPin = (pinToCopy) => {
    navigator.clipboard.writeText(pinToCopy);
    setCopiedPin(true);
    addToast('PIN code copied to clipboard!', 'success', 'Copied');
    setTimeout(() => setCopiedPin(false), 3000);
  };

  return (
    <div 
      className="modal-overlay"
      style={{ zIndex: 115 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div 
        className="auth-modal-card animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#ffffff',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 24px 50px -12px rgba(15, 23, 42, 0.18)',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          overflow: 'hidden',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-hairline)',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary-bg)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <KeyRound size={18} aria-hidden="true" />
            </div>
            <div>
              <h3 
                id="auth-modal-title" 
                style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 800, 
                  margin: 0, 
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  textWrap: 'balance'
                }}
              >
                {authModalMode === 'pin_reveal' ? 'Your account is ready' : 
                 authModalMode === 'verify_register_pin' ? 'Verify your email' :
                 authModalMode === 'register' ? 'Create freelancer account' : 
                 authModalMode === 'forgot_pin' ? 'Reset PIN code' : 'Log in to dashboard'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                {authModalMode === 'pin_reveal' ? 'Your verified PIN is ready for future logins' :
                 authModalMode === 'verify_register_pin' ? 'Enter the 6-digit code sent to your email' :
                 authModalMode === 'register' ? 'Free forever &bull; No password setup required' : 
                 authModalMode === 'forgot_pin' ? 'Receive a new 6-digit PIN in your inbox' : 'Enter your name or email with your 6-digit PIN'}
              </p>
            </div>
          </div>

          <button 
            id="btn-close-auth-modal"
            onClick={closeAuthModal}
            aria-label="Close authentication dialog"
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* PIN REVEAL STATE (Success Screen) */}
        {authModalMode === 'pin_reveal' && authRegisteredData && (
          <div style={{ padding: '28px 24px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              marginBottom: '16px'
            }}>
              <Sparkles size={26} aria-hidden="true" />
            </div>

            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Welcome to DropBrief, {authRegisteredData.nick}!
            </h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              Your account is active. This 6-digit numeric PIN is your permanent password:
            </p>

            {/* Clean PIN Display Box */}
            <div style={{
              background: '#0f172a',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 20px',
              marginBottom: '20px',
              position: 'relative'
            }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '8px', letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' }}>
                Your Permanent Access PIN
              </span>
              <div 
                className="tabular-nums"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  letterSpacing: '10px',
                  color: '#ffffff',
                  marginBottom: '14px'
                }}
              >
                {authRegisteredData.pin}
              </div>

              <button
                id="btn-copy-pin"
                type="button"
                onClick={() => handleCopyPin(authRegisteredData.pin)}
                aria-label="Copy PIN code to clipboard"
                className={`btn btn-sm btn-pill ${copiedPin ? 'btn-primary' : 'btn-secondary'}`}
                style={{ margin: '0 auto', fontSize: '0.82rem', padding: '6px 18px', gap: '6px' }}
              >
                {copiedPin ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
              </button>
            </div>

            <div style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              textAlign: 'left',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              marginBottom: '22px'
            }}>
              <ShieldCheck size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <div>
                We also delivered this PIN to <strong>{authRegisteredData.email}</strong>. Use your name or email together with this PIN for all future logins.
              </div>
            </div>

            <button
              id="btn-enter-dashboard"
              type="button"
              onClick={closeAuthModal}
              className="btn btn-primary btn-lg btn-pill"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Enter Dashboard</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* REGULAR FORMS (LOGIN / REGISTER / VERIFY_REGISTER_PIN / FORGOT_PIN) */}
        {authModalMode !== 'pin_reveal' && (
          <div>
            {/* Minimal Segmented Tab Switcher */}
            {authModalMode !== 'forgot_pin' && authModalMode !== 'verify_register_pin' && (
              <div style={{
                display: 'flex',
                background: '#f8fafc',
                padding: '4px',
                borderBottom: '1px solid var(--border-hairline)',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('login'); setErrorMessage(''); setForgotSuccess(''); }}
                  className={`btn btn-sm btn-pill ${authModalMode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, border: 'none', justifyContent: 'center', padding: '7px 12px', fontSize: '0.82rem' }}
                >
                  <LogIn size={14} aria-hidden="true" />
                  <span>Log In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('register'); setErrorMessage(''); setForgotSuccess(''); }}
                  className={`btn btn-sm btn-pill ${authModalMode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, border: 'none', justifyContent: 'center', padding: '7px 12px', fontSize: '0.82rem' }}
                >
                  <UserPlus size={14} aria-hidden="true" />
                  <span>Sign Up Free</span>
                </button>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div 
                role="alert"
                style={{
                  margin: '16px 24px 0',
                  padding: '10px 14px',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger-text)',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={15} color="var(--danger)" style={{ flexShrink: 0 }} aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* FORM 1: LOGIN */}
            {authModalMode === 'login' && (
              <form onSubmit={handleLoginSubmit} style={{ padding: '24px' }}>
                
                {/* Continue with Google */}
                <button
                  type="button"
                  id="btn-google-login"
                  onClick={handleGoogleAuth}
                  disabled={isGoogleLoading || isSubmitting}
                  aria-label="Continue with Google"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: isGoogleLoading ? 'wait' : 'pointer',
                    boxShadow: 'var(--shadow-xs)',
                    marginBottom: '16px'
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{isGoogleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '10px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-hairline)' }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    or enter PIN
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-hairline)' }} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="login-nick-input" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Username or Email
                  </label>
                  <input
                    id="login-nick-input"
                    type="text"
                    className="input"
                    placeholder="e.g. AlexDesign or alex@design.com…"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    required
                    autoFocus
                    autoComplete="username"
                    spellCheck={false}
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label htmlFor="login-pin-input" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      6-digit numeric PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      aria-label={showPin ? 'Hide PIN code' : 'Show PIN code'}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', padding: 0 }}
                    >
                      {showPin ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
                      <span>{showPin ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    id="login-pin-input"
                    type={showPin ? 'text' : 'password'}
                    className="input tabular-nums"
                    placeholder="••••••"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    autoComplete="current-password"
                    spellCheck={false}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.25rem',
                      letterSpacing: '6px',
                      textAlign: 'center'
                    }}
                  />
                </div>

                {/* Forgot PIN Link */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                  <button
                    type="button"
                    id="btn-forgot-pin"
                    onClick={() => {
                      setAuthModalMode('forgot_pin');
                      setErrorMessage('');
                      setForgotSuccess('');
                      setForgotEmail(nick.includes('@') ? nick : email || '');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Forgot your PIN code?
                  </button>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg btn-pill"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isSubmitting ? 'Verifying…' : 'Log In to Dashboard'}
                </button>

                <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                  Protected by 256-bit encryption &bull;{' '}
                  <button
                    type="button"
                    onClick={() => openLegalModal('privacy')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
                  >
                    GDPR Privacy
                  </button>
                  {' '}&bull;{' '}
                  <button
                    type="button"
                    onClick={() => openLegalModal('tos')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
                  >
                    Terms
                  </button>
                </div>
              </form>
            )}

            {/* FORM 2: REGISTER (Step 1 - Name & Email) */}
            {authModalMode === 'register' && (
              <form onSubmit={handleRegisterRequestSubmit} style={{ padding: '24px' }}>
                
                {/* Sign up with Google */}
                <button
                  type="button"
                  id="btn-google-register"
                  onClick={handleGoogleAuth}
                  disabled={isGoogleLoading || isSubmitting}
                  aria-label="Sign up with Google"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    background: '#ffffff',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: isGoogleLoading ? 'wait' : 'pointer',
                    boxShadow: 'var(--shadow-xs)',
                    marginBottom: '16px'
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{isGoogleLoading ? 'Connecting to Google…' : 'Sign up with Google'}</span>
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '10px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-hairline)' }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    or create with email &amp; PIN
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-hairline)' }} />
                </div>

                {referralRef && (
                  <div style={{
                    background: 'var(--accent-primary-bg)',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <Sparkles size={14} color="var(--accent-primary)" aria-hidden="true" />
                    <span>Referred by <strong>{referralRef}</strong> — bonus applied!</span>
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="register-nick-input" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Your Name or Studio Name <span style={{ color: 'var(--accent-primary)' }}>*</span>
                  </label>
                  <input
                    id="register-nick-input"
                    type="text"
                    className="input"
                    placeholder="e.g. Alex Studio…"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    required
                    autoFocus
                    autoComplete="name"
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                    Shown to your clients in the portal header.
                  </span>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label htmlFor="register-email-input" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Your email address <span style={{ color: 'var(--accent-primary)' }}>*</span>
                  </label>
                  <input
                    id="register-email-input"
                    type="email"
                    className="input"
                    placeholder="you@email.com…"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    spellCheck={false}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                    We'll email a 6-digit verification code. No spam, ever.
                  </span>
                </div>

                <button
                  id="btn-register-request-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg btn-pill"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isSubmitting ? 'Sending code…' : 'Send Verification PIN →'}
                </button>

                <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  By signing up, you agree to DropBrief's{' '}
                  <button
                    type="button"
                    onClick={() => openLegalModal('tos')}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 600 }}
                  >
                    Terms of Service
                  </button>
                  {' '}and acknowledge our{' '}
                  <button
                    type="button"
                    onClick={() => openLegalModal('privacy')}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 600 }}
                  >
                    Privacy Policy (GDPR)
                  </button>
                  . 100% cookie-free.
                </div>
              </form>
            )}

            {/* FORM 2B: VERIFY REGISTER PIN (Step 2 - PIN entry with 5m limit) */}
            {authModalMode === 'verify_register_pin' && (
              <form onSubmit={handleVerifyPinSubmit} style={{ padding: '24px' }}>
                
                {/* Email Confirmation Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <Mail size={15} color="var(--accent-primary)" style={{ flexShrink: 0 }} aria-hidden="true" />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Code sent to:</span>
                      <strong style={{ fontSize: '0.825rem', color: 'var(--text-primary)' }} className="truncate">
                        {pendingRegistration?.email || email}
                      </strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('register');
                      setErrorMessage('');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem', padding: '3px 8px', gap: '4px' }}
                    title="Change email address"
                  >
                    <Edit2 size={11} aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* 5-minute Countdown Banner */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: timeLeft > 0 ? 'var(--bg-base)' : 'var(--danger-bg)',
                  border: timeLeft > 0 ? '1px solid var(--border-hairline)' : '1px solid var(--danger-border)',
                  marginBottom: '18px'
                }}>
                  <Clock size={14} color={timeLeft > 0 ? 'var(--accent-primary)' : 'var(--danger)'} aria-hidden="true" />
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: timeLeft > 0 ? 'var(--text-secondary)' : 'var(--danger-text)' }}>
                    {timeLeft > 0 ? (
                      <>Code expires in: <strong className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{formatTime(timeLeft)}</strong></>
                    ) : (
                      'Code has expired. Please request a new one.'
                    )}
                  </span>
                </div>

                {/* 6-digit PIN Input */}
                <div style={{ marginBottom: '18px' }}>
                  <label htmlFor="verify-pin-input" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
                    Enter 6-digit PIN from your email
                  </label>
                  <input
                    id="verify-pin-input"
                    type="text"
                    className="input tabular-nums"
                    placeholder="••••••"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    spellCheck={false}
                    value={verifyPin}
                    onChange={(e) => setVerifyPin(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    autoFocus
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.6rem',
                      letterSpacing: '8px',
                      textAlign: 'center',
                      fontWeight: 800,
                      padding: '12px'
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px', textAlign: 'center' }}>
                    This code becomes your permanent access PIN.
                  </span>
                </div>

                {/* Dev Mode Helper (local only) */}
                {pendingRegistration?.devPin && (
                  <div style={{
                    marginBottom: '14px',
                    padding: '6px 10px',
                    background: 'rgba(234, 179, 8, 0.12)',
                    border: '1px dashed #d97706',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--warning-text)',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}>
                    Dev Mode: Your PIN is <strong>{pendingRegistration.devPin}</strong>
                  </div>
                )}

                <button
                  id="btn-verify-pin-submit"
                  type="submit"
                  disabled={isSubmitting || verifyPin.length !== 6 || timeLeft === 0}
                  className="btn btn-primary btn-lg btn-pill"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '14px' }}
                >
                  {isSubmitting ? 'Verifying…' : 'Verify PIN & Create Account →'}
                </button>

                {/* Actions Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('register');
                      setErrorMessage('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <ArrowLeft size={13} aria-hidden="true" />
                    <span>Change details</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendPin}
                    disabled={resendCooldown > 0 || isResending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent-primary)',
                      fontSize: '0.78rem',
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    <RefreshCw size={11} className={isResending ? 'spin' : ''} aria-hidden="true" />
                    <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend code'}</span>
                  </button>
                </div>

              </form>
            )}

            {/* FORM 3: FORGOT PIN */}
            {authModalMode === 'forgot_pin' && (
              <form onSubmit={handleForgotPinSubmit} style={{ padding: '24px' }}>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: 1.5 }}>
                  Enter your registered email address. We'll generate a secure new 6-digit PIN and send it to your inbox immediately.
                </p>

                {forgotSuccess ? (
                  <div style={{
                    padding: '20px 16px',
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--success-text)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}>
                    <Check size={28} color="var(--success)" style={{ margin: '0 auto 8px', display: 'block' }} aria-hidden="true" />
                    <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      PIN sent to your email
                    </strong>
                    <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {forgotSuccess}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode('login');
                        setForgotSuccess('');
                        setErrorMessage('');
                      }}
                      className="btn btn-primary btn-md btn-pill"
                      style={{ margin: '0 auto' }}
                    >
                      Go to Log In
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '18px' }}>
                      <label htmlFor="forgot-email-input" style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                        Your registered email <span style={{ color: 'var(--accent-primary)' }}>*</span>
                      </label>
                      <input
                        id="forgot-email-input"
                        type="email"
                        className="input"
                        placeholder="you@email.com…"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        autoFocus
                        autoComplete="email"
                        spellCheck={false}
                      />
                    </div>

                    <button
                      id="btn-forgot-submit"
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary btn-lg btn-pill"
                      style={{ width: '100%', justifyContent: 'center', marginBottom: '14px' }}
                    >
                      {isSubmitting ? 'Generating PIN…' : 'Send New PIN to Email'}
                    </button>

                    <div style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalMode('login');
                          setErrorMessage('');
                          setForgotSuccess('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0
                        }}
                      >
                        <ArrowLeft size={13} aria-hidden="true" />
                        <span>Back to Log In</span>
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
