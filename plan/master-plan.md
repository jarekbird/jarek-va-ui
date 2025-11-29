## Migration Plan: Conversation & Task Views → `cursor-executor-front`

### 1. Scope & Objectives
- **In scope**
  - Conversation list view
  - Conversation details view (including message history, metadata, status)
  - Task list view
  - Task details view (including status, subtasks, logs, and related conversation)
- **Out of scope (for this phase)**
  - Authentication / user management changes (reuse existing backend/session model)
  - Non‑conversation/task UI (settings, dashboards, etc.)
  - Major backend refactors (only minimal API adaptations as needed)

### 2. Target Architecture (`cursor-executor-front`)
- **Tech stack**
  - React 18+ with functional components and hooks
  - TanStack Query (React Query) for server state
  - TanStack Router (or React Router, if TanStack Router is not adopted yet) for routing
  - TypeScript for all components and hooks
  - UI library (TBD: reuse existing design system, Tailwind, or headless components)
- **High-level structure**
  - `src/`
    - `app/` or `routes/` (routing layer)
      - `conversations/` (list + detail routes)
      - `tasks/` (list + detail routes)
    - `components/`
      - `conversations/` (pure UI components)
      - `tasks/` (pure UI components)
      - `layout/` (shell, navigation, page layout)
    - `hooks/`
      - `useConversationsQuery.ts`
      - `useConversationQuery.ts`
      - `useTasksQuery.ts`
      - `useTaskQuery.ts`
    - `api/`
      - `client.ts` (fetch/axios wrapper)
      - `conversations.ts`
      - `tasks.ts`
    - `types/`
      - `conversation.ts`
      - `task.ts`

### 3. Backend Contracts & Data Model Alignment
- **3.1. Discover existing APIs**
  - Identify current HTTP/WebSocket endpoints in `cursor-executor` that expose:
    - Conversation list
    - Conversation details (messages, metadata)
    - Task list
    - Task details (status, logs, related conversation)
  - Document request/response shapes and any filters/pagination/sorting.
- **3.2. Define front-end data types**
  - Create TypeScript types/interfaces mirroring backend responses:
    - `Conversation`, `ConversationSummary`
    - `Task`, `TaskSummary`
    - `Message`, `ExecutionLogEntry`
  - Normalize where necessary (e.g. IDs, timestamps, enum values).
- **3.3. Gaps & adjustments**
  - List any missing fields needed for the new UI.
  - Decide: small backend adjustments vs front-end transformation-only.

### 4. API Layer & TanStack Query Setup
- **4.1. API client**
  - Implement a minimal `api/client.ts`:
    - Base URL config (pointing to `cursor-executor` backend)
    - Error handling and auth headers
    - JSON parsing and common response helpers.
- **4.2. Query client setup**
  - Add `QueryClient` and `QueryClientProvider` at the app root.
  - Define sensible defaults (retry, staleTime, cacheTime).
- **4.3. Query hooks**
  - `useConversationsQuery(params)` → fetch conversation list with filters/pagination.
  - `useConversationQuery(id)` → fetch specific conversation with messages.
  - `useTasksQuery(params)` → fetch task list.
  - `useTaskQuery(id)` → fetch specific task with details/logs.
  - Ensure loading/error states are standardized (shared components or patterns).

### 5. Routing & Navigation
- **5.1. Routes**
  - `/conversations` → conversation list view
  - `/conversations/:conversationId` → conversation details view
  - `/tasks` → task list view
  - `/tasks/:taskId` → task details view
- **5.2. Navigation shell**
  - Create a top-level layout:
    - App header with navigation (Conversations, Tasks)
    - Main content area for routed views
  - Support deep-linking directly to detail pages.

### 6. Conversation Views
- **6.1. Conversation list**
  - Requirements:
    - Search/filter (by status, date, agent, user, etc. – match current behavior)
    - Sorting (newest first, etc.)
    - Pagination or infinite scroll (depending on backend capabilities).
  - Components:
    - `ConversationsPage`
    - `ConversationList`
    - `ConversationListItem`
    - `ConversationFilters`
- **6.2. Conversation details**
  - Requirements:
    - Show conversation metadata (title, user, created/updated, status).
    - Message history with role (user/assistant/system) and timestamps.
    - Link to associated tasks (if any).
    - Optional: live updates (polling or WebSocket in a later phase).
  - Components:
    - `ConversationDetailPage`
    - `ConversationHeader`
    - `MessageList`
    - `MessageItem`
    - `RelatedTasksPanel`

### 7. Task Views
- **7.1. Task list**
  - Requirements:
    - Filter by status (pending, in_progress, completed, failed).
    - Sorting and pagination.
    - Show relationship to conversations (e.g., conversation title or link).
  - Components:
    - `TasksPage`
    - `TaskList`
    - `TaskListItem`
    - `TaskFilters`
- **7.2. Task details**
  - Requirements:
    - Task metadata (status, created, last updated, owner/agent).
    - Execution logs and/or timeline.
    - Link back to associated conversation.
    - Controls to retry/cancel (if supported; may be a later phase).
  - Components:
    - `TaskDetailPage`
    - `TaskHeader`
    - `TaskStatusBadge`
    - `TaskLogs`

### 8. UI/UX & Parity with Existing App
- **8.1. Inventory existing UI**
  - Capture screenshots or specs of current conversation/task views.
  - Identify must-keep behaviors (e.g., how messages are grouped, status colors).
- **8.2. Design system alignment**
  - Decide whether to:
    - Reuse existing component library from `jarek-va-ui`, or
    - Introduce a light, shared design system for `cursor-executor-front`.
  - Define common primitives: buttons, inputs, modals, typography, spacing.
- **8.3. Accessibility & responsiveness**
  - Ensure keyboard navigation and ARIA attributes for lists and detail panels.
  - Make layouts responsive for narrow viewports (side-by-side vs stacked panels).

### 9. Testing Strategy
- **9.1. Unit tests**
  - Component-level tests for:
    - Conversation list and detail components.
    - Task list and detail components.
  - Hook tests for query hooks (mocking API layer).
- **9.2. Integration tests**
  - Route-level tests:
    - Navigating between list and detail views.
    - Handling loading and error states.
  - Verify TanStack Query cache behavior (e.g., detail view uses cached list data where appropriate).
- **9.3. Manual regression checklist**
  - Confirm that:
    - All data visible in the old app for conversations/tasks is present.
    - Links between conversations and tasks work both ways.
    - Edge cases (empty states, errors, long histories) are handled.

### 10. Incremental Migration & Rollout
- **10.1. Feature flags**
  - Add a flag to route traffic to `cursor-executor-front` for:
    - Conversation views
    - Task views
  - Allow per-user or environment-based toggling (dev/stage/prod).
- **10.2. Phased rollout**
  - Phase 1: Internal/dev use only.
  - Phase 2: Staging with power users; collect feedback.
  - Phase 3: Full rollout and deprecate old views.
- **10.3. Decommissioning**
  - Once parity is confirmed:
    - Remove old conversation/task view routes from the legacy UI.
    - Update documentation to point to `cursor-executor-front`.

### 11. Open Questions / Decisions
- **Routing**: Confirm TanStack Router vs React Router.
- **Design system**: Reuse existing components or define a new minimal system for `cursor-executor-front`.
- **Live updates**: Use polling first vs WebSockets from `cursor-executor` backend.
- **Auth/session**: Confirm how `cursor-executor-front` authenticates against the backend and whether shared cookies or tokens are used.



