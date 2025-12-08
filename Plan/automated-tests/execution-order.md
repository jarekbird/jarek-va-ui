## jarek-va-ui Automated Tests – Execution Order

Granular execution steps for implementing the `master-plan.md` in a safe, iterative way. Each step should be done in its own small change set with tests.

---

## 1. Baseline & Environment Setup

**Prerequisites:** none. This section must be completed before any other steps.

1. **Confirm local setup**
   1. Install dependencies: `npm install`.
   2. Run type-check: `npm run type-check` and fix any blocking issues.
   3. Run existing tests: `npm test` and ensure the current suite is green.
2. **Review existing test utilities**
   1. Open `src/test/setup.ts` and verify that:
      - `@testing-library/jest-dom` is imported and configured.
      - The jsdom environment is being used.
   2. Open `src/test/test-utils.tsx` and confirm:
      - Custom `render` wraps components in React Router and any needed providers.
      - Helper exports (`render`, `screen`, etc.) are used in current tests.
   3. If anything is missing (e.g., `jest-dom` setup), add it and re-run `npm test`.

---

## 2. Testing Infrastructure Enhancements (Phase 1)

**Prerequisites:** complete all steps in Section 1.

3. **Introduce MSW (Mock Service Worker) for network mocking**
   1. Add MSW as a dev dependency.
   2. Create `src/test/mocks/handlers.ts` with handlers for:
      - `/api/conversations`, `/api/conversations/:id`.
      - `/api/agent-conversations`, `/api/agent-conversations/:id`.
      - `/api/tasks`, `/api/tasks/:id`.
      - `/agents/queues`, `/agents/queues/:name`.
      - `/repositories/api/:repository/files`.
      - `getApiBasePath`-based endpoints (e.g., `/conversations/api/*`).
   3. Create `src/test/mocks/server.ts` configuring an MSW server with the handlers.
   4. Wire MSW into `src/test/setup.ts`:
      - Start server before all tests.
      - Reset handlers between tests.
      - Close server after all tests.
   5. Run a subset of existing tests to verify MSW doesn’t break anything.
4. **Configure and enforce coverage thresholds**
   1. Open `vitest.config.ts`.
   2. Add or update coverage configuration:
      - Global thresholds ≥ 80% for statements/branches/functions/lines.
      - Optionally set higher thresholds (≥ 90%) for `src/components`, `src/api`, and `src/services`.
   3. Add `npm run test:coverage` to CI configuration (or verify it is present).
   4. Run `npm run test:coverage` locally and note current coverage baseline.

---

## 3. Unit Tests for Untested Components (Phase 2A)

**Prerequisites:** complete all steps in Sections 1–2 (baseline, MSW, coverage setup).

### 3.1 Navigation & Routing Components

5. **Add tests for `Navigation`**
   1. Create `src/components/__tests__/Navigation.test.tsx`.
   2. Write tests that:
      - Render inside a `MemoryRouter` with different initial routes.
      - Mock `isElevenLabsEnabled` to `true` and `false`.
      - Assert correct links appear/disappear based on feature flag.
      - Assert correct `active` class on the current route link.
6. **Add tests for `ConversationListView`**
   1. In `Navigation.test.tsx` or a new file, ensure Navigation-related behavior is covered.
   2. Create `src/components/__tests__/ConversationListView.test.tsx`.
   3. Test scenarios:
      - Successful load: MSW returns a list of conversations, list is rendered, active conversation derived from URL is highlighted.
      - Error handling: MSW returns network/404/500 errors, user sees friendly message and working “Retry” button.
      - New conversation creation:
        - Standalone mode (no `onNewConversation`): clicking “+ New Note” calls `createConversation`, navigates to `/conversation/:id`, and reloads list.
        - Dashboard mode (`onNewConversation` prop): clicking “+ New Note” calls callback instead of navigation, and reloads list.
      - Loading and empty states.
