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
  Globe
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(40px, 7vw, 80px) 20px clamp(32px, 5vw, 56px)', textAlign: 'center', position: 'relative' }}>
        <div className="container" style={{ maxWidth: '920px', margin: '0 auto' }}>

          {/* Announcement Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              boxShadow: '0 0 18px rgba(99, 102, 241, 0.2)',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#c7d2fe'
            }}>
              <span className="status-dot status-dot-live" aria-hidden="true" />
              <Sparkles size={13} color="#a5b4fc" aria-hidden="true" />
              <span>Micro-SaaS for Freelancers & Creative Agencies</span>
              <span className="badge badge-accent" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>FREE</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            marginBottom: '20px',
            color: 'var(--text-primary)'
          }}>
            Collect client assets & briefs{' '}
            <span style={{
              background: 'var(--gradient-brand)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 12px rgba(99, 102, 241, 0.3))'
            }}>
              without passwords or chaos
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            maxWidth: '680px',
            margin: '0 auto 36px',
            fontWeight: 400
          }}>
            No more endless WhatsApp messages and lost attachments. Create a free account in 5 seconds and send your client a friction-free link for instant uploads.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '36px'
          }}>
            <button
              id="hero-btn-register"
              onClick={() => openAuthModal('register')}
              className="btn btn-primary btn-lg btn-pill"
              style={{ boxShadow: 'var(--glow-accent)', fontSize: '0.975rem', padding: '13px 28px' }}
            >
              <UserPlus size={18} aria-hidden="true" />
              Create Free Account
              <ArrowRight size={16} aria-hidden="true" />
            </button>

            <button
              id="hero-btn-login"
              onClick={() => openAuthModal('login')}
              className="btn btn-secondary btn-lg btn-pill"
              style={{ fontSize: '0.95rem', padding: '13px 24px' }}
            >
              <KeyRound size={17} aria-hidden="true" />
              Log in with PIN
            </button>
          </div>

          {/* Trust signals */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            fontSize: '0.815rem',
            color: 'var(--text-tertiary)'
          }}>
            {[
              '5-second signup without passwords',
              'Clients upload with zero login friction',
              '100% GDPR compliant (EU hosted)'
            ].map((text, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <CheckCircle2 size={15} color="var(--success)" aria-hidden="true" />
                {text}
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* ── LIVE PRODUCT PREVIEW ──────────────────────────────── */}
      <section style={{ padding: '0 20px clamp(32px, 5vw, 64px)' }}>
        <div className="container" style={{ maxWidth: '980px' }}>
          <div className="glass-card" style={{
            padding: '22px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.82) 0%, rgba(9, 13, 22, 0.95) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.28)',
            boxShadow: '0 30px 64px -16px rgba(0, 0, 0, 0.8), 0 0 48px rgba(99, 102, 241, 0.12)',
            position: 'relative',
            overflow: 'hidden'
          }}>

            {/* Window Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              marginBottom: '18px',
              borderBottom: '1px solid var(--border-hairline)',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} aria-hidden="true" />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} aria-hidden="true" />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} aria-hidden="true" />
                <span style={{ marginLeft: '10px', fontSize: '0.78rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  usedropbrief.xyz/?p=brand-identity
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-accent" style={{ fontSize: '0.68rem' }}>
                  <Sparkles size={10} aria-hidden="true" /> Live Portal Preview
                </span>
                <button
                  type="button"
                  onClick={handleCopyDemoLink}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                  aria-label="Copy sample client portal link"
                >
                  {copiedDemoLink ? <Check size={12} color="var(--success)" aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                  {copiedDemoLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Showcase Mockup Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', alignItems: 'start' }}>

              {/* Left — Project Status Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.022)',
                border: '1px solid var(--border-hairline)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem', marginBottom: '7px' }}>Waiting for client</span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    Website Build & Brand Assets
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Client: <strong style={{ color: 'var(--text-secondary)' }}>Peter Novak</strong> &bull; Freelancer: <strong style={{ color: 'var(--text-secondary)' }}>Creative Studio</strong>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Assets delivered:</span>
                    <strong style={{ color: 'var(--accent-primary)' }}>3 of 4 (75%)</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: '75%' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }} aria-hidden="true">
                  <div className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', pointerEvents: 'none' }}>
                    <Send size={12} color="var(--warning)" aria-hidden="true" /> Send Reminder
                  </div>
                  <div className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', pointerEvents: 'none' }}>
                    <Upload size={12} aria-hidden="true" /> Export JSON
                  </div>
                </div>
              </div>

              {/* Right — Items Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { icon: CheckCircle2, done: true, color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)',
                    title: 'Company Vector Logo (SVG / PDF)', sub: '✓ brand_logo_vector.svg · 1.4 MB', badge: 'Done', badgeClass: 'badge-success' },
                  { icon: FileCheck2, done: true, color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)',
                    title: 'Atmosphere & Food Photography', sub: '✓ 8 photos · Original quality preserved', badge: '8 photos', badgeClass: 'badge-success' },
                  { icon: CheckCircle2, done: true, color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)',
                    title: 'Copy: "Our Story & Philosophy"', sub: '✓ Completed by client in browser', badge: 'Submitted', badgeClass: 'badge-success' },
                ].map(({ icon: Icon, done, color, bg, border, title, sub, badge, badgeClass }) => (
                  <div key={title} style={{
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      <Icon size={16} color={color} style={{ flexShrink: 0 }} aria-hidden="true" />
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: '0.835rem', color: 'var(--text-primary)', display: 'block' }} className="truncate">{title}</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{sub}</span>
                      </div>
                    </div>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: '0.62rem', flexShrink: 0 }}>{badge}</span>
                  </div>
                ))}

                {/* Pending item */}
                <div style={{
                  background: 'rgba(99, 102, 241, 0.055)',
                  border: '1.5px dashed var(--accent-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <Upload size={18} color="var(--accent-primary)" style={{ margin: '0 auto 4px' }} aria-hidden="true" />
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block' }}>
                    Brand Guidelines & Copy (PDF)
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
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
        padding: '56px 20px 64px',
        background: 'rgba(255, 255, 255, 0.012)',
        borderTop: '1px solid var(--border-hairline)',
        borderBottom: '1px solid var(--border-hairline)'
      }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 40px' }}>
            <span className="badge badge-accent" style={{ marginBottom: '12px' }}>Why DropBrief?</span>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Stop drowning in client asset chaos
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: '8px' }}>
              See the difference between messy communication and a streamlined workflow.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

            {/* Old Way */}
            <div className="glass-card" style={{
              padding: '26px',
              border: '1px solid rgba(239, 68, 68, 0.22)',
              background: 'rgba(239, 68, 68, 0.025)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', color: 'var(--danger)' }} aria-hidden="true">
                  <XCircle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fca5a5', letterSpacing: '-0.02em' }}>
                    Old Way (WhatsApp, Email Chains)
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Slow, messy, and unprofessional</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {[
                  'Photos sent over WhatsApp are heavily compressed and lose quality.',
                  'WeTransfer links expire after 7 days — you have to ask all over again.',
                  'Clients forget Google Drive passwords and postpone until "tomorrow".',
                  'You waste hours writing awkward follow-up reminder messages.'
                ].map((text, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                    <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DropBrief Way */}
            <div className="glass-card" style={{
              padding: '26px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              background: 'rgba(16, 185, 129, 0.03)',
              boxShadow: '0 0 32px rgba(16, 185, 129, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--success-bg)', color: 'var(--success)' }} aria-hidden="true">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#86efac', letterSpacing: '-0.02em' }}>
                    With DropBrief (Zero-Friction)
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Fast, secure, and modern</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                {[
                  { strong: '1 permanent link:', rest: 'Clients click and upload instantly with zero login.' },
                  { strong: 'Uncompressed originals:', rest: 'Files retain 100% original quality in cloud storage.' },
                  { strong: 'Live image previews:', rest: 'Instant browser verification of submitted photos.' },
                  { strong: 'Automated reminders:', rest: 'Polite email notifications keep deadlines on track.' }
                ].map(({ strong, rest }, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                    <Check size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                    <span><strong>{strong}</strong> {rest}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section style={{ padding: '64px 20px 72px' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto 44px' }}>
            <span className="badge badge-accent" style={{ marginBottom: '12px' }}>Simple Flow</span>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              How it works in 3 easy steps
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '20px' }}>
            {[
              { num: '01', icon: Layers, color: 'var(--accent-primary)', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.22)', glow: '0 0 14px rgba(99,102,241,0.28)',
                title: '1. Pick a template', body: 'Choose a template (Web Design, Branding, Social Media, Custom) or build your own checklist. Setup takes under 30 seconds.' },
              { num: '02', icon: Send, color: 'var(--warning)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.22)', glow: '0 0 14px rgba(245,158,11,0.28)',
                title: '2. Send link to client', body: 'Send the direct link via WhatsApp, Slack, or email. The client opens the link and sees their checklist immediately with zero login friction.' },
              { num: '03', icon: CheckCircle2, color: 'var(--success)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.22)', glow: '0 0 14px rgba(16,185,129,0.28)',
                title: '3. Track & export assets', body: 'Watch the realtime progress bar update as assets arrive. Download everything in one clean package and get straight to work.' }
            ].map(({ num, icon: Icon, color, bg, border, glow, title, body }) => (
              <div key={num} className="glass-card glass-card-interactive" style={{ padding: '26px', position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: '16px', right: '20px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.2rem', fontWeight: 800,
                  color: 'rgba(255, 255, 255, 0.04)',
                  userSelect: 'none', letterSpacing: '-0.04em'
                }} aria-hidden="true">{num}</div>
                <div style={{
                  width: '44px', height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: bg, color,
                  border: `1px solid ${border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '18px',
                  boxShadow: glow
                }} aria-hidden="true">
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>{title}</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────── */}
      <section style={{ padding: '0 20px 80px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '740px' }}>
          <div className="glass-card" style={{
            padding: '52px 36px',
            background: 'linear-gradient(180deg, rgba(26, 36, 62, 0.65) 0%, rgba(11, 16, 28, 0.95) 100%)',
            border: '1px solid var(--border-accent)',
            boxShadow: 'var(--glow-accent-lg)',
            borderRadius: 'var(--radius-2xl)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {/* Ambient glow */}
            <div style={{
              position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
              width: '380px', height: '160px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.32) 0%, rgba(99, 102, 241, 0.08) 45%, transparent 70%)',
              pointerEvents: 'none',
              contain: 'strict'
            }} aria-hidden="true" />

            <span className="badge badge-accent" style={{ marginBottom: '18px' }}>Start Instantly</span>

            <h3 style={{ fontSize: 'clamp(1.7rem, 3.5vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.035em', marginBottom: '12px', lineHeight: 1.15 }}>
              Save hours of endless<br />client follow-ups
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem', maxWidth: '520px', margin: '0 auto 28px', lineHeight: 1.65 }}>
              Set up your profile in 5 seconds. Get your personal PIN code and unlimited client asset collections free forever.
            </p>

            <button
              onClick={() => openAuthModal('register')}
              className="btn btn-primary btn-lg btn-pill"
              style={{ margin: '0 auto', boxShadow: 'var(--glow-accent)', padding: '14px 34px', fontSize: '1rem' }}
            >
              <UserPlus size={19} aria-hidden="true" />
              Create Free Account with PIN
            </button>

          </div>
        </div>
      </section>

    </div>
  );
}
