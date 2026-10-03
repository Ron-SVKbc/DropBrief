import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_DEMO_PROJECTS } from '../data/templates';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AppContext = createContext();

function mapDbToProject(proj) {
  return {
    id: proj.id,
    slug: proj.slug,
    title: proj.title,
    clientName: proj.client_name,
    clientEmail: proj.client_email,
    freelancerId: proj.freelancer_id,
    freelancerName: proj.freelancer_name,
    freelancerEmail: proj.freelancer_email,
    deadline: proj.deadline || '',
    reminderFrequency: proj.reminder_frequency || 3,
    lastReminderSent: proj.last_reminder_sent,
    createdAt: proj.created_at ? proj.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    status: proj.status || 'pending',
    items: (proj.project_items || proj.items || [])
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        type: item.type || 'file',
        required: item.required !== false,
        isCompleted: Boolean(item.is_completed),
        completedAt: item.completed_at,
        value: item.value,
      })),
  };
}

export function AppProvider({ children }) {
  // Freelancer session state
  const [currentFreelancer, setCurrentFreelancer] = useState(() => {
    try {
      const saved = localStorage.getItem('dropbrief_freelancer_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to parse freelancer session:', e);
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register' | 'pin_reveal'
  const [authRegisteredData, setAuthRegisteredData] = useState(null); // { nick, pin, email }

  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('dropbrief_projects_v1');
      return saved ? JSON.parse(saved) : INITIAL_DEMO_PROJECTS;
    } catch (e) {
      console.error('Failed to parse localStorage:', e);
      return INITIAL_DEMO_PROJECTS;
    }
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [activeProjectSlug, setActiveProjectSlug] = useState('restauracia-alfa');
  const [toasts, setToasts] = useState([]);
  const [previewEmailProject, setPreviewEmailProject] = useState(null);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Sync to localStorage as backup/cache
  useEffect(() => {
    try {
      localStorage.setItem('dropbrief_projects_v1', JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [projects]);

  const addToast = (message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Načítanie projektov zo Supabase (ak je nakonfigurovaný)
  const fetchSupabaseProjects = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      setIsLoadingDb(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*, project_items(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = data.map(mapDbToProject);
        setProjects(mapped);
      }
    } catch (err) {
      console.error('Supabase fetch error:', err);
      addToast('Nepodarilo sa načítať projekty zo vzdialenej databázy.', 'warning', 'Chyba spojenia');
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  // Načítanie konkrétneho projektu podľa slugu (ideálne pre klienta na cudzom zariadení)
  const fetchProjectBySlug = useCallback(async (slug) => {
    if (!slug) return null;

    // Najprv skontrolujeme lokálny state
    const local = projects.find((p) => p.slug === slug);
    if (local && !isSupabaseConfigured) return local;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*, project_items(*)')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        if (data) {
          const mapped = mapDbToProject(data);
          setProjects((prev) => {
            const exists = prev.some((p) => p.slug === slug);
            if (exists) return prev.map((p) => (p.slug === slug ? mapped : p));
            return [mapped, ...prev];
          });
          return mapped;
        }
      } catch (err) {
        console.error('Failed to load project by slug:', err);
      }
    }

    return local || null;
  }, [projects]);

  // Realtime synchronizácia pri live pripojení
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    fetchSupabaseProjects();

    // Počúvanie zmien v databáze v reálnom čase (WebSockets)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchSupabaseProjects();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_items' }, () => {
        fetchSupabaseProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSupabaseProjects]);

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const registerFreelancer = async (nick, email = '') => {
    if (!nick || nick.trim().length < 2) {
      throw new Error('Meno / Nick musí mať aspoň 2 znaky.');
    }
    const cleanNick = nick.trim();
    const cleanEmail = email ? email.trim() : '';
    // Vygenerovanie 6-miestneho číselného PIN kódu
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();

    let freelancerRecord = {
      id: 'fl-' + Date.now(),
      nick: cleanNick,
      pin: generatedPin,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
    };

    // Zápis do Supabase (ak je nakonfigurovaný)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: existing } = await supabase
          .from('freelancers')
          .select('id')
          .ilike('nick', cleanNick)
          .maybeSingle();

        if (existing) {
          throw new Error('Tento nick už existuje. Zvoľte si iné meno alebo sa prihláste.');
        }

        const { data: inserted, error: insErr } = await supabase
          .from('freelancers')
          .insert({
            nick: cleanNick,
            pin_code: generatedPin,
            email: cleanEmail,
          })
          .select()
          .single();

        if (insErr) {
          console.error('Supabase freelancer insert error:', insErr);
        } else if (inserted) {
          freelancerRecord = {
            id: inserted.id,
            nick: inserted.nick,
            pin: inserted.pin_code,
            email: inserted.email || '',
            createdAt: inserted.created_at,
          };
        }
      } catch (err) {
        if (err.message && err.message.includes('Tento nick už existuje')) {
          throw err;
        }
        console.warn('Freelancer cloud registration fallback:', err);
      }
    }

    // Uloženie do lokálnej pamäte prehliadača
    try {
      const localAccs = JSON.parse(localStorage.getItem('dropbrief_local_freelancers') || '[]');
      localAccs.push(freelancerRecord);
      localStorage.setItem('dropbrief_local_freelancers', JSON.stringify(localAccs));
    } catch (e) {
      console.error('Failed to save to local accounts:', e);
    }

    localStorage.setItem('dropbrief_freelancer_session', JSON.stringify(freelancerRecord));
    setCurrentFreelancer(freelancerRecord);
    setAuthRegisteredData(freelancerRecord);
    setAuthModalMode('pin_reveal');

    addToast(`Účet ${cleanNick} pripravený! Váš PIN kód je ${generatedPin}`, 'success', 'Registrácia úspešná');
    return freelancerRecord;
  };

  const loginFreelancer = async (nick, pin) => {
    if (!nick || !pin) {
      throw new Error('Zadajte prosím nick aj 6-miestny PIN kód.');
    }
    const cleanNick = nick.trim().toLowerCase();
    const cleanPin = pin.trim();

    let matchedUser = null;

    // Kontrola v Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: user, error } = await supabase
          .from('freelancers')
          .select('*')
          .ilike('nick', cleanNick)
          .eq('pin_code', cleanPin)
          .maybeSingle();

        if (user) {
          matchedUser = {
            id: user.id,
            nick: user.nick,
            pin: user.pin_code,
            email: user.email || '',
            createdAt: user.created_at,
          };
        }
      } catch (err) {
        console.error('Supabase login check error:', err);
      }
    }

    // Demo účet alebo lokálna záloha
    if (!matchedUser) {
      if (cleanNick === 'marko' && cleanPin === '123456') {
        matchedUser = {
          id: 'demo-marko-1',
          nick: 'Marko',
          pin: '123456',
          email: 'marko@dropbrief.sk',
        };
      } else {
        try {
          const localAccs = JSON.parse(localStorage.getItem('dropbrief_local_freelancers') || '[]');
          const found = localAccs.find(
            (a) => a.nick.toLowerCase() === cleanNick && a.pin === cleanPin
          );
          if (found) matchedUser = found;
        } catch (e) {}
      }
    }

    if (!matchedUser) {
      throw new Error('Nesprávny nick alebo 6-miestny PIN kód.');
    }

    localStorage.setItem('dropbrief_freelancer_session', JSON.stringify(matchedUser));
    setCurrentFreelancer(matchedUser);
    closeAuthModal();
    addToast(`Vitajte späť, ${matchedUser.nick}!`, 'success', 'Prihlásený');
    return matchedUser;
  };

  const loginAsDemo = async () => {
    return loginFreelancer('Marko', '123456');
  };

  const logoutFreelancer = () => {
    localStorage.removeItem('dropbrief_freelancer_session');
    setCurrentFreelancer(null);
    setCurrentView('dashboard');
    addToast('Boli ste úspešne odhlásený z dashboardu.', 'info', 'Odhlásený');
  };

  const seedDemoProjectForFreelancer = async () => {
    if (!currentFreelancer) return;
    return createProject({
      title: 'Tvorba webu a podklady - Kaviareň Modrá',
      clientName: 'Martin Ševčík',
      clientEmail: 'martin@kaviaren-modra.sk',
      deadline: '2026-10-30',
      reminderFrequency: 3,
      items: [
        { title: 'Vektorové logo (SVG alebo AI)', description: 'Potrebujeme logo na priehľadnom pozadí', type: 'file', required: true },
        { title: 'Texty o kaviarni a ponuke', description: 'Krátky príbeh kaviarne a zoznam špecialít', type: 'text', required: true },
        { title: 'Fotografie interiéru a kávy (5-10 ks)', description: 'Vysoké rozlíšenie pre hlavičku webu', type: 'file', required: true },
      ]
    });
  };

  const createProject = async (newProjData) => {
    const randomSlug =
      (newProjData.clientName || 'klient')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-') +
      '-' +
      Math.random().toString(36).substring(2, 6);

    const tempId = 'proj-' + Date.now();
    const flId = currentFreelancer ? currentFreelancer.id : null;
    const flName = currentFreelancer ? currentFreelancer.nick : (newProjData.freelancerName || 'Freelancer');
    const flEmail = currentFreelancer?.email || newProjData.freelancerEmail || '';

    const newProject = {
      id: tempId,
      freelancerId: flId,
      slug: randomSlug,
      title: newProjData.title,
      clientName: newProjData.clientName,
      clientEmail: newProjData.clientEmail,
      freelancerName: flName,
      freelancerEmail: flEmail,
      deadline: newProjData.deadline || '2026-10-20',
      reminderFrequency: Number(newProjData.reminderFrequency) || 3,
      lastReminderSent: null,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'pending',
      items: newProjData.items.map((item, index) => ({
        id: 'item-' + (index + 1) + '-' + Date.now(),
        title: item.title,
        description: item.description || '',
        type: item.type || 'file',
        required: item.required !== false,
        isCompleted: false,
        value: null,
      })),
    };

    // Okamžitá optimistická aktualizácia UI
    setProjects((prev) => [newProject, ...prev]);

    // Uloženie do Supabase (ak je k dispozícii)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: insertedProj, error: pErr } = await supabase
          .from('projects')
          .insert({
            freelancer_id: flId,
            slug: randomSlug,
            title: newProjData.title,
            client_name: newProjData.clientName,
            client_email: newProjData.clientEmail,
            freelancer_name: flName,
            freelancer_email: flEmail,
            deadline: newProjData.deadline || '',
            reminder_frequency: Number(newProjData.reminderFrequency) || 3,
            status: 'pending',
          })
          .select()
          .single();

        if (pErr) throw pErr;

        if (insertedProj) {
          const itemsToInsert = newProjData.items.map((item, idx) => ({
            project_id: insertedProj.id,
            title: item.title,
            description: item.description || '',
            type: item.type || 'file',
            required: item.required !== false,
            is_completed: false,
            sort_order: idx,
            value: null,
          }));

          const { error: iErr } = await supabase.from('project_items').insert(itemsToInsert);
          if (iErr) throw iErr;

          fetchSupabaseProjects();
        }
      } catch (err) {
        console.error('Failed to create project in Supabase:', err);
        addToast('Projekt bol vytvorený lokálne, uloženie do cloudu zlyhalo.', 'warning', 'Upozornenie');
        return newProject;
      }
    }

    addToast('Nový projekt bol úspešne vytvorený!', 'success', 'Projekt pripravený');
    return newProject;
  };

  const deleteProject = async (projectId) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('projects').delete().eq('id', projectId);
      } catch (err) {
        console.error('Failed to delete project from Supabase:', err);
      }
    }

    addToast('Projekt bol vymazaný zo systému.', 'info', 'Projekt odstránený');
  };

  const updateItemValue = async (projectSlug, itemId, value, isCompleted = true) => {
    // Optimistická zmena v lokálnom stave
    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.slug !== projectSlug) return proj;

        const updatedItems = proj.items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            value: value,
            isCompleted: isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : null,
          };
        });

        const requiredCompleted = updatedItems
          .filter((i) => i.required)
          .every((i) => i.isCompleted);

        return {
          ...proj,
          items: updatedItems,
          status: requiredCompleted ? 'completed' : 'pending',
        };
      })
    );

    // Synchronizácia do Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('project_items')
          .update({
            value: value,
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
          })
          .eq('id', itemId);

        // Skontrolovať celkový stav projektu
        const currentProj = projects.find((p) => p.slug === projectSlug);
        if (currentProj) {
          const reqDone = currentProj.items
            .filter((i) => i.required)
            .every((i) => (i.id === itemId ? isCompleted : i.isCompleted));
          
          await supabase
            .from('projects')
            .update({ status: reqDone ? 'completed' : 'pending' })
            .eq('slug', projectSlug);
        }
      } catch (err) {
        console.error('Failed to update item in Supabase:', err);
      }
    }
  };

  const sendSimulatedReminder = async (projectId) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;

    const today = new Date().toISOString().split('T')[0];

    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, lastReminderSent: today } : p))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('projects')
          .update({ last_reminder_sent: today })
          .eq('id', projectId);
      } catch (err) {
        console.error('Failed to update reminder in Supabase:', err);
      }
    }

    addToast(
      `Automatická pripomienka odoslaná na ${proj.clientEmail}`,
      'success',
      'Pripomienka odoslaná'
    );
    setPreviewEmailProject(proj);
  };

  const openClientPortal = (slug) => {
    setActiveProjectSlug(slug);
    fetchProjectBySlug(slug);
    setCurrentView('client-portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDashboard = () => {
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        currentView,
        setCurrentView,
        activeProjectSlug,
        setActiveProjectSlug,
        createProject,
        deleteProject,
        updateItemValue,
        sendSimulatedReminder,
        openClientPortal,
        openDashboard,
        fetchProjectBySlug,
        toasts,
        addToast,
        removeToast,
        previewEmailProject,
        setPreviewEmailProject,
        isLegalModalOpen,
        setIsLegalModalOpen,
        isLiveDb: isSupabaseConfigured,
        isLoadingDb,
        // Freelancer Auth
        currentFreelancer,
        setCurrentFreelancer,
        isAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        authRegisteredData,
        openAuthModal,
        closeAuthModal,
        registerFreelancer,
        loginFreelancer,
        loginAsDemo,
        logoutFreelancer,
        seedDemoProjectForFreelancer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
