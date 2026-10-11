export const PROJECT_TEMPLATES = [
  {
    id: 'web-design',
    name: 'Web Design & Development',
    icon: 'Globe',
    badge: 'One-off',
    projectType: 'one-off',
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
    badge: 'One-off',
    projectType: 'one-off',
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
    id: 'social-media',
    name: 'Social Media Management',
    icon: 'Share2',
    badge: 'Ongoing',
    projectType: 'ongoing',
    cadenceDays: 1,
    description: 'Regular collection of photos, videos, and captions for social channels (daily, every 2 days, or weekly).',
    items: [
      {
        id: 'item-1',
        title: 'Raw photos & videos for today (Reels / Stories)',
        description: 'Short video clips, photos of operations, products, or team to edit.',
        type: 'file',
        allowedTypes: 'image/*,video/*',
        required: true,
      },
      {
        id: 'item-2',
        title: 'Caption notes, promos & post instructions',
        description: 'What is special today? Promotion, news, post copy, or designer instructions.',
        type: 'text',
        required: true,
      }
    ]
  },
  {
    id: 'custom',
    name: 'Custom Project',
    icon: 'Sparkles',
    badge: 'Custom',
    projectType: 'one-off',
    description: 'Custom checklist tailored for any freelance work, retainer or one-off delivery.',
    items: [
      {
        id: 'item-1',
        title: 'Project Brief & Specifications',
        description: 'Paste project brief, goals, or outline what you need from the client.',
        type: 'text',
        required: true,
      },
      {
        id: 'item-2',
        title: 'Primary Files & Brand Assets',
        description: 'Upload all relevant brand assets, documents, or content.',
        type: 'file',
        allowedTypes: '*/*',
        required: true,
      }
    ]
  }
];

export const INITIAL_DEMO_PROJECTS = [
  {
    id: 'proj-alfa',
    slug: 'brand-identity',
    title: 'New Website & Visual Identity',
    projectType: 'one-off',
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
    title: 'Social Media Management – Dental Clinic',
    projectType: 'ongoing',
    cadenceDays: 1,
    clientName: 'Dr. Susan Miller',
    clientEmail: 'info@dentalcare-clinic.com',
    freelancerName: 'Creative Studio',
    freelancerEmail: 'hello@creativestudio.com',
    deadline: '2026-10-18',
    reminderFrequency: 2,
    lastReminderSent: null,
    createdAt: '2026-10-01',
    status: 'completed',
    batches: [
      {
        id: 'batch-demo-1',
        date: '2026-10-10',
        submittedAt: '2026-10-10T14:20:00Z',
        status: 'completed',
        files: [
          {
            id: 'f-101',
            fileName: 'dental_hygiene_reels.mp4',
            fileSize: '12.4 MB',
            fileType: 'video/mp4',
            url: null,
            uploadedAt: '14:20'
          },
          {
            id: 'f-102',
            fileName: 'clinic_whitening.jpg',
            fileSize: '3.1 MB',
            fileType: 'image/jpeg',
            url: null,
            uploadedAt: '14:21'
          }
        ],
        note: 'Today Reels video: Painless dental hygiene overview. Copy: "Schedule your preventive checkup today."',
      }
    ],
    items: [
      {
        id: 'item-1',
        title: 'Raw photos & videos for today (Reels / Stories)',
        description: 'Short video clips, clinic photos, or dental products to edit.',
        type: 'file',
        required: true,
        isCompleted: true,
        completedAt: '2026-10-10',
        value: {
          files: [
            {
              id: 'f-101',
              fileName: 'dental_hygiene_reels.mp4',
              fileSize: '12.4 MB',
              fileType: 'video/mp4',
              url: null,
              uploadedAt: '14:20'
            },
            {
              id: 'f-102',
              fileName: 'clinic_whitening.jpg',
              fileSize: '3.1 MB',
              fileType: 'image/jpeg',
              url: null,
              uploadedAt: '14:21'
            }
          ]
        }
      },
      {
        id: 'item-2',
        title: 'Caption notes, promos & post instructions',
        description: 'Post copy, daily promo, or key patient notices.',
        type: 'text',
        required: true,
        isCompleted: true,
        completedAt: '2026-10-10',
        value: 'Today Reels video: Painless dental hygiene overview. Copy: "Schedule your preventive checkup today."'
      }
    ]
  }
];
