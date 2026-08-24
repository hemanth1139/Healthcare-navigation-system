# HealthCare Navigator - Backend Phase 4 Report
**Module:** Conversational Triage Agent  
**Stack:** FastAPI, SQLAlchemy 2.0, LangChain, LangGraph, Pydantic v2  

---

## Executive Summary
This document provides a detailed step-by-step record of the implementation of Phase 4: Conversational Triage Agent for **HealthCare Navigator**. This phase delivers a multi-turn symptom collection conversational workflow orchestrated using LangGraph, including session state persistence, automatic fallback to developmental mock handlers, and standard REST routes for chat operations.

---

## Detailed Step-by-Step Breakdown

### Step 1: Schema Definitions
- **[app/schemas/conversation.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/schemas/conversation.py)**:
  - Configured message and session structures using camelCase properties mapping directly to frontend TypeScript interfaces (`Conversation`, `ConversationMessage`, `FollowUpQuestion`, and `QuickReplyOption`).
  - Added support for quick reply choice vectors, emergency alert triggers, and final differential disease prediction redirects.

### Step 2: LangGraph Orchestration & Nodes
- **[app/agents/triage_agent.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/agents/triage_agent.py)**:
  - Built clinical symptom prompting templates (`SYSTEM_PROMPT`) defining evaluation heuristics: checking for emergency flags, identifying missing onset/location metrics, and outputting structured JSON payloads.
  - Added a developmental mock fallback processor (`_get_mock_response`) to execute triage turns (and trigger mock emergency redirects) without requiring an active Gemini API key.
- **[app/agents/graph.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/agents/graph.py)**:
  - Defined the Graph State: tracking messages, needs_more_info flags, is_emergency flags, current follow-up questions, options vectors, and extracted symptoms list.
  - Linked execution flow using a `StateGraph`: starting at the `triage` node and terminating at `END`.

### Step 3: API Integration & Service Layer
- **[app/services/conversation_service.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/services/conversation_service.py)**:
  - Created conversation initiation methods and history retrieval helpers.
  - Configured `send_message()`: stores user message in DB, extracts active session history, executes the LangGraph workflow, updates the conversation status (completes session if emergency is flagged or if sufficient symptoms are collected), and commits the agent response.
- **[app/api/v1/conversations.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/api/v1/conversations.py)**: Exposed 5 REST endpoints:
  - `POST /api/v1/conversations` (Start new session)
  - `GET /api/v1/conversations` (List all user sessions)
  - `GET /api/v1/conversations/{id}` (Get details)
  - `POST /api/v1/conversations/{id}/messages` (Send message & execute LangGraph)
  - `DELETE /api/v1/conversations/{id}` (Remove history)
- **[app/api/v1/router.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/app/api/v1/router.py)**: Registered the conversations router to the API root.

---

## Verification & Testing
- Integrated integration tests in **[tests/test_agents.py](file:///b:/Semester-7/Project%20Phase-1/Project/Healthcare-navigation-system/backend/tests/test_agents.py)** verifying:
  - Chat session initiation.
  - Multi-turn conversation logic returning follow-up questions and option structures.
  - Concluding triage sessions once history parameters are satisfied.
  - Enforcing message rejection on completed sessions.
- Execution command: `python -m pytest tests/test_agents.py -v` (PASSED).
