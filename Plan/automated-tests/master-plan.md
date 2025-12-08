## jarek-va-ui Automated Testing Master Plan

This document describes the current state of automated tests in `jarek-va-ui`, the gaps, and a concrete roadmap to bring the test suite up to modern standards.

---

## 1. Current Testing Stack & Conventions

- **Test framework**: Vitest (`vitest`, `vitest --watch`, `vitest --ui`, `vitest --coverage`)
- **Test environment**: jsdom (React Testing Library)
- **Libraries**:
  - `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
- **Structure** (from `src/test/README.md` and file layout):
  - **App-level tests**: `src/__tests__`
  - **Component tests**: `src/components/__tests__`, `src/components/layout/__tests__`
  - **API client tests**: `src/api/__tests__`
  - **Service tests**: `src/services/__tests__`
  - **Utility tests**: `src/utils/__tests__`
- **Current strengths**:
  - Good coverage of core conversation views and ElevenLabs features.
  - App routing, feature flag gating/rollout, and security behaviors already under test.
  - Shared test setup and utilities in `src/test` encouraging consistent patterns.

---

## 2. Existing Automated Tests (High-Level Inventory)

### 2.1 App & Cross-Cutting

- `src/__tests__/App.test.tsx` – app shell and routing basics.
- `src/__tests__/routing.test.tsx` – routing behavior.
- `src/__tests__/feature-flag-gating.test.tsx` – feature flag–driven gating.
- `src/__tests__/feature-flag-rollout.test.ts` – rollout logic.
- `src/__tests__/security.test.ts` – security-related checks.

### 2.2 Components (with tests)

From `src/components/__tests__/` and `src/components/layout/__tests__/`:

- `AgentChatPanel`
- `AgentConversationDetails`
- `ConversationDetails`
- `ConversationFilters`
- `ConversationHeader`
- `ConversationList`
- `ConversationListItem`
- `Dashboard`
- `ErrorMessage`
- `LoadingSpinner`
- `MessageItem`
- `MessageList`
- `NoteTakingPanel`
- `RepositoryFileBrowser`
- `VoiceIndicator`
- `layout/Layout`

### 2.3 API Clients (with tests)

- `src/api/__tests__/agent-conversations.test.ts`
- `src/api/__tests__/conversations.test.ts`
- `src/api/__tests__/elevenlabs.test.ts`
- `src/api/__tests__/elevenlabs-session-ttl.test.ts`

### 2.4 Services (with tests)

- `src/services/__tests__/elevenlabs-voice.test.ts`

### 2.5 Utilities (with tests)

- `src/utils/__tests__/feature-flags.test.ts`
- `src/utils/__tests__/retry.test.ts`

---

## 3. Missing or Weak Coverage (What’s Not Tested Yet)

### 3.1 React Components Without Direct Tests

The following components currently have **no dedicated test files** and need coverage:

- **Navigation / Layout flows**
  - `src/components/Navigation.tsx`
  - `src/components/ConversationListView.tsx`
  - `src/components/ConversationDetailView.tsx`
  - `src/components/AgentConversationList.tsx`
  - `src/components/AgentConversationListView.tsx`
  - `src/components/AgentConversationDetailView.tsx`
  - `src/components/AgentConfigView.tsx`
- **Task & dashboard experience**
  - `src/components/TaskDashboard.tsx`
  - `src/components/TaskManagementPanel.tsx`
  - `src/components/TaskList.tsx`
  - `src/components/TaskListView.tsx`
  - `src/components/TaskDetails.tsx`
  - `src/components/TaskDetailView.tsx`
- **File system / queues**
  - `src/components/BullMQQueueView.tsx`
  - `src/components/WorkingDirectoryBrowser.tsx`

Key missing scenarios for these components (to be exercised via **unit and integration tests**):

- **Navigation & routing**
  - Navigation highlighting and link visibility driven by `isElevenLabsEnabled`.
  - Active state logic for `/`, `/dashboard`, `/agent-conversations`, `/agent-config`, `/tasks`, `/task-dashboard`.
  - Routing integration between list and detail views (conversations, agent conversations, tasks).
- **Conversation list/detail flows**
  - `ConversationListView`:
    - Successful load of conversations via `listConversations`.
    - Network/404/500 error mapping to friendly messages and retry button.
    - New conversation creation (`createConversation`) with dashboard vs standalone behavior (`onNewConversation` vs navigation).
    - Active conversation highlighting derived from URL.
  - `ConversationDetailView`:
    - Fetching conversation via `getConversationById`.
    - Error and “not found” states.
- **Agent conversations & filters**
  - `AgentConversationList`:
    - URL and prop-based active row highlighting.
    - Behavior when `onConversationSelect` is provided (dashboard mode vs navigation).
  - `AgentConversationListView`:
    - Pagination (page, pageSize, totalCount) and disabled state of prev/next buttons.
    - Filters (agent ID, free-text search across ID/agentId/messages) and their effect on counts.
    - Sort options (`created`, `lastAccessed`, `messageCount`) mapping to backend sort fields.
    - Error handling and retry behavior for `listAgentConversations`.
    - New conversation creation (`createAgentConversation`) and list refresh.
  - `AgentConversationDetailView`:
    - Initial fetch via `getAgentConversation`.
    - Polling behavior: periodic refresh, only updating when messages actually change, cleanup on unmount.
    - Manual refresh state and errors.
- **Agent dashboard, voice, and note-taking**
  - `Dashboard`:
    - Disabled state UI when `isElevenLabsEnabled` is `false` (including environment variable messaging).
    - Successful wiring of `VoiceIndicator`, `AgentChatPanel`, `NoteTakingPanel`, and `WorkingDirectoryBrowser`.
    - Voice service lifecycle:
      - `ElevenLabsVoiceService` initialization and cleanup (`endVoiceSession`).
      - `onStatusChange` / `onModeChange` / `onError` handlers updating UI.
      - Validation errors when agent ID or conversation ID is missing on connect.
      - Happy-path `startVoiceSession` and `endVoiceSession` interactions.
    - Agent configuration loading via `getAgentConfig` and env fallback for `VITE_ELEVENLABS_AGENT_ID`.
  - `NoteTakingPanel`:
    - Switching between list and detail modes; back navigation.
    - Fetching conversation via `getConversationById`.
    - Emitting `onConversationSelect` and `onConversationUpdate` (including repository extraction from metadata).
  - `AgentChatPanel`:
    - Switching between list and detail modes; back navigation.
    - Fetching agent conversation via `getAgentConversation`.
    - Passing voice-related props (`voiceService`, `voiceStatus`, `voiceMode`) into `AgentConversationDetails`.
- **Task list/detail/dashboard flows**
  - `TaskList`:
    - Task grouping by `status_label` and sort order within groups.
    - URL and prop-based active task highlighting.
    - Correct rendering of status badges and counts (black box: verify labels/colors, not internal styles).
  - `TaskListView`:
    - Fetching tasks via `listTasks`, error and empty states, and active task derived from URL.
  - `TaskDetailView`:
    - Parsing of `taskId` param including invalid ID handling.
    - Fetching task via `getTaskById` with error and “Task not found” states.
  - `TaskManagementPanel`:
    - Mount behavior calling `listTasks` once.
    - Manual refresh button behavior and exposed `refresh()` ref method.
    - Loading, error, empty, and populated list states (delegating to `TaskList`).
  - `TaskDashboard`:
    - Rendering of `WorkingDirectoryBrowser`, `NoteTakingPanel`, `TaskManagementPanel`, and `BullMQQueueView`.
    - `handleNoteConversationUpdate` invoking both child `refresh()` methods (via refs).
- **File system & queues**
  - `WorkingDirectoryBrowser`:
    - Initial load via `getWorkingDirectoryFiles`.
    - First-level directory expansion initialization.
    - Expand/collapse interactions via click and keyboard (Enter/Space).
    - Error, empty, and non-empty tree states.
    - `refresh()` ref method delegating to `loadFiles`.
  - `BullMQQueueView`:
    - Initial load via `listQueues`, polling behavior, and teardown.
    - Error and empty states.
    - Rendering of queue stats and agents, including status color thresholds (treated as black-box visual expectations).

### 3.2 API Clients Without Tests

The following modules have **no tests** today:

- `src/api/queues.ts`
  - `listQueues`, `getQueueInfo`:
    - Handling non-JSON content-type.
    - Handling `404` vs other `4xx/5xx` failures.
    - Valid parsing of queue counts and agent lists.
- `src/api/repositories.ts`
  - `getWorkingDirectoryFiles`, `getRepositoryFiles`:
    - Correct API base path usage (`getApiBasePath` vs fixed paths).
    - JSON content-type validation and error messaging.
    - Handling 404 (missing working directory/repository).
- `src/api/tasks.ts`
  - `fetchTasks`, `listTasks`, `fetchTask`, `getTaskById`, `createTask`:
    - Query-string construction for filters, sorting, and pagination.
    - Legacy array-only responses vs structured `{ tasks, pagination }`.
    - Error handling for non-JSON responses.
    - Handling 404 (`Task not found`) and other server errors.
    - Logging behavior is not critical to test, but major error branches should be exercised.

### 3.3 Utilities Without Tests

- `src/utils/api-base.ts`
  - `getApiBasePath()`:
    - Behavior in **Node/test environment** (no `window`).
    - `pathname` under `/conversations` vs root, and resulting `/conversations/api` vs `/api` base path.
  - Current behavior is simple but critical for production vs local routing correctness.

### 3.4 App Shell & Bootstrapping Gaps

- `src/main.tsx`:
  - `detectBasename()` behavior is currently untested:
    - When `window` is undefined (SSR/test env) should return `'/'`.
    - When URL is exactly `/conversations` or nested under `/conversations/...`.
    - When at other paths (should fall back to `'/'`).
  - Impact on `BrowserRouter` basename configuration is not explicitly tested.

### 3.5 Integration-Level Scenarios Missing

Today’s tests are mostly **unit-level** (per component or per API client). The following cross-cutting flows are under-tested:

- **Navigation + feature flags**:
  - Full nav behavior with `isElevenLabsEnabled` on/off.
  - Active link states across routes (`/`, `/dashboard`, `/agent-conversations`, `/agent-config`, `/tasks`, `/task-dashboard`).
- **Task dashboard integrated behavior**:
  - `TaskDashboard` orchestrating:
    - Note selection changing `selectedNoteConversationId`.
    - `NoteTakingPanel` triggering `onConversationUpdate` → causing refresh in `WorkingDirectoryBrowser` and `TaskManagementPanel` via refs.
  - Integration with `tasks` and `repositories` API clients (stubbed/mocked).
- **Task flows**:
  - From `TaskListView` to `TaskDetailView` via react-router navigation.
  - Correct UI states for loading, error, empty, and populated task lists.
- **Working directory & repository browser flows**:
  - Integration between `WorkingDirectoryBrowser` and `getWorkingDirectoryFiles`.
  - Resilience to partial/empty file trees.

Additional **black-box style integration scenarios** to cover:

- Conversation flows viewed as user journeys (without caring about internal implementation):
  - “Load note history → create new note → see it appear in the list → open its details → edit/refresh and see updates propagate.”
  - “Filter/search agent conversations, paginate, and open details, including live updates and manual refresh.”
- Voice-agent flows:
  - Connecting and disconnecting the voice agent with different preconditions (no agent ID, no conversation, backend errors).
  - Observing VoiceIndicator states and error banners purely from the user’s perspective.
- Error resilience:
  - Simulated backend failures for conversations, agent conversations, tasks, queues, and repositories across multiple screens, verifying that user-visible messages and retry paths are correct.

### 3.6 End-to-End (E2E) & Non-Functional Testing Gaps

- **E2E tests**:
  - No Cypress/Playwright tests checking full browser flows:
    - Loading conversation list, opening conversation detail.
    - Agent conversation navigation when ElevenLabs features are enabled.
    - Task dashboard interactions (viewing tasks, refreshing, viewing the working directory tree).
- **Accessibility (a11y) tests**:
  - No automated checks (e.g. `jest-axe` or Playwright a11y checks) to validate ARIA attributes, focus order, labels, etc.
- **Visual regression tests**:
  - No screenshot-based regressions for critical pages like dashboards and list/detail views.
- **Performance/regression smoke tests**:
  - No automated smoke flows that can be run in CI to validate that core routes still function (beyond unit tests).

---

## 4. Target Testing Strategy & Standards

### 4.1 Test Types & Goals

- **Unit tests**:
  - High coverage for individual components, API clients, and utilities.
  - Focus on behavior and user-observable outcomes, not implementation details.
- **Integration tests**:
  - Test the composition of components and API clients in realistic flows (e.g. `TaskDashboard`, navigation + feature flags).
- **End-to-end tests**:
  - Validate the most important user journeys in a real browser (or headless) environment.
- **Non-functional tests**:
  - Accessibility checks (WCAG-focused).
  - Optional visual regression on key screens.

Additionally recommended:

- **Black-box / scenario tests**:
  - Treat the UI as a black box (driven by user interactions) focusing on end-to-end behavior and domain flows, both at the integration and browser levels.
- **Contract tests** (UI ↔ backend):
  - Where possible, validate that UI expectations for responses from `/api`, `/conversations/api`, `/agents`, and `/repositories/api` align with backend contracts (e.g. via MSW fixtures that mirror backend schemas).
- **Negative / robustness tests**:
  - Explicit tests for malformed IDs, missing query parameters, non-JSON responses, and transient network issues.

### 4.2 Tools & Conventions

- **Keep** Vitest + React Testing Library as the core stack.
- **Add/standardize**:
  - MSW (Mock Service Worker) or equivalent for network mocking in unit/integration tests.
  - Optionally `jest-axe` (or similar) for a11y checks in component tests.
  - Optionally `eslint-plugin-testing-library` and `eslint-plugin-jest-dom` for linting test best practices.
- **Testing conventions**:
  - Prefer `screen.getByRole` / semantic queries over `getByTestId` where possible.
  - Use `user-event` for realistic interactions.
  - Minimize snapshot testing; favor explicit assertions on rendered text/roles.
  - Co-locate tests under `__tests__` directories as done today.
  - When writing black-box tests, avoid asserting on internal implementation details (state fields, private helpers); focus on DOM and network behavior only.

### 4.3 Coverage & Quality Targets

- **Coverage thresholds** (enforced via `vitest.config.ts` and `npm run test:coverage`):
  - Global: **≥ 80%** statements/branches/functions/lines.
  - Core domains (conversations, tasks, dashboards): **≥ 90%**.
- **CI requirements**:
  - All PRs must pass:
    - `npm test` (or `npm run test:coverage` with thresholds).
    - Lint (`npm run lint`).
  - E2E suite can run on main + nightly if runtime is high.

---

## 5. Roadmap / Phased Implementation Plan

### Phase 1 – Foundations & Infrastructure

- **P1.1 – Validate & extend Vitest/RTL setup**
  - Keep existing `src/test/setup.ts` and `src/test/test-utils.tsx`.
  - Ensure global setup includes `@testing-library/jest-dom`.
- **P1.2 – Introduce network mocking**
  - Add MSW (or similar) to mock:
    - `/api/*` and `/conversations/api/*` endpoints (`getApiBasePath`).
    - `/agents/queues` and `/repositories/api/*`.
  - Provide reusable mock handlers for conversations, tasks, queues, repositories.
- **P1.3 – Configure coverage thresholds**
  - Update `vitest.config.ts` to enforce global and per-directory thresholds.
  - Wire `npm run test:coverage` into CI as a required check.

### Phase 2 – Complete Unit Coverage for Untested Modules

#### Phase 2A – Components

Add new tests under `src/components/__tests__/` for:

- **Navigation & list/detail views**
  - `Navigation`:
    - Renders correct links with ElevenLabs enabled/disabled.
    - Active link state across all primary routes.
  - `ConversationListView`, `ConversationDetailView`:
    - Integration with router parameters and underlying components.
  - `AgentConversationList`, `AgentConversationListView`, `AgentConversationDetailView`, `AgentConfigView`:
    - Correct behavior with/without ElevenLabs feature flag.
    - Loading/error/empty states if applicable.
- **Tasks & dashboards**
  - `TaskDashboard`:
    - Renders all four panels (file viewer, note-taking, task management, queue view).
    - `onConversationUpdate` triggers `refresh()` on both `WorkingDirectoryBrowser` and `TaskManagementPanel` via refs (mocked).
  - `TaskManagementPanel`:
    - Calls `listTasks` on mount and on refresh button click.
    - Handles loading, error, empty, and populated states correctly.
  - `TaskList`, `TaskListView`:
    - Renders tasks list, highlights active task, supports navigation to detail.
  - `TaskDetails`, `TaskDetailView`:
    - Fetches and renders task details; handles error/404 states.
- **File system & queues**
  - `WorkingDirectoryBrowser`:
    - Initial render (loading state, then file tree).
    - Initial expansion of top-level directories.
    - Expand/collapse behavior (click and keyboard).
    - Error and empty states.
  - `BullMQQueueView`:
    - Successful queue load, different queue statuses.
    - Error and empty cases.

#### Phase 2B – API Clients

Add tests under `src/api/__tests__/` for:

- `queues.ts`:
  - `listQueues` and `getQueueInfo` success cases.
  - Non-JSON responses (content-type mismatch).
  - `404` and generic `4xx/5xx` errors with appropriate error messages.
- `repositories.ts`:
  - `getWorkingDirectoryFiles`:
    - Success, 404, non-JSON.
  - `getRepositoryFiles`:
    - Success, 404 (`Repository 'x' not found`), non-JSON.
- `tasks.ts`:
  - `fetchTasks`:
    - No params, simple list.
    - With pagination, status, status_label, conversation_id, sortBy, sortOrder.
    - Legacy array-only response vs structured `{ tasks, pagination }`.
  - `listTasks`:
    - Logs are not asserted, but behavior on success / non-JSON / error.
  - `fetchTask` / `getTaskById`:
    - Success, 404 (`Task not found`), and generic failure.
  - `createTask`:
    - Successful creation.
    - Error path with server-provided error payload.

#### Phase 2C – Utilities & Bootstrapping

Add tests under `src/utils/__tests__/` and `src/__tests__/` for:

- `getApiBasePath` (`api-base.ts`):
  - `window` undefined → `/api`.
  - Path under `/conversations` → `/conversations/api`.
  - Other paths → `/api`.
- `detectBasename` (from `main.tsx`):
  - Extract logic into a small exported helper (if needed) and test:
    - No `window` → `'/'`.
    - `pathname === '/conversations'` or starts with `/conversations/` → basename `/conversations`.
    - Other paths → `'/'`.

### Phase 3 – Integration Tests for Critical Flows

Add higher-level integration tests (still using Vitest + RTL) that compose multiple components and APIs:

- **I3.1 – Navigation + Feature Flags**
  - Render `App` with router and mock `isElevenLabsEnabled` on/off.
  - Assert which routes are accessible and which links appear in `Navigation`.
  - Verify active link states when navigating across routes.
- **I3.2 – Task Dashboard Flow**
  - Render `TaskDashboard` with mocked API clients:
    - `getWorkingDirectoryFiles`, `listTasks`, queue API.
  - Simulate note updates in `NoteTakingPanel` and verify:
    - `WorkingDirectoryBrowser.refresh` and `TaskManagementPanel.refresh` are called.
  - Validate combined loading/error states across panels.
- **I3.3 – Task List → Detail Flow**
  - Use `MemoryRouter` to simulate navigation from `/tasks` to `/task/:id`.
  - Ensure correct task is fetched and displayed, including error/404 cases.
- **I3.4 – Working Directory Tree Behavior**
  - Use realistic nested file tree fixtures.
  - Validate expand/collapse behavior and aria roles/keyboard control.
- **I3.5 – Conversation & Agent Conversation Black-Box Flows**
  - For note-taking:
    - Render `ConversationListView` and `ConversationDetailView` with mocked APIs.
    - Drive flows: load list, create conversation, navigate to detail, update conversation, verify updates and error handling.
  - For agent conversations:
    - Render `AgentConversationListView` and `AgentConversationDetailView` (with polling disabled or controlled via fake timers).
    - Drive flows: paginate, filter, search, open details, trigger manual refresh, and observe live-update indicators.
- **I3.6 – Voice Dashboard Flow**
  - Render `Dashboard` with a mocked `ElevenLabsVoiceService`.
  - Drive the connect/disconnect controls, simulate service callbacks (`onStatusChange`, `onModeChange`, `onError`), and verify that the UI responds as expected, without asserting on internal service state.

### Phase 4 – E2E, Accessibility, and Regression Testing

- **E4.1 – E2E Framework Setup**
  - Choose **Playwright** (recommended) or **Cypress**.
  - Add basic config and scripts (e.g. `npm run e2e`).
  - Ensure app can be started in a known port/environment for tests.
- **E4.2 – Critical User Journeys**
  - Conversation flows:
    - Load conversation list and open a conversation detail.
    - Navigate back and forth using the UI.
  - Agent conversation flows (when ElevenLabs is enabled):
    - Navigate from dashboard/landing to agent conversations and details.
  - Task dashboard:
    - Visit `/task-dashboard`, ensure four panels render.
    - Trigger a task refresh and verify updated data.
  - Working directory:
    - Expand directories, ensure file tree displays correctly.
  - Agent voice flows (happy-path only at first):
    - With ElevenLabs enabled and a configured agent, select a conversation and connect/disconnect from the voice agent, verifying visible status and error messages.
- **E4.3 – Accessibility Checks**
  - Add a11y assertions (e.g. `jest-axe` in unit tests or Playwright’s `page.accessibility.snapshot()`).
  - Focus on:
    - Nav links, buttons, headings, and ARIA attributes.
    - Keyboard navigation (tab order, focus visible).
- **E4.4 – Visual Regression (Optional)**
  - Introduce screenshot comparisons for:
    - Conversation list & detail.
    - Task list & detail.
    - Task dashboard.
  - Run visual checks on main branch and selected PRs.

- **E4.5 – Black-Box Negative Journeys**
  - Simulate backends being down or returning invalid responses during core flows (conversations, agents, tasks, queues, repositories).
  - Verify that the user experience remains understandable: meaningful error messages, retry actions, and no broken layouts or uncaught errors in the console.

---

## 6. Definition of Done & Ongoing Maintenance

- **Coverage**:
  - Global coverage consistently ≥ 80%, key domains ≥ 90%.
- **Breadth**:
  - Every non-trivial component, API client, and utility listed in Section 3 has at least one meaningful test file.
- **Depth**:
  - Integration tests exist for:
    - Navigation + feature flags.
    - Task dashboard orchestration.
    - Task list/detail flows.
    - Working directory behavior.
- **E2E & a11y**:
  - At least one end-to-end spec per major user journey.
  - Automated a11y checks on core pages.
- **Process**:
  - Tests and coverage run in CI for every PR.
  - New features are required to include tests (unit + integration/E2E as appropriate).

This plan should be implemented iteratively, starting with Phase 2 unit coverage for untested modules, then layering in integration and E2E coverage as the foundation stabilizes.


