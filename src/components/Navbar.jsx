import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FolderSync, 
  Plus, 
  ShieldCheck, 
  ExternalLink, 
  LayoutDashboard,
  Sparkles,
  KeyRound,
  LogOut,
  User,
  Copy,
  Check,
  Zap
} from 'lucide-react';

export default function Navbar({ onOpenCreateModal }) {
  const { 
    currentView, 
    openDashboard, 
    openClientPortal, 
    activeProjectSlug, 
    setIsLegalModalOpen,
    isLiveDb,
    currentFreelancer,
    logoutFreelancer,
    openAuthModal,
    addToast
  } = useApp();

  const [copiedPin, setCopiedPin] = useState(false);

  const handleCopyMyPin = () => {
    if (!currentFreelancer?.pin) return;
    navigator.clipboard.writeText(currentFreelancer.pin);
    setCopiedPin(true);
    addToast(`Váš PIN (${currentFreelancer.pin}) bol skopírovaný!`, 'success', 'PIN skopírovaný');
    setTimeout(() => setCopiedPin(false), 2500);
  };

  const handleDashboardClick = () => {
    if (!currentFreelancer) {
      openAuthModal('login');
    } else {
      openDashboard();
    }
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-hairline)',
      background: 'rgba(7, 9, 14, 0.84)',
      backdropFilter: 'blur(22px)',
      WebkitBackdropFilter: 'blur(22px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.45)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        paddingBottom: '12px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        
        {/* ── Brand ─────────────────────────────────────────── */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer',
            userSelect: 'none',
            flexShrink: 0
          }} 
          onClick={openDashboard}
          title="Prejsť na hlavný prehľad"
        >
          {/* Logo mark */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            transition: 'var(--transition)',
            flexShrink: 0
          }}>
            <FolderSync size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ 
                fontSize: '1.15rem', 
                fontWeight: 800, 
                letterSpacing: '-0.035em', 
                background: 'linear-gradient(180deg, #ffffff 20%, #cbd5e1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                DropBrief
              </span>
              {isLiveDb ? (
                <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '2px 7px', gap: '4px' }}>
                  <span className="status-dot status-dot-live" style={{ width: '5px', height: '5px' }} />
                  Live
                </span>
              ) : (
                <span className="badge badge-accent" style={{ fontSize: '0.6rem', padding: '2px 6px', gap: '3px' }}>
                  <Zap size={9} /> 0 €
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', lineHeight: 1, marginTop: '1px' }}>
              Automatizovaný zber podkladov
            </p>
          </div>
        </div>

        {/* ── View Switcher ──────────────────────────────────── */}
        <div className="segmented-control">
          <button
            id="nav-dashboard-tab"
            onClick={handleDashboardClick}
            className={`btn btn-sm btn-pill ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              border: currentView === 'dashboard' ? '1px solid rgba(255,255,255,0.18)' : 'none',
              padding: '5px 13px', fontSize: '0.8rem'
            }}
          >
            <LayoutDashboard size={13} />
            {currentFreelancer ? 'Dashboard' : 'Pre freelancera'}
          </button>
          <button
            id="nav-client-portal-tab"
            onClick={() => openClientPortal(activeProjectSlug || 'restauracia-alfa')}
            className={`btn btn-sm btn-pill ${currentView === 'client-portal' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              border: currentView === 'client-portal' ? '1px solid rgba(255,255,255,0.18)' : 'none',
              padding: '5px 13px', fontSize: '0.8rem'
            }}
          >
            <ExternalLink size={13} />
            Pohľad klienta
          </button>
        </div>

        {/* ── Right Actions ──────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          <button
            id="btn-security-info"
            onClick={() => setIsLegalModalOpen(true)}
            className="btn btn-secondary btn-sm btn-pill"
            title="Bezpečnosť dát a GDPR informácie"
            style={{ gap: '5px' }}
          >
            <ShieldCheck size={14} color="var(--success)" />
            <span style={{ fontSize: '0.78rem' }}>GDPR</span>
          </button>

          {currentFreelancer ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

              {/* User profile pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.038)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-full)',
                padding: '3px 10px 3px 4px',
                fontSize: '0.815rem',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  width: '24px', height: '24px',
                  borderRadius: '50%',
                  background: 'var(--gradient-brand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.7rem', color: '#fff',
                  boxShadow: '0 0 8px rgba(99, 102, 241, 0.4)',
                  flexShrink: 0
                }}>
                  {currentFreelancer.nick.charAt(0).toUpperCase()}
                </div>
                <strong style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{currentFreelancer.nick}</strong>
                
                {/* PIN badge */}
                {currentFreelancer.pin && (
                  <button
                    type="button"
                    onClick={handleCopyMyPin}
                    title="Kliknite pre skopírovanie PIN kódu"
                    style={{
                      background: 'rgba(99, 102, 241, 0.14)',
                      border: '1px solid var(--border-accent)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '1px 6px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '3px',
                      transition: 'var(--transition)',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {copiedPin ? <Check size={10} color="var(--success)" /> : <KeyRound size={10} color="var(--accent-primary)" />}
                    {currentFreelancer.pin}
                  </button>
                )}
              </div>

              {/* New project */}
              <button
                id="btn-nav-new-project"
                onClick={onOpenCreateModal}
                className="btn btn-primary btn-sm btn-pill"
              >
                <Plus size={14} />
                Nový projekt
              </button>

              {/* Logout */}
              <button
                id="btn-nav-logout"
                onClick={logoutFreelancer}
                className="btn btn-secondary btn-sm"
                title="Odhlásiť sa"
                style={{ padding: '6px 8px', color: 'var(--text-tertiary)', borderRadius: 'var(--radius-full)' }}
              >
                <LogOut size={14} />
              </button>

            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                id="btn-nav-login"
                onClick={() => openAuthModal('login')}
                className="btn btn-secondary btn-sm btn-pill"
              >
                <KeyRound size={13} />
                Prihlásiť sa
              </button>

              <button
                id="btn-nav-register"
                onClick={() => openAuthModal('register')}
                className="btn btn-primary btn-sm btn-pill"
                style={{ boxShadow: 'var(--glow-accent)' }}
              >
                <Plus size={13} />
                Registrácia
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
