# Objective Module-Wise Technique Analysis

## AI-Based Healthcare Navigation and Patient Assistance System

> [!NOTE]
> This document does NOT start from the existing implementation. For each module, it independently surveys **all known approaches**, evaluates them objectively, and determines **which is genuinely the best** for this specific healthcare navigation context.

---

# Module 1: User Authentication

## All Available Approaches

### Approach 1: Session-Based Authentication (Server-Side Sessions)
- **How it works**: Server creates a session ID stored in a cookie. Session data lives in server memory or a session store (Redis).
- **Pros**: Simple to implement. Session can be invalidated instantly server-side. No token size overhead.
- **Cons**: Requires server-side state storage (Redis/Memcached). Doesn't work well with stateless API deployments (Railway, Render free-tier). Poor fit for SPA/mobile frontends due to CORS cookie issues. Horizontal scaling requires shared session store.
- **Best for**: Traditional server-rendered web apps (PHP, Django templates).

### Approach 2: JWT (JSON Web Tokens) — Dual Token (Access + Refresh)
- **How it works**: Stateless tokens containing user ID + expiry, signed with HMAC-SHA256 or RSA. Short-lived access token (15–60 min) + long-lived refresh token (7–30 days).
- **Pros**: Fully stateless — no server-side storage needed. Works seamlessly with SPA (Next.js) and mobile apps. Scales horizontally without shared state. Self-contained — can embed roles, permissions. Industry standard for API-first architectures.
- **Cons**: Cannot be revoked before expiry (unless you add a blacklist, which reintroduces state). Token size is larger than a session ID. Refresh token rotation adds complexity.
- **Best for**: API-first systems with SPA frontends, microservices, mobile apps.

### Approach 3: OAuth 2.0 / Social Login (Google, Facebook)
- **How it works**: Delegates authentication to external identity providers. User logs in via Google/Facebook, app receives an authorization code → exchanges for tokens.
- **Pros**: No password management. Users don't need to create new accounts. Established trust with major providers.
- **Cons**: External dependency — if Google's OAuth is down, your users can't log in. Rural Indian users may not have Google/Facebook accounts. You lose control over the auth flow. Requires internet connectivity for every login.
- **Best for**: Consumer apps where reducing signup friction is the top priority.

### Approach 4: Paseto (Platform-Agnostic Security Tokens)
- **How it works**: Alternative to JWT that fixes some JWT design flaws (no algorithm confusion attacks). Uses modern cryptography (XChaCha20-Poly1305).
- **Pros**: Stronger security guarantees than JWT by design. No "none" algorithm vulnerability.
- **Cons**: Much smaller ecosystem — fewer libraries, less documentation, fewer developers understand it. Limited community support compared to JWT. Not an industry standard yet.
- **Best for**: High-security applications where JWT's historical vulnerabilities are a concern.

### Approach 5: API Key Authentication
- **How it works**: Each user gets a static API key sent in request headers.
- **Pros**: Extremely simple. No expiry management.
- **Cons**: No expiry = compromised keys remain valid forever. No built-in user identity claims. Not suitable for end-user authentication (better for service-to-service).
- **Best for**: Machine-to-machine API access, not end-user apps.

## Password Hashing Comparison

| Algorithm | Security | Speed | Memory Usage | Maturity |
|-----------|----------|-------|-------------|----------|
| **bcrypt** | High (adaptive cost factor) | Intentionally slow | Low (~4KB) | 25+ years, battle-tested |
| **Argon2id** | Highest (memory-hard, GPU-resistant) | Configurable | High (~64MB default) | Newer (2015), PHC winner |
| **scrypt** | High (memory-hard) | Configurable | Medium (~16MB) | Mature, used by cryptocurrency |
| **PBKDF2** | Moderate (not memory-hard) | Fast | Very low | Oldest, NIST approved |
| **SHA-256 + salt** | Low (too fast to hash) | Very fast | Negligible | ❌ Not suitable for passwords |

## ✅ Verdict for This System

| Component | Best Choice | Why |
|-----------|------------|-----|
| **Auth mechanism** | **JWT (Dual Token)** | API-first architecture with Next.js SPA frontend. Must be stateless for free-tier deployment (no Redis). Must work with mobile clients in future. Industry standard |
| **Password hashing** | **bcrypt** | Best balance of security and resource usage. Argon2id is theoretically stronger but uses ~64MB RAM per hash operation — problematic when total backend target is ~200MB. bcrypt's ~4KB per hash is negligible |

---

# Module 2: Conversational Symptom Intake

## All Available Approaches

