---
trigger: always_on
glob: **/*
description: Architektúra projektu DropBrief, prepojenie infraštruktúry a postup nasadzovania zmien na produkčný server
---

# 📖 DropBrief - Architektúra, Infraštruktúra & Deployment Pravidlá

Tento dokument slúži pre každú AI aj vývojára ako kompletný sprievodca projektom. Obsahuje presný popis architektúry, prepojení a postup, ako vykonávať a ukladať zmeny na produkčný server.

---

## 1. O projekte (Čo je DropBrief)
* **Názov aplikácie:** DropBrief (v git repozitári `DropBrief`, lokálny adresár `SplitAI`)
* **Účel:** Micro-SaaS nástroj pre freelancerov, webdizajnérov, agentúry a účtovníkov na automatizovaný zber podkladov (súbory, texty, prístupy) od klientov.
* **Kľúčová hodnota:** Klient dostane unikátny link a **nahráva bez registrácie a hesiel**. Súbory sa ukladajú do zabezpečeného cloudu a freelancer má prehľad v reálnom čase.

---

## 2. Technologický stack
* **Frontend:** React 18, Vite 6
* **Styling:** Čisté Vanilla CSS s kompletným Design Systémom (`src/index.css`) – Dark mode, Glassmorphism, CSS Tokens.
* **Ikony & UI:** `lucide-react`, `canvas-confetti`
* **Backend & DB:** Supabase (BaaS)
* **SDK:** `@supabase/supabase-js`

---

## 3. Prehľad infraštruktúry (Kde je čo napojené)

```
[ Klient / Používateľ ]
         │
         ▼
[ Vercel CDN / Edge ] (Hosting & Automatický CI/CD Build)
         │  (Vite Single Page Application)
         ▼
[ Supabase EÚ - Írsko ]
   ├── Postgres DB: tabuľky `projects` a `project_items`
   ├── Storage Bucket: `client-uploads` (Verejné šifrované úložisko pre PDF, fotky, zmluvy)
   └── WebSockets (Realtime synchronizácia medzi klientom a dashboardom)
```

### A. Produkčný hosting (Vercel)
* **Poskytovateľ:** Vercel (Hobby plán, 0 € / mesiac)
* **Prepojenie:** Vercel je priamo napojený na GitHub repozitár:
  `https://github.com/Ron-SVKbc/DropBrief.git` (vetva `main`).
* **Environment Variables na Verceli:**
  V nastaveniach projektu na Verceli sú zadefinované dve produkčné premenné:
  * `VITE_SUPABASE_URL` = adresa Supabase projektu
  * `VITE_SUPABASE_ANON_KEY` = verejný anon/publishable kľúč

### B. Databáza & Cloud Úložisko (Supabase)
* **Umiestnenie servera:** Europe Ireland (EÚ) – 100 % v súlade s GDPR.
* **Projekt URL:** `https://byflbydvhlghdhnmsmci.supabase.co`
* **Štruktúra databázy (definovaná v `supabase_schema.sql`):**
  1. `public.projects`: Hlavné záznamy zákaziek (`id`, `slug`, `title`, `client_name`, `client_email`, `freelancer_name`, `status`, atď.).
  2. `public.project_items`: Jednotlivé položky checklistu (`id`, `project_id`, `title`, `type`, `is_completed`, `value` JSONB s odkazom na súbor).
  3. `storage.buckets`: Bucket `client-uploads` s verejným prístupom pre upload od klientov a download pre freelancera.
  4. **Row Level Security (RLS):** Zabezpečenie na úrovni riadkov povolené.

### C. Lokálne premenné prostredia (`.env`)
* Lokálne sú kľúče uložené v súbore `.env`.
* **DÔLEŽITÉ:** Súbor `.env` je uvedený v `.gitignore` a **NIKDY sa nesmie commitnúť na GitHub**.

---

## 4. Ako ukladať zmeny na server (Deployment Workflow)

Vďaka prepojeniu GitHub ➔ Vercel funguje nasadzovanie **plne automaticky cez CI/CD pipeline**.

### Postup krok za krokom pre AI / vývojára:

1. **Vykonajte úpravy v kóde** (komponenty, štýly, logika).
2. **Skontrolujte build aplikácie**, aby ste predišli chybám v produkcii:
   ```bash
   npm run build
   ```
   *Uistite sa, že príkaz skončí s kódom 0 a bez chýb.*
3. **Commitnite a pushnite zmeny na GitHub:**
   ```bash
   git add .
   git commit -m "stručný popis vykonanej úpravy"
   git push origin main
   ```
4. **Hotovo!**
   * Vercel v momente zachytí push do vetvy `main`.
   * Spustí build a do 20–40 sekúnd automaticky nasadí novú verziu na živú doménu.
   * Nie je potrebný žiadny manuálny zásah na serveri ani v rozhraní Vercelu.

---

## 5. Dôležité súbory v repozitári

| Súbor / Adresár | Význam a úloha |
| :--- | :--- |
| `src/context/AppContext.jsx` | **Srdce aplikácie:** Spravuje stav projektov, načítanie zo Supabase, realtime WebSockets, fallback na localStorage. |
| `src/lib/supabase.js` | Inicializácia Supabase klienta a pomocná funkcia `uploadClientFile()` na ukladanie súborov do bucketu. |
| `src/components/Dashboard.jsx` | Rozhranie freelancera: prehľad metrík, karty projektov, kopírovanie linkov pre klienta, export podkladov. |
| `src/components/ClientPortal.jsx` | Klientsky portál: drag & drop zóna, zadávanie textu, realtime progress bar, konfety pri 100 %. |
| `src/components/CreateProjectModal.jsx` | Modál na vytvorenie nového projektu a výber predpripravených šablón. |
| `src/data/templates.js` | Šablóny zberu podkladov (Webdizajn, Branding, Účtovníctvo, Sociálne siete). |
| `src/index.css` | Globálny dizajn systém, CSS premenné, glassmorphism triedy. |
| `supabase_schema.sql` | SQL schéma pre databázu a storage – zdroj pravdy pre štruktúru dát. |
| `api/send-reminder.js` | **Serverless funkcia (Vercel & Vite dev):** Odosielanie pripomienok cez moderné transakčné Resend API (3 000 e-mailov/mesiac zadarmo). |
| `src/components/EmailPreviewModal.jsx` | Modál náhľadu a odoslania e-mailovej pripomienky klientovi cez Resend. |
| `.env` | Lokálne API kľúče (Supabase, Resend) (necommitovať). |
| `.env.example` | Šablóna premenných pre nových vývojárov. |

---

## 6. Pravidlá pre ďalší vývoj pre akékoľvek AI
* **Zachovať Zero-Friction pre klienta:** Klientsky portál (`ClientPortal.jsx`) nesmie nikdy vyžadovať heslo ani prihlasovanie.
* **Zachovať spätnú kompatibilitu:** Ak by Supabase kľúče chýbali, aplikácia v `AppContext.jsx` plynule funguje v offline/demo režime cez `localStorage`.
* **Bezpečnosť súborov:** Všetky klientske nahrávania súborov musia smerovať do bucketu `client-uploads` cez funkciu `uploadClientFile` v `src/lib/supabase.js`.
