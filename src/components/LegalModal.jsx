import React from 'react';
import { useApp } from '../context/AppContext';
import { X, ShieldCheck, Lock, FileCheck, Server, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function LegalModal() {
  const { isLegalModalOpen, setIsLegalModalOpen } = useApp();

  if (!isLegalModalOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 120,
      padding: '20px'
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '700px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#090e1a',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 26px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(16, 185, 129, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Bezpečnosť dát, GDPR a Právna ochrana
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Ako DropBrief chráni používateľov a zabezpečuje dáta v EÚ
              </span>
            </div>
          </div>

          <button 
            id="btn-close-legal-modal"
            onClick={() => setIsLegalModalOpen(false)}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: 'var(--radius-full)', padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '26px', overflowY: 'auto', flex: 1, fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <strong style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.95rem' }}>
              <Lock size={17} /> 1. Šifrovanie dát a servery v Európe (GDPR)
            </strong>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
              Všetky prenosy sú šifrované moderným certifikátom TLS 1.3. Súbory sa ukladajú v certifikovanom dátovom centre vo Frankfurte (Nemecko) so štandardom AES-256 v pokoji. Žiadne dáta neopúšťajú územie Európskej únie.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '6px', fontSize: '0.95rem' }}>
              2. Rola Sprostredkovateľa (Data Processor)
            </strong>
            <p style={{ lineHeight: 1.55, fontSize: '0.85rem' }}>
              V zmysle Nariadenia GDPR vystupuje DropBrief výhradne ako <strong>Technický sprostredkovateľ</strong>. Prevádzkovateľom dát (Data Controller) je samotný zadávateľ (freelancer alebo agentúra), ktorý zodpovedá za oprávnenosť vyžiadania konkrétnych podkladov od svojich klientov.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '6px', fontSize: '0.95rem' }}>
              3. Automatické premazávanie (Auto-Purge po 30 dňoch)
            </strong>
            <p style={{ lineHeight: 1.55, fontSize: '0.85rem' }}>
              Na rozdiel od bežných cloudových úložísk, kde súbory zostávajú roky, DropBrief automaticky označí a po 30 dňoch od dokončenia zákazky trvalo odstráni všetky nahrané súbory. Tým sa minimalizuje akékoľvek riziko úniku archívnych dát.
            </p>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
            <strong style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.95rem' }}>
              <AlertTriangle size={17} /> 4. Vylúčenie zodpovednosti (Terms of Service)
            </strong>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Služba je poskytovaná na báze „tak, ako stojí a leží“ (as-is). Prevádzkovateľ nenesie zodpovednosť za obsah súborov nahrávaných klientmi, ani za prípadné straty dát spôsobené vyššou mocou alebo zásahom tretích strán. Používateľom je odporúčané po odovzdaní podklady stiahnuť do lokálneho archívu.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '18px 26px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(7, 9, 14, 0.95)' }}>
          <button onClick={() => setIsLegalModalOpen(false)} className="btn btn-primary btn-sm btn-pill">
            Rozumiem, zatvoriť
          </button>
        </div>

      </div>
    </div>
  );
}
