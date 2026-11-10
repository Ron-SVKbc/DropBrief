import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCadenceBadge, isTodaySubmitted, getRetentionStatus } from '../utils/cadenceUtils';
import { 
  FolderSync, 
  Copy, 
  ExternalLink, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Sparkles, 
  Send, 
  ShieldCheck, 
  Layers, 
  Calendar, 
  User, 
  Zap, 
  Check, 
  X, 
  TrendingUp, 
  RefreshCw, 
  Eye, 
  Settings,
  Gift,
  Users,
  LayoutGrid,
  List,
  ArrowUpRight
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
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
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

  // Deadline Horizon & Timeline Calculations
  const todayDateObj = new Date();
  todayDateObj.setHours(0, 0, 0, 0);

  const upcomingProjects = myProjects
    .filter((p) => p.status !== 'completed' && p.deadline)
    .map((p) => {
      const d = new Date(p.deadline);
      const isDateValid = !isNaN(d.getTime());
      d.setHours(0, 0, 0, 0);
      const diffDays = isDateValid
        ? Math.round((d.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      // Calculate 30-day timeline percentage (0% = today or overdue, 100% = 30 days)
      const percent = Math.max(0, Math.min(100, Math.round((diffDays / 30) * 100)));

      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        clientName: p.clientName,
        deadline: p.deadline,
        diffDays,
        percent,
        isOverdue: diffDays < 0,
        isToday: diffDays === 0,
        isUrgent: diffDays > 0 && diffDays <= 3
      };
    })
    .sort((a, b) => a.diffDays - b.diffDays);

  const nearestProject = upcomingProjects[0] || null;
  const todayFormatted = todayDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
    <div className="nb-dashboard-page" role="region" aria-label="Studio Dispatch Dashboard">

      <div className="dash-container">

        {/* ── Studio Header & Primary Action Deck ──────────────── */}
        <header className="dash-header-section">
          <div>
            <div className="dash-kicker-badge">
              <Sparkles size={13} aria-hidden="true" />
              <span>STUDIO OPERATING DESK // DISPATCH COCKPIT</span>
            </div>

            <h1 className="dash-title">
              WORKSPACE DOCKETS
            </h1>

            <div className="dash-subtitle">
              <span>Client intake portals for</span>
              <strong style={{ color: 'var(--ink)' }}>@{currentFreelancer?.nick || 'studio'}</strong>
              <span aria-hidden="true">•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span className="status-live-dot" aria-hidden="true" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700 }}>
                  IRELAND EU (AES-256)
                </span>
              </span>
            </div>
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
        </header>

        {/* ── Studio Command HUD Grid ─────────────────────────── */}
        <section className="dash-hud-grid" aria-label="Studio HUD Metrics">

          {/* Tile 1: Capacity & Slots */}
          <div className="hud-card">
            <div className="hud-card-top">
              <span className="hud-label">DOCKET CAPACITY</span>
              <div className="hud-icon-stamp" style={{ background: 'var(--yellow)' }}>
                <Layers size={15} color="var(--ink)" aria-hidden="true" />
              </div>
            </div>
            <div>
              <div className="hud-big-value">
                <span>{activeProjectsCount}</span>
                <span style={{ fontSize: '1.1rem', color: 'var(--ink-dim)', fontWeight: 700 }}>/ {maxProjects}</span>
              </div>
              <p className="hud-meta-text">
                {isVipPro ? '⭐ VIP Founding Pro (100MB)' : 'Starter Tier (50MB)'} &bull; {completedProjects} archived
              </p>
            </div>
            <div className="hud-meter-wrap">
              <div 
                className="hud-slot-track" 
                role="progressbar" 
                aria-valuenow={activeProjectsCount} 
                aria-valuemin={0} 
                aria-valuemax={maxProjects}
                aria-label="Active docket slot utilization"
              >
                <div 
                  className={`hud-slot-fill ${activeProjectsCount >= maxProjects ? 'full' : activeProjectsCount >= maxProjects - 1 ? 'warning' : ''}`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tile 2: Action Required / Pending Assets */}
          <div className="hud-card hud-card-highlight">
            <div className="hud-card-top">
              <span className="hud-label">PENDING CLIENT ASSETS</span>
              <div 
                className="hud-icon-stamp" 
                style={{ 
                  background: totalMissingItems > 0 ? 'var(--orange)' : 'var(--paper)',
                  color: totalMissingItems > 0 ? '#FFFFFF' : 'var(--ink)'
                }}
              >
                <Clock size={15} aria-hidden="true" />
              </div>
            </div>
            <div>
              <div className="hud-big-value" style={{ color: totalMissingItems > 0 ? 'var(--orange)' : 'var(--ink)' }}>
                {totalMissingItems}
              </div>
              <p className="hud-meta-text">
                {totalMissingItems > 0 
                  ? `Across ${pendingProjects} active client intake dockets` 
                  : 'Zero pending assets • Everything submitted'}
              </p>
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-dim)', fontWeight: 700 }}>
              1-CLICK RESEND EMAIL REMINDERS
            </div>
          </div>

          {/* Tile 3: Production Timeline Horizon */}
          <div className="hud-card hud-timeline-card">
            <div className="hud-card-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="hud-label">DEADLINE HORIZON</span>
                <span className="status-live-dot" title="Live clock anchor" />
              </div>
              <div className="hud-icon-stamp" style={{ background: 'var(--amber-light)', color: 'var(--amber-dark)' }}>
                <Calendar size={15} aria-hidden="true" />
              </div>
            </div>

            {/* Visual Timeline Horizon Rail */}
            <div className="timeline-horizon-track-wrap">
              <div className="timeline-track-rail">
                {/* Now Marker */}
                <div className="timeline-marker-now" title={`Today: ${todayFormatted}`}>
                  <span className="now-dot" />
                  <span className="now-label">TODAY</span>
                </div>

                {/* Plotted Milestone Nodes */}
                {upcomingProjects.slice(0, 3).map((p) => {
                  const nodeColor = p.isOverdue ? 'var(--red)' : p.isUrgent ? 'var(--orange)' : 'var(--emerald)';
                  return (
                    <div 
                      key={p.id}
                      className="timeline-project-node"
                      style={{ left: `${p.percent}%` }}
                      title={`${p.title} (${p.diffDays < 0 ? `${Math.abs(p.diffDays)}d overdue` : p.diffDays === 0 ? 'Due today' : `Due in ${p.diffDays}d`})`}
                      onClick={() => openProjectDetail(p.slug)}
                    >
                      <div className="timeline-node-pin" style={{ background: nodeColor }} />
                      <div className="timeline-node-callout">
                        {p.diffDays < 0 ? `-${Math.abs(p.diffDays)}d` : p.diffDays === 0 ? 'Today' : `+${p.diffDays}d`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Axis Ticks */}
              <div className="timeline-axis-labels">
                <span>{todayFormatted}</span>
                <span>+7d</span>
                <span>+14d</span>
                <span>+30d</span>
              </div>
            </div>

            {/* Nearest Deadline Summary / Feed */}
            <div className="timeline-summary-dock">
              {nearestProject ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      NEXT DELIVERY:
                    </div>
                    <div 
                      onClick={() => openProjectDetail(nearestProject.slug)}
                      style={{ 
                        fontSize: '0.84rem', 
                        fontWeight: 800, 
                        color: 'var(--ink-primary)', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        cursor: 'pointer'
                      }}
                      title={nearestProject.title}
                    >
                      {nearestProject.title}
                    </div>
                  </div>

                  <span 
                    className={`badge-stamp ${nearestProject.isOverdue ? 'badge-stamp-red' : nearestProject.isUrgent ? 'badge-stamp-orange' : 'badge-stamp-yellow'}`}
                    style={{ fontSize: '0.68rem', padding: '2px 6px' }}
                  >
                    {nearestProject.isOverdue 
                      ? `OVERDUE ${Math.abs(nearestProject.diffDays)}D` 
                      : nearestProject.isToday 
                      ? 'DUE TODAY' 
                      : `IN ${nearestProject.diffDays}D`}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--emerald-dark)', fontSize: '0.8rem', fontWeight: 700 }}>
                  <CheckCircle2 size={13} color="var(--emerald)" />
                  <span>Horizon clear &bull; 0 upcoming deadlines</span>
                </div>
              )}
            </div>
          </div>

          {/* Tile 4: Studio Referral Station */}
          <div className="hud-card" style={{ background: 'var(--yellow-tint)' }}>
            <div className="hud-card-top">
              <span className="hud-label" style={{ color: 'var(--ink)' }}>INVITE PEERS (+2 SLOTS)</span>
              <div className="hud-icon-stamp" style={{ background: 'var(--ink)', color: 'var(--yellow)' }}>
                <Gift size={15} aria-hidden="true" />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900 }}>
                  {referralCount}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-muted)' }}>
                  REFERRED (+{bonusSlots} SLOTS)
                </span>
              </div>
              <p className="hud-meta-text" style={{ fontSize: '0.78rem' }}>
                Share with fellow designers to unlock extra slots &amp; storage:
              </p>
            </div>
            <div className="hud-ref-row">
              <input 
                type="text"
                readOnly
                value={referralUrl}
                aria-label="Your personal referral link"
                onClick={(e) => e.target.select()}
                className="hud-ref-input"
              />
              <button
                id="btn-copy-invite-link"
                type="button"
                onClick={copyInviteLink}
                className="btn-tactile-sm"
                style={{ background: 'var(--yellow)', color: 'var(--ink)', padding: '5px 8px' }}
                title="Copy referral invitation link"
              >
                {copiedInvite ? (
                  <>
                    <Check size={13} aria-hidden="true" />
                    <span>COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} aria-hidden="true" />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </section>

        {/* ── Filter & Search Command Console ─────────────────── */}
        <section className="dash-filter-console" aria-label="Dockets Filter and Search Console">
          
          {/* Architectural Search Input */}
          <div className="dash-search-wrap">
            <Search 
              size={15} 
              aria-hidden="true" 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-dim)', pointerEvents: 'none' }} 
            />
            <input
              id="search-projects-input"
              type="text"
              className="dash-search-input"
              placeholder="Search by title, client, email..."
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
                  right: '10px', 
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
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Segmented Filter Buttons */}
          <div className="dash-segmented-filters" role="group" aria-label="Filter dockets by status and type">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`dash-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            >
              <span>ALL</span>
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

          {/* View Mode Toggle Switcher */}
          <div className="dash-view-toggle" role="radiogroup" aria-label="Select layout view">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              aria-label="Dossier cards view"
              title="Dossier cards view"
            >
              <LayoutGrid size={13} aria-hidden="true" />
              <span>CARDS</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              aria-label="Manifest table view"
              title="Manifest table view"
            >
              <List size={13} aria-hidden="true" />
              <span>TABLE</span>
            </button>
          </div>

        </section>

        {/* ── Main Production Dockets List / Grid ─────────────── */}
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
                ? 'Try adjusting your search query or clear the active status filter to inspect all client dockets.' 
                : 'Create your first client asset collection docket. Your client receives a unique zero-login link with zero passwords and zero setup friction.'}
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

        ) : viewMode === 'table' ? (

          /* ── Table / Manifest View ────────────────────────── */
          <div className="dash-manifest-wrap" role="region" aria-label="Client Dockets Table Manifest">
            <table className="dash-manifest-table">
              <thead>
                <tr>
                  <th>DOCKET ID</th>
                  <th>PROJECT &amp; CLIENT</th>
                  <th>TYPE</th>
                  <th>FULFILLMENT</th>
                  <th>STATUS</th>
                  <th>DEADLINE</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((proj) => {
                  const completedCount = (proj.items || []).filter((i) => i.isCompleted).length;
                  const totalCount = (proj.items || []).length;
                  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                  const isCompleted = proj.status === 'completed';
                  const isLinkCopied = copiedSlug === proj.slug;
                  const isOngoing = proj.projectType === 'ongoing' || proj.project_type === 'ongoing';
                  const serialCode = (proj.id || 'proj-000').slice(-5).toUpperCase();
                  const retention = getRetentionStatus(proj);

                  return (
                    <tr key={proj.id} id={`project-card-${proj.id}`}>
                      {/* Docket ID */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                        <span style={{ color: 'var(--orange)' }}>#</span>DKT-{serialCode}
                      </td>

                      {/* Project & Client */}
                      <td>
                        <div 
                          onClick={() => openProjectDetail(proj.slug)}
                          style={{ fontWeight: 800, color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Open studio asset inspector"
                        >
                          <span>{proj.title}</span>
                          <ArrowUpRight size={13} color="var(--ink-dim)" />
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                          {proj.clientName} &bull; {proj.clientEmail}
                        </div>
                      </td>

                      {/* Engagement Type */}
                      <td>
                        <button
                          type="button"
                          id={`btn-toggle-type-${proj.id}`}
                          onClick={() => toggleProjectType(proj.id)}
                          className={`badge-stamp badge-stamp-clickable ${isOngoing ? 'badge-stamp-purple' : 'badge-stamp-blue'}`}
                          title="Click to toggle engagement type"
                        >
                          {isOngoing ? (
                            <>
                              <RefreshCw size={10} aria-hidden="true" />
                              <span>{formatCadenceBadge(proj.cadenceDays || 1)} RETAINER</span>
                            </>
                          ) : (
                            <>
                              <Zap size={10} aria-hidden="true" />
                              <span>ONE-OFF</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Fulfillment */}
                      <td style={{ minWidth: '130px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 800, marginBottom: '4px' }}>
                          <span>{completedCount}/{totalCount}</span>
                          <span style={{ color: isCompleted ? '#065F46' : 'var(--orange)' }}>{progressPercent}%</span>
                        </div>
                        <div className="docket-track-meter">
                          <div 
                            className={`docket-fill-meter ${!isCompleted ? 'pending' : ''}`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        {isOngoing ? (
                          isTodaySubmitted(proj) ? (
                            <span className="badge-stamp badge-stamp-emerald">
                              <CheckCircle2 size={10} aria-hidden="true" />
                              <span>DELIVERED TODAY</span>
                            </span>
                          ) : (
                            <span className="badge-stamp badge-stamp-yellow">
                              <Clock size={10} aria-hidden="true" />
                              <span>PENDING TODAY</span>
                            </span>
                          )
                        ) : isCompleted ? (
                          <span className="badge-stamp badge-stamp-emerald">
                            <CheckCircle2 size={10} aria-hidden="true" />
                            <span>100% READY</span>
                          </span>
                        ) : (
                          <span className="badge-stamp badge-stamp-orange">
                            <Clock size={10} aria-hidden="true" />
                            <span>AWAITING ASSETS</span>
                          </span>
                        )}

                        {retention && isCompleted && (
                          <div style={{ marginTop: '4px' }}>
                            <span className={`badge-stamp ${retention.isPurged ? 'badge-stamp-red' : 'badge-stamp-emerald'}`}>
                              <ShieldCheck size={9} aria-hidden="true" />
                              <span>{retention.badgeText}</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Deadline */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink)' }}>
                        {proj.deadline || 'No deadline'}
                      </td>

                      {/* Inline Actions */}
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            id={`btn-copy-link-${proj.id}`}
                            type="button"
                            onClick={() => copyClientLink(proj.slug)}
                            className="btn-tactile-sm"
                            style={{ 
                              background: isLinkCopied ? '#DCFCE7' : 'var(--yellow)',
                              color: isLinkCopied ? '#15803D' : 'var(--ink)',
                              padding: '5px 8px'
                            }}
                            title="Copy client portal link"
                          >
                            {isLinkCopied ? <Check size={13} /> : <Copy size={13} />}
                          </button>

                          {!isCompleted && (
                            <button
                              id={`btn-remind-${proj.id}`}
                              type="button"
                              onClick={() => openReminderModal(proj.id)}
                              className="btn-tactile-sm"
                              style={{ background: 'var(--yellow)', color: 'var(--ink)', padding: '5px 8px' }}
                              title="Send reminder to client via Resend"
                            >
                              <Send size={13} />
                            </button>
                          )}

                          <button
                            id={`btn-open-detail-${proj.id}`}
                            type="button"
                            onClick={() => openProjectDetail(proj.slug)}
                            className="btn-tactile-dark"
                            style={{ padding: '5px 8px' }}
                            title="Inspect assets"
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            id={`btn-download-${proj.id}`}
                            type="button"
                            onClick={() => handleDownloadAll(proj)}
                            className="btn-tactile-sm"
                            style={{ background: '#FFFFFF', color: 'var(--ink)', padding: '5px 8px' }}
                            title="Export all assets as ZIP"
                          >
                            <Download size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete docket "${proj.title}"?`)) {
                                deleteProject(proj.id);
                              }
                            }}
                            className="btn-tactile-sm"
                            style={{ background: '#FFFFFF', color: 'var(--red)', padding: '5px 7px' }}
                            title="Delete docket"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        ) : (

          /* ── Dossier Cards Grid (2-Columns on wide screen) ── */
          <div className="dash-dockets-grid">
            {filteredProjects.map((proj) => {
              const completedCount = (proj.items || []).filter((i) => i.isCompleted).length;
              const totalCount = (proj.items || []).length;
              const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              const isCompleted = proj.status === 'completed';
              const isLinkCopied = copiedSlug === proj.slug;
              const isOngoing = proj.projectType === 'ongoing' || proj.project_type === 'ongoing';
              const serialCode = (proj.id || 'proj-000').slice(-5).toUpperCase();
              const retention = getRetentionStatus(proj);

              return (
                <article 
                  key={proj.id} 
                  className="project-docket-card"
                  id={`project-card-${proj.id}`}
                  aria-label={`Docket for ${proj.title}`}
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
                          <RefreshCw size={10} aria-hidden="true" />
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
                          <Zap size={10} aria-hidden="true" />
                          <span>ONE-OFF BRIEF</span>
                        </button>
                      )}

                      {/* Status Stamp */}
                      {isOngoing ? (
                        isTodaySubmitted(proj) ? (
                          <span className="badge-stamp badge-stamp-emerald">
                            <CheckCircle2 size={10} aria-hidden="true" />
                            <span>DELIVERED TODAY</span>
                          </span>
                        ) : (
                          <span className="badge-stamp badge-stamp-yellow">
                            <Clock size={10} aria-hidden="true" />
                            <span>PENDING TODAY</span>
                          </span>
                        )
                      ) : isCompleted ? (
                        <span className="badge-stamp badge-stamp-emerald">
                          <CheckCircle2 size={10} aria-hidden="true" />
                          <span>100% READY // KICKOFF</span>
                        </span>
                      ) : (
                        <span className="badge-stamp badge-stamp-orange">
                          <Clock size={10} aria-hidden="true" />
                          <span>WAITING FOR CLIENT</span>
                        </span>
                      )}

                      {/* Automated GDPR Retention Purge Status */}
                      {retention && isCompleted && (
                        <span 
                          className={`badge-stamp ${retention.isPurged ? 'badge-stamp-red' : 'badge-stamp-emerald'}`}
                          title="Automated 30-day retention cloud purge (GDPR Art. 5)"
                        >
                          <ShieldCheck size={10} aria-hidden="true" />
                          <span>{retention.badgeText}</span>
                        </span>
                      )}

                    </div>
                  </div>

                  {/* 2. Docket Content Body */}
                  <div className="docket-content-body">
                    
                    {/* Project & Client Identity */}
                    <div className="docket-meta-row">
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
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <User size={13} aria-hidden="true" />
                            <strong style={{ color: 'var(--ink)' }}>{proj.clientName}</strong>
                            <span>({proj.clientEmail})</span>
                          </span>

                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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

                    {/* Progress Bar Meter */}
                    <div className="docket-progress-section">
                      <div className="docket-progress-labels">
                        <span>
                          FULFILLMENT: <strong>{completedCount} OF {totalCount} DELIVERED</strong>
                        </span>
                        <span style={{ color: isCompleted ? '#065F46' : 'var(--orange)' }}>
                          {progressPercent}%
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
                        <Eye size={13} aria-hidden="true" />
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
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                </article>
              );
            })}
          </div>

        )}

        {/* ── Studio Telemetry Strip Footer ─────────────────────── */}
        <footer className="dash-studio-footer" role="contentinfo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--orange)', fontWeight: 900 }}>⚡</span>
            <span>DROPBRIEF STUDIO DESK</span>
            <span style={{ opacity: 0.35 }} aria-hidden="true">•</span>
            <span>ZERO PASSWORDS &bull; ZERO CLIENT LOGINS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>ENCRYPTED AES-256</span>
            <span style={{ opacity: 0.35 }} aria-hidden="true">•</span>
            <span>IRELAND EU STORAGE</span>
            <span style={{ opacity: 0.35 }} aria-hidden="true">•</span>
            <span style={{ color: 'var(--emerald)' }}>GDPR ART. 5 (30-DAY PURGE)</span>
          </div>
        </footer>

      </div>

    </div>
  );
}
