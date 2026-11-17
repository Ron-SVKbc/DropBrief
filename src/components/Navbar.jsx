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
import '../styles/navbar-brutalist.css';

export default function Navbar({ onOpenCreateModal }) {
  const { 
    projects,
    currentView, 
    openDashboard, 
    openClientPortal, 
    activeProjectSlug, 
    setIsLegalModalOpen,
    openLegalModal,
    isLiveDb,
    currentFreelancer,
    logoutFreelancer,
    openAuthModal,
    openAccountModal,
    addToast
  } = useApp();

  const [copiedPin, setCopiedPin] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setAvatarError(false);
  }, [currentFreelancer?.avatarUrl]);

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
    <header className="db-navbar-header">
      <div className="container db-navbar-container">
        
        {/* ── Brand Stamp (Matching Landing Page) ───────────── */}
        <button 
          type="button"
          onClick={openDashboard}
          aria-label="DropBrief - Go to main dashboard"
          className="db-nav-brand-btn"
          title="Go to main dashboard"
        >
          {/* Logo stamp */}
          <div className="db-nav-logo-stamp">
            <FolderSync size={16} aria-hidden="true" />
            <span>DROPBRIEF ⚡</span>
          </div>

          <div className="db-nav-brand-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span className="db-nav-brand-kicker">
                STUDIO DISPATCH
              </span>
              {isLiveDb ? (
                <span style={{ 
                  background: '#ECFDF5', 
                  color: '#065F46', 
                  border: '1px solid #10B981', 
                  borderRadius: '2px', 
                  fontSize: '0.62rem', 
                  fontWeight: 800, 
                  padding: '1px 6px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px' 
                }}>
                  <span className="status-dot status-dot-live" style={{ width: '5px', height: '5px' }} aria-hidden="true" />
                  Live EU
                </span>
              ) : (
                <span style={{ 
                  background: '#FFE500', 
                  color: '#111111', 
                  border: '1px solid #111', 
                  borderRadius: '2px', 
                  fontSize: '0.62rem', 
                  fontWeight: 800, 
                  padding: '1px 5px' 
                }}>
                  Free Tier
                </span>
              )}
            </div>
          </div>
        </button>

        {/* ── View Switcher ──────────────────────────────────── */}
        <div className="db-nav-switcher" role="navigation" aria-label="View switcher">
          <button
            id="nav-dashboard-tab"
            type="button"
            onClick={handleDashboardClick}
            className={`db-nav-tab ${(currentView === 'dashboard' || currentView === 'project-detail') ? 'is-active' : ''}`}
          >
            <LayoutDashboard size={13} aria-hidden="true" />
            <span>{currentFreelancer ? (currentView === 'project-detail' ? 'DASHBOARD / BACK' : 'DASHBOARD') : 'FOR FREELANCERS'}</span>
          </button>

          {currentFreelancer ? (
            <div style={{ position: 'relative', flex: 1 }} ref={dropdownRef}>
              <button
                id="nav-client-portal-tab"
                type="button"
                onClick={() => setIsClientDropdownOpen((prev) => !prev)}
                aria-expanded={isClientDropdownOpen}
                aria-haspopup="true"
                aria-label="Select project for client preview"
                className={`db-nav-tab ${currentView === 'client-portal' ? 'is-active' : ''}`}
                style={{ width: '100%', justifyContent: 'space-between' }}
                title="Click to select a project for client preview"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={13} aria-hidden="true" />
                  <span>
                    {currentView === 'client-portal' && currentPortalProject 
                      ? `PREVIEW: ${currentPortalProject.title.length > 14 ? currentPortalProject.title.slice(0, 13) + '...' : currentPortalProject.title}` 
                      : 'CLIENT VIEW'}
                  </span>
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
                  role="menu"
                  aria-label="List of projects for client preview"
                  className="db-nav-dropdown-menu"
                >
                  {/* Dropdown Header */}
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: '2px solid #111111',
                    background: 'var(--yellow-tint, #FFFDE6)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Eye size={13} color="#111111" aria-hidden="true" />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', fontWeight: 800, color: '#111111', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Select Docket for Preview
                      </span>
                    </div>
                    <span style={{ background: '#111', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '2px', fontFamily: 'var(--font-mono)' }}>
                      {projectList.length} {projectList.length === 1 ? 'docket' : 'dockets'}
                    </span>
                  </div>

                  {/* Projects list */}
                  <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '6px' }}>
                    {projectList.length === 0 ? (
                      <div style={{ padding: '16px 12px', textAlign: 'center', color: '#736E66', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                        No dockets created yet.
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
                              borderRadius: '4px',
                              background: isSelected ? 'var(--yellow, #FFE500)' : 'transparent',
                              border: isSelected ? '1.5px solid #111' : '1.5px solid transparent',
                              color: '#111111',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              transition: 'background 0.15s ease',
                              marginBottom: '3px'
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: '0.825rem', fontWeight: 800, color: '#111111' }} className="truncate">
                                {p.title}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#4B4842', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                                <span className="truncate">{p.clientName}</span>
                                <span>•</span>
                                <span style={{ color: isCompleted ? '#065F46' : 'var(--orange)', fontWeight: 700, flexShrink: 0 }}>
                                  {completedCount}/{totalItems} items
                                </span>
                              </div>
                            </div>
                            {isSelected ? (
                              <Check size={14} color="#111111" style={{ flexShrink: 0 }} />
                            ) : (
                              <ExternalLink size={12} color="#736E66" style={{ flexShrink: 0, opacity: 0.7 }} />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer with Demo Sandbox option */}
                  <div style={{
                    padding: '8px 12px',
                    borderTop: '2px solid #111111',
                    background: '#F5F1E8',
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
                        color: '#111111',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: 0
                      }}
                    >
                      <Sparkles size={12} color="var(--orange)" />
                      <span>Interactive Client Sandbox</span>
                    </button>

                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#736E66', fontWeight: 700 }}>
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
              className={`db-nav-tab ${currentView === 'client-portal' ? 'is-active' : ''}`}
              title="Experience what your client sees — live interactive test (no password or registration required)"
            >
              <Eye size={13} aria-hidden="true" />
              <span>CLIENT TEST PORTAL</span>
            </button>
          )}
        </div>

        {/* ── Right Actions ──────────────────────────────────── */}
        <div className="db-nav-actions">
          
          <button
            id="btn-security-info"
            onClick={() => openLegalModal('overview')}
            aria-label="Data security and GDPR information"
            className="db-nav-gdpr-btn"
            title="Data security & GDPR information"
          >
            <ShieldCheck size={14} color="#10B981" aria-hidden="true" />
            <span>GDPR</span>
          </button>

          {currentFreelancer ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

              {/* User profile pill */}
              <div 
                id="btn-nav-account-settings"
                className="db-nav-user-pill"
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
                {currentFreelancer.avatarUrl && !avatarError ? (
                  <img 
                    src={currentFreelancer.avatarUrl} 
                    alt={currentFreelancer.nick} 
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                    style={{
                      width: '22px', 
                      height: '22px',
                      borderRadius: '3px',
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: '1px solid #111111'
                    }} 
                  />
                ) : (
                  <div 
                    style={{
                      width: '22px', 
                      height: '22px',
                      borderRadius: '3px',
                      background: 'var(--yellow, #FFE500)',
                      border: '1px solid #111111',
                      display: 'flex',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 900, 
                      fontSize: '0.72rem', 
                      color: '#111111',
                      flexShrink: 0
                    }} 
                    aria-hidden="true"
                  >
                    {(currentFreelancer.nick || 'F').charAt(0).toUpperCase()}
                  </div>
                )}
                <strong style={{ color: '#111111', fontWeight: 800 }}>@{currentFreelancer.nick}</strong>
                
                {/* Google user badge */}
                {currentFreelancer.authProvider === 'google' ? (
                  <span
                    title="Signed in with Google"
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #111',
                      borderRadius: '2px',
                      padding: '1px 5px',
                      fontSize: '0.68rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      color: '#111'
                    }}
                  >
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
                      background: 'var(--yellow, #FFE500)',
                      border: '1px solid #111',
                      color: '#111',
                      borderRadius: '2px',
                      padding: '1px 6px',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '3px',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {copiedPin ? <Check size={10} color="#15803D" aria-hidden="true" /> : <KeyRound size={10} color="#111" aria-hidden="true" />}
                    <span>{currentFreelancer.pin}</span>
                  </button>
                ) : null}

                <span 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderLeft: '1.5px solid #111111',
                    paddingLeft: '6px',
                    marginLeft: '2px',
                    color: '#111111'
                  }}
                  title="Account Settings & GDPR"
                >
                  <Settings size={14} aria-hidden="true" />
                </span>
              </div>

              {/* New project button */}
              <button
                id="btn-nav-new-project"
                type="button"
                onClick={onOpenCreateModal}
                className="db-nav-new-btn"
              >
                <Plus size={15} aria-hidden="true" />
                <span className="db-nav-new-text">NEW DOCKET</span>
              </button>

              {/* Logout */}
              <button
                id="btn-nav-logout"
                type="button"
                onClick={logoutFreelancer}
                aria-label="Log out of account"
                className="db-nav-logout-btn"
                title="Log out"
              >
                <LogOut size={14} aria-hidden="true" />
              </button>

            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                id="btn-nav-login"
                type="button"
                onClick={() => openAuthModal('login')}
                className="db-nav-tab"
              >
                <KeyRound size={13} aria-hidden="true" />
                <span>LOG IN</span>
              </button>

              <button
                id="btn-nav-register"
                type="button"
                onClick={() => openAuthModal('register')}
                className="db-nav-new-btn"
              >
                <Plus size={14} aria-hidden="true" />
                <span>START FREE</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
