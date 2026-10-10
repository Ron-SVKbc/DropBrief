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
  Layers,
  Calendar,
  User,
  Zap,
  Check,
  X
} from 'lucide-react';

export default function Dashboard({ onOpenCreateModal }) {
  const { 
    projects, 
    deleteProject, 
    sendSimulatedReminder, 
    openReminderModal,
    openClientPortal, 
    addToast,
    currentFreelancer,
    seedDemoProjectForFreelancer
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'completed'
  const [copiedSlug, setCopiedSlug] = useState(null);

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
    const origin = window.location.origin;
    const baseUrl = origin.includes('localhost') || origin.includes('127.0.0.1')
      ? 'https://usedropbrief.xyz'
      : origin;
    const url = `${baseUrl}/?p=${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    addToast('Unikátny odkaz pre klienta bol skopírovaný do schránky!', 'success', 'Odkaz skopírovaný');
    setTimeout(() => setCopiedSlug(null), 2500);
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
      items: completedItems.map((item) => {
        const fileList = Array.isArray(item.value?.files)
          ? item.value.files
          : (item.value?.fileName ? [item.value] : null);

        return {
          nazov: item.title,
          typ: item.type,
          pocetSuborov: fileList ? fileList.length : undefined,
          subory: fileList || item.value,
          dokonceneDna: item.completedAt
        };
      })
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
    <div className="container" style={{ padding: '36px 20px 60px', flex: 1 }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '36px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span className="badge badge-accent" style={{ padding: '4px 10px', gap: '6px' }}>
              <Sparkles size={12} />
              <span>Workspace: <strong>{currentFreelancer?.nick || 'Freelancer'}</strong></span>
            </span>
            <span className="badge badge-neutral" style={{ padding: '4px 8px' }}>
              Pro Dashboard
            </span>
          </div>

          <h1 style={{ 
            fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', 
            fontWeight: 800, 
            letterSpacing: '-0.03em', 
            marginBottom: '6px',
            color: 'var(--text-primary)'
          }}>
            Moje projekty a klientske podklady
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '680px', lineHeight: 1.5 }}>
            Prehľad aktívnych zberov. Klienti nahrávajú súbory priamo cez svoj odkaz a systém dohliada na termíny.
          </p>
        </div>

        <button 
          id="btn-create-project-main"
          onClick={onOpenCreateModal} 
          className="btn btn-primary btn-lg btn-pill"
          style={{ boxShadow: 'var(--accent-glow)' }}
        >
          <Plus size={18} />
          Nový projekt pre klienta
        </button>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '36px'
      }}>
        
        {/* Metric 1 */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Aktívne projekty
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(99, 102, 241, 0.25)'
            }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{totalProjects}</div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Všetky sledované zákazky
          </span>
        </div>

        {/* Metric 2 */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Čakajúce podklady
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--warning-border)'
            }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--warning)', letterSpacing: '-0.02em' }}>
            {totalMissingItems}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Chýbajúce položky u klientov
          </span>
        </div>

        {/* Metric 3 */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Kompletne odovzdané
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--success-border)'
            }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '-0.02em' }}>
            {completedProjects}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            100 % pripravené na prácu
          </span>
        </div>

        {/* Metric 4 */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Ušetrený čas
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(236, 72, 153, 0.12)',
              color: '#ec4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(236, 72, 153, 0.25)'
            }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f472b6', letterSpacing: '-0.02em' }}>
            ~{totalProjects * 4} hodín
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Automatické pripomienky (Resend)
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
        marginBottom: '24px'
      }}>
        
        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            id="search-projects-input"
            type="text"
            className="input"
            placeholder="Hľadať projekt, meno alebo email klienta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
          {searchTerm && (
            <button 
              type="button" 
              onClick={() => setSearchTerm('')} 
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '4px',
          gap: '4px'
        }}>
          <button
            onClick={() => setFilterStatus('all')}
            className={`btn btn-sm btn-pill ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', padding: '6px 14px' }}
          >
            Všetky ({totalProjects})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`btn btn-sm btn-pill ${filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', padding: '6px 14px' }}
          >
            Čakajúce ({pendingProjects})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`btn btn-sm btn-pill ${filterStatus === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', padding: '6px 14px' }}
          >
            Hotové ({completedProjects})
          </button>
        </div>

      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <FolderSync size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>
            {searchTerm ? 'Nenašli sa žiadne výsledky' : `Zatiaľ nemáte žiadne projekty, ${currentFreelancer?.nick || ''}`}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
            {searchTerm 
              ? 'Skúste upraviť hľadaný výraz alebo zrušiť filtre.' 
              : 'Vytvorte si svoj prvý projekt pre klienta a pošlite mu unikátny odkaz na nahrávanie, alebo si vložte ukážkovú testovaciu zákazku.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button id="btn-empty-create" onClick={onOpenCreateModal} className="btn btn-primary btn-sm btn-pill">
              <Plus size={16} /> Vytvoriť projekt
            </button>
            {!searchTerm && (
              <button 
                id="btn-empty-seed-demo"
                onClick={seedDemoProjectForFreelancer} 
                className="btn btn-secondary btn-sm btn-pill"
                title="Vložiť testovaciu zákazku pre vyskúšanie"
              >
                <Sparkles size={15} color="var(--accent-primary)" /> Vložiť ukážkovú zákazku
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {filteredProjects.map((proj) => {
            const completedCount = proj.items.filter((i) => i.isCompleted).length;
            const totalCount = proj.items.length;
            const progressPercent = Math.round((completedCount / totalCount) * 100);
            const isCompleted = proj.status === 'completed';
            const isLinkCopied = copiedSlug === proj.slug;

            return (
              <div 
                key={proj.id} 
                className="glass-card" 
                style={{
                  padding: '26px',
                  borderLeft: isCompleted ? '4px solid var(--success)' : '4px solid var(--warning)',
                  boxShadow: 'var(--shadow-md), var(--shadow-inner-glow)'
                }}
              >
                
                {/* Project Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '14px',
                  marginBottom: '18px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
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

                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} color="var(--text-muted)" />
                        Klient: <strong>{proj.clientName}</strong> ({proj.clientEmail})
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--text-muted)" />
                        Termín: <strong>{proj.deadline}</strong>
                      </span>
                      {proj.lastReminderSent && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          Posledná pripomienka: {proj.lastReminderSent}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Top Right Project Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      id={`btn-copy-link-${proj.id}`}
                      onClick={() => copyClientLink(proj.slug)}
                      className="btn btn-secondary btn-sm btn-pill"
                      title="Skopírovať odkaz pre klienta"
                    >
                      {isLinkCopied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                      {isLinkCopied ? 'Skopírované!' : 'Kopírovať link'}
                    </button>

                    <button
                      id={`btn-open-client-${proj.id}`}
                      onClick={() => openClientPortal(proj.slug)}
                      className="btn btn-primary btn-sm btn-pill"
                      title="Otvoriť portál tak, ako ho vidí klient"
                    >
                      <ExternalLink size={14} />
                      Otvoriť portál
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Naozaj chcete vymazať projekt "${proj.title}"?`)) {
                          deleteProject(proj.id);
                        }
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger)', padding: '6px 9px', borderRadius: 'var(--radius-full)' }}
                      title="Odstrániť projekt"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Stav dodania podkladov: <strong>{completedCount} z {totalCount} hotovo</strong>
                    </span>
                    <span style={{ fontWeight: 800, color: isCompleted ? 'var(--success)' : 'var(--accent-primary)' }}>
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: '8px' }}>
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
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '10px',
                  marginBottom: '18px'
                }}>
                  {proj.items.map((item) => {
                    const fileCount = Array.isArray(item.value?.files) 
                      ? item.value.files.length 
                      : (item.value?.fileName ? 1 : 0);

                    return (
                      <div 
                        key={item.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
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
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.title}
                          {fileCount > 1 && (
                            <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                              ({fileCount} súborov)
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Bar Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  
                  {/* Left: Reminder Button */}
                  <div>
                    {!isCompleted ? (
                      <button
                        id={`btn-remind-${proj.id}`}
                        onClick={() => openReminderModal(proj.id)}
                        className="btn btn-secondary btn-sm btn-pill"
                        style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.35)' }}
                        title="Otvoriť náhľad a odoslať pripomienku na e-mail klienta"
                      >
                        <Send size={14} />
                        {proj.lastReminderSent ? `Pripomenuté (${proj.lastReminderSent}) • Poslať znova` : 'Odoslať pripomienku cez Resend'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.825rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <CheckCircle2 size={15} /> Všetky podklady pripravené na prácu
                      </span>
                    )}
                  </div>

                  {/* Right: Download Podklady */}
                  <button
                    id={`btn-download-${proj.id}`}
                    onClick={() => handleDownloadAll(proj)}
                    className="btn btn-secondary btn-sm btn-pill"
                    style={{ fontSize: '0.825rem' }}
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
      <div className="glass-card" style={{
        marginTop: '50px',
        padding: '36px 30px',
        background: 'linear-gradient(180deg, rgba(16, 22, 38, 0.7) 0%, rgba(9, 13, 22, 0.95) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 30px' }}>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '8px' }}>
            Prečo klienti cez DropBrief radi odovzdávajú podklady?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Odstránili sme všetky prekážky a zložité registrácie, kvôli ktorým klienti odkladajú dodanie materiálov na neskôr.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          
          <div style={{
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <Sparkles size={20} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px' }}>Bez hesiel a prihlasovania</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Klient otvorí odkaz v mobile alebo na PC a okamžite nahráva. Žiadne zabudnuté heslá ani registrácie.
            </p>
          </div>

          <div style={{
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.12)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <BellRing size={20} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px' }}>Automatické pripomienky</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Systém sám slušne pripomenie chýbajúce položky cez transakčný e-mail (Resend). Nemusíte klientov naháňať osobne.
            </p>
          </div>

          <div style={{
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <Shield size={20} />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px' }}>Bankové šifrovanie & GDPR</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Súbory sú šifrované (AES-256), bezpečne uložené v EÚ (Frankfurt) a po 30 dňoch od dokončenia sa automaticky mažú.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
