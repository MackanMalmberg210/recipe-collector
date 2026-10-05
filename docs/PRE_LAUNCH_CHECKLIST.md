# 📋 Recipe Collector — Pre-Launch Checklist & Backlog

Detta dokument samlar alla krav, kontroller och förbättringar som ska genomföras innan skarp lansering av webb- och appversionen.

---

## 🔒 1. Säkerhet, Kvalitet & DevOps (Pre-Deployment)
- [ ] **Checka genomgångsvideor:** Se referensvideor och checklistor för vad som ska göras inför skarp produktionsdriftsättning.
- [ ] **GitHub Security & Quality:**
  - Granska [GitHub Security & Quality](https://github.com/MackanMalmberg210/recipe-collector/security) (Code scanning, Dependabot alerts, Secret scanning).
- [x] **Säkerhetsgranskning av källkod & API:er:**
  - `pnpm audit --prod` verifierad med 0 sårbarheter i produktionsberoenden.
  - Verifierat API-routes: Rate limiting (sliding window per IP på auth, import, vision, translate), strikt payload-begränsning och input-sanering.
  - Säkerställ att Supabase Row Level Security (RLS) är 100 % tätt för alla tabeller (`recipes`, `pantry_items`, `grocery_items`, `user_profiles`).
- [x] **Web Analytics:**
  - Aktiverat och konfigurerat `@vercel/analytics` och `@vercel/speed-insights` i `src/app/layout.tsx` för integritetsvänlig besöksstatistik och realtidsmätning av Core Web Vitals utan cookies.
- [x] **Automatiska tester:**
  - Vitest-svit uppsatt med 35 tester (100 % pass) för kärnlogik och edge cases:
    - Skafferimatchning & synonymhantering (`tests/pantryMatcher.test.ts`).
    - Enhets- och ingrediensparsning (`tests/ingredientParser.test.ts`).
    - Kulinarisk texthantering & sanitering (`tests/culinaryTextSanitizer.test.ts`).
    - Inköpslistans beräkningar, sammanfogning & kluster (`tests/groceries.test.ts`).
    - Måltidsplanerarens slot-validering, kaloriberäkningar och smart autoschema (`tests/planner.test.ts`).

---

## 🛠️ 2. Funktioner & Administration
- [x] **Admin View:**
  - Bygga en dedikerad adminpanel för att hantera receptdatabasen, inskickade recept, flaggningar och se användarstatistik.
- [x] **Guest vs Logged In-arbetsflöden:**
  - Noggrann testning av övergången från gästsession (localStorage) till inloggad användare (Supabase Cloud Sync).
  - Säkerställ att inget lokalt skapat recept eller inköpslista försvinner vid inloggning.
- [x] **"How did your recipe turn out?" (Eget bildgalleri):**
  - Möjlighet för användaren att ladda upp egna bilder på det färdiga resultatet direkt på ett recept.
- [x] **Supabase Storage Bucket för bilder (`recipe-media`):**
  - Skapa bucket med uppladdningspolicy (RLS) och automatisk WebP-komprimering via `imageCompressor.ts` så att användarbilder sparas på CDN och inte i localStorage/databaskolumner.
- [x] **Receptkatalog:**
  - Utökat startkatalogen med 8 nya distinkta rätter (Toast Skagen, Tagine, Smash Burgers, Thai Green Curry, Chili con Carne, Chicken Katsu Curry, m.fl.) till totalt 34 kurerade rätter.
  - Samtliga 34 recept har nu fullständiga näringsvärden och makroprofiler (protein, kolhydrater, fett, mättat fett, fiber, natrium).
- [ ] **Betalning / Pro Membership:**
  - Sätta upp betalningslösning (Stripe Customer Portal eller LemonSqueezy) för prenumeration på Pro Tier.
- [ ] **Custom SMTP för E-post & Auth:**
  - Koppla in professionell e-posttjänst (t.ex. Resend / Postmark) med egen domän (`noreply@recipecollector.app`) för omedelbar leverans av verifieringsmail och lösenordsåterställning.
- [x] **Export & Data Portability:**
  - Möjlighet att exportera recept (JSON / PDF) så användare äger sin data.
  - Utskriftsvänlig vy (`@media print`) för att kunna skriva ut recept snyggt på ett A4 utan menyer och knappar.

---

## 🌐 3. SEO, Social Delning & Juridik (Growth & Compliance)
- [x] **Google Recipe Schema (`schema.org/Recipe` JSON-LD):**
  - Injicera strukturerad data på alla `/recipes/[id]` för att få Googles rika receptkort i sökresultaten med bild, stjärnor, tillagningstid och kalorier.
- [x] **Dynamiska OpenGraph & Twitter Cards:**
  - Generera automatiska sociala förhandsvisningsbilder (`og:image`) och metadata så att länkar som delas på WhatsApp, iMessage, Instagram eller Facebook blir snygga klickbara kort.
- [x] **Sitemap & Robots:**
  - Skapa dynamisk `sitemap.ts` och `robots.ts` för automatisk Google-indexering.
- [x] **Juridik & GDPR (Integritet & Villkor):**
  - Skapa Användarvillkor (Terms of Service) och Integritetspolicy (Privacy Policy).
  - Skapa "Radera mitt konto och all min data" (GDPR Right to be Forgotten) under Inställningar.
  - Cookie-information / banner vid behov.
  - [ ] **E-postadresser i villkor & integritetspolicy:** Byt ut placeholders (`privacy@recipecollector.app`, `legal@recipecollector.app`) i `/terms` och `/privacy` till den faktiska kontakt-/supportmailen så fort domänen och SMTP är uppsatta.
- [x] **Globala felsidor (`not-found.tsx` & `error.tsx`):**
  - Vänliga och snygga 404/500-sidor med vägledning tillbaka till receptsamlingen.

---

## 🎨 4. Design & Temaharmonisering
- [x] **Behåll & förfina det Varma Mörka Temat (Smoked Oak / Walnut / Amber):**
  - **Beslut:** Deep Slate / Obsidian Bento testades och förkastades som för kallt och inte passande för en trevlig, aptitlig receptapp. Det varma mörka temat (`#12100e`, valnöt, bärnsten och varm linne) behålls och skyddas.
- [ ] **Kontrast- och tillgänglighetsgranskning (WCAG AA):**
  - Systematisk genomgång av alla modaler, badges, chips och knappar i både ljust och mörkt läge för optimal kontrast och läsbarhet mot den varma mörka bakgrunden.
- [x] **Enhetlig orange knappdesign i Mörkt Tema:**
  - Säkerställ att alla orangea knappar använder den korrekta, djupa bärnstensgradienten (`dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:text-stone-950 dark:border-amber-600/50`) istället för platt kanariegult.

---

## 🚀 5. Marknadsföring, Monetization & Lansering
- [ ] **Annonser / Partnerskap:**
  - Utreda annonsmöjligheter (icke-påträngande sponsrade ingredienser/kurerade produkter) och affiliatesamarbeten (t.ex. 1-klicks-inköp via Mathem/ICA/Willys).
- [ ] **Marknadsföringsstrategi & Outreach:**
  - Identifiera kanaler (matkreatörer, TikTok/Reels, SEO för receptsidor, mat-communities).
- [ ] **Mobilapplikation (iOS & Android):**
  - Paketera webbapplikationen via CapacitorJS eller PWA för publicering i App Store och Google Play.
- [x] **Offline-läge i matbutiken ("Supermarket Mode"):**
  - Dedikerat fullskärmsbutiksläge med stora träffytor för enhandshantering, Screen Wake Lock (håller skärmen tänd) och automatisk offline/online-synkning mot Supabase vid återkoppling.
