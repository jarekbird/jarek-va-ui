### Task Dashboard React/TanStack Port – Master Plan

Using the existing `VirtualAssistant/jarek-va-ui` `TaskDashboard` as the reference implementation, this plan describes how to create a **React + TanStack Query** version of that dashboard inside the `cursor-executor-front` application. The goal is to make the new UI feel and behave like the current `TaskDashboard` while aligning with the architecture, APIs, and testing patterns already established in `cursor-executor-front`.

---

### 1. High‑Level Goals and Constraints

- **Goal**: Provide a task dashboard inside `cursor-executor-front` that:
  - Mirrors the existing `TaskDashboard` layout and behavior from `python-cursor/jarek-va-ui`.
  - Uses **React + TanStack Query** for data fetching, caching, and mutations.
  - Talks to the same logical backend concepts (tasks, conversations, working directory/files, BullMQ queues), but via the `cursor-executor` HTTP APIs.
- **Constraints**:
  - Reuse as much layout and interaction design from the existing `TaskDashboard` as possible to reduce cognitive load and implementation risk.
  - Follow `cursor-executor-front` conventions:
    - Centralized API layer in `src/api/`.
    - Shared types in `src/types/`.
    - TanStack Query setup via `src/query/`.
    - Routing patterns like `src/routes/conversations/ConversationsPage.tsx`.
  - Maintain strong automated testing:
    - Component tests for each major panel.
    - Integration tests for the overall dashboard route.
    - API contract tests for the new endpoints used.

Deliverable: A new route in `cursor-executor-front` (e.g. `/task-dashboard`) that provides the same four‑panel experience (file browser, notes, tasks, queues) with working data flows and tests.

---

### 2. Inventory of the Existing `TaskDashboard` (Source UI)

**Location**: `python-cursor/jarek-va-ui/src/components/TaskDashboard.tsx`

- **Layout**:
  - Far left: `WorkingDirectoryBrowser` (file viewer).
  - Left: `NoteTakingPanel` (note/conversation UI).
  - Middle right: `TaskManagementPanel` (task list + details).
  - Right: `BullMQQueueView` (queue status).
- **Key components & responsibilities**:
  - `TaskDashboard.tsx`:
    - Coordinates the four panels.
    - Manages `selectedNoteConversationId`.
    - Refreshes file browser and task panel when notes change.
  - `NoteTakingPanel.tsx`:
    - Lists/creates conversations.
    - Edits notes/messages.
    - Emits callbacks on conversation selection/update.
  - `WorkingDirectoryBrowser.tsx`:
    - Displays repository files.
    - Likely hits a `/working-directory/files` or similar API.
  - `TaskManagementPanel.tsx`:
    - Lists tasks (status, order).
    - Shows/edits task details.
    - Interacts with `tasks` API endpoints.
  - `BullMQQueueView.tsx`:
    - Polls queue status (BullMQ) and renders summary information.
- **Styling**:
  - `TaskDashboard.css` orchestrates the layout grid and responsive behavior.
  - Each subcomponent has its own CSS (e.g., `TaskManagementPanel.css`, `WorkingDirectoryBrowser.css`, `NoteTakingPanel.css`, `BullMQQueueView.css`).
- **Data dependencies (conceptual)**:
  - **Conversations / notes**: CRUD for conversations and messages.
  - **Tasks**: CRUD + filters (status, order).
  - **Files**: Read‑only file tree for a given working directory/repository.
  - **Queues**: Read‑only queue/worker status.

Action: Treat this UI as the reference experience and behavior contract when designing the new route in `cursor-executor-front`.

---

### 3. Target Architecture in `cursor-executor-front`

**Location**: `python-cursor/cursor-executor/cursor-executor-front`

