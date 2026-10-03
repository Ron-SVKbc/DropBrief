export const PROJECT_TEMPLATES = [
  {
    id: 'web-design',
    name: 'Tvorba webstránky',
    icon: 'Globe',
    badge: 'Najobľúbenejšie',
    description: 'Kompletný zber podkladov pre tvorbu nového webu či e-shopu.',
    items: [
      {
        id: 'item-1',
        title: 'Logo spoločnosti vo vektoroch (SVG / AI / PDF)',
        description: 'Potrebujeme logo v krivkách alebo v najvyššom rozlíšení s priehľadným pozadím (.PNG).',
        type: 'file',
        allowedTypes: 'image/*,.svg,.ai,.pdf',
        required: true,
      },
      {
        id: 'item-2',
        title: 'Texty na hlavnú stránku (O nás, Služby)',
        description: 'Vložte texty, ktoré majú byť na webe, alebo napíšte základnú kostru myšlienok.',
        type: 'text',
        required: true,
      },
      {
        id: 'item-3',
        title: 'Fotografie prevádzky, produktov alebo tímu',
        description: 'Nahrajte 5 až 15 kvalitných reprezentatívnych fotografií.',
        type: 'file',
        allowedTypes: 'image/*',
        required: true,
      },
      {
        id: 'item-4',
        title: 'Prístupové údaje k hostingu alebo doméne',
        description: 'Názov registrátora domény (napr. Websupport) a prihlasovacie údaje alebo prístupový odkaz.',
        type: 'text',
        required: false,
      }
    ]
  },
  {
    id: 'branding',
    name: 'Logo & Vizuálna identita',
    icon: 'Palette',
    badge: 'Kreatívne',
    description: 'Pre grafikov vytvárajúcich novú značku alebo redesign.',
    items: [
      {
        id: 'item-1',
        title: 'Presný názov značky a prípadný slogan',
        description: 'Ako presne sa má názov písať (veľké/malé písmená, diakritika).',
        type: 'text',
        required: true,
      },
      {
        id: 'item-2',
        title: 'Inšpiratívne značky a príklady (Moodboard)',
        description: 'Nahrajte 3-5 ukážok logotypov alebo štýlov, ktoré sa vám páčia.',
        type: 'file',
        allowedTypes: 'image/*,.pdf',
        required: true,
      },
      {
        id: 'item-3',
        title: 'Preferované a zakázané farby',
        description: 'Napr. „Máme radi tmavomodrú a zlatú, vyhnite sa červenej“.',
        type: 'text',
        required: true,
      }
    ]
  },
  {
    id: 'accounting',
    name: 'Účtovníctvo & Daňové priznanie',
    icon: 'FileSpreadsheet',
    badge: 'Účtovníci',
    description: 'Pre účtovníčky a daňových poradcov na zber mesačných a ročných výkazov.',
    items: [
      {
        id: 'item-1',
        title: 'Bankové výpisy za účtovné obdobie (PDF / CSV)',
        description: 'Všetky výpisy z podnikateľských bankových účtov vrátane Stripe / PayPal.',
        type: 'file',
        allowedTypes: '.pdf,.csv,.xlsx',
        required: true,
      },
      {
        id: 'item-2',
        title: 'Zoznam vystavených faktúr za obdobie',
        description: 'PDF faktúry alebo export fakturačnej knihy z iDoklad / SuperFaktúra.',
        type: 'file',
        allowedTypes: '.pdf,.zip,.xlsx',
        required: true,
      },
      {
        id: 'item-3',
        title: 'Prijaté faktúry a bločky z nákupov',
        description: 'Náklady na pohonné hmoty, materiál, kancelárske potreby a služby.',
        type: 'file',
        allowedTypes: '.pdf,.zip,image/*',
        required: true,
      }
    ]
  },
  {
    id: 'social-media',
    name: 'Správa sociálnych sietí',
    icon: 'Share2',
    badge: 'Marketing',
    description: 'Zber mesačných podkladov pre tvorbu obsahu na Instagram a LinkedIn.',
    items: [
      {
        id: 'item-1',
        title: 'Mesačné promo akcie, zľavy a priority',
        description: 'Čo je v tomto mesiaci cieľom predaja alebo komunikácie.',
        type: 'text',
        required: true,
      },
      {
        id: 'item-2',
        title: 'Čerstvé fotky a videá z prevádzky na spracovanie',
        description: 'Krátke videá (Reels) a surové fotky na grafické spracovanie.',
        type: 'file',
        allowedTypes: 'image/*,video/*',
        required: true,
      },
      {
        id: 'item-3',
        title: 'Cenové ponuky alebo novinky v ponuke',
        description: 'Popíšte nové produkty, služby alebo zmeny v otváracích hodinách.',
        type: 'text',
        required: false,
      }
    ]
  }
];

