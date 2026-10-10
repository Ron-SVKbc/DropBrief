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
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(7, 9, 14, 0.82)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      transition: 'var(--transition)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '14px',
        paddingBottom: '14px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        
        {/* Brand Identity */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer',
            userSelect: 'none'
          }} 
          onClick={openDashboard}
          title="Prejsť na hlavný prehľad"
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'var(--transition)'
          }}>
            <FolderSync size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontSize: '1.25rem', 
                fontWeight: 800, 
                letterSpacing: '-0.03em', 
                color: 'var(--text-primary)',
                background: 'linear-gradient(180deg, #ffffff 30%, #cbd5e1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                DropBrief
              </span>

              {isLiveDb ? (
                <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 8px', gap: '5px' }}>
                  <span className="status-dot status-dot-live"></span>
                  Cloud Live
                </span>
              ) : (
                <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                  <Zap size={10} /> 0 € Stack
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1, marginTop: '2px' }}>
              Automatizovaný zber podkladov
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (Segmented Control) */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '4px',
          gap: '4px',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
        }}>
          <button
            id="nav-dashboard-tab"
            onClick={handleDashboardClick}
            className={`btn btn-sm btn-pill ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              border: currentView === 'dashboard' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
              padding: '6px 14px',
              fontSize: '0.8125rem'
            }}
          >
            <LayoutDashboard size={14} />
            {currentFreelancer ? 'Môj Dashboard' : 'Dashboard freelancera'}
          </button>
          <button
            id="nav-client-portal-tab"
            onClick={() => openClientPortal(activeProjectSlug || 'restauracia-alfa')}
            className={`btn btn-sm btn-pill ${currentView === 'client-portal' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              border: currentView === 'client-portal' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
              padding: '6px 14px',
              fontSize: '0.8125rem'
            }}
          >
            <ExternalLink size={14} />
            Pohľad klienta
          </button>
        </div>

        {/* Right Section: Auth & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          <button
            id="btn-security-info"
            onClick={() => setIsLegalModalOpen(true)}
            className="btn btn-secondary btn-sm btn-pill"
            title="Bezpečnosť dát a GDPR informácie"
            style={{ gap: '6px' }}
          >
            <ShieldCheck size={15} color="var(--success)" />
            <span style={{ fontSize: '0.8rem' }}>
              GDPR & Bezpečnosť
            </span>
          </button>

          {/* IF LOGGED IN FREELANCER */}
          {currentFreelancer ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              
              {/* User Profile Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 10px 4px 5px',
                fontSize: '0.825rem',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  color: '#fff',
                  boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)'
                }}>
                  {currentFreelancer.nick.charAt(0).toUpperCase()}
                </div>
                <strong style={{ color: 'var(--text-primary)' }}>{currentFreelancer.nick}</strong>
                
                {/* PIN Code Badge with Copy */}
                {currentFreelancer.pin && (
                  <button
                    type="button"
                    onClick={handleCopyMyPin}
                    title="Kliknite pre skopírovanie vášho PIN kódu"
                    style={{
                      background: 'rgba(99, 102, 241, 0.16)',
                      border: '1px solid var(--border-active)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 7px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'var(--transition)'
                    }}
                  >
                    {copiedPin ? <Check size={11} color="var(--success)" /> : <KeyRound size={11} color="var(--accent-primary)" />}
                    {currentFreelancer.pin}
                  </button>
                )}
              </div>

              {/* Create Project Button */}
              <button
                id="btn-nav-new-project"
                onClick={onOpenCreateModal}
                className="btn btn-primary btn-sm btn-pill"
              >
                <Plus size={15} />
                Nový projekt
              </button>

              {/* Logout Button */}
              <button
                id="btn-nav-logout"
                onClick={logoutFreelancer}
                className="btn btn-secondary btn-sm"
                title="Odhlásiť sa z dashboardu"
                style={{ padding: '7px 9px', color: 'var(--text-muted)', borderRadius: 'var(--radius-full)' }}
              >
                <LogOut size={15} />
              </button>

            </div>
          ) : (
            /* IF NOT LOGGED IN */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                id="btn-nav-login"
                onClick={() => openAuthModal('login')}
                className="btn btn-secondary btn-sm btn-pill"
              >
                <KeyRound size={14} />
                Prihlásiť sa
              </button>

              <button
                id="btn-nav-register"
                onClick={() => openAuthModal('register')}
                className="btn btn-primary btn-sm btn-pill"
                style={{ boxShadow: 'var(--accent-glow)' }}
              >
                <Plus size={14} />
                Založiť účet
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
