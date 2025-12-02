### Task Dashboard React/TanStack Port – Execution Order

This file breaks the master plan into an ordered sequence of granular tasks that an AI agent can execute iteratively with automated tests.

---

## TASK-TD-001: Establish Baseline and Reference UI

### Implementation Steps
- [ ] In `VirtualAssistant/jarek-va-ui`:
  - [ ] Open `src/components/TaskDashboard.tsx` and its dependent components:
    - [ ] `NoteTakingPanel.tsx`
    - [ ] `WorkingDirectoryBrowser.tsx`
    - [ ] `TaskManagementPanel.tsx`
    - [ ] `BullMQQueueView.tsx`
  - [ ] Open corresponding CSS files (`TaskDashboard.css`, `NoteTakingPanel.css`, `WorkingDirectoryBrowser.css`, `TaskManagementPanel.css`, `BullMQQueueView.css`).
- [ ] Run the existing jarek-va-ui tests:
  - [ ] `npm install` (if not already done).
  - [ ] `npm test` (or project-specific test command) and confirm they pass.
- [ ] Capture screenshots or notes on:
  - [ ] Overall layout (panel sizes, ordering).
  - [ ] Key interactions (selecting a conversation, updating notes, task refresh behavior, queue updates).

### Testing
- [ ] No new tests yet; ensure existing jarek-va-ui tests pass so behavior is well-defined.

### Definition of Done
- [ ] A short reference note exists in `python-converstion` describing the current TaskDashboard behavior and layout.
- [ ] jarek-va-ui tests are green.

---

## TASK-TD-002: Analyze `cursor-executor-front` Architecture and Testing Setup

### Implementation Steps
- [ ] In `python-cursor/cursor-executor/cursor-executor-front`:
  - [ ] Review:
    - [ ] `src/api/client.ts` and related API modules (`conversations.ts`, `tasks.ts`).
    - [ ] `src/types/conversation.ts` and `src/types/task.ts`.
    - [ ] `src/query/queryClient.ts` and `src/query/queryClientProvider.tsx`.
    - [ ] `src/hooks/useConversationsQuery.ts` and its tests.
    - [ ] `src/routes/conversations/ConversationsPage.tsx` and its tests.
- [ ] Run:
  - [ ] `npm install` (if needed).
  - [ ] `npm test` and confirm test suite passes.

### Testing
- [ ] Ensure `ConversationsPage` tests pass and can serve as a pattern for the Task Dashboard route tests.

### Definition of Done
- [ ] Clear understanding of how APIs, TanStack Query, and routes are structured in `cursor-executor-front`.
- [ ] Tests pass in `cursor-executor-front`.

---

## TASK-TD-003: Survey Backend Contracts Needed for Task Dashboard

### Implementation Steps
- [ ] Identify the existing or planned `cursor-executor` endpoints that the dashboard needs:
  - [ ] Conversations & messages (list, create, add message).
  - [ ] Tasks (list, filter, create/update, details).
  - [ ] Working directory files (file tree for a repository/path).
  - [ ] Queue/worker status (BullMQ-equivalent).
- [ ] For each required capability:
  - [ ] Document the endpoint path, method, request shape, and response shape.
  - [ ] Note whether an API helper already exists in `cursor-executor-front/src/api/` or needs to be created.
- [ ] Create a small markdown note (e.g. `backend-contracts.md` in this plan folder) listing all required endpoints and any gaps.

### Testing
- [ ] No runtime tests; ensure documentation is consistent with backend code or specs.

### Definition of Done
- [ ] Backend contract note exists and is referenced by later frontend tasks.

---

## TASK-TD-004: Add Task Dashboard Route and Navigation Entry

### Implementation Steps
- [ ] In `cursor-executor-front`:
  - [ ] Create a new route component file under `src/routes/task-dashboard/TaskDashboardPage.tsx`.
  - [ ] Add CSS for the route-level layout in `TaskDashboardPage.css`.
- [ ] Update routing (e.g., in `src/App.tsx` or route config) to:
  - [ ] Register a new route path (e.g. `/task-dashboard`).
  - [ ] Render `TaskDashboardPage` for that path.
- [ ] Update navigation (if present) to include a link to "Task Dashboard".

### Testing
- [ ] Add `src/routes/task-dashboard/TaskDashboardPage.test.tsx`:
  - [ ] Renders without crashing.
  - [ ] Contains a root container with a `data-testid` (e.g. `task-dashboard-page`).
- [ ] Run `npm test` to confirm new tests pass.

