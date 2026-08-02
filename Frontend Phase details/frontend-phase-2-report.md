# HealthCare Navigator - Frontend Phase 2 Report
**Module:** Dashboard & Navigation Shell  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons  
**Design System:** Soft Clinical UI  

---

## Executive Summary
This document records the step-by-step implementation of Phase 2: **Dashboard & Navigation Shell** for **HealthCare Navigator**. This phase builds a responsive, accessible layout shell wrapping all authenticated clinical pages, complete with a collapsible desktop sidebar, a dynamic top navbar, a mobile-native bottom tab bar with slide-out drawer, user menu popovers, mock data layer, and a rich Dashboard landing page.

---

## Detailed Step-by-Step Breakdown

### Step 1: Mock Data Layer (`/lib/mockData.ts`)
- **[mockData.ts](file:///d:/Final%20year%20project/lib/mockData.ts)**:
  - Created TypeScript interfaces: `HealthStatusSummary`, `QuickActionItem`, `ActivityItem`, `HealthTipItem`, and `DashboardData`.
  - Built `MOCK_DASHBOARD_DATA` object matching the future `/api/v1/dashboard` response shape.
  - Included realistic clinical triage logs, emergency alerts status, preventive health tips, and quick navigation actions.

---

### Step 2: Core Layout Components (`/components/layout/`)

1. **[UserMenu.tsx](file:///d:/Final%20year%20project/components/layout/UserMenu.tsx)**
   - Popover dropdown menu triggered from user avatar in Navbar and Sidebar.
   - Displays user avatar initials, full name, email, and HIPAA verified badge.
   - Menu options: Patient Profile (`/profile`), Account Settings (`/settings`), Help & Support (modal alert), and Sign Out (`logout()`).
   - Handles outside click listener (`mousedown`) and keyboard `Escape` dismissals.

2. **[Sidebar.tsx](file:///d:/Final%20year%20project/components/layout/Sidebar.tsx)**
   - Fixed left sidebar for `md+` screens, collapsible to icon-only mode with collapse toggle button.
   - HealthCare Navigator branding at top.
   - 10 Navigation items with icons: Dashboard, Patient Profile, Symptom Chat, Predictions & History, Specialists, Hospitals, Government Schemes, Medical Records, Health Tips, and Settings.
   - Active route visual indicator: 4px solid primary teal left border (`#0F6E7A`) + light teal background fill (`#E6F4F3`) + font weight accent.
   - Bottom profile container housing the `UserMenu` trigger.

3. **[Navbar.tsx](file:///d:/Final%20year%20project/components/layout/Navbar.tsx)**
   - Sticky top bar across dashboard routes with glassmorphism backdrop blur.
   - Left: Mobile hamburger menu toggle + dynamic page title reflecting active route.
   - Right: Language selector dropdown (English, Hindi, Bengali, Spanish), notification bell with unread badge counter, and `UserMenu` trigger.

4. **[MobileNav.tsx](file:///d:/Final%20year%20project/components/layout/MobileNav.tsx)**
   - Mobile-native **Bottom Tab Bar** (screens `sm` and below) for 5 core items (Dashboard, Symptom Chat, Predictions, Hospitals, Profile) + "More" tab button.
   - Slide-out drawer displaying all 10 clinical module links with backdrop blur overlay and automatic route-change closure.

---

### Step 3: Dashboard Landing Page Components (`/components/dashboard/`)

1. **[QuickActionCard.tsx](file:///d:/Final%20year%20project/components/dashboard/QuickActionCard.tsx)**
   - Interactive card component for quick action CTAs.
   - "Start Symptom Check" featured as the primary card with gradient primary background, custom icon, and hover elevation.

2. **[StatusSummaryCard.tsx](file:///d:/Final%20year%20project/components/dashboard/StatusSummaryCard.tsx)**
   - Displays patient's active health summary.
   - Color-coded severity badge (urgent `#E5573F` reserved strictly for emergency alerts; `#0F6E7A` for normal/all-clear state).

3. **[RecentActivityList.tsx](file:///d:/Final%20year%20project/components/dashboard/RecentActivityList.tsx)**
   - List of recent patient interactions (triage assessments, document uploads, consultations, scheme checks) with timestamps and view links.

---

### Step 4: Protected Dashboard Layout & Routing (`/app/(dashboard)/`)

1. **[Dashboard Layout Shell](file:///d:/Final%20year%20project/app/(dashboard)/layout.tsx)**
   - Protected layout wrapping all dashboard routes with AuthGuard redirection to `/login`.
   - Full-page branded loading state with animated medical heart icon while resolving authentication status.
   - Composes Sidebar + Navbar + MobileNav + scrollable main content container.

2. **[Dashboard Home Page](file:///d:/Final%20year%20project/app/(dashboard)/dashboard/page.tsx)**
   - Welcome header ("Welcome back, {user.fullName}") with current date in Sora font.
   - Status Summary card.
   - Quick Actions grid (4 cards).
   - Recent Activity list & Health Tip of the day card.

3. **Sub-module Route Placeholders**:
   - [Patient Profile](file:///d:/Final%20year%20project/app/(dashboard)/profile/page.tsx)
   - [Symptom Chat](file:///d:/Final%20year%20project/app/(dashboard)/symptom-chat/page.tsx)
   - [Predictions & History](file:///d:/Final%20year%20project/app/(dashboard)/predictions/page.tsx)
   - [Specialists](file:///d:/Final%20year%20project/app/(dashboard)/specialists/page.tsx)
   - [Hospitals](file:///d:/Final%20year%20project/app/(dashboard)/hospitals/page.tsx)
   - [Government Schemes](file:///d:/Final%20year%20project/app/(dashboard)/schemes/page.tsx)
   - [Medical Records Vault](file:///d:/Final%20year%20project/app/(dashboard)/records/page.tsx)
   - [Health Tips Library](file:///d:/Final%20year%20project/app/(dashboard)/tips/page.tsx)
   - [Account Settings](file:///d:/Final%20year%20project/app/(dashboard)/settings/page.tsx)

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
 ✓ Generating static pages (19/19)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    2.43 kB         108 kB
├ ○ /_not-found                          873 B          88.2 kB
├ ○ /dashboard                           7.23 kB         122 kB
├ ○ /forgot-password                     4.82 kB         146 kB
├ ○ /hospitals                           1.77 kB        89.1 kB
├ ○ /login                               2.24 kB         148 kB
├ ○ /predictions                         1.73 kB        89.1 kB
├ ○ /profile                             3.95 kB         110 kB
├ ○ /records                             1.78 kB        89.1 kB
├ ○ /register                            3.03 kB         148 kB
├ ○ /reset-password                      2.13 kB         147 kB
├ ○ /schemes                             1.8 kB         89.1 kB
├ ○ /settings                            1.78 kB        89.1 kB
├ ○ /specialists                         1.73 kB          89 kB
├ ○ /symptom-chat                        1.86 kB        89.2 kB
└ ○ /tips                                1.83 kB        89.2 kB
+ First Load JS shared by all            87.3 kB
```

### Verification Matrix
- [x] All 19 static routes compiled cleanly with zero TypeScript errors.
- [x] Collapsible sidebar toggle verified on desktop (`md+`).
- [x] Active route indicators (left border + `#E6F4F3` background fill) verified across all 10 navigation links.
- [x] Mobile bottom tab bar & slide-out drawer verified on mobile viewports (360px).
- [x] User menu popover and logout toast integration verified.



### Prompt 

Build the Dashboard & Navigation Shell for the "HealthCare Navigator" web app, continuing on the existing Next.js 14 (App Router) + TypeScript + Tailwind project from Phase 1. Reuse the "Soft Clinical UI" design tokens and components already established (colors, fonts, Button/Input/Card/Toast components, AuthContext, lib/api.ts).

DESIGN SYSTEM REMINDER (apply consistently — do not redefine)
- Primary: #0F6E7A | Primary Light: #E6F4F3 | Accent/Urgent: #E5573F (reserved for alerts only)
- Neutral Dark: #1E2A2E | Neutral Mid: #5C6B6E | Background: #F7FAFA
- Fonts: Sora (headings), Inter (body), IBM Plex Mono (data/numbers)
- Cards: 12-16px radius, soft shadow, 2px border on interactive elements
- WCAG AA contrast everywhere, mobile-first down to 360px

FOLDER STRUCTURE TO ADD
/app/(dashboard)/layout.tsx         (protected shell wrapping all authenticated pages)
/app/(dashboard)/dashboard/page.tsx (home/dashboard landing page)
/components/layout/Sidebar.tsx
/components/layout/Navbar.tsx
/components/layout/MobileNav.tsx    (bottom nav or slide-out drawer for small screens)
/components/layout/UserMenu.tsx     (profile dropdown)
/components/dashboard/QuickActionCard.tsx
/components/dashboard/RecentActivityList.tsx
/components/dashboard/StatusSummaryCard.tsx

1. PROTECTED DASHBOARD LAYOUT (/app/(dashboard)/layout.tsx)
   - Wrap all dashboard routes with an auth guard: if !isAuthenticated (from AuthContext) and not loading, redirect to /login
   - Show a full-page loading state (branded spinner, not a blank flash) while auth status is resolving
   - Compose Sidebar (desktop) + Navbar (top bar) + MobileNav (mobile only) + main content area
   - Main content area: max-width container, consistent page padding, scrollable independently of the sidebar

2. SIDEBAR (/components/layout/Sidebar.tsx)
   - Fixed left sidebar, visible on md+ screens, collapsible to icon-only mode (toggle button at top)
   - App logo/name at top
   - Nav items with icons (lucide-react) and labels, covering all modules from the project doc:
     Dashboard, Patient Profile, Symptom Chat, Predictions & History, Specialists, Hospitals, 
     Government Schemes, Medical Records, Health Tips, Settings
   - Active route highlighted with primary color left-border + light teal background fill (#E6F4F3), not just a color change on the text alone — must be visually obvious at a glance
   - Hover state on inactive items (subtle background tint)
   - Bottom of sidebar: compact user info (avatar/initials, name) that opens UserMenu on click

3. NAVBAR (/components/layout/Navbar.tsx)
   - Top bar, sticky, shown across all dashboard pages
   - Left: page title (dynamically reflects current route — e.g. "Dashboard", "Patient Profile")
   - Right: notification bell icon (static/non-functional for now, just UI), language selector (dropdown showing current language, e.g. "English"), UserMenu trigger (avatar)
   - On mobile: hamburger menu icon to open MobileNav instead of showing Sidebar

4. MOBILE NAV (/components/layout/MobileNav.tsx)
   - Slide-out drawer (from left) triggered by hamburger icon in Navbar, OR a fixed bottom tab bar with the 4-5 most important items (Dashboard, Symptom Chat, Predictions, Profile, Settings) plus a "More" option opening the full list
   - Choose bottom tab bar for the 5 primary items (Dashboard, Symptom Chat, Predictions, Hospitals, Profile) since this is the more mobile-native pattern for a healthcare app used on the go
   - Overlay/drawer closes on route change or outside tap

5. USER MENU (/components/layout/UserMenu.tsx)
   - Dropdown/popover triggered from avatar (Navbar and Sidebar both use it)
   - Shows: user name, email, links to Settings, Help/Support (placeholder), Logout
   - Logout calls AuthContext.logout(), clears session, redirects to /login with a "You've been logged out" toast

6. DASHBOARD HOME PAGE (/app/(dashboard)/dashboard/page.tsx)
   Build a genuinely useful landing page, not just a placeholder grid. Sections:
   
   a. Welcome header: "Welcome back, {user.name}" with current date, Sora font, warm but not cutesy
   
   b. Quick Actions row (QuickActionCard component, 3-4 cards):
      - "Start Symptom Check" (primary CTA, links to Symptom Chat) — visually the most prominent card
      - "Upload Medical Record"
      - "Find a Hospital"
      - "Check Scheme Eligibility"
      Each card: icon, short label, one-line description, entire card clickable
   
   c. Status Summary (StatusSummaryCard component): if user has an active/recent conversation or pending severity flag, show it prominently near the top with the appropriate severity color (urgent color ONLY if flagged emergency) — otherwise show an empty/neutral state like "No active health concerns — start a symptom check anytime"
   
   d. Recent Activity (RecentActivityList component): last 3-5 items combining predictions, uploaded records, and consultations, each with a timestamp and a "View" link — build with mock data for now (clearly commented as MOCK_DATA, structured to match the future /api/v1/dashboard response shape)
   
   e. Health Tip of the day (small card, lower priority, non-intrusive) — mock content for now

MOCK DATA
- Create /lib/mockData.ts with realistic mock objects for dashboard activity, matching the shape you'd expect from GET /api/v1/dashboard, clearly marked for later replacement with real API calls

RESPONSIVE BEHAVIOR
- Desktop (lg+): Sidebar visible, full dashboard grid (2-3 columns for quick actions)
- Tablet (md): Sidebar collapses to icons only by default, quick actions 2 columns
- Mobile (sm and below): Sidebar hidden, bottom tab bar shown, dashboard content stacks to single column, quick actions become a horizontally scrollable row

ACCESSIBILITY
- Sidebar/nav items are real <nav> and <a>/<Link> elements, not divs with onClick
- Active nav state conveyed by more than color alone (border + background + potentially an icon change)
- All icon-only buttons (collapse toggle, notification bell) have aria-label

DELIVERABLE
A fully responsive, functional dashboard shell (Sidebar, Navbar, MobileNav, UserMenu) wrapping a working Dashboard home page with quick actions, status summary, recent activity, and health tip — all using mock data, ready for Phase 3 (Patient Profile) to plug into the same layout.