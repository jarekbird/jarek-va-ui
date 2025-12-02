### Task Dashboard React/TanStack Port – Execution Order (Granular)

This file breaks the master plan into an ordered sequence of highly granular tasks that an AI agent can execute iteratively with automated tests. Each task is as small and focused as possible to make development easier.

---

## TASK-TD-001: Establish Baseline and Reference UI

**Status**: Keep as single task (already granular - documentation only)

---

## TASK-TD-002.01: Analyze cursor-executor-front API Layer Architecture

**Split from**: TASK-TD-002

### Implementation Steps
- [ ] Review `src/api/client.ts` and understand base HTTP client patterns
- [ ] Review `src/api/conversations.ts` to understand API function patterns
- [ ] Review `src/api/tasks.ts` to understand current state
- [ ] Document API layer patterns and conventions
- [ ] Document error handling approaches
- [ ] Document type transformation patterns

### Definition of Done
- [ ] API layer architecture documented
- [ ] Patterns and conventions clearly understood

---

## TASK-TD-002.02: Analyze cursor-executor-front Testing Setup

**Split from**: TASK-TD-002

### Implementation Steps
- [ ] Review test configuration (Vitest, React Testing Library setup)
- [ ] Review `src/api/conversations.test.ts` to understand API testing patterns
- [ ] Review `src/hooks/useConversationsQuery.test.tsx` to understand hook testing patterns
- [ ] Review `src/routes/conversations/ConversationsPage.test.tsx` to understand component testing patterns
- [ ] Run `npm test` and verify all tests pass
- [ ] Document testing patterns and conventions

### Definition of Done
- [ ] Testing setup documented
- [ ] All existing tests pass
- [ ] Testing patterns clearly understood

---

## TASK-TD-003.01: Survey Conversations & Messages Backend Contracts

**Split from**: TASK-TD-003

### Implementation Steps
- [ ] Identify conversations endpoints (list, get single)
- [ ] Identify messages endpoints (create, add to conversation)
- [ ] Document endpoint paths, methods, request/response shapes
- [ ] Note which endpoints exist vs need to be created
- [ ] Document in `backend-contracts.md` under conversations section

### Definition of Done
- [ ] Conversations endpoints documented
- [ ] Gaps identified

---

## TASK-TD-003.02: Survey Tasks Backend Contracts

**Split from**: TASK-TD-003

### Implementation Steps
- [ ] Identify tasks endpoints (list, get single, update)
- [ ] Document endpoint paths, methods, request/response shapes
- [ ] Note status enum values and meanings
- [ ] Note order field behavior
- [ ] Note which endpoints exist vs need to be created
- [ ] Document in `backend-contracts.md` under tasks section

### Definition of Done
- [ ] Tasks endpoints documented
- [ ] Gaps identified

---

## TASK-TD-003.03: Survey Files Backend Contracts

**Split from**: TASK-TD-003

### Implementation Steps
- [ ] Identify file tree endpoints (get file tree for repository/path)
- [ ] Document endpoint paths, methods, request/response shapes
- [ ] Note repository/path parameter handling
- [ ] Note which endpoints exist vs need to be created
- [ ] Document in `backend-contracts.md` under files section

### Definition of Done
- [ ] Files endpoints documented
- [ ] Gaps identified

---

## TASK-TD-003.04: Survey Queues Backend Contracts

**Split from**: TASK-TD-003

### Implementation Steps
- [ ] Identify queue status endpoints (active, waiting, failed jobs)
- [ ] Document endpoint paths, methods, request/response shapes
- [ ] Note polling or real-time update mechanisms
- [ ] Note which endpoints exist vs need to be created
- [ ] Document in `backend-contracts.md` under queues section

### Definition of Done
- [ ] Queues endpoints documented
- [ ] Gaps identified

---

## TASK-TD-004: Add Task Dashboard Route and Navigation Entry

**Status**: Keep as single task (already granular)

---

## TASK-TD-005.01: Create TaskDashboard Component Structure

