# 🗺️ DropBrief – Strategický plán rozvoja, škálovania & monetizácie

> **Filozofia projektu:** Lean Bootstrapping (0 € počiatočné prevádzkové náklady, 100 % v súlade s GDPR, nulové finančné riziko a postupné škálovanie financované z reálnych tržieb).

---

## 1. Fáza: Štart & Nulové náklady (Aktuálny stav – 0 € / mesiac)

V tejto fáze je aplikácia spustená **100 % zadarmo** s cieľom získať prvých 50–100 aktívnych freelancerov a agentúr bez akejkoľvek platobnej bariéry.

### Aktuálna infraštruktúra (Všetko v bezplatných limitoch):
* **Frontend & Serverless API:** Vercel Hobby (0 €)
* **Databáza:** Supabase PostgreSQL – Europe / Ireland (0 €, limit 500 MB – postačuje na desaťtisíce projektov)
* **Súborové úložisko:** Supabase Storage `client-uploads` (0 €, limit 1 GB / 1 000 MB)
* **E-mailové notifikácie:** Resend Free (0 €, 3 000 e-mailov / mesiac)

### Bezpečnostné a ochranné mantinely (Ochrana pred zaplnením disku):
1. **Limit na 1 súbor: 15 MB**
   * *Dôvod:* Zabraňuje tomu, aby 1 používateľ nahral 50 MB video a obsadil 5 % celého disku. Pre logá (SVG, PNG), briefy, zmluvy (PDF) a fotky 15 MB bohato stačí pre 98 % prípadov.
2. **GDPR Auto-Purge: 14 dní po dokončení projektu**
   * *Dôvod:* Freelancer si podklady stiahne spravidla do 48 hodín. 14 dní je bezpečný čas. Po 14 dňoch sa súbory automaticky vymažú zo Storage (`cron-purge.js`), čím sa disk neustále cyklicky vyprázdňuje.
3. **Manuálne uvoľnenie po stiahnutí ZIPu:**
   * Možnosť pre freelancera po stiahnutí podkladov jedným klikom zmazať súbory z cloudu a uvoľniť kapacitu.

---

## 2. Fáza: Monitorovanie & Tipping Point (Varovná zóna 600–700 MB)

Aplikácia beží zadarmo, kým celkový objem nahraných dát v Supabase Storage nepresiahne **600 MB (60 % kapacity)**.

### Pravidlo 60 % (Signál na spustenie monetizácie):
Keď zaplnenie dosiahne ~600 MB, znamená to, že **nástroj má reálnych, vracajúcich sa používateľov**, ktorí ho aktívne používajú pre svojich klientov.

### Akčný krok: Spustenie Early-Bird ponuky (PREDTÝM, ako sa minie disk):
* Vyhlásenie ponuky pre existujúcich používateľov:
  * **„Early Supporter Lifetime Deal“** za **29 € / 39 € jednorazovo** (obmedzené pre prvých 15–20 používateľov).
  * Alebo uvádzacie mesačné predplatné **7 € / mesiac**.
* **Finančný cieľ:** Získať prvých **90 € až 300 € na účet** z peňazí zákazníkov EŠTE PREDTÝM, ako vznikne akýkoľvek náklad na infraštruktúru.

---

## 3. Fáza: Škálovanie úložiska (Prechod na Cloudflare R2 v EÚ)

Keď projekt prerastie 1 GB v Supabase, **nebudeme** platiť drahý paušál Supabase Pro ($25 / mesiac). Namiesto toho prepojíme súbory na **Cloudflare R2**.

### Prečo Cloudflare R2:
* **10 GB ZADARMO každý mesiac** (10-násobok kapacity Supabase).
* **0 € poplatky za prenos dát (Egress):** Žiadne poplatky za sťahovanie súborov.
* **Cena nad limit:** Len **0,015 $ (1,5 centa) za 1 GB**. Ak by sme mali 20 GB súborov, stojí to len ~0,15 € / mesiac!
* **100 % GDPR & EÚ servery:**
  * Pri vytváraní bucketu sa nastaví `Jurisdiction: European Union (EU)`.
  * Súbory fyzicky zostávajú v dátových centrách v EÚ (Frankfurt / Amsterdam) a nikdy neopustia EÚ.

### Ako prebehne migrácia (Nulový výpadok):
1. **Databáza ostáva v Supabase:** Všetky účty, projekty a checklisty zostávajú v Supabase (nezmenené).
2. **Úprava funkcie `uploadClientFile()`:** Nové súbory sa začnú ukladať do Cloudflare R2 cez S3 SDK.
3. **Staré súbory:** Dočistia sa na Supabase cez 14-dňový purge. Aplikácia nemá ani sekundu odstávky.

---

## 4. Fáza: Kompletný SaaS model (Free vs. Pro)

Akonáhle je zapojená platobná brána (**Lemon Squeezy** – odporúčané pre EÚ kvôli automatickému riešeniu DPH / Merchant of Record):

### Free plán (Vždy zadarmo – Magnet na nových používateľov):
* 3 aktívne projekty súčasne.
* Max 15 MB na súbor.
* Uchovanie súborov 14 dní po dokončení.
* Vodoznak / odkaz *„Powered by DropBrief“* v klientskom portáli (generuje nových používateľov).

### Pro plán (9 € / mesiac alebo 79 € / rok):
* **Custom Branding (Whitelabel):** Vlastné logo freelancera/agentúry, vlastná farebná téma, skrytie loga DropBrief.
* **Neobmedzený počet aktívnych projektov.**
* **Väčší limit na súbory (až 100 MB).**
* **Dlhšia archivácia súborov (60–90 dní).**
* **Vlastná doména:** napr. `podklady.tvoja-agentura.sk`.
* **Priamy export na Google Drive / Dropbox.**

---

## 5. Prehľadný kontrolný zoznam (Checklist úloh)

- [x] Otestovaný funkčný kód (React, Supabase, Vercel, Resend).
- [x] Bezpečné RLS pravidlá a hashovanie PINov.
- [x] Nastaviť ochranný limit 15 MB na súbor v `src/lib/supabase.js`.
- [x] Upraviť automatické GDPR premazávanie na 14 dní v `api/cron-purge.js`.
- [ ] Sledovať stav úložiska v Supabase Dashboarde (cieľ: držať pod 600 MB).
- [ ] Spustiť marketing na sociálnych sieťach a komunitách (Reddit, LinkedIn, Facebook).
- [ ] Pri dosiahnutí 600 MB aktivovať Fázu 2 (Lifetime Deal & predplatné).
- [ ] Pri potrebe > 1 GB aktivovať Cloudflare R2 (10 GB zadarmo v EÚ).
