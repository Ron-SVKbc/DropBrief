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
  Gift,
  Users,
  Inbox,
  FileCode,
  HardDrive
} from 'lucide-react';
import '../styles/dashboard-brutalist.css';

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
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'completed' | 'ongoing' | 'one-off'
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Filter projects belonging to this authenticated freelancer
  const myProjects = (projects || []).filter((p) => {
    if (!currentFreelancer) return false;
    if (p.freelancerId && p.freelancerId === currentFreelancer.id) return true;
    if (p.freelancerName && p.freelancerName.toLowerCase() === currentFreelancer.nick.toLowerCase()) return true;
    if (currentFreelancer.email && p.freelancerEmail && p.freelancerEmail.toLowerCase() === currentFreelancer.email.toLowerCase()) return true;
    // Built-in demo account Marko has access to sample demo projects
    if (currentFreelancer.id === 'fl-demo-marko' && (p.id === 'proj-alfa' || p.id === 'proj-dental')) return true;
    return false;
  });

  // Tier & Referral data with defensive fallbacks
  const tier = currentFreelancer?.tier || 'free';
  const isVipPro = tier === 'pro';
  const maxProjects = currentFreelancer?.max_projects || currentFreelancer?.maxProjects || (isVipPro ? 5 : 2);
  const referralCount = currentFreelancer?.referral_count ?? currentFreelancer?.referralCount ?? 0;
  const bonusSlots = referralCount * 2;

  const activeProjects = myProjects.filter((p) => p.status !== 'completed');
  const activeProjectsCount = activeProjects.length;
  const usagePercentage = Math.min(100, Math.round((activeProjectsCount / maxProjects) * 100));

  const referralUrl = `https://usedropbrief.xyz/?ref=${encodeURIComponent(currentFreelancer?.nick || '')}`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedInvite(true);
    if (addToast) {
      addToast('Studio referral link copied to clipboard!', 'success', 'Referral');
    }
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  // Search & Filter Logic
  const filteredProjects = myProjects.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const isOneOffSearch = ['one-off', 'oneoff', 'single', 'jednorazove', 'jednorázové'].some((kw) => term.includes(kw));
    const isOngoingSearch = ['ongoing', 'retainer', 'recurring', 'dlhodobe', 'dlhodobé'].some((kw) => term.includes(kw));
    const matchesType = (isOneOffSearch && p.projectType === 'one-off') || (isOngoingSearch && p.projectType === 'ongoing');

    const matchesSearch = 
      p.title.toLowerCase().includes(term) ||
      (p.clientName && p.clientName.toLowerCase().includes(term)) ||
      (p.clientEmail && p.clientEmail.toLowerCase().includes(term)) ||
      (p.projectType && p.projectType.toLowerCase().includes(term)) ||
      matchesType;
    
    if (!matchesSearch) return false;

    if (filterStatus === 'pending') return p.status !== 'completed';
    if (filterStatus === 'completed') return p.status === 'completed';
    if (filterStatus === 'ongoing') return p.projectType === 'ongoing' || p.project_type === 'ongoing';
    if (filterStatus === 'one-off') return p.projectType !== 'ongoing' && p.project_type !== 'ongoing';
    return true;
  });

  // Metrics
  const totalProjects = myProjects.length;
  const completedProjects = myProjects.filter((p) => p.status === 'completed').length;
  const pendingProjects = totalProjects - completedProjects;
  const ongoingProjects = myProjects.filter((p) => p.projectType === 'ongoing' || p.project_type === 'ongoing').length;
  const oneOffProjects = totalProjects - ongoingProjects;

  const totalMissingItems = myProjects.reduce((acc, p) => {
    return acc + (p.items || []).filter((i) => !i.isCompleted).length;
  }, 0);
  const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
  const estimatedHoursSaved = totalProjects * 4;

  const copyClientLink = (slug) => {
    const origin = window.location.origin;
    const baseUrl = origin.includes('localhost') || origin.includes('127.0.0.1')
      ? 'https://usedropbrief.xyz'
      : origin;
    const url = `${baseUrl}/?p=${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    if (addToast) {
      addToast('Client link copied! Paste into WhatsApp or email.', 'success', 'Link Copied');
    }
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleDownloadAll = (proj) => {
    openExportModal(proj.id || proj);
  };

  return (
    <div className="nb-dashboard-page" role="region" aria-label="Freelancer Studio Dashboard">

      <div className="dash-container">

        {/* ── Studio Header & Primary Action Deck ──────────────── */}
        <div className="dash-header-section">
          <div>
            <div className="dash-kicker-badge">
              <Sparkles size={13} aria-hidden="true" />
              <span>STUDIO DISPATCH BOARD // DOCKETS</span>
            </div>

            <h1 className="dash-title">
              CLIENT ASSET DOCKETS
            </h1>

            <p className="dash-subtitle">
              Tactile overview of active client intake portals. Clients upload logos, copy, and assets through their private link with zero passwords and zero friction.
            </p>
          </div>

          <div className="dash-header-actions">
            <button 
              id="btn-create-project-main"
              type="button"
              onClick={onOpenCreateModal} 
              className="btn-tactile-primary"
              aria-label="Create new client asset intake docket"
            >
              <Plus size={18} aria-hidden="true" />
              <span>+ NEW DOCKET</span>
            </button>
            
            <button
              id="btn-dashboard-account-settings"
              type="button"
              onClick={openAccountModal}
              className="btn-tactile-secondary"
              title="Account settings, security PIN, and GDPR data erasure"
              aria-label="Account and GDPR settings"
            >
              <Settings size={16} aria-hidden="true" />
              <span>ACCOUNT &amp; GDPR</span>
            </button>
          </div>
        </div>

        {/* ── Metrics Bento HUD ─────────────────────────────────── */}
        <div className="dash-bento-grid">

          {/* Metric 1 — Total Active Projects */}
          <div className="metric-docket-box">
            <div className="metric-box-top">
              <span className="metric-box-label">TRACKED DOCKETS</span>
              <div className="metric-icon-stamp" style={{ background: 'var(--yellow)' }}>
                <Layers size={16} color="var(--ink)" aria-hidden="true" />
              </div>
            </div>
            <div className="metric-big-number">{totalProjects}</div>
            <div className="metric-box-sub">{activeProjectsCount} active · {completedProjects} completed</div>
          </div>

          {/* Metric 2 — Pending Deliverables */}
          <div className="metric-docket-box" style={{ background: totalMissingItems > 0 ? 'var(--card)' : 'var(--card-alt)' }}>
            <div className="metric-box-top">
              <span className="metric-box-label">PENDING ASSETS</span>
              <div className="metric-icon-stamp" style={{ background: totalMissingItems > 0 ? 'var(--orange)' : '#E5E2D8' }}>
                <Clock size={16} color={totalMissingItems > 0 ? '#FFFFFF' : 'var(--ink)'} aria-hidden="true" />
              </div>
            </div>
            <div className="metric-big-number" style={{ color: totalMissingItems > 0 ? 'var(--orange)' : 'var(--ink)' }}>
              {totalMissingItems}
            </div>
            <div className="metric-box-sub">Awaiting client submission</div>
          </div>

          {/* Metric 3 — Ready for Kickoff */}
          <div className="metric-docket-box">
            <div className="metric-box-top">
              <span className="metric-box-label">100% COMPLETE</span>
              <div className="metric-icon-stamp" style={{ background: 'var(--emerald)' }}>
                <CheckCircle2 size={16} color="#FFFFFF" aria-hidden="true" />
              </div>
            </div>
            <div className="metric-big-number" style={{ color: '#065F46' }}>
              {completedProjects}
            </div>
            <div className="metric-box-sub">{completionRate}% total completion rate</div>
          </div>

          {/* Metric 4 — Hours Saved */}
          <div className="metric-docket-box">
            <div className="metric-box-top">
              <span className="metric-box-label">TIME RECLAIMED</span>
              <div className="metric-icon-stamp" style={{ background: 'var(--ink)' }}>
                <TrendingUp size={16} color="var(--yellow)" aria-hidden="true" />
              </div>
            </div>
            <div className="metric-big-number">
              ~{estimatedHoursSaved}h
            </div>
            <div className="metric-box-sub">Zero email chasing · 0 expired links</div>
          </div>

        </div>

        {/* ── Studio License & Referral Dispatch Terminal ──────── */}
        <div id="referral-tier-card" className="dash-license-terminal">
          
          <div className="terminal-header-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>DISPATCH_LICENSE:</span>
              <span style={{ color: 'var(--ink)', fontWeight: 800 }}>STUDIO WORKSPACE ALLOCATION</span>
            </div>
            <div>
              <span>GDPR ART. 5 RETENTION: 30-DAY AUTO PURGE</span>
            </div>
          </div>

          <div className="terminal-body-grid">
            
            {/* Left Column: Plan, Usage & Referral Incentive */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {isVipPro ? (
                  <span className="terminal-tier-pill terminal-tier-pro">
                    ⭐ VIP FOUNDING PRO
                  </span>
                ) : (
                  <span className="terminal-tier-pill terminal-tier-free">
                    STARTER FREE TIER
                  </span>
                )}

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 800 }}>
                  {activeProjectsCount} / {maxProjects} DOCKET SLOTS USED ({usagePercentage}%)
                </span>
              </div>

              {/* Physical Indented Slot Track */}
              <div 
                className="slot-track-nb"
                role="progressbar"
                aria-valuenow={activeProjectsCount}
                aria-valuemin={0}
                aria-valuemax={maxProjects}
                aria-label="Active docket slot usage"
              >
                <div 
                  className={`slot-fill-nb ${activeProjectsCount >= maxProjects ? 'full' : ''}`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '8px' }}>
                <Gift size={16} color="var(--orange)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                  <strong>Invite a fellow web designer:</strong> You unlock <strong>+2 project slots</strong> &amp; <strong>+50MB storage</strong> for every designer who signs up with your link.
                </p>
              </div>
            </div>

            {/* Right Column: 1-Click Referral Link Box */}
            <div className="referral-box-nb">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '0.74rem', 
                  fontWeight: 800, 
                  letterSpacing: '0.04em', 
                  color: 'var(--ink)' 
                }}>
                  YOUR REFERRAL LINK
                </span>

                <span style={{ 
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem', 
                  fontWeight: 800, 
                  color: referralCount > 0 ? '#065F46' : 'var(--ink-dim)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Users size={13} aria-hidden="true" />
                  Referred: {referralCount} (+{bonusSlots} slots unlocked)
                </span>
              </div>

              <div className="ref-input-group">
                <input 
                  type="text"
                  readOnly
                  value={referralUrl}
                  aria-label="Your personal referral link"
                  onClick={(e) => e.target.select()}
                  className="ref-input-nb"
                />
                <button
                  id="btn-copy-invite-link"
                  type="button"
                  onClick={copyInviteLink}
                  className="btn-tactile-sm"
                  style={{ background: 'var(--yellow)', color: 'var(--ink)', whiteSpace: 'nowrap' }}
                >
                  {copiedInvite ? (
                    <>
                      <Check size={14} aria-hidden="true" />
                      <span>COPIED!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} aria-hidden="true" />
                      <span>COPY LINK</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ── Filter & Search Command Console ─────────────────── */}
        <div className="dash-filter-console">
          
          {/* Architectural Search Input */}
          <div className="dash-search-wrap">
            <Search 
              size={16} 
              aria-hidden="true" 
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-dim)', pointerEvents: 'none' }} 
            />
            <input
              id="search-projects-input"
              type="text"
              className="dash-search-input"
              placeholder="Filter dockets by title, client or email..."
              aria-label="Filter dockets by title, client or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                aria-label="Clear search query"
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--ink-dim)', 
                  cursor: 'pointer', 
                  display: 'flex',
                  padding: '4px'
                }}
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Segmented Tactile Filter Buttons */}
          <div className="dash-segmented-filters" role="group" aria-label="Filter dockets by status and type">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`dash-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            >
              <span>ALL DOCKETS</span>
              <span className="filter-count-badge">{totalProjects}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`dash-filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            >
              <Clock size={12} color={filterStatus === 'pending' ? '#FFE500' : 'var(--orange)'} aria-hidden="true" />
              <span>AWAITING ASSETS</span>
              <span className="filter-count-badge">{pendingProjects}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('completed')}
              className={`dash-filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
            >
              <CheckCircle2 size={12} color={filterStatus === 'completed' ? '#FFE500' : 'var(--emerald)'} aria-hidden="true" />
              <span>100% READY</span>
              <span className="filter-count-badge">{completedProjects}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('ongoing')}
              className={`dash-filter-btn ${filterStatus === 'ongoing' ? 'active' : ''}`}
              title="Recurring monthly or weekly retainer dockets"
            >
              <RefreshCw size={11} aria-hidden="true" />
              <span>RETAINER</span>
              <span className="filter-count-badge">{ongoingProjects}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('one-off')}
              className={`dash-filter-btn ${filterStatus === 'one-off' ? 'active' : ''}`}
              title="One-off client briefs"
            >
              <Zap size={11} aria-hidden="true" />
              <span>ONE-OFF</span>
              <span className="filter-count-badge">{oneOffProjects}</span>
            </button>
          </div>

        </div>

        {/* ── Project Production Dockets Stack ────────────────── */}
        {filteredProjects.length === 0 ? (
          
          /* Empty State — Blueprint Drawing Board */
          <div className="dash-empty-blueprint">
            <div className="empty-blueprint-icon">
              <FolderSync size={32} color="var(--ink)" aria-hidden="true" />
            </div>

            <h3 className="empty-blueprint-title">
              {searchTerm ? 'NO MATCHING DOCKETS FOUND' : `NO ACTIVE DOCKETS IN QUEUE, @${currentFreelancer?.nick || ''}`}
            </h3>

            <p className="empty-blueprint-desc">
              {searchTerm 
                ? 'Try adjusting your search query or clear the active status filter to inspect all dockets.' 
                : 'Create your first asset collection docket. Your client receives a unique zero-login link with zero passwords and zero setup friction.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button 
                id="btn-empty-create" 
                type="button"
                onClick={onOpenCreateModal} 
                className="btn-tactile-primary"
              >
                <Plus size={16} aria-hidden="true" />
                <span>+ CREATE FIRST DOCKET</span>
              </button>

              {!searchTerm && (
                <button 
                  id="btn-empty-seed-demo"
                  type="button"
                  onClick={seedDemoProjectForFreelancer} 
                  className="btn-tactile-secondary"
                  title="Seed sample test project to explore"
                >
                  <Sparkles size={14} color="var(--orange)" aria-hidden="true" />
                  <span>LOAD SAMPLE DOCKET</span>
                </button>
              )}
            </div>
          </div>

        ) : (

          /* Dockets List */
          <div className="dash-dockets-stack">
            {filteredProjects.map((proj) => {
              const completedCount = (proj.items || []).filter((i) => i.isCompleted).length;
              const totalCount = (proj.items || []).length;
              const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              const isCompleted = proj.status === 'completed';
              const isLinkCopied = copiedSlug === proj.slug;
              const isOngoing = proj.projectType === 'ongoing' || proj.project_type === 'ongoing';

              // Unique serial code simulation
              const serialCode = (proj.id || 'proj-000').slice(-5).toUpperCase();

              return (
                <div 
                  key={proj.id} 
                  className="project-docket-card"
                  id={`project-card-${proj.id}`}
                >
                  
                  {/* 1. Perforated Docket Header Strip */}
                  <div className="docket-perforated-strip">
                    <div className="docket-serial-stamp">
                      <span style={{ color: 'var(--orange)', fontWeight: 900 }}>#</span>
                      <span>DKT-{serialCode}</span>
                      <span style={{ opacity: 0.35 }} aria-hidden="true">•</span>
                      <span style={{ color: 'var(--ink-muted)' }}>CADENCE: {proj.reminderFrequency || 3}D</span>
                    </div>

                    <div className="docket-header-tags">
                      
                      {/* Engagement Type Switcher */}
                      {isOngoing ? (
                        <button 
                          type="button"
                          id={`btn-toggle-type-${proj.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProjectType(proj.id);
                          }}
                          aria-label={`Change engagement type for ${proj.title}`}
                          className="badge-stamp badge-stamp-purple badge-stamp-clickable"
                          title="Recurring deliverables – click to toggle engagement type"
                        >
                          <RefreshCw size={11} aria-hidden="true" />
                          <span>{formatCadenceBadge(proj.cadenceDays || 1)} RETAINER</span>
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
                          className="badge-stamp badge-stamp-blue badge-stamp-clickable"
                          title="One-off project – click to toggle engagement type"
                        >
                          <Zap size={11} aria-hidden="true" />
                          <span>ONE-OFF BRIEF</span>
                        </button>
                      )}

                      {/* Status Stamp */}
                      {isOngoing ? (
                        isTodaySubmitted(proj) ? (
                          <span className="badge-stamp badge-stamp-emerald">
                            <CheckCircle2 size={11} aria-hidden="true" />
                            <span>DELIVERED TODAY</span>
                          </span>
                        ) : (
                          <span className="badge-stamp badge-stamp-yellow">
                            <Clock size={11} aria-hidden="true" />
                            <span>PENDING TODAY</span>
                          </span>
                        )
                      ) : (
                        isCompleted ? (
                          <span className="badge-stamp badge-stamp-emerald">
                            <CheckCircle2 size={11} aria-hidden="true" />
                            <span>100% COMPLETE // KICKOFF</span>
                          </span>
                        ) : (
                          <span className="badge-stamp badge-stamp-orange">
                            <Clock size={11} aria-hidden="true" />
                            <span>WAITING FOR CLIENT</span>
                          </span>
                        )
                      )}

                      {/* Automated GDPR Retention Purge Status */}
                      {(() => {
                        const retention = getRetentionStatus(proj);
                        if (!retention || proj.status !== 'completed') return null;
                        return (
                          <span 
                            className={`badge-stamp ${retention.isPurged ? 'badge-stamp-red' : 'badge-stamp-emerald'}`}
                            title="Automated 30-day retention cloud purge (GDPR Art. 5)"
                          >
                            <ShieldCheck size={11} aria-hidden="true" />
                            <span>{retention.badgeText}</span>
                          </span>
                        );
                      })()}

                    </div>
                  </div>

                  {/* 2. Docket Content Body */}
                  <div className="docket-content-body">
                    
                    {/* Project & Client Identity Row */}
                    <div className="docket-meta-row">
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
                        
                        {/* Client Avatar Stamp */}
                        <div className="docket-client-avatar" aria-hidden="true">
                          {proj.clientName ? proj.clientName.charAt(0).toUpperCase() : 'C'}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h2 
                            className="docket-title"
                            onClick={() => openProjectDetail(proj.slug)}
                            title="Click to open full project overview and file inspector"
                          >
                            {proj.title}
                          </h2>

                          <div className="docket-client-details">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <User size={13} aria-hidden="true" />
                              <strong style={{ color: 'var(--ink)' }}>{proj.clientName}</strong>
                              <span>({proj.clientEmail})</span>
                            </span>

                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <Calendar size={13} aria-hidden="true" />
                              <span>DEADLINE: <strong style={{ color: 'var(--ink)' }}>{proj.deadline}</strong></span>
                            </span>

                            {proj.lastReminderSent && (
                              <span style={{ color: 'var(--orange)', fontWeight: 700 }}>
                                LAST NUDGE: {proj.lastReminderSent}
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Progress Bar Meter */}
                    <div className="docket-progress-section">
                      <div className="docket-progress-labels">
                        <span>
                          ASSET FULFILLMENT: <strong>{completedCount} OF {totalCount} DELIVERED</strong>
                        </span>
                        <span style={{ color: isCompleted ? '#065F46' : 'var(--orange)', fontSize: '0.85rem' }}>
                          {progressPercent}% FULFILLED
                        </span>
                      </div>

                      <div 
                        className="docket-track-meter"
                        role="progressbar"
                        aria-valuenow={progressPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Asset fulfillment for ${proj.title}: ${progressPercent}%`}
                      >
                        <div 
                          className={`docket-fill-meter ${!isCompleted ? 'pending' : ''}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Asset Checklist Inspection Tray */}
                    <div className="docket-checklist-tray">
                      {(proj.items || []).map((item) => {
                        const fileCount = Array.isArray(item.value?.files) 
                          ? item.value.files.length 
                          : (item.value?.fileName ? 1 : 0);

                        return (
                          <div 
                            key={item.id} 
                            className={`docket-item-pill ${item.isCompleted ? 'done' : ''}`}
                            title={item.isCompleted ? `Delivered: ${item.title}` : `Pending: ${item.title}`}
                          >
                            <div className="docket-checkbox-icon" aria-hidden="true">
                              {item.isCompleted ? '✓' : '–'}
                            </div>

                            <span style={{ 
                              whiteSpace: 'nowrap', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              flex: 1
                            }}>
                              {item.title}
                            </span>

                            {fileCount > 1 && (
                              <span className="file-count-badge-nb">
                                ×{fileCount}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>

                  {/* 3. Docket Action Footer */}
                  <div className="docket-action-footer">
                    <div className="docket-footer-left">
                      {!isCompleted ? (
                        <button
                          id={`btn-remind-${proj.id}`}
                          type="button"
                          onClick={() => openReminderModal(proj.id)}
                          aria-label={`Send polite email reminder for ${proj.title}`}
                          className="btn-tactile-sm"
                          style={{ background: 'var(--yellow)', color: 'var(--ink)' }}
                          title="Preview and send polite email reminder to client via Resend"
                        >
                          <Send size={13} aria-hidden="true" />
                          <span>{proj.lastReminderSent ? `SEND NUDGE AGAIN (${proj.lastReminderSent})` : 'SEND POLITE NUDGE'}</span>
                        </button>
                      ) : (
                        <span style={{ 
                          fontFamily: 'var(--font-mono)', 
                          fontSize: '0.78rem', 
                          fontWeight: 800, 
                          color: '#065F46', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px' 
                        }}>
                          <CheckCircle2 size={14} aria-hidden="true" />
                          ALL ASSETS READY FOR KICKOFF
                        </span>
                      )}
                    </div>

                    <div className="docket-footer-right">
                      {/* 1-Click Copy Link */}
                      <button
                        id={`btn-copy-link-${proj.id}`}
                        type="button"
                        onClick={() => copyClientLink(proj.slug)}
                        aria-label={`Copy client portal link for ${proj.title}`}
                        className="btn-tactile-sm"
                        style={{ 
                          background: isLinkCopied ? '#DCFCE7' : 'var(--yellow)',
                          color: isLinkCopied ? '#15803D' : 'var(--ink)'
                        }}
                        title="Copy private link for client upload"
                      >
                        {isLinkCopied ? (
                          <>
                            <Check size={14} aria-hidden="true" />
                            <span>COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} aria-hidden="true" />
                            <span>COPY CLIENT LINK</span>
                          </>
                        )}
                      </button>

                      {/* Overview & Detail Button */}
                      <button
                        id={`btn-open-detail-${proj.id}`}
                        type="button"
                        onClick={() => openProjectDetail(proj.slug)}
                        aria-label={`Open studio asset inspector for ${proj.title}`}
                        className="btn-tactile-dark"
                        title="Open studio asset inspector and full asset downloads"
                      >
                        <Eye size={14} aria-hidden="true" />
                        <span>OVERVIEW</span>
                      </button>

                      {/* Export Assets Button */}
                      <button
                        id={`btn-download-${proj.id}`}
                        type="button"
                        onClick={() => handleDownloadAll(proj)}
                        aria-label={`Export all assets for ${proj.title} as ZIP`}
                        className="btn-tactile-sm"
                        style={{ background: '#FFFFFF', color: 'var(--ink)' }}
                        title="Export all client assets as a batch ZIP archive"
                      >
                        <Download size={13} aria-hidden="true" />
                        <span>EXPORT ({completedCount})</span>
                      </button>

                      {/* Delete Docket Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete docket "${proj.title}"?`)) {
                            deleteProject(proj.id);
                          }
                        }}
                        aria-label={`Delete project docket ${proj.title}`}
                        className="btn-tactile-sm"
                        style={{ background: '#FFFFFF', color: 'var(--red)', padding: '6px 8px' }}
                        title="Delete project docket"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        )}

        {/* ── Studio Axioms / Zero-Friction Rules ──────────────── */}
        <div className="dash-axioms-section">
          <div className="axioms-header-box">
            <div className="dash-kicker-badge" style={{ margin: '0 auto 10px' }}>
              <span>ZERO-FRICTION STUDIO STANDARD</span>
            </div>
            <h3 className="axioms-heading">
              HOW DROPBRIEF ELIMINATES CLIENT DELAYS
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--ink-muted)', margin: 0 }}>
              Three engineering principles that guarantee clients submit briefs in hours instead of weeks.
            </p>
          </div>

          <div className="axioms-cards-row">
            
            <div className="axiom-card-box">
              <div>
                <span className="axiom-tag-num">AXIOM 01</span>
                <h4 className="axiom-title">Zero Passwords &amp; No Signups</h4>
                <p className="axiom-text">
                  Clients click your private link and upload immediately. No forgotten accounts, no 2FA fatigue, and no permission hurdles.
                </p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--emerald)', fontWeight: 800 }}>
                <Check size={14} /> 100% Zero Login Friction
              </div>
            </div>

            <div className="axiom-card-box">
              <div>
                <span className="axiom-tag-num" style={{ background: 'var(--orange)' }}>AXIOM 02</span>
                <h4 className="axiom-title">Automated Polite Follow-Ups</h4>
                <p className="axiom-text">
                  DropBrief tracks missing deliverables and sends gentle 1-click reminders so you never have to send awkward manual follow-ups.
                </p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--orange)', fontWeight: 800 }}>
                <Send size={14} /> Built-in Resend Email Dispatch
              </div>
            </div>

            <div className="axiom-card-box">
              <div>
                <span className="axiom-tag-num" style={{ background: 'var(--cobalt)' }}>AXIOM 03</span>
                <h4 className="axiom-title">GDPR Art. 5 Auto Purge</h4>
                <p className="axiom-text">
                  Deliverables are hosted on encrypted EU servers (Frankfurt) and purged 30 days after completion to protect confidentiality.
                </p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--cobalt)', fontWeight: 800 }}>
                <ShieldCheck size={14} /> Bank-Grade AES-256 Storage
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