### Definition of Done
- [ ] Visiting `/task-dashboard` in dev shows a placeholder layout.
- [ ] Navigation can reach this route.
- [ ] Basic route tests pass.

---

## TASK-TD-005: Create TaskDashboard Shell Component

### Implementation Steps
- [ ] Under `cursor-executor-front/src/components/` (or `src/routes/task-dashboard/components/`), create:
  - [ ] `TaskDashboard.tsx`:
    - [ ] State: `selectedNoteConversationId` (`string | undefined`).
    - [ ] Refs: `fileBrowserRef`, `taskPanelRef` (using `useRef`).
    - [ ] `handleNoteConversationUpdate` callback that:
      - [ ] Calls `fileBrowserRef.current.refresh()` if available.
      - [ ] Calls `taskPanelRef.current.refresh()` if available.
    - [ ] Renders four layout regions (file viewer, notes, tasks, queues) with CSS classes similar to `TaskDashboard.css`.
  - [ ] `TaskDashboard.css`:
    - [ ] Implement a CSS grid layout similar to original TaskDashboard (left file viewer, next notes, then tasks, then queue).
- [ ] Integrate `TaskDashboard` into `TaskDashboardPage.tsx`:
  - [ ] Replace placeholder content with the `TaskDashboard` component.

### Testing
- [ ] Add `TaskDashboard.test.tsx`:
  - [ ] Renders four sections with appropriate `data-testid` attributes.
  - [ ] Simulated `onConversationUpdate` calls trigger `refresh` on mocked refs.

### Definition of Done
- [ ] TaskDashboard shell exists and visually approximates the original layout (even with stub children).
- [ ] Shell tests pass.

---

## TASK-TD-006: Implement Conversations API Hooks for Notes

### Implementation Steps
- [ ] Extend or create conversation-related API helpers in `cursor-executor-front/src/api/conversations.ts` to support:
  - [ ] Listing conversations.
  - [ ] Fetching a single conversation (if needed).
  - [ ] Creating a new conversation.
  - [ ] Adding a message to a conversation.
- [ ] Create TanStack Query hooks:
  - [ ] `useConversationsQuery` (reuse/extend existing).
  - [ ] `useConversationMessagesQuery` (if needed).
  - [ ] `useCreateConversationMutation`.
  - [ ] `useAddMessageMutation`.

### Testing
- [ ] Add/update tests:
  - [ ] `src/api/conversations.test.ts`.
  - [ ] `src/hooks/useConversationsQuery.test.ts[x]`.
  - [ ] New hook tests for create and add-message mutations.

### Definition of Done
- [ ] All conversation-related hooks and APIs required by the NoteTakingPanel are implemented and tested.

---

## TASK-TD-007: Implement NoteTakingPanel Component

### Implementation Steps
- [ ] Create `NoteTakingPanel.tsx` under `cursor-executor-front` (`components` or route-local):
  - [ ] Props:
    - [ ] `conversationId?: string`.
    - [ ] `onConversationSelect(id: string | undefined): void`.
    - [ ] `onConversationUpdate(): void`.
  - [ ] Use TanStack Query hooks to:
    - [ ] Fetch conversation list.
    - [ ] Fetch messages for the selected conversation.
    - [ ] Create new conversations.
    - [ ] Post messages.
  - [ ] Implement UI states:
    - [ ] Loading (spinner / message).
    - [ ] Error (message + retry).
    - [ ] Empty (no conversations).
    - [ ] List and detail view similar to jarek-va-ui NoteTakingPanel.
  - [ ] Call `onConversationSelect` when a conversation is selected.
  - [ ] Call `onConversationUpdate` after successful message post or conversation creation.
- [ ] Wire `NoteTakingPanel` into `TaskDashboard` shell.

### Testing
- [ ] Add `NoteTakingPanel.test.tsx`:
  - [ ] Mocks API hooks to simulate loading, error, empty, and success states.
  - [ ] Verifies that selection and updates trigger the expected callbacks.

### Definition of Done
- [ ] NoteTakingPanel behaves similarly to the original, including callbacks, with tests covering core flows.

---

## TASK-TD-008: Implement WorkingDirectoryBrowser API and Hook

### Implementation Steps
- [ ] Create `src/api/files.ts` in `cursor-executor-front`:
  - [ ] Define a function to fetch a file tree for a given repository/path (based on backend contract).
- [ ] Create `useFileTreeQuery` hook in `src/hooks/useFileTreeQuery.ts`:
  - [ ] Use TanStack Query to fetch and cache the file tree.
  - [ ] Support refetching on demand.