### Approach 1: Single-Shot Symptom Form (Checkbox / Dropdown)
- **How it works**: User selects symptoms from a predefined list via checkboxes or dropdowns.
- **Pros**: Simple to build. Structured input — no NLP needed. Fast.
- **Cons**: Misses critical context (onset, duration, radiation patterns, severity). Cannot handle symptoms not in the predefined list. Literature [ref 1–5 in survey] shows symptom assessment apps using this approach achieve only 19–37.9% primary diagnosis accuracy. Users don't think in checkbox categories — "burning feeling in my chest after eating" is more natural than selecting "chest_pain" + "heartburn" separately.
- **Best for**: Simple pre-screening forms, not comprehensive symptom assessment.

### Approach 2: Rule-Based Chatbot (Decision Tree / Finite State Machine)
- **How it works**: Predefined conversation flow with branching logic. "Do you have chest pain?" → Yes → "Does it radiate to your left arm?" → Yes → "Emergency"
- **Pros**: Deterministic and predictable. No API costs. No hallucination risk.
- **Cons**: Cannot handle free-text input. Brittle — fails on anything outside the decision tree. Cannot adapt to novel symptom descriptions. Adding new diseases requires redesigning the entire tree. Cannot handle multi-symptom presentations naturally. Poor user experience — feels robotic.
- **Best for**: Simple FAQ bots, not clinical symptom assessment.

### Approach 3: Fine-Tuned Domain-Specific Medical LLM (Med-PaLM, BioGPT, PMC-LLaMA)
- **How it works**: A language model pre-trained or fine-tuned on medical literature and clinical data.
- **Pros**: Deep medical domain knowledge. Can understand clinical terminology. Some (like Med-PaLM 2) achieve expert-level medical QA scores.
- **Cons**: Requires hosting 7B–70B parameter models (10–140GB VRAM). Inference cost is 10–100x higher than API-based models. Self-hosting requires GPU infrastructure. Fine-tuning requires curated medical conversation datasets that are scarce. Model updates require retraining.
- **Best for**: Research labs, large healthcare enterprises with GPU infrastructure.

### Approach 4: General-Purpose LLM via API (GPT-4, Claude, Gemini)
- **How it works**: Use a commercial LLM API with carefully crafted system prompts for medical symptom intake.
- **Pros**: State-of-the-art reasoning without hosting infrastructure. Handles free-text naturally. Multi-turn conversation built-in. Continuously improved by the provider. Zero GPU/RAM cost locally.
- **Cons**: API cost per query. Requires internet connectivity. Potential hallucination (mitigated by prompt engineering and low temperature). Data privacy considerations (patient data sent to external API).

| LLM Option | Cost (per 1M tokens) | Medical Reasoning | Ecosystem Fit |
|------------|---------------------|-------------------|---------------|
| GPT-4o | ~$2.50 input / $10 output | Excellent | Separate ecosystem from Maps/Embeddings |
| Claude 3.5 Sonnet | ~$3 input / $15 output | Very good | No embedding/maps integration |
| **Gemini 2.5 Flash** | **~$0.15 input / $0.60 output** | Very good | **Same API key as embeddings + Maps** |
| GPT-4o-mini | ~$0.15 input / $0.60 output | Good | Separate ecosystem |

### Approach 5: Hybrid (LLM + Decision Tree Fallback)
- **How it works**: Use LLM for conversation but fall back to decision tree if LLM fails or is unavailable.
- **Pros**: Best of both worlds — LLM flexibility with deterministic safety net.
- **Cons**: More complex to maintain two systems.
- **Best for**: Production healthcare systems where reliability is critical.

## Orchestration Framework Comparison

| Framework | How It Works | When to Use |
|-----------|-------------|------------|
| **Direct LLM calls** | Call LLM API directly, manage state in application code | Simple single-step tasks |
| **LangChain Chains** | Sequential chain of LLM calls with prompt templates | Linear multi-step workflows |
| **LangChain Agents (ReAct)** | LLM decides which tools to call in a loop | Dynamic tool-calling tasks (search, calculator) |
| **LangGraph StateGraph** | Explicit graph of nodes with typed state, deterministic edges | **Multi-step workflows needing explicit state management and predictable execution** |
| **CrewAI / AutoGen** | Multi-agent collaboration with role-based agents | Complex multi-agent tasks (not needed for single-patient triage) |

## ✅ Verdict for This System

