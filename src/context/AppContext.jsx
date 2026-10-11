import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_DEMO_PROJECTS } from '../data/templates';
import { supabase, isSupabaseConfigured, getCloudFreelancer, saveCloudFreelancer, verifyCloudPin, hashPin } from '../lib/supabase';

const AppContext = createContext();

function mapDbToProject(proj) {
  const inferredType = proj.project_type || proj.projectType || (
    (proj.title && (
      proj.title.toLowerCase().includes('social') || 
      proj.title.toLowerCase().includes('monthly') || 
      proj.title.toLowerCase().includes('správa') || 
      proj.title.toLowerCase().includes('retainer')
    )) ? 'ongoing' : 'one-off'
  );

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
    projectType: inferredType,
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
  const [activeProjectSlug, setActiveProjectSlug] = useState('brand-identity');
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

  const addToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
      addToast('Failed to load projects from remote database.', 'warning', 'Connection Error');
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  // Fetch specific project by slug (ideal for client on remote device)
  // Uses functional setState to avoid stale closure on `projects`
  const fetchProjectBySlug = useCallback(async (slug) => {
    if (!slug) return null;

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

    // Return from local state via functional check
    return new Promise((resolve) => {
      setProjects((prev) => {
        const local = prev.find((p) => p.slug === slug);
        resolve(local || null);
        return prev; // no mutation
      });
    });
  }, []); // stable — no dependency on projects

  // Realtime synchronization on live connection
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    fetchSupabaseProjects();

    // Listen to database changes in real time (WebSockets)
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
    if (authModalMode === 'pin_reveal') {
      try {
        const saved = localStorage.getItem('dropbrief_freelancer_session');
        if (saved) {
          setCurrentFreelancer(JSON.parse(saved));
        }
      } catch (e) {}
    }
    setIsAuthModalOpen(false);
  };

  const registerFreelancer = async (nick, email = '') => {
    if (!nick || nick.trim().length < 2) {
      throw new Error('Name / Nickname must have at least 2 characters.');
    }
    const cleanNick = nick.trim();
    const cleanEmail = email ? email.trim() : '';

    // 1. Skontrolujeme v cloude, či nick už neexistuje
    if (isSupabaseConfigured) {
      try {
        const existing = await getCloudFreelancer(cleanNick);
        if (existing) {
          throw new Error('This nickname already exists. Choose a different name or log in.');
        }
      } catch (err) {
        if (err.message && err.message.includes('already exists')) {
          throw err;
        }
      }
    }

    // Vygenerujeme 6-miestny numerický PIN
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();

    let freelancerRecord = {
      id: 'fl-' + Date.now(),
      nick: cleanNick,
      pin: generatedPin,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
    };

    // 2. Uloženie do Supabase cloudu
    if (isSupabaseConfigured) {
      try {
        freelancerRecord = await saveCloudFreelancer(freelancerRecord);
      } catch (err) {
        console.warn('Freelancer cloud registration fallback:', err);
      }
    }

    // 3. Uloženie do lokálnej pamäte prehliadača (iba hash, nie plaintext)
    try {
      const pinHash = await hashPin(generatedPin);
      const localAccs = JSON.parse(localStorage.getItem('dropbrief_local_freelancers') || '[]');
      const filtered = localAccs.filter((a) => a.nick.toLowerCase() !== cleanNick.toLowerCase());
      filtered.push({ id: freelancerRecord.id, nick: freelancerRecord.nick, email: freelancerRecord.email, createdAt: freelancerRecord.createdAt, pinHash });
      localStorage.setItem('dropbrief_local_freelancers', JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to save to local accounts:', e);
    }

    // Session nikdy neukladá plaintext PIN
    const sessionRecord = { id: freelancerRecord.id, nick: freelancerRecord.nick, email: freelancerRecord.email, createdAt: freelancerRecord.createdAt };
    localStorage.setItem('dropbrief_freelancer_session', JSON.stringify(sessionRecord));
    
    // Nastavíme dáta pre PIN reveal obrazovku
    setAuthRegisteredData(freelancerRecord);
    setAuthModalMode('pin_reveal');

    addToast(`Account ${cleanNick} ready! Your PIN is ${generatedPin}`, 'success', 'Registration Successful');
    return freelancerRecord;
  };

  const loginFreelancer = async (nick, pin) => {
    if (!nick || !pin) {
      throw new Error('Please enter both your nickname and 6-digit PIN code.');
    }
    const cleanNick = nick.trim().toLowerCase();
    const cleanPin = pin.trim();

    // 🛡️ Brute-force ochrana - max 5 pokusov za 60 sekúnd
    const RATE_KEY = 'dropbrief_login_attempts';
    try {
      const rateData = JSON.parse(localStorage.getItem(RATE_KEY) || '{"count":0,"since":0}');
      const now = Date.now();
      if (now - rateData.since < 60_000) {
        if (rateData.count >= 5) {
          const waitSec = Math.ceil((60_000 - (now - rateData.since)) / 1000);
          throw new Error(`Too many failed attempts. Try again in ${waitSec} seconds.`);
        }
        rateData.count += 1;
      } else {
        rateData.count = 1;
        rateData.since = now;
      }
      localStorage.setItem(RATE_KEY, JSON.stringify(rateData));
    } catch (rateErr) {
      if (rateErr.message && rateErr.message.includes('Too many')) throw rateErr;
    }

    let matchedUser = null;

    // 1. Najprv overiť lokálne účty – bleskový login (0 ms) bez čakania na sieť
    try {
      const localAccs = JSON.parse(localStorage.getItem('dropbrief_local_freelancers') || '[]');
      const found = localAccs.find((a) => a.nick.toLowerCase() === cleanNick);
      if (found) {
        let isValid = false;
        if (found.pinHash) {
          isValid = (await hashPin(cleanPin, true)) === found.pinHash || (await hashPin(cleanPin, false)) === found.pinHash;
        } else if (found.pin) {
          isValid = String(found.pin).trim() === cleanPin;
        }
        if (isValid) {
          matchedUser = { id: found.id, nick: found.nick, email: found.email || '', createdAt: found.createdAt };
        } else {
          throw new Error('Incorrect 6-digit PIN code for this nickname.');
        }
      }
    } catch (e) {
      if (e.message && e.message.includes('Incorrect 6-digit PIN code')) throw e;
    }

    // 2. Ak sa nenašiel lokálne, overiť v Supabase cloude (podpora prihlásenia z iného zariadenia)
    if (!matchedUser && isSupabaseConfigured) {
      try {
        const cloudUser = await getCloudFreelancer(cleanNick);
        if (cloudUser) {
          const isValid = await verifyCloudPin(cleanPin, cloudUser);
          if (isValid) {
            matchedUser = {
              id: cloudUser.id,
              nick: cloudUser.nick,
              email: cloudUser.email || '',
              createdAt: cloudUser.createdAt,
            };
            // Uložíme do lokálnej pamäte pre budúce bleskové prihlásenia
            try {
              const localAccs = JSON.parse(localStorage.getItem('dropbrief_local_freelancers') || '[]');
              const filtered = localAccs.filter((a) => a.nick.toLowerCase() !== cleanNick);
              filtered.push({ id: matchedUser.id, nick: matchedUser.nick, email: matchedUser.email, createdAt: matchedUser.createdAt, pinHash: cloudUser.pinHash });
              localStorage.setItem('dropbrief_local_freelancers', JSON.stringify(filtered));
            } catch (e) {}
          } else {
            throw new Error('Incorrect 6-digit PIN code for this nickname.');
          }
        }
      } catch (err) {
        if (err.message && err.message.includes('Incorrect 6-digit PIN code')) throw err;
        console.warn('Cloud login check warning:', err);
      }
    }

    if (!matchedUser) {
      throw new Error(`Account with nickname "${nick.trim()}" was not found. Please verify the name or register a new account.`);
    }

    // Reset rate-limitera po úspešnom prihlásení
    try { localStorage.removeItem(RATE_KEY); } catch(e) {}

    // Uloženie session a aktivácia dashboardu
    localStorage.setItem('dropbrief_freelancer_session', JSON.stringify(matchedUser));
    setCurrentFreelancer(matchedUser);
    closeAuthModal();
    addToast(`Welcome back, ${matchedUser.nick}!`, 'success', 'Logged In');
    return matchedUser;
  };

  const loginAsDemo = async () => {
    const demoUser = {
      id: 'fl-demo-marko',
      nick: 'Marko',
      email: 'marko@dropbrief.xyz',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('dropbrief_freelancer_session', JSON.stringify(demoUser));
    setCurrentFreelancer(demoUser);
    closeAuthModal();
    addToast('Entered demo dashboard as Marko!', 'success', 'Demo Account');
    return demoUser;
  };

  const logoutFreelancer = () => {
    localStorage.removeItem('dropbrief_freelancer_session');
    setCurrentFreelancer(null);
    setCurrentView('dashboard');
    addToast('You have been successfully logged out from the dashboard.', 'info', 'Logged Out');
  };

  const seedDemoProjectForFreelancer = async () => {
    if (!currentFreelancer) return;
    return createProject({
      title: 'Website Build & Assets – Blue Cafe',
      clientName: 'Martin Vance',
      clientEmail: 'martin@bluecafe.com',
      deadline: '2026-10-30',
      reminderFrequency: 3,
      items: [
        { title: 'Vector logo (SVG or AI)', description: 'We need the logo with a transparent background', type: 'file', required: true },
        { title: 'Story about the cafe and menu highlights', description: 'Short story of the cafe and signature items', type: 'text', required: true },
        { title: 'Photos of the interior and specialty coffee (5-10)', description: 'High-res photos for the website hero', type: 'file', required: true },
      ]
    });
  };

  const createProject = async (newProjData) => {
    const randomSlug =
      (newProjData.clientName || 'client')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-') +
      '-' +
      Math.random().toString(36).substring(2, 6);

    const tempId = 'proj-' + Date.now();
    const flId = currentFreelancer ? currentFreelancer.id : null;
    const flName = currentFreelancer ? currentFreelancer.nick : (newProjData.freelancerName || 'Freelancer');
    const flEmail = currentFreelancer?.email || newProjData.freelancerEmail || '';

    const projectType = newProjData.projectType || 'one-off';

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
      projectType,
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

    // Optimistic UI update
    setProjects((prev) => [newProject, ...prev]);

    // Save to Supabase (if configured)
    if (isSupabaseConfigured && supabase) {
      try {
        let insertPayload = {
          slug: randomSlug,
          title: newProjData.title,
          client_name: newProjData.clientName,
          client_email: newProjData.clientEmail,
          freelancer_name: flName,
          freelancer_email: flEmail,
          deadline: newProjData.deadline || '',
          reminder_frequency: Number(newProjData.reminderFrequency) || 3,
          status: 'pending',
          project_type: projectType,
        };

        let { data: insertedProj, error: pErr } = await supabase
          .from('projects')
          .insert(insertPayload)
          .select()
          .single();

        // Fallback if remote DB doesn't have project_type column yet
        if (pErr && pErr.message && pErr.message.toLowerCase().includes('project_type')) {
          delete insertPayload.project_type;
          const retryRes = await supabase
            .from('projects')
            .insert(insertPayload)
            .select()
            .single();
          insertedProj = retryRes.data;
          pErr = retryRes.error;
        }

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
        addToast('Project was created locally, cloud sync failed.', 'warning', 'Warning');
        return newProject;
      }
    }

    addToast('New project created successfully!', 'success', 'Project Ready');
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

    addToast('Project deleted from system.', 'info', 'Project Removed');
  };

  const updateItemValue = async (projectSlug, itemId, value, isCompleted = true) => {
    // Optimistic update in local state
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

    // Sync to Supabase
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

  const openReminderModal = (projectId) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    setPreviewEmailProject(proj);
  };

  const sendActualReminder = async (projectId, options = {}) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found.');

    const missingItems = proj.items.filter((i) => !i.isCompleted);
    const today = new Date().toISOString().split('T')[0];

    const origin = window.location.origin;
    const baseUrl = origin.includes('localhost') || origin.includes('127.0.0.1')
      ? 'https://usedropbrief.xyz'
      : origin;

    const payload = {
      projectId: proj.id,
      projectTitle: proj.title,
      clientName: proj.clientName,
      clientEmail: proj.clientEmail,
      freelancerName: proj.freelancerName || currentFreelancer?.nick || 'Freelancer',
      freelancerEmail: proj.freelancerEmail || currentFreelancer?.email || '',
      portalUrl: `${baseUrl}/?p=${proj.slug}`,
      deadline: proj.deadline || '',
      missingItems: missingItems.map((i) => ({ title: i.title, description: i.description })),
      customMessage: options.customMessage || '',
      customSubject: options.customSubject || '',
      emailStyle: options.emailStyle || 'personal',
    };

    const response = await fetch('/api/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok || !resData.success) {
      const errMsg = resData.error || `Error sending email (${response.status})`;
      throw new Error(errMsg);
    }

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
      `Reminder was successfully sent to ${proj.clientEmail}!`,
      'success',
      'Email Sent'
    );

    return resData;
  };

  const sendSimulatedReminder = async (projectId) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
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
        sendActualReminder,
        openReminderModal,
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
