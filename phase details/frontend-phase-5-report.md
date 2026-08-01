# HealthCare Navigator - Frontend Phase 5 Report
**Module:** Disease Prediction & Severity Module  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, IBM Plex Mono  
**Design System:** Soft Clinical UI  

---

## Executive Summary
This document records the step-by-step implementation of Phase 5: **Disease Prediction & Severity Module** for **HealthCare Navigator**. This phase translates AI differential diagnostic predictions, confidence percentages, SHAP feature attributions (via Recharts), severity level badges, permanent non-diagnosis disclaimers, and contextual next-step navigation pathways into a patient-first interface.

---

## Detailed Step-by-Step Breakdown

### Step 1: Database-Aligned Prediction Data Contracts (`/types/prediction.ts`)
- **[types/prediction.ts](file:///d:/Final%20year%20project/types/prediction.ts)**:
  - Defined strict TypeScript contracts:
    - `DiseasePrediction`: `prediction_id`, `conversation_id`, `predicted_disease`, `confidence_score`, `prediction_model`, `predicted_at`.
    - `DifferentialDisease`: `disease_name`, `confidence_score`, `is_top_match`, `description`, `category`.
    - `ShapExplanation`: `shap_id`, `prediction_id`, `feature_name`, `plain_language_label`, `contribution_score`.
    - `SeverityAssessment`: `assessment_id`, `prediction_id`, `severity` (`low` | `moderate` | `high` | `emergency`), `urgency_level`, `emergency_flag`, `explanation`.
    - `FullPredictionReport`: Combined report wrapper.

---

### Step 2: Prediction Datasets & API Service Layer (`/lib/mockPredictionData.ts`)
- **[mockPredictionData.ts](file:///d:/Final%20year%20project/lib/mockPredictionData.ts)**:
  - Built `MOCK_NORMAL_PREDICTION` (`pred_101`): Moderate-severity tension headache report with 4 ranked differential diseases and 5 plain-language SHAP feature attributions.
  - Built `MOCK_EMERGENCY_PREDICTION` (`pred_emergency_102`): Critical emergency alert report for Acute Coronary Syndrome with 91% confidence score and emergency escalation triggers.
  - Implemented async `predictionApi` service (`getReport`, `getAllReports`).

---

### Step 3: Prediction UI Components (`/components/predictions/`)

1. **[SeverityBadge.tsx](file:///d:/Final%20year%20project/components/predictions/SeverityBadge.tsx)**
   - Reusable severity badge mapping `low` (muted teal), `moderate` (amber), `high` (orange), and `emergency` (`#E5573F` urgent red) with icon + label + color combination.

2. **[PredictionDisclaimer.tsx](file:///d:/Final%20year%20project/components/predictions/PredictionDisclaimer.tsx)**
   - Permanent, non-dismissible medical disclaimer strip in neutral Inter font placed directly below the severity banner.

3. **[PredictionSummaryCard.tsx](file:///d:/Final%20year%20project/components/predictions/PredictionSummaryCard.tsx)**
   - Summary card showing assessment timestamp, model version, and quick link back to the chat transcript.

4. **[DiseaseConfidenceList.tsx](file:///d:/Final%20year%20project/components/predictions/DiseaseConfidenceList.tsx)**
   - Ranked differential diagnosis list with Sora headings, IBM Plex Mono confidence percentages, animated relative confidence bars, and "Most Likely Match" highlighting.

5. **[ShapFeatureRow.tsx](file:///d:/Final%20year%20project/components/predictions/ShapFeatureRow.tsx)**
   - Plain-English feature row translating raw model keys (e.g. `fever_duration_days` -> "Duration of fever").

6. **[ShapExplanationChart.tsx](file:///d:/Final%20year%20project/components/predictions/ShapExplanationChart.tsx)**
   - Horizontal Recharts `BarChart` rendering positive feature contributions in primary teal (`#0F6E7A`) and negative contributions in neutral gray (`#5C6B6E`). Includes an accessible "View as table" toggle for screen readers.

7. **[NextStepsPanel.tsx](file:///d:/Final%20year%20project/components/predictions/NextStepsPanel.tsx)**
   - Action-oriented card row providing contextual next steps: **See Recommended Specialist** (`/specialists`), **Find Nearby Hospitals** (`/hospitals`), **Check Government Scheme Subsidies** (`/schemes`), and **View Health Tips** (`/tips`).

---

### Step 4: Prediction Module Pages (`/app/(dashboard)/predictions/`)

1. **[Prediction Results Page](file:///d:/Final%20year%20project/app/(dashboard)/predictions/[predictionId]/page.tsx)**
   - Safety-first layout ordering:
     1. `SeverityBadge` & Emergency Alert Banner (`#E5573F` red, 108 emergency call & hospital finder CTAs).
     2. Permanent Medical Non-Diagnosis Disclaimer.
     3. Report Summary Card.
     4. 2-Column Desktop Grid: Ranked Differential List (Left) + SHAP Feature Attribution Chart (Right).
     5. Contextual Next Steps Panel.
   - Features a Demo State Switcher ("Normal" vs "Emergency Alert") for easy evaluation.

2. **[Triage History Page](file:///d:/Final%20year%20project/app/(dashboard)/predictions/page.tsx)**
   - List view of historical triage prediction reports.

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
├ ○ /hospitals                           1.77 kB        89.1 kB
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
├ ○ /specialists                         1.73 kB        89.1 kB
├ ○ /symptom-chat                        3.07 kB         115 kB
└ ○ /tips                                1.83 kB        89.2 kB
+ First Load JS shared by all            87.3 kB
```

### Verification Matrix
- [x] Installed `recharts` and verified error-free bundle compilation.
- [x] Tested safety-first layout order: Severity Banner -> Disclaimer -> Summary -> Differential + SHAP -> Next Steps.
- [x] Verified Demo State Switcher ("Normal" vs "Emergency Alert").
- [x] Verified plain-language SHAP feature labels and screen reader table view toggle.
- [x] Verified IBM Plex Mono font rendering for confidence percentages.



### Prompt

Build the Disease Prediction & Severity module for the "HealthCare Navigator" web app, continuing on the existing Next.js 14 (App Router) + TypeScript + Tailwind project from Phases 1-4. Reuse the "Soft Clinical UI" design tokens, existing UI components, dashboard layout/Sidebar/Navbar shell, and AuthContext.

DESIGN SYSTEM REMINDER (apply consistently — do not redefine)
- Primary: #0F6E7A | Primary Light: #E6F4F3 | Accent/Urgent: #E5573F (reserved for alerts only)
- Neutral Dark: #1E2A2E | Neutral Mid: #5C6B6E | Background: #F7FAFA
- Fonts: Sora (headings), Inter (body), IBM Plex Mono (data/numbers — use this for confidence % and scores specifically)
- Cards: 12-16px radius, soft shadow, 2px border on interactive elements
- WCAG AA contrast everywhere, mobile-first down to 360px

FOLDER STRUCTURE TO ADD
/app/(dashboard)/predictions/[predictionId]/page.tsx   (main prediction results page)
/components/predictions/PredictionSummaryCard.tsx
/components/predictions/DiseaseConfidenceList.tsx
/components/predictions/SeverityBadge.tsx
/components/predictions/ShapExplanationChart.tsx
/components/predictions/ShapFeatureRow.tsx
/components/predictions/NextStepsPanel.tsx
/components/predictions/PredictionDisclaimer.tsx
/types/prediction.ts
/lib/mockPredictionData.ts

Install recharts if not already present (npm install recharts).

TYPES (types/prediction.ts) — match the project's DB schema
- DiseasePrediction: prediction_id, conversation_id, predicted_disease, confidence_score, prediction_model, predicted_at
- ShapExplanation: shap_id, prediction_id, feature_name, contribution_score
- SeverityAssessment: assessment_id, prediction_id, severity ('low' | 'moderate' | 'high' | 'emergency'), urgency_level, emergency_flag, explanation
- For the UI, model a prediction result as a small ranked list (top 3-5 diseases with confidence scores), not just one — since your backend produces a differential, not a single answer

1. PREDICTION RESULTS PAGE (/app/(dashboard)/predictions/[predictionId]/page.tsx)
   Layout order matters here — put safety-critical info first, curiosity-driven info (SHAP) later:
   
   a. SeverityBadge + emergency state — render at the very top, large and unmissable, before anything else
      - If emergency_flag is true: full-width banner in urgent accent color, icon, clear text ("This may need urgent attention"), and a primary action button "Find nearest hospital" linking to the Hospital Recommendation page (stub route OK)
      - If not emergency: a calmer badge (e.g. "Low urgency" in a muted teal/green) integrated into the PredictionSummaryCard rather than a full banner — don't manufacture urgency where there is none
   
   b. PredictionDisclaimer — a small, permanently visible (not dismissible) strip directly under the severity section: "This is an AI-generated estimate to help guide your next step. It is not a medical diagnosis. Always consult a qualified doctor for confirmation." Use neutral styling (not alarming), Inter font, smaller text size — present but not shouting
   
   c. PredictionSummaryCard — conversation date, language used, quick link back to the chat transcript
   
   d. DiseaseConfidenceList — ranked list of predicted diseases (predicted_disease + confidence_score), each as a row with:
      - Disease name (Sora, medium weight)
      - Confidence score as both a percentage (IBM Plex Mono) AND a horizontal bar visualization — never rely on the number alone, the bar makes relative confidence scannable at a glance
      - Top prediction visually distinguished (slightly larger, or a "Most likely" eyebrow label) from the rest of the differential list
      - Tapping a row expands to show that disease's own SHAP explanation (if you're only building one shared SHAP chart for the top prediction, that's fine for this phase — note it as MVP scope, full per-disease SHAP can be a later enhancement)
   
   e. ShapExplanationChart — horizontal bar chart (recharts) showing top contributing features and their contribution_score
      - Positive contributions (pushed toward this diagnosis) in primary teal, negative/against contributions in a muted neutral gray — do NOT use the urgent accent color here, that's reserved for severity only
      - Each bar paired with a ShapFeatureRow below/beside it translating the raw feature name into plain language (e.g. feature_name "fever_duration_days" → "Duration of fever" ) — translate ALL mock feature names to plain English, never show raw snake_case feature names in the UI
      - Small heading explaining what this chart means in plain language: "These factors most influenced this result" — not "SHAP values" or ML jargon
   
   f. NextStepsPanel — action-oriented card row (reuses QuickActionCard style from Phase 2 dashboard) with contextual next steps:
      - "See recommended specialist" → links to specialist recommendation (stub OK, Phase 6 builds it)
      - "Find nearby hospitals" → links to hospital page (stub OK)
      - "Check government scheme eligibility" → links to schemes page (stub OK)
      - "View health tips" → links to health tips (stub OK)
      Only show the specialist/hospital actions prominently if severity warrants it; otherwise all four appear as equal-weight options

2. SEVERITY BADGE (SeverityBadge.tsx)
   - Reusable component taking a severity level prop, renders consistent color + icon + label combination across the whole app (this same component should be reusable later in History and Dashboard)
   - Mapping: low = muted teal/green + check icon, moderate = amber + info icon, high = orange + warning icon, emergency = urgent accent (#E5573F) + alert icon
   - Always icon + text + color together, never color alone

3. DISEASE CONFIDENCE LIST (DiseaseConfidenceList.tsx)
   - Accepts an array of {disease, confidence_score} sorted descending
   - Animate the confidence bars filling in on mount (subtle, one-time, respects prefers-reduced-motion)

4. SHAP EXPLANATION CHART (ShapExplanationChart.tsx)
   - Use recharts horizontal BarChart
   - Responsive container, readable on mobile (may need to truncate feature labels with a tooltip showing full text on tap/hover)
   - Legend clarifying the two colors (e.g. "Increases likelihood" / "Decreases likelihood")

MOCK DATA
- /lib/mockPredictionData.ts: one realistic mock prediction with 3-4 differential diseases, confidence scores, 5-6 SHAP features with plain-language labels mapped, and one severity assessment — build a second mock variant with emergency_flag: true so both UI states (calm vs urgent) are demonstrable
- Clearly comment as MOCK_DATA, structured to match GET /api/v1/predictions/{prediction_id} and GET /api/v1/predictions/{prediction_id}/explanation

RESPONSIVE BEHAVIOR
- Desktop: SHAP chart and disease list can sit side-by-side in a two-column layout below the severity section
- Mobile: everything stacks single-column, SHAP chart becomes a scrollable/compact version, confidence bars remain full-width and easy to scan

ACCESSIBILITY
- Confidence bars have an accessible text equivalent (aria-label with the percentage), not just a visual bar
- Chart has a text-based data table alternative available (e.g. a "View as table" toggle) since chart libraries are often poor for screen readers
- Emergency banner uses aria-live="assertive"

DELIVERABLE
A fully functional Disease Prediction & Severity results page: severity-first layout with emergency escalation, permanent medical disclaimer, ranked differential diagnosis list with confidence bars, plain-language SHAP explanation chart, and contextual next-step actions — all driven by mock data (including one emergency-state variant) and ready to wire into Person 2's XGBoost/SHAP backend once it's live.