| Component | Best Choice | Why |
|-----------|------------|-----|
| **Conversation approach** | **LLM-based multi-turn via API (Approach 4) with rule-based fallback (Approach 5)** | Multi-turn conversation captures 3–5x more clinical detail than single-shot forms [survey refs 1-5]. API-based avoids GPU infrastructure. Rule-based fallback ensures system works without API key |
| **LLM model** | **Gemini 2.5 Flash** | 10–15x cheaper than GPT-4o with comparable medical reasoning. Unified ecosystem — same Google API key for embeddings, Maps, and LLM. Lowest cost-per-token among high-quality models |
| **Orchestration** | **LangGraph StateGraph** | Explicit typed state (`symptoms`, `is_emergency`, `needs_more_info`) makes the triage flow auditable. Deterministic node execution unlike ReAct agents. Easily extensible — add guardrail node, summary node without rewriting |
| **Temperature** | **0.1** | Near-deterministic output for clinical safety. Literature [ref 26] shows LLM hallucination is a major concern in healthcare — low temperature minimizes creative/fabricated responses |

---

# Module 3: Severity & Urgency Assessment

## All Available Approaches

### Approach 1: Let the LLM Decide Urgency
- **How it works**: Pass symptoms to GPT/Gemini and ask it to classify urgency.
- **Pros**: Can reason about complex multi-symptom presentations. No rule maintenance needed.
- **Cons**: **Non-deterministic** — same symptoms can produce different urgency levels on different calls. Not auditable — you cannot prove WHY the LLM classified something as emergency. Literature [ref 26]: only 1.2% of healthcare LLM studies assess calibration/uncertainty. The LLM may hallucinate severity levels. **In healthcare, a missed emergency can be fatal** — you cannot rely on a probabilistic model for this.
- **Best for**: Low-stakes advisory systems, not clinical triage.

### Approach 2: Machine Learning Classifier (XGBoost, Random Forest, Neural Network)
- **How it works**: Train a supervised classifier on labeled symptom → urgency datasets.
- **Pros**: Can learn complex patterns from data. Handles feature interactions automatically.
- **Cons**: Requires large labeled training datasets (thousands of examples per urgency level) — these barely exist for Indian healthcare contexts. Black-box — cannot explain to a patient or auditor WHY a specific urgency was assigned. Requires ML frameworks (scikit-learn ~30MB, XGBoost ~100MB, PyTorch ~800MB). Prediction drift over time requires retraining. ED triage studies [ref 8] report 80–99% accuracy, but these use hospital-specific datasets that don't generalize.
- **Best for**: Hospital ED triage systems with years of historical patient data.

### Approach 3: Bayesian Network
- **How it works**: Probabilistic graphical model encoding conditional dependencies between symptoms and urgency levels.
- **Pros**: Interpretable — you can trace the probability chain. Handles uncertainty explicitly. Can incorporate prior medical knowledge.
- **Cons**: Requires probability estimation for every conditional relationship (hundreds of parameters). These probabilities must come from clinical data or expert elicitation — both expensive to obtain. Complex to implement and maintain. Limited library support compared to ML classifiers.
- **Best for**: Academic medical research with access to clinical statisticians.

### Approach 4: Fuzzy Logic System
- **How it works**: Define fuzzy membership functions for symptom severity (e.g., "fever" is 0.3 "mild" and 0.7 "moderate" at 38.5°C). Apply fuzzy rules and defuzzify to get urgency classification.
- **Pros**: Handles linguistic uncertainty naturally ("somewhat severe"). More nuanced than binary rules.
- **Cons**: Requires careful calibration of membership functions — needs clinical data. Harder to explain to non-technical stakeholders. More complex than necessary when symptoms are already described in discrete categories. Limited practical deployment in real clinical systems.
- **Best for**: Industrial control systems, academic medical decision-support research.

### Approach 5: Deterministic Rule-Based Engine (If-Then Rules)
- **How it works**: Define clinical rules based on established medical red-flag criteria. Match patient symptoms against rules. Calculate confidence using weighted scoring formula.
- **Pros**: **100% deterministic** — same input ALWAYS produces same output. **Fully transparent** — every triggered rule is logged and displayed. **Auditable** — a clinician can review and validate every rule. **Zero dependencies** — pure Python, no ML framework needed. **Literature-grounded** — rules can be directly mapped to medical textbook criteria. **Fast** — executes in <1ms.
- **Cons**: Cannot discover novel symptom patterns (unlike ML). Limited to pre-defined disease categories. Requires manual rule curation by domain experts. Cannot handle continuous-valued inputs as naturally as fuzzy logic.
- **Best for**: **Clinical decision support where transparency, auditability, and determinism are required.**

### Approach 6: Hybrid (Rule-Based + LLM Verification)
- **How it works**: Rule engine makes the primary urgency decision. LLM is optionally used to generate a natural-language explanation or catch edge cases the rules miss.
- **Pros**: Deterministic core + LLM flexibility. Best of both worlds.
- **Cons**: More complex architecture. Risk of LLM contradicting rule engine output.
- **Best for**: Advanced systems with resources to manage the complexity.

