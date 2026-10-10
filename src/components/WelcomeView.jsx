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
  Cpu
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
      
      {/* HERO SECTION */}
      <section style={{
        padding: '76px 20px 60px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="container" style={{ maxWidth: '940px', margin: '0 auto' }}>
          
          {/* Animated Announcement Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#c7d2fe'
            }}>
              <span className="status-dot status-dot-live"></span>
              <Sparkles size={14} color="#a5b4fc" />
              <span>Micro-SaaS pre freelancerov a digitálne agentúry</span>
              <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
                0 € STACK
              </span>
            </div>
          </div>

          {/* Main Title with Gradient Glow */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)',
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: '-0.035em',
            marginBottom: '24px',
            color: 'var(--text-primary)'
          }}>
            Zbierajte podklady od klientov <br />
            <span style={{
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 14px rgba(99, 102, 241, 0.35))'
            }}>
              bez hesiel, chaosu a zdržania
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            maxWidth: '720px',
            margin: '0 auto 40px',
            fontWeight: 400
          }}>
            Už žiadne nekonečné dopisovanie cez WhatsApp a stratené prílohy v e-mailoch. Vytvorte si bezplatný účet za 5 sekúnd s PIN kódom a pošlite klientovi priamy odkaz na bleskové nahrávanie.
          </p>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            marginBottom: '42px'
          }}>
            <button
              id="hero-btn-register"
              onClick={() => openAuthModal('register')}
              className="btn btn-primary btn-lg btn-pill"
              style={{
                boxShadow: 'var(--accent-glow)',
                fontSize: '1rem',
                padding: '14px 30px'
              }}
            >
              <UserPlus size={19} />
              Vytvoriť bezplatný účet freelancera
            </button>

            <button
              id="hero-btn-login"
              onClick={() => openAuthModal('login')}
              className="btn btn-secondary btn-lg btn-pill"
              style={{ fontSize: '1rem', padding: '14px 26px' }}
            >
              <KeyRound size={18} />
              Prihlásiť sa cez PIN
            </button>

            <button
              id="hero-btn-demo"
              onClick={loginAsDemo}
              className="btn btn-secondary btn-lg btn-pill"
              style={{
                fontSize: '0.925rem',
                padding: '14px 22px',
                borderColor: 'var(--border-active)',
                color: '#a5b4fc',
                background: 'rgba(99, 102, 241, 0.08)'
              }}
              title="Vstúpiť do predpripraveného demo účtu s reálnymi dátami"
            >
              <Sparkles size={16} color="var(--accent-primary)" />
              Vyskúšať Demo účet (Marko)
            </button>
          </div>

          {/* Trust Highlights */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '28px',
            flexWrap: 'wrap',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--success)" /> Registrácia za 5 sekúnd bez hesla
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--success)" /> Klient nahráva bez prihlasovania
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--success)" /> 100 % GDPR v súlade (Frankfurt EÚ)
            </span>
          </div>

        </div>
      </section>

      {/* LIVE PRODUCT PREVIEW SHOWCASE */}
      <section style={{ padding: '0 20px 70px' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          
          <div className="glass-card" style={{
            padding: '24px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.85) 0%, rgba(9, 13, 22, 0.95) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(99, 102, 241, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {/* Top Showcase Window Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              marginBottom: '20px',
              borderBottom: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                <span style={{ marginLeft: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  usedropbrief.xyz/?p=restauracia-alfa
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-accent" style={{ fontSize: '0.72rem' }}>
                  <Sparkles size={11} /> Živý náhľad klientskeho portálu
                </span>
                <button
                  type="button"
                  onClick={handleCopyDemoLink}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  {copiedDemoLink ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                  {copiedDemoLink ? 'Skopírované!' : 'Kopírovať odkaz'}
                </button>
              </div>
            </div>

            {/* Showcase Internal Mockup */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px', alignItems: 'start' }}>
              
              {/* Left Column: Project Status Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <span className="badge badge-warning" style={{ fontSize: '0.68rem', marginBottom: '6px' }}>
                      Čaká sa na klienta
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Tvorba webu – Reštaurácia Alfa</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Klient: <strong>Peter Kováč</strong> &bull; Freelancer: <strong>Marko</strong>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Stav dodania podkladov:</span>
                    <strong style={{ color: 'var(--accent-primary)' }}>3 zo 4 hotovo (75 %)</strong>
                  </div>
                  <div className="progress-track" style={{ height: '8px' }}>
                    <div className="progress-fill" style={{ width: '75%' }}></div>
                  </div>
                </div>

                {/* Action buttons preview */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', pointerEvents: 'none' }}>
                    <Send size={13} color="var(--warning)" /> Odoslať pripomienku cez Resend
                  </div>
                  <div className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', pointerEvents: 'none' }}>
                    <Upload size={13} /> Stiahnuť balíček (JSON)
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Items List Mock */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* Item 1: Complete */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid var(--success-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block' }}>
                        Logo reštaurácie vo vektoroch (SVG / PDF)
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ✓ logo_alfa_vector.svg &bull; 1.4 MB uložené v cloude
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Hotovo</span>
                </div>

                {/* Item 2: Complete with multiple photos */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid var(--success-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileCheck2 size={18} color="var(--success)" style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block' }}>
                        Fotografie interiéru a jedálneho lístka
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ✓ 8 fotografií s náhľadom &bull; Originálna kvalita bez kompresie
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>8 fotiek</span>
                </div>

                {/* Item 3: Complete Text */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid var(--success-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block' }}>
                        Textová sekcia "Náš príbeh a filozofia"
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ✓ Text zadaný klientom priamo v prehliadači
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Zadané</span>
                </div>

                {/* Item 4: Pending Dropzone Mock */}
                <div style={{
                  background: 'rgba(99, 102, 241, 0.06)',
                  border: '1.5px dashed var(--accent-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  textAlign: 'center'
                }}>
                  <Upload size={20} color="var(--accent-primary)" style={{ margin: '0 auto 4px' }} />
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block' }}>
                    Nápojový lístok a cenník (PDF)
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Klient potiahne súbor sem (Drag & Drop) &bull; Žiadne prihlasovanie
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* WHY TRADITIONAL COLLECTION FAILS VS DROPBRIEF (Comparison) */}
      <section style={{
        padding: '50px 20px 70px',
        background: 'rgba(255, 255, 255, 0.015)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div className="container" style={{ maxWidth: '980px' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 44px' }}>
            <span className="badge badge-accent" style={{ marginBottom: '10px' }}>
              Prečo DropBrief?
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Prestaňte sa topiť v chaose podkladov
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '8px' }}>
              Pozrite sa na rozdiel medzi bežnou komunikáciou a moderným workflow.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* The Old Way */}
            <div className="glass-card" style={{
              padding: '28px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              background: 'rgba(239, 68, 68, 0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fca5a5' }}>
                    Tradičný zber (WhatsApp, Email, Drive)
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Neefektívne a zdĺhavé</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span>Fotky poslané cez WhatsApp sú zmenšené a strácajú kvalitu.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span>Odkazy z Úschovne alebo WeTransfer po 7 dňoch exppirujú a musíte pýtať znova.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span>Klient zabúda heslo do Google Drive / Dropboxu a odkladá dodanie na "zajtra".</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span>Trávite hodiny písaním trápnych pripomienok a cítite sa ako policajt.</span>
                </li>
              </ul>
            </div>

            {/* The DropBrief Way */}
            <div className="glass-card" style={{
              padding: '28px',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              background: 'rgba(16, 185, 129, 0.04)',
              boxShadow: '0 0 35px rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--success-bg)', color: 'var(--success)' }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#86efac' }}>
                    S DropBrief (Zero-Friction Portál)
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rýchle, bezpečné a profesionálne</span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Check size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span><strong>1 stály odkaz pre klienta:</strong> Klient klikne a okamžite nahráva bez prihlasovania.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Check size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span><strong>Nekomprimované originály:</strong> Súbory zostávajú v 100 % rozlíšení v cloude.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Check size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span><strong>Živé náhľady fotiek:</strong> Okamžitá kontrola dodaných obrázkov priamo v prehliadači.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Check size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span><strong>Automatické pripomienky cez Resend:</strong> Systém zdvorilo dohliada na termíny za vás.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* HOW IT WORKS (3 Simple Steps) */}
      <section style={{ padding: '60px 20px 80px' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px' }}>
            <span className="badge badge-accent" style={{ marginBottom: '10px' }}>
              Jednoduchý proces
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Ako to funguje v 3 krokoch
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            
            {/* Step 1 */}
            <div className="glass-card glass-card-interactive" style={{ padding: '30px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '18px',
                right: '22px',
                fontFamily: 'var(--font-mono)',
                fontSize: '2.6rem',
                fontWeight: 800,
                color: 'rgba(255, 255, 255, 0.05)',
                userSelect: 'none'
              }}>
                01
              </div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)'
              }}>
                <Layers size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
                1. Založíte zákazku z hotovej šablóny
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                Vyberiete odvetvie (Webdizajn, Branding, Účtovníctvo, Social Media) alebo pridáte vlastné položky. Nastavenie trvá pod 30 sekúnd.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card glass-card-interactive" style={{ padding: '30px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '18px',
                right: '22px',
                fontFamily: 'var(--font-mono)',
                fontSize: '2.6rem',
                fontWeight: 800,
                color: 'rgba(255, 255, 255, 0.05)',
                userSelect: 'none'
              }}>
                02
              </div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)'
              }}>
                <Send size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
                2. Pošlete klientovi odkaz na 1 klik
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                Pošlite odkaz cez WhatsApp, Slack alebo e-mail. Klient klikne a okamžite vidí zoznam bez nutnosti vytvárať heslo alebo účet.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card glass-card-interactive" style={{ padding: '30px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '18px',
                right: '22px',
                fontFamily: 'var(--font-mono)',
                fontSize: '2.6rem',
                fontWeight: 800,
                color: 'rgba(255, 255, 255, 0.05)',
                userSelect: 'none'
              }}>
                03
              </div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
              }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
                3. Sledujete postup a stiahnete export
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                Pri každom nahratí vidíte zelený progress bar. Po dokončení si na 1 klik stiahnete všetky podklady a môžete pracovať.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* BOTTOM CONVERSION CTA BANNER */}
      <section style={{ padding: '0 20px 80px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="glass-card" style={{
            padding: '50px 36px',
            background: 'linear-gradient(180deg, rgba(26, 36, 62, 0.7) 0%, rgba(11, 16, 28, 0.95) 100%)',
            border: '1px solid var(--accent-primary)',
            boxShadow: 'var(--accent-glow-lg)',
            borderRadius: 'var(--radius-xl)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            <div style={{
              position: 'absolute',
              top: '-80px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '400px',
              height: '160px',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(30px)'
            }}></div>

            <span className="badge badge-accent" style={{ marginBottom: '16px' }}>
              Začnite okamžite
            </span>

            <h3 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '14px' }}>
              Ušetrite hodiny zbytočného naháňania klientov
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '580px', margin: '0 auto 32px', lineHeight: 1.6 }}>
              Zaregistrujte si svoj profil freelancera za 5 sekúnd. Získate vlastný číselný PIN kód a neobmedzený zber podkladov navždy zadarmo.
            </p>

            <button
              onClick={() => openAuthModal('register')}
              className="btn btn-primary btn-lg btn-pill"
              style={{
                margin: '0 auto',
                boxShadow: 'var(--accent-glow)',
                padding: '16px 36px',
                fontSize: '1.05rem'
              }}
            >
              <UserPlus size={20} />
              Založiť bezplatný účet s PIN kódom
            </button>

          </div>
        </div>
      </section>

    </div>
  );
}