**Split from**: TASK-TD-005

### Implementation Steps
- [ ] Create `TaskDashboard.tsx` component file
- [ ] Add state: `selectedNoteConversationId`
- [ ] Add refs: `fileBrowserRef`, `taskPanelRef`
- [ ] Create `handleNoteConversationUpdate` callback
- [ ] Create four panel region containers with placeholders
- [ ] Add `data-testid` attributes
- [ ] Write basic component tests

### Definition of Done
- [ ] Component structure exists
- [ ] State and refs properly set up
- [ ] Basic tests pass

---

## TASK-TD-005.02: Create TaskDashboard CSS Grid Layout

**Split from**: TASK-TD-005

### Implementation Steps
- [ ] Create `TaskDashboard.css` file
- [ ] Port grid layout from reference CSS (4 columns: 250px 1fr 1fr 300px)
- [ ] Port responsive breakpoints (tablet, mobile, small mobile)
- [ ] Adapt to cursor-executor-front design system
- [ ] Test responsive behavior

### Definition of Done
- [ ] CSS grid layout matches original
- [ ] Responsive breakpoints work correctly

---

## TASK-TD-005.03: Create TaskDashboard Type Definitions

**Split from**: TASK-TD-005

### Implementation Steps
- [ ] Create or update `src/types/task-dashboard.ts`
- [ ] Define `WorkingDirectoryBrowserRef` interface
- [ ] Define `TaskManagementPanelRef` interface
- [ ] Export types for use in TaskDashboard
- [ ] Write type tests if applicable

### Definition of Done
- [ ] Type definitions exist
- [ ] Types are properly exported

---

## TASK-TD-005.04: Integrate TaskDashboard into TaskDashboardPage

**Split from**: TASK-TD-005

### Implementation Steps
- [ ] Import `TaskDashboard` in `TaskDashboardPage.tsx`
- [ ] Replace placeholder with `<TaskDashboard />`
- [ ] Import CSS
- [ ] Verify integration works
- [ ] Update integration tests

### Definition of Done
- [ ] TaskDashboard integrated into route
- [ ] Integration tests pass

---

## TASK-TD-006.01: Implement Conversations API Functions (createConversation, addMessageToConversation)

**Split from**: TASK-TD-006

### Implementation Steps
- [ ] Add `createConversation` function to `src/api/conversations.ts`
- [ ] Add `addMessageToConversation` function to `src/api/conversations.ts`
- [ ] Implement request/response transformation
- [ ] Implement error handling
- [ ] Write API function tests

### Definition of Done
- [ ] API functions implemented
- [ ] API function tests pass

---

## TASK-TD-006.02: Implement Conversations Mutation Hooks

**Split from**: TASK-TD-006

### Implementation Steps
- [ ] Create `useCreateConversationMutation` hook
- [ ] Create `useAddMessageMutation` hook
- [ ] Configure mutation options (onSuccess, onError)
- [ ] Implement query invalidation
- [ ] Write mutation hook tests

### Definition of Done
- [ ] Mutation hooks implemented
- [ ] Mutation hook tests pass

---

## TASK-TD-006.03: Extend Conversations Query Hooks

**Split from**: TASK-TD-006

### Implementation Steps
- [ ] Review and extend `useConversationsQuery` if needed
- [ ] Create `useConversationQuery` hook for single conversation
- [ ] Configure query keys and cache options
- [ ] Write query hook tests

### Definition of Done
- [ ] Query hooks implemented/extended
- [ ] Query hook tests pass

---

## TASK-TD-006.04: Write Comprehensive Tests for Conversations API and Hooks

**Split from**: TASK-TD-006

### Implementation Steps
- [ ] Update `src/api/conversations.test.ts` with new function tests
- [ ] Create `src/hooks/useCreateConversationMutation.test.tsx`
- [ ] Create `src/hooks/useAddMessageMutation.test.tsx`
- [ ] Create/update `src/hooks/useConversationQuery.test.tsx`
- [ ] Ensure all tests pass
- [ ] Verify test coverage

