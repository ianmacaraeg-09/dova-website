# DOVA — Session Context Handoff

Paste this into a new Claude Code session (or attach the file) to resume this conversation with full context.

## Who's asking

I'm the Operations Head and IT lead for DOVA — I own execution of the AI Agent integration and the technical build, not just coding tasks.

## What DOVA is

DOVA is a founder-led "AI-native systems studio" (Angeles City, Pampanga, PH). It builds custom operational systems (website + backend — bookings, POS, payments, inventory, CRM) for small businesses, starting from reusable **presets** and reworking them to fit each client's actual workflow — not selling generic SaaS templates. Live site analyzed: https://creative-blancmange-4d5c59.netlify.app/ — local source lives in this project directory (`index.html`, `css/`, `js/`, `assets/`).

**Pricing model:** ₱24,999 one-time install + ₱2,500/mo maintenance for the core system (no agents required). Agents are sold separately, per specialist: first agent ₱7,999/mo, 2nd–3rd ₱6,499/mo each, 4th+ ₱4,999/mo each, or a bundled "full desk" (all six) as one line.

## The AI Agent layer (the core differentiator)

Every agent follows one loop: **READS** (live records, not a copy) → **DECIDES** (against owner-set limits) → **ACTS** (replies, confirms, reorders) → **REPORTS** (every action logged, reversible).

Six named specialists:

| Agent | Job | Key capabilities |
|---|---|---|
| **Echo** | 24/7 helpdesk | Replies <60s across web/Messenger/SMS, quotes from price list, escalation rules |
| **Hora** | Bookings & scheduling | Confirms/reschedules, deposit chasing, releases dead holds, no-show rules |
| **Argo** | Inventory & supplier outreach | Reorder alerts, automated POs, price comparison |
| **Obol** | Payments & collections | Payment follow-up, ageing watch, auto-stops once paid |
| **Eos** | Owner's daily brief | Reads every module overnight, writes morning summary + anomaly flags |
| **Charis** | Follow-up & reviews / lead gen | Win-back sends, review requests, enquiry capture + email sequences |

Trust mechanics repeatedly emphasized on the site: agents act on live data (not copies), decisions are bounded by owner-set limits (e.g., refunds above ₱1,500 held for a human call), every action is logged and reversible, and agent adoption is modular/optional per client.

## My current stack

Supabase, Netlify, Cloudflare, GitHub, n8n, HTML/CSS/JS, Bootstrap/Tailwind, GSAP.

I've also built a local prototype AI agent (using **Google ADK**, originally Gemini as the LLM, switched to **Groq** after hitting Gemini's rate limits) that reads/organizes tasks, creates/updates tasks, does day planning, overdue detection, and daily EOD reporting. This prototype is functionally close to **Eos** and is the recommended starting point for productizing the first real agent.

## Key decisions/recommendations made this session

### 1. Role positioning
As Ops Head + IT, I should own: the preset library (turning one-off builds into reusable modules), delivery process (the "sit in the operation" → pilot → handoff cycle), the agent layer as a *product* (consistent internal architecture, not a rebuild per client), compliance/infra (BIR receipting, PH Data Privacy Act, hosting/security patching — all promised in the maintenance tier), and vendor relationships (payment gateway, SMS/Messenger APIs, LLM provider).

### 2. Stack gaps to fill
Payment gateway integration (PayMongo/Xendit for GCash), Messenger/SMS webhook handling (Meta Graph API, Semaphore for SMS), BIR-compliant receipting rules (domain knowledge, not code), offline-first sync for POS builds (local queue + reconciliation — no current stack item covers this). My existing Supabase + Cloudflare + n8n combo can likely cover backend/agent orchestration needs without a separate Node/Express server.

