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
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  AlertCircle,
  Eye, 
  EyeOff,
  Mail,
  Clock,
  RefreshCw,
  Edit2
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
    requestRegisterPin,
    verifyRegisterPin,
    resendRegisterPin,
    resetFreelancerPin,
    addToast
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
  const [isResending, setIsResending] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // 5-minute countdown and resend cooldown
  const [timeLeft, setTimeLeft] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(30);

  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage('');
      setForgotSuccess('');
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
          maxWidth: '510px',
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
          position: 'relative'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '22px 26px',
          borderBottom: '1px solid var(--border-hairline)',
          background: 'var(--bg-base)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
            }}>
              <KeyRound size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 id="auth-modal-title" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {authModalMode === 'pin_reveal' ? '🎉 Your account is ready!' : 
                 authModalMode === 'verify_register_pin' ? 'Verify Email (Enter PIN)' :
                 authModalMode === 'register' ? 'New Freelancer Account' : 
                 authModalMode === 'forgot_pin' ? 'Reset PIN Code' : 'Log In to Dashboard'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {authModalMode === 'pin_reveal' ? 'Your account is verified and ready' :
                 authModalMode === 'verify_register_pin' ? 'Enter the 6-digit PIN sent to your email (valid for 5 minutes)' :
                 authModalMode === 'register' ? 'Verified and secure account in under a minute' : 
                 authModalMode === 'forgot_pin' ? 'Enter your registered email to receive a new PIN' : 'Enter your name / email and 6-digit PIN'}
              </span>
            </div>
          </div>

          <button 
            id="btn-close-auth-modal"
            onClick={closeAuthModal}
            aria-label="Close authentication modal"
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* PIN REVEAL STATE (Success Screen) */}
        {authModalMode === 'pin_reveal' && authRegisteredData && (
          <div style={{ padding: '32px 26px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--success)',
              marginBottom: '18px',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)'
            }}>
              <Sparkles size={30} />
            </div>

            <h4 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>
              Welcome to DropBrief, {authRegisteredData.nick}!
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '22px', lineHeight: 1.5 }}>
              Your email was verified and your account is active. Your verified 6-digit PIN code serves as your permanent password for future logins:
            </p>

            {/* Glowing PIN Display Box */}
            <div style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
              border: '1px solid rgba(37, 99, 235, 0.4)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px 20px',
              marginBottom: '24px',
              boxShadow: '0 12px 30px rgba(37, 99, 235, 0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <span style={{ fontSize: '0.72rem', color: '#e0e7ff', display: 'block', marginBottom: '10px', letterSpacing: '0.1em', fontWeight: 800 }}>
                YOUR PERMANENT ACCESS PIN
              </span>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '3rem',
                fontWeight: 800,
                letterSpacing: '12px',
                color: '#fff',
                textShadow: '0 0 24px rgba(129, 140, 248, 0.9)',
                marginBottom: '18px'
              }}>
                {authRegisteredData.pin}
              </div>

              <button
                id="btn-copy-pin"
                type="button"
                onClick={() => handleCopyPin(authRegisteredData.pin)}
                aria-label="Copy PIN code to clipboard"
                className={`btn btn-sm btn-pill ${copiedPin ? 'btn-primary' : 'btn-secondary'}`}
                style={{ margin: '0 auto', fontSize: '0.85rem', padding: '8px 20px', gap: '6px' }}
              >
                {copiedPin ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                {copiedPin ? 'Copied!' : 'Copy PIN Code'}
              </button>
            </div>

            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
              textAlign: 'left',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              marginBottom: '26px'
            }}>
              <ShieldCheck size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--warning)' }}>Login Tip:</strong> This PIN code has been sent to your email inbox (<strong>{authRegisteredData.email}</strong>). You can log in anytime by entering your name or email along with this PIN code.
              </div>
            </div>

            <button
              id="btn-enter-dashboard"
              type="button"
              onClick={closeAuthModal}
              className="btn btn-primary btn-lg btn-pill"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Enter Dashboard <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* REGULAR FORMS (LOGIN / REGISTER / VERIFY_REGISTER_PIN / FORGOT_PIN) */}
        {authModalMode !== 'pin_reveal' && (
          <div>
            {/* Tabs Switcher (shown only for login and initial register) */}
            {authModalMode !== 'forgot_pin' && authModalMode !== 'verify_register_pin' && (
              <div style={{
                display: 'flex',
                background: 'var(--bg-base)',
                padding: '6px',
                borderBottom: '1px solid var(--border-hairline)',
                gap: '6px'
              }}>
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('login'); setErrorMessage(''); setForgotSuccess(''); }}
                  className={`btn btn-sm btn-pill ${authModalMode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, border: 'none', justifyContent: 'center', padding: '8px' }}
                >
                  <LogIn size={15} /> Log In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('register'); setErrorMessage(''); setForgotSuccess(''); }}
                  className={`btn btn-sm btn-pill ${authModalMode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, border: 'none', justifyContent: 'center', padding: '8px' }}
                >
                  <UserPlus size={15} /> Sign Up Free
                </button>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div style={{
                margin: '18px 26px 0',
                padding: '12px 16px',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger-text)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontWeight: 500
              }}>
                <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* FORM 1: LOGIN */}
            {authModalMode === 'login' && (
              <form onSubmit={handleLoginSubmit} style={{ padding: '26px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="login-nick-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Your Name / Nickname or Email
                  </label>
                  <input
                    id="login-nick-input"
                    type="text"
                    className="input"
                    placeholder="e.g. AlexDesign or alex@design.com"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label htmlFor="login-pin-input" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      6-digit numeric PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      aria-label={showPin ? 'Hide PIN code' : 'Show PIN code'}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {showPin ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
                      {showPin ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    id="login-pin-input"
                    type={showPin ? 'text' : 'password'}
                    className="input"
                    placeholder="123456"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.3rem',
                      letterSpacing: '6px',
                      textAlign: 'center'
                    }}
                  />
                </div>

                {/* Forgot PIN Link */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
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
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                      opacity: 0.95
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
                  {isSubmitting ? 'Verifying...' : 'Log In to Dashboard'}
                </button>
              </form>
            )}

            {/* FORM 2: REGISTER (Step 1 - Name & Email) */}
            {authModalMode === 'register' && (
              <form onSubmit={handleRegisterRequestSubmit} style={{ padding: '26px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="register-nick-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Your Name or Studio Name <span style={{ color: 'var(--accent-primary)' }}>*</span>
                  </label>
                  <input
                    id="register-nick-input"
                    type="text"
                    className="input"
                    placeholder="e.g. AlexDesign or AlfaStudio"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    Your clients will see this name in the portal header.
                  </span>
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <label htmlFor="register-email-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Your email for verification and login <span style={{ color: 'var(--accent-primary)' }}>*</span>
                  </label>
                  <input
                    id="register-email-input"
                    type="email"
                    className="input"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '5px', lineHeight: 1.45 }}>
                    🔒 We'll send a 6-digit verification PIN valid for 5 minutes to this email. No spam, ever.
                  </span>
                </div>

                <div style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid var(--border-active)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 16px',
                  marginBottom: '24px',
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '4px' }}>
                    <KeyRound size={15} /> Secure Two-Factor Email Verification
                  </div>
                  We will send a code to your email that you'll enter in the next step. Once verified, this code becomes your permanent access PIN.
                </div>

                <button
                  id="btn-register-request-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg btn-pill"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isSubmitting ? 'Generating & sending PIN...' : 'Send Verification PIN →'}
                </button>
              </form>
            )}

            {/* FORM 2B: VERIFY REGISTER PIN (Step 2 - PIN entry with 5m limit) */}
            {authModalMode === 'verify_register_pin' && (
              <form onSubmit={handleVerifyPinSubmit} style={{ padding: '26px' }}>
                {/* Email Confirmation Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid var(--border-active)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <Mail size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Code sent to:</span>
                      <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{pendingRegistration?.email || email}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('register');
                      setErrorMessage('');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem', padding: '4px 8px', gap: '4px' }}
                    title="Change email"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                </div>

                {/* 5-minute Countdown Banner */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: timeLeft > 0 ? 'rgba(99, 102, 241, 0.1)' : 'rgba(239, 68, 68, 0.12)',
                  border: timeLeft > 0 ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(239, 68, 68, 0.35)',
                  marginBottom: '22px'
                }}>
                  <Clock size={16} color={timeLeft > 0 ? 'var(--accent-primary)' : 'var(--danger)'} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: timeLeft > 0 ? 'var(--text-primary)' : '#fca5a5' }}>
                    {timeLeft > 0 ? (
                      <>Code expires in: <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', letterSpacing: '1px', color: 'var(--accent-primary)' }}>{formatTime(timeLeft)}</strong></>
                    ) : (
                      'Code has expired. Please request a new one.'
                    )}
                  </span>
                </div>

                {/* 6-digit PIN Input */}
                <div style={{ marginBottom: '22px' }}>
                  <label htmlFor="verify-pin-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
                    Enter the 6-digit PIN from your email
                  </label>
                  <input
                    id="verify-pin-input"
                    type="text"
                    className="input"
                    placeholder="• • • • • •"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={verifyPin}
                    onChange={(e) => setVerifyPin(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    autoFocus
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.8rem',
                      letterSpacing: '10px',
                      textAlign: 'center',
                      fontWeight: 800,
                      padding: '14px',
                      background: '#ffffff',
                      borderColor: verifyPin.length === 6 ? 'var(--accent-primary)' : 'var(--border-medium)',
                      boxShadow: verifyPin.length === 6 ? '0 0 15px rgba(37, 99, 235, 0.2)' : 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginTop: '6px', textAlign: 'center' }}>
                    💡 This PIN will serve as your permanent access code for logging in.
                  </span>
                </div>

                {/* Dev Mode Helper (local only without Resend key) */}
                {pendingRegistration?.devPin && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '8px 12px',
                    background: 'rgba(234, 179, 8, 0.12)',
                    border: '1px dashed #d97706',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: 'var(--warning-text)',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}>
                    🔧 Dev Mode: Your PIN code is <strong>{pendingRegistration.devPin}</strong>
                  </div>
                )}

                {/* Submit button */}
                <button
                  id="btn-verify-pin-submit"
                  type="submit"
                  disabled={isSubmitting || verifyPin.length !== 6 || timeLeft === 0}
                  className="btn btn-primary btn-lg btn-pill"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}
                >
                  {isSubmitting ? 'Verifying & creating account...' : 'Verify PIN & Create Account →'}
                </button>

                {/* Resend and Back Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
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
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <ArrowLeft size={13} /> Change details
                  </button>

                  <button
                    type="button"
                    onClick={handleResendPin}
                    disabled={resendCooldown > 0 || isResending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent-primary)',
                      fontSize: '0.8rem',
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      textDecoration: resendCooldown > 0 ? 'none' : 'underline'
                    }}
                  >
                    <RefreshCw size={12} className={isResending ? 'spin' : ''} />
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend code'}
                  </button>
                </div>
              </form>
            )}

            {/* FORM 3: FORGOT PIN */}
            {authModalMode === 'forgot_pin' && (
              <form onSubmit={handleForgotPinSubmit} style={{ padding: '26px' }}>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid var(--warning-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5
                }}>
                  <strong style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <KeyRound size={15} /> Reset Forgotten PIN Code
                  </strong>
                  Enter the email you used when signing up. The system will generate a secure new 6-digit PIN and send it to your inbox immediately.
                </div>

                {forgotSuccess ? (
                  <div style={{
                    padding: '22px 18px',
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--success-text)',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}>
                    <Check size={32} color="var(--success)" style={{ margin: '0 auto 10px', display: 'block' }} />
                    <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                      Email with new PIN has been sent!
                    </strong>
                    <p style={{ margin: '0 0 18px', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
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
                    <div style={{ marginBottom: '22px' }}>
                      <label htmlFor="forgot-email-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Your registered email <span style={{ color: 'var(--accent-primary)' }}>*</span>
                      </label>
                      <input
                        id="forgot-email-input"
                        type="email"
                        className="input"
                        placeholder="you@email.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    <button
                      id="btn-forgot-submit"
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary btn-lg btn-pill"
                      style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}
                    >
                      {isSubmitting ? 'Generating & sending new PIN...' : 'Send New PIN to Email'}
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
                          fontSize: '0.825rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <ArrowLeft size={14} /> Back to Log In
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
