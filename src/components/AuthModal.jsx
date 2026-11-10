import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import '../styles/auth-modal.css';
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

  const handleOpenLegal = (tab = 'overview') => {
    closeAuthModal();
    openLegalModal(tab);
  };

  return (
    <div 
      className="auth-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div 
        className="auth-modal-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Modal Header Bar */}
        <div className="auth-header-bar">
          <div className="auth-header-left">
            <div className="auth-header-icon-box">
              <KeyRound size={20} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div>
              <div className="auth-header-meta">
                <span className="auth-header-kicker">
                  {authModalMode === 'pin_reveal' ? 'SYS // ONBOARDING_SUCCESS' :
                   authModalMode === 'verify_register_pin' ? 'SYS // OTP_CHALLENGE' :
                   authModalMode === 'register' ? 'SYS // VIP_REGISTRATION' :
                   authModalMode === 'forgot_pin' ? 'SYS // PIN_RECOVERY' : 'SYS // FREELANCER_LOGIN'}
                </span>
                <span className="auth-header-badge">
                  <ShieldCheck size={11} strokeWidth={2.5} aria-hidden="true" />
                  <span>256-BIT ENCRYPTED</span>
                </span>
              </div>
              <h3 id="auth-modal-title" className="auth-header-title">
                {authModalMode === 'pin_reveal' ? 'Your account is ready' : 
                 authModalMode === 'verify_register_pin' ? 'Verify your email' :
                 authModalMode === 'register' ? 'Create freelancer account' : 
                 authModalMode === 'forgot_pin' ? 'Reset PIN code' : 'Log in to dashboard'}
              </h3>
              <p className="auth-header-sub">
                {authModalMode === 'pin_reveal' ? 'Your verified PIN is ready for future logins' :
                 authModalMode === 'verify_register_pin' ? 'Enter the 6-digit code sent to your email' :
                 authModalMode === 'register' ? 'Free forever • First 15 receive Lifetime VIP PRO' : 
                 authModalMode === 'forgot_pin' ? 'Receive a new 6-digit PIN in your inbox' : 'Zero passwords — log in with username and 6-digit PIN'}
              </p>
            </div>
          </div>

          <button 
            id="btn-close-auth-modal"
            onClick={closeAuthModal}
            aria-label="Close authentication dialog"
            className="auth-btn-close"
            title="Close dialog (Esc)"
          >
            <X size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* PIN REVEAL STATE (Success Screen) */}
        {authModalMode === 'pin_reveal' && authRegisteredData && (
          <div className="auth-body-content" style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '8px',
              background: 'var(--yellow)',
              color: 'var(--ink)',
              border: '2px solid #111111',
              boxShadow: '3px 3px 0px #111111',
              marginBottom: '16px'
            }}>
              <Sparkles size={28} strokeWidth={2.5} aria-hidden="true" />
            </div>

            <h4 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '1.45rem', 
              fontWeight: 900, 
              marginBottom: '6px', 
              color: 'var(--ink)',
              letterSpacing: '-0.02em'
            }}>
              Welcome to DropBrief, {authRegisteredData.nick}!
            </h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--ink-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              Your account is active. This 6-digit numeric PIN is your permanent password:
            </p>

            {/* Brutalist Dark Punchcard Display Box */}
            <div className="auth-pin-reveal-box">
              <span style={{ 
                fontSize: '0.72rem', 
                color: 'var(--yellow)', 
                display: 'block', 
                marginBottom: '8px', 
                letterSpacing: '0.08em', 
                fontWeight: 800, 
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)'
              }}>
                Your Permanent Access PIN
              </span>
              <div className="auth-pin-digits tabular-nums">
                {authRegisteredData.pin}
              </div>

              <button
                id="btn-copy-pin"
                type="button"
                onClick={() => handleCopyPin(authRegisteredData.pin)}
                aria-label="Copy PIN code to clipboard"
                className={`auth-copy-btn ${copiedPin ? 'copied' : ''}`}
              >
                {copiedPin ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : <Copy size={14} strokeWidth={2.5} aria-hidden="true" />}
                <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
              </button>
            </div>

            <div className="auth-info-card">
              <ShieldCheck size={18} color="var(--emerald)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <div>
                We also delivered this PIN to <strong>{authRegisteredData.email}</strong>. Use your name or email together with this PIN for all future logins.
              </div>
            </div>

            <button
              id="btn-enter-dashboard"
              type="button"
              onClick={closeAuthModal}
              className="auth-btn-primary"
            >
              <span>Enter Dashboard</span>
              <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* REGULAR FORMS (LOGIN / REGISTER / VERIFY_REGISTER_PIN / FORGOT_PIN) */}
        {authModalMode !== 'pin_reveal' && (
          <div>
            {/* Tactile Segmented Tab Switcher */}
            {authModalMode !== 'forgot_pin' && authModalMode !== 'verify_register_pin' && (
              <div className="auth-tabs-row" role="tablist" aria-label="Authentication mode selection">
                <button
                  type="button"
                  role="tab"
                  aria-selected={authModalMode === 'login'}
                  onClick={() => { setAuthModalMode('login'); setErrorMessage(''); setForgotSuccess(''); }}
                  className={`auth-tab-btn ${authModalMode === 'login' ? 'active' : ''}`}
                >
                  <LogIn size={15} strokeWidth={2.2} aria-hidden="true" />
                  <span>Log In</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authModalMode === 'register'}
                  onClick={() => { setAuthModalMode('register'); setErrorMessage(''); setForgotSuccess(''); }}
                  className={`auth-tab-btn ${authModalMode === 'register' ? 'active' : ''}`}
                >
                  <UserPlus size={15} strokeWidth={2.2} aria-hidden="true" />
                  <span>Sign Up Free</span>
                </button>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div role="alert" className="auth-error-banner">
                <AlertCircle size={17} color="var(--red)" style={{ flexShrink: 0 }} aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* FORM 1: LOGIN */}
            {authModalMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="auth-body-content">
                
                {/* Continue with Google */}
                <button
                  type="button"
                  id="btn-google-login"
                  onClick={handleGoogleAuth}
                  disabled={isGoogleLoading || isSubmitting}
                  aria-label="Continue with Google"
                  className="auth-btn-google"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{isGoogleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
                </button>

                {/* Divider */}
                <div className="auth-divider">
                  <div className="auth-divider-line" />
                  <span className="auth-divider-tag">or enter PIN</span>
                  <div className="auth-divider-line" />
                </div>

                <div className="auth-form-group">
                  <label htmlFor="login-nick-input" className="auth-form-label">
                    Username or Email
                  </label>
                  <input
                    id="login-nick-input"
                    type="text"
                    className="auth-form-input"
                    placeholder="e.g. AlexDesign or alex@design.com…"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    required
                    autoFocus
                    autoComplete="username"
                    spellCheck={false}
                  />
                </div>

                <div className="auth-form-group" style={{ marginBottom: '8px' }}>
                  <div className="auth-form-label">
                    <label htmlFor="login-pin-input">6-digit numeric PIN</label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      aria-label={showPin ? 'Hide PIN code' : 'Show PIN code'}
                      className="auth-btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.72rem', gap: '4px' }}
                    >
                      {showPin ? <EyeOff size={12} strokeWidth={2.2} aria-hidden="true" /> : <Eye size={12} strokeWidth={2.2} aria-hidden="true" />}
                      <span>{showPin ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    id="login-pin-input"
                    type={showPin ? 'text' : 'password'}
                    className="auth-form-input pin-input tabular-nums"
                    placeholder="••••••"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    autoComplete="current-password"
                    spellCheck={false}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                  />
                </div>

                {/* Forgot PIN Link */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
                  <button
                    type="button"
                    id="btn-forgot-pin"
                    onClick={() => {
                      setAuthModalMode('forgot_pin');
                      setErrorMessage('');
                      setForgotSuccess('');
                      setForgotEmail(nick.includes('@') ? nick : email || '');
                    }}
                    className="auth-legal-link"
                    style={{ fontSize: '0.78rem' }}
                  >
                    Forgot your PIN code?
                  </button>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-btn-primary"
                >
                  {isSubmitting ? 'Verifying…' : 'Log In to Dashboard →'}
                </button>

                <div className="auth-footer-legal">
                  <button
                    type="button"
                    onClick={() => handleOpenLegal('overview')}
                    className="auth-legal-link"
                    style={{ fontWeight: 600 }}
                  >
                    Protected by 256-bit encryption
                  </button>
                  {' '}&bull;{' '}
                  <button
                    type="button"
                    onClick={() => handleOpenLegal('privacy')}
                    className="auth-legal-link"
                  >
                    GDPR Privacy
                  </button>
                  {' '}&bull;{' '}
                  <button
                    type="button"
                    onClick={() => handleOpenLegal('tos')}
                    className="auth-legal-link"
                  >
                    Terms
                  </button>
                </div>
              </form>
            )}

            {/* FORM 2: REGISTER (Step 1 - Name & Email) */}
            {authModalMode === 'register' && (
              <form onSubmit={handleRegisterRequestSubmit} className="auth-body-content">
                
                {/* Founding VIP Announcement Pill */}
                <div className="auth-vip-card">
                  <div className="auth-vip-star">★</div>
                  <div style={{ lineHeight: 1.35 }}>
                    <strong style={{ display: 'block', fontSize: '0.82rem', letterSpacing: '-0.01em', color: 'var(--ink)' }}>
                      VIP Launch Active (First 15 Designers)
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                      5 active project slots &amp; 100 MB file limit unlocked free for life.
                    </span>
                  </div>
                </div>

                {/* Sign up with Google */}
                <button
                  type="button"
                  id="btn-google-register"
                  onClick={handleGoogleAuth}
                  disabled={isGoogleLoading || isSubmitting}
                  aria-label="Sign up with Google"
                  className="auth-btn-google"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{isGoogleLoading ? 'Connecting to Google…' : 'Sign up with Google'}</span>
                </button>

                {/* Divider */}
                <div className="auth-divider">
                  <div className="auth-divider-line" />
                  <span className="auth-divider-tag">or create with email &amp; PIN</span>
                  <div className="auth-divider-line" />
                </div>

                {referralRef && (
                  <div className="auth-referral-pill">
                    <Sparkles size={15} color="var(--yellow)" aria-hidden="true" />
                    <span>Referred by <strong>{referralRef}</strong> — bonus applied!</span>
                  </div>
                )}

                <div className="auth-form-group">
                  <label htmlFor="register-nick-input" className="auth-form-label">
                    <span>Your Name or Studio Name <span style={{ color: 'var(--orange)' }}>*</span></span>
                  </label>
                  <input
                    id="register-nick-input"
                    type="text"
                    className="auth-form-input"
                    placeholder="e.g. Alex Studio…"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    required
                    autoFocus
                    autoComplete="name"
                  />
                  <span className="auth-input-helper">
                    Shown to your clients in the portal header.
                  </span>
                </div>

                <div className="auth-form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="register-email-input" className="auth-form-label">
                    <span>Your email address <span style={{ color: 'var(--orange)' }}>*</span></span>
                  </label>
                  <input
                    id="register-email-input"
                    type="email"
                    className="auth-form-input"
                    placeholder="you@email.com…"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    spellCheck={false}
                  />
                  <span className="auth-input-helper">
                    We'll email a 6-digit verification code. No spam, ever.
                  </span>
                </div>

                <button
                  id="btn-register-request-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-btn-primary"
                >
                  {isSubmitting ? 'Sending code…' : 'Send Verification PIN →'}
                </button>

                <div className="auth-footer-legal">
                  By signing up, you agree to DropBrief's{' '}
                  <button
                    type="button"
                    onClick={() => handleOpenLegal('tos')}
                    className="auth-legal-link"
                  >
                    Terms of Service
                  </button>
                  {' '}and acknowledge our{' '}
                  <button
                    type="button"
                    onClick={() => handleOpenLegal('privacy')}
                    className="auth-legal-link"
                  >
                    Privacy Policy (GDPR)
                  </button>
                  . 100% cookie-free.
                </div>
              </form>
            )}

            {/* FORM 2B: VERIFY REGISTER PIN (Step 2 - PIN entry with 5m limit) */}
            {authModalMode === 'verify_register_pin' && (
              <form onSubmit={handleVerifyPinSubmit} className="auth-body-content">
                
                {/* Email Confirmation Badge */}
                <div className="auth-email-badge">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <Mail size={16} color="var(--orange)" style={{ flexShrink: 0 }} aria-hidden="true" />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--ink-dim)', display: 'block', fontFamily: 'var(--font-mono)' }}>CODE SENT TO:</span>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--ink)' }} className="truncate">
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
                    className="auth-btn-secondary"
                    style={{ fontSize: '0.74rem', padding: '4px 8px', gap: '4px' }}
                    title="Change email address"
                  >
                    <Edit2 size={12} strokeWidth={2.2} aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* 5-minute Countdown Banner */}
                <div className={`auth-countdown-pill ${timeLeft > 0 ? 'active' : 'expired'}`}>
                  <Clock size={15} strokeWidth={2.5} aria-hidden="true" />
                  <span>
                    {timeLeft > 0 ? (
                      <>Code expires in: <strong className="tabular-nums">{formatTime(timeLeft)}</strong></>
                    ) : (
                      'Code has expired. Please request a new one.'
                    )}
                  </span>
                </div>

                {/* 6-digit PIN Input */}
                <div className="auth-form-group" style={{ marginBottom: '18px' }}>
                  <label htmlFor="verify-pin-input" className="auth-form-label" style={{ justifyContent: 'center' }}>
                    Enter 6-digit PIN from your email
                  </label>
                  <input
                    id="verify-pin-input"
                    type="text"
                    className="auth-form-input pin-input tabular-nums"
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
                  />
                  <span className="auth-input-helper" style={{ textAlign: 'center' }}>
                    This code becomes your permanent access PIN.
                  </span>
                </div>

                {/* Dev Mode Helper (local only) */}
                {pendingRegistration?.devPin && (
                  <div style={{
                    marginBottom: '14px',
                    padding: '8px 10px',
                    background: 'var(--yellow-tint)',
                    border: '2px dashed #111111',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    color: 'var(--ink)',
                    fontWeight: 800,
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    Dev Mode: Your PIN is <strong>{pendingRegistration.devPin}</strong>
                  </div>
                )}

                <button
                  id="btn-verify-pin-submit"
                  type="submit"
                  disabled={isSubmitting || verifyPin.length !== 6 || timeLeft === 0}
                  className="auth-btn-primary"
                  style={{ marginBottom: '14px' }}
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
                    className="auth-btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 10px', gap: '4px' }}
                  >
                    <ArrowLeft size={13} strokeWidth={2.2} aria-hidden="true" />
                    <span>Change details</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendPin}
                    disabled={resendCooldown > 0 || isResending}
                    className="auth-btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '6px 10px', gap: '4px' }}
                  >
                    <RefreshCw size={12} strokeWidth={2.2} className={isResending ? 'spin' : ''} aria-hidden="true" />
                    <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend code'}</span>
                  </button>
                </div>

              </form>
            )}

            {/* FORM 3: FORGOT PIN */}
            {authModalMode === 'forgot_pin' && (
              <form onSubmit={handleForgotPinSubmit} className="auth-body-content">
                <p style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                  Enter your registered email address. We'll generate a secure new 6-digit PIN and send it to your inbox immediately.
                </p>

                {forgotSuccess ? (
                  <div style={{
                    padding: '20px 16px',
                    background: 'var(--emerald-tint)',
                    border: '2px solid var(--emerald)',
                    borderRadius: '6px',
                    color: 'var(--ink)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    marginBottom: '16px',
                    boxShadow: '3px 3px 0px var(--emerald)'
                  }}>
                    <Check size={28} color="var(--emerald)" strokeWidth={2.5} style={{ margin: '0 auto 8px', display: 'block' }} aria-hidden="true" />
                    <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '4px', color: 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: 900 }}>
                      PIN sent to your email
                    </strong>
                    <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                      {forgotSuccess}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode('login');
                        setForgotSuccess('');
                        setErrorMessage('');
                      }}
                      className="auth-btn-primary"
                      style={{ margin: '0 auto' }}
                    >
                      Go to Log In →
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="auth-form-group" style={{ marginBottom: '18px' }}>
                      <label htmlFor="forgot-email-input" className="auth-form-label">
                        <span>Your registered email <span style={{ color: 'var(--orange)' }}>*</span></span>
                      </label>
                      <input
                        id="forgot-email-input"
                        type="email"
                        className="auth-form-input"
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
                      className="auth-btn-primary"
                      style={{ marginBottom: '14px' }}
                    >
                      {isSubmitting ? 'Generating PIN…' : 'Send New PIN to Email →'}
                    </button>

                    <div style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalMode('login');
                          setErrorMessage('');
                          setForgotSuccess('');
                        }}
                        className="auth-btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '4px' }}
                      >
                        <ArrowLeft size={13} strokeWidth={2.2} aria-hidden="true" />
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