## ✅ Verdict for This System

| Component | Best Choice | Why |
|-----------|------------|-----|
| **Urgency classification** | **Approach 5: Deterministic Rule-Based Engine** | For a healthcare system, **a missed emergency can kill someone**. Determinism is non-negotiable — the system must produce identical results for identical inputs, every time. Rule-based is the ONLY approach that is simultaneously deterministic, transparent, auditable, zero-dependency, and literature-groundable. ML classifiers require training data we don't have. LLMs are non-deterministic. This is also the recommendation from the literature survey [Section XI] — "hybrid and neuro-symbolic designs are well suited to eligibility because many policy requirements can be expressed as explicit conditions" |
| **Confidence scoring** | **Weighted formula: (required_match × 0.70) + (supporting_match × 0.30)** | Separates "must-have" symptoms from "nice-to-have" supporting evidence. The 70/30 split ensures required symptoms dominate while supporting symptoms refine confidence |

---

# Module 4: Specialist Recommendation

## All Available Approaches

| Approach | How It Works | Pros | Cons | Verdict |
|----------|-------------|------|------|---------|
| **Direct mapping from disease → specialist** | Each disease rule has a pre-defined specialist field | Deterministic, instant, zero cost, auditable | Cannot handle complex multi-specialty cases | ✅ **Best for this system** — specialist recommendation is a DIRECT consequence of disease prediction. Adding another model/LLM creates another failure point without adding accuracy. Simple lookup is O(1) |
| **LLM-based recommendation** | Ask Gemini "what specialist for chest pain?" | Flexible, handles edge cases | Could hallucinate non-existent specialties (e.g., "Cardio-pulmonary Neurologist"). Non-deterministic | ❌ |
| **Collaborative filtering** | Recommend based on what similar patients chose | Personalized | Requires historical patient-specialist data we don't have. Privacy concerns | ❌ |
| **Knowledge graph traversal** | Traverse medical ontology (SNOMED-CT → specialist) | Semantically rich | Requires building/maintaining a medical knowledge graph. Overkill for 12 disease categories | ❌ |

---

# Module 5: Nearby Hospital Discovery

## All Available Approaches

| Approach | Coverage (India) | Real-Time Data | Cost | Offline Capability |
|----------|-----------------|---------------|------|-------------------|
| **Google Maps Places API** | **Excellent** — best hospital POI coverage in India, including Tier-2/3 cities | ✅ Yes — live data (hours, ratings, new facilities) | Pay-per-query (~$0.032 per nearby search) | ❌ No |
| **OpenStreetMap / Overpass API** | Moderate — volunteer-contributed, incomplete in rural India | Partial — depends on volunteer updates | Free | ✅ Yes (downloadable) |
| **HERE Maps API** | Good globally, moderate in India | ✅ Yes | Pay-per-query (comparable to Google) | ❌ No |
| **Static hospital database** | Fixed at time of data collection | ❌ No — becomes stale | Free | ✅ Yes |
| **Government NHA facility database** | Good for empanelled hospitals | ❌ No real-time data | Free | ✅ Yes |

### Distance Calculation Comparison

| Method | Accuracy | Complexity | Best For |
|--------|----------|-----------|---------|
| **Euclidean distance** | Poor for geographic distances | O(1) | Flat-surface approximations only |
| **Haversine formula** | Excellent (spherical Earth model, <0.3% error) | O(1) | **Geographic distance between two coordinates** |
| **Vincenty formula** | Near-perfect (ellipsoidal Earth model) | O(n) iterative | Geodetic surveying, navigation |
| **Google Distance Matrix API** | Perfect (actual road distance + traffic) | API call | When exact drive time is critical |

## ✅ Verdict for This System

| Component | Best Choice | Why |
|-----------|------------|-----|
| **Hospital search API** | **Google Maps Places API** | Unmatched hospital POI coverage in India. Real-time data (operating hours, new facilities). Same Google ecosystem as LLM and embeddings — single billing. With DB caching, repeated lookups are free |
| **Distance calculation** | **Haversine formula** | <0.3% error is negligible for "nearby hospital" use case. Pure Python, zero dependencies. Google Distance Matrix API costs extra per query and is unnecessary when approximate distance suffices |
| **Drive time** | **Heuristic estimate (distance × 2.5 min/km)** | Good enough for urban Indian traffic. Google Directions API would be more accurate but adds cost per query |

---

# Module 6: RAG Pipeline for Government Scheme Eligibility

> [!IMPORTANT]
> This is the most complex module. The analysis below independently evaluates every RAG variant, every embedding model, and every vector store option.

## 6A. Types of RAG — Complete Comparison

