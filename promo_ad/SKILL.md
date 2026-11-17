---
name: promo-ad
description: Generates high-converting viral 3D animation ad stories (Pixar/DreamWorks style) for DropBrief with 5 locked, sequential image prompts optimized for AI video animation (Kling, Runway, Luma).
argument-hint: "[generate|add-transcript|list]"
metadata:
  author: DropBrief
  version: "2.0.0"
---

# Promo Animation Ad Generator (DropBrief 3D Viral Engine)

Tento skill slúži na tvorbu virálnych krátkych videoreklamných príbehov (Reels, TikTok, Shorts v pomere 9:16) pre SaaS produkt **DropBrief** v 3D animovanom štýle moderných štúdií Pixar / DreamWorks.

Výsledné obrázky sú špeciálne formulované ako **kľúčové snímky (keyframes) pre následné AI animovanie** (Kling AI, Runway Gen-3, Luma Dream Machine, Pika, LivePortrait, Hedra).

---

## 🎭 Pravidlo postáv a prostredia (Per-Story Character Lock)

1. **Rôzne postavy naprieč príbehmi:**
   - Každé video môže mať inú postavu a iné pracovisko prispôsobené danej profesii (napr. webdizajnérka v presvetlenom lofte, video editor v tmavej strižni, vývojár pri kóderskom setupu, copywriterka v štúdiu).
2. **Prísny 100% LOCK v rámci daného 1 príbehu:**
   - V momente, keď sa pre daný príbeh definujú atribúty postavy (`CHARACTER DETAILS`, `OUTFIT`, `ENVIRONMENT & PROPS`, `LIGHTING & ATMOSPHERE`), **tieto atribúty musia ostať v každom z 5 promptov daného príbehu slovne identické.**
   - V jednotlivých scénach sa mení **LEN**:
     - `CAMERA & COMPOSITION` (uhol, záber, ohnisko).
     - `POSE & EXPRESSION` (emócia v tvári, gestá, pootvorené ústa na rozprávanie).
     - `DYNAMIC PROPS` (predmety v ruke: smartfón, káva, tablet, pero).

---

## 🎬 Optimalizácia promptov pre AI ANIMOVANIE (Image-to-Video)

Každý prompt musí spĺňať prísne technické kritériá pre čisté animovanie bez deformácií:
* **Zero Motion Blur:** Žiadne pohybové rozostrenie na tvári, očiach alebo prstoch (aby AI video model nedeformoval rysy).
* **Čistá separácia a Rim Lighting:** Výrazné obrysové svetlo (rim light) oddeľujúce vlasy a ramená od pozadia, čo uľahčuje modelu rozpoznať pohybujúcu sa postavu od statického pozadia.
* **Prirodzené kľúčové pózy (Keyframes):** Postava nie je v krkolomných pózach, ale v prirodzenej východiskovej polohe vhodnej na interpoláciu pohybu.
* **Pripravené na Lip-Sync / Voiceover:** Pootvorené ústa (mid-sentence) a živé oči v scénach, kde postava hovorí.

---

## ⏱️ Dvojfázový pracovný postup tvorby (Two-Phase Workflow)

### KROK 1: Kompletný virálny scenár (Story & Voiceover)
Najskôr sa vytvorí ucelený príbeh na základe virálnych transcriptov (`promo_ad/transcripts/`):
1. **Scéna 1 (0–3s) - Virálny Hook:** Absurdita, šokujúce otvorenie, zastavenie skrolovania.
2. **Scéna 2 (3–14s) - Eskalácia bolesti:** Frustrácia s klientom, ktorú pozná každý kreatívec.
3. **Scéna 3 (14–22s) - Bod zlomu (Epiphany):** Rozhodnutie ukončiť chaos a nastaviť si systém.
4. **Scéna 4 (22–32s) - Riešenie (DropBrief v akcii):** Predstavenie jednoduchej linky bez hesiel, kde klient nahrá všetko na 1 miesto.
5. **Scéna 5 (32–40s) - Úľava & Call to Action:** Uvoľnený freelancer, hotový projekt a výzva: *„Vyskúšaj si to sám cez odkaz v bio!“*

### KROK 2: Generovanie 5 locked promptov pre animáciu
Až po scenári sa vygeneruje 5 samostatných kódových blokov s promptami, ktoré si používateľ skopíruje jedným klikom do generátora obrázkov (Midjourney / Flux / Leonardo).

---

## 📂 Archív a kontrola unikátnosti
* Pred tvorbou nového príbehu AI vždy skontroluje existujúce súbory v `promo_ad/TEST/`.
* Nový príbeh nesmie opakovať už spracovaný problém (napr. ak je hotové logo vo Worde, ďalší príbeh rieši nekonečné zmeny zadania, ďalší neplatičov / nízky rozpočet, ďalší expirované linky a stratené fotky).
* Každý príbeh sa automaticky ukladá do `promo_ad/TEST/story_XXX_<nazov_temy>.md`.
