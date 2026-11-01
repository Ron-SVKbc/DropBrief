import React, { useState, useRef, useEffect } from 'react';
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
  Zap,
  Eye,
  ChevronDown,
  Settings
} from 'lucide-react';

export default function Navbar({ onOpenCreateModal }) {
  const { 
    projects,
    currentView, 
    openDashboard, 
    openClientPortal, 
    activeProjectSlug, 
    setIsLegalModalOpen,
    isLiveDb,
    currentFreelancer,
    logoutFreelancer,
    openAuthModal,
    openAccountModal,
    addToast
  } = useApp();

  const [copiedPin, setCopiedPin] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsClientDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsClientDropdownOpen(false);
      }
    };
    if (isClientDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isClientDropdownOpen]);

  const availableProjects = (projects || []).filter((p) => {
    if (!currentFreelancer) return false;
    if (p.freelancerId && p.freelancerId === currentFreelancer.id) return true;
    if (p.freelancerName && p.freelancerName.toLowerCase() === currentFreelancer.nick.toLowerCase()) return true;
    if (currentFreelancer.email && p.freelancerEmail && p.freelancerEmail.toLowerCase() === currentFreelancer.email.toLowerCase()) return true;
    // Only built-in demo account Marko has access to sample demo projects
    if (currentFreelancer.id === 'fl-demo-marko' && (p.id === 'proj-alfa' || p.id === 'proj-dental')) return true;
    return false;
  });

  const projectList = availableProjects;
  const currentPortalProject = (projects || []).find((p) => p.slug === activeProjectSlug);

  const handleCopyMyPin = () => {
    if (!currentFreelancer?.pin) return;
    navigator.clipboard.writeText(currentFreelancer.pin);
    setCopiedPin(true);
    addToast(`Your PIN (${currentFreelancer.pin}) has been copied!`, 'success', 'PIN Copied');
    setTimeout(() => setCopiedPin(false), 2500);
  };

  const handleDashboardClick = () => {
    if (currentView === 'client-portal' || currentView === 'project-detail') {
      openDashboard();
      return;
    }
    if (!currentFreelancer) {
      openAuthModal('login');
    } else {
      openDashboard();
    }
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 0 var(--border-hairline), 0 2px 12px rgba(15, 23, 42, 0.06)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '10px',
        paddingBottom: '10px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        
        {/* ── Brand ─────────────────────────────────────────── */}
        <button 
          type="button"
          onClick={openDashboard}
          aria-label="DropBrief - Go to main dashboard"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer',
            userSelect: 'none',
            flexShrink: 0,
            background: 'none',
            border: 'none',
            padding: 0,
            textAlign: 'left',
            color: 'inherit',
            font: 'inherit'
          }} 
          title="Go to main dashboard"
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
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            transition: 'var(--transition)',
            flexShrink: 0
          }}>
            <FolderSync size={19} aria-hidden="true" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span style={{ 
                fontSize: '1.12rem', 
                fontWeight: 800, 
                letterSpacing: '-0.035em', 
                color: 'var(--text-primary)'
              }}>
                DropBrief
              </span>
              {isLiveDb ? (
                <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '2px 7px', gap: '4px' }}>
                  <span className="status-dot status-dot-live" style={{ width: '5px', height: '5px' }} aria-hidden="true" />
                  Live
                </span>
              ) : (
                <span className="badge badge-accent" style={{ fontSize: '0.6rem', padding: '2px 6px', gap: '3px' }}>
                  <Zap size={9} aria-hidden="true" /> Free
                </span>
              )}
            </div>
            <p className="navbar-subtitle" style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1, marginTop: '2px' }}>
              Client brief collection tool
            </p>
          </div>
        </button>

        {/* ── View Switcher ──────────────────────────────────── */}
        <div className="segmented-control navbar-segmented" role="navigation" aria-label="View switcher">
          <button
            id="nav-dashboard-tab"
            onClick={handleDashboardClick}
            className={`btn btn-sm btn-pill ${(currentView === 'dashboard' || currentView === 'project-detail') ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              padding: '5px 13px', fontSize: '0.8rem'
            }}
          >
            <LayoutDashboard size={13} aria-hidden="true" />
            {currentFreelancer ? (currentView === 'project-detail' ? 'Dashboard / Back' : 'Dashboard') : 'For Freelancers'}
          </button>

          {currentFreelancer ? (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                id="nav-client-portal-tab"
                type="button"
                onClick={() => setIsClientDropdownOpen((prev) => !prev)}
                aria-expanded={isClientDropdownOpen}
                aria-haspopup="true"
                aria-label="Select project for client preview"
                className={`btn btn-sm btn-pill ${currentView === 'client-portal' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  padding: '5px 12px', 
                  fontSize: '0.8rem',
                  gap: '6px'
                }}
                title="Click to select a project for client preview"
              >
                <Eye size={13} aria-hidden="true" />
                <span>
                  {currentView === 'client-portal' && currentPortalProject 
                    ? `Preview: ${currentPortalProject.title.length > 16 ? currentPortalProject.title.slice(0, 15) + '...' : currentPortalProject.title}` 
                    : 'Client View'}
                </span>
                <ChevronDown 
                  size={12} 
                  aria-hidden="true"
                  style={{ 
                    transform: isClientDropdownOpen ? 'rotate(180deg)' : 'none', 
                    transition: 'transform 0.2s ease',
                    opacity: 0.8
                  }} 
                />
              </button>

              {/* Dropdown Menu for Authenticated Freelancer */}
              {isClientDropdownOpen && (
                <div 
                  className="animate-fade-in"
                  role="menu"
                  aria-label="List of projects for client preview"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    maxWidth: '90vw',
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 100,
                    overflow: 'hidden',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)'
                  }}
                >
                  {/* Dropdown Header */}
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border-hairline)',
                    background: 'var(--accent-primary-bg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Eye size={13} color="var(--accent-primary)" aria-hidden="true" />
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-primary-hover)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Select Project for Preview
                      </span>
                    </div>
                    <span className="badge badge-accent" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                      {projectList.length} {projectList.length === 1 ? 'project' : 'projects'}
                    </span>
                  </div>

                  {/* Projects list */}
                  <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '6px' }}>
                    {projectList.length === 0 ? (
                      <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>
                        No projects created yet.
                      </div>
                    ) : (
                      projectList.map((p) => {
                        const isSelected = activeProjectSlug === p.slug && currentView === 'client-portal';
                        const completedCount = (p.items || []).filter(i => i.isCompleted).length;
                        const totalItems = (p.items || []).length;
                        const isCompleted = p.status === 'completed';

                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              openClientPortal(p.slug);
                              setIsClientDropdownOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-md)',
                              background: isSelected ? 'var(--accent-primary-bg)' : 'transparent',
                              border: isSelected ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid transparent',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              transition: 'background 0.15s ease',
                              marginBottom: '2px'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'rgba(15, 23, 42, 0.04)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }} className="truncate">
                                {p.title}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                <span className="truncate">{p.clientName}</span>
                                <span>&bull;</span>
                                <span style={{ color: isCompleted ? 'var(--success)' : 'var(--warning)', flexShrink: 0 }}>
                                  {completedCount}/{totalItems} items
                                </span>
                              </div>
                            </div>
                            {isSelected ? (
                              <Check size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                            ) : (
                              <ExternalLink size={12} color="var(--text-tertiary)" style={{ flexShrink: 0, opacity: 0.7 }} />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer with Demo Sandbox option */}
                  <div style={{
                    padding: '8px 12px',
                    borderTop: '1px solid var(--border-hairline)',
                    background: 'var(--bg-base)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        openClientPortal('demo-preview');
                        setIsClientDropdownOpen(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '2px 0'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                    >
                      <Sparkles size={11} color="var(--accent-primary)" />
                      <span>Interactive Client Sandbox</span>
                    </button>

                    <span style={{ fontSize: '0.68rem', color: 'var(--text-quaternary)' }}>
                      Zero passwords
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="nav-client-portal-tab"
              type="button"
              onClick={() => openClientPortal('demo-preview')}
              className={`btn btn-sm btn-pill ${currentView === 'client-portal' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '5px 12px', 
                fontSize: '0.8rem',
                gap: '7px',
                position: 'relative'
              }}
              title="Experience what your client sees — live interactive test (no password or registration required)"
            >
              <Eye size={13} aria-hidden="true" />
              <span style={{ fontWeight: currentView === 'client-portal' ? 700 : 600 }}>Client Experience</span>
              <span 
                className="badge badge-glow-interactive" 
                style={{ 
                  fontSize: '0.62rem', 
                  padding: '2px 7px', 
                  gap: '4px',
                  textTransform: 'none',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                <span className="status-dot-pulse" aria-hidden="true" />
                Live Test
              </span>
            </button>
          )}
        </div>

        {/* ── Right Actions ──────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          <button
            id="btn-security-info"
            onClick={() => setIsLegalModalOpen(true)}
            aria-label="Data security and GDPR information"
            className="btn btn-secondary btn-sm btn-pill"
            title="Data security & GDPR information"
            style={{ gap: '5px' }}
          >
            <ShieldCheck size={14} color="var(--success)" aria-hidden="true" />
            <span className="navbar-gdpr-label" style={{ fontSize: '0.78rem' }}>GDPR</span>
          </button>

          {currentFreelancer ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

              {/* User profile pill */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '3px 10px 3px 4px',
                  fontSize: '0.815rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  boxShadow: 'var(--shadow-xs)'
                }}
                onClick={openAccountModal}
                title="User profile and account settings"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openAccountModal();
                  }
                }}
              >
                {currentFreelancer.avatarUrl ? (
                  <img 
                    src={currentFreelancer.avatarUrl} 
                    alt={currentFreelancer.nick} 
                    style={{
                      width: '24px', 
                      height: '24px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: '1px solid var(--border-subtle)'
                    }} 
                  />
                ) : (
                  <div style={{
                    width: '24px', height: '24px',
                    borderRadius: '50%',
                    background: 'var(--gradient-brand)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.7rem', color: '#fff',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)',
                    flexShrink: 0
                  }} aria-hidden="true">
                    {(currentFreelancer.nick || 'F').charAt(0).toUpperCase()}
                  </div>
                )}
                <strong style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{currentFreelancer.nick}</strong>
                
                {/* Google user badge */}
                {currentFreelancer.authProvider === 'google' ? (
                  <span
                    title="Signed in with Google"
                    style={{
                      background: '#f8fafc',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '1px 5px',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Google
                  </span>
                ) : currentFreelancer.pin ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyMyPin();
                    }}
                    aria-label={`Copy PIN code (${currentFreelancer.pin})`}
                    title="Click to copy PIN code"
                    style={{
                      background: 'var(--accent-primary-bg)',
                      border: '1px solid rgba(37, 99, 235, 0.25)',
                      color: 'var(--accent-primary-hover)',
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
                    {copiedPin ? <Check size={10} color="var(--success)" aria-hidden="true" /> : <KeyRound size={10} color="var(--accent-primary)" aria-hidden="true" />}
                    {currentFreelancer.pin}
                  </button>
                ) : null}
              </div>

              {/* New project */}
              <button
                id="btn-nav-new-project"
                onClick={onOpenCreateModal}
                className="btn btn-primary btn-sm btn-pill"
              >
                <Plus size={14} aria-hidden="true" />
                New Project
              </button>

              {/* Account Settings / Profile */}
              <button
                id="btn-nav-account-settings"
                onClick={openAccountModal}
                aria-label="Profile and account settings"
                className="btn btn-secondary btn-sm"
                title="Profile, security, and account deletion"
                style={{ padding: '6px 8px', color: 'var(--text-secondary)', borderRadius: 'var(--radius-full)', borderColor: 'var(--border-subtle)' }}
              >
                <Settings size={14} aria-hidden="true" />
              </button>

              {/* Logout */}
              <button
                id="btn-nav-logout"
                onClick={logoutFreelancer}
                aria-label="Log out of account"
                className="btn btn-secondary btn-sm"
                title="Log out"
                style={{ padding: '6px 8px', color: 'var(--text-tertiary)', borderRadius: 'var(--radius-full)', borderColor: 'var(--border-subtle)' }}
              >
                <LogOut size={14} aria-hidden="true" />
              </button>

            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                id="btn-nav-login"
                onClick={() => openAuthModal('login')}
                className="btn btn-secondary btn-sm btn-pill"
              >
                <KeyRound size={13} aria-hidden="true" />
                Log In
              </button>

              <button
                id="btn-nav-register"
                onClick={() => openAuthModal('register')}
                className="btn btn-primary btn-sm btn-pill"
                style={{ boxShadow: 'var(--glow-accent)' }}
              >
                <Plus size={13} aria-hidden="true" />
                Sign Up Free
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
