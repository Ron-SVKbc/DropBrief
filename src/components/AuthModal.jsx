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

  // 5-minútový odpočet a cooldown pre znovuzaslanie
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

  // Odpočet 5-minútovej platnosti PIN kódu
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

  // Cooldown pre znovuzaslanie kódu (30s)
  useEffect(() => {
    if (!isAuthModalOpen || authModalMode !== 'verify_register_pin') return;
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthModalOpen, authModalMode, pendingRegistration?.challengeToken]);

  // Zatvorenie na Escape klávesu (WCAG 2.1.2)
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
      setErrorMessage(err.message || 'Prihlásenie zlyhalo. Skontrolujte zadané meno/e-mail a PIN kód.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Krok 1: Žiadosť o zaslanie overovacieho PIN kódu na e-mail
  const handleRegisterRequestSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await requestRegisterPin(nick, email);
      setVerifyPin('');
    } catch (err) {
      setErrorMessage(err.message || 'Odoslanie overovacieho kódu zlyhalo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Krok 2: Overenie zadaného PIN kódu a dokončenie registrácie
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
      setErrorMessage(err.message || 'Overenie PIN kódu zlyhalo. Skontrolujte zadaný kód.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Opätovné zaslanie overovacieho PIN kódu
  const handleResendPin = async () => {
    setErrorMessage('');
    setIsResending(true);
    try {
      await resendRegisterPin();
      setVerifyPin('');
    } catch (err) {
      setErrorMessage(err.message || 'Nepodarilo sa znovu odoslať overovací PIN kód.');
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
      setForgotSuccess(res.message || 'Pokiaľ je tento e-mail u nás registrovaný, nový PIN kód bol práve odoslaný do vašej schránky.');
    } catch (err) {
      setErrorMessage(err.message || 'Obnova PIN kódu zlyhala. Skúste to prosím znova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPin = (pinToCopy) => {
    navigator.clipboard.writeText(pinToCopy);
    setCopiedPin(true);
    addToast('PIN kód bol skopírovaný do schránky!', 'success', 'Skopírované');
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
              <KeyRound size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 id="auth-modal-title" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {authModalMode === 'pin_reveal' ? '🎉 Váš účet je pripravený!' : 
                 authModalMode === 'verify_register_pin' ? 'Overenie e-mailu (Zadajte PIN)' :
                 authModalMode === 'register' ? 'Nový účet freelancera' : 
                 authModalMode === 'forgot_pin' ? 'Obnova PIN kódu' : 'Prihlásenie do Dashboardu'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {authModalMode === 'pin_reveal' ? 'Váš účet je overený a pripravený' :
                 authModalMode === 'verify_register_pin' ? 'Zadajte 6-miestny PIN odoslaný na váš e-mail (platí 5 minút)' :
                 authModalMode === 'register' ? 'Overený a bezpečný účet za menej ako minútu' : 
                 authModalMode === 'forgot_pin' ? 'Zadajte registrovaný e-mail pre zaslanie nového PINu' : 'Zadajte vaše meno / e-mail a 6-miestny PIN'}
              </span>
            </div>
          </div>

          <button 
            id="btn-close-auth-modal"
            onClick={closeAuthModal}
            aria-label="Zatvoriť prihlasovacie okno"
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
              Vítajte v DropBrief, {authRegisteredData.nick}!
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '22px', lineHeight: 1.5 }}>
              Váš e-mail bol úspešne overený a účet je aktivovaný. Váš overený 6-miestny PIN kód vám ostáva ako váš stály prístupový kód pre prihlásenie:
            </p>

            {/* Glowing PIN Display Box */}
            <div style={{
              background: 'linear-gradient(180deg, rgba(17, 24, 46, 0.75) 0%, rgba(9, 13, 24, 0.95) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.45)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px 20px',
              marginBottom: '24px',
              boxShadow: '0 0 35px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <span style={{ fontSize: '0.72rem', color: '#c7d2fe', display: 'block', marginBottom: '10px', letterSpacing: '0.1em', fontWeight: 800 }}>
                VÁŠ TRVALÝ PRÍSTUPOVÝ PIN KÓD
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
                aria-label="Skopírovať PIN kód do schránky"
                className={`btn btn-sm btn-pill ${copiedPin ? 'btn-primary' : 'btn-secondary'}`}
                style={{ margin: '0 auto', fontSize: '0.85rem', padding: '8px 20px', gap: '6px' }}
              >
                {copiedPin ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                {copiedPin ? 'Skopírované!' : 'Skopírovať PIN kód'}
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
                <strong style={{ color: 'var(--warning)' }}>Tip pre prihlásenie:</strong> Tento PIN kód máte uložený vo svojej e-mailovej schránke (<strong>{authRegisteredData.email}</strong>). Prihlásiť sa môžete kedykoľvek zadaním vášho mena alebo e-mailu a tohto PIN kódu.
              </div>
            </div>

            <button
              id="btn-enter-dashboard"
              type="button"
              onClick={closeAuthModal}
              className="btn btn-primary btn-lg btn-pill"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Vstúpiť do Dashboardu <ArrowRight size={18} />
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
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '6px',
                borderBottom: '1px solid var(--border-subtle)',
                gap: '6px'
              }}>
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('login'); setErrorMessage(''); setForgotSuccess(''); }}
                  className={`btn btn-sm btn-pill ${authModalMode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, border: 'none', justifyContent: 'center', padding: '8px' }}
                >
                  <LogIn size={15} /> Prihlásenie
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('register'); setErrorMessage(''); setForgotSuccess(''); }}
                  className={`btn btn-sm btn-pill ${authModalMode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, border: 'none', justifyContent: 'center', padding: '8px' }}
                >
                  <UserPlus size={15} /> Nový účet (Zadarmo)
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
                  <label htmlFor="login-nick-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Vaše meno / Nickname alebo E-mail
                  </label>
                  <input
                    id="login-nick-input"
                    type="text"
                    className="input"
                    placeholder="napr. AlexDesign alebo alex@design.com"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label htmlFor="login-pin-input" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      6-miestny numerický PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      aria-label={showPin ? 'Skryť PIN kód' : 'Zobraziť PIN kód'}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {showPin ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
                      {showPin ? 'Skryť' : 'Zobraziť'}
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
                    Zabudli ste PIN kód?
                  </button>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg btn-pill"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isSubmitting ? 'Overujem...' : 'Prihlásiť sa do Dashboardu'}
                </button>
              </form>
            )}

            {/* FORM 2: REGISTER (Krok 1 - Meno a E-mail) */}
            {authModalMode === 'register' && (
              <form onSubmit={handleRegisterRequestSubmit} style={{ padding: '26px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="register-nick-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Vaše meno alebo Názov štúdia <span style={{ color: 'var(--accent-primary)' }}>*</span>
                  </label>
                  <input
                    id="register-nick-input"
                    type="text"
                    className="input"
                    placeholder="napr. AlexDesign alebo StudioAlfa"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    Toto meno uvidia vaši klienti v hlavičke portálu.
                  </span>
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <label htmlFor="register-email-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Váš e-mail pre overenie a prihlásenie <span style={{ color: 'var(--accent-primary)' }}>*</span>
                  </label>
                  <input
                    id="register-email-input"
                    type="email"
                    className="input"
                    placeholder="vas@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '5px', lineHeight: 1.45 }}>
                    🔒 Na tento e-mail vám zašleme 6-miestny overovací PIN kód s platnosťou 5 minút. Žiadny marketing ani reklama.
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
                    <KeyRound size={15} /> Bezpečné dvojfázové overenie e-mailu
                  </div>
                  Na zadaný e-mail vám zašleme kód, ktorý opíšete v ďalšom kroku. Tento kód sa po overení stane vaším trvalým prístupovým heslom.
                </div>

                <button
                  id="btn-register-request-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-lg btn-pill"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isSubmitting ? 'Generujem a odosielam PIN...' : 'Zaslať overovací PIN kód →'}
                </button>
              </form>
            )}

            {/* FORM 2B: VERIFY REGISTER PIN (Krok 2 - Zadanie PIN kódu s 5m limitom) */}
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
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Kód odoslaný na:</span>
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
                    title="Zmeniť e-mail"
                  >
                    <Edit2 size={12} /> Upraviť
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
                      <>Platnosť kódu: <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', letterSpacing: '1px', color: 'var(--accent-primary)' }}>{formatTime(timeLeft)}</strong></>
                    ) : (
                      'Platnosť kódu vypršala. Požiadajte o nový kód.'
                    )}
                  </span>
                </div>

                {/* 6-digit PIN Input */}
                <div style={{ marginBottom: '22px' }}>
                  <label htmlFor="verify-pin-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'center' }}>
                    Zadajte 6-miestny PIN kód z e-mailu
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
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderColor: verifyPin.length === 6 ? 'var(--accent-primary)' : 'var(--border-medium)',
                      boxShadow: verifyPin.length === 6 ? '0 0 15px rgba(99, 102, 241, 0.3)' : 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px', textAlign: 'center' }}>
                    💡 Tento PIN kód vám ostáva ako váš stály prístupový kód pre prihlásenie.
                  </span>
                </div>

                {/* Dev Mode Helper (iba lokálne bez Resend kľúča) */}
                {pendingRegistration?.devPin && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '8px 12px',
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px dashed #eab308',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: '#fef08a',
                    textAlign: 'center'
                  }}>
                    🔧 Vývojový režim: Váš PIN kód je <strong>{pendingRegistration.devPin}</strong>
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
                  {isSubmitting ? 'Overujem a vytváram účet...' : 'Overiť PIN a vytvoriť účet →'}
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
                    <ArrowLeft size={13} /> Zmeniť údaje
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
                    {resendCooldown > 0 ? `Zaslať znova (${resendCooldown}s)` : 'Zaslať kód znova'}
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
                    <KeyRound size={15} /> Obnova zabudnutého PIN kódu
                  </strong>
                  Zadajte e-mail, ktorý ste použili pri registrácii. Systém vám vygeneruje nový bezpečný 6-miestny PIN kód a obratom vám ho zašle do schránky.
                </div>

                {forgotSuccess ? (
                  <div style={{
                    padding: '22px 18px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid var(--success-border)',
                    borderRadius: 'var(--radius-md)',
                    color: '#86efac',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}>
                    <Check size={32} color="var(--success)" style={{ margin: '0 auto 10px', display: 'block' }} />
                    <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '6px', color: '#fff' }}>
                      E-mail s novým PINom bol odoslaný!
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
                      Prejsť na prihlásenie
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '22px' }}>
                      <label htmlFor="forgot-email-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Váš registrovaný e-mail <span style={{ color: 'var(--accent-primary)' }}>*</span>
                      </label>
                      <input
                        id="forgot-email-input"
                        type="email"
                        className="input"
                        placeholder="vas@email.com"
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
                      {isSubmitting ? 'Generujem a odosielam nový PIN...' : 'Odoslať nový PIN kód na e-mail'}
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
                        <ArrowLeft size={14} /> Späť na prihlásenie
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