### Definition of Done
- [ ] All tests written
- [ ] All tests pass
- [ ] Test coverage adequate

---

## TASK-TD-007.01: Implement NoteTakingPanel List View

**Split from**: TASK-TD-007

### Implementation Steps
- [ ] Create `NoteTakingPanel.tsx` component structure
- [ ] Implement conversation list view using `useConversationsQuery`
- [ ] Implement loading state
- [ ] Implement error state with retry
- [ ] Implement empty state
- [ ] Implement success state (conversation list)
- [ ] Handle conversation selection
- [ ] Add "New Conversation" button
- [ ] Write list view tests

### Definition of Done
- [ ] List view implemented
- [ ] List view tests pass

---

## TASK-TD-007.02: Implement NoteTakingPanel Detail View

**Split from**: TASK-TD-007

### Implementation Steps
- [ ] Implement detail view when `conversationId` provided
- [ ] Use `useConversationQuery` to fetch conversation details
- [ ] Display messages in chronological order
- [ ] Add message input form
- [ ] Add "Back to List" button
- [ ] Write detail view tests

### Definition of Done
- [ ] Detail view implemented
- [ ] Detail view tests pass

---

## TASK-TD-007.03: Implement NoteTakingPanel Mutations (Create Conversation, Add Message)

**Split from**: TASK-TD-007

### Implementation Steps
- [ ] Integrate `useCreateConversationMutation` for new conversations
- [ ] Integrate `useAddMessageMutation` for posting messages
- [ ] Handle mutation success (select new conversation, call callbacks)
- [ ] Handle mutation errors
- [ ] Call `onConversationUpdate` after successful mutations
- [ ] Write mutation tests

### Definition of Done
- [ ] Mutations integrated
- [ ] Mutation tests pass

---

## TASK-TD-007.04: Create NoteTakingPanel CSS

**Split from**: TASK-TD-007

### Implementation Steps
- [ ] Create `NoteTakingPanel.css` file
- [ ] Port styles from reference CSS
- [ ] Adapt to cursor-executor-front design system
- [ ] Ensure responsive behavior
- [ ] Test styling

### Definition of Done
- [ ] CSS created and matches original
- [ ] Responsive behavior works

---

## TASK-TD-007.05: Integrate NoteTakingPanel into TaskDashboard

**Split from**: TASK-TD-007

### Implementation Steps
- [ ] Import `NoteTakingPanel` in `TaskDashboard.tsx`
- [ ] Replace placeholder in notes region with `<NoteTakingPanel />`
- [ ] Pass props: `conversationId`, `onConversationSelect`, `onConversationUpdate`
- [ ] Verify integration works
- [ ] Update integration tests

### Definition of Done
- [ ] NoteTakingPanel integrated
- [ ] Integration tests pass

---

## TASK-TD-008: Implement WorkingDirectoryBrowser API and Hook

**Status**: Keep as single task (already granular)

---

## TASK-TD-009.01: Implement WorkingDirectoryBrowser Component

**Split from**: TASK-TD-009

### Implementation Steps
- [ ] Create `WorkingDirectoryBrowser.tsx` component
- [ ] Use `forwardRef` to expose `refresh` method
- [ ] Use `useFileTreeQuery` hook
- [ ] Render hierarchical file tree (folders + files)
- [ ] Implement loading, error, and success states
- [ ] Accept props for repository/path
- [ ] Write component tests

### Definition of Done
- [ ] Component implemented
- [ ] Component tests pass

---

## TASK-TD-009.02: Create WorkingDirectoryBrowser CSS

**Split from**: TASK-TD-009

### Implementation Steps
- [ ] Create `WorkingDirectoryBrowser.css` file
- [ ] Port layout/visual styles from reference CSS
- [ ] Adapt to cursor-executor-front design system
- [ ] Test styling

### Definition of Done
- [ ] CSS created and matches original

---

## TASK-TD-009.03: Integrate WorkingDirectoryBrowser into TaskDashboard