### Type 1: Naive RAG
- **How it works**: Embed query → retrieve top-K chunks → concatenate as context → send to LLM → generate answer.
- **Pros**: Simple to implement. Works well for general Q&A.
- **Cons**: No query optimization — the raw user query may not align well with document embeddings. No relevance filtering — all top-K chunks are used regardless of quality. No post-retrieval processing. Treats all queries identically — cannot handle multi-criteria eligibility questions. **For eligibility**: produces a single narrative answer without criterion-level breakdown. Cannot identify missing information. Cannot say "you meet criteria A but we need more info for criteria B."
- **Research evidence**: MIRAGE benchmark [ref 30] shows naive RAG still leaves considerable errors unresolved.

### Type 2: Advanced RAG
- **How it works**: Adds pre-retrieval optimization (query rewriting, HyDE — Hypothetical Document Embeddings, query expansion) + post-retrieval processing (re-ranking with cross-encoder, prompt compression, context filtering).
- **Pros**: Better retrieval quality than naive RAG. Query rewriting handles poorly phrased user inputs. Re-ranking improves precision significantly.
- **Cons**: Each optimization adds an LLM call (cost + latency). HyDE requires generating a hypothetical answer before retrieval — adds ~1 second. Cross-encoder re-ranking requires a separate model (adds dependency). Over-engineered for small corpora (<500 documents).
- **Best for**: Large document corpora (10K+ documents) where retrieval precision is critical.

### Type 3: Graph RAG (Microsoft)
- **How it works**: Extract entities and relationships from documents → build a knowledge graph → retrieve relevant subgraphs → use graph context for LLM generation.
- **Pros**: Captures document relationships that vector similarity misses. Excellent for interconnected information (e.g., medical ontologies, drug interactions).
- **Cons**: Requires entity extraction pipeline + graph database (Neo4j). Complex to build and maintain. Graph construction is expensive (multiple LLM calls per document). Overkill for policy documents with linear eligibility criteria — scheme documents don't have complex entity relationships like medical literature.
- **Best for**: Medical literature search, drug interaction databases, legal case law.

### Type 4: Agentic RAG
- **How it works**: An LLM agent decides WHEN to retrieve, WHAT query to use, WHETHER to retrieve again, and WHEN to stop. Uses tools (retrieval, calculator, web search) in a ReAct loop.
- **Pros**: Handles complex multi-hop reasoning. Can self-correct retrieval failures. Adapts strategy per query.
- **Cons**: **Unpredictable execution paths** — the agent might retrieve irrelevant documents or skip critical ones. Harder to audit. Higher latency (multiple LLM calls per query). Higher cost. For eligibility where every criterion matters, you need deterministic retrieval, not agent-driven exploration. Literature [ref 33, 34] shows clinical agents have limited prospective validation.
- **Best for**: Open-ended research tasks, complex multi-hop medical reasoning.

### Type 5: Modular RAG
- **How it works**: RAG pipeline broken into pluggable, interchangeable modules — routing, retrieval, re-ranking, generation — each independently configurable.
- **Pros**: Maximum flexibility. Can swap components (e.g., change vector store without changing retrieval logic).
- **Cons**: Architectural complexity. Each module interface must be well-defined.
- **Best for**: Enterprise systems that need to evolve components independently.

### Type 6: Structured Multi-Document RAG with Query Decomposition
- **How it works**: Decompose eligibility query into individual criteria → retrieve evidence for each criterion → evaluate each criterion independently (PASS/FAIL/UNKNOWN) → aggregate into overall status → provide source attribution per claim.
- **Pros**: **Directly solves the research gap** identified in the literature survey. Criterion-level evaluation prevents false binary decisions. Explicitly identifies missing information. Source attribution makes every claim auditable. Four-way status (ELIGIBLE/NOT_ELIGIBLE/POSSIBLY_ELIGIBLE/INSUFFICIENT_INFORMATION) handles real-world uncertainty. Inspired by TrialGPT's criterion-level matching [ref 36] adapted for policy documents. Insurance eligibility study [ref 46] showed missing information as major error source — this approach explicitly handles that.
- **Cons**: More complex than naive RAG. Criterion decomposition logic must be maintained.
- **Best for**: **Policy-based eligibility reasoning where every criterion matters and decisions have legal/financial consequences.**

## ✅ RAG Type Verdict

| Criterion | Naive | Advanced | Graph | Agentic | Modular | **Structured Multi-Doc** |
|-----------|-------|----------|-------|---------|---------|------------------------|
| Criterion-level evaluation | ❌ | ❌ | ❌ | Partial | ❌ | ✅ |
| Missing info identification | ❌ | ❌ | ❌ | Partial | ❌ | ✅ |
| Source attribution per claim | Partial | Partial | ✅ | Partial | Partial | ✅ |
| Deterministic retrieval | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Low complexity | ✅ | ❌ | ❌ | ❌ | ❌ | Moderate |
| Handles small corpus well | ✅ | Overkill | Overkill | Overkill | Overkill | ✅ |
| Handles eligibility specifically | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Best for this system** | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |

