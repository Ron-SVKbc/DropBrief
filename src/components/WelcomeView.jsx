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
  Image as ImageIcon,
  Copy,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Cpu,
  Bell,
  Globe,
  FileText
} from 'lucide-react';

export default function WelcomeView({ onOpenCreateModal }) {
  const { openAuthModal, addToast } = useApp();
  const [copiedDemoLink, setCopiedDemoLink] = useState(false);

  const handleCopyDemoLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText('https://usedropbrief.xyz/?p=brand-identity');
    setCopiedDemoLink(true);
    addToast('Sample client portal link copied!', 'success', 'Demo Link');
    setTimeout(() => setCopiedDemoLink(false), 2000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* ── AMBIENT AURORA BACKGROUND ─────────────────────────── */}
      <div 
        style={{
          position: 'absolute',
          top: '-140px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1000px',
          maxWidth: '100vw',
          height: '520px',
          background: 'radial-gradient(ellipse 65% 55% at 50% 30%, rgba(99, 102, 241, 0.22) 0%, rgba(139, 92, 246, 0.12) 40%, rgba(236, 72, 153, 0.05) 65%, transparent 80%)',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(30px)'
        }} 
        aria-hidden="true" 
      />

      {/* ── HERO SECTION ──────────────────────────────────────── */}
      <section style={{ padding: 'clamp(44px, 7vw, 88px) 20px clamp(36px, 5vw, 64px)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ maxWidth: '940px', margin: '0 auto' }}>

          {/* Announcement Pill Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              boxShadow: '0 0 24px rgba(99, 102, 241, 0.22)',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#c7d2fe',
              backdropFilter: 'blur(8px)'
            }}>
              <span className="status-dot status-dot-live" aria-hidden="true" />
              <Sparkles size={13} color="#a5b4fc" aria-hidden="true" />
              <span>Micro-SaaS for Freelancers & Creative Agencies</span>
              <span className="badge badge-accent" style={{ fontSize: '0.62rem', padding: '2px 7px' }}>FREE</span>
            </div>
          </div>

          {/* Main Display Headline */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5.8vw, 4.25rem)',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.04em',
            marginBottom: '22px',
            color: 'var(--text-primary)'
          }}>
            Collect client assets & briefs{' '}
            <span style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 45%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 16px rgba(139, 92, 246, 0.35))',
              display: 'inline-block'
            }}>
              without passwords or chaos
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            maxWidth: '690px',
            margin: '0 auto 38px',
            fontWeight: 400
          }}>
            No more lost WhatsApp attachments and forgotten cloud passwords. Send your client a frictionless, secure link for instant drag & drop submissions.
          </p>

          {/* CTA Buttons Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '40px'
          }}>
            <button
              id="hero-btn-register"
              onClick={() => openAuthModal('register')}
              className="btn btn-primary btn-lg btn-pill"
              style={{ 
                boxShadow: 'var(--glow-accent)', 
                fontSize: '1rem', 
                padding: '14px 30px',
                gap: '10px'
              }}
            >
              <UserPlus size={18} aria-hidden="true" />
              <span>Create Free Account</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>

            <button
              id="hero-btn-login"
              onClick={() => openAuthModal('login')}
              className="btn btn-secondary btn-lg btn-pill"
              style={{ fontSize: '0.98rem', padding: '14px 26px', gap: '9px' }}
            >
              <KeyRound size={17} aria-hidden="true" />
              <span>Log in with PIN</span>
            </button>
          </div>

          {/* Trust Value Signals */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '28px',
            flexWrap: 'wrap',
            fontSize: '0.84rem',
            color: 'var(--text-tertiary)'
          }}>
            {[
              '5-second signup without passwords',
              'Clients upload with zero login friction',
              '100% GDPR compliant (EU Frankfurt cloud)'
            ].map((text, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--success)" aria-hidden="true" />
                <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* ── LIVE PRODUCT PREVIEW MOCKUP ───────────────────────── */}
      <section style={{ padding: '0 20px clamp(36px, 5vw, 68px)', position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ maxWidth: '1020px' }}>
          
          <div className="glass-card" style={{
            padding: '24px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(180deg, rgba(15, 21, 37, 0.88) 0%, rgba(9, 13, 23, 0.98) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.32)',
            boxShadow: '0 32px 80px -16px rgba(0, 0, 0, 0.85), 0 0 45px rgba(99, 102, 241, 0.16)',
            position: 'relative',
            overflow: 'hidden'
          }}>

            {/* Window Chrome Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              marginBottom: '20px',
              borderBottom: '1px solid var(--border-hairline)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px rgba(239, 68, 68, 0.5)' }} aria-hidden="true" />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', boxShadow: '0 0 6px rgba(245, 158, 11, 0.5)' }} aria-hidden="true" />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)' }} aria-hidden="true" />
                
                <div style={{
                  marginLeft: '12px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <Lock size={11} color="var(--success)" aria-hidden="true" />
                  <span>usedropbrief.xyz/?p=brand-identity</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-accent" style={{ fontSize: '0.68rem', padding: '3px 9px' }}>
                  <Sparkles size={11} aria-hidden="true" /> Live Portal Preview
                </span>
                <button
                  type="button"
                  onClick={handleCopyDemoLink}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.76rem', padding: '4px 11px', borderRadius: 'var(--radius-full)' }}
                  aria-label="Copy sample client portal link"
                >
                  {copiedDemoLink ? <Check size={13} color="var(--success)" aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                  {copiedDemoLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Showcase Mockup Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px', alignItems: 'start' }}>

              {/* Left — Project Status Overview */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>Waiting for client</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>One-off</span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Website Build & Brand Assets
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    Client: <strong style={{ color: 'var(--text-secondary)' }}>Peter Novak</strong> &bull; Freelancer: <strong style={{ color: 'var(--text-secondary)' }}>Creative Studio</strong>
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Assets delivered:</span>
                    <strong style={{ color: 'var(--accent-primary-light)' }}>3 of 4 items (75%)</strong>
                  </div>
                  <div className="progress-track" style={{ height: '8px' }}>
                    <div className="progress-fill" style={{ width: '75%' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} aria-hidden="true">
                  <div className="btn btn-secondary btn-sm" style={{ fontSize: '0.74rem', pointerEvents: 'none', borderRadius: 'var(--radius-full)' }}>
                    <Send size={12} color="var(--warning)" aria-hidden="true" /> Send Reminder
                  </div>
                  <div className="btn btn-secondary btn-sm" style={{ fontSize: '0.74rem', pointerEvents: 'none', borderRadius: 'var(--radius-full)' }}>
                    <Upload size={12} aria-hidden="true" /> Export ZIP
                  </div>
                </div>
              </div>

              {/* Right — Interactive Checklist Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { icon: CheckCircle2, color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)',
                    title: 'Company Vector Logo (SVG / PDF)', sub: '✓ brand_logo_vector.svg · 1.4 MB', badge: 'Completed', badgeClass: 'badge-success' },
                  { icon: FileCheck2, color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)',
                    title: 'Atmosphere & Team Photography', sub: '✓ 8 high-res photos · Uncompressed', badge: '8 photos', badgeClass: 'badge-success' },
                  { icon: CheckCircle2, color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)',
                    title: 'Website Copy & Brand Story', sub: '✓ Submitted by client in browser', badge: 'Submitted', badgeClass: 'badge-success' },
                ].map(({ icon: Icon, color, bg, border, title, sub, badge, badgeClass }) => (
                  <div key={title} style={{
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <Icon size={17} color={color} style={{ flexShrink: 0 }} aria-hidden="true" />
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block' }} className="truncate">{title}</strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>{sub}</span>
                      </div>
                    </div>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: '0.64rem', flexShrink: 0 }}>{badge}</span>
                  </div>
                ))}

                {/* Pending Upload Item */}
                <div style={{
                  background: 'rgba(99, 102, 241, 0.06)',
                  border: '1.5px dashed var(--accent-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-inner-highlight)'
                }}>
                  <Upload size={18} color="var(--accent-primary)" style={{ margin: '0 auto 5px' }} aria-hidden="true" />
                  <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)', display: 'block' }}>
                    Brand Guidelines & Color Codes (PDF)
                  </strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
                    Client drags file here &bull; No login required
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── COMPARISON SECTION ────────────────────────────────── */}
      <section style={{
        padding: '64px 20px 72px',
        background: 'rgba(255, 255, 255, 0.012)',
        borderTop: '1px solid var(--border-hairline)',
        borderBottom: '1px solid var(--border-hairline)'
      }}>
        <div className="container" style={{ maxWidth: '980px' }}>
          <div style={{ textAlign: 'center', maxWidth: '620px', margin: '0 auto 44px' }}>
            <span className="badge badge-accent" style={{ marginBottom: '12px' }}>Why DropBrief?</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.35rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Stop drowning in client asset chaos
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.925rem', marginTop: '8px' }}>
              Compare the friction of old fragmented channels with DropBrief's frictionless modern flow.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '22px' }}>

            {/* Old Way */}
            <div className="glass-card" style={{
              padding: '28px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              background: 'rgba(239, 68, 68, 0.03)',
              borderRadius: 'var(--radius-xl)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '9px', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', color: 'var(--danger)' }} aria-hidden="true">
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fca5a5', letterSpacing: '-0.02em' }}>
                    Old Way (WhatsApp, Email Chains)
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>Slow, messy, and unprofessional</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                {[
                  'Photos sent over WhatsApp get compressed and lose original resolution.',
                  'WeTransfer download links expire after 7 days — you have to ask all over again.',
                  'Clients forget Google Drive logins and postpone until "next week".',
                  'You waste unpaid hours drafting awkward follow-up reminder emails.'
                ].map((text, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DropBrief Way */}
            <div className="glass-card" style={{
              padding: '28px',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              background: 'rgba(16, 185, 129, 0.035)',
              boxShadow: '0 0 36px rgba(16, 185, 129, 0.1)',
              borderRadius: 'var(--radius-xl)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '9px', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', color: 'var(--success)' }} aria-hidden="true">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#86efac', letterSpacing: '-0.02em' }}>
                    With DropBrief (Zero-Friction)
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>Fast, secure, and modern</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                {[
                  { strong: '1 permanent link:', rest: 'Clients click and upload instantly with zero login or password.' },
                  { strong: 'Uncompressed originals:', rest: 'Files retain 100% original quality in encrypted cloud storage.' },
                  { strong: 'Live image previews:', rest: 'Instant browser verification of submitted photos and deliverables.' },
                  { strong: 'Automated reminders:', rest: 'Polite automated email notifications keep deadlines on track.' }
                ].map(({ strong, rest }, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <Check size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                    <span><strong>{strong}</strong> {rest}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS IN 3 STEPS ───────────────────────────── */}
      <section style={{ padding: '72px 20px 80px' }}>
        <div className="container" style={{ maxWidth: '980px' }}>
          <div style={{ textAlign: 'center', maxWidth: '580px', margin: '0 auto 48px' }}>
            <span className="badge badge-accent" style={{ marginBottom: '12px' }}>Simple Flow</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.35rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              How it works in 3 easy steps
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '22px' }}>
            {[
              { num: '01', icon: Layers, color: 'var(--accent-primary)', bg: 'rgba(99,102,241,0.14)', border: 'rgba(99,102,241,0.28)', glow: '0 0 16px rgba(99,102,241,0.3)',
                title: '1. Pick a template', body: 'Choose a template (Web Design, Branding, Social Media, Custom) or build your own checklist. Setup takes under 30 seconds.' },
              { num: '02', icon: Send, color: 'var(--warning)', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.28)', glow: '0 0 16px rgba(245,158,11,0.3)',
                title: '2. Send link to client', body: 'Send the direct link via WhatsApp, Slack, or email. The client opens the link and sees their checklist immediately with zero login friction.' },
              { num: '03', icon: CheckCircle2, color: 'var(--success)', bg: 'rgba(16,185,129,0.14)', border: 'rgba(16,185,129,0.28)', glow: '0 0 16px rgba(16,185,129,0.3)',
                title: '3. Track & export assets', body: 'Watch the realtime progress bar update as assets arrive. Download everything in one clean package and get straight to work.' }
            ].map(({ num, icon: Icon, color, bg, border, glow, title, body }) => (
              <div key={num} className="glass-card glass-card-interactive" style={{ padding: '28px', position: 'relative', borderRadius: 'var(--radius-xl)' }}>
                <div style={{
                  position: 'absolute', top: '18px', right: '22px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.4rem', fontWeight: 800,
                  color: 'rgba(255, 255, 255, 0.05)',
                  userSelect: 'none', letterSpacing: '-0.04em'
                }} aria-hidden="true">{num}</div>
                <div style={{
                  width: '46px', height: '46px',
                  borderRadius: 'var(--radius-md)',
                  background: bg, color,
                  border: `1px solid ${border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: glow
                }} aria-hidden="true">
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{title}</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', lineHeight: 1.62 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HIGH CONVERSION BOTTOM CTA ────────────────────────── */}
      <section style={{ padding: '0 20px 88px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '780px' }}>
          <div className="glass-card" style={{
            padding: '56px 40px',
            background: 'linear-gradient(180deg, rgba(28, 38, 68, 0.72) 0%, rgba(11, 16, 28, 0.98) 100%)',
            border: '1px solid var(--border-accent)',
            boxShadow: 'var(--glow-accent-lg), var(--shadow-xl)',
            borderRadius: 'var(--radius-2xl)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {/* Radiant Ambient Core */}
            <div style={{
              position: 'absolute', top: '-90px', left: '50%', transform: 'translateX(-50%)',
              width: '440px', height: '180px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.36) 0%, rgba(99, 102, 241, 0.1) 50%, transparent 75%)',
              pointerEvents: 'none',
              filter: 'blur(20px)'
            }} aria-hidden="true" />

            <span className="badge badge-accent" style={{ marginBottom: '18px', padding: '4px 12px' }}>Start Instantly</span>

            <h3 style={{ fontSize: 'clamp(1.85rem, 3.8vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.035em', marginBottom: '14px', lineHeight: 1.15, color: 'var(--text-primary)' }}>
              Save hours of endless<br />client follow-ups
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '540px', margin: '0 auto 32px', lineHeight: 1.65 }}>
              Set up your profile in 5 seconds. Get your personal PIN code and start collecting client assets effortlessly. Free forever.
            </p>

            <button
              onClick={() => openAuthModal('register')}
              className="btn btn-primary btn-lg btn-pill"
              style={{ margin: '0 auto', boxShadow: 'var(--glow-accent)', padding: '15px 36px', fontSize: '1.02rem', gap: '10px' }}
            >
              <UserPlus size={20} aria-hidden="true" />
              <span>Create Free Account with PIN</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>

          </div>
        </div>
      </section>

    </div>
  );
}