- **Existing structure**:
  - React + Vite app with:
    - `src/api/` (typed API client and tests for conversations and tasks).
    - `src/types/` (shared types for `conversation`, `task`).
    - `src/query/` (TanStack Query client and provider).
    - `src/hooks/useConversationsQuery.ts` + tests.
    - `src/routes/conversations/ConversationsPage.tsx` (example route with loading/error/empty/success states).
  - Testing setup:
    - `src/api/*.{test.ts,test.tsx}`.
    - `src/hooks/*test.tsx`.
    - `src/query/*test.tsx`.
    - `src/App.test.tsx`, `src/main.test.tsx`.

**Target additions**:

- New **route** under `src/routes/task-dashboard/`:
  - `TaskDashboardPage.tsx` (or similar) acting as the entry for the dashboard.
  - `TaskDashboardPage.css` for route‑level layout.
- New **components** under `src/components/` (or `src/routes/task-dashboard/components/`):
  - React equivalents of:
    - `TaskDashboard` shell.
    - `NoteTakingPanel`.
    - `WorkingDirectoryBrowser`.
    - `TaskManagementPanel`.
    - `BullMQQueueView`.
  - Prefer composition and styling patterns consistent with existing `Dashboard` and `ConversationsPage`.
- New **API hooks & clients**:
  - Extend `src/api/tasks.ts` and `src/api/conversations.ts` (if needed) to support the features used in the dashboard.
  - Add a `src/api/files.ts` (for working directory file trees) and `src/api/queues.ts` (for BullMQ‑style queue status) if those APIs exist in `cursor-executor` backend.
  - Add TanStack Query hooks for tasks, files, and queues (mirroring `useConversationsQuery`).

---

### 4. Detailed Implementation Steps

#### 4.1. Backend Contract Survey (Read‑Only, No Changes Here)

- Identify the `cursor-executor` HTTP endpoints (or planned endpoints) that correspond to:
  - **Conversations & notes** (list/create/update, add message).
  - **Tasks** (list/filter, create/update, task details).
  - **Working directory files** (file tree for a given repo/path).
  - **Queues** (BullMQ or equivalent queue metrics).
