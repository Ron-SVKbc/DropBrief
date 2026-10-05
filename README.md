# 🚀 DropBrief - Bezpečný portál na zber podkladov od klientov (0 € Stack)

DropBrief je moderný micro-SaaS nástroj navrhnutý pre freelancerov, webdizajnérov, marketingové agentúry a účtovníkov. Rieši jeden z najväčších problémov v službách: **zdržovanie projektov kvôli čakaniu na dodanie podkladov od klientov**.

---

## ✨ Kľúčové funkcie (MVP)

1. **Prehľadný Dashboard freelancera:**
   - Metriky: aktívne zákazky, čakajúce položky, dokončené projekty a ušetrený čas.
   - Karty projektov s dynamickým progress barom v reálnom čase.
   - Možnosť jedným klikom skopírovať unikátny odkaz pre klienta.
   - Tlačidlo na stiahnutie všetkých odovzdaných podkladov.
2. **Klientsky portál (Bez registrácie):**
   - Klient nepotrebuje žiadne heslo ani účet (žiadne bariéry).
   - Drag & Drop nahrávanie súborov s okamžitým náhľadom a kontrolou veľkosti.
   - Textové polia s automatickým ukladaním.
   - Oslavné konfety (`canvas-confetti`) pri dosiahnutí 100 % splnenia checklistu.
3. **Automatický pripomienkový robot:**
   - Možnosť nastaviť frekvenciu pripomienok (napr. každé 3 dni).
   - Simulátor e-mailovej notifikácie s náhľadom, čo presne klient dostane do schránky.
4. **Predpripravené šablóny na 1 klik:**
   - 🌐 Tvorba webstránky
   - 🎨 Logo & Vizuálna identita
   - 📊 Účtovníctvo & Daňové priznanie
   - 📱 Správa sociálnych sietí
5. **100 % Bezpečnosť a ochrana pred zodpovednosťou:**
   - Vstavaný bezpečnostný model a podmienky používania (Terms of Service).
   - GDPR doložka pre technického sprostredkovateľa (Data Processor).
   - Auto-purge funkcionalita (zmazanie dát po 30 dňoch).

---

## 🛠️ Ako aplikáciu spustiť lokálne

Aplikácia beží cez Vite a React:

```bash
# 1. Inštalácia závislostí
npm install

# 2. Spustenie vývojového servera
npm run dev

# 3. Zostavenie produkčného balíčka
npm run build
```

Otvorte v prehliadači: **`http://localhost:3000/`**

---

## 🌐 Ako to nasadiť na internet úplne ZADARMO (0 € / mesiac)

1. **Vytvorte si bezplatný účet na GitHub.com** a nahrajte tam tento priečinok.
2. **Prepojte ho s Vercel.com (Free Hobby Tier):**
   - Kliknite na *„Add New Project“* -> vyberte váš GitHub repozitár.
   - Vercel automaticky rozpozná Vite projekt a za 30 sekúnd vygeneruje bezplatnú doménu (napr. `dropbrief.vercel.app`) s bezplatným SSL certifikátom.
3. **Napojenie e-mailových pripomienok (Google Gmail SMTP - 100 % zadarmo):**
   - Na vašom bežnom Google účte si aktivujte 2-fázové overenie a vygenerujte 16-miestne heslo aplikácie: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Do `.env` a v nastaveniach Vercelu doplňte:
     - `GMAIL_USER=vas.email@gmail.com`
     - `GMAIL_APP_PASSWORD=abcd efgh ijkl mnop`
   - E-maily odchádzajú priamo cez oficiálne Google servery (`smtp.gmail.com`) so stopercentnou doručiteľnosťou priamo do schránky klienta bez padania do spamu.
