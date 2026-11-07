import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import '../styles/legal-dossier.css';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  FileCheck, 
  Server, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Cookie, 
  Scale, 
  Building, 
  FileText, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  Mail, 
  Globe, 
  ArrowRight,
  ShieldAlert,
  Terminal,
  Zap,
  Info
} from 'lucide-react';

export default function LegalModal() {
  const { 
    isLegalModalOpen, 
    setIsLegalModalOpen, 
    legalModalTab, 
    setLegalModalTab, 
    currentFreelancer, 
    openAccountModal,
    addToast 
  } = useApp();

  const [copiedDpa, setCopiedDpa] = useState(false);

  // Close modal on Escape key press (WCAG 2.1.2)
  useEffect(() => {
    if (!isLegalModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsLegalModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLegalModalOpen, setIsLegalModalOpen]);

  if (!isLegalModalOpen) return null;

  const currentTab = legalModalTab || 'overview';

  const tabs = [
    { id: 'overview', label: 'LEGAL SPEC', icon: ShieldCheck, badge: 'MATRIX' },
    { id: 'tos', label: 'TERMS OF SERVICE', icon: Scale, badge: 'TOS' },
    { id: 'privacy', label: 'PRIVACY & GDPR', icon: Lock, badge: 'GDPR' },
    { id: 'cookies', label: '100% COOKIE-FREE', icon: Cookie, badge: '0-COOKIE' },
    { id: 'retention', label: '30-DAY RETENTION', icon: Clock, badge: 'ART. 5' },
    { id: 'dpa', label: 'DPA CONTRACT', icon: FileCheck, badge: 'ART. 28' },
    { id: 'aup', label: 'ACCEPTABLE USE', icon: AlertTriangle, badge: 'DSA' },
    { id: 'impressum', label: 'IMPRESSUM', icon: Building, badge: 'CONTACT' },
  ];

  const handleCopyDpaText = () => {
    const dpaText = `DATA PROCESSING AGREEMENT (DPA) - DropBrief
Pursuant to Article 28 of Regulation (EU) 2016/679 (GDPR)

1. PARTIES:
- Data Controller: Freelancer / Creative Studio / Agency registered on DropBrief
- Data Processor: DropBrief Platform (https://usedropbrief.xyz), operating in the European Union (Ireland)

2. SUBJECT-MATTER AND NATURE:
DropBrief provides zero-friction client intake and asset transfer micro-SaaS infrastructure. Deliverables (PDFs, graphics, copy, briefs) are temporarily encrypted and routed exclusively between the Client and the Freelancer.

3. DURATION AND STORAGE LIMITATION:
In strict compliance with GDPR Art. 5(1)(e), uploaded files remain in secure European cloud storage during the active intake phase and for exactly 30 days following project completion, after which automated server-side purge scripts permanently delete all stored assets.

4. TECHNICAL AND ORGANISATIONAL MEASURES (TOMs):
- In-transit encryption via modern TLS 1.3 certificates.
- At-rest encryption via certified AES-256 block ciphers in certified AWS Dublin (eu-west-1) data centres.
- Strict Row Level Security (RLS) policies preventing unauthorised cross-tenant data access.
- Zero tracking cookies, zero third-party behavioural analytics, self-hosted web fonts.

5. SUB-PROCESSORS:
- Supabase Inc. (AWS eu-west-1 Ireland) - Database and Cloud Storage
- Vercel Inc. (EU Edge Network) - Frontend hosting and serverless compute
- Resend Inc. - Transactional email notifications

6. ASSISTANCE AND RIGHTS:
DropBrief assists Controllers in fulfilling data subject requests under GDPR Articles 15-22, including instant account deletion (Art. 17).

Governing Law: Laws of the Slovak Republic and the European Union.`;

    navigator.clipboard.writeText(dpaText);
    setCopiedDpa(true);
    if (addToast) {
      addToast('Data Processing Agreement (DPA) copied to clipboard!', 'success', 'Legal Spec');
    }
    setTimeout(() => setCopiedDpa(false), 3000);
  };

  return (
    <div 
      className="legal-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsLegalModalOpen(false);
      }}
      role="presentation"
    >
      <div 
        className="legal-dossier-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        {/* Dossier Top Header */}
        <div className="legal-dossier-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="legal-icon-box">
              <ShieldCheck size={24} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div>
              <div className="legal-header-meta">
                <span className="legal-header-kicker">DOC_SPEC // REGULATORY DOSSIER</span>
                <span className="legal-header-badge">
                  <span className="status-dot status-dot-live" aria-hidden="true"></span>
                  EU COMPLIANT (GDPR / ePrivacy)
                </span>
              </div>
              <h2 id="legal-modal-title" className="legal-header-title">
                LEGAL &amp; COMPLIANCE CENTER
              </h2>
              <span className="legal-header-sub">
                Official specifications for terms of service, zero-cookie guarantee, 30-day retention &amp; GDPR compliance
              </span>
            </div>
          </div>

          <button 
            id="btn-close-legal-modal"
            onClick={() => setIsLegalModalOpen(false)}
            aria-label="Close legal and compliance dialog"
            className="btn-dossier-close"
            title="Close dossier (Esc)"
          >
            <X size={20} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* Dossier Folder Tabs */}
        <div 
          role="tablist"
          aria-label="Legal document categories"
          className="legal-dossier-tabstrip"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setLegalModalTab(tab.id)}
                className={`legal-tab-btn ${isActive ? 'is-active' : ''}`}
                id={`legal-tab-${tab.id}`}
              >
                <Icon size={14} strokeWidth={2.5} aria-hidden="true" />
                <span>{tab.label}</span>
                <span className="legal-tab-pill">{tab.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Dossier Body */}
        <div className="legal-dossier-body">

          {/* TAB 1: OVERVIEW & LEGAL SPEC MATRIX */}
          {currentTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* Hero Banner */}
              <div className="dossier-card dossier-card-hero">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--orange)' }}>
                  <span>⚡ SPECIFICATION_DOCUMENT</span>
                  <span>•</span>
                  <span>REGULATION (EU) 2016/679 &amp; 2002/58/EC</span>
                </div>
                
                <h3 className="dossier-card-title" style={{ fontSize: '1.35rem' }}>
                  DropBrief Architecture &amp; Legal Compliance Matrix
                </h3>
                
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.65 }}>
                  DropBrief is architected from the ground up for strict compliance with the European Union regulatory framework, specifically the <strong>General Data Protection Regulation (GDPR 2016/679)</strong>, the <strong>ePrivacy Directive (2002/58/EC)</strong>, and the <strong>Digital Services Act (EU 2022/2065)</strong>.
                </p>

                {/* Telemetry Strip */}
                <div className="dossier-telemetry-strip">
                  <div className="telemetry-chip">
                    <span className="telemetry-chip-label">DATA RESIDENCY</span>
                    <span className="telemetry-chip-val">AWS Ireland (eu-west-1)</span>
                  </div>
                  <div className="telemetry-chip">
                    <span className="telemetry-chip-label">TRACKING COOKIES</span>
                    <span className="telemetry-chip-val" style={{ color: 'var(--emerald)' }}>0 (Zero Trackers)</span>
                  </div>
                  <div className="telemetry-chip">
                    <span className="telemetry-chip-label">RETENTION POLICY</span>
                    <span className="telemetry-chip-val" style={{ color: 'var(--orange)' }}>Auto 30-Day Purge</span>
                  </div>
                  <div className="telemetry-chip">
                    <span className="telemetry-chip-label">STATUTORY ROLE</span>
                    <span className="telemetry-chip-val">Processor (Art. 28)</span>
                  </div>
                </div>
              </div>

              {/* 4 Core Pillars Grid */}
              <div className="dossier-grid-2">
                <div className="dossier-card">
                  <div className="dossier-stamp-kicker" style={{ color: 'var(--cobalt)' }}>
                    <span>⚖️ LEGAL ROLE (GDPR)</span>
                  </div>
                  <strong style={{ fontSize: '0.98rem', display: 'block', color: 'var(--ink)', marginBottom: '6px' }}>
                    Data Processor vs Data Controller
                  </strong>
                  <p style={{ fontSize: '0.825rem', margin: 0, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                    DropBrief acts strictly as a <strong>Technical Data Processor</strong> (Art. 28 GDPR). The creative studio or freelancer acts as the <strong>Data Controller</strong> responsible for asset requests.
                  </p>
                </div>

                <div className="dossier-card">
                  <div className="dossier-stamp-kicker" style={{ color: 'var(--emerald)' }}>
                    <span>🇪🇺 DATA GEOGRAPHY</span>
                  </div>
                  <strong style={{ fontSize: '0.98rem', display: 'block', color: 'var(--ink)', marginBottom: '6px' }}>
                    100% European Union (Ireland)
                  </strong>
                  <p style={{ fontSize: '0.825rem', margin: 0, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                    All cloud volumes, databases, and uploaded deliverables reside in certified AWS Dublin (<code style={{ fontFamily: 'var(--font-mono)', background: 'var(--paper)', padding: '1px 5px', borderRadius: '3px', border: '1px solid #111' }}>eu-west-1</code>) infrastructure. Zero customer data leaves EU territory.
                  </p>
                </div>

                <div className="dossier-card">
                  <div className="dossier-stamp-kicker" style={{ color: 'var(--orange)' }}>
                    <span>🛡️ PRIVACY BY DESIGN</span>
                  </div>
                  <strong style={{ fontSize: '0.98rem', display: 'block', color: 'var(--ink)', marginBottom: '6px' }}>
                    100% Cookie-Free &amp; Zero Trackers
                  </strong>
                  <p style={{ fontSize: '0.825rem', margin: 0, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                    No tracking cookies, no Google Analytics, no Meta Pixel. Web fonts and SVG assets are self-hosted locally, eliminating cross-border IP leakage.
                  </p>
                </div>

                <div className="dossier-card">
                  <div className="dossier-stamp-kicker" style={{ color: 'var(--purple)' }}>
                    <span>⏱️ STORAGE LIMITATION</span>
                  </div>
                  <strong style={{ fontSize: '0.98rem', display: 'block', color: 'var(--ink)', marginBottom: '6px' }}>
                    Automated 30-Day Purge Cron
                  </strong>
                  <p style={{ fontSize: '0.825rem', margin: 0, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                    Files are permanently deleted from secure cloud storage 30 days after project completion, adhering strictly to GDPR Art. 5(1)(e) data minimisation.
                  </p>
                </div>
              </div>

              {/* Direct Access Document Index */}
              <div className="dossier-card" style={{ background: '#ffffff' }}>
                <div className="dossier-stamp-kicker" style={{ color: 'var(--ink)' }}>
                  <span>📂 DOSSIER DIRECTORY</span>
                  <span>•</span>
                  <span>SELECT DOCUMENT TO INSPECT FULL STATUTORY CLAUSES</span>
                </div>
                
                <div className="dossier-grid-3" style={{ marginTop: '10px' }}>
                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('tos')}
                    className="dossier-index-tile"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Scale size={15} /> Terms of Service (TOS)
                    </span>
                    <span>→</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('privacy')}
                    className="dossier-index-tile"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={15} /> Privacy &amp; GDPR Policy
                    </span>
                    <span>→</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('cookies')}
                    className="dossier-index-tile"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Cookie size={15} /> 100% Cookie-Free Spec
                    </span>
                    <span>→</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('retention')}
                    className="dossier-index-tile"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={15} /> 30-Day Retention Spec
                    </span>
                    <span>→</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('dpa')}
                    className="dossier-index-tile"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileCheck size={15} /> Art. 28 DPA Contract
                    </span>
                    <span>→</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('impressum')}
                    className="dossier-index-tile"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building size={15} /> Impressum &amp; Contacts
                    </span>
                    <span>→</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE (TOS) */}
          {currentTab === 'tos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div className="dossier-card dossier-card-hero">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--ink)' }}>
                  <span>📜 LEGAL SPECIFICATION</span>
                  <span>•</span>
                  <span>DOC_REF: TOS-2026-V1</span>
                </div>
                <h3 className="dossier-card-title" style={{ fontSize: '1.3rem' }}>
                  Terms of Service &amp; Master Subscription Agreement
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                  Effective Date: November 2026 &bull; Enforceable across European Union &amp; International jurisdictions
                </span>
              </div>

              {/* Clause 1 */}
              <div className="clause-card">
                <span className="clause-tag">[ SPEC 01 // SCOPE ]</span>
                <h4 className="clause-title">1. Acceptance of Terms &amp; Scope of Service</h4>
                <p className="clause-body">
                  By registering an account on DropBrief, creating a project collection portal, or uploading assets via a client intake link, you explicitly agree to be bound by these Terms of Service. DropBrief provides a specialised cloud-based software-as-a-service (SaaS) platform facilitating friction-free asset collection between creative professionals ("Freelancers" / "Studios") and their respective clients ("Clients").
                </p>
              </div>

              {/* Clause 2 */}
              <div className="clause-card">
                <span className="clause-tag">[ SPEC 02 // AUTH ]</span>
                <h4 className="clause-title">2. Freelancer Accounts &amp; Security Authentication</h4>
                <p className="clause-body">
                  Freelancers authenticate using their registered email and a secure 6-digit numeric PIN code (or OAuth Google identity). The freelancer is solely responsible for maintaining the confidentiality of their PIN credentials. DropBrief will never ask for your PIN via unverified communication channels. Rate-limiting safeguards and cryptographic hashing protect accounts against brute-force intrusion.
                </p>
              </div>

              {/* Clause 3 */}
              <div className="clause-card">
                <span className="clause-tag">[ SPEC 03 // ZERO-FRICTION ]</span>
                <h4 className="clause-title">3. Zero-Friction Client Intake (No Passwords Required)</h4>
                <p className="clause-body">
                  DropBrief guarantees that Clients access designated intake portals via unique cryptographically safe project slugs without being forced to create passwords or register user accounts. Clients upload deliverables directly under the instruction of the freelancer who provided the link.
                </p>
              </div>

              {/* Clause 4 - SPECIAL SPOTLIGHT */}
              <div className="spotlight-guarantee-box">
                <div className="spotlight-stamp">
                  <ShieldCheck size={14} />
                  <span>GUARANTEED TITLE &amp; COPYRIGHT // SPEC 04</span>
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 900, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                  4. Intellectual Property &amp; File Ownership Guarantee
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.65, fontWeight: 500 }}>
                  <strong>DropBrief claims ZERO ownership, copyright, or intellectual property rights over any files, images, branding documents, or text inputs uploaded to the platform.</strong> All title, copyright, and trade secret rights remain strictly with the client and freelancer. DropBrief is granted solely a technical, non-exclusive license to host, encrypt, and transfer the assets for the express duration required to complete delivery.
                </p>
              </div>

              {/* Clause 5 */}
              <div className="clause-card">
                <span className="clause-tag">[ SPEC 05 // FAIR USE ]</span>
                <h4 className="clause-title">5. Service Tiers, Lifetime Referral Slots &amp; Fair Use</h4>
                <p className="clause-body">
                  The foundational tier provides 3 active project slots and 50 MB cloud storage free forever. Through our peer referral program, studios receive +2 permanent project slots and +50 MB storage for every referred peer who signs up. DropBrief reserves the right to suspend accounts engaging in automated referral spoofing, synthetic registration botting, or artificial storage hoarding.
                </p>
              </div>

              {/* Clause 6 */}
              <div className="clause-card">
                <span className="clause-tag">[ SPEC 06 // DSA AUP ]</span>
                <h4 className="clause-title">6. Acceptable Use Policy (AUP) &amp; Prohibited Content</h4>
                <p className="clause-body">
                  You must not use DropBrief to transmit or store: (a) malicious code, ransomware, or trojans; (b) deceptive phishing questionnaires; (c) child sexual abuse material (CSAM) or non-consensual imagery; (d) pirated software; or (e) materials infringing third-party intellectual property rights. DropBrief operates an active Notice-and-Action procedure pursuant to the EU Digital Services Act (DSA).
                </p>
              </div>

              {/* Clause 7 */}
              <div className="clause-card">
                <span className="clause-tag">[ SPEC 07 // LIABILITY ]</span>
                <h4 className="clause-title">7. Limitation of Liability &amp; "As-Is" Provision</h4>
                <p className="clause-body">
                  DropBrief is provided on an "AS-IS" and "AS-AVAILABLE" basis. To the maximum extent permitted by applicable law, DropBrief disclaims all warranties, express or implied. Under no circumstances shall DropBrief be liable for lost profits, loss of goodwill, or data loss resulting from scheduled 30-day retention purges. <strong>Freelancers are strictly instructed to download completed project deliverables into local offline storage immediately upon receipt.</strong>
                </p>
              </div>

              {/* Clause 8 */}
              <div className="clause-card">
                <span className="clause-tag">[ SPEC 08 // JURISDICTION ]</span>
                <h4 className="clause-title">8. Governing Law &amp; Dispute Resolution</h4>
                <p className="clause-body">
                  These Terms are governed by and construed under the laws of the Slovak Republic and the European Union, without regard to conflict of law principles. The competent courts of Bratislava, Slovak Republic, possess exclusive jurisdiction for disputes arising under these Terms.
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: PRIVACY & GDPR */}
          {currentTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div className="dossier-card dossier-card-hero">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--emerald)' }}>
                  <span>🔒 REGULATION (EU) 2016/679 COMPLIANCE STATEMENT</span>
                </div>
                <h3 className="dossier-card-title" style={{ fontSize: '1.3rem' }}>
                  Privacy Policy &amp; Data Protection Principles (GDPR)
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                  Certified for European Economic Area (EEA) and GDPR Article 13 &amp; 14 statutory requirements
                </span>
              </div>

              {/* Controller vs Processor Roles */}
              <div className="dossier-card" style={{ background: 'var(--emerald-tint)', borderColor: 'var(--emerald)' }}>
                <div className="dossier-stamp-kicker" style={{ color: 'var(--emerald)' }}>
                  <span>⚖️ ART. 4 &amp; 28 GDPR // DUAL LEGAL CAPACITIES</span>
                </div>
                <strong style={{ fontSize: '0.98rem', display: 'block', color: 'var(--ink)', marginBottom: '6px' }}>
                  1. Controller vs Processor Roles
                </strong>
                <p style={{ fontSize: '0.835rem', margin: 0, color: 'var(--ink)', lineHeight: 1.6 }}>
                  DropBrief operates in two distinct legal capacities under EU data protection law:
                </p>
                <div className="dossier-grid-2" style={{ marginTop: '12px' }}>
                  <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '6px', border: '1.5px solid #111' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.74rem', color: 'var(--cobalt)', display: 'block' }}>DATA CONTROLLER:</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', display: 'block', marginTop: '4px' }}>
                      For freelancer account credentials (email address, studio nickname, hashed PIN, login timestamps).
                    </span>
                  </div>
                  <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '6px', border: '1.5px solid #111' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.74rem', color: 'var(--emerald)', display: 'block' }}>DATA PROCESSOR:</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', display: 'block', marginTop: '4px' }}>
                      For all project materials, client files, briefs, and client emails submitted via intake portals. The creative professional/studio is the Data Controller.
                    </span>
                  </div>
                </div>
              </div>

              {/* Categories of Data & Lawful Bases */}
              <div className="dossier-card">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--ink)' }}>
                  <span>📋 GDPR ARTICLE 6 // LAWFUL BASES</span>
                </div>
                <strong style={{ fontSize: '0.98rem', display: 'block', color: 'var(--ink)', marginBottom: '10px' }}>
                  2. Categories of Personal Data Processed &amp; Lawful Bases
                </strong>
                
                <div className="dossier-grid-3">
                  <div style={{ background: 'var(--paper)', border: '1.5px solid #111', borderRadius: '6px', padding: '12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.78rem', color: 'var(--ink)', display: 'block' }}>Freelancer Email &amp; PIN</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', display: 'block', marginTop: '4px' }}>
                      <strong>Purpose:</strong> Authentication &amp; recovery<br />
                      <strong>Legal Basis:</strong> Performance of Contract (Art. 6(1)(b))
                    </span>
                  </div>

                  <div style={{ background: 'var(--paper)', border: '1.5px solid #111', borderRadius: '6px', padding: '12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.78rem', color: 'var(--ink)', display: 'block' }}>Client Email &amp; Deliverables</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', display: 'block', marginTop: '4px' }}>
                      <strong>Purpose:</strong> Delivering project briefs &amp; reminders<br />
                      <strong>Legal Basis:</strong> Legitimate Interest / Contract (Art. 6(1)(b)/(f))
                    </span>
                  </div>

                  <div style={{ background: 'var(--paper)', border: '1.5px solid #111', borderRadius: '6px', padding: '12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.78rem', color: 'var(--ink)', display: 'block' }}>Truncated IP &amp; Security Logs</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', display: 'block', marginTop: '4px' }}>
                      <strong>Purpose:</strong> DDoS prevention &amp; rate limiting<br />
                      <strong>Legal Basis:</strong> Legitimate Interest in Security (Art. 6(1)(f))
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-processors Table */}
              <div className="dossier-card">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--cobalt)' }}>
                  <span>🛡️ GDPR ART. 28(2) // INFRASTRUCTURE PARTNERS</span>
                </div>
                <strong style={{ fontSize: '0.98rem', display: 'block', color: 'var(--ink)', marginBottom: '10px' }}>
                  3. Verified Third-Party Sub-Processors
                </strong>
                
                <div className="dossier-table-wrap">
                  <table className="dossier-table">
                    <thead>
                      <tr>
                        <th>SUB-PROCESSOR</th>
                        <th>PROCESSING PURPOSE</th>
                        <th>DATA LOCATION</th>
                        <th>SAFEGUARD STANDARD</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Supabase Inc.</strong></td>
                        <td>Postgres Database &amp; Encrypted Storage</td>
                        <td>Ireland, EU (AWS eu-west-1)</td>
                        <td><span className="table-badge">AES-256 / ISO 27001</span></td>
                      </tr>
                      <tr>
                        <td><strong>Vercel Inc.</strong></td>
                        <td>Edge Hosting &amp; Serverless compute</td>
                        <td>EU Edge CDN Network</td>
                        <td><span className="table-badge">SOC 2 Type II / SCC</span></td>
                      </tr>
                      <tr>
                        <td><strong>Resend Inc.</strong></td>
                        <td>Transactional PIN &amp; reminder emails</td>
                        <td>Secure EU/US Transit</td>
                        <td><span className="table-badge">EU Standard Clauses</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Subject Rights */}
              <div className="dossier-card">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--ink)' }}>
                  <span>⚖️ STATUTORY ENTITLEMENTS</span>
                </div>
                <strong style={{ fontSize: '0.98rem', display: 'block', color: 'var(--ink)', marginBottom: '8px' }}>
                  4. Your Statutory Data Subject Rights (GDPR Articles 15–22)
                </strong>
                <p style={{ fontSize: '0.825rem', margin: '0 0 10px 0', color: 'var(--ink-muted)' }}>
                  Every EU resident whose data is held or processed by DropBrief is entitled to exercise the following fundamental rights:
                </p>

                <div className="dossier-grid-4">
                  <div style={{ background: 'var(--paper)', border: '1.5px solid #111', borderRadius: '6px', padding: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.74rem', color: 'var(--ink)', display: 'block' }}>Art. 15 Access</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '2px', display: 'block' }}>Request complete export of stored personal data.</span>
                  </div>
                  <div style={{ background: 'var(--paper)', border: '1.5px solid #111', borderRadius: '6px', padding: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.74rem', color: 'var(--ink)', display: 'block' }}>Art. 16 Rectification</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '2px', display: 'block' }}>Instantly update studio details and contact email.</span>
                  </div>
                  <div style={{ background: 'var(--paper)', border: '1.5px solid #111', borderRadius: '6px', padding: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.74rem', color: 'var(--ink)', display: 'block' }}>Art. 17 Erasure</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '2px', display: 'block' }}>Permanently erase studio account and all client files.</span>
                  </div>
                  <div style={{ background: 'var(--paper)', border: '1.5px solid #111', borderRadius: '6px', padding: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.74rem', color: 'var(--ink)', display: 'block' }}>Art. 20 Portability</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '2px', display: 'block' }}>Export deliverables in standardized ZIP archive formats.</span>
                  </div>
                </div>
              </div>

              {/* Data Deletion CTA for authenticated users */}
              {currentFreelancer && (
                <div className="dossier-card" style={{ background: 'var(--red-tint)', borderColor: 'var(--red)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <div className="dossier-stamp-kicker" style={{ color: 'var(--red)' }}>
                        <span>⚠️ IMMEDIATE ERASURE OPTION</span>
                      </div>
                      <strong style={{ color: 'var(--red)', display: 'block', fontSize: '0.95rem' }}>
                        Execute Right to Erasure (GDPR Art. 17)
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                        Permanently delete studio account, all active client upload links, and cloud storage files.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsLegalModalOpen(false);
                        openAccountModal();
                      }}
                      className="btn-dossier-primary"
                      style={{ background: 'var(--red)', color: '#ffffff', borderColor: '#111111' }}
                    >
                      <Trash2 size={14} /> Open Account Deletion Panel
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: 100% COOKIE-FREE POLICY */}
          {currentTab === 'cookies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div className="dossier-card dossier-card-hero">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--yellow)' }}>
                  <span>🍪 ePRIVACY DIRECTIVE 2002/58/EC</span>
                  <span>•</span>
                  <span>ZERO-TRACKING SPECIFICATION</span>
                </div>
                <h3 className="dossier-card-title" style={{ fontSize: '1.3rem' }}>
                  100% Cookie-Free &amp; Privacy-First Architecture
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                  Why DropBrief never interrupts users or clients with intrusive cookie consent popups
                </span>
              </div>

              {/* Highlight Hero Card */}
              <div className="spotlight-guarantee-box">
                <div className="spotlight-stamp">
                  <Cookie size={14} />
                  <span>ZERO NON-ESSENTIAL COOKIES = ZERO CONSENT BANNERS</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.65, fontWeight: 500 }}>
                  Under the European ePrivacy Directive and national electronic communication laws, cookie consent popups are mandatory <strong>only</strong> when a website stores or accesses non-essential, marketing, advertising, or cross-site tracking cookies. DropBrief relies on <strong>0 marketing cookies</strong>, <strong>0 behavioral tracking pixels</strong>, and <strong>0 cross-site identifiers</strong>.
                </p>
              </div>

              {/* 4 Technical Pillars */}
              <div className="dossier-grid-2">
                <div className="dossier-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <CheckCircle2 size={18} color="var(--emerald)" />
                    <strong style={{ fontSize: '0.92rem', color: 'var(--ink)' }}>0 Tracking &amp; Advertising Pixels</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                    We do not load Google Analytics, Meta Pixel, Hotjar, or advertising retargeting tags. Client activity and freelancer workflows remain 100% private.
                  </p>
                </div>

                <div className="dossier-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <CheckCircle2 size={18} color="var(--emerald)" />
                    <strong style={{ fontSize: '0.92rem', color: 'var(--ink)' }}>Strictly Necessary Local Storage</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                    We use standard browser <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--paper)', padding: '1px 5px', borderRadius: '3px', border: '1px solid #111' }}>localStorage</code> strictly for functional session continuity (remembering your active studio nickname and offline caching).
                  </p>
                </div>

                <div className="dossier-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <CheckCircle2 size={18} color="var(--emerald)" />
                    <strong style={{ fontSize: '0.92rem', color: 'var(--ink)' }}>Locally Bundled Self-Hosted Typography</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                    All typography and font files are compiled directly into the application bundle. We never query Google Fonts CDNs, fully complying with landmark EU privacy rulings (LG München).
                  </p>
                </div>

                <div className="dossier-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <CheckCircle2 size={18} color="var(--emerald)" />
                    <strong style={{ fontSize: '0.92rem', color: 'var(--ink)' }}>No Fingerprinting or IP Profiling</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                    Visitor IP addresses are never mapped to commercial identity graphs or sold to data brokers. Rate-limiting uses transient memory buckets with rapid expiration.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: 30-DAY RETENTION POLICY */}
          {currentTab === 'retention' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div className="dossier-card dossier-card-hero">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--purple)' }}>
                  <span>⏱️ GDPR ARTICLE 5(1)(e) STORAGE LIMITATION</span>
                </div>
                <h3 className="dossier-card-title" style={{ fontSize: '1.3rem' }}>
                  Automated 30-Day Retention &amp; Cloud Purge Protocol
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                  How DropBrief eliminates cloud liabilities through automated storage lifecycle management
                </span>
              </div>

              {/* Rationale Banner */}
              <div className="dossier-card" style={{ background: 'var(--purple-tint)', borderColor: 'var(--purple)' }}>
                <div className="dossier-stamp-kicker" style={{ color: 'var(--purple)' }}>
                  <span>⚡ LIABILITY MITIGATION</span>
                </div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--purple)', display: 'block', marginBottom: '6px' }}>
                  Why Indefinite File Retention Is a Serious Legal Liability
                </strong>
                <p style={{ margin: 0, fontSize: '0.835rem', color: 'var(--ink)', lineHeight: 1.65 }}>
                  Conventional cloud drives and open shared links accumulate gigabytes of client contracts, proprietary assets, and personally identifiable documents that linger forgotten for years, creating severe GDPR breach liabilities. DropBrief implements a strictly automated data lifecycle that guarantees files are deleted when their delivery purpose is accomplished.
                </p>
              </div>

              {/* Visual 4-Phase Pipeline */}
              <div className="dossier-card">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--ink)' }}>
                  <span>🔄 DELIVERABLE LIFECYCLE PIPELINE (STEP-BY-STEP)</span>
                </div>

                <div className="lifecycle-timeline" style={{ marginTop: '14px' }}>
                  
                  {/* Step 1 */}
                  <div className="lifecycle-step-card">
                    <div className="lifecycle-node" style={{ background: 'var(--yellow)', color: 'var(--ink)' }}>1</div>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Active Intake Window</strong>
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
                        Client accesses the unique link and uploads brand assets, PDFs, or photos into AES-256 encrypted EU cloud storage.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="lifecycle-step-card">
                    <div className="lifecycle-node" style={{ background: 'var(--cobalt)', color: '#ffffff' }}>2</div>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Docket 100% Complete &amp; ZIP Archive Download</strong>
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
                        Freelancer is notified, reviews received assets in their Dashboard, and downloads the bundled ZIP file to their local machine.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="lifecycle-step-card">
                    <div className="lifecycle-node" style={{ background: 'var(--orange)', color: '#ffffff' }}>3</div>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>30-Day Grace Window</strong>
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
                        Files remain accessible for 30 calendar days for emergency redownloads or revision checks.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="lifecycle-step-card">
                    <div className="lifecycle-node" style={{ background: 'var(--red)', color: '#ffffff' }}>4</div>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>
                        Automated Daily Cron Purge (<code style={{ fontFamily: 'var(--font-mono)' }}>/api/cron-purge</code>)
                      </strong>
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
                        Our automated worker executes a scheduled serverless purge query, permanently deleting all uploaded files from cloud buckets and freeing storage slots.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Instant Manual Option */}
              <div className="clause-card">
                <span className="clause-tag">[ INSTANT MANUAL PURGE ]</span>
                <h4 className="clause-title">Instant Manual Deletion Option</h4>
                <p className="clause-body">
                  Freelancers never have to wait 30 days if a client requests immediate deletion. You can click "Delete Project" at any time from your project dashboard to instantly purge all stored files and database entries.
                </p>
              </div>

            </div>
          )}

          {/* TAB 6: DATA PROCESSING AGREEMENT (DPA) */}
          {currentTab === 'dpa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div className="dossier-card dossier-card-hero">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div className="dossier-stamp-kicker" style={{ color: 'var(--cobalt)' }}>
                      <span>📑 GDPR ARTICLE 28 // STANDARD CONTRACTUAL CLAUSES</span>
                    </div>
                    <h3 className="dossier-card-title" style={{ fontSize: '1.3rem' }}>
                      Data Processing Agreement (DPA)
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                      Standard EU Data Processing Addendum for Creative Professionals, Freelancers and Studios
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyDpaText}
                    className="btn-dossier-primary"
                  >
                    {copiedDpa ? <Check size={15} /> : <Copy size={15} />}
                    <span>{copiedDpa ? 'Copied DPA!' : 'Copy DPA to Clipboard'}</span>
                  </button>
                </div>
              </div>

              {/* Terminal Viewer */}
              <div className="terminal-viewer">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="terminal-dot terminal-dot-red"></span>
                    <span className="terminal-dot terminal-dot-yellow"></span>
                    <span className="terminal-dot terminal-dot-green"></span>
                  </div>
                  <span className="terminal-file-label">dpa-dropbrief-article28-v1.txt</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#64748b' }}>READ-ONLY SPEC</span>
                </div>
                <pre className="terminal-content">
{`DATA PROCESSING ADDENDUM (DPA)
Pursuant to Article 28 of Regulation (EU) 2016/679 (GDPR)

1. CONTRACTING PARTIES:
- Data Controller: The creative professional, agency, or studio registered on DropBrief ("Controller").
- Data Processor: DropBrief Platform ("Processor"), operating in the European Union (Ireland).

2. SCOPE AND NATURE OF PROCESSING:
Processor provides secure cloud intake portals allowing Controller to receive client assets, briefs, and files. Processor stores assets strictly on behalf of the Controller.

3. DURATION:
Processing commences upon account activation and terminates upon project purge (maximum 30 days after project completion) or upon account deletion pursuant to GDPR Art. 17.

4. PROCESSOR COMMITMENTS UNDER ARTICLE 28(3):
(a) Processes personal data solely on documented instructions from Controller;
(b) Ensures all authorised technical personnel are bound by statutory confidentiality;
(c) Implements technical and organisational measures pursuant to Article 32 (AES-256 encryption, TLS 1.3 in-transit, Row Level Security);
(d) Engages only vetted EU-hosted sub-processors (Supabase AWS Dublin eu-west-1, Vercel EU Edge);
(e) Assists Controller in fulfilling data subject requests under Articles 15-22;
(f) Deletes all data after the end of the provision of services (30-day retention purge);
(g) Makes available all information necessary to demonstrate compliance with Article 28 obligations.`}
                </pre>
              </div>

              {/* Corporate Audit Certificate Box */}
              <div className="dossier-card" style={{ background: '#ffffff' }}>
                <div className="dossier-stamp-kicker" style={{ color: 'var(--ink)' }}>
                  <span>🏢 INSTITUTIONAL AUDIT NOTICE</span>
                </div>
                <strong style={{ fontSize: '0.92rem', color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                  Need a countersigned DPA for your corporate or agency client audit?
                </strong>
                <span style={{ fontSize: '0.825rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                  If your agency client requires a countersigned DPA with custom company registration details (IČO/DIČ/VAT), email our legal compliance team at <strong style={{ color: 'var(--ink)' }}>legal@usedropbrief.xyz</strong> and we will issue an executed PDF certificate.
                </span>
              </div>

            </div>
          )}

          {/* TAB 7: ACCEPTABLE USE & NOTICE-AND-ACTION (DSA) */}
          {currentTab === 'aup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div className="dossier-card dossier-card-hero">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--red)' }}>
                  <span>⚠️ DIGITAL SERVICES ACT (EU 2022/2065)</span>
                  <span>•</span>
                  <span>PLATFORM SECURITY</span>
                </div>
                <h3 className="dossier-card-title" style={{ fontSize: '1.3rem' }}>
                  Acceptable Use Policy &amp; Notice-and-Action Procedure
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                  Clear rules preventing platform misuse, malicious payloads, and unlawful file distribution
                </span>
              </div>

              {/* Prohibited Activities Card */}
              <div className="dossier-card" style={{ background: 'var(--red-tint)', borderColor: 'var(--red)' }}>
                <div className="dossier-stamp-kicker" style={{ color: 'var(--red)' }}>
                  <span>🚫 ZERO-TOLERANCE PROHIBITIONS</span>
                </div>
                <strong style={{ color: 'var(--red)', fontSize: '0.95rem', display: 'block', marginBottom: '8px' }}>
                  Strictly Prohibited Activities &amp; Content Types
                </strong>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.825rem', color: 'var(--ink)', lineHeight: 1.65 }}>
                  <li><strong>Malicious Payloads:</strong> Uploading executable files containing viruses, keyloggers, trojan horses, or ransomware.</li>
                  <li><strong>Phishing &amp; Credential Harvesting:</strong> Generating intake links designed to mimic bank portals, tax offices, or unauthorized credential harvesting forms.</li>
                  <li><strong>CSAM &amp; Exploitative Material:</strong> Zero-tolerance policy towards Child Sexual Abuse Material or non-consensual imagery. Immediate reporting to EU and international law enforcement.</li>
                  <li><strong>Infringing Copyright Content:</strong> Uploading pirated software, cracked license keys, or commercial films without intellectual property authorisation.</li>
                </ul>
              </div>

              {/* DSA Notice and Action */}
              <div className="dossier-card">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--ink)' }}>
                  <span>⚖️ EU DSA ARTICLE 16 // NOTICE-AND-ACTION</span>
                </div>
                <strong style={{ color: 'var(--ink)', display: 'block', fontSize: '0.92rem', marginBottom: '6px' }}>
                  Designated Single Point of Contact (SPOC)
                </strong>
                <p style={{ fontSize: '0.825rem', margin: '0 0 10px 0', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                  Pursuant to Article 16 of Regulation (EU) 2022/2065, any individual or copyright holder who identifies unlawful content hosted on a DropBrief link may submit an expedited notice to our Designated Single Point of Contact:
                </p>

                <div style={{ border: 'var(--border-ink)', borderRadius: '8px', padding: '14px 18px', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', display: 'block', fontFamily: 'var(--font-mono)' }}>Single Point of Contact for Authorities &amp; Users:</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>abuse@usedropbrief.xyz</strong>
                  </div>
                  <a 
                    href="mailto:abuse@usedropbrief.xyz?subject=DSA%20Notice%20of%20Illegal%20Content" 
                    className="btn-dossier-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    <Mail size={14} /> Submit Notice →
                  </a>
                </div>

                <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', display: 'block', marginTop: '8px' }}>
                  DropBrief reviews confirmed notices within 24 to 48 hours and deactivates offending intake links immediately.
                </span>
              </div>

            </div>
          )}

          {/* TAB 8: IMPRESSUM & CONTACTS */}
          {currentTab === 'impressum' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div className="dossier-card dossier-card-hero">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--ink)' }}>
                  <span>🏢 E-COMMERCE DIRECTIVE 2000/31/EC</span>
                  <span>•</span>
                  <span>STATUTORY TRANSPARENCY</span>
                </div>
                <h3 className="dossier-card-title" style={{ fontSize: '1.3rem' }}>
                  Impressum &amp; Regulatory Contacts
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                  Statutory corporate transparency, provider disclosure, and supervisory authority details
                </span>
              </div>

              {/* Service Provider Info */}
              <div className="dossier-card">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--ink)' }}>
                  <span>📋 SERVICE PROVIDER INFORMATION</span>
                </div>

                <div className="dossier-grid-2" style={{ marginTop: '10px' }}>
                  <div style={{ background: 'var(--paper)', border: '1.5px solid #111', borderRadius: '6px', padding: '10px 14px' }}>
                    <span style={{ color: 'var(--ink-muted)', display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>PLATFORM NAME:</span>
                    <strong style={{ color: 'var(--ink)', fontSize: '0.92rem' }}>DropBrief Platform</strong>
                  </div>

                  <div style={{ background: 'var(--paper)', border: '1.5px solid #111', borderRadius: '6px', padding: '10px 14px' }}>
                    <span style={{ color: 'var(--ink-muted)', display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>OFFICIAL WEB URL:</span>
                    <a href="https://usedropbrief.xyz" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cobalt)', fontWeight: 800, fontSize: '0.92rem', fontFamily: 'var(--font-mono)' }}>
                      https://usedropbrief.xyz
                    </a>
                  </div>

                  <div style={{ background: 'var(--paper)', border: '1.5px solid #111', borderRadius: '6px', padding: '10px 14px' }}>
                    <span style={{ color: 'var(--ink-muted)', display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>CLOUD INFRASTRUCTURE:</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 700, fontSize: '0.88rem' }}>Ireland EU (AWS Dublin eu-west-1)</span>
                  </div>

                  <div style={{ background: 'var(--paper)', border: '1.5px solid #111', borderRadius: '6px', padding: '10px 14px' }}>
                    <span style={{ color: 'var(--ink-muted)', display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>APPLICABLE JURISDICTION:</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 700, fontSize: '0.88rem' }}>Slovak Republic &amp; European Union</span>
                  </div>
                </div>
              </div>

              {/* Department Mailboxes */}
              <div className="dossier-card">
                <div className="dossier-stamp-kicker" style={{ color: 'var(--ink)' }}>
                  <span>📬 DESIGNATED COMMUNICATION CHANNELS</span>
                </div>
                
                <div className="dossier-grid-2" style={{ marginTop: '10px' }}>
                  <div className="contact-tile">
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>DATA PROTECTION &amp; GDPR DPO:</span>
                    <a href="mailto:privacy@usedropbrief.xyz" className="contact-email-link">
                      privacy@usedropbrief.xyz
                    </a>
                  </div>

                  <div className="contact-tile">
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>LEGAL &amp; CONTRACTS (TOS/DPA):</span>
                    <a href="mailto:legal@usedropbrief.xyz" className="contact-email-link">
                      legal@usedropbrief.xyz
                    </a>
                  </div>

                  <div className="contact-tile">
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>ABUSE &amp; DSA NOTICE-AND-ACTION:</span>
                    <a href="mailto:abuse@usedropbrief.xyz" className="contact-email-link">
                      abuse@usedropbrief.xyz
                    </a>
                  </div>

                  <div className="contact-tile">
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>CUSTOMER &amp; TECHNICAL SUPPORT:</span>
                    <a href="mailto:support@usedropbrief.xyz" className="contact-email-link">
                      support@usedropbrief.xyz
                    </a>
                  </div>
                </div>
              </div>

              {/* Supervisory Authority */}
              <div className="clause-card">
                <span className="clause-tag">[ LEAD SUPERVISORY AUTHORITY // DPA ]</span>
                <h4 className="clause-title">Competent Lead Data Protection Authority</h4>
                <p className="clause-body">
                  <strong>Úrad na ochranu osobných údajov Slovenskej republiky</strong> (Office for Personal Data Protection of the Slovak Republic), Hraničná 12, 820 07 Bratislava 27, Slovak Republic (<a href="https://dataprotection.gov.sk" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cobalt)', fontWeight: 700 }}>dataprotection.gov.sk</a>).
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="legal-dossier-footer">
          <div className="legal-status-line">
            <span className="status-dot status-dot-live" aria-hidden="true"></span>
            <span>ALL EUROPEAN COMPLIANCE POLICIES ACTIVE &bull; REVISION: NOV 2026</span>
          </div>

          <div className="legal-footer-actions">
            <button 
              type="button"
              onClick={() => {
                const currentIndex = tabs.findIndex(t => t.id === currentTab);
                const nextIndex = (currentIndex + 1) % tabs.length;
                setLegalModalTab(tabs[nextIndex].id);
              }}
              className="btn-dossier-nav"
              title="Navigate to next legal document"
            >
              <span>Next Document →</span>
            </button>

            <button 
              id="btn-close-legal-footer"
              onClick={() => setIsLegalModalOpen(false)} 
              className="btn-dossier-primary"
            >
              Understood, close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
