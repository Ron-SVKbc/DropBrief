import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
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
  HelpCircle
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
    { id: 'overview', label: 'LEGAL SPEC', icon: ShieldCheck, badge: 'Matrix' },
    { id: 'tos', label: 'TERMS OF SERVICE', icon: Scale, badge: 'TOS' },
    { id: 'privacy', label: 'PRIVACY & GDPR', icon: Lock, badge: 'GDPR' },
    { id: 'cookies', label: '100% COOKIE-FREE', icon: Cookie, badge: 'ePrivacy' },
    { id: 'retention', label: '30-DAY RETENTION', icon: Clock, badge: 'Art. 5' },
    { id: 'dpa', label: 'DPA CONTRACT', icon: FileCheck, badge: 'Art. 28' },
    { id: 'aup', label: 'ACCEPTABLE USE', icon: AlertTriangle, badge: 'DSA' },
    { id: 'impressum', label: 'IMPRESSUM', icon: Building, badge: 'Contact' },
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
      className="modal-overlay"
      style={{ 
        zIndex: 120,
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsLegalModalOpen(false);
      }}
    >
      <div 
        className="auth-modal-card animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        style={{
          width: '100%',
          maxWidth: '880px',
          height: '88vh',
          maxHeight: '840px',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          border: '2px solid #111111',
          boxShadow: '8px 8px 0 #111111',
          borderRadius: 'var(--radius-xl, 16px)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '2px solid #111111',
          background: 'var(--bg-base, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              padding: '8px', 
              borderRadius: '8px', 
              background: '#FFE500', 
              color: '#111111', 
              border: '2px solid #111111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={22} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 id="legal-modal-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111111', margin: 0 }}>
                  DOC_SPEC: Legal &amp; Compliance Center
                </h2>
                <span style={{ 
                  fontSize: '0.68rem', 
                  fontWeight: 800, 
                  background: 'var(--emerald, #10B981)', 
                  color: '#ffffff', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  border: '1px solid #111'
                }}>
                  EU COMPLIANT (GDPR)
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #475569)', display: 'block', marginTop: '2px' }}>
                Terms of service, privacy policies, data retention, zero-cookie guarantee &amp; regulatory specs
              </span>
            </div>
          </div>

          <button 
            id="btn-close-legal-modal"
            onClick={() => setIsLegalModalOpen(false)}
            aria-label="Close legal and compliance dialog"
            className="btn btn-secondary btn-sm"
            style={{ 
              borderRadius: '8px', 
              padding: '6px 8px', 
              border: '2px solid #111111', 
              boxShadow: '2px 2px 0 #111111',
              background: '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div 
          role="tablist"
          aria-label="Legal document categories"
          style={{
            display: 'flex',
            overflowX: 'auto',
            background: '#ffffff',
            borderBottom: '2px solid #111111',
            padding: '6px 12px 0 12px',
            gap: '6px',
            scrollbarWidth: 'thin'
          }}
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
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono, monospace)',
                  border: '2px solid #111111',
                  borderBottom: isActive ? '2px solid #ffffff' : '2px solid #111111',
                  marginBottom: isActive ? '-2px' : '6px',
                  background: isActive ? '#FFE500' : 'var(--bg-base, #f1f5f9)',
                  color: '#111111',
                  cursor: 'pointer',
                  borderRadius: '6px 6px 0 0',
                  boxShadow: isActive ? 'none' : '2px 2px 0 #111111',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.1s ease'
                }}
              >
                <Icon size={14} strokeWidth={2.5} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div style={{ 
          padding: '24px 28px', 
          overflowY: 'auto', 
          flex: 1, 
          fontSize: '0.86rem', 
          lineHeight: 1.6, 
          color: 'var(--text-secondary, #334155)',
          background: '#ffffff'
        }}>

          {/* TAB 1: OVERVIEW & LEGAL SPEC MATRIX */}
          {currentTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ 
                background: 'rgba(255, 229, 0, 0.15)', 
                border: '2px solid #111111', 
                borderRadius: '12px', 
                padding: '16px 20px',
                boxShadow: '3px 3px 0 #111111'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <ShieldCheck size={20} color="#111111" />
                  <strong style={{ fontSize: '1rem', color: '#111111' }}>
                    DropBrief Architecture &amp; Legal Compliance Matrix
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.825rem', color: '#111111' }}>
                  DropBrief is architected from the ground up for strict compliance with the European Union regulatory framework, specifically the <strong>General Data Protection Regulation (GDPR 2016/679)</strong>, the <strong>ePrivacy Directive (2002/58/EC)</strong>, and the <strong>Digital Services Act (EU 2022/2065)</strong>.
                </p>
              </div>

              {/* Compliance Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '14px' 
              }}>
                <div style={{ border: '2px solid #111111', borderRadius: '10px', padding: '14px', background: '#f8fafc', boxShadow: '2px 2px 0 #111111' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-primary, #2563eb)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    LEGAL ROLE (GDPR)
                  </span>
                  <strong style={{ color: '#111111', fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                    Data Processor vs Data Controller
                  </strong>
                  <p style={{ fontSize: '0.8rem', margin: 0, color: '#475569' }}>
                    DropBrief acts strictly as a <strong>Technical Data Processor</strong> (Art. 28 GDPR). The creative studio/freelancer acts as the <strong>Data Controller</strong> responsible for asset requests.
                  </p>
                </div>

                <div style={{ border: '2px solid #111111', borderRadius: '10px', padding: '14px', background: '#f8fafc', boxShadow: '2px 2px 0 #111111' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--emerald, #10B981)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    DATA GEOGRAPHY
                  </span>
                  <strong style={{ color: '#111111', fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                    100% European Union (Ireland)
                  </strong>
                  <p style={{ fontSize: '0.8rem', margin: 0, color: '#475569' }}>
                    All cloud volumes, databases, and uploaded deliverables reside in certified AWS Dublin (<code>eu-west-1</code>) infrastructure. Zero customer data leaves EU territory.
                  </p>
                </div>

                <div style={{ border: '2px solid #111111', borderRadius: '10px', padding: '14px', background: '#f8fafc', boxShadow: '2px 2px 0 #111111' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--orange, #FF4400)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    PRIVACY BY DESIGN
                  </span>
                  <strong style={{ color: '#111111', fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                    100% Cookie-Free &amp; Zero Trackers
                  </strong>
                  <p style={{ fontSize: '0.8rem', margin: 0, color: '#475569' }}>
                    No tracking cookies, no Google Analytics, no Meta Pixel. Web fonts and SVG assets are self-hosted locally, eliminating cross-border IP leakage.
                  </p>
                </div>

                <div style={{ border: '2px solid #111111', borderRadius: '10px', padding: '14px', background: '#f8fafc', boxShadow: '2px 2px 0 #111111' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    STORAGE LIMITATION
                  </span>
                  <strong style={{ color: '#111111', fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                    Automated 30-Day Purge Cron
                  </strong>
                  <p style={{ fontSize: '0.8rem', margin: 0, color: '#475569' }}>
                    Files are permanently deleted from secure cloud storage 30 days after project completion, adhering strictly to GDPR Art. 5(1)(e) data minimisation.
                  </p>
                </div>
              </div>

              {/* Quick Navigation to Full Specs */}
              <div style={{ border: '2px solid #111111', borderRadius: '12px', padding: '18px', background: '#ffffff', boxShadow: '3px 3px 0 #111111' }}>
                <strong style={{ fontSize: '0.925rem', color: '#111111', display: 'block', marginBottom: '10px' }}>
                  Select a document to inspect full legal text:
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('tos')}
                    className="btn btn-secondary btn-sm"
                    style={{ border: '2px solid #111', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    <Scale size={13} /> Terms of Service (TOS) →
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('privacy')}
                    className="btn btn-secondary btn-sm"
                    style={{ border: '2px solid #111', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    <Lock size={13} /> Privacy &amp; GDPR Policy →
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('cookies')}
                    className="btn btn-secondary btn-sm"
                    style={{ border: '2px solid #111', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    <Cookie size={13} /> Cookie-Free Declaration →
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('retention')}
                    className="btn btn-secondary btn-sm"
                    style={{ border: '2px solid #111', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    <Clock size={13} /> 30-Day Retention Spec →
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('dpa')}
                    className="btn btn-secondary btn-sm"
                    style={{ border: '2px solid #111', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    <FileCheck size={13} /> Art. 28 DPA Contract →
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setLegalModalTab('impressum')}
                    className="btn btn-secondary btn-sm"
                    style={{ border: '2px solid #111', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    <Building size={13} /> Impressum &amp; Contacts →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE (TOS) */}
          {currentTab === 'tos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
                  LEGAL SPECIFICATION // DOC_REF: TOS-2026-V1
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', margin: '4px 0 6px 0' }}>
                  Terms of Service &amp; Master Subscription Agreement
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                  Effective Date: November 2026 &bull; Applicable across EU &amp; International jurisdictions
                </span>
              </div>

              <div style={{ borderLeft: '3px solid #111111', paddingLeft: '14px' }}>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
                  1. Acceptance of Terms &amp; Scope of Service
                </strong>
                <p style={{ margin: 0, fontSize: '0.825rem' }}>
                  By registering an account on DropBrief, creating a project collection portal, or uploading assets via a client intake link, you explicitly agree to be bound by these Terms of Service. DropBrief provides a specialised cloud-based software-as-a-service (SaaS) platform facilitating friction-free asset collection between creative professionals ("Freelancers" / "Studios") and their respective clients ("Clients").
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #111111', paddingLeft: '14px' }}>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
                  2. Freelancer Accounts &amp; Security Authentication
                </strong>
                <p style={{ margin: 0, fontSize: '0.825rem' }}>
                  Freelancers authenticate using their registered email and a secure 6-digit numeric PIN code (or OAuth Google identity). The freelancer is solely responsible for maintaining the confidentiality of their PIN credentials. DropBrief will never ask for your PIN via unverified communication channels. Rate-limiting safeguards and cryptographic hashing protect accounts against brute-force intrusion.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #111111', paddingLeft: '14px' }}>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
                  3. Zero-Friction Client Intake (No Passwords Required)
                </strong>
                <p style={{ margin: 0, fontSize: '0.825rem' }}>
                  DropBrief guarantees that Clients access designated intake portals via unique cryptographically safe project slugs without being forced to create passwords or register user accounts. Clients upload deliverables directly under the instruction of the freelancer who provided the link.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #111111', paddingLeft: '14px' }}>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
                  4. Intellectual Property &amp; File Ownership Guarantee
                </strong>
                <p style={{ margin: 0, fontSize: '0.825rem' }}>
                  <strong>DropBrief claims ZERO ownership, copyright, or intellectual property rights over any files, images, branding documents, or text inputs uploaded to the platform.</strong> All title, copyright, and trade secret rights remain strictly with the client and freelancer. DropBrief is granted solely a technical, non-exclusive license to host, encrypt, and transfer the assets for the express duration required to complete delivery.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #111111', paddingLeft: '14px' }}>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
                  5. Service Tiers, Lifetime Referral Slots &amp; Fair Use
                </strong>
                <p style={{ margin: 0, fontSize: '0.825rem' }}>
                  The foundational tier provides 3 active project slots and 50 MB cloud storage free forever. Through our peer referral program, studios receive +2 permanent project slots and +50 MB storage for every referred peer who signs up. DropBrief reserves the right to suspend accounts engaging in automated referral spoofing, synthetic registration botting, or artificial storage hoarding.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #111111', paddingLeft: '14px' }}>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
                  6. Acceptable Use Policy (AUP) &amp; Prohibited Content
                </strong>
                <p style={{ margin: 0, fontSize: '0.825rem' }}>
                  You must not use DropBrief to transmit or store: (a) malicious code, ransomware, or trojans; (b) deceptive phishing questionnaires; (c) child sexual abuse material (CSAM) or non-consensual imagery; (d) pirated software; or (e) materials infringing third-party intellectual property rights. DropBrief operates an active Notice-and-Action procedure pursuant to the EU Digital Services Act (DSA).
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #111111', paddingLeft: '14px' }}>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
                  7. Limitation of Liability &amp; "As-Is" Provision
                </strong>
                <p style={{ margin: 0, fontSize: '0.825rem' }}>
                  DropBrief is provided on an "AS-IS" and "AS-AVAILABLE" basis. To the maximum extent permitted by applicable law, DropBrief disclaims all warranties, express or implied. Under no circumstances shall DropBrief be liable for lost profits, loss of goodwill, or data loss resulting from scheduled 30-day retention purges. <strong>Freelancers are strictly instructed to download completed project deliverables into local offline storage immediately upon receipt.</strong>
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #111111', paddingLeft: '14px' }}>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
                  8. Governing Law &amp; Dispute Resolution
                </strong>
                <p style={{ margin: 0, fontSize: '0.825rem' }}>
                  These Terms are governed by and construed under the laws of the Slovak Republic and the European Union, without regard to conflict of law principles. The competent courts of Bratislava, Slovak Republic, possess exclusive jurisdiction for disputes arising under these Terms.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & GDPR */}
          {currentTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--emerald, #10B981)', textTransform: 'uppercase' }}>
                  REGULATION (EU) 2016/679 COMPLIANCE STATEMENT
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', margin: '4px 0 6px 0' }}>
                  Privacy Policy &amp; Data Protection Principles (GDPR)
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                  Certified for European Economic Area (EEA) and GDPR Article 13 &amp; 14 requirements
                </span>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '2px solid #111111', borderRadius: '10px', padding: '16px', boxShadow: '2px 2px 0 #111111' }}>
                <strong style={{ color: '#111111', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                  1. Controller vs Processor Roles (GDPR Art. 4 &amp; 28)
                </strong>
                <p style={{ fontSize: '0.825rem', margin: 0, color: '#111111' }}>
                  DropBrief operates in two distinct legal capacities under EU data protection law:
                </p>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', fontSize: '0.8rem' }}>
                  <li><strong>Data Controller:</strong> For freelancer account credentials (email address, studio nickname, hashed PIN, login timestamps).</li>
                  <li><strong>Data Processor:</strong> For all project materials, client files, briefs, and client emails submitted via intake portals. The creative professional/studio is the Data Controller.</li>
                </ul>
              </div>

              <div>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>
                  2. Categories of Personal Data Processed &amp; Lawful Bases (GDPR Art. 6)
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#111111', display: 'block' }}>Freelancer Email &amp; PIN</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      <strong>Purpose:</strong> Authentication &amp; recovery<br />
                      <strong>Legal Basis:</strong> Performance of Contract (Art. 6(1)(b))
                    </span>
                  </div>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#111111', display: 'block' }}>Client Email &amp; Deliverables</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      <strong>Purpose:</strong> Delivering project briefs &amp; reminders<br />
                      <strong>Legal Basis:</strong> Legitimate Interest / Contract (Art. 6(1)(b)/(f))
                    </span>
                  </div>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#111111', display: 'block' }}>Truncated IP &amp; Security Logs</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                      <strong>Purpose:</strong> DDoS prevention &amp; rate limiting<br />
                      <strong>Legal Basis:</strong> Legitimate Interest in Security (Art. 6(1)(f))
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>
                  3. Verified Third-Party Sub-Processors (GDPR Art. 28(2))
                </strong>
                <div style={{ border: '2px solid #111111', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #111111' }}>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 800 }}>Sub-Processor</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 800 }}>Processing Purpose</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 800 }}>Data Location</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 800 }}>Safeguard</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700 }}>Supabase Inc.</td>
                        <td style={{ padding: '8px 12px' }}>Postgres Database &amp; Encrypted Storage</td>
                        <td style={{ padding: '8px 12px' }}>Ireland, EU (AWS eu-west-1)</td>
                        <td style={{ padding: '8px 12px' }}>AES-256 / ISO 27001</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700 }}>Vercel Inc.</td>
                        <td style={{ padding: '8px 12px' }}>Edge Hosting &amp; Serverless compute</td>
                        <td style={{ padding: '8px 12px' }}>EU Edge CDN Network</td>
                        <td style={{ padding: '8px 12px' }}>SOC 2 Type II / SCC</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 12px', fontWeight: 700 }}>Resend Inc.</td>
                        <td style={{ padding: '8px 12px' }}>Transactional PIN &amp; reminder emails</td>
                        <td style={{ padding: '8px 12px' }}>Secure EU/US Transit</td>
                        <td style={{ padding: '8px 12px' }}>EU Standard Contractual Clauses</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>
                  4. Your Statutory Data Subject Rights (GDPR Articles 15–22)
                </strong>
                <p style={{ fontSize: '0.825rem', margin: '0 0 8px 0' }}>
                  Every EU resident whose data is held or processed by DropBrief is entitled to exercise the following fundamental rights:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.78rem' }}>
                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <strong>Art. 15 Right of Access:</strong> Request a complete export of stored personal data.
                  </div>
                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <strong>Art. 16 Right to Rectification:</strong> Instantly update studio details and contact email.
                  </div>
                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <strong>Art. 17 Right to Erasure:</strong> Permanently erase your account and all client files.
                  </div>
                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <strong>Art. 20 Data Portability:</strong> Export deliverables in standardized ZIP archive formats.
                  </div>
                </div>
              </div>

              {/* Data Deletion CTA for authenticated users */}
              {currentFreelancer && (
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.05)', 
                  border: '2px solid #ef4444', 
                  borderRadius: '10px', 
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <strong style={{ color: '#dc2626', display: 'block', fontSize: '0.88rem' }}>
                      Execute Right to Erasure (GDPR Art. 17)
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Permanently delete studio account, all active client upload links, and cloud storage files.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLegalModalOpen(false);
                      openAccountModal();
                    }}
                    className="btn btn-outline-danger btn-sm"
                    style={{ border: '2px solid #ef4444', fontWeight: 700 }}
                  >
                    <Trash2 size={14} /> Open Account Deletion Panel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: 100% COOKIE-FREE POLICY */}
          {currentTab === 'cookies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--yellow, #ca8a04)', textTransform: 'uppercase' }}>
                  EPIC DIRECTIVE 2002/58/EC &amp; ZERO-TRACKING SPECIFICATION
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', margin: '4px 0 6px 0' }}>
                  100% Cookie-Free &amp; Privacy-First Architecture
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                  Why DropBrief never interrupts users with intrusive cookie consent popups
                </span>
              </div>

              <div style={{ 
                background: '#FFE500', 
                border: '2px solid #111111', 
                borderRadius: '10px', 
                padding: '16px 20px',
                boxShadow: '3px 3px 0 #111111',
                color: '#111111'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Cookie size={20} strokeWidth={2.5} />
                  <strong style={{ fontSize: '0.98rem' }}>
                    Zero Non-Essential Cookies = Zero Consent Banners
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.825rem', lineHeight: 1.55 }}>
                  Under the European ePrivacy Directive and national electronic communication laws, cookie consent popups are mandatory <strong>only</strong> when a website stores or accesses non-essential, marketing, advertising, or cross-site tracking cookies. DropBrief relies on <strong>0 marketing cookies</strong>, <strong>0 behavioral tracking pixels</strong>, and <strong>0 cross-site identifiers</strong>.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div style={{ border: '2px solid #111111', borderRadius: '10px', padding: '14px', background: '#f8fafc', boxShadow: '2px 2px 0 #111111' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <CheckCircle2 size={16} color="var(--emerald, #10B981)" />
                    <strong style={{ color: '#111111', fontSize: '0.88rem' }}>0 Tracking &amp; Advertising Pixels</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                    We do not load Google Analytics, Meta Pixel, Hotjar, or advertising retargeting tags. Client activity and freelancer workflows remain 100% private.
                  </p>
                </div>

                <div style={{ border: '2px solid #111111', borderRadius: '10px', padding: '14px', background: '#f8fafc', boxShadow: '2px 2px 0 #111111' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <CheckCircle2 size={16} color="var(--emerald, #10B981)" />
                    <strong style={{ color: '#111111', fontSize: '0.88rem' }}>Strictly Necessary Local Storage</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                    We use standard browser <code>localStorage</code> strictly for functional session continuity (remembering your active studio nickname and offline caching).
                  </p>
                </div>

                <div style={{ border: '2px solid #111111', borderRadius: '10px', padding: '14px', background: '#f8fafc', boxShadow: '2px 2px 0 #111111' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <CheckCircle2 size={16} color="var(--emerald, #10B981)" />
                    <strong style={{ color: '#111111', fontSize: '0.88rem' }}>Locally Bundled Self-Hosted Typography</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                    All typography and font files are compiled directly into the application bundle. We never query Google Fonts CDNs, fully complying with landmark EU privacy rulings (LG München).
                  </p>
                </div>

                <div style={{ border: '2px solid #111111', borderRadius: '10px', padding: '14px', background: '#f8fafc', boxShadow: '2px 2px 0 #111111' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <CheckCircle2 size={16} color="var(--emerald, #10B981)" />
                    <strong style={{ color: '#111111', fontSize: '0.88rem' }}>No Fingerprinting or IP Profiling</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                    Visitor IP addresses are never mapped to commercial identity graphs or sold to data brokers. Rate-limiting uses transient memory buckets with rapid expiration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: 30-DAY RETENTION POLICY */}
          {currentTab === 'retention' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>
                  GDPR ARTICLE 5(1)(e) STORAGE LIMITATION SPEC
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', margin: '4px 0 6px 0' }}>
                  Automated 30-Day Retention &amp; Cloud Purge Protocol
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                  How DropBrief eliminates cloud liabilities through automated storage lifecycle management
                </span>
              </div>

              <div style={{ border: '2px solid #111111', borderRadius: '12px', padding: '16px 20px', background: '#faf5ff', boxShadow: '3px 3px 0 #111111' }}>
                <strong style={{ color: '#7c3aed', fontSize: '0.925rem', display: 'block', marginBottom: '6px' }}>
                  Why Indefinite File Retention Is a Serious Legal Liability
                </strong>
                <p style={{ margin: 0, fontSize: '0.825rem', color: '#111111' }}>
                  Conventional cloud drives and open shared links accumulate gigabytes of client contracts, proprietary assets, and personally identifiable documents that linger forgotten for years, creating severe GDPR breach liabilities. DropBrief implements a strictly automated data lifecycle that guarantees files are deleted when their delivery purpose is accomplished.
                </p>
              </div>

              {/* Visual Lifecycle Timeline */}
              <div style={{ border: '2px solid #111111', borderRadius: '10px', padding: '16px', background: '#ffffff' }}>
                <strong style={{ fontSize: '0.88rem', color: '#111111', display: 'block', marginBottom: '14px' }}>
                  Deliverable Lifecycle Timeline (Step-by-Step):
                </strong>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FFE500', color: '#111', border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.8rem' }}>1</div>
                    <div>
                      <strong style={{ color: '#111111', fontSize: '0.85rem' }}>Active Intake Window</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                        Client accesses the unique link and uploads brand assets, PDFs, or photos into AES-256 encrypted EU cloud storage.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary, #2563eb)', color: '#fff', border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.8rem' }}>2</div>
                    <div>
                      <strong style={{ color: '#111111', fontSize: '0.85rem' }}>Docket 100% Complete &amp; ZIP Archive Download</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                        Freelancer is notified, reviews received assets in their Dashboard, and downloads the bundled ZIP file to their local machine.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ca8a04', color: '#fff', border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.8rem' }}>3</div>
                    <div>
                      <strong style={{ color: '#111111', fontSize: '0.85rem' }}>30-Day Grace Window</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                        Files remain accessible for 30 calendar days for emergency redownloads or revision checks.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dc2626', color: '#fff', border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, fontSize: '0.8rem' }}>4</div>
                    <div>
                      <strong style={{ color: '#111111', fontSize: '0.85rem' }}>Automated Daily Cron Purge (<code>/api/cron-purge</code>)</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                        Our automated worker executes a scheduled serverless purge query, permanently deleting all uploaded files from cloud buckets and freeing storage slots.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderLeft: '3px solid #111111', paddingLeft: '14px' }}>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.88rem' }}>
                  Instant Manual Deletion Option
                </strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Freelancers never have to wait 30 days if a client requests immediate deletion. You can click "Delete Project" at any time from your project dashboard to instantly purge all stored files and database entries.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: DATA PROCESSING AGREEMENT (DPA) */}
          {currentTab === 'dpa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-primary, #2563eb)', textTransform: 'uppercase' }}>
                    STANDARD CONTRACTUAL TERMS // GDPR ARTICLE 28
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', margin: '4px 0 6px 0' }}>
                    Data Processing Agreement (DPA)
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                    Standard EU Data Processing Addendum for Creative Professionals, Freelancers and Studios
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyDpaText}
                  className="btn btn-primary btn-sm"
                  style={{ 
                    border: '2px solid #111', 
                    borderRadius: '8px', 
                    boxShadow: '2px 2px 0 #111',
                    gap: '6px',
                    fontWeight: 800,
                    fontSize: '0.78rem'
                  }}
                >
                  {copiedDpa ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedDpa ? 'Copied DPA!' : 'Copy DPA to Clipboard'}</span>
                </button>
              </div>

              <div style={{ background: '#f8fafc', border: '2px solid #111111', borderRadius: '10px', padding: '16px', fontSize: '0.8rem', lineHeight: 1.6, fontFamily: 'var(--font-mono, monospace)', maxHeight: '320px', overflowY: 'auto' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
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

              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f1f5f9', fontSize: '0.8rem' }}>
                <strong style={{ color: '#111111', display: 'block', marginBottom: '2px' }}>
                  Need a signed DPA for your institutional client audit?
                </strong>
                <span style={{ color: '#64748b' }}>
                  If your agency client requires a countersigned DPA with custom company registration details (IČO/DIČ/VAT), email our legal compliance team at <strong>legal@usedropbrief.xyz</strong> and we will issue an executed PDF certificate.
                </span>
              </div>
            </div>
          )}

          {/* TAB 7: ACCEPTABLE USE & NOTICE-AND-ACTION (DSA) */}
          {currentTab === 'aup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--danger, #ef4444)', textTransform: 'uppercase' }}>
                  DIGITAL SERVICES ACT (EU 2022/2065) &amp; SECURITY
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', margin: '4px 0 6px 0' }}>
                  Acceptable Use Policy &amp; Notice-and-Action Procedure
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                  Clear rules preventing platform misuse, malicious payloads, and unlawful file distribution
                </span>
              </div>

              <div style={{ border: '2px solid #111111', borderRadius: '10px', padding: '16px', background: 'rgba(239, 68, 68, 0.04)', boxShadow: '2px 2px 0 #111111' }}>
                <strong style={{ color: '#dc2626', fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                  Strictly Prohibited Activities &amp; Content Types
                </strong>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.825rem', color: '#111111', lineHeight: 1.6 }}>
                  <li><strong>Malicious Payloads:</strong> Uploading executable files containing viruses, keyloggers, trojan horses, or ransomware.</li>
                  <li><strong>Phishing &amp; Credential Harvesting:</strong> Generating intake links designed to mimic bank portals, tax offices, or unauthorized credential harvesting forms.</li>
                  <li><strong>CSAM &amp; Exploitative Material:</strong> Zero-tolerance policy towards Child Sexual Abuse Material or non-consensual imagery. Immediate reporting to EU and international law enforcement.</li>
                  <li><strong>Infringing Copyright Content:</strong> Uploading pirated software, cracked license keys, or commercial films without intellectual property authorisation.</li>
                </ul>
              </div>

              <div>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>
                  Notice-and-Action Mechanism (EU Digital Services Act)
                </strong>
                <p style={{ fontSize: '0.825rem', margin: '0 0 8px 0' }}>
                  Pursuant to Article 16 of Regulation (EU) 2022/2065, any individual or copyright holder who identifies unlawful content hosted on a DropBrief link may submit an expedited notice to our Designated Single Point of Contact:
                </p>

                <div style={{ border: '2px solid #111111', borderRadius: '8px', padding: '12px 16px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Single Point of Contact for Authorities &amp; Users:</span>
                    <strong style={{ fontSize: '0.925rem', color: '#111111' }}>abuse@usedropbrief.xyz</strong>
                  </div>
                  <a 
                    href="mailto:abuse@usedropbrief.xyz?subject=DSA%20Notice%20of%20Illegal%20Content" 
                    className="btn btn-secondary btn-sm"
                    style={{ border: '2px solid #111', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    <Mail size={13} /> Submit Notice →
                  </a>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '6px' }}>
                  DropBrief reviews confirmed notices within 24 to 48 hours and deactivates offending intake links immediately.
                </span>
              </div>
            </div>
          )}

          {/* TAB 8: IMPRESSUM & CONTACTS */}
          {currentTab === 'impressum' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
                  COMMERCIAL INFORMATION // E-COMMERCE DIRECTIVE 2000/31/EC
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111111', margin: '4px 0 6px 0' }}>
                  Impressum &amp; Regulatory Contacts
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                  Statutory corporate transparency, provider disclosure, and supervisory authority details
                </span>
              </div>

              <div style={{ border: '2px solid #111111', borderRadius: '10px', padding: '16px', background: '#f8fafc', boxShadow: '2px 2px 0 #111111' }}>
                <strong style={{ color: '#111111', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>
                  Service Provider Information
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '0.825rem' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Platform Name:</span>
                    <strong style={{ color: '#111' }}>DropBrief Platform</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Official Web URL:</span>
                    <a href="https://usedropbrief.xyz" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                      https://usedropbrief.xyz
                    </a>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Cloud Infrastructure:</span>
                    <span style={{ color: '#111' }}>Ireland EU (AWS Dublin eu-west-1)</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Applicable Jurisdiction:</span>
                    <span style={{ color: '#111' }}>Slovak Republic &amp; European Union</span>
                  </div>
                </div>
              </div>

              <div>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.9rem', marginBottom: '8px' }}>
                  Designated Communication Channels
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#ffffff' }}>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Data Protection &amp; GDPR DPO:</span>
                    <a href="mailto:privacy@usedropbrief.xyz" style={{ color: '#111111', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginTop: '2px' }}>
                      privacy@usedropbrief.xyz
                    </a>
                  </div>

                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#ffffff' }}>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Legal &amp; Contracts (TOS/DPA):</span>
                    <a href="mailto:legal@usedropbrief.xyz" style={{ color: '#111111', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginTop: '2px' }}>
                      legal@usedropbrief.xyz
                    </a>
                  </div>

                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#ffffff' }}>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Abuse &amp; DSA Notice-and-Action:</span>
                    <a href="mailto:abuse@usedropbrief.xyz" style={{ color: '#111111', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginTop: '2px' }}>
                      abuse@usedropbrief.xyz
                    </a>
                  </div>

                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#ffffff' }}>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>Customer &amp; Technical Support:</span>
                    <a href="mailto:support@usedropbrief.xyz" style={{ color: '#111111', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginTop: '2px' }}>
                      support@usedropbrief.xyz
                    </a>
                  </div>
                </div>
              </div>

              <div style={{ borderLeft: '3px solid #111111', paddingLeft: '14px' }}>
                <strong style={{ color: '#111111', display: 'block', fontSize: '0.88rem' }}>
                  Supervisory Authority (DPA)
                </strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Competent Lead Data Protection Authority: <strong>Úrad na ochranu osobných údajov Slovenskej republiky</strong> (Office for Personal Data Protection of the Slovak Republic), Hraničná 12, 820 07 Bratislava 27, Slovak Republic (<a href="https://dataprotection.gov.sk" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>dataprotection.gov.sk</a>).
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{ 
          padding: '14px 24px', 
          borderTop: '2px solid #111111', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'var(--bg-base, #f8fafc)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#64748b' }}>
            <span className="status-dot status-dot-live" aria-hidden="true"></span>
            <span>All European data policies active &bull; Revision: Nov 2026</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              type="button"
              onClick={() => {
                const currentIndex = tabs.findIndex(t => t.id === currentTab);
                const nextIndex = (currentIndex + 1) % tabs.length;
                setLegalModalTab(tabs[nextIndex].id);
              }}
              className="btn btn-secondary btn-sm"
              style={{ border: '2px solid #111', borderRadius: '8px', fontWeight: 700, fontSize: '0.78rem' }}
            >
              <span>Next Document →</span>
            </button>

            <button 
              id="btn-close-legal-footer"
              onClick={() => setIsLegalModalOpen(false)} 
              className="btn btn-primary btn-sm"
              style={{ 
                border: '2px solid #111', 
                borderRadius: '8px', 
                fontWeight: 800, 
                fontSize: '0.78rem',
                background: '#FFE500',
                color: '#111111',
                boxShadow: '2px 2px 0 #111'
              }}
            >
              Understood, close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