> **Winner: Structured Multi-Document RAG with Query Decomposition** — it is the only RAG type that addresses eligibility as a multi-criteria decision problem rather than a general Q&A problem.

---

## 6B. Embedding Model Comparison

| Model | Dimensions | Requires Local GPU/PyTorch? | RAM Cost | Quality (MTEB) | Cost |
|-------|-----------|---------------------------|----------|----------------|------|
| **Google `text-embedding-004`** | 768 | ❌ No (API call) | ~0 MB | Very good | ~$0.00001/query |
| `all-MiniLM-L6-v2` (Sentence-Transformers) | 384 | ✅ Yes (PyTorch ~800MB + model ~80MB) | ~1.1 GB | Good | Free |
| OpenAI `text-embedding-3-small` | 1536 | ❌ No (API call) | ~0 MB | Very good | ~$0.00002/query |
| OpenAI `text-embedding-3-large` | 3072 | ❌ No (API call) | ~0 MB | Excellent | ~$0.00013/query |
| `BAAI/bge-large-en-v1.5` | 1024 | ✅ Yes (PyTorch) | ~1.3 GB | Excellent | Free |
| Cohere `embed-english-v3.0` | 1024 | ❌ No (API call) | ~0 MB | Excellent | ~$0.0001/query |
| BioBERT / PubMedBERT | 768 | ✅ Yes (PyTorch) | ~1.2 GB | Good (medical domain) | Free |

## ✅ Embedding Verdict

**Winner: Google `text-embedding-004`**

| Reason | Explanation |
|--------|------------|
| Zero local dependencies | No PyTorch, no GPU, no model downloads. Pure API call |
| ~200MB RAM constraint | Sentence-Transformers/BioBERT would consume 1.1–1.3GB — **impossible** within our constraint |
| Ecosystem unity | Same Google API key as Gemini LLM and Google Maps — single billing, single credential |
| Quality | Competitive with OpenAI embeddings on MTEB benchmarks |
| Cost | Cheapest per-query cost among API-based options |

---

## 6C. Vector Store Comparison

| Vector Store | Type | RAM Usage | Dependencies | Best Scale | Exact Search? |
|-------------|------|-----------|-------------|-----------|--------------|
| **Pure Python JSON Store** | In-memory + file | ~5–20 MB (for <500 chunks) | Zero | <1,000 vectors | ✅ Yes (brute-force) |
| ChromaDB | Embedded DB | ~150–300 MB | onnxruntime, tokenizers, chromadb | 10K–1M vectors | ✅ Yes |
| FAISS (CPU) | In-memory index | ~100 MB (library) + index | faiss-cpu | 1M–1B vectors | Both (exact + ANN) |
| Pinecone | Cloud hosted | ~0 MB local | pinecone-client | 1M–1B vectors | ANN only |
| Weaviate | Self-hosted / cloud | ~500 MB+ (Docker) | Docker required | 1M+ vectors | Both |
| pgvector | PostgreSQL extension | ~0 MB extra | PostgreSQL extension | 100K–10M vectors | Both |
| Qdrant | Self-hosted / cloud | ~200 MB+ (Docker) | Docker / API | 1M+ vectors | Both |
| NumPy brute-force | In-memory | ~30 MB (NumPy) | numpy | <10,000 vectors | ✅ Yes |

## ✅ Vector Store Verdict

**Winner: Pure Python JSON Vector Store (brute-force cosine similarity)**

| Reason | Explanation |
|--------|------------|
| Corpus size | ~20 government scheme documents → ~100–500 chunks. **Brute-force on 500 vectors takes <5ms in pure Python** |
| Zero dependencies | No ChromaDB (150MB+), no FAISS (100MB+), no Docker |
| Exact search | At <500 vectors, brute-force IS more accurate than ANN (Approximate Nearest Neighbor) — ANN trades accuracy for speed, but speed is already instant |
| RAM constraint | JSON store uses ~5–20MB. ChromaDB uses 150–300MB. Decision is obvious under 200MB constraint |
| Persistence | Simple JSON file — human-readable, debuggable, portable |
| **When to upgrade** | If corpus grows to 5,000+ chunks → migrate to FAISS or pgvector |

---

## 6D. LLM for RAG Response Generation

