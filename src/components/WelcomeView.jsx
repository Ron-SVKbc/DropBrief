import React from 'react';
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
  Lock
} from 'lucide-react';

export default function WelcomeView({ onOpenCreateModal }) {
  const { openAuthModal, loginAsDemo } = useApp();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      
      {/* HERO SECTION */}
      <section style={{
        padding: '70px 20px 60px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="container" style={{ maxWidth: '860px', margin: '0 auto' }}>
          
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span className="badge badge-accent" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              <Sparkles size={14} /> Micro-SaaS pre freelancerov a agentúry (0 € Stack)
            </span>
          </div>

          {/* Main Title */}
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '20px',
            color: 'var(--text-primary)'
          }}>
            Zbierajte podklady od klientov <br />
            <span style={{
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              bez hesiel, chaosu a zdržania
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto 36px'
          }}>
            Už žiadne nekonečné dopisovanie cez WhatsApp a stratené e-maily. Vytvorte si účet za 5 sekúnd s vlastným PIN kódom a pošlite klientovi priamy odkaz na nahrávanie.
          </p>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            marginBottom: '40px'
          }}>
            <button
              id="hero-btn-register"
              onClick={() => openAuthModal('register')}
              className="btn btn-primary btn-lg"
              style={{
                boxShadow: 'var(--accent-glow)',
                fontSize: '1rem',
                padding: '14px 28px'
              }}
            >
              <UserPlus size={19} />
              Vytvoriť bezplatný účet freelancera
            </button>

            <button
              id="hero-btn-login"
              onClick={() => openAuthModal('login')}
              className="btn btn-secondary btn-lg"
              style={{ fontSize: '1rem', padding: '14px 24px' }}
            >
              <KeyRound size={19} />
              Prihlásiť sa cez PIN
            </button>

            <button
              id="hero-btn-demo"
              onClick={loginAsDemo}
              className="btn btn-secondary btn-lg"
              style={{
                fontSize: '0.9rem',
                padding: '14px 20px',
                borderColor: 'var(--border-active)',
                color: 'var(--accent-primary)'
              }}
              title="Vstúpiť do predpripraveného demo účtu s dátami"
            >
              <Sparkles size={16} />
              Vyskúšať Demo Dashboard (Marko)
            </button>
          </div>

          {/* Trust Highlights */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--success)" /> Registrácia bez hesiel a emailov
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--success)" /> Klient nahráva bez prihlasovania
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--success)" /> 100 % v súlade s GDPR (EÚ servery)
            </span>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS (3 Simple Steps) */}
      <section style={{
        padding: '40px 20px 60px',
        background: 'rgba(255, 255, 255, 0.01)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 40px' }}>
            <span className="badge badge-accent" style={{ marginBottom: '8px' }}>
              Ako to funguje
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              Zber podkladov v troch jednoduchých krokoch
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            
            {/* Step 1 */}
            <div className="glass-card" style={{ padding: '28px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '2.4rem',
                fontWeight: 800,
                color: 'rgba(255, 255, 255, 0.05)'
              }}>
                01
              </div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Layers size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                1. Založíte účet a zákazku
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Zadáte svoj Nick, dostanete 6-miestny PIN a vyberiete šablónu podkladov (Web, Branding, Účtovníctvo alebo Sociálne siete).
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card" style={{ padding: '28px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '2.4rem',
                fontWeight: 800,
                color: 'rgba(255, 255, 255, 0.05)'
              }}>
                02
              </div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.12)',
                color: 'var(--warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Send size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                2. Pošlete unikátny link klientovi
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Systém vygeneruje priamy odkaz. Klientovi ho pošlete cez WhatsApp, e-mail alebo Slack. Žiadne heslá pre klienta.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card" style={{ padding: '28px', position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '2.4rem',
                fontWeight: 800,
                color: 'rgba(255, 255, 255, 0.05)'
              }}>
                03
              </div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Upload size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                3. Klient nahrá súbory a vy máte hotovo
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Klient odovzdá materiály priamo v prehliadači, vy sledujete progress bar v reálnom čase a na 1 klik stiahnete celý balíček.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '680px' }}>
          <div className="glass-card" style={{
            padding: '40px 30px',
            background: 'linear-gradient(180deg, rgba(30, 41, 69, 0.6) 0%, rgba(13, 19, 34, 0.85) 100%)',
            border: '1px solid var(--accent-primary)'
          }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '12px' }}>
              Pripravený ušetriť hodiny zbytočného naháňania klientov?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
              Zaregistrujte si svoj profil freelancera za 5 sekúnd. Získate vlastný číselný PIN kód a neobmedzený zber podkladov navždy zadarmo.
            </p>
            <button
              onClick={() => openAuthModal('register')}
              className="btn btn-primary btn-lg"
              style={{ margin: '0 auto', boxShadow: 'var(--accent-glow)' }}
            >
              <UserPlus size={18} />
              Založiť bezplatný účet s PIN kódom
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
