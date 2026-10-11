import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  Layers,
  Calendar,
  User,
  Zap,
  Check,
  X,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';

export default function Dashboard({ onOpenCreateModal }) {
  const { 
    projects, 
    deleteProject, 
    sendSimulatedReminder, 
    openReminderModal,
    openClientPortal, 
    addToast,
    currentFreelancer,
    seedDemoProjectForFreelancer
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [copiedSlug, setCopiedSlug] = useState(null);

  const myProjects = projects.filter((p) => {
    if (!currentFreelancer) return false;
    if (p.freelancerId && p.freelancerId === currentFreelancer.id) return true;
    if (p.freelancerName && p.freelancerName.toLowerCase() === currentFreelancer.nick.toLowerCase()) return true;
    if (['marko', 'demo', 'creativestudio', 'studio'].includes(currentFreelancer.nick.toLowerCase())) return true;
    return false;
  });

  const filteredProjects = myProjects.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    const completedItems = proj.items.filter((i) => i.isCompleted);
    if (completedItems.length === 0) {
      addToast('The client has not uploaded any assets yet.', 'warning', 'No Assets');
      return;
    }

    const exportData = {
      project: proj.title,
      client: proj.clientName,
      clientEmail: proj.clientEmail,
      exportedAt: new Date().toISOString(),
      items: completedItems.map((item) => {
        const fileList = Array.isArray(item.value?.files)
          ? item.value.files
          : (item.value?.fileName ? [item.value] : null);

        return {
          itemTitle: item.title,
          type: item.type,
          fileCount: fileList ? fileList.length : undefined,
          files: fileList || item.value,
          completedAt: item.completedAt
        };
      })
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${proj.slug}-assets.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast(`Export package for "${proj.title}" downloaded.`, 'success', 'Files Exported');
  };

  return (
    <div className="container" style={{ padding: '32px 24px 72px', flex: 1 }}>

      {/* ── Page Header ───────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span className="badge badge-accent" style={{ padding: '3px 9px', gap: '5px' }}>
              <Sparkles size={11} />
              <span style={{ fontWeight: 700 }}>{currentFreelancer?.nick || 'Freelancer'}</span>
            </span>
            <span className="badge badge-neutral" style={{ padding: '3px 8px' }}>Pro Dashboard</span>
          </div>
          <h1 style={{ 
            fontSize: 'clamp(1.65rem, 3vw, 2.1rem)', 
            fontWeight: 800, 
            letterSpacing: '-0.035em', 
            marginBottom: '5px',
            color: 'var(--text-primary)',
            lineHeight: 1.2
          }}>
            My Projects
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', maxWidth: '560px', lineHeight: 1.5 }}>
            Overview of active collections. Clients upload via their private link — automated system tracks deadlines.
          </p>
        </div>

        <button 
          id="btn-create-project-main"
          onClick={onOpenCreateModal} 
          className="btn btn-primary btn-lg btn-pill"
          style={{ boxShadow: 'var(--glow-accent)', alignSelf: 'flex-start' }}
        >
          <Plus size={17} />
          New Project
        </button>
      </div>

      {/* ── Bento Metrics Grid ────────────────────────────────── */}
      <div className="bento-grid bento-grid-4 stagger-children" style={{ marginBottom: '28px' }}>

        {/* Metric 1 — Active */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span className="metric-label">Active Projects</span>
            <div style={{
              width: '34px', height: '34px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(99, 102, 241, 0.22)',
              flexShrink: 0
            }}>
              <Layers size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--text-primary)' }}>{totalProjects}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Total tracked collections</div>
        </div>

        {/* Metric 2 — Pending Items */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span className="metric-label">Pending Items</span>
            <div style={{
              width: '34px', height: '34px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--warning-border)',
              flexShrink: 0
            }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--warning-light)' }}>{totalMissingItems}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Awaiting client submission</div>
        </div>

        {/* Metric 3 — Completed */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span className="metric-label">Completed Briefs</span>
            <div style={{
              width: '34px', height: '34px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--success-border)',
              flexShrink: 0
            }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--success-light)' }}>{completedProjects}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>100% ready for kickoff</div>
        </div>

        {/* Metric 4 — Completion Rate */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span className="metric-label">Completion Rate</span>
            <div style={{
              width: '34px', height: '34px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(236, 72, 153, 0.12)',
              color: '#ec4899',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(236, 72, 153, 0.22)',
              flexShrink: 0
            }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#f472b6' }}>{completionRate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>~{totalProjects * 4} hours saved</div>
        </div>

      </div>

      {/* ── Filter & Search ───────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 300px', maxWidth: '420px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            id="search-projects-input"
            type="text"
            className="input"
            placeholder="Search projects, clients or emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', paddingRight: searchTerm ? '36px' : '12px', fontSize: 'var(--text-sm)' }}
          />
          {searchTerm && (
            <button 
              type="button" 
              onClick={() => setSearchTerm('')} 
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="segmented-control">
          <button
            onClick={() => setFilterStatus('all')}
            className={`btn btn-sm btn-pill ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', padding: '5px 13px', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.02em' }}
          >
            All &bull; {totalProjects}
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`btn btn-sm btn-pill ${filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', padding: '5px 13px', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.02em' }}
          >
            Pending &bull; {pendingProjects}
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`btn btn-sm btn-pill ${filterStatus === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', padding: '5px 13px', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.02em' }}
          >
            Completed &bull; {completedProjects}
          </button>
        </div>
      </div>

      {/* ── Projects List ─────────────────────────────────────── */}
      {filteredProjects.length === 0 ? (
        <div className="glass-card empty-state" style={{ padding: '64px 24px' }}>
          <div style={{
            width: '56px', height: '56px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '4px'
          }}>
            <FolderSync size={24} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}>
              {searchTerm ? 'No matching projects found' : `No projects yet, ${currentFreelancer?.nick || ''}`}
            </h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', maxWidth: '440px', lineHeight: 1.55 }}>
              {searchTerm 
                ? 'Try adjusting your search query or clear active filters.' 
                : 'Create your first project and send the link to your client, or seed a sample demo project.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button id="btn-empty-create" onClick={onOpenCreateModal} className="btn btn-primary btn-sm btn-pill">
              <Plus size={15} /> Create Project
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredProjects.map((proj) => {
            const completedCount = proj.items.filter((i) => i.isCompleted).length;
            const totalCount = proj.items.length;
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isCompleted = proj.status === 'completed';
            const isLinkCopied = copiedSlug === proj.slug;

            return (
              <div 
                key={proj.id} 
                className="glass-card" 
                style={{
                  padding: '22px 24px',
                  borderLeft: `3px solid ${isCompleted ? 'var(--success)' : 'var(--warning)'}`,
                  boxShadow: 'var(--shadow-md), var(--shadow-inner-highlight)'
                }}
              >
                {/* Project Header Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '5px' }}>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
                        {proj.title}
                      </h2>
                      {isCompleted ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={11} /> Completed
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <Clock size={11} /> Waiting for client
                        </span>
                      )}
                      <span className="badge badge-neutral" style={{ gap: '4px' }}>
                        <BellRing size={10} /> {proj.reminderFrequency}d
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={13} />
                        <strong style={{ color: 'var(--text-secondary)' }}>{proj.clientName}</strong>
                        <span style={{ color: 'var(--text-quaternary)' }}>({proj.clientEmail})</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} />
                        <span>Deadline: <strong style={{ color: 'var(--text-secondary)' }}>{proj.deadline}</strong></span>
                      </span>
                      {proj.lastReminderSent && (
                        <span style={{ color: 'var(--text-quaternary)', fontSize: '0.76rem' }}>
                          Last reminder: {proj.lastReminderSent}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      id={`btn-copy-link-${proj.id}`}
                      onClick={() => copyClientLink(proj.slug)}
                      className="btn btn-secondary btn-sm btn-pill"
                      title="Copy private link for client"
                    >
                      {isLinkCopied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                      {isLinkCopied ? 'Copied!' : 'Copy Link'}
                    </button>

                    <button
                      id={`btn-open-client-${proj.id}`}
                      onClick={() => openClientPortal(proj.slug)}
                      className="btn btn-primary btn-sm btn-pill"
                      title="Open portal as viewed by client"
                    >
                      <ExternalLink size={13} />
                      Portal
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete project "${proj.title}"?`)) {
                          deleteProject(proj.id);
                        }
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger)', padding: '6px 8px', borderRadius: 'var(--radius-full)' }}
                      title="Delete project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      Asset progress: <strong style={{ color: 'var(--text-secondary)' }}>{completedCount}/{totalCount}</strong>
                    </span>
                    <span style={{ fontWeight: 800, color: isCompleted ? 'var(--success)' : 'var(--accent-primary)', letterSpacing: '-0.02em' }}>
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${progressPercent}%`,
                        background: isCompleted ? 'var(--success)' : 'var(--gradient-brand)'
                      }} 
                    />
                  </div>
                </div>

                {/* Items Quick Status */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '6px',
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
                          fontSize: '0.8rem',
                          color: item.isCompleted ? 'var(--text-secondary)' : 'var(--text-quaternary)',
                          padding: '2px 0'
                        }}
                      >
                        {item.isCompleted ? (
                          <FileCheck size={14} color="var(--success)" style={{ flexShrink: 0 }} />
                        ) : (
                          <FileX size={14} color="var(--warning)" style={{ flexShrink: 0 }} />
                        )}
                        <span className="truncate">
                          {item.title}
                          {fileCount > 1 && (
                            <span style={{ marginLeft: '5px', fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                              ×{fileCount}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Action Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-hairline)'
                }}>
                  <div>
                    {!isCompleted ? (
                      <button
                        id={`btn-remind-${proj.id}`}
                        onClick={() => openReminderModal(proj.id)}
                        className="btn btn-secondary btn-sm btn-pill"
                        style={{ color: 'var(--warning-light)', borderColor: 'var(--warning-border)', fontSize: '0.8rem' }}
                        title="Preview and send follow-up reminder"
                      >
                        <Send size={13} />
                        {proj.lastReminderSent ? `Send Again (${proj.lastReminderSent})` : 'Send Reminder'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <CheckCircle2 size={14} /> All assets delivered
                      </span>
                    )}
                  </div>

                  <button
                    id={`btn-download-${proj.id}`}
                    onClick={() => handleDownloadAll(proj)}
                    className="btn btn-secondary btn-sm btn-pill"
                    style={{ fontSize: '0.8rem' }}
                  >
                    <Download size={13} />
                    Export ({completedCount} items)
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── Feature Explainer ─────────────────────────────────── */}
      <div className="glass-card" style={{
        marginTop: '48px',
        padding: '32px 28px',
        background: 'linear-gradient(180deg, rgba(16, 22, 38, 0.65) 0%, rgba(9, 13, 22, 0.92) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 24px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.025em' }}>
            Why clients love submitting via DropBrief
          </h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            We eliminated all friction and roadblocks that cause clients to delay deliverables.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {[
            { icon: Sparkles, color: 'var(--accent-primary)', bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.2)',
              title: 'Zero Passwords & No Signups',
              desc: 'Clients click the link and upload immediately. No forgotten passwords, accounts, or friction.' },
            { icon: BellRing, color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)',
              title: 'Automated Friendly Reminders',
              desc: 'The system gently follows up on missing items via Resend. No more awkward manual follow-ups.' },
            { icon: Shield, color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)',
              title: 'Bank-Grade Encryption + GDPR',
              desc: 'Files are encrypted AES-256, hosted in the EU (Ireland/Frankfurt) with automated 30-day purge.' }
          ].map(({ icon: Icon, color, bg, border, title, desc }) => (
            <div key={title} style={{
              padding: '18px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255, 255, 255, 0.018)',
              border: '1px solid var(--border-hairline)'
            }}>
              <div style={{
                width: '36px', height: '36px',
                borderRadius: 'var(--radius-md)',
                background: bg, color, border: `1px solid ${border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '10px'
              }}>
                <Icon size={18} />
              </div>
              <h4 style={{ fontSize: '0.925rem', fontWeight: 800, marginBottom: '5px', letterSpacing: '-0.015em' }}>{title}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
