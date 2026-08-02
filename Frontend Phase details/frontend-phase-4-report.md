# HealthCare Navigator - Frontend Phase 4 Report
**Module:** AI Symptom Chat & Clinical Triage Interface  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, IndicTrans2 Multilingual Tokens  
**Design System:** Soft Clinical UI  

---

## Executive Summary
This document records the step-by-step implementation of Phase 4: **AI Symptom Chat & Clinical Triage Interface** for **HealthCare Navigator**. This phase provides real-time-feeling conversational triage via text and voice audio input, structured follow-up question quick-replies, IndicTrans2 language switching, typing indicator feedback, emergency escalation banners (`#E5573F` urgent red), and interactive scripted agent logic.

---

## Detailed Step-by-Step Breakdown

### Step 1: Database-Aligned Chat Data Contracts (`/types/chat.ts`)
- **[types/chat.ts](file:///d:/Final%20year%20project/types/chat.ts)**:
  - Defined strict TypeScript contracts:
    - `Conversation`: `conversation_id`, `profile_id`, `language`, `input_type` (`text` | `voice`), `started_at`, `ended_at`, `status` (`active` | `completed` | `abandoned`).
    - `ConversationMessage`: `message_id`, `conversation_id`, `sender` (`user` | `agent` | `system`), `message`, `translated_message`, `created_at`, `followUpQuestion`, `isEmergencyAlert`.
    - `FollowUpQuestion`: `question_id`, `question_text`, `options`, `allowFreeText`, `isAnswered`.
    - `VoiceRecorderState`: `status` (`idle` | `recording` | `processing` | `transcribed`), `durationSeconds`.

---

### Step 2: Scripted Agent & Multilingual Data Layer (`/lib/mockChatData.ts`)
- **[mockChatData.ts](file:///d:/Final%20year%20project/lib/mockChatData.ts)**:
  - IndicTrans2 supported language list: English, Tamil (தமிழ்), Hindi (हिंदी), Bengali (বাংলা), Telugu (తెలుగు), Marathi (मराठी).
  - Scripted 3-4 turn conversational triage agent (Symptom Duration -> Severity Rating -> Co-occurring Symptoms -> Triage Report Prediction).
  - Emergency keyword detection (`chest pain`, `shortness of breath`, `severe blood`, `unconscious`) triggering high-priority emergency alerts.
  - In-memory conversation store and API handlers (`startConversation`, `sendMessage`, `switchLanguage`, `endConversation`).

---

### Step 3: Chat UI Components (`/components/chat/`)

1. **[LanguageSelector.tsx](file:///d:/Final%20year%20project/components/chat/LanguageSelector.tsx)**
   - IndicTrans2 dropdown selector showing language name and native script. Emits an inline system notification on language switch.

2. **[EmergencyBanner.tsx](file:///d:/Final%20year%20project/components/chat/EmergencyBanner.tsx)**
   - High-priority emergency escalation banner using urgent red (`#E5573F`) and `aria-live="assertive"`. Features direct action CTAs for **Call 108 Emergency** (`tel:108`) and **Find Emergency Room** (`/hospitals`).

3. **[ConversationStartCard.tsx](file:///d:/Final%20year%20project/components/chat/ConversationStartCard.tsx)**
   - Welcome landing card featuring language selection, medical reassurance non-diagnosis disclaimer, "Start Symptom Check" button, and active session resume shortcut.

4. **[FollowUpQuestionCard.tsx](file:///d:/Final%20year%20project/components/chat/FollowUpQuestionCard.tsx)**
   - Renders structured follow-up questions with interactive quick-reply chips. Tapping a chip submits that reply and disables the card's chips to prevent duplicate submissions.

5. **[MessageBubble.tsx](file:///d:/Final%20year%20project/components/chat/MessageBubble.tsx)**
   - User messages: Right-aligned, soft teal background (`#E6F4F3`), voice input indicator.
   - Agent messages: Left-aligned, white card background with soft medical pulse avatar.
   - Secondary translated line rendered below original if language ≠ English.
   - Timestamps on hover/tap.

6. **[TypingIndicator.tsx](file:///d:/Final%20year%20project/components/chat/TypingIndicator.tsx)**
   - 3-dot pulse animation rendered while awaiting agent response.

7. **[VoiceRecordButton.tsx](file:///d:/Final%20year%20project/components/chat/VoiceRecordButton.tsx)**
   - Interactive voice recorder transitioning between `idle` -> `recording` (timer count-up, pulsing ring, cancel X) -> `processing` (transcribing) -> `transcribed` text insertion into input bar. Announced via `aria-live="polite"`.

8. **[MessageInput.tsx](file:///d:/Final%20year%20project/components/chat/MessageInput.tsx)**
   - Sticky bottom message bar combining `VoiceRecordButton`, auto-expanding multi-line textarea (Enter to send, Shift+Enter for new line), and Send button.

9. **[ChatWindow.tsx](file:///d:/Final%20year%20project/components/chat/ChatWindow.tsx)**
   - Main viewport managing scrollable messages, auto-scroll to bottom (`aria-live="polite"`), header with New/End conversation actions, `EmergencyBanner`, and `MessageInput`.

---

### Step 4: Chat Module Pages (`/app/(dashboard)/chat/`)

1. **[Chat Entry Page](file:///d:/Final%20year%20project/app/(dashboard)/chat/page.tsx)**
   - Renders `ConversationStartCard` and active conversation shortcut.

2. **[Active Chat Screen](file:///d:/Final%20year%20project/app/(dashboard)/chat/[conversationId]/page.tsx)**
   - Dynamic route rendering `ChatWindow` for the specified conversation ID.

3. **[Symptom Check Shortcut](file:///d:/Final%20year%20project/app/(dashboard)/symptom-chat/page.tsx)**
   - Mounts the conversation start card directly within the navigation shell.

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
├ ○ /predictions                         1.73 kB        89.1 kB
├ ○ /profile                             10.9 kB         136 kB
├ ○ /profile/edit                        5.83 kB         130 kB
├ ○ /records                             1.78 kB        89.1 kB
├ ○ /register                            3.03 kB         150 kB
├ ○ /reset-password                      2.13 kB         149 kB
├ ○ /schemes                             1.8 kB         89.1 kB
├ ○ /settings                            1.78 kB        89.1 kB
├ ○ /specialists                         1.73 kB          89 kB
├ ○ /symptom-chat                        3.07 kB         115 kB
└ ○ /tips                                1.83 kB        89.2 kB
+ First Load JS shared by all            87.3 kB
```

### Verification Matrix
- [x] All 21 static and dynamic routes compiled cleanly with 0 TypeScript errors.
- [x] Interactive 3-turn conversational triage tested with quick-reply chips.
- [x] Emergency escalation banner (`#E5573F` & `aria-live="assertive"`) verified upon typing "chest pain".
- [x] Simulated voice recording (timer count-up, transcribing loader, auto-insertion into input) verified.
- [x] IndicTrans2 mid-conversation language switching & secondary translation lines verified.


### Prompt

Build the Symptom Chat Interface for the "HealthCare Navigator" web app, continuing on the existing Next.js 14 (App Router) + TypeScript + Tailwind project from Phases 1-3. Reuse the "Soft Clinical UI" design tokens, existing UI components, dashboard layout/Sidebar/Navbar shell, and AuthContext.

DESIGN SYSTEM REMINDER (apply consistently — do not redefine)
- Primary: #0F6E7A | Primary Light: #E6F4F3 | Accent/Urgent: #E5573F (reserved for alerts only)
- Neutral Dark: #1E2A2E | Neutral Mid: #5C6B6E | Background: #F7FAFA
- Fonts: Sora (headings), Inter (body), IBM Plex Mono (data/numbers)
- Cards: 12-16px radius, soft shadow, 2px border on interactive elements
- WCAG AA contrast everywhere, mobile-first down to 360px

FOLDER STRUCTURE TO ADD
/app/(dashboard)/chat/page.tsx                  (conversation list / entry point)
/app/(dashboard)/chat/[conversationId]/page.tsx (active chat screen)
/components/chat/ChatWindow.tsx
/components/chat/MessageBubble.tsx
/components/chat/MessageInput.tsx
/components/chat/VoiceRecordButton.tsx
/components/chat/TypingIndicator.tsx
/components/chat/FollowUpQuestionCard.tsx
/components/chat/LanguageSelector.tsx
/components/chat/ConversationStartCard.tsx
/components/chat/EmergencyBanner.tsx
/types/chat.ts
/lib/mockChatData.ts

TYPES (types/chat.ts) — match the project's DB schema
- Conversation: conversation_id, profile_id, language, input_type ('text' | 'voice'), started_at, ended_at, status ('active' | 'completed' | 'abandoned')
- ConversationMessage: message_id, conversation_id, sender ('user' | 'agent'), message, translated_message, created_at
- FollowUpQuestion: a structured message subtype the agent can send — question text + optional quick-reply options (e.g. Yes/No/Not sure) for faster response than free typing

1. CHAT ENTRY POINT (/app/(dashboard)/chat/page.tsx)
   - If no active conversation: show ConversationStartCard — a clear, calm invitation: "Tell us what's bothering you" with a prominent "Start Symptom Check" button, a LanguageSelector (defaulting to user's saved preference), and small reassurance text ("This isn't a diagnosis — it helps you understand next steps")
   - If there's a recent/active conversation, show a "Continue where you left off" option above the start card
   - Clicking Start creates a new conversation (mocked) and routes to /chat/[conversationId]

2. ACTIVE CHAT SCREEN (/app/(dashboard)/chat/[conversationId]/page.tsx, ChatWindow.tsx)
   - Full-height chat layout: scrollable message area + fixed input bar at bottom
   - Header bar within the chat (not the global Navbar) showing: current language, a "New Conversation" option, and an "End Conversation" option (with ConfirmDialog)
   - Auto-scroll to latest message on new message arrival
   - EmergencyBanner: a dismissible-but-persistent-until-resolved banner that appears ONLY if the mocked agent response flags emergency severity — uses the urgent accent color, clear icon, and a direct action button ("Find nearest hospital now" / "Call emergency services") — this must visually interrupt the normal chat flow, not blend in as just another message

3. MESSAGE BUBBLE (MessageBubble.tsx)
   - User messages: right-aligned, primary-light background (#E6F4F3), dark text
   - Agent messages: left-aligned, white/card background with a subtle border, small agent avatar/icon (not a human photo — use a calm medical-adjacent icon, e.g. a soft cross or pulse icon)
   - Show translated_message as a secondary smaller line under the original if language ≠ English (e.g. original in Tamil, small gray translation below) — support this even with mock data to prove the pattern works
   - Timestamps: small, muted, shown on hover/tap (not cluttering every bubble by default)

4. FOLLOW-UP QUESTIONS (FollowUpQuestionCard.tsx)
   - When the agent asks a structured follow-up (e.g. "On a scale of mild to severe, how would you describe the pain?"), render it as a distinct card within the message flow with tappable quick-reply chips (not just a text bubble) — this speeds up the conversation and reduces typing burden, especially important for users who may be unwell or using voice
   - Quick-reply chip tap sends that reply as if typed, then disables that card's chips (so users can't double-submit)
   - Always allow free-text override below the quick replies for anyone who wants to type instead

5. MESSAGE INPUT (MessageInput.tsx)
   - Text input (expands for multi-line), send button (disabled when empty), VoiceRecordButton to the left of text input
   - Enter to send, Shift+Enter for new line
   - While waiting for agent response: disable input, show TypingIndicator (three-dot animation) in place of where the next agent bubble would appear

6. VOICE RECORD BUTTON (VoiceRecordButton.tsx)
   - Mic icon button; on click/tap, transitions to a "recording" visual state (pulsing ring animation, waveform placeholder, timer counting up, red-tinted mic icon)
   - Tap again to stop — for this phase, mock the transcription result (insert a placeholder transcribed message after a short simulated delay) since actual Whisper integration is backend work
   - Include a cancel option while recording (X button appears alongside)
   - Clear visual states: idle → recording → processing → done, each distinguishable at a glance

7. LANGUAGE SELECTOR (LanguageSelector.tsx)
   - Dropdown showing language options relevant to the project (English, Tamil, Hindi, and a few other major Indian languages — reference IndicTrans2 supported languages)
   - Changing language mid-conversation shows a small inline system note in the chat ("Language switched to Tamil") rather than silently changing behavior

MOCK CONVERSATION LOGIC
- /lib/mockChatData.ts: build a small scripted mock agent that responds to any user message with a canned follow-up question sequence (3-4 turns), ending in a mock "prediction ready" system message that links to /predictions/[id] (stub route is fine, Phase 5 builds it out properly)
- Include one branch path that triggers the EmergencyBanner, so that state is demonstrable
- Clearly comment this as MOCK_AGENT_LOGIC, structured so it's a near-drop-in swap for a real POST /api/v1/conversations/{conversation_id}/messages call later

RESPONSIVE BEHAVIOR
- Desktop: chat takes a centered column (max-width ~720px) within the dashboard content area, not full-bleed
- Mobile: chat fills the full available width/height below the navbar, input bar respects safe-area padding for devices with home indicators

ACCESSIBILITY
- New agent messages announced via an aria-live="polite" region so screen reader users know a reply arrived
- EmergencyBanner uses aria-live="assertive" since it needs immediate attention
- Voice recording state changes are announced (not just visual)
- Quick-reply chips are real buttons, keyboard-navigable and focusable

DELIVERABLE
A fully functional Symptom Chat Interface: conversation start screen, real-time-feeling chat UI with text and mocked voice input, follow-up question quick-replies, typing indicator, multilingual message display, and an emergency escalation banner — all driven by mock agent logic and ready to swap in the real LangGraph-powered backend once Person 2's AI agent is live.