export const PROJECT_TEMPLATES = [
  {
    id: 'web-design',
    name: 'Web Design & Development',
    icon: 'Globe',
    badge: 'Most Popular',
    description: 'Complete asset collection for building a new website or online store.',
    items: [
      {
        id: 'item-1',
        title: 'Company vector logo (SVG / AI / PDF)',
        description: 'Vector format preferred or high-resolution file with a transparent background (.PNG).',
        type: 'file',
        allowedTypes: 'image/*,.svg,.ai,.pdf',
        required: true,
      },
      {
        id: 'item-2',
        title: 'Homepage copy (About us, Services, Hero)',
        description: 'Paste final website copy or outline your core messaging and bullet points.',
        type: 'text',
        required: true,
      },
      {
        id: 'item-3',
        title: 'High-res photos (Location, Products, Team)',
        description: 'Upload 5 to 15 representative, high-quality photos.',
        type: 'file',
        allowedTypes: 'image/*',
        required: true,
      },
      {
        id: 'item-4',
        title: 'Domain & hosting credentials or access',
        description: 'Domain registrar name (e.g. Namecheap, GoDaddy) and temporary credentials or delegate invite.',
        type: 'text',
        required: false,
      }
    ]
  },
  {
    id: 'branding',
    name: 'Logo & Visual Identity',
    icon: 'Palette',
    badge: 'Creative',
    description: 'For graphic designers creating a new brand identity or redesign.',
    items: [
      {
        id: 'item-1',
        title: 'Exact brand name and optional tagline',
        description: 'Exact spelling, uppercase/lowercase preferences, and punctuation.',
        type: 'text',
        required: true,
      },
      {
        id: 'item-2',
        title: 'Inspirational brands & references (Moodboard)',
        description: 'Upload 3-5 visual references or logos representing styles you love.',
        type: 'file',
        allowedTypes: 'image/*,.pdf',
        required: true,
      },
      {
        id: 'item-3',
        title: 'Preferred & forbidden colors',
        description: 'E.g., "We love navy blue and champagne gold; avoid red and orange".',
        type: 'text',
        required: true,
      }
    ]
  },
  {
    id: 'accounting',
    name: 'Accounting & Tax Filing',
    icon: 'FileSpreadsheet',
    badge: 'Finance',
    description: 'For accountants and financial advisors collecting monthly or tax-year records.',
    items: [
      {
        id: 'item-1',
        title: 'Bank statements for the period (PDF / CSV)',
        description: 'All business accounts statements including Stripe, PayPal, and merchant processors.',
        type: 'file',
        allowedTypes: '.pdf,.csv,.xlsx',
        required: true,
      },
      {
        id: 'item-2',
        title: 'Issued sales invoices register',
        description: 'PDF invoices or ledger export from your invoicing software.',
        type: 'file',
        allowedTypes: '.pdf,.zip,.xlsx',
        required: true,
      },
      {
        id: 'item-3',
        title: 'Supplier bills & expense receipts',
        description: 'Expenses for fuel, materials, office supplies, equipment, and SaaS subscriptions.',
        type: 'file',
        allowedTypes: '.pdf,.zip,image/*',
        required: true,
      }
    ]
  },
  {
    id: 'social-media',
    name: 'Social Media Management',
    icon: 'Share2',
    badge: 'Marketing',
    description: 'Monthly asset collection for Instagram, TikTok, and LinkedIn content.',
    items: [
      {
        id: 'item-1',
        title: 'Monthly promotions, discounts & campaign goals',
        description: 'What are the main sales priorities and promotions for this month.',
        type: 'text',
        required: true,
      },
      {
        id: 'item-2',
        title: 'Raw photos & video reels for editing',
        description: 'Short video clips (Reels/TikTok) and raw photos to design and schedule.',
        type: 'file',
        allowedTypes: 'image/*,video/*',
        required: true,
      },
      {
        id: 'item-3',
        title: 'Updated pricing or new service offerings',
        description: 'Detail any new products, pricing updates, or revised operating hours.',
        type: 'text',
        required: false,
      }
    ]
  }
];

export const INITIAL_DEMO_PROJECTS = [
  {
    id: 'proj-alfa',
    slug: 'brand-identity',
    title: 'New Website & Visual Identity',
    clientName: 'Peter Novak',
    clientEmail: 'peter.novak@example.com',
    freelancerName: 'Creative Studio',
    freelancerEmail: 'hello@creativestudio.com',
    deadline: '2026-10-25',
    reminderFrequency: 3,
    lastReminderSent: '2026-10-01',
    createdAt: '2026-09-28',
    status: 'pending',
    items: [
      {
        id: 'item-1',
        title: 'Company vector logo (SVG / AI / PDF)',
        description: 'Vector format preferred or high-resolution file with a transparent background (.PNG).',
        type: 'file',
        required: true,
        isCompleted: true,
        completedAt: '2026-09-29',
        value: {
          fileName: 'brand_logo_final_vector.svg',
          fileSize: '420 KB',
          fileType: 'image/svg+xml'
        }
      },
      {
        id: 'item-2',
        title: 'Homepage copy (About us, Services)',
        description: 'Paste final website copy or outline your core messaging and bullet points.',
        type: 'text',
        required: true,
        isCompleted: true,
        completedAt: '2026-09-30',
        value: 'We are an artisanal creative studio established in 2018. We craft bespoke digital experiences and brand identities with focus on quality and innovation.'
      },
      {
        id: 'item-3',
        title: 'Atmosphere & food photography (5 to 10 photos)',
        description: 'Upload 5 to 15 representative high-resolution photos of food, drinks, and the interior.',
        type: 'file',
        required: true,
        isCompleted: false,
        value: null
      },
      {
        id: 'item-4',
        title: 'Brand guidelines & style guide (PDF)',
        description: 'Current brand guidelines and visual assets.',
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
    title: 'Brand Kit & Social Assets – Dental Care Clinic',
    clientName: 'Dr. Susan Miller',
    clientEmail: 'info@dentalcare-clinic.com',
    freelancerName: 'Creative Studio',
    freelancerEmail: 'hello@creativestudio.com',
    deadline: '2026-10-18',
    reminderFrequency: 2,
    lastReminderSent: null,
    createdAt: '2026-10-01',
    status: 'completed',
    items: [
      {
        id: 'item-1',
        title: 'Brand guidelines & official color codes',
        description: 'Hex codes or brand manual PDF.',
        type: 'file',
        required: true,
        isCompleted: true,
        completedAt: '2026-10-02',
        value: {
          fileName: 'dentalcare_brand_guidelines.pdf',
          fileSize: '2.1 MB',
          fileType: 'application/pdf'
        }
      },
      {
        id: 'item-2',
        title: 'List of dental specialties & treatments',
        description: 'Descriptions of procedures and key clinical doctor specialties.',
        type: 'text',
        required: true,
        isCompleted: true,
        completedAt: '2026-10-02',
        value: 'Preventative check-ups, dental hygiene, laser teeth whitening, oral surgery, and micro-dentistry implantology.'
      }
    ]
  }
];
