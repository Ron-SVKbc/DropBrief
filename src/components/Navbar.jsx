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
  Check
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
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10, 13, 20, 0.88)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={openDashboard}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: 'var(--accent-glow)'
          }}>
            <FolderSync size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                DropBrief
              </span>
              {isLiveDb ? (
                <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 8px', gap: '4px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  Cloud Live
                </span>
              ) : (
                <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                  0 € MVP
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1 }}>
              Bezpečný portál zberu podkladov
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          gap: '4px'
        }}>
          <button
            id="nav-dashboard-tab"
            onClick={handleDashboardClick}
            className={`btn btn-sm ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            <LayoutDashboard size={15} />
            {currentFreelancer ? 'Môj Dashboard' : 'Dashboard freelancera'}
          </button>
          <button
            id="nav-client-portal-tab"
            onClick={() => openClientPortal(activeProjectSlug || 'restauracia-alfa')}
            className={`btn btn-sm ${currentView === 'client-portal' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            <ExternalLink size={15} />
            Pohľad klienta
          </button>
        </div>

        {/* Right Section: Auth & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          <button
            id="btn-security-info"
            onClick={() => setIsLegalModalOpen(true)}
            className="btn btn-secondary btn-sm"
            title="Bezpečnosť dát a GDPR informácie"
          >
            <ShieldCheck size={16} color="var(--success)" />
            <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } }}>
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
                padding: '4px 10px 4px 6px',
                fontSize: '0.825rem'
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
                  color: '#fff'
                }}>
                  {currentFreelancer.nick.charAt(0).toUpperCase()}
                </div>
                <strong style={{ color: 'var(--text-primary)' }}>{currentFreelancer.nick}</strong>
                
                {/* PIN Code Badge with Copy */}
                <button
                  type="button"
                  onClick={handleCopyMyPin}
                  title="Kliknite pre skopírovanie vášho PIN kódu"
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid var(--border-active)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px 6px',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedPin ? <Check size={11} color="var(--success)" /> : <KeyRound size={11} color="var(--accent-primary)" />}
                  {currentFreelancer.pin}
                </button>
              </div>

              {/* Create Project Button */}
              <button
                id="btn-nav-new-project"
                onClick={onOpenCreateModal}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} />
                Nový projekt
              </button>

              {/* Logout Button */}
              <button
                id="btn-nav-logout"
                onClick={logoutFreelancer}
                className="btn btn-secondary btn-sm"
                title="Odhlásiť sa z dashboardu"
                style={{ padding: '6px 8px', color: 'var(--text-muted)' }}
              >
                <LogOut size={16} />
              </button>

            </div>
          ) : (
            /* IF NOT LOGGED IN */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                id="btn-nav-login"
                onClick={() => openAuthModal('login')}
                className="btn btn-secondary btn-sm"
              >
                <KeyRound size={15} />
                Prihlásiť sa
              </button>

              <button
                id="btn-nav-register"
                onClick={() => openAuthModal('register')}
                className="btn btn-primary btn-sm"
                style={{ boxShadow: 'var(--accent-glow)' }}
              >
                <Plus size={15} />
                Založiť účet
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
