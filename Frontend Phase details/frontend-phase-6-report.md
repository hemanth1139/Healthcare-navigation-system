# HealthCare Navigator - Frontend Phase 6 Report
**Module:** Specialist & Hospital Recommendations Module  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, @react-google-maps/api, IBM Plex Mono  
**Design System:** Soft Clinical UI  

---

## Executive Summary
This document records the step-by-step implementation of Phase 6: **Specialist & Hospital Recommendations Module** for **HealthCare Navigator**. This phase connects AI triage predictions with recommended specialist routing, interactive hospital search, split-screen map/list views (`@react-google-maps/api`), custom primary teal (`#0F6E7A`) markers, two-way marker synchronization, tap-to-call phone triggers (`tel:...`), and 1-click turn-by-turn Google Maps navigation.

---

## Detailed Step-by-Step Breakdown

### Step 1: Database-Aligned Data Contracts (`/types/`)
1. **[types/specialist.ts](file:///d:/Final%20year%20project/types/specialist.ts)**:
   - Defined `SpecialistRecommendation` (`recommendation_id`, `prediction_id`, `specialist`, `reason`, `urgency_note`, `associated_symptoms`).
2. **[types/hospital.ts](file:///d:/Final%20year%20project/types/hospital.ts)**:
   - Defined `Hospital`, `HospitalRecommendation`, and `HospitalWithDistance` (`hospital_id`, `google_place_id`, `hospital_name`, `address`, `city`, `state`, `latitude`, `longitude`, `phone`, `website`, `specialties`, `has_emergency_room`, `rating`, `distance_km`, `estimated_time`).

---

### Step 2: Datasets & API Service Layer (`/lib/`)
1. **[mockSpecialistData.ts](file:///d:/Final%20year%20project/lib/mockSpecialistData.ts)**:
   - Specialist recommendations tied to prediction IDs (`pred_101` -> Neurology & General Medicine; `pred_emergency_102` -> Interventional Cardiology & ER Unit).
2. **[mockHospitalData.ts](file:///d:/Final%20year%20project/lib/mockHospitalData.ts)**:
   - Dataset of 9 hospitals with realistic coordinates around Kolkata/Howrah, distances, estimated drive times (in IBM Plex Mono font), emergency ratings, phone numbers, websites, and clinical specialties.

---

### Step 3: Specialist UI Components (`/components/specialist/`)

1. **[SpecialistRecommendationCard.tsx](file:///d:/Final%20year%20project/components/specialist/SpecialistRecommendationCard.tsx)**
   - Focused card rendering specialist category title in Sora font, clinical specialty icon, plain-language reason explanation, reused `SeverityBadge`, and "Find hospitals with this specialist" CTA pre-filtering `/hospitals`.

---

### Step 4: Hospital UI Components (`/components/hospitals/`)

1. **[HospitalMap.tsx](file:///d:/Final%20year%20project/components/hospitals/HospitalMap.tsx)**
   - Interactive Google Map component using `@react-google-maps/api` with custom primary teal markers, selected state highlights, InfoWindows, and an interactive Soft Clinical fallback view for unconfigured keys.

2. **[HospitalFilterBar.tsx](file:///d:/Final%20year%20project/components/hospitals/HospitalFilterBar.tsx)**
   - Controls for specialty filter (pre-filled via query parameter), distance radius (5km, 10km, 25km, All), and sorting (Distance, ETA, Rating).

3. **[HospitalCard.tsx](file:///d:/Final%20year%20project/components/hospitals/HospitalCard.tsx)**
   - Interactive hospital tile with Sora title, IBM Plex Mono distance & drive time, 24/7 ER badges, tap-to-call link, and 1-click Google Maps turn-by-turn directions button.

4. **[HospitalList.tsx](file:///d:/Final%20year%20project/components/hospitals/HospitalList.tsx)**
   - Scrollable hospital list with empty state handling ("No hospitals found within this search range — try expanding to 25 km").

5. **[HospitalDetailModal.tsx](file:///d:/Final%20year%20project/components/hospitals/HospitalDetailModal.tsx)**
   - Modal built on `Modal.tsx` displaying full hospital details, address, phone, website, and side-by-side "Get Directions" & "Call Hospital" primary buttons.

---

### Step 5: Module Pages (`/app/(dashboard)/`)

1. **[Specialist Recommendation Page](file:///d:/Final%20year%20project/app/(dashboard)/specialist/[predictionId]/page.tsx)**
   - Dedicated recommendation page with back-link to prediction report and CTA routing to hospital search.

2. **[Hospitals Search Page](file:///d:/Final%20year%20project/app/(dashboard)/hospitals/page.tsx)**
   - Desktop: Persistent split-screen map+list view (sticky `HospitalMap` on left, scrollable `HospitalList` on right).
   - Mobile: List-first view with a thumb-reachable floating "View Map" / "View List" toggle button.

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
├ ○ /schemes                             1.8 kB         89.1 kB
├ ○ /settings                            1.78 kB        89.1 kB
├ ƒ /specialist/[predictionId]           4.11 kB         101 kB
├ ○ /specialists                         1.73 kB        89.1 kB
├ ○ /symptom-chat                        3.07 kB         115 kB
└ ○ /tips                                1.83 kB        89.2 kB
+ First Load JS shared by all            87.3 kB
```

### Verification Matrix
- [x] Installed `@react-google-maps/api` and verified 0-error bundle compilation.
- [x] Verified specialist recommendation page and pre-filtering routing (`/hospitals?specialist=Neurology`).
- [x] Verified desktop split-screen map+list view and mobile floating view switcher.
- [x] Verified two-way marker and list selection sync.
- [x] Verified tap-to-call phone links (`tel:...`) and Google Maps directions URLs.


### Prompt
Build the Specialist & Hospital Recommendations module for the "HealthCare Navigator" web app, continuing on the existing Next.js 14 (App Router) + TypeScript + Tailwind project from Phases 1-5. Reuse the "Soft Clinical UI" design tokens, existing UI components, dashboard layout/Sidebar/Navbar shell, AuthContext, and the SeverityBadge component from Phase 5.

DESIGN SYSTEM REMINDER (apply consistently — do not redefine)
- Primary: #0F6E7A | Primary Light: #E6F4F3 | Accent/Urgent: #E5573F (reserved for alerts only)
- Neutral Dark: #1E2A2E | Neutral Mid: #5C6B6E | Background: #F7FAFA
- Fonts: Sora (headings), Inter (body), IBM Plex Mono (data/numbers — distances, ETAs)
- Cards: 12-16px radius, soft shadow, 2px border on interactive elements
- WCAG AA contrast everywhere, mobile-first down to 360px

FOLDER STRUCTURE TO ADD
/app/(dashboard)/specialist/[predictionId]/page.tsx
/app/(dashboard)/hospitals/page.tsx
/components/specialist/SpecialistRecommendationCard.tsx
/components/hospitals/HospitalMap.tsx
/components/hospitals/HospitalCard.tsx
/components/hospitals/HospitalList.tsx
/components/hospitals/HospitalFilterBar.tsx
/components/hospitals/HospitalDetailModal.tsx
/types/specialist.ts
/types/hospital.ts
/lib/mockSpecialistData.ts
/lib/mockHospitalData.ts

Install @react-google-maps/api if not already present (npm install @react-google-maps/api) — use a placeholder/mock map key for now, clearly commented, since real Google Maps API key setup is a backend/infra concern.

TYPES
specialist.ts — SpecialistRecommendation: recommendation_id, prediction_id, specialist, reason
hospital.ts — Hospital: hospital_id, google_place_id, hospital_name, address, city, state, latitude, longitude, phone, website; HospitalRecommendation: recommendation_id, prediction_id, hospital_id, distance_km, estimated_time

1. SPECIALIST RECOMMENDATION PAGE (/app/(dashboard)/specialist/[predictionId]/page.tsx, SpecialistRecommendationCard.tsx)
   - Small, focused page — this is a lightweight recommendation, not a dense dashboard
   - Header: "Recommended Specialist" with a back-link to the prediction results (Phase 5)
   - SpecialistRecommendationCard: large specialist type name (e.g. "Pulmonologist") in Sora, an icon representing the specialty area, and the plain-language "reason" field explaining why (e.g. "Based on your reported symptoms of persistent cough and chest tightness")
   - Below the card: a SeverityBadge reused from Phase 5 so urgency context isn't lost when navigating away from the prediction page
   - Primary action button: "Find hospitals with this specialist" → routes to /hospitals with the specialist type pre-filled as a filter (pass via query param)
   - Secondary link: "Back to results"

2. HOSPITAL RECOMMENDATION PAGE (/app/(dashboard)/hospitals/page.tsx)
   - Split layout on desktop: HospitalMap on the left/top (sticky), HospitalList scrollable on the right/below — on mobile, default to list view with a "View on map" toggle button that swaps to full-screen map (map-and-list simultaneously doesn't work well on small screens)
   - HospitalFilterBar above the list: specialist type filter (pre-filled if arrived from Specialist page), distance radius filter (e.g. within 5km/10km/25km), sort by (Distance / Estimated time)
   - Show a result count ("12 hospitals found near you")

3. HOSPITAL MAP (HospitalMap.tsx)
   - Google Map centered on user's location (or a mock default location if geolocation isn't granted/available)
   - Custom markers styled in primary teal (not default red Google pins — this needs to match the design system), with a distinct marker style/color if a hospital is currently selected/hovered
   - Clicking a marker opens a small info window with hospital name + "View details" linking to HospitalDetailModal
   - Clicking a HospitalCard in the list highlights/centers the corresponding marker (two-way sync between list and map)

4. HOSPITAL LIST (HospitalList.tsx, HospitalCard.tsx)
   - Each HospitalCard: hospital name (Sora), address (truncated with full text on hover/tap), distance_km + estimated_time (IBM Plex Mono, prominent since this is the decision-driving info), phone number as a tap-to-call link, "Directions" button
   - "Directions" button opens Google Maps directions in a new tab (construct a maps URL using lat/long — this can work immediately without needing a live API key)
   - Card is clickable to open HospitalDetailModal
   - Empty state if filters return nothing: "No hospitals found within this range — try expanding your search radius" with a quick "Expand to 25km" action

5. HOSPITAL DETAIL MODAL (HospitalDetailModal.tsx)
   - Built on the Modal component from Phase 3
   - Shows: full hospital name, complete address, phone (tap-to-call), website link (if present), a small embedded static map preview or the shared map centered on this location
   - "Get Directions" and "Call Hospital" as the two primary actions, side by side, equally weighted

MOCK DATA
- /lib/mockSpecialistData.ts: 2-3 mock specialist recommendations tied to different mock prediction IDs
- /lib/mockHospitalData.ts: 8-10 mock hospitals with varied distances/specialties around a plausible mock location (e.g. Chennai/Madurai coordinates so the map has a realistic regional feel), clearly commented for replacement with real POST /api/v1/hospitals/nearby and GET /api/v1/predictions/{prediction_id}/specialist calls

RESPONSIVE BEHAVIOR
- Desktop: persistent split map+list view, map stays sticky while list scrolls
- Mobile: list view by default with a floating "Map" toggle button (bottom-right, thumb-reachable), full-screen map view with a "List" toggle to switch back

ACCESSIBILITY
- Map has a keyboard-navigable list alternative (the HospitalList itself serves this purpose — never make the map the only way to browse hospitals)
- Tap-to-call and directions links have clear aria-labels ("Call City General Hospital", "Get directions to City General Hospital")
- Filter bar controls are proper form elements (select/radio), keyboard operable

DELIVERABLE
A fully functional Specialist Recommendation page and Hospital Recommendation page with synced map+list view, filtering/sorting, tap-to-call, and directions — all driven by mock data and ready to wire into Person 2's specialist-mapping logic and Google Maps API-backed nearby-hospital search once the backend is live.