| Model | Cost | Quality | Hallucination Risk | Ecosystem Fit |
|-------|------|---------|-------------------|---------------|
| GPT-4o | High ($10/1M output tokens) | Excellent | Low with grounding | ❌ Separate vendor |
| GPT-4o-mini | Low ($0.60/1M output) | Good | Moderate | ❌ Separate vendor |
| Claude 3.5 Sonnet | High ($15/1M output) | Excellent | Low | ❌ No embedding/maps integration |
| **Gemini 2.5 Flash** | **Very Low ($0.60/1M output)** | **Very Good** | **Low with grounding** | **✅ Same API key as embeddings + Maps** |
| Open-source (Llama 3, Mistral) | Free (but GPU hosting cost) | Good–Very Good | Higher without fine-tuning | ❌ Requires GPU infrastructure |

## ✅ LLM Verdict

**Winner: Gemini 2.5 Flash at temperature 0.2**
- Cheapest high-quality API option
- Unified Google ecosystem (one API key for LLM + embeddings + Maps)
- Temperature 0.2 balances natural language with factual grounding
- System prompt enforces "ONLY use retrieved context" — prevents parametric hallucination

---

# Module 7: AI Guardrails / Safety Layer

## All Available Approaches

| Approach | Speed | Accuracy | Dependencies | Cost |
|----------|-------|----------|-------------|------|
| **Keyword blocklist only** | <1ms | Low (high false positives/negatives) | None | Free |
| **LLM-based classification only** | 500–2000ms | High | LLM API | Per-query cost |
| **Fine-tuned classifier (BERT/DistilBERT)** | 10–50ms | High | PyTorch (~800MB) | Free after training |
| **✅ Dual-layer: keyword first → LLM second** | <1ms for obvious cases, ~1s for ambiguous | **High** | LLM API (only when needed) | **Minimal** (LLM called only for edge cases) |
| **Guardrails.ai framework** | Variable | High | Additional library | Free |

## ✅ Verdict

**Winner: Dual-layer (keyword + LLM)** — Fast rejection of obvious non-medical queries (0ms). LLM evaluation only for ambiguous cases. No additional dependencies. Lowest cost.

---

# Module 8: Patient Context Management

## All Available Approaches

| Approach | Persistence | Query Flexibility | Complexity | Interoperability |
|----------|------------|-------------------|-----------|-----------------|
| **LLM conversation memory (buffer)** | ❌ Lost on restart | ❌ Limited | Low | ❌ None |
| **FHIR-based patient record** | ✅ Yes | ✅ Yes | Very High (HL7 standards) | ✅ Healthcare standard |
| **✅ PostgreSQL relational schema** | ✅ Yes | ✅ Yes (SQL) | **Moderate** | Moderate |
| **NoSQL document store (MongoDB)** | ✅ Yes | Partial (no joins) | Moderate | Low |

## ✅ Verdict

**Winner: PostgreSQL relational schema** — Patient data has clear relationships (patient → allergies, conditions, medications, conversations). SQL joins handle these naturally. FHIR is the industry standard but adds massive complexity (HL7 resource types, bundle management, validation) that is disproportionate for an MVP. PostgreSQL captures the same data in a simpler, queryable format.

---

# Module 9: Database

## All Available Approaches

| Database | Async Support | Relational | Free Hosting | Scalability |
|----------|--------------|-----------|-------------|-------------|
| **PostgreSQL** | ✅ (asyncpg) | ✅ Full SQL | ✅ (Supabase, Neon) | Excellent |
| MySQL | ✅ (aiomysql) | ✅ Full SQL | ✅ (PlanetScale) | Good |
| SQLite | ❌ (single-writer) | ✅ SQL | ✅ (file-based) | ❌ Poor |
| MongoDB | ✅ (motor) | ❌ NoSQL | ✅ (Atlas free) | Excellent |
| Firebase | ✅ | ❌ NoSQL | ✅ (Spark plan) | Good |

## ✅ Verdict

**Winner: PostgreSQL + SQLAlchemy Async + Alembic**
- Full relational support for complex joins (eligibility evidence → scheme documents → schemes)
- Async ORM prevents blocking FastAPI's event loop
- Free hosting via Supabase/Neon
- Alembic provides version-controlled schema migrations
- Industry standard for production Python backends

---

# Module 10: Healthcare Tips Generation

## ✅ Verdict

**Winner: LLM-generated personalized tips with static fallback** — Uses patient context (age, gender, allergies, conditions) to generate relevant tips. Static fallback ensures feature works without API key. System prompt explicitly prevents diagnosis/treatment — tips are limited to general wellness guidance.

---

# Module 11: Frontend

## All Available Approaches

