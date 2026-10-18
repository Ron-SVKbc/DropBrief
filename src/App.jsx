import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ClientPortal from './components/ClientPortal';
import ProjectDetailView from './components/ProjectDetailView';
import WelcomeView from './components/WelcomeView';
import CreateProjectModal from './components/CreateProjectModal';
import EmailPreviewModal from './components/EmailPreviewModal';
import ExportModal from './components/ExportModal';
import LegalModal from './components/LegalModal';
import AuthModal from './components/AuthModal';
import AccountModal from './components/AccountModal';
import ToastContainer from './components/ToastContainer';
import { FolderSync, ShieldCheck, Lock, Zap } from 'lucide-react';

export default function App() {
  const { 
    currentView, 
    setCurrentView, 
    setActiveProjectSlug, 
    openClientPortal, 
    currentFreelancer,
    setIsLegalModalOpen
  } = useApp();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check URL query parameters and Hash for direct client portal links
  useEffect(() => {
    const handleUrlRoute = () => {
      // 1. Check Query Params (?p=slug or ?project=slug)
      const searchParams = new URLSearchParams(window.location.search);
      const querySlug = searchParams.get('p') || searchParams.get('project');
      if (querySlug) {
        openClientPortal(querySlug);
        return;
      }

      // 2. Check URL Hash (#client-portal?p=slug or #p=slug)
      const hash = window.location.hash;
      if (hash.startsWith('#client-portal') || hash.startsWith('#p=')) {
        const queryString = hash.includes('?') ? hash.split('?')[1] : hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(queryString);
        const hashSlug = hashParams.get('p') || hashParams.get('project');
        if (hashSlug) {
          openClientPortal(hashSlug);
        }
      }
    };

    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);
    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('popstate', handleUrlRoute);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      
      {/* Accessibility: Skip to Main Content Link (WCAG 2.4.1) */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Top Navigation */}
      <Navbar onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      {/* Main View Display */}
      <main id="main-content" tabIndex={-1} style={{ flex: 1, display: 'flex', flexDirection: 'column', outline: 'none' }}>
        {currentView === 'client-portal' ? (
          /* Client portal is 100% accessible to anyone with the link - Zero friction */
          <ClientPortal />
        ) : currentView === 'project-detail' ? (
          /* Dedicated freelancer view: Project overview, delivered assets & element management */
          <ProjectDetailView />
        ) : currentFreelancer ? (
          /* Logged in freelancer sees their private Dashboard */
          <Dashboard onOpenCreateModal={() => setIsCreateModalOpen(true)} />
        ) : (
          /* Unauthenticated visitor sees Welcome Landing page */
          <WelcomeView onOpenCreateModal={() => setIsCreateModalOpen(true)} />
        )}
      </main>

      {/* Modern SaaS Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-hairline)',
        padding: '28px 0 24px',
        background: '#ffffff',
        marginTop: 'auto',
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '0.825rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <FolderSync size={16} aria-hidden="true" />
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>DropBrief</strong> &bull; Client Asset & Brief Collection Micro-SaaS
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="status-dot status-dot-live" aria-hidden="true"></span>
              <span>All systems operational (Frankfurt EU)</span>
            </span>

            <button 
              type="button"
              onClick={() => setIsLegalModalOpen(true)}
              aria-label="GDPR and data privacy information"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.825rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <ShieldCheck size={14} color="var(--success)" aria-hidden="true" />
              GDPR & Security
            </button>

            <span>256-bit SSL</span>
            <span>$0 operational stack</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      <EmailPreviewModal />
      <ExportModal />
      <LegalModal />
      <AuthModal />
      <AccountModal />
      <ToastContainer />

    </div>
  );
}