- Map those endpoints to existing or new client modules in `cursor-executor-front/src/api/`.
- Record any gaps (endpoints that don't exist yet) as separate backend tasks; keep the frontend plan ready to plug into them.

#### 4.2. Design the New Route and Navigation

- Decide on the route path and navigation label (e.g. `/task-dashboard` in `App.tsx`).
- Update:
  - `src/App.tsx` to register the new route.
  - Any nav or layout components (if needed) to expose a link to the Task Dashboard.
- Ensure route‑level layout is responsive and matches the four‑panel layout from `TaskDashboard.css`.

#### 4.3. Create Task Dashboard Shell in `cursor-executor-front`

- Implement a `TaskDashboard`‑like shell component that:
  - Imports the four sub‑panels.
  - Holds `selectedNoteConversationId` in state.
  - Holds `fileBrowserRef` and `taskPanelRef` via `useRef`.
  - Implements `handleNoteConversationUpdate` to trigger refresh on file browser and task panel.
- Port or recreate the CSS grid layout from `TaskDashboard.css` using:
  - CSS modules or plain CSS in `TaskDashboardPage.css`.
  - Class names consistent enough to ease copying of styles, but adapted to the existing design system if needed.

#### 4.4. Implement NoteTakingPanel Using TanStack Query

- Create `NoteTakingPanel` component under `cursor-executor-front` that:
  - Uses TanStack Query to fetch conversation lists and messages.
  - Provides actions to create new conversations and append messages.
  - Exposes `onConversationSelect` and `onConversationUpdate` callbacks, mirroring the original interface.
- Wire it up to the same `conversation` types used by `ConversationsPage`.
- Implement loading, error, and empty states in a similar style to `ConversationsPage.tsx`.

#### 4.5. Implement WorkingDirectoryBrowser

- Implement `WorkingDirectoryBrowser` that:
  - Calls a file‑tree endpoint (e.g. `/api/working-directory/files`) via a new `src/api/files.ts` client.
  - Uses TanStack Query to cache file tree responses per repo/path.
  - Exposes a `refresh` method via `forwardRef` to align with the existing `TaskDashboard` contract (so `TaskDashboard` can call `fileBrowserRef.current.refresh()`).
- Implement supporting components:
  - File tree list items.
  - Icons or basic styling from `WorkingDirectoryBrowser.css`.

#### 4.6. Implement TaskManagementPanel

- Implement `TaskManagementPanel` in `cursor-executor-front`:
  - Leverage `src/api/tasks.ts` and `src/types/task.ts` for fetching tasks, updating status, and viewing details.
  - Use TanStack Query for:
    - Listing tasks (with filters for status/order).
    - Mutations for updating tasks (status, order, details).
  - Expose `refresh` via `forwardRef` to support the `handleNoteConversationUpdate` flow.
- Implement child components as needed:
  - `TaskList` and `TaskDetails` equivalents (or reuse patterns from existing `Task*` components in `jarek-va-ui`).

#### 4.7. Implement BullMQQueueView

- Implement `BullMQQueueView` in `cursor-executor-front`:
  - Add `src/api/queues.ts` (or similar) to fetch queue status from `cursor-executor`.
  - Implement a polling TanStack Query or `refetchInterval` to keep queue data up to date.
  - Render metrics (queue length, active jobs, failed jobs) in a layout similar to the existing `BullMQQueueView`.

#### 4.8. Glue Everything Together and Handle Cross‑Panel Interactions

- Verify that:
  - Selecting a note conversation updates `selectedNoteConversationId` and the `NoteTakingPanel`.
  - Updates in notes trigger `handleNoteConversationUpdate`, which:
    - Refreshes the file tree (e.g. reloads `WorkingDirectoryBrowser` data).
    - Refreshes the task list (e.g. re‑fetches tasks or updates a filtered view).
  - Queue view remains independent but can optionally display context related to the currently selected task or conversation.
- Handle initial loading and error boundaries for the entire dashboard:
  - If any critical panel fails to load, show a user‑friendly error region in that panel.

---

### 5. Testing Strategy

- **Unit/component tests**:
  - For each new component (`TaskDashboard`, `NoteTakingPanel`, `WorkingDirectoryBrowser`, `TaskManagementPanel`, `BullMQQueueView`), add tests under `src/.../__tests__/`.
  - Mirror patterns in:
    - `src/routes/conversations/ConversationsPage.test.tsx`.
    - Existing component tests in `python-cursor/jarek-va-ui/src/components/__tests__/`.
- **Hook/API tests**:
  - Extend `src/api/*.{test.ts}` and `src/hooks/*test.tsx` to cover new queries and mutations.
  - Include error and edge‑case scenarios (empty lists, network failure).
- **Integration tests**:
  - Add `TaskDashboardPage.test.tsx` that mounts the entire dashboard route using the TanStack Query provider and mocks for the API layer.
  - Test:
    - Layout presence (all four panels render).
    - Basic happy path interactions (select conversation → refresh file browser + tasks).
    - Failure modes (one panel failing while others still render).
- **Visual/regression testing** (optional):
  - Capture key snapshots (or use Playwright/Cypress) for the dashboard route to prevent major layout regressions.

---

### 6. Rollout & Parity Checklist

- **Functional parity**:
  - The new `cursor-executor-front` dashboard can:
    - Browse files as in the original `WorkingDirectoryBrowser`.
    - Manage notes & conversations as in `NoteTakingPanel`.
    - Manage tasks as in `TaskManagementPanel`.
    - Display queue status as in `BullMQQueueView`.
- **UX parity**:
  - Layout structure (four panels, relative sizes) matches the original closely enough that regular users feel at home.
  - Key keyboard/mouse interactions (clicks, selection, scrolling) behave the same.
- **Technical parity**:
  - All API calls are via typed clients and TanStack Query; no duplicate, ad‑hoc fetches.
  - Error and loading states are handled consistently with `ConversationsPage`.
- **Success criteria**:
  - All new tests pass in `cursor-executor-front`.
  - The dashboard route can be used in development seamlessly against the `cursor-executor` backend.
  - Team agrees that the new dashboard is functionally equivalent to the original `TaskDashboard` for the supported workflows.

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







