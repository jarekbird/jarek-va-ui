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




