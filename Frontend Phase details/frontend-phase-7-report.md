# HealthCare Navigator - Frontend Phase 7 Report
**Module:** Government Healthcare Schemes & Subsidies Module  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, IBM Plex Mono  
**Design System:** Soft Clinical UI  

---

## Executive Summary
This document records the step-by-step implementation of Phase 7: **Government Healthcare Schemes & Subsidies Module** for **HealthCare Navigator**. This phase provides RAG-driven natural language eligibility queries, confidence scoring in IBM Plex Mono font, source document citations (`EvidenceSourceList`), browsable scheme directories with department filtering, and detailed scheme pages with scoped eligibility queries.

---

## Detailed Step-by-Step Breakdown

### Step 1: Database-Aligned Data Contracts (`/types/scheme.ts`)
- **[types/scheme.ts](file:///d:/Final%20year%20project/types/scheme.ts)**:
  - Defined `GovernmentScheme`, `SchemeQuery`, and `RetrievedChunk` TypeScript interfaces matching the project DB schema (`scheme_id`, `scheme_name`, `department`, `eligibility`, `benefits`, `official_url`, `last_updated`, `user_question`, `ai_response`, `retrieved_chunks`, `confidence_score`).

---

### Step 2: Schemes Dataset & RAG Query Handler (`/lib/mockSchemeData.ts`)
- **[mockSchemeData.ts](file:///d:/Final%20year%20project/lib/mockSchemeData.ts)**:
  - Dataset of 8 Indian central and state government schemes (Ayushman Bharat PM-JAY, Pradhan Mantri Surakshit Matritva Abhiyan, Ayushman Vaya Vandana Senior Care, CGHS, CMCHIS Tamil Nadu, Swasthya Sathi West Bengal, National Dialysis Program, Janani Suraksha Yojana).
  - Simulated RAG eligibility query handler (`querySchemeEligibility`) generating high-confidence matches (e.g. 92% for 70+ senior citizens) and low-confidence matches (e.g. 42% for cosmetic exclusions).

---

### Step 3: Scheme UI Components (`/components/schemes/`)

1. **[SchemeQueryPanel.tsx](file:///d:/Final%20year%20project/components/schemes/SchemeQueryPanel.tsx)**
   - RAG question box with prompt chips for rapid testing, loading feedback during retrieval, and keyboard `Enter` submission.

2. **[EligibilityResultCard.tsx](file:///d:/Final%20year%20project/components/schemes/EligibilityResultCard.tsx)**
   - RAG answer synthesis card displaying quoted user question, main response, IBM Plex Mono confidence score, `EvidenceSourceList`, and non-dismissible government disclaimer.

3. **[EvidenceSourceList.tsx](file:///d:/Final%20year%20project/components/schemes/EvidenceSourceList.tsx)**
   - Collapsible list displaying retrieved document chunks, excerpts, `aria-expanded` attributes, and external links to official portals.

4. **[SchemeFilterChips.tsx](file:///d:/Final%20year%20project/components/schemes/SchemeFilterChips.tsx)**
   - Interactive category pills (All, Central Government, State Government, Health Ministry, Senior Care, Maternal Health).

5. **[SchemeSearchBar.tsx](file:///d:/Final%20year%20project/components/schemes/SchemeSearchBar.tsx)**
   - Keyword search bar for filtering directory results.

6. **[SchemeCard.tsx](file:///d:/Final%20year%20project/components/schemes/SchemeCard.tsx)**
   - Directory card displaying scheme title in Sora font, department badge, coverage amount, truncated benefits summary, and last updated timestamp.

7. **[SchemeList.tsx](file:///d:/Final%20year%20project/components/schemes/SchemeList.tsx)**
   - Responsive 2-3 column grid rendering `SchemeCard`s with empty search state handling.

---

### Step 4: Module Pages (`/app/(dashboard)/schemes/`)

1. **[Schemes Landing Page](file:///d:/Final%20year%20project/app/(dashboard)/schemes/page.tsx)**
   - Features top `SchemeQueryPanel`, inline `EligibilityResultCard` expansion, `SchemeFilterChips`, `SchemeSearchBar`, and `SchemeList`.

2. **[Scheme Detail Page](file:///d:/Final%20year%20project/app/(dashboard)/schemes/[schemeId]/page.tsx)**
   - Detail view with readable ~65ch line length, separated "Eligibility Guidelines" and "Scheme Benefits" sections, outbound official link, and scoped mini-query panel.

---

## Verification & Build Log

### Production Build Command
```bash
npm run build
```

### Build Result
```
  ▲ Next.js 14.2.35

   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
 ✓ Generating static pages (21/21)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    2.44 kB         108 kB
├ ○ /_not-found                          873 B          88.2 kB
├ ○ /chat                                3.07 kB         115 kB
├ ƒ /chat/[conversationId]               6.35 kB         127 kB
├ ○ /dashboard                           7.26 kB         122 kB
├ ○ /forgot-password                     4.99 kB         148 kB
├ ○ /hospitals                           42.8 kB         130 kB
├ ○ /login                               2.24 kB         149 kB
├ ○ /predictions                         4.36 kB         101 kB
├ ƒ /predictions/[predictionId]          115 kB          212 kB
├ ○ /profile                             10.9 kB         136 kB
├ ○ /profile/edit                        5.83 kB         130 kB
├ ○ /records                             1.78 kB        89.1 kB
├ ○ /register                            3.03 kB         150 kB
├ ○ /reset-password                      2.13 kB         149 kB
├ ○ /schemes                             2.49 kB         107 kB
├ ƒ /schemes/[schemeId]                  2 kB            106 kB
├ ○ /settings                            1.78 kB        89.1 kB
├ ƒ /specialist/[predictionId]           4.11 kB         101 kB
├ ○ /specialists                         1.73 kB        89.1 kB
├ ○ /symptom-chat                        3.07 kB         115 kB
└ ○ /tips                                1.83 kB        89.2 kB
+ First Load JS shared by all            87.3 kB
```

### Verification Matrix
- [x] Verified 0-error Next.js production build for all 21 routes.
- [x] Verified RAG query panel and synthesized answer card with IBM Plex Mono confidence scores.
- [x] Verified collapsible `EvidenceSourceList` and official government portal links.
- [x] Verified directory category filtering, keyword search, and scheme detail pages.
- [x] Verified low-confidence warning framing for non-covered cosmetic queries.


### prompt 
Build the Government Healthcare Schemes module for the "HealthCare Navigator" web app, continuing on the existing Next.js 14 (App Router) + TypeScript + Tailwind project from Phases 1-6. Reuse the "Soft Clinical UI" design tokens, existing UI components, dashboard layout/Sidebar/Navbar shell, and AuthContext.

DESIGN SYSTEM REMINDER (apply consistently — do not redefine)
- Primary: #0F6E7A | Primary Light: #E6F4F3 | Accent/Urgent: #E5573F (reserved for alerts only)
- Neutral Dark: #1E2A2E | Neutral Mid: #5C6B6E | Background: #F7FAFA
- Fonts: Sora (headings), Inter (body), IBM Plex Mono (data/numbers)
- Cards: 12-16px radius, soft shadow, 2px border on interactive elements
- WCAG AA contrast everywhere, mobile-first down to 360px

FOLDER STRUCTURE TO ADD
/app/(dashboard)/schemes/page.tsx                 (search & browse schemes)
/app/(dashboard)/schemes/[schemeId]/page.tsx       (scheme detail + eligibility result)
/components/schemes/SchemeSearchBar.tsx
/components/schemes/SchemeCard.tsx
/components/schemes/SchemeList.tsx
/components/schemes/SchemeQueryPanel.tsx
/components/schemes/EligibilityResultCard.tsx
/components/schemes/EvidenceSourceList.tsx
/components/schemes/SchemeFilterChips.tsx
/types/scheme.ts
/lib/mockSchemeData.ts

TYPES (types/scheme.ts) — match the project's DB schema
- GovernmentScheme: scheme_id, scheme_name, department, eligibility, benefits, official_url, last_updated
- SchemeQuery: query_id, conversation_id, scheme_id, user_question, ai_response, retrieved_chunks, confidence_score

1. SCHEME SEARCH & BROWSE PAGE (/app/(dashboard)/schemes/page.tsx)
   - Page header: "Government Healthcare Schemes" with a short explainer line: "Find schemes you may be eligible for based on your health profile or ask a specific question"
   - SchemeQueryPanel at the top — this is the RAG-driven feature, so it deserves top billing over passive browsing:
     - A text input styled like a question box (not a generic search bar): placeholder "Ask about a scheme, e.g. 'Am I eligible for Ayushman Bharat?'"
     - Submit button, loading state while "querying" (mocked delay)
     - On submit, route to a results view showing EligibilityResultCard (see below) — can be inline on this same page (expand below the query box) rather than a full navigation, since users may ask multiple questions in a row
   - Below the query panel: "Browse All Schemes" section with SchemeFilterChips (filter by department — e.g. Central Government, State Government, Health Ministry) and SchemeSearchBar for plain keyword search
   - SchemeList renders SchemeCard results below

2. SCHEME CARD (SchemeCard.tsx, SchemeList.tsx)
   - Compact card: scheme_name (Sora, medium weight), department as a small eyebrow label, one-line truncated benefits summary, last_updated shown small and muted (e.g. "Updated Mar 2026") so users can judge freshness
   - Entire card clickable, routes to /schemes/[schemeId]
   - Empty state for no search/filter results: "No schemes match your search — try a different department or keyword"

3. SCHEME DETAIL PAGE (/app/(dashboard)/schemes/[schemeId]/page.tsx)
   - Full scheme_name as page heading, department as subtitle
   - Two clearly separated sections: "Eligibility" and "Benefits" (both from the scheme's stored TEXT fields) — use clear section headers, readable line-length (don't let body text stretch full-width on desktop, cap at ~65ch)
   - "Official Source" link (official_url) styled as an outbound link with an icon indicating it leaves the app
   - last_updated shown near the top, small and muted
   - Bottom action: "Ask about your eligibility for this scheme" — a mini version of SchemeQueryPanel scoped to just this scheme, so a user can ask "Does my income qualify me?" and get a scheme-specific answer

4. ELIGIBILITY RESULT CARD (EligibilityResultCard.tsx)
   - This is the RAG output — the design needs to make clear this is a generated answer citing sources, not an official ruling
   - Header row: the user's original question (user_question) shown as a quiet quoted line, then the ai_response as the main readable answer text
   - A small confidence indicator (reuse a compact version of the confidence-bar pattern from Phase 5's DiseaseConfidenceList) — labeled plainly, e.g. "Match confidence: 78%"
   - EvidenceSourceList below the answer: renders retrieved_chunks as a collapsed-by-default "View sources" expandable section — listing which scheme document(s) the answer was drawn from, each linking to that scheme's official_url
   - A permanently visible disclaimer strip (reuse the pattern from Phase 5's PredictionDisclaimer): "This is an AI-generated summary to help you understand your options. Confirm final eligibility with the official scheme department before applying." — same neutral, non-alarming styling as the medical disclaimer, for consistency across the app
   - If confidence is low (mock a low-confidence variant), show a softer framing: "We couldn't find a strong match — here's the closest information we found" rather than presenting it with false confidence

5. EVIDENCE SOURCE LIST (EvidenceSourceList.tsx)
   - Collapsible list, each item: scheme name + a short excerpt of the retrieved chunk (truncated, "..." with expand), link icon to the official source
   - Chevron/expand icon clearly indicates collapsed vs expanded state

MOCK DATA
- /lib/mockSchemeData.ts: 8-10 mock government schemes (mix of central/state, varied departments — e.g. Ayushman Bharat-style, a maternal health scheme, a senior citizen scheme) with realistic eligibility/benefits text
- 2-3 mock SchemeQuery results: one high-confidence match, one low-confidence match, to demonstrate both EligibilityResultCard states
- Clearly commented as MOCK_DATA, structured to match GET /api/v1/schemes, GET /api/v1/schemes/{scheme_id}, and POST /api/v1/schemes/query

RESPONSIVE BEHAVIOR
- Desktop: SchemeQueryPanel full width at top, browse results in a 2-3 column card grid below
- Mobile: everything single column, query panel remains prominent and full-width, EvidenceSourceList collapses by default to save space

ACCESSIBILITY
- Expandable sections (EvidenceSourceList, truncated excerpts) use proper aria-expanded state
- Confidence indicator has a text equivalent, not just a visual bar
- Outbound official links have aria-label indicating they open external government sites

DELIVERABLE
A fully functional Government Schemes module: a RAG-style question/answer panel with confidence indicator and source citations, a browsable/filterable scheme list, and detailed scheme pages with scoped eligibility queries — all driven by mock data (including a low-confidence variant) and ready to wire into Person 2's LangChain + ChromaDB RAG pipeline once it's live.