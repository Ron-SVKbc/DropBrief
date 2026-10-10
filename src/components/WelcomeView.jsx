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
  const { openAuthModal, loginAsDemo, addToast } = useApp();
  const [copiedDemoLink, setCopiedDemoLink] = useState(false);

  const handleCopyDemoLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText('https://usedropbrief.xyz/?p=restauracia-alfa');
    setCopiedDemoLink(true);
    addToast('Ukážkový odkaz pre klienta skopírovaný!', 'success', 'Demo odkaz');
    setTimeout(() => setCopiedDemoLink(false), 2000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ padding: '80px 20px 56px', textAlign: 'center', position: 'relative' }}>
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
              <span className="status-dot status-dot-live" />
              <Sparkles size={13} color="#a5b4fc" />
              <span>Micro-SaaS pre freelancerov a digitálne agentúry</span>
              <span className="badge badge-accent" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>ZADARMO</span>
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
            Zbierajte podklady od klientov{' '}
            <span style={{
              background: 'var(--gradient-brand)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 12px rgba(99, 102, 241, 0.3))'
            }}>
              bez hesiel a chaosu
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
            Žiadne nekonečné dopisovanie cez WhatsApp a stratené prílohy. Vytvorte si bezplatný účet za 5 sekúnd a pošlite klientovi priamy odkaz na bleskové nahrávanie.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '36px'
          }}>
            <button
              id="hero-btn-register"
              onClick={() => openAuthModal('register')}
              className="btn btn-primary btn-lg btn-pill"
              style={{ boxShadow: 'var(--glow-accent)', fontSize: '0.975rem', padding: '13px 28px' }}
            >
              <UserPlus size={18} />
              Vytvoriť bezplatný účet
              <ArrowRight size={16} />
            </button>

            <button
              id="hero-btn-login"
              onClick={() => openAuthModal('login')}
              className="btn btn-secondary btn-lg btn-pill"
              style={{ fontSize: '0.95rem', padding: '13px 24px' }}
            >
              <KeyRound size={17} />
              Prihlásiť sa cez PIN
            </button>

            <button
              id="hero-btn-demo"
              onClick={loginAsDemo}
              className="btn btn-secondary btn-lg btn-pill"
              style={{
                fontSize: '0.9rem',
                padding: '13px 20px',
                borderColor: 'var(--border-accent)',
                color: '#a5b4fc',
                background: 'rgba(99, 102, 241, 0.07)'
              }}
              title="Vstúpiť do predpripraveného demo účtu s reálnymi dátami"
            >
              <Sparkles size={15} color="var(--accent-primary)" />
              Demo účet (Marko)
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
              'Registrácia za 5 sekúnd bez hesla',
              'Klient nahráva bez prihlasovania',
              '100 % GDPR v súlade (EÚ)'
            ].map((text, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <CheckCircle2 size={15} color="var(--success)" />
                {text}
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* ── LIVE PRODUCT PREVIEW ──────────────────────────────── */}
      <section style={{ padding: '0 20px 64px' }}>
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
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span style={{ marginLeft: '10px', fontSize: '0.78rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  usedropbrief.xyz/?p=restauracia-alfa
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-accent" style={{ fontSize: '0.68rem' }}>
                  <Sparkles size={10} /> Živý náhľad portálu
                </span>
                <button
                  type="button"
                  onClick={handleCopyDemoLink}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                >
                  {copiedDemoLink ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                  {copiedDemoLink ? 'Skopírované!' : 'Kopírovať odkaz'}
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
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem', marginBottom: '7px' }}>Čaká sa na klienta</span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    Tvorba webu – Reštaurácia Alfa
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    Klient: <strong style={{ color: 'var(--text-secondary)' }}>Peter Kováč</strong> · Freelancer: <strong style={{ color: 'var(--text-secondary)' }}>Marko</strong>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Stav dodania:</span>
                    <strong style={{ color: 'var(--accent-primary)' }}>3 zo 4 (75 %)</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: '75%' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <div className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', pointerEvents: 'none' }}>
                    <Send size={12} color="var(--warning)" /> Odoslať pripomienku
                  </div>
                  <div className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', pointerEvents: 'none' }}>
                    <Upload size={12} /> Export JSON
                  </div>
                </div>
              </div>

              {/* Right — Items Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { icon: CheckCircle2, done: true, color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)',
                    title: 'Logo reštaurácie (SVG / PDF)', sub: '✓ logo_alfa_vector.svg · 1.4 MB', badge: 'Hotovo', badgeClass: 'badge-success' },
                  { icon: FileCheck2, done: true, color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)',
                    title: 'Fotografie interiéru a jedálneho lístka', sub: '✓ 8 fotografií · Originálna kvalita', badge: '8 fotiek', badgeClass: 'badge-success' },
                  { icon: CheckCircle2, done: true, color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)',
                    title: 'Text "Náš príbeh a filozofia"', sub: '✓ Text zadaný klientom priamo v prehliadači', badge: 'Zadané', badgeClass: 'badge-success' },
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
                      <Icon size={16} color={color} style={{ flexShrink: 0 }} />
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
                  <Upload size={18} color="var(--accent-primary)" style={{ margin: '0 auto 4px' }} />
                  <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block' }}>
                    Nápojový lístok a cenník (PDF)
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    Klient potiahne sem · Žiadne prihlasovanie
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
            <span className="badge badge-accent" style={{ marginBottom: '12px' }}>Prečo DropBrief?</span>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Prestaňte sa topiť v chaose podkladov
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: '8px' }}>
              Pozrite sa na rozdiel medzi tradičnou komunikáciou a moderným workflow.
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
                <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                  <XCircle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fca5a5', letterSpacing: '-0.02em' }}>
                    Tradičný zber (WhatsApp, Email)
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Neefektívne a zdĺhavé</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {[
                  'Fotky poslané cez WhatsApp sú zmenšené a strácajú kvalitu.',
                  'Odkazy z Úschovne po 7 dňoch expirujú — musíte pýtať znova.',
                  'Klient zabúda heslo do Google Drive a odkladá na "zajtra".',
                  'Trávite hodiny písaním trápnych pripomienok.'
                ].map((text, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                    <AlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
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
                <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--success-bg)', color: 'var(--success)' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#86efac', letterSpacing: '-0.02em' }}>
                    S DropBrief (Zero-Friction)
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Rýchle, bezpečné, profesionálne</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                {[
                  { strong: '1 stály odkaz:', rest: 'Klient klikne a okamžite nahráva bez prihlasovania.' },
                  { strong: 'Nekomprimované originály:', rest: 'Súbory zostávajú v 100 % rozlíšení v cloude.' },
                  { strong: 'Živé náhľady fotiek:', rest: 'Okamžitá kontrola dodaných obrázkov v prehliadači.' },
                  { strong: 'Automatické pripomienky:', rest: 'Systém zdvorilo dohliada na termíny za vás.' }
                ].map(({ strong, rest }, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                    <Check size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
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
            <span className="badge badge-accent" style={{ marginBottom: '12px' }}>Jednoduchý proces</span>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Ako to funguje v 3 krokoch
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '20px' }}>
            {[
              { num: '01', icon: Layers, color: 'var(--accent-primary)', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.22)', glow: '0 0 14px rgba(99,102,241,0.28)',
                title: '1. Zákazku z šablóny', body: 'Vyberiete odvetvie (Webdizajn, Branding, Účtovníctvo, Social Media) alebo pridáte vlastné položky. Nastavenie trvá pod 30 sekúnd.' },
              { num: '02', icon: Send, color: 'var(--warning)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.22)', glow: '0 0 14px rgba(245,158,11,0.28)',
                title: '2. Pošlete odkaz klientovi', body: 'Pošlite odkaz cez WhatsApp, Slack alebo e-mail. Klient klikne a okamžite vidí zoznam bez nutnosti vytvárať heslo.' },
              { num: '03', icon: CheckCircle2, color: 'var(--success)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.22)', glow: '0 0 14px rgba(16,185,129,0.28)',
                title: '3. Sledujete a exportujete', body: 'Pri každom nahratí vidíte zelený progress bar. Po dokončení si stiahnete všetky podklady a môžete pracovať.' }
            ].map(({ num, icon: Icon, color, bg, border, glow, title, body }) => (
              <div key={num} className="glass-card glass-card-interactive" style={{ padding: '26px', position: 'relative' }}>
                <div style={{
                  position: 'absolute', top: '16px', right: '20px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.2rem', fontWeight: 800,
                  color: 'rgba(255, 255, 255, 0.04)',
                  userSelect: 'none', letterSpacing: '-0.04em'
                }}>{num}</div>
                <div style={{
                  width: '44px', height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: bg, color,
                  border: `1px solid ${border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '18px',
                  boxShadow: glow
                }}>
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
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.38) 0%, transparent 70%)',
              pointerEvents: 'none', filter: 'blur(32px)'
            }} />

            <span className="badge badge-accent" style={{ marginBottom: '18px' }}>Začnite okamžite</span>

            <h3 style={{ fontSize: 'clamp(1.7rem, 3.5vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.035em', marginBottom: '12px', lineHeight: 1.15 }}>
              Ušetrite hodiny zbytočného<br />naháňania klientov
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem', maxWidth: '520px', margin: '0 auto 28px', lineHeight: 1.65 }}>
              Zaregistrujte si profil za 5 sekúnd. Získate vlastný PIN kód a neobmedzený zber podkladov navždy zadarmo.
            </p>

            <button
              onClick={() => openAuthModal('register')}
              className="btn btn-primary btn-lg btn-pill"
              style={{ margin: '0 auto', boxShadow: 'var(--glow-accent)', padding: '14px 34px', fontSize: '1rem' }}
            >
              <UserPlus size={19} />
              Založiť bezplatný účet s PIN kódom
            </button>

          </div>
        </div>
      </section>

    </div>
  );
}