export const INITIAL_DEMO_PROJECTS = [
  {
    id: 'proj-alfa',
    slug: 'restauracia-alfa',
    title: 'Nový web a identita - Reštaurácia Alfa',
    clientName: 'Peter Novák',
    clientEmail: 'peter.novak@restauracia-alfa.sk',
    freelancerName: 'Marko (SplitAI Studio)',
    freelancerEmail: 'marko@splitai.sk',
    deadline: '2026-10-15',
    reminderFrequency: 3,
    lastReminderSent: '2026-10-01',
    createdAt: '2026-09-28',
    status: 'pending',
    items: [
      {
        id: 'item-1',
        title: 'Logo spoločnosti vo vektoroch (SVG / AI / PDF)',
        description: 'Potrebujeme logo v krivkách alebo v najvyššom rozlíšení s priehľadným pozadím (.PNG).',
        type: 'file',
        required: true,
        isCompleted: true,
        completedAt: '2026-09-29',
        value: {
          fileName: 'logo_alfa_final_vector.svg',
          fileSize: '420 KB',
          fileType: 'image/svg+xml'
        }
      },
      {
        id: 'item-2',
        title: 'Texty na hlavnú stránku (O nás, Služby)',
        description: 'Vložte texty, ktoré majú byť na webe, alebo napíšte základnú kostru myšlienok.',
        type: 'text',
        required: true,
        isCompleted: true,
        completedAt: '2026-09-30',
        value: 'Sme rodinná reštaurácia v centre mesta s tradíciou od roku 2012. Naša kuchyňa stavia na čerstvých lokálnych surovinách od farmárov z okolia. Každý týždeň obmieňame sezónne špeciality.'
      },
      {
        id: 'item-3',
        title: 'Fotografie prevádzky a jedál',
        description: 'Nahrajte 5 až 15 kvalitných reprezentatívnych fotografií jedál a interiéru.',
        type: 'file',
        required: true,
        isCompleted: false,
        value: null
      },
      {
        id: 'item-4',
        title: 'Jedálny a nápojový lístok (PDF)',
        description: 'Aktuálny cenník jedál a nápojov na zverejnenie na webe.',
        type: 'file',
        required: false,
        isCompleted: false,
        value: null
      }
    ]
  },
  {
    id: 'proj-dental',
    slug: 'dental-care-sro',
    title: 'Grafický balíček & Siete - Dental Care s.r.o.',
    clientName: 'MUDr. Zuzana Kováčová',
    clientEmail: 'info@dentalcare-klinika.sk',
    freelancerName: 'Marko (SplitAI Studio)',
    freelancerEmail: 'marko@splitai.sk',
    deadline: '2026-10-08',
    reminderFrequency: 2,
    lastReminderSent: null,
    createdAt: '2026-10-01',
    status: 'completed',
    items: [
      {
        id: 'item-1',
        title: 'Brand manuál a farby',
        description: 'Hex kódy alebo PDF so značkou.',
        type: 'file',
        required: true,
        isCompleted: true,
        completedAt: '2026-10-02',
        value: {
          fileName: 'dentalcare_brand_manual.pdf',
          fileSize: '2.1 MB',
          fileType: 'application/pdf'
        }
      },
      {
        id: 'item-2',
        title: 'Zoznam stomatologických služieb',
        description: 'Popis zákrokov a špecializácií.',
        type: 'text',
        required: true,
        isCompleted: true,
        completedAt: '2026-10-02',
        value: 'Preventívne prehliadky, dentálna hygiena, bielenie zubov, dentálna chirurgia a implantológia pod mikroskopom.'
      }
    ]
  }
];