7. **Add tests for `ConversationDetailView`**
   1. Create `src/components/__tests__/ConversationDetailView.test.tsx`.
   2. Test scenarios:
      - Valid `conversationId` param: MSW returns conversation, `ConversationDetails` renders.
      - Backend error: shows error message.
      - Conversation not found: shows “Note session not found.” message.
      - Back link navigates to `/`.

### 3.2 Agent Conversation Components

8. **Add tests for `AgentConversationList`**
   1. Create `src/components/__tests__/AgentConversationList.test.tsx`.
   2. Test scenarios:
      - Renders sorted conversations (most recent `createdAt` first).
      - Active row is determined by:
        - `activeConversationId` prop, and
        - current URL (`/agent-conversation/:id`) when prop is not set.
      - When `onConversationSelect` is provided:
        - Clicking an item calls `onConversationSelect` and `onSelectConversation`.
        - The link does not navigate (uses `#` href and `preventDefault`).
      - When `onConversationSelect` is not provided:
        - Clicking navigates to `/agent-conversation/:id`.
9. **Add tests for `AgentConversationListView`**
   1. Create `src/components/__tests__/AgentConversationListView.test.tsx`.
   2. Test scenarios:
      - Initial load: calls `listAgentConversations` with default `limit`, `offset`, sortBy/Order mapping, and renders conversations.
      - Pagination:
        - “Next”/“Previous” buttons enable/disable based on `page` and totalCount.
        - Changing pages triggers new API calls.
      - Filters:
        - Agent dropdown filters by `agentId`.
        - Search input filters by conversation ID, agent ID, and message content.
        - “Clear Filters” resets to full list.
      - Sort selection:
        - Changing sort option updates `backendSortBy` mapping and triggers reload.
      - New conversation creation:
        - Clicking “+ New Agent Conversation” calls `createAgentConversation`, navigates to detail view, then reloads the list.
      - Error and empty states.
10. **Add tests for `AgentConversationDetailView`**
    1. Create `src/components/__tests__/AgentConversationDetailView.test.tsx`.
    2. Use fake timers to control polling.
    3. Test scenarios:
       - Valid `conversationId`: detail view shows data from `getAgentConversation`.
       - Polling:
         - After initial load, a poll interval is scheduled.
         - When new messages arrive (different from current), conversation updates.
         - Polling stops on unmount.
       - Manual refresh:
         - Clicking “Refresh” triggers `getAgentConversation` and updates the view.
         - Error during refresh shows error message.
       - Back link navigates to `/agent-conversations`.
11. **Add tests for `AgentConfigView`**
    1. Create `src/components/__tests__/AgentConfigView.test.tsx`.
    2. Test scenarios:
       - Successful config and health loads from `/config` and `/config/health`.
       - Error during config load: show error message.
       - Health load failure: logs warning but does not block UI.
       - “Refresh” button re-fetches both config and health, with loading state.
       - Status color/icon logic is correct for each health status.

### 3.3 Task & Dashboard Components

12. **Add tests for `TaskList`**
    1. Create `src/components/__tests__/TaskList.test.tsx`.
    2. Test scenarios:
       - Tasks are grouped by `status_label` into the expected order: `ready`, `backlogged`, `complete`, `archived`.
       - Tasks are sorted by `order` then `id` within each group.
       - Active task is derived from:
         - `activeTaskId` prop.
         - URL `/tasks/:id` when prop is `null`.
       - Each task row calls `onSelectTask` when clicked.
       - Status badges and counts render clearly (assert on labels/colors).
13. **Add tests for `TaskListView`**
    1. Create `src/components/__tests__/TaskListView.test.tsx`.
    2. Test scenarios:
       - On mount, calls `listTasks` and renders tasks via `TaskList`.
       - On error, shows error message.
       - On empty list, shows “No tasks” message.
       - `activeTaskId` derives from URL.
14. **Add tests for `TaskDetailView`**
    1. Create `src/components/__tests__/TaskDetailView.test.tsx`.
    2. Test scenarios:
       - Valid numeric `taskId`: calls `getTaskById` and renders `TaskDetails`.
       - Invalid `taskId` (`NaN`): sets an “Invalid task ID” error.
       - `404` from backend: shows “Task not found.”.
       - Other errors: show generic error message.
       - Back link navigates to `/tasks`.
