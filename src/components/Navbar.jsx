import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  FolderSync, 
  Plus, 
  ShieldCheck, 
  ExternalLink, 
  LayoutDashboard,
  Sparkles
} from 'lucide-react';

export default function Navbar({ onOpenCreateModal }) {
  const { currentView, openDashboard, openClientPortal, activeProjectSlug, setIsLegalModalOpen, isLiveDb } = useApp();

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '14px 0'
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
            onClick={openDashboard}
            className={`btn btn-sm ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            <LayoutDashboard size={15} />
            Freelancer Dashboard
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

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="btn-security-info"
            onClick={() => setIsLegalModalOpen(true)}
            className="btn btn-secondary btn-sm"
            title="Bezpečnosť dát a GDPR informácie"
          >
            <ShieldCheck size={16} color="var(--success)" />
            <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } }}>
              Bezpečnosť & GDPR
            </span>
          </button>

          <button
            id="btn-new-project"
            onClick={onOpenCreateModal}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} />
            Nový projekt
          </button>
        </div>

      </div>
    </header>
  );
}