**Split from**: TASK-TD-009

### Implementation Steps
- [ ] Import `WorkingDirectoryBrowser` in `TaskDashboard.tsx`
- [ ] Replace placeholder in file viewer region
- [ ] Set up ref: `fileBrowserRef`
- [ ] Verify `refresh` method works via ref
- [ ] Update integration tests

### Definition of Done
- [ ] WorkingDirectoryBrowser integrated
- [ ] Refresh method works via ref
- [ ] Integration tests pass

---

## TASK-TD-010.01: Implement Tasks API Functions (fetchTasks, fetchTask, updateTask)

**Split from**: TASK-TD-010

### Implementation Steps
- [ ] Extend `src/api/tasks.ts` with `fetchTasks` (with filters)
- [ ] Extend `src/api/tasks.ts` with `fetchTask` (by ID)
- [ ] Extend `src/api/tasks.ts` with `updateTask` (status/order/details)
- [ ] Implement request/response transformation
- [ ] Implement error handling
- [ ] Write API function tests

### Definition of Done
- [ ] API functions implemented
- [ ] API function tests pass

---

## TASK-TD-010.02: Implement Tasks Query Hooks

**Split from**: TASK-TD-010

### Implementation Steps
- [ ] Create `useTasksQuery` hook (list with filters)
- [ ] Create `useTaskQuery` hook (single task)
- [ ] Configure query keys and cache options
- [ ] Write query hook tests

### Definition of Done
- [ ] Query hooks implemented
- [ ] Query hook tests pass

---

## TASK-TD-010.03: Implement Tasks Mutation Hook

**Split from**: TASK-TD-010

### Implementation Steps
- [ ] Create `useUpdateTaskMutation` hook
- [ ] Configure mutation options
- [ ] Implement query invalidation
- [ ] Write mutation hook tests

### Definition of Done
- [ ] Mutation hook implemented
- [ ] Mutation hook tests pass

---

## TASK-TD-010.04: Write Comprehensive Tests for Tasks API and Hooks

**Split from**: TASK-TD-010

### Implementation Steps
- [ ] Update/extend `src/api/tasks.test.ts`
- [ ] Create `src/hooks/useTasksQuery.test.tsx`
- [ ] Create `src/hooks/useTaskQuery.test.tsx`
- [ ] Create `src/hooks/useUpdateTaskMutation.test.tsx`
- [ ] Ensure all tests pass
- [ ] Verify test coverage

### Definition of Done
- [ ] All tests written
- [ ] All tests pass
- [ ] Test coverage adequate

---

## TASK-TD-011.01: Implement TaskManagementPanel List View

**Split from**: TASK-TD-011

### Implementation Steps
- [ ] Create `TaskManagementPanel.tsx` component structure
- [ ] Use `forwardRef` to expose `refresh` method
- [ ] Use `useTasksQuery` to display task list
- [ ] Implement filters (status, order)
- [ ] Implement loading, error, empty, and success states
- [ ] Write list view tests

### Definition of Done
- [ ] List view implemented
- [ ] List view tests pass

---

## TASK-TD-011.02: Implement TaskManagementPanel Detail View

**Split from**: TASK-TD-011

### Implementation Steps
- [ ] Show selected task details using `useTaskQuery`
- [ ] Display task metadata (status, order, dates)
- [ ] Display task prompt/content
- [ ] Implement loading, error, and success states
- [ ] Write detail view tests

### Definition of Done
- [ ] Detail view implemented
- [ ] Detail view tests pass

---

## TASK-TD-011.03: Implement TaskManagementPanel Mutations (Update Status/Order)

**Split from**: TASK-TD-011

### Implementation Steps
- [ ] Integrate `useUpdateTaskMutation` for status changes
- [ ] Integrate `useUpdateTaskMutation` for order changes
- [ ] Integrate `useUpdateTaskMutation` for detail updates
- [ ] Handle mutation success and errors
- [ ] Write mutation tests