15. **Add tests for `TaskDetails`**
    1. Create `src/components/__tests__/TaskDetails.test.tsx`.
    2. Treat as a presentational component:
       - Render typical `Task` props and assert key fields/labels (status, title, timestamps, etc.).
       - Handle `task` being `null` or partial gracefully, if applicable.
16. **Add tests for `TaskManagementPanel`**
    1. Create `src/components/__tests__/TaskManagementPanel.test.tsx`.
    2. Test scenarios:
       - On mount, calls `listTasks` exactly once.
       - “Refresh” button calls `listTasks` again and updates UI.
       - Loading, error, empty, and populated states behave as expected.
       - `refresh()` via ref calls `listTasks`.
17. **Add tests for `TaskDashboard`**
    1. Create `src/components/__tests__/TaskDashboard.test.tsx`.
    2. Mock `WorkingDirectoryBrowser` and `TaskManagementPanel` to expose mock `refresh` functions.
    3. Test scenarios:
       - Renders four panels: file viewer, note-taking, task management, queue view.
       - When `NoteTakingPanel` fires `onConversationUpdate`, both `WorkingDirectoryBrowser.refresh` and `TaskManagementPanel.refresh` are called.

### 3.4 File System & Queue Components

18. **Add tests for `WorkingDirectoryBrowser`**
    1. Create `src/components/__tests__/WorkingDirectoryBrowser.test.tsx`.
    2. Test scenarios:
       - On mount, calls `getWorkingDirectoryFiles` and shows loading then tree.
       - When the file tree has directories, top-level directories are initially expanded.
       - Clicking a directory row toggles expansion.
       - Pressing Enter/Space while focused toggles expansion.
       - Error state: non-JSON or error response shows error message.
       - Empty state: “No files found” when the list is empty.
       - `refresh()` via ref re-fetches the tree.
19. **Add tests for `BullMQQueueView`**
    1. Create `src/components/__tests__/BullMQQueueView.test.tsx`.
    2. Use fake timers to control the 5s refresh interval.
    3. Test scenarios:
       - Initial load: calls `listQueues` and renders queue cards.
       - Refresh button manually re-calls `listQueues`.
       - Polling: interval re-fetches queues; interval is cleared on unmount.
       - Error and empty list states show correct messages.
       - Status colors for waiting/active/failed counts follow the thresholds.

---

## 4. Unit Tests for Untested API Clients (Phase 2B)

**Prerequisites:** complete all steps in Sections 1–2 (baseline, MSW, coverage setup).

20. **Add tests for `src/api/queues.ts`**
    1. Create `src/api/__tests__/queues.test.ts`.
    2. Test `listQueues`:
       - Success with JSON content-type and valid data.
       - Non-JSON response (wrong content-type) throws with message including content-type.
       - `4xx/5xx` responses return error with server-provided error message or status text.
    3. Test `getQueueInfo` similarly, including `404` → “Queue not found”.
21. **Add tests for `src/api/repositories.ts`**
    1. Create `src/api/__tests__/repositories.test.ts`.
    2. Test `getWorkingDirectoryFiles`:
       - Success, 404 (working directory not found), non-JSON.
    3. Test `getRepositoryFiles`:
       - Success, 404 (repository not found) with correct error message, non-JSON.
22. **Add tests for `src/api/tasks.ts`**
    1. Create `src/api/__tests__/tasks.test.ts`.
    2. Test `fetchTasks`:
       - Without params, returns tasks list.
       - With pagination/filters/sorting, constructs correct query string and parses structured `{ tasks, pagination }`.
       - When backend returns array only, wraps in `{ tasks, pagination? }` correctly.
       - Non-JSON and error responses are handled with clear error messages.
    3. Test `listTasks`:
       - Successful JSON array response returns tasks array.
       - Non-JSON response logs error and throws (assert on thrown error, not logs).
       - Error responses with JSON error payload propagate message.
    4. Test `getTaskById` / `fetchTask`:
       - Success, 404 → “Task not found”, other errors with status text.
    5. Test `createTask`:
       - Successful JSON response returns created task.
       - Error responses (JSON and non-JSON) produce meaningful errors.

