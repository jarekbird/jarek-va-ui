# ElevenLabs Conversational Agent Integration Plan

## For jarek-va-ui React Application

This plan integrates ElevenLabs conversational agent functionality (similar to their "Preview Agent") into the existing jarek-va-ui application. It also includes separating conversation histories and adding repository file browsing.

**Key Changes:**

1. Separate cursor conversation history (renamed to "Note Taking History") from ElevenLabs agent conversation history
2. Add ElevenLabs conversational agent with voice/text modes
3. Add file browser for repository structure (cursor is working in)

## CRITICAL: Correct Architecture

### System Flow

**The correct flow is:**
1. **User (audio/text)** → **ElevenLabs Agent** (runs LLM, reasoning, conversation)
2. **ElevenLabs Agent** → **elevenlabs-agent service** (webhook for tool calls)
3. **elevenlabs-agent service** → **cursor-runner** (as a tool, for code execution)
4. **cursor-runner** → **elevenlabs-agent service** (callback when task completes)
5. **elevenlabs-agent service** → **ElevenLabs Agent** (pushes completion update)

### Service Responsibilities

**cursor-runner:**
- Manages **Note Taking History** (`cursor:conversation:{conversationId}`)
- Provides API endpoints: `/conversations/api/*`
- Executes cursor commands (code generation)
- **Does NOT manage agent conversations**
- **Is called as a tool** by elevenlabs-agent when agent needs code execution

**elevenlabs-agent:**
- Manages **Agent Conversations** (`elevenlabs:conversation:{conversationId}`)
- Provides API endpoints: `/agent-conversations/api/*`
- Handles webhooks from ElevenLabs agent (`/agent-tools`, `/callback`)
- Manages sessions (`elevenlabs:session:{conversationId}`)
- Calls cursor-runner as a tool when agent needs code execution
- Pushes updates back to ElevenLabs agent when cursor tasks complete

**jarek-va-ui (Frontend):**
- Displays both Note Taking History and Agent Conversations
- Connects to ElevenLabs agent via WebSocket/WebRTC for voice
- Calls `/conversations/api/*` for note-taking history (cursor-runner)
- Calls `/agent-conversations/api/*` for agent conversations (elevenlabs-agent)

## CRITICAL: Conversation vs. Session Distinction

### Conversations (Persistent)

- Conversations exist in the database because the user clicked "New Agent Conversation"
- Stored in Redis: `elevenlabs:conversation:{conversationId}` (in elevenlabs-agent service)
- **Persistent** - survive page reloads, browser restarts, etc.
- Contain message history (voice/text messages with agent)
- Can have multiple sessions over time (one per browser connection)

### Sessions (Ephemeral)

- Sessions are ephemeral and only exist while the WebSocket is open in the browser
- Stored in Redis: `elevenlabs:session:{conversationId}` (in elevenlabs-agent service)
- **Ephemeral** - only exist while the browser tab is open with active WebSocket connection
- Contain the push-capable session payload for sending updates to the agent
- **Cannot be replayed or reopened** - each browser connection creates a new session
- **TTL: 10 minutes** - Sessions expire fast because they cannot be replayed

### Key Relationship

- **Conversations do NOT start sessions**
- **Sessions start conversations** (or join existing conversations)
- A conversation can have multiple sessions over time (one per browser connection)
- When user reloads the page:
  - They **KEEP** the conversation (persistent, with message history)
  - They **LOSE** the session (ephemeral, WebSocket closed)
  - A **new session** is created when they reconnect

### Explicit Rules

- **Do NOT persist ElevenLabs session objects after the tab closes**
- Sessions should expire fast (TTL = 10 minutes) because they cannot be replayed or reopened
- **New browser connection = new ElevenLabs WS session**
- Sessions are only valid while the WebSocket is actively connected
- If a callback tries to push to an expired session, it should fail gracefully (session no longer exists)

---

## Architecture Overview

### Current Stack

- React 18 + TypeScript
- Vite build tool
- React Router for navigation
- Existing note-taking UI plus a new Dashboard view for combined agent + note-taking
- Backend: cursor-runner (Node.js) at `/conversations/api/*` (note-taking history)
- Backend: elevenlabs-agent (Node.js) at `/agent-conversations/api/*` (agent conversations)
- ElevenLabs agent already configured with webhooks to jarekva.com
- **jarek-va (Rails) is being deprecated** - webhook handling needs migration

### IMPORTANT: Conversation History Separation

#### Current State

- "Conversations" are actually cursor note-taking history (user prompts → cursor responses)
- Stored in Redis with keys: `cursor:conversation:{conversationId}` (in cursor-runner)
- Used for cursor context when executing commands

#### Required Changes

1. **Rename "Conversations" to "Note Taking History"**
   - Update UI labels: "Conversation History" → "Note Taking History"
   - Keep API endpoints: `/conversations/api/*` (served by cursor-runner)
   - Keep backend structure the same (just rename in UI)
   - These are for cursor execution context, not conversational agent

2. **Create Separate ElevenLabs Agent Conversation History**
   - **CRITICAL: Stored in elevenlabs-agent service, NOT cursor-runner**
   - Storage: `elevenlabs:conversation:{conversationId}` in Redis (in elevenlabs-agent)
   - Separate from cursor note-taking history
   - Stores voice/text messages with ElevenLabs agent
   - API endpoints: `/agent-conversations/api/*` (served by elevenlabs-agent)
   - New UI: "Agent Conversations" section

3. **Keep Distinct**
   - Cursor note-taking: User → Cursor (code generation context) → cursor-runner
   - Agent conversations: User ↔ ElevenLabs Agent (voice/text chat) → elevenlabs-agent
   - These serve different purposes and should not be mixed

### Where Does the Agent Run?

**CRITICAL: ElevenLabs runs the agent (LLM, reasoning, conversation)**

The agent reasoning and conversation management runs entirely on ElevenLabs' infrastructure:

1. **Agent Configuration (ElevenLabs Dashboard)**
   - Voice selection
   - System prompt/behavior (defines agent personality and capabilities)
   - Tool definitions (which tools the agent can call)
   - Webhook URL (points to our elevenlabs-agent service)

