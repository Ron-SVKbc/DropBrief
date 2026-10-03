import React from 'react';
import { useApp } from '../context/AppContext';
import { X, ShieldCheck, Lock, FileCheck, Server, AlertTriangle } from 'lucide-react';

export default function LegalModal() {
  const { isLegalModalOpen, setIsLegalModalOpen } = useApp();

  if (!isLegalModalOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 120,
      padding: '20px'
    }}>
      <div 
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0d1322',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--success-bg)', color: 'var(--success)' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Bezpečnosť dát, GDPR a Právna ochrana
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Ako DropBrief chráni používateľov a prevádzkovateľa
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
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
            <strong style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Lock size={16} /> 1. Šifrovanie dát a servery v Európe (GDPR)
            </strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
              Všetky prenosy sú šifrované certifikátom TLS 1.3. Súbory sa ukladajú v dátovom centre vo Frankfurte (Nemecko) so štandardom AES-256 v pokoji. Žiadne dáta neodchádzajú mimo Európskej únie.
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              2. Rola Sprostredkovateľa (Data Processor)
            </strong>
            <p>
              V zmysle Nariadenia GDPR vystupuje prevádzkovateľ softvéru výhradne ako <strong>Technický sprostredkovateľ</strong>. Prevádzkovateľom dát (Data Controller) je samotný zadávateľ (freelancer alebo agentúra), ktorý zodpovedá za oprávnenosť vyžiadania konkrétnych podkladov od svojich klientov.
            </p>
          </div>

          <div>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              3. Automatické premazávanie (Auto-Purge do 30 dní)
            </strong>
            <p>
              Na rozdiel od bežných cloudových úložísk, kde súbory visia roky, DropBrief automaticky označí a po 30 dňoch od dokončenia zákazky trvalo odstráni všetky nahrané súbory. Tým sa minimalizuje akékoľvek riziko úniku archívnych dát.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <AlertTriangle size={16} color="var(--warning)" /> 4. Vylúčenie zodpovednosti (Terms of Service)
            </strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Služba je poskytovaná na báze „tak, ako stojí a leží“ (as-is). Prevádzkovateľ nenesie zodpovednosť za obsah súborov nahrávaných klientmi, ani za prípadné straty dát spôsobené vyššou mocou alebo zásahom tretích strán. Používateľom je odporúčané po odovzdaní podklady stiahnuť do lokálneho archívu.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setIsLegalModalOpen(false)} className="btn btn-primary btn-sm">
            Rozumiem, zatvoriť
          </button>
        </div>

      </div>
    </div>
  );
}
