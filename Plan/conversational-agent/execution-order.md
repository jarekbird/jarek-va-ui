## Execution Order for ElevenLabs Integration

### 1 Create and Align Environment & Feature Flags

- **Scope:** All services (`jarek-va-ui`, `cursor-runner`, `elevenlabs-agent`).
- **Subtasks:**
  - Add `VITE_ELEVENLABS_AGENT_ENABLED` (default `false`) to `jarek-va-ui` env and document its use.
  - Add `ELEVENLABS_AGENT_ENABLED` (default `false`) to `cursor-runner` env and Docker configuration.
  - Add `ELEVENLABS_AGENT_ENABLED` (default `false`) to `elevenlabs-agent` service env and Docker configuration.
  - Add `VITE_ELEVENLABS_AGENT_URL` and, if needed, `VITE_ELEVENLABS_AGENT_ID`, `VITE_ELEVENLABS_AGENT_PUBLIC` to `jarek-va-ui` env.
  - Add `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `WEBHOOK_SECRET`, `CURSOR_RUNNER_URL`, `REDIS_URL` to `elevenlabs-agent` env (with safe defaults for dev).
  - Ensure shared Redis instance is available to `cursor-runner` and `elevenlabs-agent` via Docker network.

### 2 Verify Current Conversation & Note-Taking Flows

- **Scope:** `cursor-runner`, `jarek-va-ui`.
- **Subtasks:**
  - Trace how `cursor:conversation:{conversationId}` is created and read in `cursor-runner`.
  - Confirm `jarek-va-ui` conversation list/detail screens and their dependency on `/conversations/api/*`.
  - Capture baseline behavior (screenshots or notes) for regression comparison.
  - Add or review minimal automated tests that exercise `/conversations/api/*` list/detail flows so that the current behavior is locked in before renaming.

### 3 Rename Conversations to “Note Taking History” in UI Only

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Update labels in `ConversationListView.tsx` from “Conversation History” to “Note Taking History`.
  - Update headings and labels in `ConversationDetails.tsx` and `ConversationDetailView.tsx`.
  - Adjust any references in `App.tsx` or routing components that show “Conversations” in titles.
  - Update comments in `src/api/conversations.ts` and `src/types/index.ts` to clarify “note-taking” purpose.
  - Manually verify that endpoints remain `/conversations/api/*` and that behavior is unchanged.
  - Update or add component tests that assert the new labels while confirming that data loading behavior is unchanged.

### 4 Introduce Agent Conversation Types in Frontend

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Create `src/types/agent-conversation.ts` with `AgentConversation` and `AgentMessage` interfaces from the plan.
  - Ensure timestamps and IDs are treated as strings (or numbers) consistently and documented.
  - Add any shared type aliases or enums for message `role` and `source` to avoid duplication.

### 5 Implement Agent Conversation API Client

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Create `src/api/agent-conversations.ts` with:
    - `listAgentConversations()`.
    - `getAgentConversation(id: string)`.
    - `createAgentConversation()` (POST).
  - Wire these functions to `/agent-conversations/api/*` routes.
  - Centralize base URL configuration (re-using API base logic from existing `api` modules where sensible).
  - Add basic error handling and TypeScript typings.

### 6 Scaffold Agent Conversation List/Detail Views

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Create `AgentConversationListView.tsx` that:
    - Lists conversations using `listAgentConversations()`.
    - Shows loading and error states.
  - Create `AgentConversationDetailView.tsx` as a wrapper for a single conversation, driven by route param.
  - Create `AgentConversationDetails.tsx` as the main detail component (without voice yet):
    - Shows messages.
    - Provides a basic text input to send text-only messages (stubbed for now if backend not ready).
  - Add navigation to “Agent Conversations” in the main app layout or side nav.
  - Add routes for list and detail views in `App.tsx` or router configuration.
  - Treat these views as building blocks that will be embedded into the **Dashboard** (AgentChatPanel) rather than as the final standalone UI.

### 7 Add Repository File Browser Backend Endpoint

- **Scope:** `cursor-runner`.
- **Subtasks:**
  - Implement `GET /repositories/api/:repository/files` endpoint returning a `FileNode[]` tree.
  - Re-use existing filesystem utilities (e.g., FilesystemService) to build a nested directory tree.
  - Filter out `.git`, `node_modules`, and other heavy/ignored directories.
  - Add unit tests for the file tree generation (including large/empty directories).

### 8 Implement Repository File Browser Component

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Create `RepositoryFileBrowser.tsx` to render a read-only tree:
    - Collapsible directories.
    - File/folder icons.
    - Display full paths or tooltips for deep paths.
  - Create an `api` helper for `/repositories/api/:repository/files`.
  - Add the file browser to the note-taking detail view (or a dedicated tab) with clear “browse-only” messaging; this will later surface primarily via the Dashboard’s **NoteTakingPanel**.
  - Add minimal styling to fit existing layout (no UX regressions on smaller screens).

### 9 Wire File Browser to the Correct Repository Context

- **Scope:** `cursor-runner`, `jarek-va-ui`.
- **Subtasks:**
  - Decide how the repository is identified for a note-taking session (conversation metadata, route param, or global context).
  - Ensure `RepositoryFileBrowser` is passed the correct repository identifier.
  - Handle cases where repository metadata is missing (render a helpful empty state).

### 10 Scaffold elevenlabs-agent Service Project

- **Scope:** new `elevenlabs-agent` Node/TypeScript service.
- **Subtasks:**
  - Initialize a minimal Node+TypeScript project with `tsconfig`, `eslint` (optional), and `jest`/`vitest` (optional).
  - Create the directory structure from the plan (src/server.ts, routes, services, types).
  - Add core dependencies: Express, a Redis client, HTTP client (e.g., `node-fetch`/`axios`), TypeScript, etc.
  - Add basic `npm` scripts for `dev`, `build`, and `start`.

### 11 Implement Basic Express Server and Health Check

- **Scope:** `elevenlabs-agent`.
- **Subtasks:**
  - Implement `src/server.ts` with:
    - JSON body parsing.
    - Basic logging (or reuse existing middleware style from other services).
    - `GET /health` returning simple JSON and Redis connectivity status.
  - Wire environment variable loading (e.g., `dotenv` in development).
  - Add graceful shutdown handling for Redis and HTTP server.

### 12 Implement Redis Session Store Service

- **Scope:** `elevenlabs-agent`.
- **Subtasks:**
  - Implement `services/session-store.ts`:
    - Functions to set, get, and delete `elevenlabs:session:{conversation_id}` entries with TTL.
    - Store `sessionPayload`, `wsUrl`, `createdAt`, and `ttl` as described in the plan.
  - Enforce the “raw push-capable payload” rule and document it in code comments.
  - Add tests for TTL behavior and schema backwards compatibility.
  - Implement an **Agent Conversation Service** (e.g., `services/agent-conversation-service.ts`) that stores `elevenlabs:conversation:{conversationId}` documents in Redis as described in the master plan.
  - Implement `/agent-conversations/api/*` routes in a dedicated route file (e.g., `routes/agent-conversation-routes.ts`) to:
    - List conversations.
    - Get a specific conversation.
    - Create a new conversation.
    - Append messages to a conversation.
  - Ensure these routes are protected by `ELEVENLABS_AGENT_ENABLED` and align their shapes with the frontend types in `src/types/agent-conversation.ts`.

### 13 Implement Callback Queue Service

- **Scope:** `elevenlabs-agent`.
- **Subtasks:**
  - Implement `services/callback-queue.ts`:
    - Functions to create, update, and read `cursor_task:{taskId}` entries.
    - Store `conversationId`, `sessionPayload`, `wsUrl`, `pending`, `createdAt`, `toolName`, and `toolArgs`.
  - Add a TTL (~24h) for callback tasks.
  - Add tests to validate race-condition safe behavior (out-of-order completion).

### 14 Implement ElevenLabs API Client

- **Scope:** `elevenlabs-agent`.
- **Subtasks:**
  - Implement `services/elevenlabs-api.ts` with:
    - `getSignedUrl(agentId?: string)` calling the ElevenLabs signed URL endpoint.
    - Typed responses and robust error handling (timeout, non-200 status).
  - Ensure API key is passed from `ELEVENLABS_API_KEY` and never logged.
  - Add unit tests for success and error paths (mock HTTP).

### 15 Implement Cursor Runner HTTP Client

- **Scope:** `elevenlabs-agent`.
- **Subtasks:**
  - Implement `services/cursor-client.ts` with:
    - `startAsyncCursorTask(taskId, payload, callbackUrl)` calling `/cursor/iterate/async`.
  - Make base URL configurable via `CURSOR_RUNNER_URL`.
  - Handle network errors with clear logs and non-fatal behavior toward ElevenLabs caller.

### 16 Implement Signed URL Route

- **Scope:** `elevenlabs-agent`.
- **Subtasks:**
  - Implement `routes/signed-url.ts` with `GET /signed-url`:
    - Optional `agentId` query param.
    - Calls `elevenlabs-api.getSignedUrl`.
    - Returns `{ signedUrl, expiresAt? }`.
  - Gate the route with `ELEVENLABS_AGENT_ENABLED` flag (return 503 if disabled).
  - Add basic rate limiting or logging if necessary.

### 17 Implement Session Registration Route

- **Scope:** `elevenlabs-agent`.
- **Subtasks:**
  - Implement `POST /agent-conversations/api/:id/session` in a new route file.
  - Validate body contains `sessionUrl` and optional metadata as per plan.
  - Write to Redis via `session-store` with TTL = 10 minutes.
  - Return `{ success: true, message: "Session registered" }`.
  - Ensure route is behind `ELEVENLABS_AGENT_ENABLED` flag.

### 18 Implement Agent Tools Webhook Route

- **Scope:** `elevenlabs-agent`.
- **Subtasks:**
  - Implement `POST /agent-tools`:
    - Verify `WEBHOOK_SECRET` / Authorization header.
    - Parse `tool`, `args`, and `conversation_id`.
    - Look up active session from Redis; fail gracefully if none.
    - Create a callback task in Redis with session payload and task metadata.
    - Invoke `cursor-client.startAsyncCursorTask` with callback URL pointing back to `/callback`.
    - Respond immediately to ElevenLabs with “task started” message and `requestId`.
  - Route non-cursor “fast tools” synchronously (if any).

### 19 Implement Callback Route for Cursor Completion

- **Scope:** `elevenlabs-agent`.
- **Subtasks:**
  - Implement `POST /callback`:
    - Validate incoming `requestId` and result payload.
    - Look up `cursor_task:{taskId}` in Redis.
    - If missing, log and return success (idempotent behavior).
    - Retrieve `sessionPayload` and `wsUrl` from the stored callback task.
    - Construct MVP `input_text` message JSON summarizing the task result.
    - Push the message to ElevenLabs via the stored endpoint (WebSocket or HTTP as required).
    - Mark task as completed in Redis (update `pending` flag and `completedAt`).

### 20 Containerize elevenlabs-agent and Wire into Docker/Trafik

- **Scope:** `elevenlabs-agent`, root Docker orchestration.
- **Subtasks:**
  - Implement `Dockerfile` for elevenlabs-agent, mirroring patterns from `cursor-runner`.
  - Add `elevenlabs-agent` service to docker-compose with:
    - Shared network.
    - Environment variables.
    - Redis connection.
  - Add Traefik routing rules to expose `/elevenlabs/*` or `/agent/*` paths.
  - Smoke test health endpoint through Traefik.

### 21 Add ElevenLabs API Client to Frontend

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Create `src/api/elevenlabs.ts` with:
    - `getVoiceSignedUrl(agentId?: string)`.
    - `registerSession(conversationId, sessionData)`.
  - Use `VITE_ELEVENLABS_AGENT_URL` as base.
  - Provide clear error messages and type definitions.
  - Add unit tests (mocking HTTP) for `getVoiceSignedUrl` and `registerSession` success and failure paths.

### 22 Install ElevenLabs Client SDK in Frontend

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Add `@elevenlabs/client` dependency to `package.json`.
  - Ensure it is included in lockfile and CI/tests still pass.
  - If needed, add type declarations or ambient types.

### 23 Implement Retry Utility with Exponential Backoff

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Implement `src/utils/retry.ts` with `retryWithBackoff` and `RetryOptions` per plan.
  - Support configurable `maxRetries`, delays, and callbacks for logging.
  - Add unit tests to confirm timing and retry behavior.

### 24 Design ElevenLabs Voice Service Interface

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Define a TypeScript interface or class contract for `elevenlabs-voice` service:
    - Methods: `startVoiceSession`, `endVoiceSession`, `getConnectionStatus`, `sendTextToAgent`.
    - Events/hooks for `onConnect`, `onDisconnect`, `onModeChange`, `onError`, `onMessage`.
  - Decide on state machine states (`connecting`, `connected`, `reconnecting`, `failed`, `disconnected`).
  - Document the interface in comments referencing the plan sections.

### 25 Implement Basic Voice Service Connection Flow

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Implement `src/services/elevenlabs-voice.ts`:
    - Initialize ElevenLabs SDK and create a connection to the agent.
    - Manage microphone permission requests.
    - Expose `startVoiceSession` and `endVoiceSession`.
  - Integrate use of `getVoiceSignedUrl` when agent is private.
  - Ensure service respects `VITE_ELEVENLABS_AGENT_ENABLED` flag.
  - Add unit tests (or integration-style tests with a mocked SDK) to verify basic connect/disconnect flows and state transitions.

### 26 Implement Session Registration from Voice Service

- **Scope:** `jarek-va-ui`, `elevenlabs-agent`.
- **Subtasks:**
  - On successful connection (`onConnect`), extract `sessionUrl` (or equivalent push-capable payload) from the ElevenLabs session object.
  - Call `registerSession(conversationId, { sessionUrl, ... })` to persist session in Redis.
  - Handle registration failures (e.g., show toast, disable cursor-powered tools).

### 27 Implement Signed URL Expiration Handling in Voice Service

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Track `signedUrl` issuance time and TTL (if provided).
  - Use timers to proactively renew signed URLs 5 minutes before expiration.
  - Handle ElevenLabs expiration errors by automatically fetching a new URL and reconnecting.
  - Provide user feedback (e.g., “Reconnecting to voice agent...”).

### 28 Implement Network Failure Handling in Voice Service

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Use `retryWithBackoff` to implement reconnection with exponential backoff.
  - Implement heartbeat messages and health checks at 30-second intervals.
  - Add timeouts for initial connection and ongoing operations.
  - Detect dropped audio, partial transcripts, and stuck speaking modes per plan.
  - Add fallback logic for missing `onModeChange` events.
  - Add automated tests (where feasible with mocks/fakes) that simulate failure modes and assert retries, state transitions, and user-facing error signals.

### 29 Handle Safari, Mobile, and Multi-Tab Voice Edge Cases

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Detect Safari and adjust WebRTC/connection parameters as required.
  - Detect tab visibility changes and pause/resume sessions when tab is backgrounded.
  - Track active session in `localStorage`/`sessionStorage` to warn when multiple tabs use the same agent.
  - Display human-friendly messages for these edge cases.

### 29a Create Dashboard Layout Skeleton

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Create `Dashboard.tsx` that lays out three regions:
    - Upper left: placeholder for the voice indicator.
    - Lower left: placeholder for the agent chat panel.
    - Right side: placeholder for the note-taking panel.
  - Create initial component shells:
    - `VoiceIndicator.tsx` (static circle, no live state yet).
    - `AgentChatPanel.tsx` (wraps `AgentConversationListView` / `AgentConversationDetailView` or a simplified stub).
    - `NoteTakingPanel.tsx` (wraps existing note-taking list/detail views).
  - Implement responsive CSS (grid/flex) so that on desktop the three regions match the target layout, and on mobile they stack vertically.
  - Add a temporary Dashboard route in `App.tsx` guarded by `VITE_ELEVENLABS_AGENT_ENABLED`, even before voice wiring is complete.

### 30 Integrate Voice Service with Dashboard (VoiceIndicator + AgentChatPanel)

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Wire `ElevenLabsVoiceService` into the `Dashboard` component and `AgentChatPanel`.
  - Add voice-mode state and connection/agent-mode state to `AgentChatPanel` and expose them to `VoiceIndicator`.
  - Implement the `VoiceIndicator` circle animation (idle/listening/speaking/connecting/error) driven by voice service state.
  - Wire voice session messages into the agent conversation message list (via `AgentConversationDetails` or equivalent, embedded inside `AgentChatPanel`).
  - Respect `VITE_ELEVENLABS_AGENT_ENABLED` by hiding voice-related controls and the dashboard route when disabled.

### 31 Implement Text Message Flow for Agent Conversations

- **Scope:** `jarek-va-ui`, `elevenlabs-agent` (if needed).
- **Subtasks:**
  - Decide how text messages are sent (direct to ElevenLabs vs. through backend).
  - Implement a simple text-based interaction path in `AgentConversationDetails.tsx`.
  - Store text messages in `elevenlabs:conversation:{conversationId}` via backend (if not already present).
  - Ensure the UI renders mixed voice and text messages consistently.

### 32 Wire Agent Conversations into Global Navigation and Routing

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Add an “Agent Conversations” entry in the main navigation.
  - Add a **Dashboard** route (`/dashboard` or `/`) that becomes the primary entry point when ElevenLabs is enabled.
  - Ensure note-taking and agent conversation list routes are clearly separated from, but consistent with, the dashboard (e.g., `/`, `/agent-conversations`, `/dashboard`).
  - Provide clear breadcrumbs or page titles for each mode (Dashboard vs. list views).

### 33 Validate Data Model Alignment Across Services

- **Scope:** `cursor-runner`, `elevenlabs-agent`, `jarek-va-ui`.
- **Subtasks:**
  - Ensure `conversationId` format and type are consistent across Redis keys and APIs.
  - Confirm task IDs used by cursor-runner map cleanly to `cursor_task:{taskId}` in elevenlabs-agent.
  - Align timestamp formats (ISO 8601) between frontend and backend.

### 34 Implement MVP Cursor Completion → Agent Push Flow

- **Scope:** `elevenlabs-agent`.
- **Subtasks:**
  - In the callback route, construct the MVP `input_text` message with a simple textual summary.
  - Push the message to ElevenLabs using the stored `wsUrl` or equivalent.
  - Log any errors without crashing the service.
  - Confirm that the agent speaks/responds to the pushed completion message.
  - Add tests that simulate callback payloads and assert that the correct message body would be sent to ElevenLabs (mocking the network layer).

### 35 Implement Optional Structured Metadata Push (Future Toggle)

- **Scope:** `elevenlabs-agent`.
- **Subtasks:**
  - Add an internal option or config flag to send enhanced metadata with `cursor_task_complete` text.
  - Include fields like `summary`, `branch`, `files_changed`, and `duration`.
  - Keep MVP default as simple-text until proven stable.

### 36 Integrate Repository File Browser into Note-Taking Panel / Dashboard

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Add the `RepositoryFileBrowser` component to the **NoteTakingPanel** (which may internally compose `ConversationDetails`) on the right side of the Dashboard.
  - Ensure layout remains readable when conversations are long and the file tree is deep (both desktop and mobile/stacked layouts).
  - Provide clear labeling (e.g., “Repository Structure (read-only)”).

### 37 Add Styles for Voice and Agent UI Elements

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Extend `src/styles/App.css` for:
    - Voice control buttons.
    - Connection status indicators.
    - Mic activity animation.
    - Agent conversation layout tweaks.
  - Validate styles in light and dark contexts (as applicable).

### 38 Implement Frontend Feature Flag Checks

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Centralize a helper (e.g., `isElevenLabsEnabled()`) to read `VITE_ELEVENLABS_AGENT_ENABLED`.
  - Hide all agent-specific UI (routes, nav items, controls) when feature is disabled.
  - Write a small test to ensure the flag gating works.

### 39 Implement Backend Feature Flag Checks

- **Scope:** `cursor-runner`, `elevenlabs-agent`.
- **Subtasks:**
  - In `elevenlabs-agent`, short-circuit webhook, signed-url, and session routes when `ELEVENLABS_AGENT_ENABLED` is false.
  - In `cursor-runner`, ensure cursor completion callbacks only attempt ElevenLabs integration when flag is true.
  - Add logging so it’s clear when flags are blocking functionality.

### 40 Add Unit Tests for elevenlabs-agent Core

- **Scope:** `elevenlabs-agent`.
- **Subtasks:**
  - Add tests for:
    - Session store TTL and schema.
    - Callback queue behavior and race conditions.
    - Signed URL route.
    - Webhook handling and immediate responses.
    - Callback route push logic (mocking ElevenLabs/WebSocket).

### 41 Add Frontend Unit Tests for Voice Service

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Add tests in `src/services/__tests__/elevenlabs-voice.test.ts` for:
    - Connection state transitions.
    - Retry and backoff behavior.
    - Signed URL renewal triggers.
    - Heartbeat and timeout handling.

### 42 Add Frontend Component Tests for Agent and Note-Taking Views

- **Scope:** `jarek-va-ui`.
- **Subtasks:**
  - Update or add tests for `ConversationDetails`, `AgentConversationDetails`, and `RepositoryFileBrowser`.
  - Validate that feature flags hide/show agent controls as expected.
  - Ensure that long histories and large file trees render without performance regressions in tests.

### 43 Perform End-to-End Happy Path Manual Test

- **Scope:** All services.
- **Subtasks:**
  - Start the full stack (Redis, cursor-runner, elevenlabs-agent, jarek-va-ui).
  - Open an agent conversation, start voice, and exchange messages.
  - Trigger a cursor-based tool from the agent and observe:
    - Async execution.
    - Callback to elevenlabs-agent.
    - Completion message delivered back to the agent and voiced to the user.

### 44 Test Network and Browser Failure Scenarios

- **Scope:** All services, focus on frontend.
- **Subtasks:**
  - Simulate network drops, high latency, and reconnects.
  - Test Safari and at least one mobile browser.
  - Verify that reconnection, timeouts, and voice pause/resume behaviors follow the spec.

### 45 Validate Session TTL and Expiration Behavior

- **Scope:** `elevenlabs-agent`.
- **Subtasks:**
  - Confirm that `elevenlabs:session:{conversation_id}` entries expire around 10 minutes.
  - Ensure callbacks after expiration fail gracefully and log clearly.
  - Verify that conversations remain even when sessions are gone.

### 46 Validate Security and Secrets Handling

- **Scope:** `elevenlabs-agent`, `cursor-runner`, infra.
- **Subtasks:**
  - Ensure `ELEVENLABS_API_KEY` and `WEBHOOK_SECRET` are never logged.
  - Validate webhook authentication logic for `/agent-tools` and `/callback`.
  - Confirm CORS/Traefik configuration does not expose unintended routes.

### 47 Prepare Observability and Logging for Production

- **Scope:** `elevenlabs-agent`, `cursor-runner`, `jarek-va-ui`.
- **Subtasks:**
  - Standardize log messages for key flows (session registration, webhook receipt, callback success/failure).
  - Optionally add basic metrics (counts of tasks started/completed, failures).
  - Provide clear log guidance in README for troubleshooting.

### 48 Update Project Documentation

- **Scope:** `jarek-va-ui`, `elevenlabs-agent`, `cursor-runner`.
- **Subtasks:**
  - Update `README.md` files to describe:
    - Agent conversations.
    - Voice functionality.
    - New service (`elevenlabs-agent`) and its role.
  - Document all new environment variables and how to configure them.
  - Link to the master plan and this execution order file for future work.

### 49 Run Full Test & Lint Suite Across Repos

- **Scope:** All services.
- **Subtasks:**
  - Run tests for `cursor-runner`, `jarek-va-ui`, and `elevenlabs-agent`.
  - Fix any lint or type-check regressions from the new code.
  - Ensure CI configuration includes elevenlabs-agent.

### 50 Plan Incremental Rollout Using Feature Flags

- **Scope:** All services.
- **Subtasks:**
  - Define environment combinations for dev, staging, and production:
    - Start with `ELEVENLABS_AGENT_ENABLED=false` everywhere.
    - Enable in dev, then staging, then production.
  - Document rollout steps and rollback strategy (turn flags off, disable Traefik routes if needed).

### 51 Migrate Webhook Logic from jarek-va to elevenlabs-agent

- **Scope:** `elevenlabs-agent`, `jarek-va`.
- **Subtasks:**
  - Audit the existing `agent_tools_controller` (or equivalent) in `jarek-va` to catalog all supported tools and behaviors.
  - Reconcile differences between the legacy synchronous pattern and the new async callback-queue design.
  - Port only the necessary tool-routing logic into `elevenlabs-agent`’s `tool-router`/webhook implementation, ensuring it uses async cursor execution.
  - Add tests that compare representative legacy requests/responses against the new webhook to ensure behavioral equivalence where required.
  - Gate any remaining Rails-based webhook paths behind a feature flag or clearly mark them as deprecated.

### 52 Update ElevenLabs Dashboard Configuration and Validate Integration

- **Scope:** ElevenLabs dashboard config, `elevenlabs-agent`.
- **Subtasks:**
  - Update the ElevenLabs agent configuration to point the webhook URL at the new `elevenlabs-agent` service (via Traefik).
  - Ensure the correct secret (`WEBHOOK_SECRET` or equivalent) is configured on both ElevenLabs and `elevenlabs-agent`.
  - Trigger a test interaction from the ElevenLabs dashboard to confirm that requests reach `/agent-tools` and are handled successfully.
  - Verify that cursor-powered tools invoked by the agent follow the async flow and result in completion messages being pushed back to the agent.


