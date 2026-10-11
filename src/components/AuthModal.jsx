import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { 
  X, 
  KeyRound, 
  UserCheck, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AuthModal() {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalMode, 
    setAuthModalMode, 
    authRegisteredData,
    loginFreelancer, 
    registerFreelancer, 
    loginAsDemo,
    addToast
  } = useApp();

  const [nick, setNick] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage('');
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

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await loginFreelancer(nick, pin);
      setNick('');
      setPin('');
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your nickname and PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await registerFreelancer(nick, email);
      setNick('');
      setEmail('');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.');
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

  const handleQuickDemo = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await loginAsDemo();
    } catch (err) {
      setErrorMessage(err.message || 'Demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
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
        style={{
          width: '100%',
          maxWidth: '500px',
          background: '#0a0f1d',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 25px rgba(99, 102, 241, 0.16)',
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
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(99, 102, 241, 0.06)'
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
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {authModalMode === 'pin_reveal' ? '🎉 Your Account is Ready!' : 
                 authModalMode === 'register' ? 'New Freelancer Account' : 'Dashboard Login'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {authModalMode === 'pin_reveal' ? 'Save your access PIN code' :
                 authModalMode === 'register' ? 'Create profile in 5 seconds without passwords' : 'Enter your Nickname and 6-digit PIN'}
              </span>
            </div>
          </div>

          <button 
            id="btn-close-auth-modal"
            onClick={closeAuthModal}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
          >
            <X size={16} />
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
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Your account has been created. Here is your unique 6-digit PIN code for simple, passwordless login:
            </p>

            {/* Glowing PIN Display Box */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '2px dashed var(--accent-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px 20px',
              marginBottom: '24px',
              boxShadow: 'var(--accent-glow)'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', letterSpacing: '0.08em', fontWeight: 700 }}>
                YOUR ACCESS PIN CODE
              </span>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2.8rem',
                fontWeight: 800,
                letterSpacing: '10px',
                color: '#fff',
                textShadow: '0 0 20px rgba(99, 102, 241, 0.8)',
                marginBottom: '16px'
              }}>
                {authRegisteredData.pin}
              </div>

              <button
                id="btn-copy-pin"
                type="button"
                onClick={() => handleCopyPin(authRegisteredData.pin)}
                className={`btn btn-sm btn-pill ${copiedPin ? 'btn-primary' : 'btn-secondary'}`}
                style={{ margin: '0 auto', fontSize: '0.85rem', padding: '7px 18px' }}
              >
                {copiedPin ? <Check size={15} /> : <Copy size={15} />}
                {copiedPin ? 'Copied to clipboard!' : 'Copy PIN Code'}
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
                <strong style={{ color: 'var(--warning)' }}>Important:</strong> Keep this PIN safe. Paired with your nickname <strong>{authRegisteredData.nick}</strong>, it lets you log into your dashboard from any device.
              </div>
            </div>

            <button
              id="btn-enter-dashboard"
              type="button"
              onClick={closeAuthModal}
              className="btn btn-primary btn-lg btn-pill"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Enter My Dashboard <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* REGULAR LOGIN / REGISTER FORMS */}
        {authModalMode !== 'pin_reveal' && (
          <div>
            {/* Tabs Switcher */}
            <div style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '6px',
              borderBottom: '1px solid var(--border-subtle)',
              gap: '6px'
            }}>
              <button
                type="button"
                onClick={() => { setAuthModalMode('login'); setErrorMessage(''); }}
                className={`btn btn-sm btn-pill ${authModalMode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, border: 'none', justifyContent: 'center', padding: '8px' }}
              >
                <LogIn size={15} /> Log In
              </button>
              <button
                type="button"
                onClick={() => { setAuthModalMode('register'); setErrorMessage(''); }}
                className={`btn btn-sm btn-pill ${authModalMode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, border: 'none', justifyContent: 'center', padding: '8px' }}
              >
                <UserPlus size={15} /> New Account (Free)
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div style={{
                margin: '18px 26px 0',
                padding: '12px 16px',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* FORM 1: LOGIN */}
            {authModalMode === 'login' && (
              <form onSubmit={handleLoginSubmit} style={{ padding: '26px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Your Nickname / Studio Name
                  </label>
                  <input
                    id="login-nick-input"
                    type="text"
                    className="input"
                    placeholder="e.g. AlexDesign or StudioAlfa"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: '26px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      6-digit numeric PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {showPin ? <EyeOff size={13} /> : <Eye size={13} />}
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

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg btn-pill"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '18px' }}
                >
                  {isSubmitting ? 'Verifying...' : 'Log In to Dashboard'}
                </button>

                {/* Demo Quick Log in */}
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                    Just want to test it quickly?
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickDemo}
                    className="btn btn-secondary btn-sm btn-pill"
                    style={{ margin: '0 auto', fontSize: '0.825rem' }}
                  >
                    <Sparkles size={14} color="var(--accent-primary)" />
                    Enter as Demo Freelancer (123456)
                  </button>
                </div>
              </form>
            )}

            {/* FORM 2: REGISTER */}
            {authModalMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} style={{ padding: '26px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Your Nickname or Studio Name <span style={{ color: 'var(--accent-primary)' }}>*</span>
                  </label>
                  <input
                    id="register-nick-input"
                    type="text"
                    className="input"
                    placeholder="e.g. AlexDesign or StudioAlfa"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    This name will appear on the portal header for your clients.
                  </span>
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Contact Email <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
                  </label>
                  <input
                    id="register-email-input"
                    type="email"
                    className="input"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    Used for notifications when clients upload assets.
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '2px' }}>
                    <KeyRound size={15} /> 100% Passwordless
                  </div>
                  The system will automatically generate a secure 6-digit numeric PIN for instant, easy access.
                </div>

                <button
                  id="btn-register-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg btn-pill"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isSubmitting ? 'Creating account...' : 'Create Account & Generate PIN'}
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
