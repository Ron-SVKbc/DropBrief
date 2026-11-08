import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import '../styles/neo-brutalist.css';

export default function WelcomeView({ onOpenCreateModal }) {
  const { openAuthModal, openClientPortal, addToast, openLegalModal } = useApp();

  // Interactive ticket state matching style-neo-brutalist.html
  const [ticketState, setTicketState] = useState({
    't-row-1': true,
    't-row-2': false,
    't-row-3': false
  });

  const toggleRow = (id) => {
    setTicketState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const total = Object.keys(next).length;
      const count = Object.values(next).filter(Boolean).length;

      if (count === total) {
        try {
          confetti({
            particleCount: 80,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#FF4400', '#FFE500', '#10B981', '#111111']
          });
        } catch (e) {
          console.warn('Confetti error:', e);
        }
        if (addToast) {
          addToast('Nordic Bakery docket 100% complete! Assets ready for ZIP export.', 'success', 'Interactive Ticket');
        }
      }
      return next;
    });
  };

  const totalItems = Object.keys(ticketState).length;
  const completedCount = Object.values(ticketState).filter(Boolean).length;
  const completionPct = Math.round((completedCount / totalItems) * 100);
  const isAllComplete = completedCount === totalItems;

  return (
    <div className="neo-brutalist-page">

      {/* Top Strip Legal & Compliance Bar */}
      <div className="top-ticker" role="region" aria-label="Terms of service and legal compliance bar">
        <div className="ticker-left">
          <button 
            type="button"
            onClick={() => openLegalModal('overview')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--yellow)', 
              fontWeight: 800, 
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              padding: '0 2px',
              letterSpacing: 'inherit',
              display: 'inline-flex',
              alignItems: 'center'
            }}
            title="Open comprehensive EU Legal & Compliance Dossier"
          >
            DOC_SPEC:
          </button>
          <button 
            type="button" 
            className="ticker-link"
            onClick={() => openLegalModal('tos')}
            id="ticker-btn-tos"
            title="Read DropBrief Terms of Service & Liability"
          >
            TERMS OF SERVICE (TOS)
          </button>
          <span className="ticker-sep" aria-hidden="true">•</span>
          <button 
            type="button" 
            className="ticker-link"
            onClick={() => openLegalModal('privacy')}
            id="ticker-btn-privacy"
            title="Read GDPR & Data Privacy Policy"
          >
            PRIVACY &amp; GDPR
          </button>
          <span className="ticker-sep" aria-hidden="true">•</span>
          <button 
            type="button" 
            className="ticker-link"
            onClick={() => openLegalModal('cookies')}
            id="ticker-btn-cookies"
            title="100% Cookie-free & zero third-party tracking policy"
          >
            100% COOKIE-FREE
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button" 
            className="ticker-link"
            onClick={() => openLegalModal('retention')}
            id="ticker-btn-retention"
            title="Automated 30-day cloud storage purge policy"
          >
            30-DAY RETENTION (GDPR ART. 5)
          </button>
          <button 
            type="button" 
            className="ticker-pill-btn"
            onClick={() => openLegalModal('overview')}
            id="ticker-btn-modal"
            title="Open comprehensive legal specification modal"
          >
            <span>LEGAL SPEC ↗</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav-bar" aria-label="Main navigation">
        <button 
          type="button" 
          className="brand-logo"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="DropBrief homepage"
        >
          <div className="brand-stamp">
            <span>DROPBRIEF ⚡</span>
          </div>
        </button>

        <div className="nav-actions">
          <button 
            type="button"
            className="ticker-link"
            onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ color: 'var(--ink)', fontWeight: 800, fontSize: '0.8rem', marginRight: '6px' }}
          >
            PRICING &amp; VIP
          </button>
          <button 
            type="button"
            className="btn-nav-login"
            onClick={() => openAuthModal('login')}
            id="nav-btn-login"
          >
            LOG IN
          </button>
          <button 
            type="button"
            className="btn-nav-cta"
            onClick={() => openAuthModal('register')}
            id="nav-btn-register"
          >
            CLAIM VIP PRO (15 SEATS)
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Hero Section */}
        <section className="hero-grid" aria-labelledby="hero-title">
          {/* Left Column */}
          <div>
            <div className="hero-kicker-badge">
              <span>⚡ ZERO-FRICTION CLIENT PORTAL &bull; FOUNDING VIP LAUNCH</span>
            </div>

            <h1 className="hero-title" id="hero-title">
              GET CLIENT FILES ON TIME. <br />
              <span className="highlight-badge">WITHOUT PASSWORDS.</span>
            </h1>

            <p className="hero-lead">
              Stop digging through messy WhatsApp chats and expired WeTransfer links. Send 1 branded drop-ticket — clients drop assets without passwords, and everything lands ready on your disk.
            </p>

            <div className="hero-actions-row">
              <button 
                type="button"
                className="btn-hero-primary"
                onClick={() => openAuthModal('register')}
                id="hero-btn-start-free"
              >
                <span>START FREE // CLAIM VIP PRO</span>
                <span aria-hidden="true">→</span>
              </button>
              <button 
                type="button"
                className="btn-hero-secondary"
                onClick={() => openAuthModal('login')}
                id="hero-btn-studio-login"
              >
                STUDIO LOGIN
              </button>
            </div>

            <div className="telemetry-row">
              <div className="telemetry-pill">
                <span aria-hidden="true">●</span> <span>2-5 ACTIVE SLOTS (15 VIP SPOTS)</span>
              </div>
              <div className="telemetry-pill">
                <span aria-hidden="true">●</span> <span>50MB - 100MB FILE LIMIT</span>
              </div>
              <div className="telemetry-pill">
                <span aria-hidden="true">●</span> <span>30-DAY GDPR PURGE</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Studio Ticket */}
          <div className="ticket-frame" role="region" aria-label="Interactive demo client docket">
            <div className="ticket-perforated-header">
              <div className="ticket-barcode">||| |||| || ||||| |||| #DB-8842</div>
              <span className="ticket-status-pill">CLIENT INTAKE DOCKET</span>
            </div>

            <div className="ticket-body">
              <div className="ticket-headline">
                <h3>Nordic Bakery — Web Redesign Assets</h3>
                <p>REQUESTED BY: STUDIO NORD • CLICK ROWS TO SIMULATE UPLOAD</p>
              </div>

              {/* Items */}
              <div className="ticket-items" role="list">
                {/* Item 1 (Done initially) */}
                <div 
                  className={`ticket-row ${ticketState['t-row-1'] ? 'done' : ''}`}
                  id="t-row-1"
                  onClick={() => toggleRow('t-row-1')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow('t-row-1'); } }}
                  aria-pressed={ticketState['t-row-1']}
                >
                  <div className="row-left">
                    <div className="custom-box">
                      {ticketState['t-row-1'] ? '✓' : ''}
                    </div>
                    <div className="item-meta">
                      <h4>01 // Core Brand Brief & Answers</h4>
                      <p>TEXT SPEC • 3 QUESTIONS ANSWERED</p>
                    </div>
                  </div>
                  <span className="stamp-action-btn">
                    {ticketState['t-row-1'] ? 'SUBMITTED ✓' : '+ CLICK TO DROP'}
                  </span>
                </div>

                {/* Item 2 (Interactive) */}
                <div 
                  className={`ticket-row ${ticketState['t-row-2'] ? 'done' : ''}`}
                  id="t-row-2"
                  onClick={() => toggleRow('t-row-2')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow('t-row-2'); } }}
                  aria-pressed={ticketState['t-row-2']}
                >
                  <div className="row-left">
                    <div className="custom-box">
                      {ticketState['t-row-2'] ? '✓' : ''}
                    </div>
                    <div className="item-meta">
                      <h4>02 // Master Vector Logo (.SVG / .AI)</h4>
                      <p>FILE SPEC • 50MB FREE / 100MB VIP PRO</p>
                    </div>
                  </div>
                  <span className="stamp-action-btn">
                    {ticketState['t-row-2'] ? 'UPLOADED (14.2 MB) ✓' : '+ CLICK TO DROP'}
                  </span>
                </div>

                {/* Item 3 (Interactive) */}
                <div 
                  className={`ticket-row ${ticketState['t-row-3'] ? 'done' : ''}`}
                  id="t-row-3"
                  onClick={() => toggleRow('t-row-3')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow('t-row-3'); } }}
                  aria-pressed={ticketState['t-row-3']}
                >
                  <div className="row-left">
                    <div className="custom-box">
                      {ticketState['t-row-3'] ? '✓' : ''}
                    </div>
                    <div className="item-meta">
                      <h4>03 // Brand Photography Gallery</h4>
                      <p>RAW PACK • HIGH RESOLUTION</p>
                    </div>
                  </div>
                  <span className="stamp-action-btn">
                    {ticketState['t-row-3'] ? 'UPLOADED (28.6 MB) ✓' : '+ CLICK TO DROP'}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="progress-dock">
                <div className="dock-label-row">
                  <span>INTAKE COMPLETION:</span>
                  <span 
                    id="progress-val" 
                    style={{ color: isAllComplete ? 'var(--emerald)' : 'var(--ink)' }}
                  >
                    {isAllComplete 
                      ? '100% COMPLETE — READY FOR ZIP EXPORT' 
                      : `${completionPct}% (${completedCount} OF ${totalItems} DELIVERED)`}
                  </span>
                </div>
                <div className="dock-track">
                  <div 
                    className="dock-fill" 
                    id="progress-fill" 
                    style={{ width: `${completionPct}%` }}
                  />
                </div>

                <div style={{ marginTop: '14px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => openClientPortal('demo-preview')}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: 'var(--ink)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    ⚡ Or launch full live sandbox portal (zero passwords) →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Incident Audit Section */}
        <section className="incident-audit-card" aria-labelledby="incident-title">
          <div className="incident-header">
            <div>
              <span className="incident-kicker">INCIDENT REPORT // FREELANCE TIME DESTRUCTION</span>
              <h2 className="incident-title" id="incident-title">WHERE DO 14.5 HOURS DISAPPEAR ON EVERY PROJECT?</h2>
              <p className="incident-desc">
                Traditional client intake is the single biggest velocity sink for digital studios. Clients never intend to delay engagements — they simply refuse to wrestle with passwords, permissions, and expirations.
              </p>
            </div>
          </div>

          {/* 4 Friction Incident Cards */}
          <div className="incident-grid">
            <div className="incident-item">
              <div>
                <div className="item-top-row">
                  <span className="item-icon" aria-hidden="true">💬</span>
                  <span className="loss-tag">-4.5 HRS</span>
                </div>
                <h4>WhatsApp & Chat Chaos</h4>
                <p>Digging out compressed, blurry PNG logos sent between unrelated voice memos in WhatsApp, Slack, and email threads.</p>
              </div>
            </div>

            <div className="incident-item">
              <div>
                <div className="item-top-row">
                  <span className="item-icon" aria-hidden="true">⏳</span>
                  <span className="loss-tag">-3.2 HRS</span>
                </div>
                <h4>Expired WeTransfer Links</h4>
                <p>Download links expire after 7 days. Writing awkward follow-up emails asking the client to please locate and re-upload the raw files.</p>
              </div>
            </div>

            <div className="incident-item">
              <div>
                <div className="item-top-row">
                  <span className="item-icon" aria-hidden="true">🔒</span>
                  <span className="loss-tag">-4.8 HRS</span>
                </div>
                <h4>Google Drive Access Blocks</h4>
                <p>&ldquo;You need permission&rdquo; request screens halting project velocity until the client notices the notification on Monday morning.</p>
              </div>
            </div>

            <div className="incident-item">
              <div>
                <div className="item-top-row">
                  <span className="item-icon" aria-hidden="true">😬</span>
                  <span className="loss-tag">-2.0 HRS</span>
                </div>
                <h4>Reminder Follow-up Anxiety</h4>
                <p>Drafting diplomatic, polite nudges so you do not sound like an impatient bill collector. Emotional overhead and wasted focus.</p>
              </div>
            </div>
          </div>

          {/* Total Time Lost Bar */}
          <div className="incident-total-strip">
            <div>
              <span className="total-time-label">TOTAL LOSS PER CLIENT ONBOARDING:</span>
              <div className="total-time-badge">14.5 HOURS DESTRUCTIVE FRICTION</div>
            </div>
            <div className="dropbrief-fix-pill">
              ✓ DROPBRIEF FIX: 1 LINK ➔ ASSETS READY IN 48 HOURS
            </div>
          </div>
        </section>

        {/* 4 Axioms Grid */}
        <section className="axioms-grid" aria-label="DropBrief core principles">
          <div className="axiom-box">
            <span className="axiom-num">RULE 01</span>
            <h4>Zero Client Logins</h4>
            <p>Clients never register or reset passwords. One authenticated token URL works in Safari, Chrome, and Mobile.</p>
          </div>

          <div className="axiom-box">
            <span className="axiom-num">RULE 02</span>
            <h4>Automated Nudges</h4>
            <p>Polite pre-scheduled reminders ping clients before deadlines without you having to write awkward follow-up emails.</p>
          </div>

          <div className="axiom-box">
            <span className="axiom-num">RULE 03</span>
            <h4>GDPR 30-Day Purge</h4>
            <p>Client materials are permanently scrubbed from EU cloud storage 30 days after project sign-off. Zero legal baggage.</p>
          </div>

          <div className="axiom-box">
            <span className="axiom-num">RULE 04</span>
            <h4>One-Click ZIP Export</h4>
            <p>Receive all approved vector assets, texts, and photos neatly organized in a single structured ZIP download.</p>
          </div>
        </section>

        {/* Pricing & VIP Founding Cohort Showcase */}
        <section className="pricing-section" id="pricing-section" aria-labelledby="pricing-title">
          <div className="pricing-header">
            <div className="pricing-kicker-row">
              <span className="pricing-badge">⚡ ZERO HIDDEN CHARGES // 100% BOOTSTRAPPED</span>
              <div className="pricing-pill-live">
                <span className="dot-live" aria-hidden="true"></span>
                <span>FOUNDING LAUNCH ACTIVE: FIRST 15 CREATIVES</span>
              </div>
            </div>

            <h2 className="pricing-title" id="pricing-title">
              HONEST, DIRECT ACCESS. <br />
              <span className="highlight-badge">FIRST 15 GET LIFETIME PRO FOR 0 €.</span>
            </h2>

            <p className="pricing-subtitle">
              Start free with zero credit card required. As part of our founding launch, the first 15 digital creators to register unlock permanent lifetime VIP PRO privileges — 5 active project slots, 100 MB per-file uploads, and zero fees forever.
            </p>
          </div>

          {/* Urgent Founding Cohort Callout Banner */}
          <div className="founding-urgent-banner" role="region" aria-label="VIP Founding Cohort announcement">
            <div className="founding-urgent-left">
              <span className="founding-urgent-stamp">⭐ EXCLUSIVE FOUNDING OFFER</span>
              <span className="founding-urgent-text">
                Register now: the first 15 accounts automatically receive <strong>5 active project slots</strong> and <strong>100 MB file upload limit</strong> (double standard size) free for life.
              </span>
            </div>
            <div className="founding-urgent-count">
              🔥 15 VIP SEATS ONLY • 0 € NAVŽDY
            </div>
          </div>

          {/* 2-Column Pricing Cards */}
          <div className="pricing-cards-grid">
            
            {/* Tier 1: Free Starter */}
            <div className="pricing-card starter">
              <div>
                <div className="card-tier-tag">DEFAULT BASELINE</div>
                <h3 className="card-tier-title">Free Starter</h3>

                <div className="card-price-row">
                  <span className="card-price-value">0 €</span>
                  <span className="card-price-period">/ FOREVER &bull; NO CARD REQUIRED</span>
                </div>

                <p className="card-desc">
                  Essential friction-free brief and file intake for solo web designers and freelancers.
                </p>

                {/* Big Metric Pills */}
                <div className="card-metrics-pill-row">
                  <div className="card-metric-pill">
                    <span className="metric-num">2 SLOTS</span>
                    <span className="metric-lbl">ACTIVE CLIENT PORTALS</span>
                  </div>
                  <div className="card-metric-pill">
                    <span className="metric-num">50 MB</span>
                    <span className="metric-lbl">MAX FILE SIZE LIMIT</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="card-features-list">
                  <li className="card-feature-item">
                    <span className="card-feature-icon" aria-hidden="true">✓</span>
                    <span><strong>2 active client intake portals</strong> running simultaneously</span>
                  </li>
                  <li className="card-feature-item">
                    <span className="card-feature-icon" aria-hidden="true">✓</span>
                    <span><strong>50 MB limit per file</strong> (vectors, uncompressed logos, PDFs, docs)</span>
                  </li>
                  <li className="card-feature-item">
                    <span className="card-feature-icon" aria-hidden="true">✓</span>
                    <span><strong>Zero-login client access</strong>: 1 token link, no client passwords</span>
                  </li>
                  <li className="card-feature-item">
                    <span className="card-feature-icon" aria-hidden="true">✓</span>
                    <span><strong>30-day automated cloud purge</strong> (GDPR Art. 5 compliant)</span>
                  </li>
                  <li className="card-feature-item">
                    <span className="card-feature-icon" aria-hidden="true">✓</span>
                    <span><strong>One-click structured ZIP export</strong> directly to your disk</span>
                  </li>
                  <li className="card-feature-item">
                    <span className="card-feature-icon" aria-hidden="true">✓</span>
                    <span><strong>Referral eligible</strong>: +2 slots &amp; +50 MB for every friend invited</span>
                  </li>
                </ul>
              </div>

              <div>
                <button
                  type="button"
                  className="btn-pricing-cta starter"
                  onClick={() => openAuthModal('register')}
                  id="pricing-btn-starter"
                >
                  <span>START FREE (2 SLOTS)</span>
                  <span aria-hidden="true">→</span>
                </button>
                <div className="card-guarantee-note">
                  No credit card &bull; Instant 10-second setup &bull; 0 € for life
                </div>
              </div>
            </div>

            {/* Tier 2: Founding VIP PRO */}
            <div className="pricing-card vip-pro">
              <span className="vip-floating-stamp">⭐ FIRST 15 DESIGNERS ONLY</span>

              <div>
                <div className="card-tier-tag">EXCLUSIVE FOUNDING TIER</div>
                <h3 className="card-tier-title">Founding VIP PRO</h3>

                <div className="card-price-row">
                  <span className="card-strikethrough-price">Planned 15 € / mo</span>
                  <span className="card-price-value">0 €</span>
                  <span className="card-price-period">/ DOŽIVOTNE ZADARMO</span>
                </div>

                <p className="card-desc">
                  Expanded capacity for high-volume freelancers and boutique studios. 100% free for life for our first 15 founding creators.
                </p>

                {/* Big Metric Pills */}
                <div className="card-metrics-pill-row">
                  <div className="card-metric-pill">
                    <span className="metric-num" style={{ color: 'var(--orange)' }}>5 SLOTS</span>
                    <span className="metric-lbl">2.5× CLIENT CAPACITY</span>
                  </div>
                  <div className="card-metric-pill">
                    <span className="metric-num" style={{ color: 'var(--orange)' }}>100 MB</span>
                    <span className="metric-lbl">2× FILE UPLOAD LIMIT</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="card-features-list">
                  <li className="card-feature-item">
                    <span className="card-feature-icon" aria-hidden="true">⭐</span>
                    <span><strong>5 active client intake portals</strong> running simultaneously (2.5x standard)</span>
                  </li>
                  <li className="card-feature-item">
                    <span className="card-feature-icon" aria-hidden="true">⭐</span>
                    <span><strong>100 MB max size per file</strong> (RAW photos, big ZIP archives, brand decks)</span>
                  </li>
                  <li className="card-feature-item">
                    <span className="card-feature-icon" aria-hidden="true">⭐</span>
                    <span><strong>⭐ VIP PRO Workspace badge</strong> displayed in your Studio Dashboard</span>
                  </li>
                  <li className="card-feature-item">
                    <span className="card-feature-icon" aria-hidden="true">⭐</span>
                    <span><strong>Direct founder hotline</strong> for custom brief fields, templates &amp; requests</span>
                  </li>
                  <li className="card-feature-item">
                    <span className="card-feature-icon" aria-hidden="true">⭐</span>
                    <span><strong>Priority email reminder dispatch</strong> via transactional Resend API</span>
                  </li>
                  <li className="card-feature-item">
                    <span className="card-feature-icon" aria-hidden="true">⭐</span>
                    <span><strong>Stackable referral perks</strong>: +2 slots &amp; +50 MB keep piling on top</span>
                  </li>
                  <li className="card-feature-item">
                    <span className="card-feature-icon" aria-hidden="true">⭐</span>
                    <span><strong>Grandfathered forever</strong>: never pay a subscription fee, ever</span>
                  </li>
                </ul>
              </div>

              <div>
                <button
                  type="button"
                  className="btn-pricing-cta vip-pro"
                  onClick={() => openAuthModal('register')}
                  id="pricing-btn-vip-pro"
                >
                  <span>CLAIM LIFETIME VIP PRO (0 €)</span>
                  <span aria-hidden="true">⚡</span>
                </button>
                <div className="card-guarantee-note">
                  Strictly limited to 15 accounts &bull; Locks permanently once filled
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* High-Impact Referral Showcase (+50MB & +2 Slots Prominent) */}
        <section className="referral-showcase" aria-labelledby="referral-title">
          <div className="ref-header-row">
            <span className="ref-badge">🔥 EARLY ADOPTER ALLIANCE // ZERO MARKETING FLUFF</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, color: '#111' }}>
              NO CREDIT CARD • 0 € FOREVER
            </span>
          </div>

          <h2 className="ref-main-title" id="referral-title">
            INVITE A CREATIVE PEER, GET{' '}
            <span 
              className="badge-storage"
              style={{ 
                background: '#FFF', 
                padding: '0 8px', 
                border: '2px solid #111', 
                boxShadow: '3px 3px 0 #111', 
                display: 'inline-block', 
                whiteSpace: 'nowrap',
                wordBreak: 'keep-all'
              }}
            >
              +50MB&nbsp;STORAGE
            </span>{' '}
            <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
              &amp;{' '}
              <span 
                className="badge-slots"
                style={{ 
                  background: 'var(--orange)', 
                  color: '#FFF', 
                  padding: '0 8px', 
                  border: '2px solid #111', 
                  boxShadow: '3px 3px 0 #111', 
                  display: 'inline-block', 
                  whiteSpace: 'nowrap',
                  wordBreak: 'keep-all'
                }}
              >
                +2&nbsp;SLOTS
              </span>
            </span>{' '}
            FOR LIFE.
          </h2>

          <p className="ref-subtitle">
            DropBrief is built organically from scratch for independent makers. We reward every designer and studio that brings a peer into the ecosystem — permanently, with zero expiration.
          </p>

          <div className="perks-trio-grid">
            <div className="perk-card emerald">
              <div>
                <div className="perk-highlight-val">+2 SLOTS</div>
                <div className="perk-tag">LIFETIME PROJECT SLOTS</div>
                <p>Every peer who starts with DropBrief permanently adds +2 active client intake portals to your account.</p>
              </div>
            </div>

            <div className="perk-card orange">
              <div>
                <div className="perk-highlight-val">+50 MB</div>
                <div className="perk-tag">LIFETIME CLOUD CAPACITY</div>
                <p>Permanent file size and raw upload capacity increase (+50 MB per invited designer) across all client drops.</p>
              </div>
            </div>

            <div className="perk-card dark">
              <div>
                <div className="perk-highlight-val">0 € / MO</div>
                <div className="perk-tag">FOUNDING ACCESS</div>
                <p>2 active slots default (5 slots &amp; 100 MB for first 15 VIPs). Zero credit card required, zero trial expirations.</p>
              </div>
            </div>
          </div>

          {/* Math Breakdown & CTA */}
          <div className="ref-bottom-bar">
            <div className="math-pill-box">
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>QUICK MATH:</span>
              <span className="math-step">Base: 2 slots • 50 MB (or 5 slots • 100 MB VIP PRO)</span>
              <span className="math-step">Invite 2 peers: <strong>6 slots • 150 MB</strong> (9 slots • 200 MB VIP)</span>
              <span className="math-step">Invite 5 peers: <strong>12 slots • 300 MB</strong> (15 slots • 350 MB VIP)</span>
            </div>

            <button 
              type="button"
              className="btn-claim-referral"
              onClick={() => openAuthModal('register')}
              id="ref-btn-claim"
            >
              <span>CLAIM YOUR INVITE CODE &amp; SLOTS ⚡</span>
            </button>
          </div>
        </section>

        {/* Neo-Brutalist Footer & Utility Bar */}
        <footer className="neo-footer" aria-label="Footer">
          <div>
            <strong>DROPBRIEF ⚡</strong> &bull; Client Intake &amp; Asset Docket System &bull; <span style={{ color: 'var(--emerald)', fontWeight: 800 }}>SYS_ENGINE: LIVE (EU IRELAND)</span>
          </div>

          <div className="neo-footer-links">
            <button
              type="button"
              className="neo-footer-btn"
              onClick={() => openLegalModal('tos')}
              aria-label="Terms of service"
            >
              <span>📜</span> Terms of Service (TOS)
            </button>
            <button
              type="button"
              className="neo-footer-btn"
              onClick={() => openLegalModal('privacy')}
              aria-label="GDPR compliance and privacy policy"
            >
              <span>🔒</span> Privacy &amp; GDPR
            </button>
            <button
              type="button"
              className="neo-footer-btn"
              onClick={() => openLegalModal('cookies')}
              aria-label="Cookie-free declaration"
            >
              <span>🍪</span> 100% Cookie-free
            </button>
            <button
              type="button"
              className="neo-footer-btn"
              onClick={() => openLegalModal('retention')}
              aria-label="30-day retention and purge policy"
            >
              <span>⏱️</span> 30-Day Purge
            </button>
            <button
              type="button"
              className="neo-footer-btn"
              onClick={() => openLegalModal('dpa')}
              aria-label="Data processing agreement"
            >
              <span>📑</span> DPA (Art. 28)
            </button>
            <button
              type="button"
              className="neo-footer-btn"
              onClick={() => openLegalModal('impressum')}
              aria-label="Operator information and contacts"
            >
              <span>🏢</span> Impressum &amp; Contact
            </button>
            <button
              type="button"
              className="neo-footer-btn"
              onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
              aria-label="View pricing and VIP founding tier"
            >
              <span>⭐</span> Pricing &amp; VIP
            </button>
            <button
              type="button"
              className="neo-footer-btn"
              onClick={() => openClientPortal('demo-preview')}
              aria-label="Launch interactive client portal sandbox"
            >
              <span>👁️</span> Client Portal Sandbox
            </button>
            <button
              type="button"
              className="neo-footer-btn"
              onClick={() => openAuthModal('login')}
              aria-label="Studio login"
            >
              <span>🔑</span> Studio Login
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
