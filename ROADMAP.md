# 🗺️ DropBrief - Strategický Plán, Škálovanie & Infraštruktúra

Tento dokument slúži ako živý strategický a technický plán pre vývoj, škálovanie a monetizáciu projektu **DropBrief**. 

Cieľom je začať s **0 € mesačnými nákladmi**, získať prvých používateľov pomocou štedrého bezplatného režimu a začať generovať zisk **ešte predtým**, ako vzniknú akékoľvek výdavky na infraštruktúru.

---

## 📌 Základné princípy projektu
1. **Zero Friction pre klienta:** Klient nahráva bez prihlasovania a hesiel.
2. **Konkurenčná výhoda (50 MB na súbor):** Ponechaný štedrý limit 50 MB na jeden súbor, aby sa používatelia a ich klienti nestretávali s chybovými hláškami pri nahrávaní podkladov.
3. **GDPR a EÚ lokalita:** Všetky dáta a súbory musia byť uložené striktne v rámci Európskej únie.
4. **Lean Bootstrapping (0 € nákladov):** Žiadne platby za servery z vlastného vrecka pred získaním prvých platiacich používateľov.

---

## 🧭 Fázy realizácie projektu

```
┌─────────────────────────────────┐
│  FÁZA 1: Štart na 0 € (TERAZ)   │  ◄── Sme tu (100 % Free, Supabase, Vercel, 50 MB limit)
└────────────────┬────────────────┘
                 │
                 ▼ (pri zaplnení ~600 - 700 MB)
┌─────────────────────────────────┐
│  FÁZA 2: Monetizácia & R2 Cloud │  ◄── Early Bird predaje + prechod na 10 GB Cloudflare R2 (EÚ)
└────────────────┬────────────────┘
                 │
                 ▼ (pri pravidelných tržbách)
┌─────────────────────────────────┐
│  FÁZA 3: Plnohodnotný Pro SaaS  │  ◄── Lemon Squeezy predplatné, Whitelabel, vlastné domény
└─────────────────────────────────┘
```

---

## 🚀 FÁZA 1: Launch & Získanie používateľov (Aktuálny stav - 0 €)

* **Model:** 100 % Free pre všetkých freelancerov a agentúry.
* **Hosting:** Vercel Hobby (0 € / mesiac).
* **Databáza:** Supabase PostgreSQL EÚ (500 MB voľného miesta – kapacita na desiatky tisíc projektov a položiek).
* **Súbory:** Supabase Storage `client-uploads` (1 000 MB bezplatne, limit 50 MB na súbor).
* **E-maily:** Resend API (3 000 bezplatných e-mailov mesačne).
* **Rotácia disku:** 
  - Súbory sa automaticky premazávajú cez `/api/cron-purge` 30 dní po dokončení projektu (GDPR limitácia a prirodzené uvoľňovanie miesta).
  - Freelanceri môžu manuálne premazať súbory po ich stiahnutí do PC.

### Úlohy a ciele Fázy 1:
- [x] Dokončiť a zabezpečiť frontend, databázu a klientsky portál.
- [x] Otestovať odosielanie e-mailov cez Resend.
- [x] Ponechať limit 50 MB na súbor pre maximálnu spokojnosť používateľov.
- [x] Spustiť organický seeding na Reddite (r/SideProject, r/ShowMeYourSaaS).
- [ ] **LinkedIn stratégia:** Optimalizácia profilu tvorcu a budovanie siete s 10–15 webdizajnérmi denne.
- [ ] **Product Hunt Launch:** Príprava vizuálov, sloganu, Maker komentára a oficiálny medzinárodný launch.
- [ ] Zdieľať nástroj v komunitách (Facebook skupiny pre webdizajnérov, Reddit `r/freelance`, `r/webdev`).
- [ ] Dosiahnuť prvých 30–50 aktívnych používateľov.
- [ ] Monitorovať zaplnenie Supabase Storage v grafe.

