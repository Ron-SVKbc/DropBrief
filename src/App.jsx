import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ClientPortal from './components/ClientPortal';
import WelcomeView from './components/WelcomeView';
import CreateProjectModal from './components/CreateProjectModal';
import EmailPreviewModal from './components/EmailPreviewModal';
import LegalModal from './components/LegalModal';
import AuthModal from './components/AuthModal';
import ToastContainer from './components/ToastContainer';

export default function App() {
  const { 
    currentView, 
    setCurrentView, 
    setActiveProjectSlug, 
    openClientPortal,
    currentFreelancer 
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Top Navigation */}
      <Navbar onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      {/* Main View Display */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentView === 'client-portal' ? (
          /* Client portal is 100% accessible to anyone with the link - Zero friction */
          <ClientPortal />
        ) : currentFreelancer ? (
          /* Logged in freelancer sees their private Dashboard */
          <Dashboard onOpenCreateModal={() => setIsCreateModalOpen(true)} />
        ) : (
          /* Unauthenticated visitor sees Welcome Landing page */
          <WelcomeView onOpenCreateModal={() => setIsCreateModalOpen(true)} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '24px 0',
        background: 'rgba(10, 13, 20, 0.9)',
        marginTop: 'auto'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            <strong>DropBrief</strong> • Nástroj na bezpečný zber podkladov od klientov
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>0 € prevádzkový stack</span>
            <span>GDPR EÚ Frankfurt</span>
            <span>256-bit SSL</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      <EmailPreviewModal />
      <LegalModal />
      <AuthModal />
      <ToastContainer />

    </div>
  );
}
