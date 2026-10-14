import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_DEMO_PROJECTS } from '../data/templates';
import { 
  supabase, 
  isSupabaseConfigured, 
  getCloudFreelancer, 
  saveCloudFreelancer, 
  hashPin,
  setSupabaseSessionHeaders,
  isNickAvailable,
  isEmailAvailable
} from '../lib/supabase';

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

/**
 * Generuje bezpečný, vysoko-entropický slug (8 znakov náhodnosti = 1+ bilión kombinácií).
 * Automaticky odstraňuje diakritiku (mäkčene/dĺžne) a používa Crockford base32 abecedu bez zameniteľných znakov.
 */
export function generateSecureSlug(baseName = 'client', length = 8) {
  const cleanBase = (baseName || 'client')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // odstránenie diakritiky (č -> c, š -> s, ä -> a)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'client';

  // Base32 Crockford abeceda bez vizuálne zameniteľných znakov (0 vs O, 1 vs I vs L)
  const chars = '23456789abcdefghjkmnpqrstuvwxyz';
  let randomSuffix = '';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < length; i++) {
      randomSuffix += chars[randomBytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      randomSuffix += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return `${cleanBase}-${randomSuffix}`;
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
    completedAt: proj.completed_at || (proj.status === 'completed' ? (proj.created_at ? proj.created_at.split('T')[0] : null) : null),
    purgedAt: proj.purged_at || null,
    filesPurged: Boolean(proj.files_purged),
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
        purged: Boolean(item.purged || item.value?.purged),
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
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register' | 'verify_register_pin' | 'pin_reveal' | 'forgot_pin'
  const [authRegisteredData, setAuthRegisteredData] = useState(null); // { nick, pin, email }
  const [pendingRegistration, setPendingRegistration] = useState(null); // { nick, email, challengeToken, expiresAt, devPin }

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

  // Synchronizácia RLS autorizačných hlavičiek v Supabase klientovi
  useEffect(() => {
    if (currentFreelancer?.nick) {
      setSupabaseSessionHeaders({
        nick: currentFreelancer.nick,
        pinHash: currentFreelancer.pinHash || currentFreelancer.pin || null,
      });
    } else {
      setSupabaseSessionHeaders({ nick: null, pinHash: null });
    }
  }, [currentFreelancer]);

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
        .order('created_at', { ascending: false })
        .limit(100); // Bezpečnostný strop stránkovania pre prevenciu preťaženia pamäte

      if (isUuid) {
        query = query.or(`freelancer_id.eq.${flId},freelancer_name.ilike.${cleanNick}`);
      } else {
        query = query.ilike('freelancer_name', cleanNick);
      }

      let { data, error } = await query;

      // Robust fallback if freelancer_id column does not exist yet in remote DB
      if (error && isUuid) {
        console.warn('Supabase projects query with freelancer_id failed, falling back to freelancer_name:', error.message);
        const fallbackRes = await supabase
          .from('projects')
          .select('*, project_items(*)')
          .order('created_at', { ascending: false })
          .ilike('freelancer_name', cleanNick)
          .limit(100);

        data = fallbackRes.data;
        error = fallbackRes.error;
      }

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

    // Lokálne demo náhľady sa neťahajú zo vzdialenej DB – ušetrí sa zbytočný sieťový dotaz
    if (cleanSlug.toLowerCase() === 'demo-preview') {
      return null;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        setSupabaseSessionHeaders({ slug: cleanSlug });
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

    // Debounce pre prevenciu búrky požiadaviek (websocket event storm) pri hromadných zmenách
    let debounceTimer = null;
    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchSupabaseProjects();
      }, 400);
    };

    // Listen to database changes in real time (WebSockets)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_items' }, debouncedFetch)
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
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
          const parsed = JSON.parse(saved);
          setCurrentFreelancer(parsed);
          if (parsed?.nick && parsed?.pinHash) {
            setSupabaseSessionHeaders({ nick: parsed.nick, pinHash: parsed.pinHash });
          }
        }
      } catch (e) {}
    }
    setIsAuthModalOpen(false);
  };

  /**
   * Krok 1 registrácie: Vygenerovanie a odoslanie 6-miestneho PIN kódu s 5-minútovou platnosťou.
   * Ochrana pred email enumeration: Nezverejňuje, či účet existuje.
   */
  const requestRegisterPin = async (nick, email = '') => {
    if (!nick || nick.trim().length < 2) {
      throw new Error('Meno / Nickname musí mať aspoň 2 znaky.');
    }

    const cleanNick = nick.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('Zadajte platnú e-mailovú adresu pre bezpečné doručenie overovacieho PIN kódu.');
    }

    // Odoslanie požiadavky na serverless endpoint /api/send-auth-pin
    const response = await fetch('/api/send-auth-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick: cleanNick, email: cleanEmail }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Nastala chyba pri odosielaní overovacieho PIN kódu. Skúste to znova.');
    }

    const pendingData = {
      nick: cleanNick,
      email: cleanEmail,
      challengeToken: data.challengeToken,
      expiresAt: data.expiresAt || (Date.now() + 5 * 60 * 1000),
      devPin: data.devPin,
    };

    setPendingRegistration(pendingData);
    setAuthModalMode('verify_register_pin');

    addToast('Overovací PIN kód bol odoslaný na váš e-mail.', 'info', 'Skontrolujte e-mail');
    return pendingData;
  };

  /**
   * Opätovné zaslanie PIN kódu v prípade vypršania alebo nedoručenia.
   */
  const resendRegisterPin = async () => {
    if (!pendingRegistration?.email || !pendingRegistration?.nick) {
      throw new Error('Chýbajúce registračné údaje. Začnite registráciu znova.');
    }
    return await requestRegisterPin(pendingRegistration.nick, pendingRegistration.email);
  };

  /**
   * Krok 2 registrácie: Overenie 6-miestneho PIN kódu (do 5 minút) a vytvorenie účtu.
   * Zadaný PIN kód sa stáva trvalým PIN kódom freelancera.
   */
  const verifyRegisterPin = async (enteredPin) => {
    if (!enteredPin || String(enteredPin).trim().length !== 6) {
      throw new Error('Zadajte 6-miestny numerický PIN kód z vášho e-mailu.');
    }

    if (!pendingRegistration) {
      throw new Error('Relácia registrácie vypršala. Zadajte vaše údaje znova.');
    }

    const cleanPin = String(enteredPin).trim();

    const response = await fetch('/api/verify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: pendingRegistration.email,
        nick: pendingRegistration.nick,
        pin: cleanPin,
        challengeToken: pendingRegistration.challengeToken,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success || !data.user) {
      throw new Error(data.error || 'Overenie PIN kódu zlyhalo. Skontrolujte kód a skúste znova.');
    }

    const user = data.user;
    const sessionRecord = {
      id: user.id,
      nick: user.nick,
      email: user.email,
      createdAt: user.createdAt,
      pinHash: user.pinHash,
    };

    // Uloženie do localStorage (session + lokálna pamäť účtov)
    try {
      localStorage.setItem('dropbrief_freelancer_session', JSON.stringify(sessionRecord));
      const localAccs = JSON.parse(localStorage.getItem('dropbrief_local_freelancers') || '[]');
      const filtered = localAccs.filter((a) => a.nick.toLowerCase() !== user.nick.toLowerCase() && (!a.email || a.email.toLowerCase() !== user.email.toLowerCase()));
      filtered.push(sessionRecord);
      localStorage.setItem('dropbrief_local_freelancers', JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to save session to localStorage:', e);
    }

    // Nastavenie do stavu aplikácie
    setCurrentFreelancer(sessionRecord);
    setSupabaseSessionHeaders({ nick: sessionRecord.nick, pinHash: sessionRecord.pinHash });

    setAuthRegisteredData({
      id: user.id,
      nick: user.nick,
      email: user.email,
      pin: cleanPin,
    });
    setPendingRegistration(null);
    setAuthModalMode('pin_reveal');

    addToast(`Účet ${user.nick} bol úspešne overený a vytvorený!`, 'success', 'Vitajte v DropBrief');
    return user;
  };

  /**
   * Spätná kompatibilita pre volania registrácie
   */
  const registerFreelancer = async (nick, email = '') => {
    return await requestRegisterPin(nick, email);
  };

  const loginFreelancer = async (identifier, pin) => {
    if (!identifier || !pin) {
      throw new Error('Zadajte vaše meno (alebo e-mail) a 6-miestny PIN kód.');
    }
    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPin = pin.trim();

    // 🛡️ Brute-force ochrana - max 5 pokusov za 60 sekúnd
    const RATE_KEY = 'dropbrief_login_attempts';
    try {
      const rateData = JSON.parse(localStorage.getItem(RATE_KEY) || '{"count":0,"since":0}');
      const now = Date.now();
      if (now - rateData.since < 60_000) {
        if (rateData.count >= 5) {
          const waitSec = Math.ceil((60_000 - (now - rateData.since)) / 1000);
          throw new Error(`Príliš veľa neúspešných pokusov. Skúste to znova o ${waitSec} sekúnd.`);
        }
        rateData.count += 1;
      } else {
        rateData.count = 1;
        rateData.since = now;
      }
      localStorage.setItem(RATE_KEY, JSON.stringify(rateData));
    } catch (rateErr) {
      if (rateErr.message && rateErr.message.includes('Príliš veľa')) throw rateErr;
    }

    let matchedUser = null;

    // 1. Najprv overiť lokálne účty – bleskový login (0 ms) podľa nicku ALEBO e-mailu
    try {
      const localAccs = JSON.parse(localStorage.getItem('dropbrief_local_freelancers') || '[]');
      const found = localAccs.find((a) => 
        (a.nick && a.nick.toLowerCase() === cleanIdentifier) || 
        (a.email && a.email.toLowerCase() === cleanIdentifier)
      );
      if (found) {
        let isValid = false;
        const computedSalted = await hashPin(cleanPin, true);
        const computedUnsalted = await hashPin(cleanPin, false);
        if (found.pinHash) {
          isValid = computedSalted === found.pinHash || computedUnsalted === found.pinHash;
        } else if (found.pin) {
          isValid = String(found.pin).trim() === cleanPin;
        }
        if (isValid) {
          matchedUser = { 
            id: found.id, 
            nick: found.nick, 
            email: found.email || '', 
            createdAt: found.createdAt,
            pinHash: found.pinHash || computedSalted
          };
        } else {
          throw new Error('Nesprávny 6-miestny PIN kód pre tento účet.');
        }
      }
    } catch (e) {
      if (e.message && e.message.includes('Nesprávny 6-miestny PIN kód')) throw e;
    }

    // 2. Ak sa nenašiel lokálne, overiť cez server-side endpoint /api/verify-pin
    //    → rate limiting sa vykonáva na serveri (podľa IP + mena/mailu)
    if (!matchedUser) {
      try {
        const verifyResponse = await fetch('/api/verify-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: cleanIdentifier, pin: cleanPin }),
          signal: AbortSignal.timeout(10000), // 10s bezpečný timeout
        });

        const verifyData = await verifyResponse.json().catch(() => ({}));

        if (verifyResponse.status === 429 || verifyData.rateLimited) {
          throw new Error(verifyData.error || 'Príliš veľa neúspešných pokusov. Počkajte chvíľu a skúste to znova.');
        }

        if (verifyResponse.status === 401 || verifyResponse.status === 404) {
          throw new Error(verifyData.error || 'Nesprávny nickname / e-mail alebo PIN kód.');
        }

        if (verifyResponse.ok && verifyData.success && verifyData.user) {
          const userPinHash = verifyData.user.pinHash || (await hashPin(cleanPin, true));
          matchedUser = {
            id:        verifyData.user.id,
            nick:      verifyData.user.nick,
            email:     verifyData.user.email || '',
            createdAt: verifyData.user.createdAt || verifyData.user.created_at,
            pinHash:   userPinHash,
          };
          // Uložíme do lokálnej pamäte pre budúce bleskové offline prihlásenia
          try {
            const localAccs = JSON.parse(localStorage.getItem('dropbrief_local_freelancers') || '[]');
            const filtered  = localAccs.filter((a) => a.nick.toLowerCase() !== matchedUser.nick.toLowerCase());
            filtered.push(matchedUser);
            localStorage.setItem('dropbrief_local_freelancers', JSON.stringify(filtered));
          } catch (e) {}
        }
      } catch (err) {
        if (
          err.message?.includes('Nesprávny') ||
          err.message?.includes('Príliš veľa') ||
          err.message?.includes('Incorrect')
        ) throw err;
        console.warn('Cloud login via /api/verify-pin unavailable:', err.message);
      }
    }

    // 3. Fallback: Ak /api/verify-pin nebol dostupný (napr. sieťová chyba, offline),
    // ale Supabase je nakonfigurovaný priamo v prehliadači, overíme priamo cez RPC
    if (!matchedUser && isSupabaseConfigured && supabase) {
      try {
        const saltedHash = await hashPin(cleanPin, true);
        const unsaltedHash = await hashPin(cleanPin, false);
        const { data: rpcData, error: rpcErr } = await supabase.rpc('verify_freelancer_pin', {
          p_nick: cleanIdentifier,
          p_salted_hash: saltedHash,
          p_unsalted_hash: unsaltedHash,
        });

        if (!rpcErr && rpcData?.success && rpcData.user) {
          const u = rpcData.user;
          matchedUser = {
            id:        u.id,
            nick:      u.nick,
            email:     u.email || '',
            createdAt: u.createdAt || u.created_at,
            pinHash:   u.pinHash || saltedHash,
          };
          try {
            const localAccs = JSON.parse(localStorage.getItem('dropbrief_local_freelancers') || '[]');
            const filtered  = localAccs.filter((a) => a.nick.toLowerCase() !== matchedUser.nick.toLowerCase());
            filtered.push(matchedUser);
            localStorage.setItem('dropbrief_local_freelancers', JSON.stringify(filtered));
          } catch (e) {}
        } else if (rpcData && !rpcData.success) {
          throw new Error(rpcData.error || 'Nesprávny nickname / e-mail alebo PIN kód.');
        }
      } catch (directRpcErr) {
        if (directRpcErr.message?.includes('Nesprávny') || directRpcErr.message?.includes('Chýbajúce')) {
          throw directRpcErr;
        }
      }
    }

    if (!matchedUser) {
      throw new Error(`Účet pre "${identifier.trim()}" sa nenašiel. Skontrolujte zadané meno / e-mail alebo si vytvorte nový účet.`);
    }

    // Reset rate-limitera po úspešnom prihlásení
    try { localStorage.removeItem(RATE_KEY); } catch(e) {}

    // Uloženie session a aktivácia dashboardu
    localStorage.setItem('dropbrief_freelancer_session', JSON.stringify(matchedUser));
    setSupabaseSessionHeaders({ nick: matchedUser.nick, pinHash: matchedUser.pinHash });
    setCurrentFreelancer(matchedUser);
    closeAuthModal();
    addToast(`Vitajte späť, ${matchedUser.nick}!`, 'success', 'Prihlásený');
    return matchedUser;
  };

  const resetFreelancerPin = async (email) => {
    if (!email || !email.includes('@')) {
      throw new Error('Zadajte platnú e-mailovú adresu.');
    }
    const cleanEmail = email.trim().toLowerCase();

    const response = await fetch('/api/reset-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Obnova PIN kódu zlyhala. Skúste to prosím znova.');
    }

    return data;
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
    setSupabaseSessionHeaders({ nick: null, pinHash: null });
    setCurrentFreelancer(null);
    setCurrentView('dashboard');
    setActiveProjectSlug('demo-preview');
    setProjects(INITIAL_DEMO_PROJECTS);
    addToast('Boli ste úspešne odhlásený z dashboardu.', 'info', 'Odhlásený');
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
    let randomSlug = generateSecureSlug(newProjData.clientName || 'client', 8);
    let attempts = 0;
    const MAX_COLLISION_ATTEMPTS = 20;

    // Prevencia lokálnej kolízie so striktnou podmienkou ukončenia (base case)
    while (
      attempts < MAX_COLLISION_ATTEMPTS &&
      projects.some((p) => p.slug?.toLowerCase() === randomSlug.toLowerCase())
    ) {
      attempts++;
      randomSlug = generateSecureSlug(newProjData.clientName || 'client', 8);
    }

    // Deterministický fallback ak by nastala nepravdepodobná séria 20 kolízií
    if (projects.some((p) => p.slug?.toLowerCase() === randomSlug.toLowerCase())) {
      randomSlug = `${randomSlug}-${Date.now().toString(36)}`;
    }

    const tempId = 'proj-' + Date.now();
    const flId = currentFreelancer ? currentFreelancer.id : null;
    const flName = currentFreelancer ? currentFreelancer.nick : (newProjData.freelancerName || 'Freelancer');
    const flEmail = currentFreelancer?.email || newProjData.freelancerEmail || '';

    const projectType = newProjData.projectType || 'one-off';
    setStoredProjectType(randomSlug, projectType);
    setStoredProjectType(tempId, projectType);

    // Dynamický predvolený deadline: dnešok + 14 dní
    const defaultDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newProject = {
      id: tempId,
      freelancerId: flId,
      slug: randomSlug,
      title: newProjData.title,
      clientName: newProjData.clientName,
      clientEmail: newProjData.clientEmail,
      freelancerName: flName,
      freelancerEmail: flEmail,
      deadline: newProjData.deadline || defaultDeadline,
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

  const purgeProjectFilesNow = async (projectSlug) => {
    try {
      const resp = await fetch('/api/cron-purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: projectSlug, force: true }),
        signal: AbortSignal.timeout(12000), // 12s bezpečný timeout
      });
      const data = await resp.json();
      if (data.success) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.slug !== projectSlug && p.id !== projectSlug) return p;
            return {
              ...p,
              filesPurged: true,
              purgedAt: new Date().toISOString(),
              items: (p.items || []).map((it) => ({
                ...it,
                purged: it.type === 'file' ? true : it.purged,
                value: it.value && typeof it.value === 'object' ? { ...it.value, purged: true, url: null } : it.value,
              })),
            };
          })
        );
        addToast('Súbory projektu boli úspešne skartované z cloudu v súlade s GDPR.', 'success', 'GDPR Skartácia');
        return { success: true, filesPurgedCount: data.results?.[0]?.filesPurgedCount || 0 };
      } else {
        throw new Error(data.error || 'Chyba pri skartácii súborov');
      }
    } catch (err) {
      console.error('purgeProjectFilesNow error:', err);
      addToast(err.message, 'error', 'Chyba skartácie');
      return { success: false, error: err.message };
    }
  };

  const deleteProject = async (projectId) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));

    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase.from('projects').delete().eq('id', projectId);
        if (currentFreelancer?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentFreelancer.id)) {
          const res = await q.or(`freelancer_id.eq.${currentFreelancer.id},freelancer_name.ilike.${currentFreelancer.nick}`);
          if (res.error) {
            await supabase.from('projects').delete().eq('id', projectId).ilike('freelancer_name', currentFreelancer.nick);
          }
        } else if (currentFreelancer?.nick) {
          await q.ilike('freelancer_name', currentFreelancer.nick);
        } else {
          await q;
        }
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
          completedAt: requiredCompleted ? (proj.completedAt || new Date().toISOString()) : null,
        };
      })
    );

    // Sync to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        setSupabaseSessionHeaders({ slug: cleanSlug });
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
            .update({ 
              status: reqDone ? 'completed' : 'pending',
              completed_at: reqDone ? (currentProj.completedAt || new Date().toISOString()) : null,
            })
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
      signal: AbortSignal.timeout(12000), // 12s bezpečný timeout
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
        requestRegisterPin,
        verifyRegisterPin,
        resendRegisterPin,
        pendingRegistration,
        setPendingRegistration,
        loginFreelancer,
        resetFreelancerPin,
        loginAsDemo,
        logoutFreelancer,
        updateProjectType,
        toggleProjectType,
        updateProjectCadence,
        submitOngoingBatch,
        seedDemoProjectForFreelancer,
        purgeProjectFilesNow,
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