### 3. LLM recommendation — tiered by agent, single vendor (Anthropic)
- **Claude Haiku 4.5** as the default for Echo, Hora, Argo, Obol, Charis — best cost/reliability tradeoff for tool-calling at SMB volume.
- **Claude Sonnet 5** reserved for **Eos** (no latency pressure, needs deeper cross-module synthesis) and any escalations needing more nuanced reasoning.
- **Groq** (free/cheap open models) only as a pre-filter/classifier for high-volume, zero-stakes routing — never as the decision-maker for anything touching money or commitments. Its free tier (1,000 req/day) won't survive real client traffic.
- Rationale: at realistic SMB volume, raw LLM cost is a rounding error against the ₱4,999–7,999/mo per-agent price (~₱620–1,125/month for a busy Echo on Haiku 4.5, even before prompt caching). Reliability, not token price, is the real cost lever — a single bad autonomous action (wrong refund, wrong booking) costs more than any per-token savings. Consolidating on one vendor also simplifies the guardrail/audit layer and tool-calling integration for a near-solo dev/ops function.
- Current pricing (per million tokens, Sept 2026, ~₱62.50/USD): Haiku 4.5 $1/$5 (₱62.50/₱312.50), Sonnet 5 $2–3/$10–15 (promo through Aug 31 2026), Opus 5 $5/$25. Groq Llama 3.1 8B $0.05/$0.08; GPT-5 mini $0.25/$2.00; Gemini 2.5 Flash-Lite $0.10/$0.40 — all considered but not recommended as primary, for reliability reasons above.

