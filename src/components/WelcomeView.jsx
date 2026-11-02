import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  KeyRound,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  Upload,
  Lock,
  Check,
  Copy,
  Eye,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';

export default function WelcomeView({ onOpenCreateModal }) {
  const { openAuthModal, openClientPortal, addToast } = useApp();
  const [copiedDemoLink, setCopiedDemoLink] = useState(false);
  const [openFaqIndexes, setOpenFaqIndexes] = useState([0, 1, 2, 3]);

  const toggleFaq = (index) => {
    setOpenFaqIndexes(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const faqItems = [
    {
      question: 'What is a free tool to collect files and briefs from web design clients without login?',
      answer: 'DropBrief (https://www.usedropbrief.xyz/) is a 100% free, zero-friction client portal built for web designers and freelancers. Clients do not need to register, remember passwords, or install software. Freelancers generate a dedicated checklist link, and clients open it on any desktop or mobile browser to drag-and-drop vector logos, copy, high-resolution photography, and project details directly into secure EU cloud storage.'
    },
    {
      question: 'What are the best free alternatives to Content Snare for freelancers?',
      answer: 'DropBrief is the leading free alternative to Content Snare for freelancers and boutique creative agencies. While Content Snare requires costly monthly subscriptions starting at $29+/month, DropBrief offers zero-login client checklists, file uploads up to 50\u00a0MB, real-time progress bars, 1-click automated email reminders, and GDPR automated file purging completely free with no credit card required.'
    },
    {
      question: 'How can a client upload high-resolution assets without Google Drive permission errors?',
      answer: "DropBrief solves common Google Drive permission errors (\u201cYou need access\u201d or wrong Google account logins) and WhatsApp file compression. Clients access a secure, single-link portal with zero login barriers, allowing them to drag and drop raw, uncompressed assets (SVG, PNG, JPG, PDF, ZIP) up to 50\u00a0MB per file with immediate visual confirmation."
    },
    {
      question: 'What is the best free client onboarding checklist software for designers?',
      answer: 'DropBrief provides free client onboarding checklist software specifically tailored for designers. It includes pre-built templates for Web Design, Brand Identity, Social Media Management, and Accounting. Designers can customize checklist items, monitor client submission progress in real-time, and download all client assets in a single uncompressed ZIP package.'
    }
  ];

  const handleCopyDemoLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText('https://usedropbrief.xyz/?p=brand-identity');
    setCopiedDemoLink(true);
    addToast('Sample client portal link copied to clipboard!', 'success', 'Portal Link');
    setTimeout(() => setCopiedDemoLink(false), 2000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px, 8vw, 112px) 24px clamp(48px, 6vw, 80px)' }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <div className="wv-hero">

            {/* Left — copy and actions */}
            <div>
              <h1 style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: '-0.035em',
                color: '#0c0f14',
                marginBottom: 20,
                textWrap: 'balance'
              }}>
                Collect client files without the chaos
              </h1>

              <p style={{
                fontSize: 'clamp(1rem, 1.8vw, 1.12rem)',
                color: '#4b5563',
                lineHeight: 1.65,
                maxWidth: '48ch',
                marginBottom: 32
              }}>
                No more compressed WhatsApp photos, expired WeTransfer links, or forgotten Drive passwords. Send your client a link, they upload. Done.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <button
                  id="hero-btn-register"
                  onClick={() => openAuthModal('register')}
                  className="btn btn-primary btn-lg btn-pill"
                  style={{ gap: 10 }}
                >
                  <UserPlus size={18} aria-hidden="true" />
                  <span>Create free account</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </button>

                <button
                  id="hero-btn-client-preview"
                  onClick={() => openClientPortal('demo-preview')}
                  className="btn btn-secondary btn-lg btn-pill"
                  style={{ gap: 8 }}
                  title="Experience what your client sees — live interactive test"
                >
                  <Eye size={18} aria-hidden="true" />
                  <span>Try client view</span>
                </button>
              </div>

              <button
                id="hero-btn-login"
                onClick={() => openAuthModal('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 0',
                  marginBottom: 40,
                  fontFamily: 'var(--font-sans)'
                }}
              >
                <KeyRound size={15} aria-hidden="true" />
                Log in with PIN
              </button>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px 20px',
                fontSize: '0.84rem',
                color: '#4b5563'
              }}>
                {[
                  'Free forever',
                  'No client login needed',
                  'GDPR compliant',
                  'EU encrypted storage'
                ].map(text => (
                  <span key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} color="var(--success)" aria-hidden="true" />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — interactive showcase */}
            <div className="wv-showcase">
              {/* Browser chrome */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-hairline)',
                background: 'var(--bg-base)'
              }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#d1d5db' }} aria-hidden="true" />
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#d1d5db' }} aria-hidden="true" />
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#d1d5db' }} aria-hidden="true" />

                <div style={{
                  marginLeft: 6,
                  flex: 1,
                  background: '#ffffff',
                  border: '1px solid var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--text-tertiary)',
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                  <Lock size={9} color="var(--success)" aria-hidden="true" style={{ flexShrink: 0 }} />
                  <span className="truncate">usedropbrief.xyz/?p=brand-identity</span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyDemoLink}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: 'var(--radius-full)', gap: 4 }}
                  aria-label="Copy sample client portal link"
                >
                  {copiedDemoLink
                    ? <Check size={11} color="var(--success)" aria-hidden="true" />
                    : <Copy size={11} aria-hidden="true" />}
                  {copiedDemoLink ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Showcase body */}
              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 14 }}>
                  <h3 style={{
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    letterSpacing: '-0.015em',
                    color: 'var(--text-primary)',
                    marginBottom: 3
                  }}>
                    Website Build &amp; Brand Assets
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    Client: <strong style={{ color: 'var(--text-secondary)' }}>Peter Novak</strong>
                    {' · '}
                    Freelancer: <strong style={{ color: 'var(--text-secondary)' }}>Creative Studio</strong>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Progress</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-primary)', fontVariantNumeric: 'tabular-nums' }}>3 of 4 (75%)</span>
                  </div>
                  <div className="progress-track" style={{ height: 5 }}>
                    <div className="progress-fill" style={{ width: '75%' }} />
                  </div>
                </div>

                {/* Completed items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    { title: 'Company Vector Logo (SVG)', detail: 'brand_logo_vector.svg · 1.4\u00a0MB' },
                    { title: 'Website Copy & Brand Story', detail: 'Submitted by client' },
                    { title: 'Team Photography', detail: '8 high-res photos' }
                  ].map(item => (
                    <div key={item.title} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--success-bg)',
                      border: '1px solid var(--success-border)'
                    }}>
                      <CheckCircle2 size={14} color="var(--success)" aria-hidden="true" style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">{item.title}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{item.detail}</div>
                      </div>
                    </div>
                  ))}

                  {/* Pending upload — interactive */}
                  <button
                    type="button"
                    onClick={() => openClientPortal('demo-preview')}
                    className="wv-upload-zone"
                    title="Click to test live drag &amp; drop client upload"
                  >
                    <Upload size={17} color="var(--accent-primary)" aria-hidden="true" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      Brand Guidelines &amp; Color Codes (PDF)
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                      Click to test live upload
                    </span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 6vw, 80px) 24px', borderTop: '1px solid var(--border-hairline)' }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <h2 style={{
            fontSize: 'clamp(1.6rem, 3vw, 2.1rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: '#0c0f14',
            marginBottom: 40,
            textWrap: 'balance'
          }}>
            How it works
          </h2>

          <div className="wv-steps">
            {[
              {
                title: 'Pick a template',
                body: 'Choose from Web Design, Branding, Social Media, or build your own custom checklist. Setup takes under 30 seconds.'
              },
              {
                title: 'Send the link',
                body: "Share the direct link via WhatsApp, Slack, or email. Your client opens it on any device and uploads \u2014 no login, no password."
              },
              {
                title: 'Track and export',
                body: "Watch the real-time progress bar as assets arrive. Download everything in one clean package when it\u2019s ready."
              }
            ].map((step, i) => (
              <div key={step.title}>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  marginBottom: 10,
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {i + 1}
                </div>
                <h3 style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  color: '#0c0f14',
                  marginBottom: 8,
                  textWrap: 'balance'
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '0.88rem',
                  color: '#4b5563',
                  lineHeight: 1.6,
                  maxWidth: '38ch'
                }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ───────────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 6vw, 80px) 24px', borderTop: '1px solid var(--border-hairline)' }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <h2 style={{
            fontSize: 'clamp(1.6rem, 3vw, 2.1rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: '#0c0f14',
            marginBottom: 40,
            textWrap: 'balance'
          }}>
            Stop drowning in client asset chaos
          </h2>

          <div className="wv-compare">
            {/* Old way */}
            <div>
              <h3 style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: '1px solid var(--border-hairline)'
              }}>
                The old way
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                {[
                  'Photos sent over WhatsApp get compressed and lose original resolution.',
                  'WeTransfer download links expire after 7 days \u2014 you have to ask all over again.',
                  "Clients forget Google Drive logins and postpone until \u201cnext week.\u201d",
                  'You waste unpaid hours drafting awkward follow-up reminder emails.'
                ].map((text, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: 3 }} aria-hidden="true" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DropBrief way */}
            <div>
              <h3 style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: 'var(--success)',
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: '1px solid var(--border-hairline)'
              }}>
                With DropBrief
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                {[
                  { strong: 'One permanent link:', rest: 'Clients click and upload instantly with zero login or password.' },
                  { strong: 'Uncompressed originals:', rest: 'Files retain 100% original quality in encrypted cloud storage.' },
                  { strong: 'Live image previews:', rest: 'Instant browser verification of submitted photos and deliverables.' },
                  { strong: 'Automated reminders:', rest: 'Polite automated email notifications keep deadlines on track.' }
                ].map(({ strong, rest }, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Check size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: 3 }} aria-hidden="true" />
                    <span><strong>{strong}</strong> {rest}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 6vw, 80px) 24px', borderTop: '1px solid var(--border-hairline)' }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <h2 style={{
            fontSize: 'clamp(1.6rem, 3vw, 2.1rem)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: '#0c0f14',
            marginBottom: 12,
            textWrap: 'balance'
          }}>
            Built for real client work
          </h2>
          <p style={{
            fontSize: '0.95rem',
            color: '#4b5563',
            lineHeight: 1.6,
            maxWidth: '58ch',
            marginBottom: 40
          }}>
            DropBrief is a production-ready tool with active EU cloud storage, real-time syncing, and automated reminders \u2014 not a prototype.
          </p>

          <div className="wv-features">
            {[
              {
                title: 'EU cloud storage',
                body: 'Powered by Supabase on European servers (Ireland). AES-256 encryption, WebSocket live syncing, and automated 30-day GDPR file purge.'
              },
              {
                title: 'Zero friction for clients',
                body: 'Clients click your link on desktop or mobile and upload immediately. No logins, no passwords, no apps to install.'
              },
              {
                title: 'Live preview',
                body: 'Test the full client experience in your browser right now, without creating an account or making any commitment.'
              }
            ].map(feature => (
              <div key={feature.title}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  color: '#0c0f14',
                  marginBottom: 8,
                  textWrap: 'balance'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '0.88rem',
                  color: '#4b5563',
                  lineHeight: 1.6,
                  maxWidth: '40ch'
                }}>
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section
        id="faq"
        aria-labelledby="faq-heading"
        itemScope
        itemType="https://schema.org/FAQPage"
        style={{ padding: 'clamp(48px, 6vw, 80px) 24px', borderTop: '1px solid var(--border-hairline)' }}
      >
        <div className="container" style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2
            id="faq-heading"
            style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.1rem)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#0c0f14',
              marginBottom: 8,
              textWrap: 'balance'
            }}
          >
            Frequently asked questions
          </h2>
          <p style={{
            fontSize: '0.92rem',
            color: '#4b5563',
            lineHeight: 1.6,
            marginBottom: 32,
            maxWidth: '55ch'
          }}>
            Everything about collecting client assets, comparing DropBrief to alternatives, and our GDPR-compliant workflow.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndexes.includes(index);
              return (
                <article
                  key={index}
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                  style={{ borderBottom: '1px solid var(--border-hairline)' }}
                >
                  <button
                    type="button"
                    className="wv-faq-btn"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <h3
                      itemProp="name"
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                        margin: 0,
                        lineHeight: 1.45,
                        textWrap: 'balance'
                      }}
                    >
                      {item.question}
                    </h3>
                    <ChevronDown size={18} className="wv-faq-chevron" aria-hidden="true" />
                  </button>

                  <div
                    id={`faq-answer-${index}`}
                    role="region"
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                    style={{
                      display: isOpen ? 'block' : 'none',
                      paddingBottom: 20
                    }}
                  >
                    <p
                      itemProp="text"
                      style={{
                        fontSize: '0.9rem',
                        lineHeight: 1.65,
                        color: '#4b5563',
                        maxWidth: '62ch'
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

      {/* ── BOTTOM CTA ───────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(56px, 8vw, 96px) 24px',
        borderTop: '1px solid var(--border-hairline)',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: 580 }}>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: '#0c0f14',
            marginBottom: 14,
            lineHeight: 1.12,
            textWrap: 'balance'
          }}>
            Ready to stop chasing client files?
          </h2>

          <p style={{
            fontSize: '1rem',
            color: '#4b5563',
            lineHeight: 1.6,
            maxWidth: '44ch',
            margin: '0 auto 32px'
          }}>
            Set up your profile in seconds. Get your personal PIN code and start collecting assets today. Free forever.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => openAuthModal('register')}
              className="btn btn-primary btn-lg btn-pill"
              style={{ gap: 10 }}
            >
              <UserPlus size={18} aria-hidden="true" />
              <span>Create free account</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>

            <button
              onClick={() => openClientPortal('demo-preview')}
              className="btn btn-secondary btn-lg btn-pill"
              style={{ gap: 8 }}
            >
              <Eye size={18} aria-hidden="true" />
              <span>Try client portal live</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