| Framework | SSR/SSG | TypeScript | Ecosystem | Learning Curve | Deployment |
|-----------|---------|-----------|-----------|---------------|------------|
| **Next.js 14** | ✅ Both | ✅ Native | Massive | Moderate | Vercel (zero-config) |
| React (CRA/Vite) | ❌ CSR only | ✅ Supported | Massive | Low | Manual |
| Vue 3 / Nuxt 3 | ✅ (Nuxt) | ✅ Supported | Large | Low | Manual |
| Angular | ✅ (Universal) | ✅ Native | Large | High | Manual |
| SvelteKit | ✅ Both | ✅ Supported | Growing | Low | Vercel/Netlify |

## ✅ Verdict

**Winner: Next.js 14 + Tailwind CSS** — SSR/SSG for performance and SEO. TypeScript for type safety across API boundaries. Zero-config Vercel deployment. Largest component ecosystem (healthcare UI libraries). App Router provides modern file-based routing.

---

# Summary: Best Approach Per Module

| # | Module | Best Approach | Key Reason |
|---|--------|--------------|------------|
| 1 | Authentication | JWT (dual token) + bcrypt | Stateless for API-first. bcrypt balances security vs RAM |
| 2 | Symptom Intake | Gemini 2.5 Flash via LangGraph | Multi-turn captures 3-5x more clinical detail. Cheapest high-quality API |
| 3 | Severity/Urgency | Deterministic rule-based engine | **Only approach that is simultaneously deterministic, transparent, auditable, and zero-dependency** |
| 4 | Specialist Recommendation | Direct disease → specialist mapping | O(1) lookup. Adding ML/LLM creates failure points without adding accuracy |
| 5 | Hospital Finder | Google Maps Places API + Haversine | Best hospital coverage in India. Haversine is exact enough for "nearby" |
| 6 | RAG Type | Structured Multi-Document RAG with Query Decomposition | **Only RAG type that handles eligibility as a multi-criteria decision problem** |
| 6 | Embeddings | Google text-embedding-004 | Zero local deps. Same ecosystem as LLM + Maps |
| 6 | Vector Store | Pure Python JSON (brute-force cosine) | <500 vectors → brute-force is faster AND more accurate than ANN |
| 6 | RAG LLM | Gemini 2.5 Flash (temp 0.2) | Cheapest. Grounded generation via system prompt |
| 7 | Guardrails | Dual-layer (keyword + LLM) | Fast path for obvious cases. LLM only for edge cases |
| 8 | Patient Context | PostgreSQL relational schema | Simpler than FHIR. Full SQL query flexibility |
| 9 | Database | PostgreSQL + async SQLAlchemy | Relational joins for eligibility evidence. Free hosting available |
| 10 | Health Tips | LLM + static fallback | Personalized by patient context. Safe fallback |
| 11 | Frontend | Next.js 14 + Tailwind CSS | SSR/SSG + zero-config Vercel deployment |

---

# Validation & Fine-Tuning Strategy

## LLM Validation Techniques

| Technique | Where Applied | Purpose |
|-----------|--------------|---------|
| Low temperature (0.1–0.2) | Triage agent, RAG pipeline | Minimizes hallucination |
| Structured JSON output | Triage agent, guardrails | Enforces parseable, predictable responses |
| "ONLY use retrieved context" | RAG prompt | Prevents parametric knowledge hallucination |
| Confidence scoring | RAG pipeline | Quantifies retrieval quality |
| Low-confidence flag (<0.65) | RAG pipeline | Communicates uncertainty to user |
| Emergency keyword detection | Triage agent | Dual-path (LLM + rule) ensures emergencies never missed |
| Mock fallback | All LLM modules | System never crashes if LLM fails |
| Criterion-level evaluation | Eligibility engine | Prevents false binary decisions |

## Fine-Tuning Roadmap

| Component | Current State | When to Fine-Tune | How |
|-----------|-------------|-------------------|-----|
| Triage LLM | Prompt engineering | After 1000+ real conversations | Fine-tune on `conversation → symptoms` pairs |
| Severity rules | 12 disease categories | When coverage gaps emerge | Add rules — no ML needed |
| Embeddings | General-purpose `text-embedding-004` | If retrieval accuracy <80% | Google's embedding fine-tuning API on `query → correct chunk` pairs |
| RAG LLM | Prompt engineering (temp 0.2) | After 500+ human-validated eligibility results | Fine-tune on `(query, context) → eligibility_result` |
| Guardrails | Keyword + LLM | If adversarial attacks become frequent | Train lightweight text classifier |

> [!TIP]
> **Philosophy**: Prefer **prompt engineering** over fine-tuning. Fine-tuning is expensive, creates model versioning complexity, and makes updates slow. Prompt changes are instant, free, and reversible. Fine-tune only when prompt engineering demonstrably hits a ceiling.