---

## ⚡ FÁZA 2: Škálovanie úložiska & Prvý predaj (Trigger: 600–700 MB zaplnenia)

Akonáhle využitie Supabase Storage dosiahne **600 až 700 MB**, spúšťa sa táto fáza:

### A. Prechod na Cloudflare R2 (10 GB zadarmo v EÚ)
* **Prečo:** Cloudflare R2 ponúka **10 GB úložiska mesačne zadarmo** (10x viac ako Supabase) a **0 € za prenos dát (nulový egress poplatok)**.
* **Lokalita & GDPR:** Pri vytváraní R2 bucketu sa nastaví voľba `Jurisdiction: European Union`. Všetky dáta zostanú 100 % v EÚ.
* **Spôsob prechodu:**
  1. Databáza projektov a prihlasovanie naďalej beží v Supabase (databáza je malá a zostáva zadarmo).
  2. Upraví sa iba funkcia `uploadClientFile()`, aby nové súbory smerovala do R2 cez S3-kompatibilné API.
  3. Staré súbory na Supabase sa prirodzene dočistia cez cron purge.
  4. Výsledok: **Ďalších 10 000 MB priestoru s nulovými nákladmi.**

### B. Prvá monetizácia – "Early Supporter / Lifetime Deal"
* Ešte pred minutím bezplatných limitov ohlásiť špeciálnu časovo obmedzenú ponuku:
  * **Cena:** 29 € až 39 € (jednorazová doživotná licencia pre prvých 15–20 záujemcov).
  * **Čo získajú:** Doživotný prístup k Pro funkciám, väčšie úložisko, priorita pri nových funkciách.
  * **Cieľ:** Získať 2–4 predaje = **okamžitý zisk ~100 € až 150 €**, ktorý pokryje akékoľvek budúce náklady.

---

## 💎 FÁZA 3: Plnohodnotný Predplatný Model (Pro & Agency)

Keď má aplikácia overenú hodnotu a stabilnú základňu používateľov, zavedie sa mesačné/ročné predplatné.

### Porovnanie plánov (Free vs. Pro):

| Funkcia | Free Plán (Zadarmo) | Pro Plán (7 – 12 € / mesiac) |
| :--- | :--- | :--- |
| **Max. aktívne projekty** | 3 aktívne projekty súčasne | **Neobmedzene** |
| **Limit na súbor** | 50 MB | **100 MB+** |
| **Branding portálu** | Logo „Powered by DropBrief“ | **Vlastné logo a farby (Whitelabel)** |
| **Vlastná doména** | `usedropbrief.xyz/p/klient` | **`brief.tvojadomena.sk`** |
| **Doba archivácie súborov** | 30 dní po dokončení | **90 dní alebo neobmedzene** |
| **Integrácie** | Manuálne stiahnutie (ZIP) | **Auto-sync do Google Drive / Dropbox** |

### Platobná infraštruktúra:
* **Lemon Squeezy:** Odporúčané riešenie pre sólo developera v EÚ (funguje ako *Merchant of Record* – automaticky vystavuje faktúry a odvádza DPH v jednotlivých štátoch EÚ, čím odbúrava účtovnú záťaž).
* **Alternatíva:** Stripe Checkout + Stripe Billing.

---

## 🛡️ Monitoring a kontrolné body pre vývojára

| Kedy skontrolovať | Čo skontrolovať | Kde to nájsť |
| :--- | :--- | :--- |
| **1x týždenne** | Využitie Storage (MB) | Supabase Dashboard ➔ Organization / Project ➔ Usage |
| **1x mesačne** | Počet odoslaných e-mailov | Resend Dashboard (Limit: 3 000 / mesiac) |
| **Pri každom nasadení** | Úspešnosť Vercel Buildu | GitHub Actions / Vercel Deployments tab |

---

*Tento plán je flexibilný a priebežne aktualizovaný podľa reálneho rastu a potrieb používateľov.*