### Testing
- [ ] Add `files.test.ts` for the API helper.
- [ ] Add `useFileTreeQuery.test.ts[x]` for the hook:
  - [ ] Covers loading, success, and error states.

### Definition of Done
- [ ] File tree API and hook are ready for use by the WorkingDirectoryBrowser component.

---

## TASK-TD-009: Implement WorkingDirectoryBrowser Component

### Implementation Steps
- [ ] Create `WorkingDirectoryBrowser.tsx` under `cursor-executor-front`:
  - [ ] Use `forwardRef` to expose a `refresh` method that calls `refetch` on `useFileTreeQuery`.
  - [ ] Render a hierarchical file tree (folders + files) similar to the original component.
  - [ ] Accept props for repository/path if needed (or use a default).
- [ ] Create `WorkingDirectoryBrowser.css`:
  - [ ] Port layout/visual styles from the original CSS, adapted to the app's design system.
- [ ] Integrate it into the TaskDashboard shell using the same region as the original (far left).

### Testing
- [ ] Add `WorkingDirectoryBrowser.test.tsx`:
  - [ ] Verifies loading, error, and success states.
  - [ ] Asserts `refresh` method triggers a refetch.

### Definition of Done
- [ ] WorkingDirectoryBrowser visually and behaviorally matches the original component with tests.

---

## TASK-TD-010: Implement Tasks API Hooks

### Implementation Steps
- [ ] Extend `src/api/tasks.ts` to cover:
  - [ ] Listing tasks (with status/order filters).
  - [ ] Fetching a task by ID.
  - [ ] Updating task status/order/details.
- [ ] Create hooks:
  - [ ] `useTasksQuery` (list).
  - [ ] `useTaskQuery` (single).
  - [ ] `useUpdateTaskMutation`.

### Testing
- [ ] Add/extend:
  - [ ] `tasks.test.ts`.
  - [ ] `useTasksQuery.test.ts[x]`.
  - [ ] `useTaskQuery.test.ts[x]`.

### Definition of Done
- [ ] Tasks API and hooks support all operations needed by the TaskManagementPanel.

---

## TASK-TD-011: Implement TaskManagementPanel Component

### Implementation Steps
- [ ] Create `TaskManagementPanel.tsx` under `cursor-executor-front`:
  - [ ] `forwardRef` to expose `refresh` (refetch tasks).
  - [ ] Use `useTasksQuery` to display a task list with filters.
  - [ ] Show a selected task's details using `useTaskQuery`.
  - [ ] Allow status changes or reordering via mutations.
  - [ ] Layout similar to original TaskManagementPanel.
- [ ] Create any supporting components (`TaskList`, `TaskDetails`) as needed.
- [ ] Style with `TaskManagementPanel.css`, ported and adapted.

### Testing
- [ ] Add `TaskManagementPanel.test.tsx`:
  - [ ] Tests list rendering, selection, refresh behavior, and state transitions.

### Definition of Done
- [ ] TaskManagementPanel behavior matches original panel with tests for main flows.

---

## TASK-TD-012: Implement Queues API and BullMQQueueView Component

### Implementation Steps
- [ ] Create `src/api/queues.ts`:
  - [ ] Function(s) to fetch queue metrics (active, waiting, failed, etc.) from `cursor-executor`.
- [ ] Create `useQueuesQuery` hook for polling queue metrics via TanStack Query (using `refetchInterval`).
- [ ] Implement `BullMQQueueView.tsx`:
  - [ ] Displays high‑level status of relevant queues.
  - [ ] Layout consistent with original `BullMQQueueView`.
- [ ] Add `BullMQQueueView.css` for styling.

### Testing
- [ ] Add `queues.test.ts` for the API helper.
- [ ] Add `useQueuesQuery.test.ts[x]` for the hook.
- [ ] Add `BullMQQueueView.test.tsx` for the component.

### Definition of Done
- [ ] Queue view is functional and visually similar to the original, with tests.

---

## TASK-TD-013: Wire Cross‑Panel Interactions in TaskDashboard

### Implementation Steps
- [ ] Ensure `TaskDashboard.tsx`:
  - [ ] Passes `conversationId`, `onConversationSelect`, and `onConversationUpdate` to `NoteTakingPanel`.
  - [ ] Hooks `handleNoteConversationUpdate` to:
    - [ ] Call `fileBrowserRef.current.refresh()` for WorkingDirectoryBrowser.
    - [ ] Call `taskPanelRef.current.refresh()` for TaskManagementPanel.
