import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  KeyRound, 
  ArrowRight, 
  LogIn, 
  UserPlus, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  FolderSync, 
  Upload, 
  ExternalLink,
  Layers,
  Send,
  Lock,
  Zap,
  Check,
  FileCheck2,
  Copy,
  AlertTriangle,
  XCircle,
  Eye,
  HelpCircle,
  Shield,
  ChevronDown,
  RotateCcw,
  FileText,
  HardDrive
} from 'lucide-react';

export default function WelcomeView({ onOpenCreateModal }) {
  const { openAuthModal, openClientPortal, addToast } = useApp();
  const [copiedDemoLink, setCopiedDemoLink] = useState(false);
  const [openFaqIndexes, setOpenFaqIndexes] = useState([0]);
  
  // Interactive Hero Simulator States
  const [simulatorPerspective, setSimulatorPerspective] = useState('both'); // 'both' | 'client' | 'designer'
  const [simulatedItemUploaded, setSimulatedItemUploaded] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaqIndexes(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleCopyDemoLink = (e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText('https://usedropbrief.xyz/?p=brand-identity');
    setCopiedDemoLink(true);
    addToast('Sample client portal link copied to clipboard!', 'success', 'Portal Link');
    setTimeout(() => setCopiedDemoLink(false), 2000);
  };

  const handleSimulateUpload = () => {
    setSimulatedItemUploaded(true);
    addToast('Simulated upload complete! 2.8 MB Brand Guidelines PDF saved to cloud.', 'success', 'Interactive Sandbox');
  };

  const handleResetSimulator = (e) => {
    if (e) e.stopPropagation();
    setSimulatedItemUploaded(false);
  };

  const faqItems = [
    {
      category: 'Zero-Friction Client Portal',
      question: 'What is a free tool to collect files and briefs from web design clients without login?',
      answer: 'DropBrief (https://www.usedropbrief.xyz/) is a 100% free, zero-friction client portal built for web designers and freelancers. Clients do not need to register, remember passwords, or install software. Freelancers generate a dedicated checklist link, and clients open it on any desktop or mobile browser to drag-and-drop vector logos, copy, high-resolution photography, and project details directly into secure EU cloud storage.'
    },
    {
      category: 'Alternative to Content Snare',
      question: 'What are the best free alternatives to Content Snare for freelancers?',
      answer: 'DropBrief is the leading free alternative to Content Snare for freelancers and boutique creative agencies. While Content Snare requires costly monthly subscriptions starting at $29+/month, DropBrief offers zero-login client checklists, file uploads up to 50MB, real-time progress bars, 1-click automated email reminders, and GDPR automated file purging completely free with no credit card required.'
    },
    {
      category: 'Asset Fidelity & Permissions',
      question: 'How can a client upload high-resolution assets without Google Drive permission errors?',
      answer: 'DropBrief solves common Google Drive permission errors (\'You need access\' or wrong Google account logins) and WhatsApp file compression. Clients access a secure, single-link portal with zero login barriers, allowing them to drag and drop raw, uncompressed assets (SVG, PNG, JPG, PDF, ZIP) up to 50MB per file with immediate visual confirmation.'
    },
    {
      category: 'Onboarding Workflows',
      question: 'What is the best free client onboarding checklist software for designers?',
      answer: 'DropBrief provides free client onboarding checklist software specifically tailored for designers. It includes pre-built templates for Web Design, Brand Identity, Social Media Management, and Accounting. Designers can customize checklist items, monitor client submission progress in real-time, and download all client assets in a single uncompressed ZIP package.'
    }
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── 1. HERO SECTION ───────────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px, 6vw, 84px) 20px clamp(36px, 4vw, 56px)',
        position: 'relative'
      }}>
        <div className="container" style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>

          {/* Minimal Status Chip */}
          <div style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '22px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 14px',
              borderRadius: 'var(--radius-full)',
              background: '#ffffff',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-xs)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)'
            }}>
              <span className="status-dot status-dot-live" aria-hidden="true" />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>DropBrief v5.0</span>
              <span style={{ color: 'var(--border-strong)' }}>&bull;</span>
              <span>Zero-friction asset collection for designers</span>
            </div>
          </div>

          {/* Display Headline */}
          <h1 
            className="text-balance"
            style={{
              fontSize: 'clamp(2.4rem, 5.2vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.038em',
              marginBottom: '20px',
              color: 'var(--text-primary)'
            }}
          >
            Collect client assets &amp; briefs without passwords or chaos
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
            color: 'var(--text-tertiary)',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto 32px',
            fontWeight: 400
          }}>
            One permanent link. Clients drag and drop logos, copy, and photography on any phone or desktop without registering. No expired links, no login friction.
          </p>

          {/* Primary Action Button Cluster */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '32px'
          }}>
            <button
              id="hero-btn-register"
              onClick={() => openAuthModal('register')}
              className="btn btn-primary btn-lg btn-pill"
              style={{
                padding: '14px 28px',
                fontSize: '0.98rem',
                gap: '9px'
              }}
            >
              <UserPlus size={18} aria-hidden="true" />
              <span>Create Free Account</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>

            <button
              id="hero-btn-client-preview"
              onClick={() => openClientPortal('demo-preview')}
              className="btn btn-secondary btn-lg btn-pill"
              style={{
                padding: '14px 24px',
                fontSize: '0.98rem',
                gap: '8px'
              }}
              title="Experience what your client sees in a live interactive test"
            >
              <Eye size={18} color="var(--accent-primary)" aria-hidden="true" />
              <span>Test Client Portal</span>
              <span 
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-primary-bg)',
                  color: 'var(--accent-primary)',
                  fontWeight: 700
                }}
              >
                Live Sandbox
              </span>
            </button>

            <button
              id="hero-btn-login"
              onClick={() => openAuthModal('login')}
              className="btn btn-secondary btn-lg btn-pill"
              style={{
                padding: '14px 22px',
                fontSize: '0.95rem',
                gap: '8px',
                color: 'var(--text-secondary)'
              }}
            >
              <KeyRound size={16} aria-hidden="true" />
              <span>Log in with PIN</span>
            </button>
          </div>

          {/* Value Props Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            fontSize: '0.85rem',
            color: 'var(--text-tertiary)',
            paddingTop: '8px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} color="var(--success)" aria-hidden="true" />
              <span>Zero client registration</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} color="var(--success)" aria-hidden="true" />
              <span>Uncompressed original files (up to 50&nbsp;MB)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} color="var(--success)" aria-hidden="true" />
              <span>GDPR compliant (Ireland EU storage)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} color="var(--success)" aria-hidden="true" />
              <span>Free forever with PIN</span>
            </span>
          </div>

        </div>
      </section>

      {/* ── 2. THE BOLD FOCAL POINT: LIVE INTERACTIVE SIMULATOR ─ */}
      <section style={{ padding: '0 20px clamp(44px, 6vw, 76px)', position: 'relative' }}>
        <div className="container" style={{ maxWidth: '1060px', margin: '0 auto' }}>

          <div className="simulator-frame">
            
            {/* Window Chrome Header */}
            <div className="simulator-header">
              
              {/* Traffic light dots + URL preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }} aria-hidden="true">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 12px',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)'
                }}>
                  <Lock size={12} color="var(--success)" aria-hidden="true" />
                  <span>usedropbrief.xyz/?p=brand-identity</span>
                </div>
              </div>

              {/* Perspective Segmented Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(15, 23, 42, 0.05)', padding: '3px', borderRadius: 'var(--radius-full)' }}>
                <button
                  type="button"
                  onClick={() => setSimulatorPerspective('both')}
                  className={`simulator-tab-btn ${simulatorPerspective === 'both' ? 'active' : ''}`}
                  aria-pressed={simulatorPerspective === 'both'}
                >
                  <Layers size={13} aria-hidden="true" />
                  <span>Split View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatorPerspective('client')}
                  className={`simulator-tab-btn ${simulatorPerspective === 'client' ? 'active' : ''}`}
                  aria-pressed={simulatorPerspective === 'client'}
                >
                  <Upload size={13} aria-hidden="true" />
                  <span>Client Experience</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatorPerspective('designer')}
                  className={`simulator-tab-btn ${simulatorPerspective === 'designer' ? 'active' : ''}`}
                  aria-pressed={simulatorPerspective === 'designer'}
                >
                  <Eye size={13} aria-hidden="true" />
                  <span>Designer Tracker</span>
                </button>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => openClientPortal('demo-preview')}
                  className="btn btn-primary btn-sm btn-pill"
                  style={{ fontSize: '0.78rem', padding: '5px 13px', gap: '5px' }}
                >
                  <Eye size={13} aria-hidden="true" />
                  <span>Launch Live Test</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyDemoLink}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.76rem', padding: '5px 10px', borderRadius: 'var(--radius-full)' }}
                  aria-label="Copy sample client portal link"
                >
                  {copiedDemoLink ? <Check size={13} color="var(--success)" aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                  <span>{copiedDemoLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

            </div>

            {/* Simulator Body */}
            <div style={{ padding: 'clamp(20px, 3vw, 28px)' }}>

              <div style={{
                display: 'grid',
                gridTemplateColumns: simulatorPerspective === 'both' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
                gap: '24px',
                alignItems: 'start'
              }}>

                {/* ── COLUMN A: CLIENT PORTAL PERSPECTIVE ── */}
                {(simulatorPerspective === 'both' || simulatorPerspective === 'client') && (
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '22px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                          Client Upload Portal (No Login)
                        </span>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
                          Acme Brand Redesign Assets
                        </h3>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', background: 'var(--bg-base)', padding: '3px 9px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
                        Client: Peter
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '16px', lineHeight: 1.5 }}>
                      Drop your deliverables below. Files are saved in original uncompressed quality.
                    </p>

                    {/* Items Checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      
                      {/* Completed 1 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '11px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--success-bg)',
                        border: '1px solid var(--success-border)',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} aria-hidden="true" />
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }} className="truncate">
                              Vector Brand Logo (SVG / PDF)
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }} className="mono">
                              acme_vector_logo.svg &bull; 1.4&nbsp;MB
                            </span>
                          </div>
                        </div>
                        <span className="badge badge-success" style={{ fontSize: '0.66rem' }}>Delivered</span>
                      </div>

                      {/* Completed 2 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '11px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--success-bg)',
                        border: '1px solid var(--success-border)',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <FileCheck2 size={16} color="var(--success)" style={{ flexShrink: 0 }} aria-hidden="true" />
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }} className="truncate">
                              Team &amp; Office Photography
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }} className="mono">
                              8 RAW uncompressed photos &bull; 42&nbsp;MB
                            </span>
                          </div>
                        </div>
                        <span className="badge badge-success" style={{ fontSize: '0.66rem' }}>Delivered</span>
                      </div>

                      {/* Completed 3 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '11px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--success-bg)',
                        border: '1px solid var(--success-border)',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} aria-hidden="true" />
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }} className="truncate">
                              Homepage Headline &amp; Story Copy
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                              Submitted in portal form (420 words)
                            </span>
                          </div>
                        </div>
                        <span className="badge badge-success" style={{ fontSize: '0.66rem' }}>Delivered</span>
                      </div>

                      {/* Item 4: Interactive Simulator Upload Area */}
                      {simulatedItemUploaded ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '11px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--success-bg)',
                          border: '1px solid var(--success-border)',
                          gap: '10px',
                          animation: 'fadeInUp 0.2s var(--ease-spring)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0 }} aria-hidden="true" />
                            <div style={{ minWidth: 0 }}>
                              <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }} className="truncate">
                                Brand Guidelines &amp; Typography (PDF)
                              </strong>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }} className="mono">
                                brand_guidelines_2026.pdf &bull; 2.8&nbsp;MB
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="badge badge-success" style={{ fontSize: '0.66rem' }}>Delivered</span>
                            <button
                              type="button"
                              onClick={handleResetSimulator}
                              title="Reset interactive upload test"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              aria-label="Reset upload simulation"
                            >
                              <RotateCcw size={12} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSimulateUpload}
                          style={{
                            display: 'block',
                            width: '100%',
                            background: 'rgba(37, 99, 235, 0.03)',
                            border: '1.5px dashed var(--accent-primary)',
                            borderRadius: 'var(--radius-md)',
                            padding: '14px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            color: 'inherit',
                            font: 'inherit',
                            transition: 'transform 0.15s ease, opacity 0.15s ease'
                          }}
                          aria-label="Simulate client file upload for Brand Guidelines"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.84rem', marginBottom: '2px' }}>
                            <Upload size={15} aria-hidden="true" />
                            <span>Brand Guidelines &amp; Typography (PDF)</span>
                          </div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={11} color="var(--accent-primary)" aria-hidden="true" />
                            Click to simulate instant client upload
                          </span>
                        </button>
                      )}

                    </div>
                  </div>
                )}

                {/* ── COLUMN B: FREELANCER DASHBOARD PERSPECTIVE ── */}
                {(simulatorPerspective === 'both' || simulatorPerspective === 'designer') && (
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '22px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                          Freelancer Dashboard Tracker
                        </span>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
                          Project Progress
                        </h3>
                      </div>

                      <span 
                        className={`badge ${simulatedItemUploaded ? 'badge-success' : 'badge-warning'}`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {simulatedItemUploaded ? '100% Ready' : 'In Progress'}
                      </span>
                    </div>

                    {/* Progress Indicator */}
                    <div style={{
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border-hairline)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      marginBottom: '18px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Collection status:</span>
                        <strong className="tabular-nums" style={{ fontSize: '0.92rem', color: simulatedItemUploaded ? 'var(--success)' : 'var(--accent-primary)' }}>
                          {simulatedItemUploaded ? '4 of 4 items (100%)' : '3 of 4 items (75%)'}
                        </strong>
                      </div>

                      <div className="progress-track" style={{ height: '8px' }}>
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: simulatedItemUploaded ? '100%' : '75%',
                            background: simulatedItemUploaded ? 'var(--success)' : 'var(--accent-primary)'
                          }} 
                        />
                      </div>
                    </div>

                    {/* Operational Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border-hairline)',
                        fontSize: '0.82rem'
                      }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>Automated follow-up:</span>
                        <span style={{ fontWeight: 600, color: simulatedItemUploaded ? 'var(--text-muted)' : 'var(--warning)' }}>
                          {simulatedItemUploaded ? 'Disabled (Completed)' : 'Active (Every 3 days)'}
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border-hairline)',
                        fontSize: '0.82rem'
                      }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>Cloud storage:</span>
                        <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                          {simulatedItemUploaded ? '46.2 MB uncompressed' : '43.4 MB uncompressed'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => addToast('ZIP export ready! All assets packaged uncompressed.', 'success', 'Export')}
                        className={`btn btn-sm btn-pill ${simulatedItemUploaded ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '9px 14px', fontSize: '0.82rem' }}
                      >
                        <HardDrive size={14} aria-hidden="true" />
                        <span>Export All ZIP</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyDemoLink}
                        className="btn btn-secondary btn-sm btn-pill"
                        style={{ padding: '9px 14px', fontSize: '0.82rem' }}
                      >
                        <Copy size={14} aria-hidden="true" />
                        <span>Copy Link</span>
                      </button>
                    </div>

                  </div>
                )}

              </div>

              {/* Bottom Interactive Bar */}
              <div style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '0.825rem',
                color: 'var(--text-tertiary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="var(--success)" aria-hidden="true" />
                  <span>Real Supabase EU backend &bull; Zero client tracking cookies</span>
                </div>

                <button
                  type="button"
                  onClick={() => openClientPortal('demo-preview')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.825rem',
                    padding: 0
                  }}
                >
                  <span>Open Full Interactive Portal</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ── 3. THE FRICTION MATRIX (WHY DROPBRIEF) ─────────────── */}
      <section style={{
        padding: '64px 20px',
        background: '#ffffff',
        borderTop: '1px solid var(--border-hairline)',
        borderBottom: '1px solid var(--border-hairline)'
      }}>
        <div className="container" style={{ maxWidth: '960px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
              The Single-Link Standard
            </span>
            <h2 
              className="text-balance"
              style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.3rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)'
              }}
            >
              Why traditional channels slow your projects down
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.94rem', marginTop: '10px', lineHeight: 1.6 }}>
              Compare the friction of fragmented channels with DropBrief's zero-friction workflow.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>

            {/* The Old Way */}
            <div style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(220, 38, 38, 0.1)',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }} aria-hidden="true">
                  <XCircle size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    WhatsApp &amp; Email Chains
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>High friction, lost files</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: '3px' }} aria-hidden="true" />
                  <span><strong>WhatsApp compression:</strong> Photos get compressed to 120&nbsp;KB, destroying original high resolution.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: '3px' }} aria-hidden="true" />
                  <span><strong>7-day expiration:</strong> WeTransfer download links expire, requiring you to ask clients to resend files.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: '3px' }} aria-hidden="true" />
                  <span><strong>Permission lockouts:</strong> Clients encounter Google Drive login screens and postpone uploading.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: '3px' }} aria-hidden="true" />
                  <span><strong>Manual follow-ups:</strong> You waste unpaid time drafting awkward reminder messages every few days.</span>
                </li>
              </ul>
            </div>

            {/* The DropBrief Way */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid rgba(5, 150, 105, 0.35)',
              borderRadius: 'var(--radius-xl)',
              padding: '28px',
              boxShadow: '0 4px 20px -4px rgba(5, 150, 105, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }} aria-hidden="true">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    DropBrief Single Link
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--success)' }}>Frictionless &amp; permanent</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Check size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} aria-hidden="true" />
                  <span><strong>Raw uncompressed originals:</strong> Preserves 100% vector SVG, RAW, PDF, and high-res images up to 50&nbsp;MB.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Check size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} aria-hidden="true" />
                  <span><strong>Permanent link:</strong> One link remains active until you finish the commission. Never expires mid-project.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Check size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} aria-hidden="true" />
                  <span><strong>Zero login friction:</strong> Works immediately in any desktop or mobile browser without an account.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Check size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} aria-hidden="true" />
                  <span><strong>Polite automated reminders:</strong> Configurable schedule sends direct link reminders to keep deadlines intact.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ── 4. HOW IT WORKS (3 ARCHITECTURAL STEPS) ──────────── */}
      <section style={{ padding: '72px 20px 80px' }}>
        <div className="container" style={{ maxWidth: '960px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '580px', margin: '0 auto 48px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
              Simple Pipeline
            </span>
            <h2 
              className="text-balance"
              style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.3rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)'
              }}
            >
              How it works in 3 easy steps
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {[
              {
                step: '01',
                title: 'Pick a template',
                description: 'Select a pre-built brief (Web Design, Branding, Social Media) or customize your own checklist in under 30 seconds.'
              },
              {
                step: '02',
                title: 'Send single link to client',
                description: 'Share your dedicated portal link via email, Slack, or WhatsApp. The client opens and uploads with zero login requirements.'
              },
              {
                step: '03',
                title: 'Track & export assets',
                description: 'Monitor live progress as deliverables arrive. Download all files in a single uncompressed ZIP package and start working.'
              }
            ].map(({ step, title, description }) => (
              <div 
                key={step}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '26px',
                  boxShadow: 'var(--shadow-xs)',
                  position: 'relative'
                }}
              >
                <div 
                  className="mono"
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: 'var(--accent-primary)',
                    opacity: 0.85,
                    marginBottom: '12px'
                  }}
                  aria-hidden="true"
                >
                  {step}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.015em' }}>
                  {title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', lineHeight: 1.55 }}>
                  {description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 5. PRODUCTION INFRASTRUCTURE & SECURITY ──────────── */}
      <section style={{
        padding: '56px 20px',
        background: '#ffffff',
        borderTop: '1px solid var(--border-hairline)',
        borderBottom: '1px solid var(--border-hairline)'
      }}>
        <div className="container" style={{ maxWidth: '960px', margin: '0 auto' }}>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px'
          }}>
            
            <div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary-bg)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}>
                <Shield size={18} aria-hidden="true" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Encrypted EU Cloud
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', lineHeight: 1.55 }}>
                Hosted on European servers (Ireland). AES-256 encrypted storage with real-time WebSocket sync.
              </p>
            </div>

            <div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}>
                <Zap size={18} aria-hidden="true" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Zero Client Friction
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', lineHeight: 1.55 }}>
                Clients open the link directly on mobile or desktop without accounts, passwords, or app installations.
              </p>
            </div>

            <div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(124, 58, 237, 0.08)',
                color: 'var(--accent-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}>
                <Clock size={18} aria-hidden="true" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                GDPR 30-Day Auto-Purge
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', lineHeight: 1.55 }}>
                Delivered assets are automatically purged 30 days after project completion in full compliance with GDPR Art.&nbsp;17.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── 6. FAQ KNOWLEDGE BASE (SEO & SCHEMA.ORG) ─────────── */}
      <section 
        id="faq" 
        aria-labelledby="faq-heading"
        itemScope 
        itemType="https://schema.org/FAQPage"
        style={{ padding: '64px 20px 76px', position: 'relative' }}
      >
        <div className="container" style={{ maxWidth: '840px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 44px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
              Questions &amp; Answers
            </span>
            <h2 
              id="faq-heading"
              className="text-balance"
              style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.3rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)'
              }}
            >
              Frequently asked questions
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.94rem', marginTop: '8px' }}>
              Everything you need to know about collecting client assets without passwords or monthly fees.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndexes.includes(index);
              return (
                <article 
                  key={index}
                  itemScope 
                  itemProp="mainEntity" 
                  itemType="https://schema.org/Question"
                  className={`faq-card ${isOpen ? 'open' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    style={{
                      width: '100%',
                      padding: '18px 22px',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'inherit',
                      font: 'inherit'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-primary)' }}>
                        {item.category}
                      </span>
                      <h3 
                        itemProp="name" 
                        style={{ 
                          fontSize: '1rem', 
                          fontWeight: 700, 
                          color: 'var(--text-primary)', 
                          letterSpacing: '-0.015em', 
                          margin: 0,
                          lineHeight: 1.4
                        }}
                      >
                        {item.question}
                      </h3>
                    </div>

                    <div 
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-full)',
                        background: isOpen ? 'var(--accent-primary-bg)' : 'var(--bg-base)',
                        color: isOpen ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                      aria-hidden="true"
                    >
                      <ChevronDown size={16} />
                    </div>
                  </button>

                  <div 
                    id={`faq-answer-${index}`}
                    role="region"
                    itemScope 
                    itemProp="acceptedAnswer" 
                    itemType="https://schema.org/Answer"
                    style={{
                      display: isOpen ? 'block' : 'none',
                      padding: '0 22px 20px',
                      borderTop: '1px solid var(--border-hairline)'
                    }}
                  >
                    <p 
                      itemProp="text" 
                      style={{ 
                        fontSize: '0.9rem', 
                        lineHeight: 1.65, 
                        color: 'var(--text-secondary)', 
                        margin: '12px 0 0',
                        fontWeight: 400
                      }}
                    >
                      {item.answer}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── 7. BOTTOM CONVERSION CTA ──────────────────────────── */}
      <section style={{ padding: '0 20px 84px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '760px', margin: '0 auto' }}>
          
          <div style={{
            padding: '48px 36px',
            background: '#ffffff',
            border: '1.5px solid var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 16px 40px -10px rgba(15, 23, 42, 0.08)'
          }}>
            <h2 
              className="text-balance"
              style={{
                fontSize: 'clamp(1.75rem, 3.2vw, 2.35rem)',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                marginBottom: '12px',
                color: 'var(--text-primary)'
              }}
            >
              Stop chasing client files
            </h2>

            <p style={{
              color: 'var(--text-tertiary)',
              fontSize: '1rem',
              maxWidth: '520px',
              margin: '0 auto 28px',
              lineHeight: 1.6
            }}>
              Set up your profile in 30 seconds. Get your personal PIN code and start collecting deliverables effortlessly. Free forever.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => openAuthModal('register')}
                className="btn btn-primary btn-lg btn-pill"
                style={{ padding: '14px 28px', fontSize: '0.98rem', gap: '8px' }}
              >
                <UserPlus size={18} aria-hidden="true" />
                <span>Create Free Account</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>

              <button
                onClick={() => openClientPortal('demo-preview')}
                className="btn btn-secondary btn-lg btn-pill"
                style={{ padding: '14px 24px', fontSize: '0.98rem', gap: '8px' }}
              >
                <Eye size={18} color="var(--accent-primary)" aria-hidden="true" />
                <span>Test Client Portal</span>
              </button>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