---

## 5. Unit Tests for Utilities & Bootstrapping (Phase 2C)

**Prerequisites:** complete all steps in Sections 1–2 (baseline, MSW, coverage setup).

23. **Add tests for `getApiBasePath`**
    1. Create `src/utils/__tests__/api-base.test.ts`.
    2. Test scenarios:
       - When `window` is undefined (node/test), returns `/api`.
       - When pathname is exactly `/conversations`, returns `/conversations/api`.
       - When pathname starts with `/conversations/`, returns `/conversations/api`.
       - Otherwise, returns `/api`.
24. **Add tests for `detectBasename`**
    1. Refactor `src/main.tsx`:
       - Extract `detectBasename` into a separate exported helper function (pure, no React).
    2. Create `src/__tests__/basename.test.ts`.
    3. Test scenarios:
       - No `window` → `'/'`.
       - Path `/conversations` or `/conversations/...` → `/conversations`.
       - Other paths → `'/'`.

---

## 6. Integration Tests for Critical Flows (Phase 3)

**Prerequisites:** complete all steps in Sections 1–5 (baseline, infra, and unit tests for components, APIs, and utilities).

25. **Add integration tests for navigation + feature flags (`I3.1`)**
    1. Create `src/__tests__/navigation-integration.test.tsx`.
    2. Render `App` inside `MemoryRouter`, mocking `isElevenLabsEnabled` as `true` and `false`.
    3. Navigate across routes and:
       - Assert which nav links appear.
       - Assert which routes are accessible or hidden when ElevenLabs is disabled.
       - Verify active link state as the route changes.
26. **Add integration tests for task dashboard flow (`I3.2`)**
    1. Create `src/__tests__/task-dashboard-integration.test.tsx`.
    2. Render `TaskDashboard` with:
       - MSW handlers returning realistic task, file tree, and queue data.
       - Spies/mocks on `WorkingDirectoryBrowser.refresh` and `TaskManagementPanel.refresh`.
    3. Simulate:
       - Note selection and updates in `NoteTakingPanel`.
       - Verify both `refresh` methods are invoked.
       - Combined loading/error states for panels.
27. **Add integration tests for task list → detail (`I3.3`)**
    1. Create `src/__tests__/tasks-flow-integration.test.tsx`.
    2. Use `MemoryRouter` starting at `/tasks`.
    3. Simulate:
       - Clicking on a task in `TaskList` to navigate to `/task/:id`.
       - MSW returning detail data for that task.
       - Error/404 variants.
28. **Add integration tests for working directory tree (`I3.4`)**
    1. Create `src/__tests__/working-directory-integration.test.tsx`.
    2. Use MSW to return nested file trees.
    3. Assert:
       - Directories are expanded as expected.
       - Expand/collapse behavior across multiple levels.
       - Keyboard navigation works across nested tree nodes.
29. **Add integration tests for conversation flows (`I3.5`, note-taking)**
    1. Create `src/__tests__/note-flows-integration.test.tsx`.
    2. Use MSW to:
       - Return initial conversations list.
       - Handle `createConversation` and `getConversationById`.
    3. Simulate full flow:
       - Load list, create new conversation, navigate to detail, update conversation, verify UI updates and error paths.
30. **Add integration tests for agent conversation flows (`I3.5`, agents)**
    1. Create `src/__tests__/agent-flows-integration.test.tsx`.
    2. Use fake timers to control polling.
    3. Simulate:
       - Pagination, filters, search in `AgentConversationListView`.
       - Opening details, observing polling updates and manual refresh.
       - Failure paths where backend errors are gracefully surfaced.