- [ ] Manually test flows:
  - [ ] Selecting a conversation updates notes and triggers appropriate refreshes.
  - [ ] Adding notes causes file browser and tasks to refresh when appropriate.

### Testing
- [ ] Extend `TaskDashboard.test.tsx`:
  - [ ] Use mocked child components with spies for `refresh` to validate interactions.

### Definition of Done
- [ ] Cross-panel behavior in TaskDashboard matches the original UI’s semantics.

---

## TASK-TD-014: Route-Level Integration Tests

### Implementation Steps
- [ ] In `TaskDashboardPage.test.tsx`:
  - [ ] Mount `TaskDashboardPage` wrapped with:
    - [ ] TanStack Query provider.
    - [ ] Any required context providers (router, theme).
  - [ ] Mock API hooks to simulate:
    - [ ] All panels loading successfully.
    - [ ] One or more panels experiencing errors.
  - [ ] Assert that:
    - [ ] All four regions render in the happy path.
    - [ ] Individual error states are contained to panels and do not crash the whole page.

### Definition of Done
- [ ] Route-level tests give confidence that the dashboard works end‑to‑end given mocked data.

---

## TASK-TD-015: Parity & UX Refinement

### Implementation Steps
- [ ] Compare new dashboard vs original jarek-va-ui TaskDashboard:
  - [ ] Layout (panel sizes, alignment).
  - [ ] Typography and key styles.
  - [ ] Behavior for selection and updates.
- [ ] Make targeted CSS and UX tweaks to increase similarity where beneficial.
- [ ] Optionally capture screenshots for before/after comparison.

### Testing
- [ ] Re-run all tests in `cursor-executor-front`.
- [ ] Optionally run visual regression tests if available.

### Definition of Done
- [ ] Stakeholders agree that the new dashboard matches the original in functionality and acceptable UX.

---

## TASK-TD-016: Documentation and Rollout

### Implementation Steps
- [ ] Add a short section to `cursor-executor-front/README.md`:
  - [ ] How to run the Task Dashboard route.
  - [ ] High-level architecture (route, key components, queries).
- [ ] Document any backend flags or configuration required for the dashboard to function.
- [ ] Coordinate with backend (`cursor-executor`) to ensure all required endpoints are enabled in target environments.

### Definition of Done
- [ ] Developers can easily discover and understand the new Task Dashboard in `cursor-executor-front`.
- [ ] The route can be used in development and test environments with appropriate backend configuration.

## Execution Order: Implementing `cursor-executor-front` (Conversations & Tasks)

### 0. Repo & Environment Setup
1. Create a new app skeleton for `cursor-executor-front` (e.g., `apps/cursor-executor-front` or similar agreed location) using React + TypeScript (Vite, Next, or CRA; document chosen tool).
2. Add project dependencies: React 18+, React DOM, TypeScript, TanStack Query, chosen router (TanStack Router or React Router), testing libs (Vitest/Jest, React Testing Library, MSW or equivalent), and styling stack (Tailwind or existing design system).
3. Configure TypeScript (`tsconfig.json`) with strict settings and appropriate JSX/runtime config.
4. Set up the testing framework (test runner config, `setupTests.ts`, jsdom environment, etc.).
5. Add a basic `App` component that renders a placeholder layout and a smoke test that mounts `App` without errors; run tests and ensure green.

### 1. Backend Contract Discovery
6. In the Python `cursor-executor` backend, locate all API endpoints related to conversations and tasks (lists and details).
7. For each endpoint, document:
   - URL path and HTTP method.
   - Request parameters (query/path/body).
   - JSON response structure, including nested objects.
   - Supported filters, pagination, and sorting options.
8. Identify any WebSocket or streaming endpoints that deliver live updates for conversations or tasks (if currently used).
9. Save this documentation as `docs/conversation-task-api.md` (or similar) in the repo.

### 2. Front-end Data Types
10. In `cursor-executor-front`, create a `src/types/conversation.ts` file and define TypeScript types for:
    - `ConversationSummary` (fields for list view).
    - `Conversation` (full detail, including messages and metadata).
    - `Message` (role, content, timestamps, ids).
11. Create a `src/types/task.ts` file and define:
    - `TaskSummary` (fields for list view).
    - `Task` (full detail, including status, logs, related conversation id).
    - Any related types such as `ExecutionLogEntry` or status enums.
12. Add unit tests that validate these types against sample backend responses (e.g., compile-time type tests or runtime shape checks using mocked JSON fixtures).

