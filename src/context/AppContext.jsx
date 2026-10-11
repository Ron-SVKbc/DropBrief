import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_DEMO_PROJECTS } from '../data/templates';
import { supabase, isSupabaseConfigured, getCloudFreelancer, saveCloudFreelancer, verifyCloudPin, hashPin } from '../lib/supabase';

const AppContext = createContext();

function getStoredProjectTypes() {
  try {
    return JSON.parse(localStorage.getItem('dropbrief_project_types_v1') || '{}');
  } catch (e) {
    return {};
  }
}

function setStoredProjectType(key, type) {
  if (!key || !type) return;
  try {
    const existing = getStoredProjectTypes();
    existing[key] = type;
    localStorage.setItem('dropbrief_project_types_v1', JSON.stringify(existing));
  } catch (e) {}
}

function mapDbToProject(proj) {
  const storedTypes = getStoredProjectTypes();
  const explicitType = proj.project_type || proj.projectType || storedTypes[proj.slug] || storedTypes[proj.id];

  const inferredType = explicitType || (
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
    cadenceDays: Number(proj.cadence_days || proj.cadenceDays) || (inferredType === 'ongoing' ? 1 : null),
    batches: Array.isArray(proj.batches) ? proj.batches : [],
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
      const savedUserStr = localStorage.getItem('dropbrief_freelancer_session');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      const userKey = savedUser?.nick ? `dropbrief_projects_${savedUser.nick.toLowerCase()}` : null;
      const saved = (userKey && localStorage.getItem(userKey)) || localStorage.getItem('dropbrief_projects_v1');
      const initial = saved ? JSON.parse(saved) : (savedUser ? [] : INITIAL_DEMO_PROJECTS);
      const storedTypes = getStoredProjectTypes();
      return initial.map((p) => {
        const explicit = p.projectType || p.project_type || storedTypes[p.slug] || storedTypes[p.id];
        const pType = explicit || (
          (p.title && (
            p.title.toLowerCase().includes('social') || 
            p.title.toLowerCase().includes('monthly') || 
            p.title.toLowerCase().includes('retainer')
          )) ? 'ongoing' : 'one-off'
        );
        return {
          ...p,
          projectType: pType,
          cadenceDays: Number(p.cadenceDays || p.cadence_days) || (pType === 'ongoing' ? 1 : null),
          batches: Array.isArray(p.batches) ? p.batches : []
        };
      });
    } catch (e) {
      console.error('Failed to parse localStorage:', e);
      return INITIAL_DEMO_PROJECTS;
    }
  });

  const [currentView, setCurrentView] = useState(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const querySlug = searchParams.get('p') || searchParams.get('project');
      if (querySlug) return 'client-portal';
      const hash = window.location.hash;
      if (hash.startsWith('#client-portal') || hash.startsWith('#p=')) return 'client-portal';
    } catch (e) {}
    return 'dashboard';
  });

  const [activeProjectSlug, setActiveProjectSlug] = useState(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const querySlug = searchParams.get('p') || searchParams.get('project');
      if (querySlug) return querySlug.trim();
      const hash = window.location.hash;
      if (hash.startsWith('#client-portal') || hash.startsWith('#p=')) {
        const queryString = hash.includes('?') ? hash.split('?')[1] : hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(queryString);
        const hashSlug = hashParams.get('p') || hashParams.get('project');
        if (hashSlug) return hashSlug.trim();
      }
    } catch (e) {}
    return 'demo-preview';
  });
  const [toasts, setToasts] = useState([]);
  const [previewEmailProject, setPreviewEmailProject] = useState(null);
  const [exportModalProject, setExportModalProject] = useState(null);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Sync to localStorage as backup/cache (scoped per freelancer)
  useEffect(() => {
    try {
      if (currentFreelancer?.nick) {
        const userKey = `dropbrief_projects_${currentFreelancer.nick.toLowerCase()}`;
        localStorage.setItem(userKey, JSON.stringify(projects));
      }
      localStorage.setItem('dropbrief_projects_v1', JSON.stringify(projects));
      // Also sync projectTypes registry
      const storedTypes = getStoredProjectTypes();
      projects.forEach((p) => {
        if (p.projectType) {
          storedTypes[p.slug] = p.projectType;
          storedTypes[p.id] = p.projectType;
        }
      });
      localStorage.setItem('dropbrief_project_types_v1', JSON.stringify(storedTypes));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [projects, currentFreelancer]);

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

  // Načítanie projektov zo Supabase (výhradne pre prihláseného freelancera)
  const fetchSupabaseProjects = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !currentFreelancer) return;

    try {
      setIsLoadingDb(true);
      const cleanNick = (currentFreelancer.nick || '').trim();
      const flId = currentFreelancer.id || '';
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(flId);

      let query = supabase
        .from('projects')
        .select('*, project_items(*)')
        .order('created_at', { ascending: false });

      if (isUuid) {
        query = query.or(`freelancer_id.eq.${flId},freelancer_name.ilike.${cleanNick}`);
      } else {
        query = query.ilike('freelancer_name', cleanNick);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setProjects((prev) => {
          const storedTypes = getStoredProjectTypes();
          const mappedRemote = data.map((d) => {
            const mapped = mapDbToProject(d);
            const prevProj = prev.find((p) => p.slug === d.slug || p.id === d.id);
            const preservedType = storedTypes[d.slug] || storedTypes[d.id] || prevProj?.projectType || mapped.projectType;
            if (preservedType) {
              mapped.projectType = preservedType;
            }
            if (prevProj?.cadenceDays) {
              mapped.cadenceDays = prevProj.cadenceDays;
            }
            if (prevProj?.batches && Array.isArray(prevProj.batches) && prevProj.batches.length > 0) {
              mapped.batches = prevProj.batches;
            }
            return mapped;
          });

          // Pre zabudovaný demo účet ('fl-demo-marko') zachovať v pamäti aj ukážkové demo projekty
          if (flId === 'fl-demo-marko' || cleanNick.toLowerCase() === 'marko') {
            const remoteSlugs = mappedRemote.map((rp) => rp.slug);
            const missingDemos = INITIAL_DEMO_PROJECTS.filter((dp) => !remoteSlugs.includes(dp.slug));
            return [...mappedRemote, ...missingDemos];
          }

          return mappedRemote;
        });
      }
    } catch (err) {
      console.error('Supabase fetch error:', err);
      addToast('Failed to load projects from remote database.', 'warning', 'Connection Error');
    } finally {
      setIsLoadingDb(false);
    }
  }, [currentFreelancer, addToast]);

  // Fetch specific project by slug (ideal for client on remote device)
  // Uses functional setState to avoid stale closure on `projects`
  const fetchProjectBySlug = useCallback(async (slug) => {
    if (!slug) return null;
    const cleanSlug = String(slug).trim();

    if (isSupabaseConfigured && supabase) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
        let query = supabase.from('projects').select('*, project_items(*)');
        if (isUuid) {
          query = query.or(`slug.ilike.${cleanSlug},id.eq.${cleanSlug}`);
        } else {
          query = query.ilike('slug', cleanSlug);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          console.warn('Supabase query error for slug:', cleanSlug, error);
        }

        if (data) {
          const mapped = mapDbToProject(data);
          const storedTypes = getStoredProjectTypes();
          if (storedTypes[cleanSlug]) {
            mapped.projectType = storedTypes[cleanSlug];
          }

          // Also check storage metadata if DB columns don't exist yet
          try {
            const { data: ptBlob } = await supabase.storage
              .from('client-uploads')
              .download(`_meta/pt_${cleanSlug}.json`);
            if (ptBlob) {
              const ptText = await ptBlob.text();
              const ptData = JSON.parse(ptText);
              if (ptData?.projectType) mapped.projectType = ptData.projectType;
              if (ptData?.cadenceDays) mapped.cadenceDays = ptData.cadenceDays;
            }
          } catch (e) {}

          try {
            const { data: bBlob } = await supabase.storage
              .from('client-uploads')
              .download(`_meta/batches_${cleanSlug}.json`);
            if (bBlob) {
              const bText = await bBlob.text();
              const bData = JSON.parse(bText);
              if (Array.isArray(bData) && bData.length > 0) mapped.batches = bData;
            }
          } catch (e) {}

          setProjects((prev) => {
            const exists = prev.some((p) => p.slug === data.slug || p.id === data.id);
            const prevProj = prev.find((p) => p.slug === data.slug || p.id === data.id);
            if (prevProj?.projectType) {
              mapped.projectType = prevProj.projectType;
            }
            if (prevProj?.cadenceDays) {
              mapped.cadenceDays = prevProj.cadenceDays;
            }
            if (prevProj?.batches && Array.isArray(prevProj.batches) && prevProj.batches.length > 0) {
              mapped.batches = prevProj.batches;
            }
            if (exists) return prev.map((p) => (p.slug === data.slug || p.id === data.id ? mapped : p));
            return [mapped, ...prev];
          });
          return mapped;
        }

        // Storage fallback if row is not in table directly
        try {
          const { data: storageBlob, error: sErr } = await supabase.storage
            .from('client-uploads')
            .download(`_meta/proj_${cleanSlug}.json`);
          if (!sErr && storageBlob) {
            const text = await storageBlob.text();
            const parsed = JSON.parse(text);
            if (parsed && parsed.slug) {
              setProjects((prev) => {
                const exists = prev.some((p) => p.slug === parsed.slug || p.id === parsed.id);
                if (exists) return prev.map((p) => (p.slug === parsed.slug || p.id === parsed.id ? parsed : p));
                return [parsed, ...prev];
              });
              return parsed;
            }
          }
        } catch (storageErr) {}
      } catch (err) {
        console.error('Failed to load project by slug:', err);
      }
    }

    // Return from local state via functional check
    return new Promise((resolve) => {
      setProjects((prev) => {
        const local = prev.find((p) => (p.slug && p.slug.toLowerCase() === cleanSlug.toLowerCase()) || p.id === cleanSlug);
        resolve(local || null);
        return prev; // no mutation
      });
    });
  }, []); // stable — no dependency on projects

  // Realtime synchronization on live connection (only when freelancer is logged in)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    if (!currentFreelancer) return;

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
  }, [fetchSupabaseProjects, currentFreelancer]);

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
    setActiveProjectSlug('demo-preview');
    setProjects(INITIAL_DEMO_PROJECTS);
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
    setStoredProjectType(randomSlug, projectType);
    setStoredProjectType(tempId, projectType);

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
      cadenceDays: projectType === 'ongoing' ? (Number(newProjData.cadenceDays) || 1) : null,
      batches: [],
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
        // Also save to Storage for cross-device persistence
        try {
          supabase.storage
            .from('client-uploads')
            .upload(`_meta/pt_${randomSlug}.json`, new Blob([JSON.stringify({ projectType, cadenceDays: newProject.cadenceDays })], { type: 'application/json' }), { upsert: true })
            .catch(() => {});
          supabase.storage
            .from('client-uploads')
            .upload(`_meta/proj_${randomSlug}.json`, new Blob([JSON.stringify(newProject)], { type: 'application/json' }), { upsert: true })
            .catch(() => {});
        } catch (e) {}

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
          cadence_days: newProject.cadenceDays,
          batches: [],
        };

        if (flId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(flId)) {
          insertPayload.freelancer_id = flId;
        }

        let { data: insertedProj, error: pErr } = await supabase
          .from('projects')
          .insert(insertPayload)
          .select()
          .single();

        // Fallback if remote DB doesn't have project_type, cadence_days, or batches columns yet
        if (pErr) {
          console.warn('Initial project insert in Supabase failed, trying standard schema fallback:', pErr.message);
          delete insertPayload.cadence_days;
          delete insertPayload.batches;
          delete insertPayload.project_type;
          delete insertPayload.freelancer_id;

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
          setStoredProjectType(insertedProj.id, projectType);
          setStoredProjectType(insertedProj.slug, projectType);

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

          // Update storage mirror with the generated Supabase project ID and item IDs
          try {
            const finalMetaProject = {
              ...newProject,
              id: insertedProj.id,
              items: newProject.items.map((it, idx) => ({
                ...it,
                id: (itemsToInsert[idx] && itemsToInsert[idx].id) || it.id
              }))
            };
            supabase.storage
              .from('client-uploads')
              .upload(`_meta/proj_${randomSlug}.json`, new Blob([JSON.stringify(finalMetaProject)], { type: 'application/json' }), { upsert: true })
              .catch(() => {});
          } catch (e) {}

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

  const updateProjectType = async (projectIdOrSlug, newType) => {
    if (!projectIdOrSlug || !newType) return;

    setStoredProjectType(projectIdOrSlug, newType);

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectIdOrSlug || p.slug === projectIdOrSlug) {
          setStoredProjectType(p.slug, newType);
          setStoredProjectType(p.id, newType);
          return { ...p, projectType: newType };
        }
        return p;
      })
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectIdOrSlug);
        let q = supabase.from('projects').update({ project_type: newType });
        if (isUuid) {
          q = q.eq('id', projectIdOrSlug);
        } else {
          q = q.ilike('slug', projectIdOrSlug);
        }
        await q;
      } catch (e) {}

      try {
        const target = projects.find((p) => p.id === projectIdOrSlug || p.slug === projectIdOrSlug);
        const targetSlug = target?.slug || projectIdOrSlug;
        await supabase.storage
          .from('client-uploads')
          .upload(`_meta/pt_${targetSlug}.json`, new Blob([JSON.stringify({ projectType: newType })], { type: 'application/json' }), { upsert: true });
      } catch (e) {}
    }

    addToast(`Project engagement set to ${newType === 'ongoing' ? 'Ongoing / Retainer' : 'One-off Project'}.`, 'success', 'Engagement Updated');
  };

  const toggleProjectType = (projectIdOrSlug) => {
    const target = projects.find((p) => p.id === projectIdOrSlug || p.slug === projectIdOrSlug);
    const current = target?.projectType || 'one-off';
    const nextType = current === 'ongoing' ? 'one-off' : 'ongoing';
    return updateProjectType(projectIdOrSlug, nextType);
  };

  const updateProjectCadence = async (projectIdOrSlug, newCadenceDays) => {
    const days = Math.max(1, Number(newCadenceDays) || 1);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectIdOrSlug || p.slug === projectIdOrSlug) {
          return { ...p, cadenceDays: days };
        }
        return p;
      })
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectIdOrSlug);
        let q = supabase.from('projects').update({ cadence_days: days });
        if (isUuid) {
          q = q.eq('id', projectIdOrSlug);
        } else {
          q = q.ilike('slug', projectIdOrSlug);
        }
        await q;
      } catch (e) {}

      try {
        const target = projects.find((p) => p.id === projectIdOrSlug || p.slug === projectIdOrSlug);
        const targetSlug = target?.slug || projectIdOrSlug;
        const currentMeta = { projectType: target?.projectType || 'ongoing', cadenceDays: days };
        await supabase.storage
          .from('client-uploads')
          .upload(`_meta/pt_${targetSlug}.json`, new Blob([JSON.stringify(currentMeta)], { type: 'application/json' }), { upsert: true });
      } catch (e) {}
    }

    addToast(`Collection frequency set to every ${days} ${days === 1 ? 'day (daily)' : 'days'}.`, 'success', 'Cadence Updated');
  };

  const submitOngoingBatch = async (projectSlug, batchData) => {
    if (!projectSlug || !batchData) return null;

    let targetProj = null;

    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.slug !== projectSlug && proj.id !== projectSlug) return proj;

        const existingBatches = Array.isArray(proj.batches) ? [...proj.batches] : [];
        const targetDate = batchData.date || new Date().toISOString().split('T')[0];
        const existingIndex = existingBatches.findIndex((b) => b.date === targetDate);

        const newBatch = {
          id: batchData.id || `batch-${targetDate}-${Date.now()}`,
          date: targetDate,
          submittedAt: batchData.submittedAt || new Date().toISOString(),
          status: 'completed',
          files: batchData.files || [],
          note: batchData.note || '',
          items: batchData.items || []
        };

        if (existingIndex >= 0) {
          existingBatches[existingIndex] = { ...existingBatches[existingIndex], ...newBatch };
        } else {
          existingBatches.unshift(newBatch);
        }

        targetProj = {
          ...proj,
          batches: existingBatches,
          status: 'completed'
        };

        return targetProj;
      })
    );

    // Sync to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const target = projects.find((p) => p.slug === projectSlug || p.id === projectSlug);
        const existingBatches = Array.isArray(target?.batches) ? [...target.batches] : [];
        const targetDate = batchData.date || new Date().toISOString().split('T')[0];
        const existingIndex = existingBatches.findIndex((b) => b.date === targetDate);

        const newBatch = {
          id: batchData.id || `batch-${targetDate}-${Date.now()}`,
          date: targetDate,
          submittedAt: batchData.submittedAt || new Date().toISOString(),
          status: 'completed',
          files: batchData.files || [],
          note: batchData.note || '',
          items: batchData.items || []
        };

        if (existingIndex >= 0) {
          existingBatches[existingIndex] = { ...existingBatches[existingIndex], ...newBatch };
        } else {
          existingBatches.unshift(newBatch);
        }

        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectSlug);
          let q = supabase.from('projects').update({ batches: existingBatches });
          if (isUuid) {
            q = q.eq('id', projectSlug);
          } else {
            q = q.ilike('slug', projectSlug);
          }
          await q;
        } catch (dbErr) {
          console.warn('DB update for batches:', dbErr);
        }

        try {
          await supabase.storage
            .from('client-uploads')
            .upload(
              `_meta/batches_${projectSlug}.json`,
              new Blob([JSON.stringify(existingBatches)], { type: 'application/json' }),
              { upsert: true }
            );
        } catch (stErr) {}
      } catch (err) {
        console.error('Failed to sync batch to Supabase:', err);
      }
    }

    addToast('Deliverables for today have been successfully submitted!', 'success', 'Batch Submitted');
    return targetProj;
  };

  const deleteProject = async (projectId) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase.from('projects').delete().eq('id', projectId);
        if (currentFreelancer?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentFreelancer.id)) {
          q = q.or(`freelancer_id.eq.${currentFreelancer.id},freelancer_name.ilike.${currentFreelancer.nick}`);
        } else if (currentFreelancer?.nick) {
          q = q.ilike('freelancer_name', currentFreelancer.nick);
        }
        await q;
      } catch (err) {
        console.error('Failed to delete project from Supabase:', err);
      }
    }

    addToast('Project deleted from system.', 'info', 'Project Removed');
  };

  const updateItemValue = async (projectSlug, itemId, value, isCompleted = true) => {
    const cleanSlug = String(projectSlug || '').trim();
    // Optimistic update in local state
    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.slug?.toLowerCase() !== cleanSlug.toLowerCase() && proj.id !== cleanSlug) return proj;

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

        const currentProj = projects.find((p) => p.slug?.toLowerCase() === cleanSlug.toLowerCase() || p.id === cleanSlug);
        if (currentProj) {
          const reqDone = currentProj.items
            .filter((i) => i.required)
            .every((i) => (i.id === itemId ? isCompleted : i.isCompleted));
          
          await supabase
            .from('projects')
            .update({ status: reqDone ? 'completed' : 'pending' })
            .ilike('slug', currentProj.slug);
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

  const openExportModal = (projectIdOrSlug) => {
    if (!projectIdOrSlug) return;
    const proj = typeof projectIdOrSlug === 'object'
      ? projectIdOrSlug
      : projects.find((p) => p.id === projectIdOrSlug || p.slug === projectIdOrSlug);
    if (proj) {
      setExportModalProject(proj);
    }
  };

  const closeExportModal = () => {
    setExportModalProject(null);
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

  const openProjectDetail = (slug) => {
    setActiveProjectSlug(slug);
    fetchProjectBySlug(slug);
    setCurrentView('project-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addItemToProject = async (projectIdOrSlug, newItemData) => {
    const targetProject = projects.find((p) => p.id === projectIdOrSlug || p.slug === projectIdOrSlug);
    if (!targetProject) throw new Error('Project not found');

    const tempItemId = 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newItem = {
      id: tempItemId,
      title: (newItemData.title || '').trim(),
      description: (newItemData.description || '').trim(),
      type: newItemData.type || 'file',
      required: newItemData.required !== false,
      isCompleted: false,
      completedAt: null,
      value: null,
    };

    // Optimistic UI update
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== targetProject.id && p.slug !== targetProject.slug) return p;
        const updatedItems = [...p.items, newItem];
        const reqDone = updatedItems.filter((i) => i.required).every((i) => i.isCompleted);
        return {
          ...p,
          items: updatedItems,
          status: reqDone ? 'completed' : 'pending',
        };
      })
    );

    // Save to Supabase (if configured)
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          project_id: targetProject.id,
          title: newItem.title,
          description: newItem.description,
          type: newItem.type,
          required: newItem.required,
          is_completed: false,
          sort_order: targetProject.items.length,
          value: null,
        };

        const { data, error } = await supabase.from('project_items').insert(payload).select().single();
        if (error) {
          console.error('Failed to add item to Supabase:', error);
        } else if (data) {
          setProjects((prev) =>
            prev.map((p) => {
              if (p.id !== targetProject.id && p.slug !== targetProject.slug) return p;
              return {
                ...p,
                items: p.items.map((i) => (i.id === tempItemId ? { ...i, id: data.id } : i)),
              };
            })
          );
        }

        const currentReqDone = [...targetProject.items, newItem].filter((i) => i.required).every((i) => i.isCompleted);
        await supabase
          .from('projects')
          .update({ status: currentReqDone ? 'completed' : 'pending' })
          .eq('id', targetProject.id);
      } catch (err) {
        console.error('Failed to sync added item with cloud:', err);
      }
    }

    addToast(`Item "${newItem.title}" added to checklist.`, 'success', 'Item Added');
    return newItem;
  };

  const updateItemInProject = async (projectIdOrSlug, itemId, updatedFields) => {
    const targetProject = projects.find((p) => p.id === projectIdOrSlug || p.slug === projectIdOrSlug);
    if (!targetProject) throw new Error('Project not found');

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== targetProject.id && p.slug !== targetProject.slug) return p;
        const updatedItems = p.items.map((i) => {
          if (i.id !== itemId) return i;
          return {
            ...i,
            title: updatedFields.title !== undefined ? updatedFields.title.trim() : i.title,
            description: updatedFields.description !== undefined ? updatedFields.description.trim() : i.description,
            type: updatedFields.type !== undefined ? updatedFields.type : i.type,
            required: updatedFields.required !== undefined ? updatedFields.required : i.required,
          };
        });
        const reqDone = updatedItems.filter((i) => i.required).every((i) => i.isCompleted);
        return {
          ...p,
          items: updatedItems,
          status: reqDone ? 'completed' : 'pending',
        };
      })
    );

    // Save to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload = {};
        if (updatedFields.title !== undefined) updatePayload.title = updatedFields.title.trim();
        if (updatedFields.description !== undefined) updatePayload.description = updatedFields.description.trim();
        if (updatedFields.type !== undefined) updatePayload.type = updatedFields.type;
        if (updatedFields.required !== undefined) updatePayload.required = updatedFields.required;

        await supabase.from('project_items').update(updatePayload).eq('id', itemId);

        const currentItems = targetProject.items.map((i) => (i.id === itemId ? { ...i, ...updatePayload } : i));
        const reqDone = currentItems.filter((i) => i.required).every((i) => i.isCompleted);
        await supabase.from('projects').update({ status: reqDone ? 'completed' : 'pending' }).eq('id', targetProject.id);
      } catch (err) {
        console.error('Failed to update item in Supabase:', err);
      }
    }

    addToast('Checklist requirement updated.', 'success', 'Item Updated');
  };

  const deleteItemFromProject = async (projectIdOrSlug, itemId) => {
    const targetProject = projects.find((p) => p.id === projectIdOrSlug || p.slug === projectIdOrSlug);
    if (!targetProject) throw new Error('Project not found');

    const itemToDelete = targetProject.items.find((i) => i.id === itemId);

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== targetProject.id && p.slug !== targetProject.slug) return p;
        const updatedItems = p.items.filter((i) => i.id !== itemId);
        const reqDone = updatedItems.length > 0 ? updatedItems.filter((i) => i.required).every((i) => i.isCompleted) : false;
        return {
          ...p,
          items: updatedItems,
          status: reqDone ? 'completed' : 'pending',
        };
      })
    );

    // Save to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('project_items').delete().eq('id', itemId);

        const remainingItems = targetProject.items.filter((i) => i.id !== itemId);
        const reqDone = remainingItems.length > 0 ? remainingItems.filter((i) => i.required).every((i) => i.isCompleted) : false;
        await supabase.from('projects').update({ status: reqDone ? 'completed' : 'pending' }).eq('id', targetProject.id);
      } catch (err) {
        console.error('Failed to delete item from Supabase:', err);
      }
    }

    addToast(`Item "${itemToDelete?.title || 'Item'}" removed from project.`, 'info', 'Item Removed');
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
        addItemToProject,
        updateItemInProject,
        deleteItemFromProject,
        openProjectDetail,
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
        exportModalProject,
        setExportModalProject,
        openExportModal,
        closeExportModal,
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
        updateProjectType,
        toggleProjectType,
        updateProjectCadence,
        submitOngoingBatch,
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