### 4. Groq-for-testing → Claude-for-production is a valid pattern
Confirmed workable. What actually changes when swapping: request format (Groq is OpenAI-compatible chat-completions; Claude's native Messages API differs), response parsing, tool-schema wrapper. What stays the same: business logic, prompts' intent, tool definitions, guardrail design. Anthropic does offer an OpenAI-SDK-compatible endpoint, but it's explicitly not recommended for production — tool-call JSON isn't guaranteed to strictly follow the schema through that layer. Build a single adapter/wrapper function per provider from day one so the swap later is a small, contained change rather than a hunt through scattered hardcoded calls; budget real time for **re-validating model behavior** (tool-call timing, tone, guardrail adherence) after any swap — that part never goes away regardless of architecture.

### 5. Google ADK note
Since my prototype is Google ADK, switching its LLM from Gemini to Groq was likely routed through ADK's **LiteLLM** integration — a translation layer that normalizes request/response format across providers, which is why "just changing the API key" worked. LiteLLM also supports Anthropic models, so ADK → Claude Haiku 4.5 should similarly be close to a config change. Caveat: feature parity isn't guaranteed through a translation layer (e.g., prompt-caching controls, strict tool-schema guarantees) — verify before trusting it with real guardrail logic.

### 6. ADK vs. native Claude tool-calling — for production agents
**Recommendation: native Claude tool-calling for money-touching, customer-facing agents (Echo, Hora, Obol); ADK is fine to keep for lower-stakes, internal agents (Eos) where I already have working experience.**
Reasoning: DOVA's agents coordinate via shared Supabase state (a shared `agent_actions` log + live tables), not agent-to-agent messaging — so ADK's multi-agent orchestration primitives solve a problem this architecture doesn't have. The provider-flexibility benefit of ADK+LiteLLM also matters less since the LLM vendor decision is already made (Anthropic, tiered by agent). Native = fewer dependencies for a solo dev/ops function, more direct debugging, guaranteed tool-schema reliability. ADK's smoothest deployment path is Google Cloud (Vertex AI Agent Engine) — doesn't naturally fit a stack that's otherwise Supabase/Netlify/Cloudflare/n8n (JS/edge-native), whereas ADK is Python and needs its own hosted service (small VPS/Railway/Render).

### 7. Security comparison — ADK+LiteLLM vs native Claude
Native Claude has a narrower trust boundary (fewer hops = fewer places for a dependency bug or data mishandling to occur). Key nuance: if using LiteLLM as an embedded **library**, no extra third party sees data; if using LiteLLM's **hosted proxy**, customer/payment data transits a third company's servers — relevant for PH Data Privacy Act compliance, must confirm which mode is actually in use. Guardrail engineering (least-privilege tool scoping, server-side limit enforcement, input validation) is identical work regardless of runtime — no framework provides this for free. Supply-chain risk (more open-source deps to patch) is higher on the ADK+LiteLLM path.

**Security stack (mostly identical between both paths):** Supabase (Vault, Auth, RLS, `agent_actions` audit table), Cloudflare (WAF, rate limiting, Turnstile — free plan lacks WAF/rate limiting, need Pro ~$20–25/mo), n8n (orchestration), Zod (TS) or Pydantic (Python) for tool-call schema validation, GitHub Dependabot for dependency scanning (free; Snyk paid only needed at scale, more likely relevant on the larger ADK+LiteLLM dependency surface).

**Cost delta between the two paths is small (~₱310–440/month):** driven almost entirely by ADK needing its own Python-capable host (VPS/Railway/Render) since it doesn't fit Cloudflare Workers or Supabase Edge Functions (Deno/TS). The bigger ongoing cost is time — patching two extra dependencies and potentially chasing an extra vendor DPA (Google's, and LiteLLM's if using their hosted proxy) rather than just Anthropic's.

### 8. Eos architecture sketch (from my existing prototype)

**Data layer (Supabase/Postgres):**
```
tasks            -- id, title, description, status, priority, assignee, due_date, source_module, created_at, updated_at
eod_reports      -- id, staff_id, report_date, raw_text, structured_summary, created_at
daily_briefs     -- id, brief_date, summary_text, anomalies (jsonb), generated_at, sent_at
agent_actions    -- shared audit log across ALL agents: id, agent, action_type, payload (jsonb), reversible, reversed_at, created_at
agent_config     -- per-client tuning: id, client_id, agent, thresholds (jsonb), enabled_tools (jsonb), model
```
Eos reads from the same live tables other presets write to — not a copy.

**Orchestration (n8n), three separate flows:**
1. **Daily Brief** (cron ~06:00): query yesterday's bookings/orders/payments/tasks/EOD reports → compile structured JSON → Claude (Sonnet 5) generates brief + anomaly flags → write to `daily_briefs` + `agent_actions` → deliver via email/SMS/dashboard → immediate alert if anomaly severity crosses threshold in `agent_config`.
2. **Overdue Detection** (cron, every few hours): keep this **deterministic/SQL-only, no LLM call** (`due_date < now() AND status != 'done'`) — cheaper and more reliable than asking a model to "notice" overdue items; feed the result into the brief.
3. **"Ask anything"** (webhook, on-demand): Claude tool-calling with defined tools (`get_tasks`, `get_eod_reports`, `get_sales_summary`, `get_overdue`) rather than dumping the whole DB into context each time.

**Guardrails for Eos specifically:** lowest-stakes agent (no money moves, no bookings change) — good agent to validate the audit pattern on first. Scope tools narrowly: allowed `create_task`, `update_task_status`; not allowed `delete_task` or anything touching payments/bookings (that's Obol's/Hora's job).

**Migration path from my prototype:** point existing task/EOD logic at Supabase tables → move cron/webhook triggers into n8n flows → swap model calls into the tool-calling pattern (start with just `get_tasks`/`create_task`, add more incrementally) → add `agent_actions` logging before adding any new write capability.

## Open next steps

- Decide production LLM/runtime split concretely per agent (leaning: native Claude for Echo/Hora/Obol/Argo/Charis, ADK acceptable for Eos).
- Build the `agent_actions` + `agent_config` schema in Supabase before extending write permissions to any agent.
- Confirm which LiteLLM deployment mode (library vs. hosted proxy) is actually in use if ADK is kept for Eos, for Data Privacy Act purposes.
- Fill stack gaps: payment gateway (PayMongo/Xendit), Messenger/SMS webhook integration, BIR receipting rules, offline-first sync pattern for POS-style builds.
- Turn the Eos prototype into the first fully productized agent before touching Hora/Argo/Obol/Charis.
