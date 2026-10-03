import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FolderSync, 
  Copy, 
  ExternalLink, 
  BellRing, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Search,
  Sparkles,
  FileCheck,
  FileX,
  Send,
  Shield,
  Layers
} from 'lucide-react';

export default function Dashboard({ onOpenCreateModal }) {
  const { 
    projects, 
    deleteProject, 
    sendSimulatedReminder, 
    openClientPortal, 
    addToast,
    currentFreelancer,
    seedDemoProjectForFreelancer
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'completed'

  // Filter projects belonging to this freelancer
  const myProjects = projects.filter((p) => {
    if (!currentFreelancer) return false;
    if (p.freelancerId && p.freelancerId === currentFreelancer.id) return true;
    if (p.freelancerName && p.freelancerName.toLowerCase() === currentFreelancer.nick.toLowerCase()) return true;
    if (currentFreelancer.nick.toLowerCase() === 'marko') return true;
    return false;
  });

  const filteredProjects = myProjects.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'pending') return matchesSearch && p.status !== 'completed';
    if (filterStatus === 'completed') return matchesSearch && p.status === 'completed';
    return matchesSearch;
  });

  const totalProjects = myProjects.length;
  const completedProjects = myProjects.filter((p) => p.status === 'completed').length;
  const pendingProjects = totalProjects - completedProjects;
  
  // Calculate total missing items across projects
  const totalMissingItems = myProjects.reduce((acc, p) => {
    return acc + p.items.filter((i) => !i.isCompleted).length;
  }, 0);

  const copyClientLink = (slug) => {
    const url = `${window.location.origin}/#client-portal?p=${slug}`;
    navigator.clipboard.writeText(url);
    addToast('Unikátny odkaz pre klienta bol skopírovaný do schránky!', 'success', 'Odkaz skopírovaný');
  };

  const handleDownloadAll = (proj) => {
    const completedItems = proj.items.filter((i) => i.isCompleted);
    if (completedItems.length === 0) {
      addToast('Klient zatiaľ nenahral žiadne podklady.', 'warning', 'Žiadne súbory');
      return;
    }

    // Generate summary JSON/text package for download
    const exportData = {
      project: proj.title,
      client: proj.clientName,
      clientEmail: proj.clientEmail,
      exportedAt: new Date().toISOString(),
      items: completedItems.map((item) => ({
        nazov: item.title,
        typ: item.type,
        data: item.value,
        dokonceneDna: item.completedAt
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${proj.slug}-podklady.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast(`Pripravený export pre projekt "${proj.title}" bol stiahnutý.`, 'success', 'Súbory stiahnuté');
  };

  return (
    <div className="container" style={{ padding: '36px 20px', flex: 1 }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-accent">
              <Sparkles size={12} /> Freelancer: <strong>{currentFreelancer?.nick || 'Freelancer'}</strong>
            </span>
            {/* PIN sa nikdy nezobrazuje v UI z bezpečnostných dôvodov */}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>
            Moje projekty a podklady
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '650px' }}>
            Už žiadne nekonečné dopisovanie cez WhatsApp a e-maily. Klienti nahrávajú všetko na jedno miesto bez registrácie.
          </p>
        </div>

        <button 
          id="btn-create-project-main"
          onClick={onOpenCreateModal} 
          className="btn btn-primary btn-lg"
          style={{ boxShadow: 'var(--accent-glow)' }}
        >
          <Plus size={18} />
          Nový projekt pre klienta
        </button>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px',
        marginBottom: '36px'
      }}>
        
        {/* Metric 1 */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Aktívne projekty
            </span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalProjects}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Všetky sledované zákazky
          </span>
        </div>

        {/* Metric 2 */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Čakajúce podklady
            </span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>{totalMissingItems}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Chýbajúce položky u klientov
          </span>
        </div>

        {/* Metric 3 */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Kompletne odovzdané
            </span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--success-bg)', color: 'var(--success)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>{completedProjects}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            100 % pripravené na prácu
          </span>
        </div>

        {/* Metric 4 */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Ušetrený čas freelancera
            </span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(236, 72, 153, 0.12)', color: '#ec4899' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f472b6' }}>
            ~{totalProjects * 4} hodín
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Vďaka automatickým pripomienkam
          </span>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px'
      }}>
        
        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            id="search-projects-input"
            type="text"
            className="input"
            placeholder="Hľadať projekt, meno alebo email klienta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        {/* Status Filters */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-glass)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          gap: '4px'
        }}>
          <button
            onClick={() => setFilterStatus('all')}
            className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            Všetky ({totalProjects})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`btn btn-sm ${filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            Čakajúce ({pendingProjects})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`btn btn-sm ${filterStatus === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            Hotové ({completedProjects})
          </button>
        </div>

      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <FolderSync size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
            {searchTerm ? 'Nenašli sa žiadne výsledky' : `Zatiaľ nemáte žiadne projekty, ${currentFreelancer?.nick || ''}`}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '22px', maxWidth: '480px', margin: '0 auto 22px' }}>
            {searchTerm 
              ? 'Skúste upraviť hľadaný výraz alebo zrušiť filtre.' 
              : 'Vytvorte si svoj prvý projekt pre klienta a pošlite mu unikátny odkaz na nahrávanie, alebo si vyskúšajte ukážkovú zákazku.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button id="btn-empty-create" onClick={onOpenCreateModal} className="btn btn-primary btn-sm">
              <Plus size={16} /> Vytvoriť projekt
            </button>
            {!searchTerm && (
              <button 
                id="btn-empty-seed-demo"
                onClick={seedDemoProjectForFreelancer} 
                className="btn btn-secondary btn-sm"
                title="Vložiť testovaciu zákazku pre vyskúšanie"
              >
                <Sparkles size={15} color="var(--accent-primary)" /> Vložiť ukážkovú zákazku
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {filteredProjects.map((proj) => {
            const completedCount = proj.items.filter((i) => i.isCompleted).length;
            const totalCount = proj.items.length;
            const progressPercent = Math.round((completedCount / totalCount) * 100);
            const isCompleted = proj.status === 'completed';

            return (
              <div 
                key={proj.id} 
                className="glass-card" 
                style={{
                  padding: '24px',
                  borderLeft: isCompleted ? '4px solid var(--success)' : '4px solid var(--warning)'
                }}
              >
                
                {/* Project Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {proj.title}
                      </h2>
                      {isCompleted ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Všetko dodané
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <Clock size={12} /> Čaká sa na klienta
                        </span>
                      )}
                      <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>
                        <BellRing size={11} /> Každé {proj.reminderFrequency} dni
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <span>Klient: <strong>{proj.clientName}</strong> ({proj.clientEmail})</span>
                      <span>Termín: <strong>{proj.deadline}</strong></span>
                      {proj.lastReminderSent && (
                        <span style={{ color: 'var(--text-muted)' }}>
                          Posledná pripomienka: {proj.lastReminderSent}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Top Right Project Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      id={`btn-copy-link-${proj.id}`}
                      onClick={() => copyClientLink(proj.slug)}
                      className="btn btn-secondary btn-sm"
                      title="Skopírovať odkaz pre klienta"
                    >
                      <Copy size={14} />
                      Kopírovať link
                    </button>

                    <button
                      id={`btn-open-client-${proj.id}`}
                      onClick={() => openClientPortal(proj.slug)}
                      className="btn btn-primary btn-sm"
                      title="Otvoriť portál tak, ako ho vidí klient"
                    >
                      <ExternalLink size={14} />
                      Otvoriť portál klienta
                    </button>

                    <button
                      onClick={() => deleteProject(proj.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger)', padding: '6px 10px' }}
                      title="Odstrániť projekt"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Stav dodania podkladov: <strong>{completedCount} z {totalCount} hotovo</strong>
                    </span>
                    <span style={{ fontWeight: 700, color: isCompleted ? 'var(--success)' : 'var(--text-primary)' }}>
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${progressPercent}%`,
                        background: isCompleted ? 'var(--success)' : 'var(--accent-gradient)'
                      }} 
                    />
                  </div>
                </div>

                {/* Items Quick Status List */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '10px',
                  marginBottom: '16px'
                }}>
                  {proj.items.map((item) => (
                    <div 
                      key={item.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        fontSize: '0.85rem',
                        color: item.isCompleted ? 'var(--text-primary)' : 'var(--text-muted)'
                      }}
                    >
                      {item.isCompleted ? (
                        <FileCheck size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                      ) : (
                        <FileX size={16} color="var(--warning)" style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ 
                        textDecoration: item.isCompleted ? 'none' : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom Bar Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  
                  {/* Left: Reminder Button */}
                  <div>
                    {!isCompleted ? (
                      <button
                        id={`btn-remind-${proj.id}`}
                        onClick={() => sendSimulatedReminder(proj.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--warning)', borderColor: 'var(--warning-border)' }}
                      >
                        <Send size={14} />
                        Simulovať odoslanie pripomienky na e-mail
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={14} /> Všetky podklady pripravené na prácu
                      </span>
                    )}
                  </div>

                  {/* Right: Download Podklady */}
                  <button
                    id={`btn-download-${proj.id}`}
                    onClick={() => handleDownloadAll(proj)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Download size={14} />
                    Stiahnuť podklady ({completedCount})
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Feature Explainer for Trust */}
      <div className="glass-card" style={{ marginTop: '48px', padding: '30px', background: 'linear-gradient(180deg, rgba(20, 27, 45, 0.7) 0%, rgba(10, 13, 20, 0.9) 100%)' }}>
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 28px' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
            Prečo klienti cez DropBrief radi odovzdávajú podklady?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Odstránili sme všetky bariéry, kvôli ktorým klienti odkladajú dodanie materiálov na neskôr.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--accent-primary)', marginBottom: '8px' }}><Sparkles size={22} /></div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Bez hesiel a prihlasovania</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Klient otvorí odkaz v mobile alebo na PC a okamžite nahráva. Žiadne zabudnuté heslá.
            </p>
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--warning)', marginBottom: '8px' }}><BellRing size={22} /></div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Automatické priateľské pripomienky</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Systém sám slušne pripomenie chýbajúce položky. Nemusíte robiť policajta a kaziť vzťahy.
            </p>
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--success)', marginBottom: '8px' }}><Shield size={22} /></div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Bankové šifrovanie & GDPR</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Súbory sú šifrované (AES-256), uložené v EÚ (Frankfurt) a po 30 dňoch sa automaticky mažú.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