### Definition of Done
- [ ] Mutations integrated
- [ ] Mutation tests pass

---

## TASK-TD-011.04: Create TaskManagementPanel CSS

**Split from**: TASK-TD-011

### Implementation Steps
- [ ] Create `TaskManagementPanel.css` file
- [ ] Port styles from reference CSS
- [ ] Adapt to cursor-executor-front design system
- [ ] Test styling

### Definition of Done
- [ ] CSS created and matches original

---

## TASK-TD-011.05: Integrate TaskManagementPanel into TaskDashboard

**Split from**: TASK-TD-011

### Implementation Steps
- [ ] Import `TaskManagementPanel` in `TaskDashboard.tsx`
- [ ] Replace placeholder in tasks region
- [ ] Set up ref: `taskPanelRef`
- [ ] Verify `refresh` method works via ref
- [ ] Update integration tests

### Definition of Done
- [ ] TaskManagementPanel integrated
- [ ] Refresh method works via ref
- [ ] Integration tests pass

---

## TASK-TD-012.01: Implement Queues API

**Split from**: TASK-TD-012

### Implementation Steps
- [ ] Create `src/api/queues.ts` file
- [ ] Implement function to fetch queue metrics
- [ ] Implement request/response transformation
- [ ] Implement error handling
- [ ] Write API function tests

### Definition of Done
- [ ] API functions implemented
- [ ] API function tests pass

---

## TASK-TD-012.02: Implement Queues Query Hook

**Split from**: TASK-TD-012

### Implementation Steps
- [ ] Create `useQueuesQuery` hook
- [ ] Configure polling with `refetchInterval`
- [ ] Configure query keys and cache options
- [ ] Write query hook tests

### Definition of Done
- [ ] Query hook implemented
- [ ] Query hook tests pass

---

## TASK-TD-012.03: Implement BullMQQueueView Component

**Split from**: TASK-TD-012

### Implementation Steps
- [ ] Create `BullMQQueueView.tsx` component
- [ ] Use `useQueuesQuery` hook
- [ ] Display queue metrics (active, waiting, failed)
- [ ] Implement loading, error, and success states
- [ ] Write component tests

### Definition of Done
- [ ] Component implemented
- [ ] Component tests pass

---

## TASK-TD-012.04: Create BullMQQueueView CSS and Integrate

**Split from**: TASK-TD-012

### Implementation Steps
- [ ] Create `BullMQQueueView.css` file
- [ ] Port styles from reference CSS
- [ ] Adapt to cursor-executor-front design system
- [ ] Import `BullMQQueueView` in `TaskDashboard.tsx`
- [ ] Replace placeholder in queues region
- [ ] Test integration

### Definition of Done
- [ ] CSS created
- [ ] Component integrated
- [ ] Integration tests pass

---

## TASK-TD-013: Wire Cross-Panel Interactions in TaskDashboard

**Status**: Keep as single task (already granular)

---

## TASK-TD-014: Route-Level Integration Tests

**Status**: Keep as single task (already granular)

---

## TASK-TD-015.01: Compare New Dashboard vs Original (Parity Analysis)

**Split from**: TASK-TD-015

### Implementation Steps
- [ ] Compare layout (panel sizes, alignment)
- [ ] Compare typography and key styles
- [ ] Compare behavior for selection and updates
- [ ] Document differences
- [ ] Create parity checklist

### Definition of Done
- [ ] Parity analysis complete
- [ ] Differences documented

---

## TASK-TD-015.02: Refine UX to Match Original (CSS and Behavior Tweaks)

**Split from**: TASK-TD-015

### Implementation Steps
- [ ] Make targeted CSS tweaks to increase similarity
- [ ] Make behavior tweaks to match original
- [ ] Optionally capture screenshots for comparison
- [ ] Re-run all tests
- [ ] Verify no regressions

### Definition of Done
- [ ] UX refined to match original
- [ ] All tests pass
- [ ] No regressions

---

## TASK-TD-016: Documentation and Rollout

**Status**: Keep as single task (already granular)

