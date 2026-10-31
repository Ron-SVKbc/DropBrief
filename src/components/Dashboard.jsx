import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCadenceBadge, isTodaySubmitted, getRetentionStatus } from '../utils/cadenceUtils';
import { 
  FolderSync, 
  Copy, 
  ExternalLink, 
  BellRing, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Search, 
  Sparkles, 
  FileCheck, 
  FileX, 
  Send, 
  Shield, 
  ShieldCheck, 
  Layers, 
  Calendar, 
  User, 
  Zap, 
  Check, 
  X, 
  TrendingUp, 
  ArrowUpRight, 
  RefreshCw, 
  Eye, 
  Settings,
  ArrowRight
} from 'lucide-react';

export default function Dashboard({ onOpenCreateModal }) {
  const { 
    projects, 
    deleteProject, 
    sendSimulatedReminder, 
    openReminderModal, 
    openExportModal, 
    openClientPortal, 
    openProjectDetail, 
    addToast, 
    currentFreelancer, 
    seedDemoProjectForFreelancer, 
    toggleProjectType, 
    openAccountModal 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [copiedSlug, setCopiedSlug] = useState(null);

  const myProjects = projects.filter((p) => {
    if (!currentFreelancer) return false;
    if (p.freelancerId && p.freelancerId === currentFreelancer.id) return true;
    if (p.freelancerName && p.freelancerName.toLowerCase() === currentFreelancer.nick.toLowerCase()) return true;
    // Built-in demo account Marko has access to sample demo projects
    if (currentFreelancer.id === 'fl-demo-marko' && (p.id === 'proj-alfa' || p.id === 'proj-dental')) return true;
    return false;
  });

  const filteredProjects = myProjects.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const isOneOffSearch = ['one-off', 'oneoff', 'single', 'jednorazove', 'jednorázové'].some((kw) => term.includes(kw));
    const isOngoingSearch = ['ongoing', 'retainer', 'recurring', 'dlhodobe', 'dlhodobé'].some((kw) => term.includes(kw));
    const matchesType = (isOneOffSearch && p.projectType === 'one-off') || (isOngoingSearch && p.projectType === 'ongoing');

    const matchesSearch = 
      p.title.toLowerCase().includes(term) ||
      p.clientName.toLowerCase().includes(term) ||
      p.clientEmail.toLowerCase().includes(term) ||
      (p.projectType && p.projectType.toLowerCase().includes(term)) ||
      matchesType;
    
    if (filterStatus === 'pending') return matchesSearch && p.status !== 'completed';
    if (filterStatus === 'completed') return matchesSearch && p.status === 'completed';
    return matchesSearch;
  });

  const totalProjects = myProjects.length;
  const completedProjects = myProjects.filter((p) => p.status === 'completed').length;
  const pendingProjects = totalProjects - completedProjects;
  const totalMissingItems = myProjects.reduce((acc, p) => {
    return acc + p.items.filter((i) => !i.isCompleted).length;
  }, 0);
  const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

  const copyClientLink = (slug) => {
    const origin = window.location.origin;
    const baseUrl = origin.includes('localhost') || origin.includes('127.0.0.1')
      ? 'https://usedropbrief.xyz'
      : origin;
    const url = `${baseUrl}/?p=${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    addToast('Unique client portal link copied to clipboard!', 'success', 'Link Copied');
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleDownloadAll = (proj) => {
    openExportModal(proj.id || proj);
  };

  return (
    <div className="container" style={{ padding: 'clamp(20px, 3.5vw, 36px) clamp(14px, 2.5vw, 28px) 80px', flex: 1 }}>

      {/* ── Page Header ───────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span className="badge badge-accent" style={{ padding: '4px 11px', gap: '6px' }}>
              <Sparkles size={12} aria-hidden="true" />
              <span style={{ fontWeight: 700 }}>{currentFreelancer?.nick || 'Freelancer'}</span>
            </span>
            <span className="badge badge-neutral" style={{ padding: '4px 9px' }}>Pro Workspace</span>
          </div>

          <h1 style={{ 
            fontSize: 'clamp(1.8rem, 3.2vw, 2.35rem)', 
            fontWeight: 800, 
            letterSpacing: '-0.035em', 
            marginBottom: '6px',
            color: 'var(--text-primary)',
            lineHeight: 1.18
          }}>
            My Projects
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', maxWidth: '580px', lineHeight: 1.55 }}>
            Overview of active client collections. Clients upload via their private link with zero login friction.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            id="btn-create-project-main"
            onClick={onOpenCreateModal} 
            className="btn btn-primary btn-lg btn-pill"
            style={{ boxShadow: 'var(--glow-accent)', alignSelf: 'flex-start', padding: '12px 24px', fontSize: '0.95rem' }}
          >
            <Plus size={18} aria-hidden="true" />
            <span>New Project</span>
          </button>
          
          <button
            id="btn-dashboard-account-settings"
            onClick={openAccountModal}
            className="btn btn-secondary btn-lg btn-pill"
            title="Account settings, security and GDPR deletion"
            style={{ alignSelf: 'flex-start', padding: '12px 20px', fontSize: '0.92rem' }}
          >
            <Settings size={16} aria-hidden="true" />
            <span>Account & GDPR</span>
          </button>
        </div>
      </div>

      {/* ── Bento Metrics Grid ────────────────────────────────── */}
      <div className="bento-grid bento-grid-4 stagger-children" style={{ marginBottom: '32px' }}>

        {/* Metric 1 — Total Active Projects */}
        <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span className="metric-label">Active Projects</span>
            <div style={{
              width: '38px', height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary-bg)',
              color: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              flexShrink: 0
            }}>
              <Layers size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value">{totalProjects}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>Total tracked collections</div>
        </div>

        {/* Metric 2 — Pending Items */}
        <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span className="metric-label">Pending Items</span>
            <div style={{
              width: '38px', height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--warning-border)',
              flexShrink: 0
            }}>
              <Clock size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--warning-text)' }}>{totalMissingItems}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>Awaiting client submission</div>
        </div>

        {/* Metric 3 — Completed Briefs */}
        <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span className="metric-label">Completed Briefs</span>
            <div style={{
              width: '38px', height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--success-border)',
              flexShrink: 0
            }}>
              <CheckCircle2 size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--success-text)' }}>{completedProjects}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>100% ready for kickoff</div>
        </div>

        {/* Metric 4 — Completion Rate */}
        <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <span className="metric-label">Completion Rate</span>
            <div style={{
              width: '38px', height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-cta-bg)',
              color: 'var(--accent-cta)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(234, 88, 12, 0.2)',
              flexShrink: 0
            }}>
              <TrendingUp size={18} aria-hidden="true" />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-cta)' }}>{completionRate}%</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>~{totalProjects * 4} hours saved</div>
        </div>

      </div>

      {/* ── Filter & Search Toolbar ───────────────────────────── */}
      <div className="filter-row" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 320px', maxWidth: '440px' }}>
          <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            id="search-projects-input"
            type="text"
            className="input"
            placeholder="Search projects, clients or emails..."
            aria-label="Search projects, clients or emails"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              paddingLeft: '38px', 
              paddingRight: searchTerm ? '38px' : '14px', 
              fontSize: 'var(--text-sm)',
              borderRadius: 'var(--radius-full)'
            }}
          />
          {searchTerm && (
            <button 
              type="button" 
              onClick={() => setSearchTerm('')} 
              aria-label="Clear search"
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: 'none', 
                border: 'none', 
                color: 'var(--text-tertiary)', 
                cursor: 'pointer', 
                display: 'flex',
                padding: '4px'
              }}
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="segmented-control" role="group" aria-label="Filter projects by status">
          <button
            onClick={() => setFilterStatus('all')}
            aria-pressed={filterStatus === 'all'}
            className={`btn btn-sm btn-pill ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', padding: '6px 14px', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.02em' }}
          >
            All &bull; {totalProjects}
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            aria-pressed={filterStatus === 'pending'}
            className={`btn btn-sm btn-pill ${filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', padding: '6px 14px', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.02em' }}
          >
            Pending &bull; {pendingProjects}
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            aria-pressed={filterStatus === 'completed'}
            className={`btn btn-sm btn-pill ${filterStatus === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', padding: '6px 14px', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.02em' }}
          >
            Completed &bull; {completedProjects}
          </button>
        </div>
      </div>

      {/* ── Projects List ─────────────────────────────────────── */}
      {filteredProjects.length === 0 ? (
        <div className="glass-card empty-state" style={{ padding: '68px 24px', borderRadius: 'var(--radius-xl)' }}>
          <div style={{
            width: '64px', height: '64px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '6px',
            boxShadow: 'var(--shadow-inner-highlight)'
          }}>
            <FolderSync size={28} style={{ color: 'var(--accent-primary-light)' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
              {searchTerm ? 'No matching projects found' : `No projects yet, ${currentFreelancer?.nick || ''}`}
            </h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', maxWidth: '460px', lineHeight: 1.6 }}>
              {searchTerm 
                ? 'Try adjusting your search query or clear the active filter.' 
                : 'Create your first asset collection and send the zero-friction link to your client.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button id="btn-empty-create" onClick={onOpenCreateModal} className="btn btn-primary btn-sm btn-pill">
              <Plus size={16} /> Create Project
            </button>
            {!searchTerm && (
              <button 
                id="btn-empty-seed-demo"
                onClick={seedDemoProjectForFreelancer} 
                className="btn btn-secondary btn-sm btn-pill"
                title="Seed sample test project to explore"
              >
                <Sparkles size={14} color="var(--accent-primary)" /> Sample Project
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredProjects.map((proj) => {
            const completedCount = proj.items.filter((i) => i.isCompleted).length;
            const totalCount = proj.items.length;
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isCompleted = proj.status === 'completed';
            const isLinkCopied = copiedSlug === proj.slug;

            return (
              <div 
                key={proj.id} 
                className="glass-card glass-card-interactive" 
                onClick={() => openProjectDetail(proj.slug)}
                style={{
                  padding: '24px 26px',
                  borderRadius: 'var(--radius-xl)',
                  borderLeft: `4px solid ${isCompleted ? 'var(--success)' : 'var(--accent-primary)'}`,
                  boxShadow: 'var(--shadow-card)',
                  cursor: 'pointer'
                }}
              >
                {/* Project Header Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '14px',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
                    
                    {/* Client Initials Avatar */}
                    <div style={{
                      width: '42px', height: '42px',
                      borderRadius: 'var(--radius-md)',
                      background: isCompleted ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'var(--gradient-brand)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.9rem', color: '#fff',
                      boxShadow: isCompleted ? '0 2px 8px rgba(5, 150, 105, 0.3)' : '0 2px 8px rgba(37, 99, 235, 0.3)',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {proj.clientName ? proj.clientName.charAt(0).toUpperCase() : 'C'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <h2 
                          onClick={(e) => {
                            e.stopPropagation();
                            openProjectDetail(proj.slug);
                          }}
                          style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', cursor: 'pointer' }}
                        >
                          {proj.title}
                        </h2>

                        {/* Engagement Type Badge */}
                        {(proj.projectType === 'ongoing' || proj.project_type === 'ongoing') ? (
                          <button 
                            type="button"
                            id={`btn-toggle-type-${proj.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProjectType(proj.id);
                            }}
                            aria-label={`Change engagement type for ${proj.title}`}
                            className="badge" 
                            style={{ 
                              background: 'rgba(168, 85, 247, 0.16)', 
                              color: '#d8b4fe', 
                              border: '1px solid rgba(168, 85, 247, 0.35)',
                              gap: '5px',
                              fontWeight: 700,
                              fontSize: '0.74rem',
                              padding: '3px 10px',
                              cursor: 'pointer'
                            }}
                            title="Recurring deliverables – click to change engagement type"
                          >
                            <RefreshCw size={11} aria-hidden="true" /> {formatCadenceBadge(proj.cadenceDays || 1)}
                          </button>
                        ) : (
                          <button 
                            type="button"
                            id={`btn-toggle-type-${proj.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProjectType(proj.id);
                            }}
                            aria-label={`Change engagement type for ${proj.title}`}
                            className="badge" 
                            style={{ 
                              background: 'rgba(56, 189, 248, 0.16)', 
                              color: '#7dd3fc', 
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              gap: '5px',
                              fontWeight: 700,
                              fontSize: '0.74rem',
                              padding: '3px 10px',
                              cursor: 'pointer'
                            }}
                            title="One-off project – click to toggle engagement type"
                          >
                            <Zap size={11} aria-hidden="true" /> One-off
                          </button>
                        )}

                        {/* Status Badge */}
                        {(proj.projectType === 'ongoing' || proj.project_type === 'ongoing') ? (
                          isTodaySubmitted(proj) ? (
                            <span className="badge badge-success">
                              <CheckCircle2 size={12} /> Delivered today
                            </span>
                          ) : (
                            <span className="badge badge-warning">
                              <Clock size={12} /> Pending for today
                            </span>
                          )
                        ) : (
                          isCompleted ? (
                            <span className="badge badge-success">
                              <CheckCircle2 size={12} /> Completed
                            </span>
                          ) : (
                            <span className="badge badge-warning">
                              <Clock size={12} /> Waiting for client
                            </span>
                          )
                        )}

                        <span className="badge badge-neutral" style={{ gap: '5px' }}>
                          <BellRing size={11} /> {proj.reminderFrequency}d
                        </span>

                        {(() => {
                          const retention = getRetentionStatus(proj);
                          if (!retention || proj.status !== 'completed') return null;
                          return (
                            <span 
                              className="badge" 
                              style={{ 
                                gap: '5px',
                                background: retention.isPurged ? 'rgba(239, 68, 68, 0.16)' : 'rgba(16, 185, 129, 0.12)',
                                color: retention.isPurged ? '#fca5a5' : 'var(--success-light)',
                                border: retention.isPurged ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--success-border)',
                                fontSize: '0.72rem',
                                padding: '2px 8px'
                              }}
                              title="Automated 30-day retention purge (GDPR Art. 5)"
                            >
                              <ShieldCheck size={11} /> {retention.badgeText}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Meta Information Strip */}
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} />
                          <strong style={{ color: 'var(--text-primary)' }}>{proj.clientName}</strong>
                          <span style={{ color: 'var(--text-secondary)' }}>({proj.clientEmail})</span>
                        </span>
                        
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} />
                          <span>Deadline: <strong style={{ color: 'var(--text-primary)' }}>{proj.deadline}</strong></span>
                        </span>

                        {proj.lastReminderSent && (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>
                            Last reminder: {proj.lastReminderSent}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      id={`btn-copy-link-${proj.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyClientLink(proj.slug);
                      }}
                      aria-label={`Copy client link for ${proj.title}`}
                      className="btn btn-secondary btn-sm btn-pill"
                      title="Copy private link for client"
                    >
                      {isLinkCopied ? <Check size={14} color="var(--success)" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                      <span>{isLinkCopied ? 'Copied!' : 'Copy Link'}</span>
                    </button>

                    <button
                      id={`btn-open-detail-${proj.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openProjectDetail(proj.slug);
                      }}
                      aria-label={`Open overview for ${proj.title}`}
                      className="btn btn-primary btn-sm btn-pill"
                      title="Open project overview and asset management"
                      style={{ gap: '6px' }}
                    >
                      <Eye size={14} aria-hidden="true" />
                      <span>Overview</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete project "${proj.title}"?`)) {
                          deleteProject(proj.id);
                        }
                      }}
                      aria-label={`Delete project ${proj.title}`}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger-light)', padding: '7px 9px', borderRadius: 'var(--radius-full)' }}
                      title="Delete project"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar Row */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      Asset progress: <strong style={{ color: 'var(--text-secondary)' }}>{completedCount} of {totalCount} items</strong>
                    </span>
                    <span style={{ fontWeight: 800, color: isCompleted ? 'var(--success-light)' : 'var(--accent-primary-light)', letterSpacing: '-0.02em' }}>
                      {progressPercent}%
                    </span>
                  </div>
                  <div 
                    className="progress-track"
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Asset submission progress for ${proj.title}: ${progressPercent}%`}
                    style={{ height: '7px' }}
                  >
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${progressPercent}%`,
                        background: isCompleted ? 'var(--success)' : 'var(--gradient-brand)'
                      }} 
                    />
                  </div>
                </div>

                {/* Items Quick Status Strip */}
                <div style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  {proj.items.map((item) => {
                    const fileCount = Array.isArray(item.value?.files) 
                      ? item.value.files.length 
                      : (item.value?.fileName ? 1 : 0);

                    return (
                      <div 
                        key={item.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          fontSize: '0.815rem',
                          color: item.isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)',
                          padding: '2px 0'
                        }}
                      >
                        {item.isCompleted ? (
                          <FileCheck size={15} color="var(--success)" style={{ flexShrink: 0 }} />
                        ) : (
                          <FileX size={15} color="var(--warning)" style={{ flexShrink: 0 }} />
                        )}
                        <span className="truncate">
                          {item.title}
                          {fileCount > 1 && (
                            <span style={{ marginLeft: '6px', fontSize: '0.74rem', color: 'var(--accent-primary-light)', fontWeight: 700 }}>
                              ×{fileCount}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Action Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-hairline)'
                }}>
                  <div>
                    {!isCompleted ? (
                      <button
                        id={`btn-remind-${proj.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openReminderModal(proj.id);
                        }}
                        aria-label={`Send email reminder for ${proj.title}`}
                        className="btn btn-secondary btn-sm btn-pill"
                        style={{ color: 'var(--warning-light)', borderColor: 'var(--warning-border)', fontSize: '0.8rem', gap: '6px' }}
                        title="Preview and send follow-up reminder"
                      >
                        <Send size={13} aria-hidden="true" />
                        <span>{proj.lastReminderSent ? `Send Again (${proj.lastReminderSent})` : 'Send Reminder'}</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: 'var(--success-light)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <CheckCircle2 size={15} aria-hidden="true" /> All assets delivered
                      </span>
                    )}
                  </div>

                  <button
                    id={`btn-download-${proj.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadAll(proj);
                    }}
                    aria-label={`Export assets for ${proj.title} (${completedCount} items)`}
                    className="btn btn-secondary btn-sm btn-pill"
                    style={{ fontSize: '0.8rem', gap: '6px' }}
                  >
                    <Download size={14} aria-hidden="true" />
                    <span>Export ({completedCount} items)</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── Feature Explainer Banner ──────────────────────────── */}
      <div className="glass-card" style={{
        marginTop: '56px',
        padding: '40px 36px',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 60%, #fff7ed 100%)',
        border: '1px solid rgba(37, 99, 235, 0.12)',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto 28px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
            Why clients love submitting via DropBrief
          </h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', lineHeight: 1.55 }}>
            We eliminated all friction and roadblocks that cause clients to delay deliverables.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {[
            { icon: Sparkles, color: 'var(--accent-primary)', bg: 'var(--accent-primary-bg)', border: 'rgba(37, 99, 235, 0.2)',
              title: 'Zero Passwords & No Signups',
              desc: 'Clients click the link and upload immediately. No forgotten passwords, accounts, or friction.' },
            { icon: BellRing, color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)',
              title: 'Automated Friendly Reminders',
              desc: 'The system gently follows up on missing items automatically. No more awkward manual follow-ups.' },
            { icon: Shield, color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)',
              title: 'Bank-Grade Encryption + GDPR',
              desc: 'Files are encrypted AES-256, hosted in the EU (Ireland) with automated 30-day purge.' }
          ].map(({ icon: Icon, color, bg, border, title, desc }) => (
            <div key={title} style={{
              padding: '22px',
              borderRadius: 'var(--radius-lg)',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '40px', height: '40px',
                borderRadius: 'var(--radius-md)',
                background: bg, color, border: `1px solid ${border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px'
              }}>
                <Icon size={20} />
              </div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.015em', color: 'var(--text-primary)' }}>{title}</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-tertiary)', lineHeight: 1.55 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
