# Recipe Collector — Vision, Business Model & Product Roadmap 🚀

---

## 1. Core Product Vision & Design Philosophy

**Recipe Collector** is an editorial, distraction-free, and intelligent kitchen companion built for modern home cooks, busy families, and culinary enthusiasts.

### 🌟 Design Principles (Anti-Overwhelm & Purpose-Driven):
1. **Never Overwhelm the User:** Clean, Scandinavian-inspired editorial minimalism. Rich typography, ample whitespace, and focused interactions.
2. **Purpose Over Flash:** Every tool must solve a tangible problem (importing without ads, eliminating food waste, generating a clean grocery list). Zero useless gimmicks or bloated widgets.
3. **Utility-First + Frictionless Discovery:** Deliver instant value in the first 5 seconds before asking for any commitment.

---

## 2. Target Personas & The "Instant Taste Match" Hook 🎯

### A. The Target Personas
1. **"The Quick & Healthy Cook"** (Students, Young Professionals, Fitness):
   * Wants high-protein, fast (under 25 min), low-cleanup, and macro-friendly meals.
2. **"The Busy Family Planner"** (Parents, Households):
   * Wants kid-approved, balanced weekday meals, organized weekly calendar, and automated grocery lists.
3. **"The Budget & Zero-Waste Pragmatist"**:
   * Wants to use up leftovers on hand, maximize grocery discounts, and reduce food waste.
4. **"The Passionate Weekend Foodie / Home Chef"**:
   * Collects artisanal recipes from around the web, loves slow cooking, gourmet techniques, and clean presentation.

### B. The Landing Page Experience: "Taste Match" Micro-Filter ⚡
To prevent users from bouncing when seeing recipes that don't fit their lifestyle (e.g. non-vegetarians seeing only vegetarian dishes), the landing page introduces an **interactive, lightweight Persona/Vibe Switcher**:
* Tabs/Pills right under the Hero:
  * ⚡ *Quick & Easy (< 25 min)*
  * 🥩 *High Protein / Everyday Classic*
  * 👨‍👩‍👧 *Family Friendly*
  * 🥗 *Plant-Forward / Vegetarian*
  * 💰 *Budget & Leftovers*
* Clicking a tab **instantly adapts the recipe cards and recommendations**, giving the user a 100% relevant first impression with zero friction!

---

## 3. Monetization & Economic Realization 💰

How Recipe Collector turns from a high-quality product into a sustainable, profitable business:

### 1. Freemium "Pro Kitchen" Subscription ($3.99/mo or $29.99/yr)
* **Free Tier:**
  * Up to 25 saved recipes in cloud.
  * Basic URL importer.
  * Standard Pantry Leftover Matcher.
  * Weekly meal planner with grocery list.
* **Pro Tier:**
  * **Unlimited Cloud Recipes:** Save 10,000+ recipes without limits.
  * **AI Recipe Scanner (OCR):** Snap a photo of a cookbook page or handwritten grandma recipe ➔ converted to clean digital format instantly.
  * **AI Recipe Transformer:** Auto-convert foreign units (Cups ➡️ Grams/Dl) and AI ingredient substitution ("No sour cream? Use Greek yogurt").
  * **Shared Household / Family Sync:** Real-time multi-user syncing for pantry and grocery checklists.
  * **Smart Cost-to-Complete Engine:** Integration with supermarket weekly deals.

### 2. Smart Grocery Affiliate Partnerships
* 1-Click "Send Groceries to Cart" button (integrating with grocery delivery services like Mathem, ICA, Willys in Sweden, or Instacart internationally).
* We earn an affiliate commission per completed grocery basket with zero ads or tracking bloat.

### 3. Curated Chef & Creator Drops (No banner ads!)
* Verified food creators and chefs can publish exclusive digital recipe collections/meal plans with revenue-sharing.

---

## 4. Platform & Mobile App Strategy 📱

1. **Phase 1 (Web & PWA):**
   * Responsive Progressive Web App (PWA).
   * Installable directly on iOS & Android home screens with full-screen experience and zero App Store fees.
2. **Phase 2 (Native App via CapacitorJS):**
   * Wrap the Next.js/React codebase into native iOS and Android binaries.
   * Access to camera (for photo recipe scanning), lockscreen cooking timers, and push notifications.

---

## 5. Technical Infrastructure & Operating Costs ⚙️

| Service | Purpose | Cost at Start |
| :--- | :--- | :--- |
| **Domain** | Custom domain (`recipecollector.app` / `.io`) | ~$12 / year |
| **Frontend CDN** | **Vercel** Edge Network (Global CDN, SSL) | $0 / month (Free Tier) |
| **Database & Auth** | **Supabase** (PostgreSQL, Auth, Storage) | $0 / month (Up to 50k users) |
| **AI / Scraping APIs** | Cheerio + JSON-LD + Spoonacular / Gemini Flash | $0 / month (Free limits) |
| **Total Start Cost** | | **~$1 / month** |

---

## 6. Engineering Roadmap Towards 1.0 Launch 🛠️

### Phase 1: Database & Cloud Synchronization (Current Focus)
- [x] Supabase project setup, RLS security policies & PostgreSQL `recipes` schema.
- [x] Supabase Auth integration (Sign in, Sign up, Real-time session state).
- [x] Redesigned Navigation, User Avatar Dropdown, and Notion-style Auth Modal.
- [ ] Connect Recipe Creation (`/create`) & URL Import (`/import`) directly to Supabase.
- [ ] Connect Saved Recipes (`/saved`) to fetch from Supabase per logged-in user.
- [ ] Connect Weekly Planner (`/planner`) to Supabase.

### Phase 2: Personalization & Anti-Overwhelm Landing Experience
- [ ] Build the "Taste Match / Persona Switcher" on the home page for instant relevant browsing.
- [ ] Distinct logged-in Dashboard vs logged-out Discovery experience.
- [ ] Public Recipe Sharing (viewable via clean public link `/r/[id]`).

### Phase 3: PWA & Polish
- [ ] Add `manifest.json`, mobile touch icons, and offline caching.
- [ ] Performance audit & image optimization.
- [ ] Production deployment to Vercel.

---
*Last updated: 2026-08-18*