### 3. API Client Layer
13. Create `src/api/client.ts` that exports a configured HTTP client (e.g., `fetch` wrapper or Axios instance) with:
    - Base URL pointing to the Python `cursor-executor` service.
    - JSON parsing and typed response helpers.
    - Basic error handling (e.g., throwing on non-2xx).
14. Write unit tests for `client.ts` that:
    - Verify base URL is used.
    - Verify JSON responses are parsed.
    - Verify errors are thrown for non-2xx responses (mock network).
15. Add environment configuration handling for base URL (e.g., from `process.env` or `import.meta.env`) and test that configuration logic.

### 4. Conversations & Tasks API Functions
16. Create `src/api/conversations.ts` with functions:
    - `fetchConversations(params)` returning `ConversationSummary[]` (plus pagination metadata if available).
    - `fetchConversation(conversationId)` returning `Conversation`.
17. Create `src/api/tasks.ts` with functions:
    - `fetchTasks(params)` returning `TaskSummary[]`.
    - `fetchTask(taskId)` returning `Task`.
18. For each function, map raw backend JSON into the TypeScript types defined earlier (e.g., normalize timestamps, ids).
19. Add unit tests for each API function, using mocked HTTP responses to ensure:
    - Correct URL and params are sent.
    - Response shapes are correctly transformed into types.
    - Errors are handled as expected.

### 5. TanStack Query Setup
20. Add a `src/query/queryClient.ts` file that exports a configured `QueryClient` with sensible defaults (retry policy, `staleTime`, `cacheTime`).
21. Wrap the root app component with `QueryClientProvider` (e.g., in `main.tsx` or `index.tsx`) and pass in the configured `QueryClient`.
22. Create basic tests to ensure components rendered inside the provider can use query hooks without errors (simple dummy hook or test component).

### 6. Query Hooks for Conversations & Tasks
23. Implement `src/hooks/useConversationsQuery.ts`:
    - Wraps `fetchConversations`.
    - Supports filter/pagination params in the query key.
24. Implement `src/hooks/useConversationQuery.ts`:
    - Wraps `fetchConversation`.
    - Uses `conversationId` as part of the query key.
25. Implement `src/hooks/useTasksQuery.ts`:
    - Wraps `fetchTasks`.
    - Supports filter/pagination in the query key.
26. Implement `src/hooks/useTaskQuery.ts`:
    - Wraps `fetchTask`.
    - Uses `taskId` as part of the query key.
27. For each query hook, add unit tests that:
    - Use a test `QueryClientProvider` + MSW (or mock) to simulate API responses.
    - Assert correct loading, success, and error states.
    - Assert that query keys are as expected.

### 7. Routing & Layout Shell
28. Choose router (TanStack Router vs React Router) and install any additional packages needed.
29. Define top-level routes:
    - `/conversations`
    - `/conversations/:conversationId`
    - `/tasks`
    - `/tasks/:taskId`
30. Implement a `Layout` component in `src/components/layout/Layout.tsx` that provides:
    - Header with navigation links (Conversations, Tasks).
    - Main content area for routed views.
31. Wire the layout into the routing configuration so that all main routes render inside the layout.
32. Add integration tests for routing that:
    - Render the router in a test environment.
    - Navigate to each route and assert that the correct page component is shown.

### 8. Conversation List View
33. Implement a `ConversationsPage` route component in `src/routes/conversations/ConversationsPage.tsx` that:
    - Uses `useConversationsQuery`.
    - Renders loading, error, empty, and success states.
34. Implement presentational components:
    - `ConversationList` (renders a list of items).
    - `ConversationListItem` (renders a single conversation summary).
    - `ConversationFilters` (inputs/selects for search, status, date, etc.).
35. Connect `ConversationFilters` to the query (via route/search params or component state) to refetch with filter changes.
36. Add unit tests for each presentational component (snapshot/behavioral).
37. Add integration tests for `ConversationsPage` that:
    - Mock conversations API with multiple items.
    - Assert filters affect results (where supported).
    - Assert pagination or infinite scroll behavior (as per backend).

### 9. Conversation Detail View
38. Implement `ConversationDetailPage` in `src/routes/conversations/ConversationDetailPage.tsx` that:
    - Reads `conversationId` from route params.
    - Uses `useConversationQuery`.
    - Handles loading, error, and not-found states.
39. Implement supporting components:
    - `ConversationHeader` (title, user, created/updated, status).
    - `MessageList` (scrollable list of messages).
    - `MessageItem` (renders a single message with role, timestamp, and styling).
    - `RelatedTasksPanel` (shows tasks linked to this conversation).
