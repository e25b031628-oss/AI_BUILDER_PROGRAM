# 🛒 Smart Cart — AI-Enhanced Grocery Delivery App

**Smart Cart** is a full-stack grocery delivery web app built solo in a bootcamp/hackathon setting. It combines a complete e-commerce shopping flow with a layer of practical, low-risk AI automation — smart search, AI-generated recipe shopping lists, auto-tagging, and out-of-stock substitutions — all built to survive a live demo even if any single AI call fails.

> 🔗 **Live Demo:** [ADD DEPLOYED VERCEL URL HERE]

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [AI Features — How They Work](#-ai-features--how-they-work)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Data Model](#-data-model)
- [The Build Journey](#-the-build-journey)
- [Known Limitations](#-known-limitations)
- [Roadmap](#-roadmap)

---

## 🌱 Overview

Smart Cart lets a shopper sign up, browse a categorized grocery catalog (180+ real-world products across vegetables, fruits, dairy, pulses, grains, millets, spices, snacks, beverages, and household items), search using plain-language queries, generate a shopping list from a dish name, manage a cart with budget tracking, and check out using a saved profile — no repeated forms.

The core design principle throughout the build: **every AI feature is additive, never load-bearing.** If an AI call fails or times out, the app falls back gracefully (keyword search instead of smart search, a safe default substitute, a clear error message) — the core shopping flow (browse → cart → checkout → order) never depends on an external API succeeding.

---

## ✨ Features

### Core Shopping Flow
- Email/password signup & login with **email verification** (unverified accounts are blocked from the shopping flow, with a **resend verification email** option)
- Password reset via real email (Firebase Auth) — from the Profile page
- Combined **Login / Sign Up entry point** (`/get-started`) so returning and new users always land in the right place, including after logout
- Product catalog with dedicated **category pages** (not one long mixed list), each with a "← Back to Home" link
- Keyword search with quantity-aware cart (add-to-cart uses a +/- stepper that sets the exact quantity, not repeated clicks)
- Cart with live subtotal, quantity editing, and item removal
- **Budget Guard** — set a spending limit, see a live progress bar, get an over-budget warning
- Checkout that pulls delivery details automatically from the user's saved **Profile** — no repeated address forms
- Order history with full order details and **Reorder in One Tap**
- **Profile page** — display name, phone, address, avatar picker, password reset

### AI-Powered Features (tagged `✨ Powered by AI` in the UI)
- **Smart Search** — natural-language product search ("something to drink") matched against actual product names, not just categories
- **Recipe to Cart** ⭐ — type a dish name, get a validated ingredient list, and add matched products to your cart in one batch
- **Auto-Tagging** — products are automatically tagged (`Healthy`, `Snack`, `Breakfast`, etc.) and flagged with an Eco/Health badge
- **Smart Substitution** — when an item is out of stock, the app suggests the closest in-stock alternative from the same category

---

## 🤖 AI Features — How They Work

Every AI-backed route follows the same defensive pattern:

```
User action → API route → callAI() (shared service) → validate response → success or graceful fallback
```

| Feature | Route | Fallback if AI fails |
|---|---|---|
| Smart Search | `/api/ai/smart-search` | Plain keyword search |
| Recipe to Cart | `/api/ai/recipe-to-cart` | Curated known-dish list validates input before any AI call is made at all |
| Auto-Tagging | `/api/ai/auto-tag` | Products keep their category as the only label |
| Smart Substitution | `/api/ai/substitute` | Rule-based fallback: first in-stock item in the same category |

**Recipe to Cart**, the flagship feature, validates the dish name against a curated list of 150+ known Indian and international dishes *before* ever calling the AI — this means non-dish input (like a random word) is rejected instantly, with zero wasted API calls, and only genuine dish names trigger ingredient generation and product matching.

---

## 🧱 Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (email/password + email verification + password reset) |
| AI | Anthropic API via a shared `ai_service.ts` module |
| Hosting | Vercel |
| Dev workflow | Live-coded with GitHub Copilot inside VS Code |

---

## 🗂 Project Structure

```
smart-cart/
├── app/
│   ├── page.tsx                        # Home: search, Recipe to Cart, category tiles, product sections
│   ├── layout.tsx                      # Root layout, wraps app in Navbar + CartProvider
│   ├── get-started/page.tsx            # Combined login/signup entry point
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── cart/page.tsx                   # Cart, quantity editing, Budget Guard, checkout link
│   ├── checkout/page.tsx               # Profile-based checkout, order creation
│   ├── orders/page.tsx                 # Order history + Reorder in One Tap
│   ├── profile/page.tsx                # Name, phone, address, avatar, password reset
│   ├── category/[slug]/page.tsx        # Dedicated per-category product listing
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── Tag.tsx                     # Reusable badge component (tags, status, AI labels)
│   └── api/
│       ├── ai/
│       │   ├── smart-search/route.ts
│       │   ├── recipe-to-cart/route.ts
│       │   ├── auto-tag/route.ts
│       │   └── substitute/route.ts
│       ├── seed-products/route.ts          # One-time catalog seed scripts
│       ├── seed-products-v2/route.ts
│       └── update-unbranded-images/route.ts
├── lib/
│   ├── firebase.js                     # Firebase app init (auth, db, storage)
│   ├── ai_service.ts                   # Shared, timeout-protected AI call wrapper
│   └── CartContext.tsx                 # Cart state (add/remove/update/clear)
├── .env.local                          # API keys (not committed)
└── README.md
```

---

## 🚀 Getting Started

```bash
# 1. Clone and install
git clone <repo-url>
cd smart-cart
npm install

# 2. Add environment variables (see below)
cp .env.example .env.local

# 3. Run locally
npm run dev
# → http://localhost:3000

# 4. Before every deploy, always run a production build locally first:
npm run build
```

### First-time setup checklist
1. Create a Firebase project → enable Email/Password Authentication → create a Firestore database.
2. Add your Firebase config values to `lib/firebase.js`.
3. Add your Anthropic API key to `.env.local`.
4. Visit `/api/seed-products` then `/api/seed-products-v2` once locally to populate the product catalog.
5. Visit `/api/ai/auto-tag` once to backfill product tags.

---

## 🔑 Environment Variables

```
ANTHROPIC_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

`.env.local` is git-ignored — never commit real keys.

---

## 🗃 Data Model (Firestore)

```
users/{uid}
  displayName, phone, address, avatarSeed, email (read-only)

products/{id}
  name, category, price, stock, imageUrl, tags[], ecoHealthTag

cart_items (client-side state, via CartContext)
  productId, name, price, quantity

orders/{id}
  userId, items[], totalAmount, status, createdAt, deliveryInfo
```

---

## 🧭 The Build Journey

This project was built solo, from an empty folder to a deployed, AI-integrated app, in a single bootcamp sprint — live-coded with GitHub Copilot inside VS Code, with each feature planned, built, and tested before moving to the next.

**Phase 1 — Foundation:** Next.js + Firebase setup, authentication, first product listing pulling live data from Firestore.

**Phase 2 — Core Commerce Loop:** search, cart, checkout, order history, and dedicated category pages — deployed early and re-verified on the live URL, not just localhost, to catch hosting issues while there was still time to fix them.

**Phase 3 — AI Automation Layer:** built one AI feature at a time, each wrapped in its own isolated, fallback-protected API route — smart search, auto-tagging, and the flagship **Recipe to Cart** feature, which went through several real iterations (initial category-matching approach → rebuilt as product-level keyword matching after testing revealed it was too loose → added a curated dish-validation list after discovering the AI would generate ingredients for literally any input, including a person's name).

**Along the way:** a Firestore composite-index error broke Order History for a session and was traced using browser DevTools; a currency mismatch (USD → INR) was caught and fixed app-wide; a quantity-stepper bug that *added* instead of *set* cart quantities was caught through hands-on testing and fixed; and a silent TypeScript build error in an early seed script blocked Vercel deployments for several days before being diagnosed by comparing a local production build against the live build logs.

**Final polish:** a Profile system replaced a repeated checkout form, Budget Guard was added to the cart, the product catalog was expanded from 11 to 180+ items, and a full UI density pass unified the home and category pages. The last mile focused on real-world auth edge cases: email verification with a resend option, proactive spam-folder messaging, and fixing logout to route back to a combined login/signup page instead of a login-only dead end.

---

## ⚠️ Known Limitations

- Product images are a mix of real product photos and category-appropriate stock/generated placeholders — not every branded item has its true packaging photo (documented trade-off, not a bug).
- Recipe-to-product ingredient matching uses simple substring logic, so close synonyms (e.g. "tomatoes" vs "Tomato 1kg") can occasionally miss — acceptable for demo purposes.
- Budget Guard's budget value is session-only (not persisted to the database).
- Email verification checks that an email is **syntactically valid**, not that the mailbox actually exists — this is standard behavior for all email systems, not a gap specific to this app. A fake/typo'd email simply results in an account permanently stuck at the verification wall, unable to access the shopping flow.
- Firebase's free (Spark) tier has a daily cap on outgoing auth emails (verification + password reset combined) — heavy testing in a single day can temporarily exhaust this quota; it resets after 24 hours.

---

## 🛣 Roadmap

- Real payment gateway integration
- Delivery partner tracking
- ONDC network integration
- Loyalty / subscription tier
- Multi-vendor / dark-store expansion using the existing schema
- Automated low-stock/sale email or SMS alerts (n8n-based workflow)

---

## 🙌 Credits

Built solo as a bootcamp project. Live-coded with **GitHub Copilot**, with **Claude** as a planning, debugging, and architecture partner throughout the build.