2. **Browser Connection (Our Frontend)**
   - Uses `@elevenlabs/client` SDK to connect to ElevenLabs WebSocket/WebRTC endpoint
   - Sends audio from user's microphone to ElevenLabs
   - Receives audio from ElevenLabs (agent's voice responses)
   - **No LLM or reasoning happens in the browser**

3. **ElevenLabs Infrastructure**
   - Handles speech-to-text (STT) - converts user audio to text
   - Runs LLM reasoning - processes user input, maintains conversation context
   - Decides when to call tools (based on tool definitions)
   - Handles text-to-speech (TTS) - converts agent responses to audio
   - Manages conversation state and context

4. **Our Backend (elevenlabs-agent service)**
   - **Manages agent conversations** (stored in Redis: `elevenlabs:conversation:{conversationId}`)
   - **Provides agent conversation API endpoints** (`/agent-conversations/api/*`)
   - Receives webhook calls when agent needs to execute tools
   - Routes tool calls to cursor-runner (as a tool) or other services
   - Returns results to ElevenLabs agent
   - Pushes updates to agent when cursor tasks complete
   - **We do NOT run the LLM or manage conversation state** (ElevenLabs does that)

5. **cursor-runner (called as a tool)**
   - Executes cursor commands when called by elevenlabs-agent
   - Manages note-taking history (separate from agent conversations)
   - Returns results via callback to elevenlabs-agent
   - **Is NOT responsible for agent conversations**

### Integration Approach

- Create a **Dashboard** view that combines voice indicator, agent chat, and note-taking history on one page
- Support both text and voice modes in the same **agent conversation**
- Use ElevenLabs JS SDK (`@elevenlabs/client`) for browser-based voice connection
- **elevenlabs-agent service** handles:
  - Agent conversation storage and API endpoints
  - Signed URL generation (if agent is private)
  - Webhook handling for agent tool calls (replacing jarek-va)
  - **CRITICAL**: Async tool execution - webhook returns immediately, cursor runs in background
  - Pushing updates to agent when cursor tasks complete

### Key Architectural Principle

- **ElevenLabs conversation is separate from cursor execution**
- **Agent conversations are managed by elevenlabs-agent, NOT cursor-runner**
- **cursor-runner is called as a tool by elevenlabs-agent**
- Cursor calls are slow (minutes) and cannot block real-time conversation
- Webhook must return immediately for cursor tools
- Use `/cursor/iterate/async` endpoint (already exists, returns 200 immediately)
- When cursor completes, elevenlabs-agent pushes update to agent
- Agent can continue conversation while cursor runs in background

---

## Step 0: Separate Conversation Histories & Add File Browser

**CRITICAL: Separate cursor note-taking from agent conversations**

### 0.1: Rename Cursor Conversations to "Note Taking History"

**Files to modify:**

- `src/components/ConversationListView.tsx` - Change "Conversation History" → "Note Taking History"
- `src/components/ConversationDetails.tsx` - Update labels
- `src/components/ConversationDetailView.tsx` - Update labels
- `src/types/index.ts` - Consider renaming Conversation to NoteTakingSession (or keep type, just rename UI)
- `src/api/conversations.ts` - Update comments/docs

**Changes:**

- Update all UI labels: "Conversation" → "Note Taking Session"
- Update page titles and headers
- Keep API endpoints the same (`/conversations/api/*`) - just rename in UI
- These are for cursor execution context, not conversational agent

### 0.2: Create Separate ElevenLabs Agent Conversation System

**CRITICAL: Agent conversations are managed by elevenlabs-agent, NOT cursor-runner**

#### Conversations (Persistent)

- Conversations exist in the database because the user clicked "New Agent Conversation"
- **Stored in Redis: `elevenlabs:conversation:{conversationId}` (in elevenlabs-agent service)**
- **Persistent** - survive page reloads, browser restarts, etc.
- Contain message history (voice/text messages with agent)
- Can have multiple sessions over time (one per browser connection)

#### Sessions (Ephemeral)

- Sessions are ephemeral and only exist while the WebSocket is open in the browser
- **Stored in Redis: `elevenlabs:session:{conversationId}` (in elevenlabs-agent service)**
- **Ephemeral** - only exist while the browser tab is open with active WebSocket connection
- Contain the push-capable session payload for sending updates to the agent
- **Cannot be replayed or reopened** - each browser connection creates a new session

#### Key Relationship

- **Conversations do NOT start sessions**
- **Sessions start conversations** (or join existing conversations)
- A conversation can have multiple sessions over time (one per browser connection)
- When user reloads the page:
  - They **KEEP** the conversation (persistent, with message history)
  - They **LOSE** the session (ephemeral, WebSocket closed)
  - A **new session** is created when they reconnect

#### Explicit Rules

- **Do NOT persist ElevenLabs session objects after the tab closes**
- Sessions should expire fast (TTL = 10 minutes) because they cannot be replayed or reopened
- **New browser connection = new ElevenLabs WS session**
- Sessions are only valid while the WebSocket is actively connected
- If a callback tries to push to an expired session, it should fail gracefully (session no longer exists)

**Frontend files:**

- `src/types/agent-conversation.ts` - Types for agent conversations
- `src/api/agent-conversations.ts` - API client for agent conversations (calls elevenlabs-agent)
- `src/components/AgentConversationListView.tsx` - List of agent conversations
- `src/components/AgentConversationDetails.tsx` - Agent conversation view (with voice controls)
- `src/components/AgentConversationDetailView.tsx` - Wrapper for agent conversation

**Backend changes (elevenlabs-agent service):**

- **CRITICAL: Agent conversations are stored and managed in elevenlabs-agent, NOT cursor-runner**
- New endpoints in elevenlabs-agent:
  - `GET /agent-conversations/api/list` - List all agent conversations
  - `GET /agent-conversations/api/:id` - Get specific agent conversation
  - `POST /agent-conversations/api/new` - Create new agent conversation
  - `POST /agent-conversations/api/:id/message` - Add message to agent conversation
  - **POST /agent-conversations/api/:id/session** - **CRITICAL**: Register active session (browser → backend)
    - **Purpose**: Browser POSTs session URL to backend when WebSocket connects
    - **Payload**:
      ```json
      {
        "sessionUrl": "wss://api.elevenlabs.io/v1/ws/conversation/abc123?token=...",
        "expiresAt": "2024-01-01T00:10:00Z",  // optional
        "agentSessionId": "abc123",           // optional
        "transport": "webrtc" | "websocket"   // optional
      }
      ```
    - **Backend stores**: `elevenlabs:session:{conversationId}` = `{ sessionUrl, sessionPayload, wsUrl, expiresAt, agentSessionId, transport, createdAt, ttl }`
    - **TTL: 10 minutes** (sessions are ephemeral, cannot be replayed)
    - **Returns**: `{ success: true, message: "Session registered" }`
    - **Called by**: Frontend voice service when onConnect event fires
- Store conversations in Redis: `elevenlabs:conversation:{conversationId}` (persistent, long TTL) - **in elevenlabs-agent**
- Store sessions in Redis: `elevenlabs:session:{conversationId}` (ephemeral, short TTL = 10 minutes) - **in elevenlabs-agent**
- Separate from cursor note-taking: `cursor:conversation:{conversationId}` (in cursor-runner)

**Data Structure:**

```typescript
interface AgentConversation {
  conversationId: string;
  messages: AgentMessage[]; // Voice/text messages with agent
  createdAt: string;
  lastAccessedAt: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
  // Note: Do NOT store sessionId here - sessions are ephemeral
  // Sessions are stored separately in elevenlabs:session:{conversationId}
}

interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  source: 'voice' | 'text' | 'tool_output' | 'system_event'; // How message was sent/received
  toolName?: string;      // For tool messages
  toolArgs?: Record<string, unknown>;  // For tool messages
  toolOutput?: string;    // For tool messages
  status?: 'pending' | 'completed' | 'failed';  // For tool messages
}
```

### 0.3: Add Repository File Browser

**New component:** `src/components/RepositoryFileBrowser.tsx`

**Purpose:**

- Show folder structure of repository cursor is working in
- Display file names and locations
- **Do NOT allow viewing file contents** (on this page)
- Browse-only, read-only file tree

**Backend endpoint (cursor-runner):**

- `GET /repositories/api/:repository/files` - Get file tree structure
- Returns: `{ files: FileNode[] }`
- FileNode: `{ name: string, path: string, type: 'file' | 'directory', children?: FileNode[] }`

**Implementation:**

- Use existing FilesystemService in cursor-runner
- Recursively list files in repository
- Return tree structure (nested directories)
- Filter out .git, node_modules, etc. (configurable)

**UI:**

- Tree view with expand/collapse
- Show file icons (file vs folder)
- Show file paths
- Click to expand/collapse folders
- **No file content viewing** (as requested)

**Integration:**

- Add to note-taking detail view (shows files in repository being worked on)
- Or add as separate page/route

---

## Step 1: Install Dependencies

Add the ElevenLabs client SDK to the existing project:

```bash
cd jarek-va-ui
npm install @elevenlabs/client
```

**Files to modify:**

- `package.json` (add dependency)

---

## Step 2: Create Voice Service Module

Create a new service module to handle ElevenLabs conversation session management:

**New file:** `src/services/elevenlabs-voice.ts`

This service will:

- Manage the ElevenLabs conversation session lifecycle
- Handle microphone permissions
- Connect to ElevenLabs WebSocket/WebRTC endpoint (agent runs on their servers)
- Stream audio to/from ElevenLabs
- **CRITICAL**: Implement robust network failure handling (see below)
- Provide hooks for connection status, mode changes, and errors
- Integrate with existing conversation message structure
- Support both public and private agents (with signed URL fetching)
- Handle reconnection, timeouts, dropped audio, partial transcripts
- Implement heartbeat monitoring and retry logic with backoff

**Key functions:**

- `startVoiceSession(agentId: string, signedUrl?: string)` - Connects to ElevenLabs agent
- `endVoiceSession()` - Disconnects from ElevenLabs
- `getConnectionStatus()` - Returns current connection state
- `sendTextToAgent(text: string)` - **CRITICAL**: Send text update to agent (for cursor completion notifications)
- `renewSignedUrl()` - **CRITICAL**: Renew expired signed URL and reconnect (for private agents)
- `reconnectWithBackoff()` - **CRITICAL**: Reconnect with exponential backoff
- `startHeartbeat()` - Monitor connection health
- `handleConnectionFailure()` - Handle various connection failures
- Event handlers for `onConnect`, `onDisconnect`, `onModeChange`, `onError`, `onMessage`

### CRITICAL: Signed URL Expiration Handling (Private Agents Only)

**Signed URL Constraints:**

- **Expire** after a period (check ElevenLabs documentation for exact TTL)
- **Cannot be reused** across tabs/browser sessions
- **Are specific** to the conversation session
- **Must be rotated** periodically for long-running sessions

**Voice Service Must Handle:**

1. **Detect expiration:**
   - Monitor connection for expiration errors
   - Track signed URL timestamp and TTL
   - Listen for onError events indicating expired URL

2. **Renew signed URL:**
   - Call `GET /signed-url?agentId={agentId}` to get new signed URL (from elevenlabs-agent)
   - Handle renewal errors gracefully

3. **Reconnect gracefully:**
   - Disconnect current session cleanly
   - Start new session with renewed signed URL
   - Preserve conversation context if possible
   - Show user-friendly message: "Reconnecting..." (optional)

4. **Prevent expiration (proactive renewal):**
   - Renew signed URL before expiration (e.g., 5 minutes before TTL)
   - Use timer to track expiration time
   - Seamlessly swap to new signed URL without disconnection if possible

**Implementation:**

- Store signed URL expiration time when received
- Set timer to renew before expiration
- Handle onError events for expired URLs
- Implement automatic reconnection with new signed URL
- Log renewal events for debugging

### CRITICAL: Network Layer Failure Handling (REQUIRED)

**ElevenLabs Browser SDK Limitations:**

- **Not as robust as assumed** - SDK occasionally fails to reconnect
- **Safari has WebRTC quirks** - Different behavior than Chrome/Firefox
- **Mobile browsers** cannot keep mic open in background
- **Hates multiple tabs** - Conflicts when same agent open in multiple tabs
- **Do NOT assume stable connections** - Must implement robust failure handling

**Required Failure Handling:**

1. **Reconnection with Exponential Backoff:**
   - Implement retry loop with backoff: 1s, 2s, 4s, 8s, 16s, max 30s
   - Track retry attempts and max retries (e.g., 5 attempts)
   - After max retries, show error and allow manual reconnect
   - Reset backoff on successful connection

2. **Heartbeat/Health Monitoring:**
   - Send periodic heartbeat (every 30 seconds)
   - Monitor for onMessage or onModeChange events as health indicators
   - If no activity for 60 seconds, consider connection dead
   - Trigger reconnection if heartbeat fails

3. **Timeout Handling:**
   - Set connection timeout (e.g., 10 seconds for initial connection)
   - Set operation timeouts for critical operations
   - Handle timeout errors gracefully with retry

4. **Dropped Audio Handling:**
   - Detect audio stream interruptions
   - Monitor microphone input levels
   - If audio drops for > 5 seconds, attempt reconnection
   - Show "Audio connection lost, reconnecting..." indicator

5. **Partial Transcripts:**
   - Handle incomplete message events
   - Buffer partial transcripts until complete
   - Don't show partial transcripts to user until confirmed complete
   - Handle transcript timeouts (if message never completes)

6. **Mode-Change Not Firing:**
   - SDK sometimes doesn't fire onModeChange events
   - Implement fallback: track time since last user input
   - If agent should be speaking but no audio for > 10s, assume stuck
   - Trigger recovery: send heartbeat or reconnect

7. **Agent Getting "Stuck Speaking":**
   - Detect when agent mode is "speaking" but no audio for extended period
   - Timeout: if speaking > 30 seconds with no audio, assume stuck
   - Recovery: disconnect and reconnect
   - Show user: "Agent seems stuck, reconnecting..."

8. **Safari WebRTC Quirks:**
   - Safari handles WebRTC differently
   - May require different connection parameters
   - Test thoroughly on Safari
   - Handle Safari-specific errors differently

9. **Mobile Browser Limitations:**
   - Mic cannot stay open in background
   - Handle app/tab backgrounding gracefully
   - Pause session when tab goes to background
   - Resume when tab comes to foreground
   - Show clear message: "Voice session paused (tab in background)"

10. **Multiple Tabs Handling:**
    - Detect if same agent open in another tab
    - Warn user or disable voice in one tab
    - Store active session in localStorage/sessionStorage
    - Check on startup: if session exists elsewhere, show warning

**Implementation Requirements:**

- Implement retry loop with exponential backoff
- Implement heartbeat monitoring
- Implement timeout handlers for all operations
- Implement connection state machine (connecting, connected, reconnecting, failed, disconnected)
- Track connection health metrics
- Log all failures for debugging
- Show user-friendly error messages
- Allow manual reconnection option

**Important Notes:**

- The agent (LLM, reasoning) runs on ElevenLabs servers, not in the browser
- This service just manages the WebSocket/WebRTC connection
- Audio streams both ways: user mic → ElevenLabs, ElevenLabs → browser speakers
- When agent needs tools, it calls our webhook (handled by elevenlabs-agent service)
- **CRITICAL: Session Object Storage (CANONICAL RULE)**
  - **MUST store the raw push-capable payload returned by the ElevenLabs JS SDK**
  - **MUST NOT rely solely on sessionId**
  - When `convai.connect(agentId, {...})` is called, it returns a session object with:
    - `sessionId`: The session identifier
    - `send()`: Function for text push (client-side only, not usable from backend)
    - `sendAudio()`: Function for audio push (client-side only, not usable from backend)
    - `wsUrl`: The WebSocket URL (may be in `session.config.wsUrl` or similar)
    - `config`: Configuration object containing the push-capable endpoint
    - Other internals
  - **Best approach**: Extract `session.config.wsUrl` or the full WS URL + token bundle from the session object
  - **Still OK**: Store the full WS URL + token bundle that the SDK returns
  - **Not recommended**: Reassembling it manually from sessionId
  - Store this in backend Redis: `elevenlabs:session:{conversationId}` = `{ sessionPayload: {...}, wsUrl: "...", ... }` (in elevenlabs-agent)
  - Backend needs this exact payload to push input_text messages when cursor completes
  - **The critical statement**: Store the raw push-capable payload, not just sessionId
  - Use conversation session's streaming endpoint to send text (see "Cursor Task Completion Message Format" section for exact format)
  - **For private agents**: Must handle signed URL expiration and renewal
  - **CRITICAL**: Do NOT assume stable connections - implement comprehensive failure handling

---

## Step 3: Add Feature Flags for Dark Release

**CRITICAL: Feature flags required for dark release**

To enable gradual rollout and dark release (deploy code but keep feature disabled), add feature flags in all three services:

**1. jarek-va-ui (Frontend):**

- Environment variable: `VITE_ELEVENLABS_AGENT_ENABLED` (default: false)
- Check flag before rendering voice controls
- When false, voice controls are completely hidden
- Allows deploying UI changes without enabling feature

**2. cursor-runner (Backend):**

- Environment variable: `ELEVENLABS_AGENT_ENABLED` (default: false)
- Check flag in callback handler when cursor execution completes
- When false, cursor completion callbacks skip ElevenLabs push logic
- When true, callback can trigger push to ElevenLabs agent (via elevenlabs-agent service)
- Allows deploying cursor infrastructure changes without enabling agent integration
- Add to docker-compose.yml environment variables

**3. elevenlabs-agent (Service):**

- Environment variable: `ELEVENLABS_AGENT_ENABLED` (default: false)
- Check flag in webhook endpoint and agent conversation API endpoints
- When false, return 503 Service Unavailable or disable endpoints
- Allows deploying service without enabling it

**Implementation:**

- All flags default to false (feature disabled)
- Set to true to enable feature
- Can enable independently in different environments
- Allows safe deployment of infrastructure changes

---

## Step 4: Create Dedicated ElevenLabs Agent Service

**Decision: Create separate elevenlabs-agent service** (revised after critical analysis)

### Critical Analysis

**Arguments FOR separate service:**

1. **Different failure domains:**
   - If cursor-runner crashes/is overloaded, webhook in cursor-runner won't respond
   - Separate service can still respond: "I'm sorry, the code execution service is temporarily unavailable"
   - Agent can continue conversation even if cursor is down

2. **Different performance requirements:**
   - Webhook must return < 1 second (ElevenLabs timeout)
   - cursor-runner can be CPU-bound (cursor-cli execution)
   - Even though Express is async, if cursor-runner is completely overloaded, webhook might be slow

3. **Different scaling needs:**
   - cursor-runner: CPU/memory intensive, might need more resources
   - Webhook: Lightweight HTTP routing, just needs to be fast/available
   - Can scale independently

4. **Clear separation of concerns:**
   - Agent service: Handles agent interactions, routes tool calls, manages agent conversations
   - cursor-runner: Executes cursor commands, manages note-taking history
   - Each service has single responsibility

5. **Different dependencies:**
   - Webhook needs: HTTP client, cursor-runner API access, Redis for conversations/sessions
   - cursor-runner needs: cursor-cli, git, MCP servers, etc.
   - Much lighter weight for agent service

**Arguments AGAINST separate service:**

1. **Scope is small**: Only 2 endpoints (~200 lines)
2. **Operational overhead**: Another service to deploy/maintain
3. **Network hop**: Agent service → cursor-runner (but async anyway, so minimal impact)
4. **cursor-runner already has webhook routes**: Telegram webhook is already there

**Final Decision: Separate service is better**

The key insight: **The webhook must be highly available and fast, even when cursor-runner is busy/down.** A separate service provides:

- Better failure isolation
- Independent scaling
- Clearer separation of concerns
- Ability to gracefully handle cursor-runner being unavailable
- **Agent conversations managed separately from note-taking history**

The operational overhead is minimal (it's a simple Express service), and the benefits outweigh the costs.

### New Service Structure: elevenlabs-agent/

```
elevenlabs-agent/
├── src/
│   ├── server.ts              # Express server (stateless)
│   ├── routes/
│   │   ├── signed-url.ts      # GET /signed-url (for private agents)
│   │   ├── webhook-routes.ts  # POST /agent-tools, POST /callback
│   │   ├── config-routes.ts   # GET /config, GET /config/health
│   │   └── agent-conversation-routes.ts  # Agent conversation API endpoints
│   ├── services/
│   │   ├── session-service.ts      # Redis-based session storage (stateless)
│   │   ├── agent-conversation-service.ts  # Agent conversation storage (Redis)
│   │   ├── cursor-runner-service.ts  # HTTP client for cursor-runner API
│   │   └── callback-queue.ts  # Redis-based callback task queue (REQUIRED)
│   ├── utils/
│   │   └── feature-flags.ts   # Feature flag utilities
│   └── types.ts               # TypeScript types
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### Endpoints

**Agent Conversation API Endpoints (elevenlabs-agent):**

1. **GET /agent-conversations/api/list** - List all agent conversations
   - Query params: `limit`, `offset`, `sortBy`, `sortOrder`
   - Returns: `{ conversations: AgentConversation[], pagination: {...} }`
   - Served by: elevenlabs-agent

2. **GET /agent-conversations/api/:id** - Get specific agent conversation
   - Returns: `AgentConversation`
   - Served by: elevenlabs-agent

3. **POST /agent-conversations/api/new** - Create new agent conversation
   - Body: `{ agentId?: string, metadata?: Record<string, unknown> }`
   - Returns: `{ success: boolean, conversationId: string, conversation: AgentConversation }`
   - Served by: elevenlabs-agent

4. **POST /agent-conversations/api/:id/message** - Add message to agent conversation
   - Body: `{ role: 'user' | 'assistant' | 'system' | 'tool', content: string, source?: string, ... }`
   - Returns: `{ success: boolean }`
   - Served by: elevenlabs-agent

5. **POST /agent-conversations/api/:id/session** - **CRITICAL**: Register active session (browser → backend)
   - **Purpose**: Browser POSTs session URL to backend when WebSocket connects
   - **Payload**:
     ```json
     {
       "sessionUrl": "wss://api.elevenlabs.io/v1/ws/conversation/abc123?token=...",
       "expiresAt": "2024-01-01T00:10:00Z",  // optional
       "agentSessionId": "abc123",           // optional
       "transport": "webrtc" | "websocket"   // optional
     }
     ```
   - **Backend stores**: `elevenlabs:session:{conversationId}` = `{ sessionUrl, sessionPayload, wsUrl, expiresAt, agentSessionId, transport, createdAt, ttl }`
   - **TTL: 10 minutes** (sessions are ephemeral, cannot be replayed)
   - **Returns**: `{ success: true, message: "Session registered" }`
   - **Called by**: Frontend voice service when onConnect event fires
   - **Workflow**:
     1. Browser connects to ElevenLabs agent → obtains sessionObject
     2. Browser extracts sessionUrl from sessionObject.config.wsUrl or sessionObject.wsUrl
     3. Browser POSTs to backend: `POST /agent-conversations/api/{conversationId}/session`
     4. Backend stores under: `elevenlabs:session:{conversationId}`
     5. Later, cursor tasks lookup: `cursor_task:{taskId}` → sessionUrl → push update
   - **Authentication**: Optional (can add later if needed)

**Webhook Endpoints (elevenlabs-agent):**

6. **GET /signed-url** (if agent is private)
   - Query params: `agentId` (optional, defaults to env var)
   - Uses `ELEVENLABS_API_KEY` from environment
   - Calls ElevenLabs API: `GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id={agentId}`
   - Returns: `{ signedUrl: string, expiresAt?: string }` (if ElevenLabs provides expiration)
   - **Note**: Signed URLs expire and cannot be reused across tabs
   - Frontend must handle expiration and renewal (see voice service section)
   - Authentication: Optional (can add later if needed)

7. **POST /agent-tools** (webhook for ElevenLabs agent)
   - Replaces `jarek-va/app/controllers/agent_tools_controller.rb`
   - Headers: `X-EL-Secret` or `Authorization: Bearer <token>`
   - Body: `{ tool: string, args: object, conversation_id?: string }`
   - **CRITICAL: Must return immediately** - Cannot block conversation
   - Routes tool calls:
     - **Cursor tools (write_code, read_code, etc.)**:
       - Lookup active session: `elevenlabs:session:{conversation_id}` from Redis
       - Generate taskId (unique identifier)
       - Store callback task in Redis: `cursor_task:{taskId}` = `{ agentSessionId, conversationId, pending: true, ... }`
       - Call cursor-runner:3001/cursor/iterate/async with taskId and callbackUrl
       - Return immediate response: `{ ok: true, say: "I've started that task. I'll let you know when it's complete.", result: { requestId: taskId, status: "processing" } }`
     - **Fast tools** (non-cursor): Execute synchronously and return result
     - **Other tools**: Route to appropriate handlers (MCP, etc.)
   - Returns: `{ ok: boolean, say: string, result: object }`
   - Authentication: Validates `WEBHOOK_SECRET` (already in cursor-runner env)

8. **POST /callback** (receives cursor-runner callbacks)
   - Receives callback from cursor-runner when task completes
   - Body: `{ requestId: string, success: boolean, output?: string, error?: string, ... }`
   - Looks up callback task: `cursor_task:{requestId}` from Redis
   - Gets sessionUrl from task record (the full WebSocket URL or session params)
   - **CRITICAL**: Uses the stored sessionUrl to push update to agent
   - **Message Format (MVP - Simple Text)**:
     ```json
     {
       "type": "input_text",
       "text": "Your code task is complete.\n\nSummary:\n- [summary of changes]"
     }
     ```
   - **Enhanced Format (Future - Structured Metadata)**:
     ```json
     {
       "type": "input_text",
       "text": "cursor_task_complete",
       "metadata": {
         "summary": "...",
         "branch": "...",
         "files_changed": [...],
         "repository": "...",
         "success": true,
         "duration": "..."
       }
     }
     ```
   - Pushes update to agent via session URL using the format above
   - **MUST use the exact session URL/params** stored when session was registered
   - **MVP**: Start with simple text format
   - **Future**: Add structured metadata for better agent reasoning (metadata format not well documented by ElevenLabs)
   - Marks task as complete (optional, for monitoring)
   - Returns: `{ received: true }`
   - Authentication: Validates `WEBHOOK_SECRET` (same as cursor-runner)

**Config Endpoints (elevenlabs-agent):**

9. **GET /config** - Get current agent configuration (non-sensitive information)
   - Returns: `{ success: true, config: {...} }`
   - Served by: elevenlabs-agent

10. **GET /config/health** - Get health status of all dependencies
    - Returns: `{ success: true, health: {...} }`
    - Served by: elevenlabs-agent

### Tool Routing Strategy

- **Separate cursor tools from conversation**: Cursor execution is slow and must be async
- **Immediate response pattern**:
  - For cursor tools: Return "I've started that..." message immediately
  - Generate unique taskId (or use cursor-runner's requestId)
  - Lookup active session from Redis: `elevenlabs:session:{conversation_id}`
  - **CANONICAL RULE**: Get sessionPayload (raw push-capable payload) from session store
  - **CANONICAL RULE**: **MUST NOT rely solely on sessionId**
  - Extract wsUrl from sessionPayload (usually `sessionPayload.wsUrl` or `sessionPayload.config.wsUrl`)
  - **CRITICAL**: Store callback task in Redis: `cursor_task:{taskId}` with sessionPayload and wsUrl included
  - Store the raw push-capable session reference, not just sessionId
  - Use HTTP client to call cursor-runner:3001/cursor/iterate/async with taskId and callbackUrl
  - Return immediately to ElevenLabs
- **Fast tools**: Can execute synchronously (e.g., simple queries, status checks)
- **Callback mechanism**: When cursor completes, lookup `cursor_task:{taskId}` from Redis, get session, push update

### CRITICAL: Session Object Storage (CANONICAL RULE)

**The Critical Statement:**

- **MUST store the raw push-capable payload returned by the ElevenLabs JS SDK**
- **MUST NOT rely solely on sessionId**

**What the Backend Actually Needs to Store:**

When the browser calls:

```typescript
const session = await convai.connect(agentId, { ... });
```

The object returned is something like:

```typescript
{
  sessionId: "abc123",
  send: (msg) => void,       // text push (client-side only, not usable from backend)
  sendAudio: (data) => void, // audio push (client-side only, not usable from backend)
  wsUrl: "wss://api.elevenlabs.io/v1/...",  // the important part
  config: {
    wsUrl: "wss://api.elevenlabs.io/v1/ws/conversation/{sessionId}?signed_url=xyz",
    // ... other config
  },
  // ... other internals
}
```

**For pushing text from your backend, you need one of these:**

1. **(Best)** The actual push endpoint from the JS SDK:
   - Usually `session.config.wsUrl` or `session.wsUrl`
   - This is the full WebSocket URL + token bundle that can push messages

2. **(Still OK)** The full WS URL + token bundle that the SDK returns:
   - Store the complete URL with all parameters (signed_url, tokens, etc.)
   - Must include all authentication parameters

3. **(Not recommended)** Reassembling it manually from sessionId:
   - This is fragile and may break if ElevenLabs changes their URL structure
   - Missing authentication tokens will cause push failures

**Implementation Rule:**

- Extract `session.config.wsUrl` or the full WS URL + token bundle from the session object
- Store this in Redis as sessionPayload with wsUrl extracted for easy access
- When pushing updates, use the stored wsUrl from the sessionPayload
- **Never attempt to reconstruct the URL from just sessionId**

### CRITICAL: Callback Queue System (REQUIRED for Correctness)

**Problem: Cursor tasks complete in arbitrary order**

- Multiple cursor tasks can be running simultaneously
- Tasks complete in unpredictable order
- Without proper mapping, race conditions WILL occur
- Need deterministic mapping: `cursor_task_id → agent_session → callback`

**Solution: Durable Callback Queue in Redis**

#### Redis Data Structures

1. **Active Session Store (Ephemeral):**
   - Key: `elevenlabs:session:{conversation_id}`
   - Value: `{ sessionId, sessionPayload, wsUrl, createdAt, ttl }`
   - **CRITICAL: Sessions are Ephemeral**
     - Sessions only exist while the WebSocket is open in the browser
     - **Do NOT persist ElevenLabs session objects after the tab closes**
     - Sessions **cannot be replayed or reopened**
     - **New browser connection = new ElevenLabs WS session**
   - **CANONICAL RULE**: sessionPayload must be the **raw push-capable payload** returned by the ElevenLabs JS SDK
   - **CANONICAL RULE**: **MUST NOT rely solely on sessionId**
   - **Best**: Store `session.config.wsUrl` or the full WS URL + token bundle from the session object
   - **Still OK**: Store the full WS URL + token bundle that the SDK returns
   - **Not recommended**: Reassembling it manually from sessionId
   - Example structure:
     ```json
     {
       "sessionId": "abc123",
       "sessionPayload": {
         "wsUrl": "wss://api.elevenlabs.io/v1/ws/conversation/{sessionId}?signed_url=xyz",
         "config": { ... },
         // ... other push-capable parameters from JS SDK
       },
       "wsUrl": "wss://api.elevenlabs.io/v1/ws/conversation/{sessionId}?signed_url=xyz",
       "createdAt": "2024-01-01T00:00:00Z",
       "ttl": 600
     }
     ```
   - This is the exact payload needed to send cursor task completion messages (see "Cursor Task Completion Message Format" section)
   - **TTL: 10 minutes (600 seconds)** - Sessions expire fast because they cannot be replayed or reopened
   - Purpose: Map conversation to active agent session for pushing updates (only valid while WebSocket is open)
   - **When session expires**: Callbacks will fail gracefully (session no longer exists, user must reconnect)

2. **Agent Conversation Store (Persistent):**
   - Key: `elevenlabs:conversation:{conversationId}`
   - Value: `AgentConversation` (messages, metadata, etc.)
   - **Persistent** - long TTL (e.g., 24 hours or longer)
   - Purpose: Store conversation history for UI display
   - **Managed by elevenlabs-agent service**

3. **Callback Task Queue (REQUIRED):**
   - Key: `cursor_task:{taskId}` (where taskId = cursor-runner requestId)
   - Value: `{ conversationId, sessionPayload, wsUrl, pending: true, callbackUrl, createdAt, toolName, toolArgs }`
   - **CANONICAL RULE**: sessionPayload must be the **raw push-capable payload** from the session store
   - **CANONICAL RULE**: **MUST NOT rely solely on sessionId**
   - Store the push-capable session reference (from `elevenlabs:session:{conversation_id}`)
   - Include wsUrl for direct access to the push endpoint
   - TTL: 24 hours (long enough for slow tasks)
   - Purpose: Map cursor task to agent session for callback
   - **CRITICAL**: This prevents race conditions when tasks complete out of order

#### Flow with Callback Queue

1. **When webhook receives tool call:**
   - Generate or get taskId (cursor-runner requestId)
   - Lookup active session: `elevenlabs:session:{conversation_id}` from Redis
   - **If no active session** (expired, tab closed, WebSocket disconnected):
     - Return error: "Agent session not active. Please reconnect to the agent."
     - Note: Conversation still exists, but session is ephemeral and cannot be replayed
   - **CANONICAL RULE**: Get sessionPayload (raw push-capable payload) from session store
   - **CANONICAL RULE**: **MUST NOT rely solely on sessionId**
   - Extract wsUrl from sessionPayload (usually `sessionPayload.wsUrl` or `sessionPayload.config.wsUrl`)
   - **CRITICAL**: Store callback task in Redis: `cursor_task:{taskId}` = `{ sessionPayload, wsUrl, conversationId, pending: true, ... }`
   - **MUST store the raw push-capable payload** (not just sessionId)
   - Call cursor-runner:3001/cursor/iterate/async with taskId and callbackUrl
   - Return immediately to ElevenLabs

2. **When cursor completes (callback received):**
   - Callback handler receives taskId (from cursor-runner)
   - Lookup callback task: `cursor_task:{taskId}` from Redis
   - If not found, log error and skip (task expired or invalid)
   - Get sessionUrl (or agentSessionId + lookup session) from task record
   - **CRITICAL**: Use the stored sessionUrl (full WebSocket URL or session params) to push update
   - Verify session still active: `elevenlabs:session:{conversationId}` (optional check)
   - **Push update to agent via session URL:**
     - **MVP Format (Simple Text)**:
       ```json
       {
         "type": "input_text",
         "text": "Your code task is complete.\n\nSummary:\n- [summary]"
       }
       ```
     - **Enhanced Format (Future - Structured Metadata)**:
       ```json
       {
         "type": "input_text",
         "text": "cursor_task_complete",
         "metadata": {
           "summary": "...",
           "branch": "...",
           "files_changed": [...],
           "repository": "...",
           "success": true,
           "duration": "..."
         }
       }
       ```
   - **MUST use the exact session URL/params** stored when session was created
   - **MVP**: Use simple text format
   - **Future**: Experiment with metadata format (not well documented by ElevenLabs)
   - Mark task as complete: Update `cursor_task:{taskId}` with `pending: false, completedAt`
   - Clean up after TTL expires

**Why This Prevents Race Conditions:**

- Tasks complete in arbitrary order, but each has unique taskId
- Redis lookup is atomic and deterministic
- No dependency on completion order
- Multiple service instances can process callbacks safely
- Durable state survives service restarts

#### Async Cursor Execution Flow with Callback Queue

1. ElevenLabs agent calls tool (e.g., write_code)
2. Webhook receives request → validates auth
3. Lookup active session: `elevenlabs:session:{conversation_id}` from Redis
4. Generate taskId (unique identifier for this cursor task)
5. **Store callback task in Redis**: `cursor_task:{taskId}` = `{ sessionUrl, conversationId, pending: true, ... }`
   - **CRITICAL**: Include sessionUrl (full WebSocket URL or session params) for pushing updates
6. Call cursor-runner:3001/cursor/iterate/async with taskId and callbackUrl pointing to elevenlabs-agent
7. Webhook **immediately returns** to ElevenLabs: `{ ok: true, say: "I've started generating that code. This may take a few minutes. I'll let you know when it's done." }`
8. Cursor execution happens in background (may take minutes)
9. When cursor completes, cursor-runner calls callback URL with taskId and result
10. Callback handler looks up `cursor_task:{taskId}` from Redis
11. **CANONICAL RULE**: Get sessionPayload (raw push-capable payload) from task record
12. **CANONICAL RULE**: **MUST NOT rely solely on sessionId**
13. Extract wsUrl from sessionPayload (usually `sessionPayload.wsUrl` or `sessionPayload.config.wsUrl`)
14. **Push update directly to agent** via wsUrl:
    - **MVP Format (Simple Text)**:
      ```json
      {
        "type": "input_text",
        "text": "Your code task is complete.\n\nSummary:\n- [summary]"
      }
      ```
    - **Enhanced Format (Future - Structured Metadata)**:
      ```json
      {
        "type": "input_text",
        "text": "cursor_task_complete",
        "metadata": {
          "summary": "...",
          "branch": "...",
          "files_changed": [...],
          "repository": "...",
          "success": true,
          "duration": "..."
        }
      }
      ```
15. Mark task as complete in Redis (optional, for monitoring)

### CRITICAL: ElevenLabs Agents Do NOT Check Conversation History

**Important Architecture Constraint:**

- ElevenLabs agents **do not** poll or query conversation history
- They only know about:
  - Live audio/text from the user
  - Tool results sent back via webhook response
  - Their own internal memory graph
- **Simply updating conversation DB does NOT notify the agent**

**Solution: Push Updates Directly to Agent**

When cursor execution completes, we must explicitly send the update to the agent.

### CRITICAL: Cursor Task Completion Message Format

**MVP Format (Simple Text - Start Here):**

```json
{
  "type": "input_text",
  "text": "Your code task is complete.\n\nSummary:\n- Created authentication system\n- Added JWT token handling\n- Implemented middleware"
}
```

**Enhanced Format (Future - Structured Metadata for Better Agent Reasoning):**

```json
{
  "type": "input_text",
  "text": "cursor_task_complete",
  "metadata": {
    "summary": "Created user authentication system with JWT tokens",
    "branch": "feature/auth-system",
    "files_changed": [
      "src/auth/login.ts",
      "src/auth/token.ts",
      "src/middleware/auth.ts"
    ],
    "repository": "my-app",
    "success": true,
    "duration": "2m 34s",
    "output": "Code generated successfully. All tests passing."
  }
}
```

**Notes:**

- **MVP**: Use simple text format for initial implementation
- **Future Enhancement**: Experiment with structured metadata format
- Metadata format is **not well documented** by ElevenLabs and may require experimentation
- Structured metadata can improve agent reasoning by providing context (files changed, branch, etc.)
- Metadata allows agent to act on completion (e.g., "Should I review the changes?" or "Would you like me to explain the implementation?")

**Option A: Push Update via Conversation Session (RECOMMENDED)**

- Use the conversation session's streaming endpoint to send text directly to agent
- **Message Format (REQUIRED)**:
  ```json
  {
    "type": "input_text",
    "text": "Your code task is complete.\n\nSummary:\n- X\n- Y\n- Z"
  }
  ```
- Agent receives this as if user typed it, can respond naturally
- Requires maintaining active conversation session references
- Most conversational approach

**Enhanced Format with Metadata (RECOMMENDED for Better Agent Reasoning):**

- ElevenLabs supports metadata in input_text messages (not well documented)
- Structured format allows agent to reason about task completion more effectively:
  ```json
  {
    "type": "input_text",
    "text": "cursor_task_complete",
    "metadata": {
      "summary": "Created user authentication system with JWT tokens",
      "branch": "feature/auth-system",
      "files_changed": [
        "src/auth/login.ts",
        "src/auth/token.ts",
        "src/middleware/auth.ts"
      ],
      "repository": "my-app",
      "success": true,
      "duration": "2m 34s"
    }
  }
  ```
- **MVP**: Start with simple text format
- **Future Enhancement**: Add structured metadata for better agent reasoning
- Metadata format is not well documented by ElevenLabs, may require experimentation

**Option B: Fire Tool Result Back to ElevenLabs**

- Make cursor-runner callback trigger a tool result event
- Send completion as a tool response to ElevenLabs
- Less natural, but works if session management is complex

**Option C: User Manually Checks**

- Update conversation DB, frontend shows update
- User must manually check or ask agent
- Not conversational, but simplest to implement

**Recommended Implementation: Option A**

**Conversation Update on Completion:**

- When cursor completes, callback is triggered
- Store active conversation session reference (session ID or connection handle)
- **Message Format (MVP - Simple Text)**:
  ```json
  {
    "type": "input_text",
    "text": "Your code task is complete.\n\nSummary:\n- Created authentication system\n- Added JWT token handling\n- Implemented middleware"
  }
  ```
- **Enhanced Format (Future - Structured Metadata)**:
  ```json
  {
    "type": "input_text",
    "text": "cursor_task_complete",
    "metadata": {
      "summary": "Created user authentication system with JWT tokens",
      "branch": "feature/auth-system",
      "files_changed": ["src/auth/login.ts", "src/auth/token.ts"],
      "repository": "my-app",
      "success": true,
      "duration": "2m 34s"
    }
  }
  ```
- Also update conversation DB for frontend display
- Agent receives update and can respond naturally (e.g., "Great! The code has been generated. Would you like me to explain what was created?")
- **MVP**: Use simple text format
- **Future**: Experiment with metadata format for improved agent reasoning

### Environment Variables

- `ELEVENLABS_API_KEY` - For signed URL generation (if agent is private)
- `ELEVENLABS_AGENT_ID` - Default agent ID (optional)
- `WEBHOOK_SECRET` - For webhook authentication
- `CURSOR_RUNNER_URL` - URL to cursor-runner service (default: `http://cursor-runner:3001`)
- `PORT` - Service port (default: 3004)
- `REDIS_URL` - **REQUIRED** - For stateless session tracking, callback queue, and agent conversation storage (e.g., `redis://redis:6379/0`)
  - Used to store:
    - Active conversation sessions: `elevenlabs:session:{conversation_id}`
    - Agent conversations: `elevenlabs:conversation:{conversationId}`
    - Callback task queue: `cursor_task:{taskId}` (REQUIRED to prevent race conditions)
  - Required for horizontal scaling (multiple service instances)
  - Required for handling tasks completing in arbitrary order
  - Must use shared Redis instance across all service instances
- `ELEVENLABS_AGENT_ENABLED` - **Feature flag** (default: false)
  - Set to true to enable ElevenLabs agent functionality
  - Allows dark release: deploy code but keep feature disabled
  - When false, service still runs but returns 503 or disables endpoints

### Docker Integration

- Add to virtual-assistant-network
- Traefik routing at `/agent-conversations/api/*` (for agent conversation API)
- Traefik routing at `/signed-url`, `/agent-tools`, `/callback` (for webhooks)
- Traefik routing at `/config`, `/config/health` (for configuration)
- Health check endpoint: `GET /health`
- Lightweight service, minimal resources needed
- **Stateless design** - can scale horizontally (multiple instances)
- Connects to shared Redis instance for session tracking, conversations, and callback queue

### Migration from jarek-va

- Port webhook authentication logic
- **IMPORTANT**: Change tool routing to use async pattern
  - Current jarek-va tools wait synchronously (won't work for conversation)
  - New implementation must return immediately for cursor tools
  - Use HTTP client to call cursor-runner:3001/cursor/iterate/async (returns immediately)
  - Handle cursor-runner being unavailable gracefully
- **CRITICAL**: Implement callback queue system (REQUIRED for correctness)
  - Store active conversation sessions in Redis: `elevenlabs:session:{conversation_id}`
  - **REQUIRED**: Store the **full WebSocket session URL** or **session parameters** (not just sessionId)
  - Example: `{ sessionUrl: "wss://api.elevenlabs.io/v1/ws/conversation/{sessionId}?signed_url=xyz", ... }`
  - **REQUIRED**: Store callback tasks in Redis: `cursor_task:{taskId}` with sessionUrl included
  - This prevents race conditions when tasks complete in arbitrary order
  - **MUST use Redis** (not in-memory) for horizontal scaling and durability
  - When cursor completes, callback handler:
    1. Receives taskId from cursor-runner
    2. Looks up `cursor_task:{taskId}` from Redis
    3. Gets sessionPayload (raw push-capable payload) from task record
    4. Extracts wsUrl from sessionPayload (usually `sessionPayload.wsUrl` or `sessionPayload.config.wsUrl`)
    5. **MUST use the exact session URL/params** stored when session was registered
    6. Pushes update to agent via stored wsUrl:
       - **MVP Format (Simple Text)**:
         ```json
         {
           "type": "input_text",
           "text": "Your code task is complete.\n\nSummary:\n- [summary]"
         }
         ```
       - **Enhanced Format (Future - Structured Metadata)**:
         ```json
         {
           "type": "input_text",
           "text": "cursor_task_complete",
           "metadata": {
             "summary": "...",
             "branch": "...",
             "files_changed": [...],
             "repository": "...",
             "success": true,
             "duration": "..."
           }
         }
         ```
    7. **MVP**: Use simple text format
    8. **Future**: Add structured metadata for better agent reasoning (metadata format not well documented by ElevenLabs)
- Do NOT rely on agent checking conversation history (it won't)
- Do NOT store state in memory (service must be stateless)
- **Without callback queue, race conditions WILL occur**
- **CANONICAL RULE**: **MUST store the raw push-capable payload returned by the ElevenLabs JS SDK**
- **CANONICAL RULE**: **MUST NOT rely solely on sessionId**
- Must capture and store the full session object/parameters from JS SDK on connection
- Extract `session.config.wsUrl` or the full WS URL + token bundle from the session object
- Update ElevenLabs dashboard webhook URL to point to new service
- Keep same request/response format for compatibility
- Add callback mechanism that pushes to agent, not just updates DB
- Service can respond even if cursor-runner is down: "Code execution service is temporarily unavailable"

**If agent is public:**

- Skip signed URL endpoint (or make it optional)
- Still add webhook endpoint for tool calls
- No expiration handling needed (public agents use agentId directly)

**If agent is private:**

- Signed URL endpoint is required
- **CRITICAL**: Frontend voice service must handle signed URL expiration
- Signed URLs:
  - **Expire** after a period (check ElevenLabs docs for TTL)
  - **Cannot be reused** across tabs/browser sessions
  - **Are specific** to the conversation session
  - **Must be rotated** periodically for long-running sessions
- Voice service must:
  - Detect expiration (monitor onError events, track TTL)
  - Renew signed URL automatically (call /signed-url endpoint)
  - Reconnect gracefully (disconnect, reconnect with new URL)
  - Proactively renew before expiration (e.g., 5 minutes before TTL)
- **Do NOT overfocus on GET /signed-url** - it's just one part
- **Focus on expiration handling in voice service** - this is the critical part

---

## Step 5: Create Dashboard Layout

**CRITICAL: Dashboard-style layout with all three sections on one page**

**New file:** `src/components/Dashboard.tsx`

**Purpose:**

- Single-page dashboard combining:
  - **Upper left**: Agent voice indicator (circle that lights up when agent is talking)
  - **Lower left**: Agent chat history
  - **Right side**: Note taking conversation history
- Responsive: Sections stack vertically on mobile/phone view

**Layout Structure:**

```
Desktop/Tablet View:
┌─────────────────────────────────────────────┐
│  [Voice Indicator]  │  [Note Taking History] │
│  (Upper Left)       │  (Right Side)          │
│                     │                        │
│  [Agent Chat]       │                        │
│  (Lower Left)       │                        │
└─────────────────────────────────────────────┘

Mobile/Phone View (Stacked):
┌─────────────────────┐
│ [Voice Indicator]   │
├─────────────────────┤
│ [Agent Chat]        │
├─────────────────────┤
│ [Note Taking]       │
└─────────────────────┘
```

**Components:**

1. **VoiceIndicator Component** (`src/components/VoiceIndicator.tsx`)
   - **Visual**: Circle with pulsing/lighting effect (like ChatGPT phone app)
   - **States**:
     - Idle: Static circle (gray or neutral color)
     - Listening: Pulsing circle (blue/green, expanding/contracting)
     - Speaking: Pulsing circle (different color, more intense animation)
     - Connecting: Slow pulse (yellow/orange)
     - Error: Red static or flashing
   - **Props**:
     - `status: 'idle' | 'listening' | 'speaking' | 'connecting' | 'error'`
     - `onClick?: () => void` (optional - for starting/stopping voice)
   - **Animation**: CSS animations for pulsing effect
   - **Size**: Responsive (larger on desktop, smaller on mobile)

2. **AgentChatPanel Component** (`src/components/AgentChatPanel.tsx`)
   - Shows agent conversation history
   - Includes text input for sending messages
   - Voice controls (start/stop voice button)
   - Message list with scroll
   - **Props**:
     - `conversationId?: string` (optional - if viewing specific conversation)
     - `onConversationSelect?: (id: string) => void`
     - `onMessageSend?: (message: string) => void`
   - **Features**:
     - List of agent conversations (if no conversation selected)
     - Conversation details (if conversation selected)
     - Voice controls integrated
   - **CRITICAL: Register Session on Connect**
       - When voice connects, register session with backend
       - POST to `POST /agent-conversations/api/{conversationId}/session`

3. **NoteTakingPanel Component** (`src/components/NoteTakingPanel.tsx`)
   - Shows note-taking conversation history (cursor conversations)
   - List of conversations or conversation details
   - **Props**:
     - `conversationId?: string` (optional - if viewing specific conversation)
     - `onConversationSelect?: (id: string) => void`
   - **Features**:
     - List of note-taking conversations (if no conversation selected)
     - Conversation details (if conversation selected)
     - Repository file browser (if viewing conversation details)

4. **Dashboard Component** (`src/components/Dashboard.tsx`)
   - Main container component
   - Manages layout and responsive behavior
   - Coordinates state between panels
   - **Layout**:
     - Desktop: CSS Grid or Flexbox with 2 columns
     - Mobile: Single column, stacked
   - **State Management**:
     - Selected agent conversation ID
     - Selected note-taking conversation ID
     - Voice connection status
     - Agent mode (idle/listening/speaking)

**Implementation Details:**

1. **Responsive Layout:**
   - Use CSS Grid for desktop: `grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr;`
   - Use Flexbox for mobile: `flex-direction: column;`
   - Media queries for breakpoints (e.g., `@media (max-width: 768px)`)
   - Voice indicator: `grid-area: 1 / 1` (upper left)
   - Agent chat: `grid-area: 2 / 1` (lower left)
   - Note taking: `grid-area: 1 / 2 / 3 / 2` (right side, spans both rows)

2. **Voice Indicator Animation:**
   - CSS keyframes for pulsing effect
   - Different colors/animations for different states
   - Smooth transitions between states
   - Example CSS:
     ```css
     .voice-indicator {
       width: 80px;
       height: 80px;
       border-radius: 50%;
       transition: all 0.3s ease;
     }
     .voice-indicator.listening {
       background: radial-gradient(circle, #4CAF50, #2E7D32);
       animation: pulse 1.5s ease-in-out infinite;
     }
     .voice-indicator.speaking {
       background: radial-gradient(circle, #2196F3, #1565C0);
       animation: pulse 0.8s ease-in-out infinite;
     }
     @keyframes pulse {
       0%, 100% { transform: scale(1); opacity: 1; }
       50% { transform: scale(1.1); opacity: 0.8; }
     }
     ```

3. **State Coordination:**
   - Dashboard manages selected conversations for both panels
   - Voice service state is shared between VoiceIndicator and AgentChatPanel
   - Use React Context or prop drilling for state sharing

4. **Routing Integration:**
   - Dashboard can be the main route (`/dashboard` or `/`)
   - URL params can control which conversations are selected
   - Example: `/dashboard?agentConv=abc123&noteConv=xyz789`

**Files to create:**

- `src/components/Dashboard.tsx` - Main dashboard container
- `src/components/VoiceIndicator.tsx` - Voice indicator circle component
- `src/components/AgentChatPanel.tsx` - Agent chat panel (replaces AgentConversationDetailView)
- `src/components/NoteTakingPanel.tsx` - Note taking panel (replaces ConversationDetailView)
- `src/styles/Dashboard.css` - Dashboard-specific styles

**Files to modify:**

- `src/App.tsx` - Add dashboard route
- `src/components/AgentConversationDetails.tsx` - Can be reused by AgentChatPanel
- `src/components/ConversationDetails.tsx` - Can be reused by NoteTakingPanel
- `src/styles/App.css` - Add responsive layout styles

**Changes from Original Plan:**

- **No separate pages** - Everything is on one dashboard
- **Voice indicator is always visible** (when feature enabled) - not hidden in conversation details
- **Both conversation types visible simultaneously** - side by side on desktop
- **Responsive design** - Stacks on mobile

---

## Step 6: Update API Client

**File to modify:** `src/api/conversations.ts` (for note-taking - no changes needed, already correct)

**New file:** `src/api/agent-conversations.ts` (for agent conversations - calls elevenlabs-agent)

**New file:** `src/api/elevenlabs.ts` (for ElevenLabs-specific endpoints like signed-url)

Create a new API client for ElevenLabs agent service:

```typescript
const ELEVENLABS_AGENT_BASE_URL = import.meta.env.VITE_ELEVENLABS_AGENT_URL || '/elevenlabs';

export async function getVoiceSignedUrl(agentId?: string): Promise<{ signedUrl: string }> {
  const response = await fetch(
    `${ELEVENLABS_AGENT_BASE_URL}/signed-url${agentId ? `?agentId=${agentId}` : ''}`
  );
  // ... error handling
  return response.json();
}

export interface RegisterSessionRequest {
  sessionUrl: string;
  expiresAt?: string;      // optional
  agentSessionId?: string; // optional
  transport?: 'webrtc' | 'websocket'; // optional
}

export async function registerSession(
  conversationId: string,
  sessionData: RegisterSessionRequest
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${ELEVENLABS_AGENT_BASE_URL}/agent-conversations/api/${conversationId}/session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    }
  );
  // ... error handling
  return response.json();
}
```

**Note:** 
- Agent conversation endpoints are in the separate elevenlabs-agent service, accessible via Traefik routing at `/agent-conversations/api/*`
- ElevenLabs-specific endpoints (signed-url) are at `/signed-url` (elevenlabs-agent)

**If agent is public:**

- Still create the API client file for consistency
- Signed URL endpoint won't be used, but structure is ready
- No expiration handling needed

**If agent is private:**

- API client must handle signed URL renewal
- Voice service will call `getVoiceSignedUrl()` when URL expires
- Return type includes expiresAt if provided by ElevenLabs
- Voice service tracks expiration and renews proactively

---

## Step 6.5: Create Retry Utilities

**New file:** `src/utils/retry.ts`

Create retry utilities for network operations with exponential backoff:

```typescript
export interface RetryOptions {
  maxRetries?: number;        // Default: 5
  initialDelay?: number;       // Default: 1000ms
  maxDelay?: number;           // Default: 30000ms
  backoffMultiplier?: number; // Default: 2
  onRetry?: (attempt: number, error: Error) => void;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
  // Max retries: 5
  // Used for reconnection attempts, signed URL renewal, etc.
}
```

**Usage:**

- Reconnection attempts (voice service)
- Signed URL renewal (private agents)
- Any network operation that may fail
- Heartbeat recovery

---

## Step 7: Add Configuration

**New file:** `src/config/elevenlabs.ts`

Store ElevenLabs configuration:

- Agent ID (from environment variable or config)
- Whether agent is public or private
- API endpoint for signed URLs (if private)

**Environment variables:**

- `VITE_ELEVENLABS_AGENT_ENABLED` - **Feature flag** (default: false)
  - Set to 'true' to enable ElevenLabs voice agent UI
  - Allows dark release: deploy code but keep feature hidden
  - When false, voice controls are completely hidden
  - Must be string 'true' (Vite env vars are strings)
- `VITE_ELEVENLABS_AGENT_ID` - Agent ID for public agents (optional)
- `VITE_ELEVENLABS_AGENT_PUBLIC` - Boolean indicating if agent is public (optional)
- `VITE_ELEVENLABS_AGENT_URL` - Base URL for ElevenLabs agent service (optional, defaults to relative path `/agent-conversations/api` for agent conversations, `/elevenlabs` for signed-url)

---

## Step 8: Update Styles

**File to modify:** `src/styles/App.css`

**New styles for voice controls:**

- Voice toggle button (distinct from send button)
- Connection status indicator
- Agent mode indicator (speaking/listening/idle)
- Microphone active indicator (pulsing animation)
- Voice mode container/layout

**Considerations:**

- Match existing design system (colors, spacing, typography)
- Make voice controls clearly visible but not intrusive
- Show visual feedback for active voice session

---

## Step 9: Error Handling & Edge Cases

**Handle:**

### Network Layer Failures (CRITICAL)

- **SDK reconnection failures**: Implement retry loop with exponential backoff
- **Timeouts**: Connection timeout, operation timeout, heartbeat timeout
- **Dropped audio**: Detect audio stream interruptions, reconnect if needed
- **Partial transcripts**: Buffer incomplete messages, handle timeouts
- **Mode-change not firing**: Fallback detection, track time since last activity
- **Agent stuck speaking**: Detect when speaking but no audio, trigger recovery
- **Safari WebRTC quirks**: Handle Safari-specific connection issues
- **Mobile browser limitations**: Handle background tab pausing
- **Multiple tabs conflicts**: Detect and handle concurrent sessions

### Application Layer Failures

- Microphone permission denied
- Network errors during voice session
- Agent disconnection
- **Signed URL expiration (private agents)**:
  - Detect expiration errors
  - Automatically renew signed URL
  - Reconnect gracefully without losing context
  - Show "Reconnecting..." indicator if needed
  - Handle renewal failures (fallback to manual reconnect)
- Browser compatibility (check for WebRTC support)
- Multiple conversation tabs (only one voice session at a time)
- Switching between conversations while voice is active
- Long-running sessions requiring signed URL renewal

### User feedback

- Clear error messages for permission/connection issues
- Loading states during session start/stop
- "Reconnecting..." indicator (with retry count)
- "Connection lost, attempting to reconnect..." messages
- "Agent seems stuck, reconnecting..." messages
- "Voice session paused (tab in background)" for mobile
- "Another tab has active session" warning
- Manual reconnect button when auto-reconnect fails
- Connection health indicator (green/yellow/red)
- Graceful degradation if voice features unavailable

---

## Step 10: Testing

**Test scenarios:**

1. Start voice session in a conversation
2. Speak and receive agent response
3. Switch between text and voice modes
4. Stop voice session
5. Handle microphone permission denial
6. **Network failure scenarios (CRITICAL)**:
   - Simulate network disconnection (unplug network)
   - Verify reconnection with backoff
   - Test timeout handling
   - Test dropped audio detection
   - Test partial transcript handling
   - Test mode-change not firing (simulate SDK bug)
   - Test agent stuck speaking (simulate no audio while speaking)
   - Test heartbeat failure detection
   - Test max retry limit
   - Test manual reconnect after auto-reconnect fails
7. **Browser-specific testing**:
   - Test Safari WebRTC quirks
   - Test mobile browser background handling
   - Test multiple tabs (open same agent in 2 tabs)
   - Test on Chrome, Firefox, Safari, Edge
8. **Test signed URL expiration (private agents)**:
   - Simulate signed URL expiration
   - Verify automatic renewal
   - Verify graceful reconnection
   - Test renewal failure handling
9. Test with both public and private agents (if applicable)
10. Verify messages from voice appear in conversation history
11. Test long-running sessions requiring multiple signed URL renewals
12. **Stress testing**:
    - Rapid connect/disconnect cycles
    - Multiple concurrent failures
    - Extended session duration (1+ hours)
    - High network latency scenarios

**Files to create/update:**

- `src/services/__tests__/elevenlabs-voice.test.ts`
- `src/components/__tests__/AgentConversationDetails.test.tsx`

---

## Step 11: Documentation

**Update:**

- README.md - Document voice features and setup
- Add comments to voice service explaining ElevenLabs integration
- Document environment variables needed

---

## Implementation Order

1. **Phase 0: Separate Histories & File Browser** (Step 0)
   - Rename cursor conversations to "Note Taking History" in UI
   - Create separate agent conversation system (types, API, components)
   - **CRITICAL: Move agent conversation storage from cursor-runner to elevenlabs-agent**
   - **CRITICAL: Move agent conversation API endpoints from cursor-runner to elevenlabs-agent**
   - Add repository file browser component
   - Add backend endpoint for file tree (GET /repositories/api/:repository/files) in cursor-runner
   - Update routing to include agent conversations
   - Update Traefik routing to route `/agent-conversations/api/*` to elevenlabs-agent (not cursor-runner)
   - Test separation of histories

2. **Phase 1: Backend Service** (Step 4)
   - Create elevenlabs-agent service structure
   - **CRITICAL: Implement agent conversation storage in elevenlabs-agent (Redis)**
   - **CRITICAL: Implement agent conversation API endpoints in elevenlabs-agent**
   - Implement webhook endpoint (migrate from jarek-va, use async pattern)
   - Implement signed URL endpoint (if agent is private)
   - Add HTTP client for cursor-runner API calls (cursor-runner is called as a tool)
   - Set up Docker configuration and Traefik routing
   - Add error handling for cursor-runner being unavailable
   - Test endpoints independently
   - Update ElevenLabs dashboard webhook URL to point to new service

3. **Phase 2: Frontend Setup** (Steps 1-2, 6, 6.5)
   - Install dependencies
   - Create retry utilities with exponential backoff (src/utils/retry.ts)
   - Create voice service module skeleton
   - **CRITICAL**: Implement network failure handling in voice service:
     - Retry loop with exponential backoff (use retry utilities)
     - Heartbeat monitoring (every 30s, timeout 60s)
     - Timeout handlers (connection: 10s, operations: 30s)
     - Connection state machine (connecting, connected, reconnecting, failed, disconnected)
     - Dropped audio detection (5s threshold)
     - Partial transcript buffering
     - Mode-change fallback detection (track time since last activity)
     - Stuck agent recovery (30s speaking with no audio)
     - Safari WebRTC quirks handling
     - Mobile background tab handling
     - Multiple tabs detection
   - Create API client for ElevenLabs endpoints (calls elevenlabs-agent)
   - Update agent conversation API client to call elevenlabs-agent (not cursor-runner)
   - Add feature flag check in voice service

4. **Phase 3: Frontend Integration** (Steps 5, 7)
   - **CRITICAL: Create Dashboard Layout**
     - Create Dashboard component with three sections:
       - Upper left: Voice indicator (circle that lights up when agent is talking)
       - Lower left: Agent chat history
       - Right side: Note taking conversation history
     - Create VoiceIndicator component (pulsing circle animation)
     - Create AgentChatPanel component (agent conversations)
     - Create NoteTakingPanel component (note-taking conversations)
     - Implement responsive layout (stacks on mobile)
   - Integrate voice service with dashboard
   - Connect to elevenlabs-agent service
   - Add file browser to note-taking panel

5. **Phase 4: Polish** (Steps 8-9)
   - Add styles
   - Error handling
   - Testing

6. **Phase 5: Documentation** (Step 11)

---

## Key Differences from Original Plan

✅ **Integrated into existing React app** - No new HTML files or separate project

✅ **Dashboard-style layout** - All three sections (voice indicator, agent chat, note-taking) on one page

✅ **Responsive design** - Sections stack vertically on mobile/phone view

✅ **Voice indicator always visible** - Circle that lights up when agent is talking (like ChatGPT phone app)

✅ **Separate stateless service** - elevenlabs-agent service with Redis for session tracking

✅ **Horizontally scalable** - Stateless design enables multiple service instances

✅ **TypeScript throughout** - Maintains type safety

✅ **Consistent with current patterns** - Follows existing component structure and styling

✅ **Simplified tool routing** - Most tools just call cursor-runner anyway, so routing is straightforward

✅ **Stateless architecture** - Uses Redis for session tracking, enables horizontal scaling

✅ **Correct architecture** - Agent conversations managed by elevenlabs-agent, cursor-runner called as tool

---

## Notes

- **Agent Configuration:**
  - Ensure your ElevenLabs agent has Server Tools configured
  - **Update webhook URL** from jarek-va endpoint to new elevenlabs-agent service
  - Example: `https://jarekva.com/agent-tools` (depending on Traefik routing)

- **Critical Architecture Point:**
  - **ElevenLabs conversation is separate from cursor execution**
  - **Agent conversations are managed by elevenlabs-agent, NOT cursor-runner**
  - **cursor-runner is called as a tool by elevenlabs-agent**
  - Cursor calls are slow (minutes) and cannot block conversation
  - Webhook must return immediately for cursor tools
  - Use async execution with callbacks for cursor tasks
  - Agent can continue conversation while cursor runs in background

- **Service Migration:**
  - New elevenlabs-agent service replaces jarek-va webhook handling
  - **IMPORTANT**: Must change from sync to async pattern
  - Current jarek-va tools wait for cursor (blocks conversation)
  - New implementation returns immediately, calls cursor-runner's /cursor/iterate/async via HTTP
  - Service can gracefully handle cursor-runner being unavailable
  - Maintain same request/response format for seamless transition
  - Can run both services in parallel during migration period
  - **CRITICAL: Agent conversations must be moved from cursor-runner to elevenlabs-agent**

- **Completion Notification:**
  - When cursor completes, elevenlabs-agent pushes update to agent
  - Agent receives update and can respond naturally
  - Frontend already polls, so users see updates automatically

- **Browser Support:** ElevenLabs SDK requires modern browsers with WebRTC support (Chrome, Firefox, Safari, Edge)

- **Privacy:** If using private agent, API key stays in elevenlabs-agent service; frontend only receives signed URLs

- **Signed URL Expiration (Private Agents):**
  - Signed URLs expire and cannot be reused across tabs
  - Voice service must detect expiration and renew automatically
  - Implement proactive renewal before expiration
  - Handle graceful reconnection when URL expires
  - Test expiration scenarios thoroughly

- **Concurrent Sessions:** Consider limiting to one active voice session per browser tab/window

- **Message Sync:** Voice messages should sync with backend conversation history via elevenlabs-agent API

- **Network Layer Failure Handling (CRITICAL):**
  - ElevenLabs SDK is NOT robust - implement comprehensive failure handling
  - Must handle: reconnection failures, timeouts, dropped audio, partial transcripts
  - Must handle: mode-change not firing, agent stuck speaking
  - Implement: retry loops with backoff, heartbeat monitoring, timeout handlers
  - Browser quirks: Safari WebRTC issues, mobile background limitations, multiple tabs
  - Do NOT assume stable connections - always implement retry and recovery

- **CRITICAL: Push Updates to Agent:**
  - ElevenLabs agents do NOT check conversation history
  - Must explicitly push cursor completion updates to agent via conversation session
  - Use session streaming endpoint with cursor task completion message format (see "Cursor Task Completion Message Format" section)
  - Store active session references in Redis (conversation_id → session) in elevenlabs-agent
  - **MUST use Redis** (not in-memory) for stateless, horizontally scalable service
  - When cursor completes, any service instance can lookup session from Redis and push update

- **Network:** New service joins virtual-assistant-network for inter-service communication

- **Traefik Routing:**
  - `/conversations/api/*` → cursor-runner (note-taking history)
  - `/agent-conversations/api/*` → elevenlabs-agent (agent conversations)
  - `/signed-url`, `/agent-tools`, `/callback` → elevenlabs-agent (webhooks)
  - `/config`, `/config/health` → elevenlabs-agent (configuration)

- **Frontend Routing:**
  - Dashboard route: `/dashboard` or `/` (main dashboard with all three sections)
  - URL params can control selected conversations: `/dashboard?agentConv=abc123&noteConv=xyz789`
  - Separate list views can still exist for navigation: `/agent-conversations` (list), `/` (note-taking list)
  - Dashboard is the main view when feature is enabled

---

## Future Enhancements (Post-MVP)

- Visual waveform during voice input/output
- Voice message transcription display
- Voice history playback
- Multiple agent selection
- Voice settings (volume, speed, etc.)
- Push-to-talk mode option
- Voice-to-text fallback if agent unavailable