31. **Add integration tests for voice dashboard (`I3.6`)**
    1. Create `src/__tests__/voice-dashboard-integration.test.tsx`.
    2. Mock `ElevenLabsVoiceService`:
       - Provide stubs for `startVoiceSession`, `endVoiceSession`, `configure`.
    3. Simulate:
       - Voice connect/disconnect with various preconditions (no agent ID, no conversation).
       - Emitting `onStatusChange`, `onModeChange`, `onError` callbacks and verifying UI reactions.

---

## 7. E2E, Accessibility, and Regression Tests (Phase 4)

**Prerequisites:** complete all steps in Sections 1–6 (baseline, infra, unit tests, and integration tests).

32. **Set up Playwright or Cypress for E2E (`E4.1`)**
    1. Choose a framework (e.g., Playwright).
    2. Add dev dependency and minimal config.
    3. Add `npm run e2e` script.
    4. Configure test environment to:
       - Build and start the app on a known port.
       - Run E2E tests against that port.
33. **Implement core E2E journeys (`E4.2`)**
    1. Add E2E test file for conversation flows:
       - Visit root, confirm conversation list loads.
       - Open a conversation detail, verify contents.
       - Navigate back.
    2. Add E2E test file for agent conversation flows (with ElevenLabs enabled in env):
       - Visit `/agent-conversations`, confirm list.
       - Open detail and verify data.
    3. Add E2E test file for task dashboard:
       - Visit `/task-dashboard`, verify all panels render.
       - Refresh tasks and verify updated data.
       - Expand working directory tree.
    4. Add E2E test file for working directory:
       - Navigate to a view that shows `WorkingDirectoryBrowser` and test expand/collapse interactions.
    5. Add E2E test file for simple voice flow:
       - With a configured backend and agent, select an agent conversation.
       - Click connect/disconnect and verify visible status messages (happy path only).
34. **Add accessibility checks (`E4.3`)**
    1. For unit/integration:
       - Optionally add `jest-axe` and write a few key a11y tests on:
         - `Navigation`, `Dashboard`, main list/detail views.
    2. For E2E:
       - Use Playwright’s accessibility snapshot or similar to:
         - Verify no critical accessibility violations on core pages.
35. **Add visual regression tests (`E4.4`, optional)**
    1. Integrate a visual regression tool (e.g., Playwright traces/screenshots or dedicated library).
    2. Capture baseline screenshots for:
       - Conversation list & detail.
       - Task list & detail.
       - Task dashboard.
    3. Store baselines and compare on future runs.
36. **Add negative E2E journeys (`E4.5`)**
    1. Configure the backend (or MSW in E2E layer, if applicable) to:
       - Simulate 500s or 404s for conversations, agents, tasks, queues, repositories.
    2. Write tests that:
       - Trigger those error conditions via the UI.
       - Confirm the app shows clear error messages and usable retry paths.
       - Confirm there are no uncaught errors in the browser console.

---

## 8. Finalization & Ongoing Maintenance

**Prerequisites:** complete all steps in Sections 1–7 (all phases of the test implementation).

37. **Raise and enforce coverage to target thresholds**
    1. Re-run `npm run test:coverage` and confirm:
       - Global coverage ≥ 80%.
       - Conversations/tasks/dashboards directories ≥ 90%.
    2. Adjust thresholds upward once stable, if appropriate.
38. **Wire tests into CI/CD**
    1. Ensure CI runs:
       - `npm run lint`.
       - `npm run test:coverage`.
       - `npm run e2e` (on main/nightly if runtime is long).
    2. Mark these checks as required for merges.
39. **Establish contribution rules**
    1. Document (in existing docs) that:
       - New features must include unit tests.
       - User-facing flows should include integration and, where critical, E2E coverage.
    2. Optionally add a simple PR checklist referencing tests.
40. **Ongoing refactors & improvements**
    1. Periodically review:
       - Test flakiness and runtime; optimize or split slow tests.
       - Coverage reports to identify new gaps.
    2. Continuously add tests when bugs are fixed (add regression tests first, then fix).