40. Wire `RelatedTasksPanel` to the tasks data (either via dedicated hook or by filtering tasks based on conversation id).
41. Add unit tests for each component, including edge cases like:
    - Empty messages.
    - Long conversations.
    - Missing optional metadata.
42. Add integration tests for `ConversationDetailPage`:
    - Mock API data and navigate via router to `/conversations/:id`.
    - Assert all sections (header, messages, related tasks) render correctly.

### 10. Task List View
43. Implement `TasksPage` in `src/routes/tasks/TasksPage.tsx` that:
    - Uses `useTasksQuery`.
    - Renders loading, error, empty, and success states.
44. Implement presentational components:
    - `TaskList`.
    - `TaskListItem`.
    - `TaskFilters` (status filter, search, etc.).
45. Connect `TaskFilters` to the query parameters so that filters are reflected in the results.
46. Add unit tests for list and filter components.
47. Add integration tests for `TasksPage` covering:
    - Multiple statuses.
    - Pagination or infinite scroll.
    - Relationship display to associated conversations (e.g., conversation title link).

### 11. Task Detail View
48. Implement `TaskDetailPage` in `src/routes/tasks/TaskDetailPage.tsx` that:
    - Reads `taskId` from the route.
    - Uses `useTaskQuery`.
    - Shows loading, error, and not-found states.
49. Implement supporting components:
    - `TaskHeader` (metadata: status, created/updated, owner/agent).
    - `TaskStatusBadge` (visual status indicator).
    - `TaskLogs` (list or timeline of execution logs).
    - Link back to the associated conversation (if known).
50. Add unit tests for these components, including:
    - Different status values.
    - Empty and long logs.
51. Add integration tests for `TaskDetailPage`:
    - Verify logs and metadata render from mocked API data.
    - Verify link back to the conversation navigates correctly.

### 12. UI/UX Parity & Design System Integration
52. Capture screenshots or UI specs of existing conversation and task views from the legacy UI.
53. Compare the new UI to the legacy UI and list any missing behaviors or elements.
54. Decide whether to reuse existing `jarek-va-ui` components or define a small design system for `cursor-executor-front`.
55. If reusing components, integrate the shared component library and replace temporary primitive components with design-system components.
56. If creating a new design system, define and implement primitives (buttons, inputs, modals, typography) and refactor pages to use them.
57. Add visual/regression tests where feasible (e.g., Storybook stories or component snapshots) for key components.

### 13. Accessibility & Responsiveness
58. Audit conversation and task pages for keyboard navigation and screen reader support (ARIA roles/labels for lists, headings, and detail sections).
59. Add any missing ARIA attributes and keyboard handlers.
60. Implement responsive layouts for conversations and tasks:
    - Narrow viewports: stacked layout.
    - Wide viewports: side-by-side panels where appropriate.
61. Add tests for focus management and basic accessibility behavior where possible (e.g., using Testing Library queries and tab simulation).

### 14. Optional Live Updates (If Included in This Phase)
62. Decide between polling and WebSockets for live updates to conversations/tasks.
63. If polling:
    - Configure `refetchInterval` on relevant TanStack Query hooks.
    - Add tests to verify refetch behavior (mock timers).
64. If WebSockets:
    - Implement a small subscription client and integrate with query cache updates.
    - Add tests to verify the cache updates when messages/tasks change.

### 15. Feature Flags & Rollout
65. Implement feature-flag configuration for routing users to `cursor-executor-front` conversation and task views (per env or per user).
66. Add a mechanism in the legacy UI to switch between old and new views using the feature flag.
67. Write automated tests that:
    - Verify the flag-enabled path uses the new routes.
    - Verify the flag-disabled path continues to use the legacy UI.
68. Deploy `cursor-executor-front` to the dev environment and validate end-to-end flows manually against the Python `cursor-executor` backend.

### 16. Staging, Parity Verification, and Decommissioning
69. Roll out to staging with selected power users and collect feedback and bug reports.
70. Fix reported issues iteratively with targeted tests for each bug fix.
71. Create a parity checklist ensuring:
    - All conversation data/behaviors match the old UI.
    - All task data/behaviors match the old UI.
    - Links between conversations and tasks are symmetric and reliable.
72. Once parity is confirmed, remove or hide old conversation/task views in the legacy UI.
73. Update product and developer documentation to point to `cursor-executor-front` as the canonical UI for conversations and tasks.







