# Task Dashboard Baseline Documentation

**Reference Implementation**: `python-cursor/jarek-va-ui/src/components/TaskDashboard.tsx` and related components

**Purpose**: This document provides a comprehensive baseline understanding of the existing `TaskDashboard` implementation to guide the React/TanStack Query port to `cursor-executor-front`.

---

## 1. Component Structure and Hierarchy

### 1.1 Main Component: TaskDashboard

**Location**: `src/components/TaskDashboard.tsx` (lines 1-66)

**Structure**:
- Root container: `<div className="task-dashboard" data-testid="task-dashboard">`
- Content wrapper: `<div className="task-dashboard__content">`
- Four panel regions:
  1. File viewer: `<div className="task-dashboard__file-viewer">`
  2. Notes panel: `<div className="task-dashboard__left">`
  3. Tasks panel: `<div className="task-dashboard__middle-right">`
  4. Queues panel: `<div className="task-dashboard__right">`

**State Management**:
- `selectedNoteConversationId`: `string | undefined` - Tracks which conversation is selected in the notes panel
- Uses `useState` hook for local state

**Refs**:
- `fileBrowserRef`: `useRef<WorkingDirectoryBrowserRef>(null)` - Reference to WorkingDirectoryBrowser component
- `taskPanelRef`: `useRef<TaskManagementPanelRef>(null)` - Reference to TaskManagementPanel component

**Key Callback**:
- `handleNoteConversationUpdate()`: Refreshes both file browser and task panel when note conversation is updated
  - Calls `fileBrowserRef.current?.refresh()` if ref exists
  - Calls `taskPanelRef.current?.refresh()` if ref exists

### 1.2 Sub-Components

#### NoteTakingPanel
**Location**: `src/components/NoteTakingPanel.tsx` (lines 1-121)

**Props Interface**:
```typescript
export interface NoteTakingPanelProps {
  conversationId?: string;
  onConversationSelect?: (conversationId: string) => void;
  onConversationUpdate?: (conversation: Conversation) => void;
}
```

**State Management**:
- `selectedConversationId`: `string | undefined` - Internal state for selected conversation
- `conversation`: `Conversation | null` - Loaded conversation data
- `loading`: `boolean` - Loading state
- `error`: `string | null` - Error state

**Key Behaviors**:
- Shows list view by default (`ConversationListView`)
- Shows detail view when `conversationId` is provided (`ConversationDetails`)
- Loads conversation data via `getConversationById(id)` API call
- Has "Back to List" button to return to list view
- Handles new conversation creation via `onNewConversation` callback

**API Dependencies**:
- `getConversationById(id: string)`: Fetches single conversation
- Uses `ConversationListView` and `ConversationDetails` child components

#### WorkingDirectoryBrowser
**Location**: `src/components/WorkingDirectoryBrowser.tsx` (lines 1-184)

**Ref Interface**:
```typescript
export interface WorkingDirectoryBrowserRef {
  refresh: () => Promise<void>;
}
```

**Implementation**:
- Uses `forwardRef` to expose `refresh` method
- Uses `useImperativeHandle` to implement ref interface

**State Management**:
- `files`: `FileNode[]` - File tree data
- `loading`: `boolean` - Loading state
- `error`: `string | null` - Error state
- `expandedPaths`: `Set<string>` - Tracks which directories are expanded

**Key Behaviors**:
- Loads file tree on mount via `getWorkingDirectoryFiles()` API
- Displays hierarchical file tree with expand/collapse functionality
- Auto-expands first level directories on initial load
- Preserves expanded state on refresh
- Has manual refresh button in header
- Exposes `refresh()` method via ref for external refresh triggers

**API Dependencies**:
- `getWorkingDirectoryFiles()`: Returns `Promise<FileNode[]>` - Fetches working directory file tree

**File Tree Structure**:
- Uses `FileNode` type from `../types/file-tree`
- Recursive tree structure with `children` property
- Each node has: `name`, `path`, `type` ('file' | 'directory'), `children?`

#### TaskManagementPanel
**Location**: `src/components/TaskManagementPanel.tsx` (lines 1-104)

**Ref Interface**:
```typescript
export interface TaskManagementPanelRef {
  refresh: () => Promise<void>;
}
```

**Implementation**:
- Uses `forwardRef` to expose `refresh` method
- Uses `useImperativeHandle` to implement ref interface

**State Management**:
- `tasks`: `Task[]` - List of tasks
- `loading`: `boolean` - Loading state
- `error`: `string | null` - Error state

**Key Behaviors**:
- Loads tasks on mount via `listTasks()` API
- Displays task list using `TaskList` component
- Has manual refresh button in header
- Exposes `refresh()` method via ref for external refresh triggers
- Shows empty state message: "No tasks found. Tasks are created by cursor-cli."

**API Dependencies**:
- `listTasks()`: Returns `Promise<Task[]>` - Fetches all tasks

#### BullMQQueueView
**Location**: `src/components/BullMQQueueView.tsx` (lines 1-166)

**Props**: None (stateless component)

**State Management**:
- `queues`: `QueueInfo[]` - List of queue information
- `loading`: `boolean` - Loading state
- `error`: `string | null` - Error state

**Key Behaviors**:
- Loads queues on mount via `listQueues()` API
- Auto-refreshes every 5 seconds using `setInterval`
- Displays queue metrics: waiting, active, completed, failed, delayed
- Shows agent tags for each queue
- Color-codes status values (gray for 0, blue for <5, orange for <10, red for >=10)
- Highlights queues with active jobs (border color change)

**API Dependencies**:
- `listQueues()`: Returns `Promise<QueueInfo[]>` - Fetches queue information

**Queue Data Structure**:
```typescript
interface QueueInfo {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  agents: string[];
}
```

---

## 2. CSS Layout and Styling

### 2.1 TaskDashboard.css

**Location**: `src/components/TaskDashboard.css` (lines 1-122)

**Grid Layout**:
- Main container: `display: flex; flex-direction: column; height: 100vh;`
- Content grid: `display: grid; grid-template-columns: 250px 1fr 1fr 300px;`
  - Column 1: 250px (file viewer)
  - Column 2: 1fr (notes panel)
  - Column 3: 1fr (tasks panel)
  - Column 4: 300px (queues panel)
- Gap: `1rem` between columns
- Padding: `1rem` on content wrapper

**Responsive Breakpoints**:

1. **Tablet/Compressed (max-width: 1400px)**:
   - Grid: `250px 1fr 1fr` (3 columns)
   - Queues panel moves to bottom row, spans columns 2-4
   - Queues panel max-height: `300px`

2. **Mobile/Tablet (max-width: 768px)**:
   - Grid: `1fr` (single column)
   - All panels stack vertically
   - File viewer: `min-height: 200px`
   - Notes panel: `min-height: 300px`
   - Tasks panel: `min-height: 300px`
   - Queues panel: `min-height: 250px`

3. **Small Mobile (max-width: 480px)**:
   - Reduced padding: `0.5rem`
   - Reduced gap: `0.5rem`

### 2.2 Component-Specific CSS

#### NoteTakingPanel.css
- White background with border-radius and box-shadow
- Flex column layout with `height: 100%`
- Back button styling with hover states
- Child components fill panel with `flex: 1`

#### WorkingDirectoryBrowser.css
- White background with border-radius and box-shadow
- Header with flex layout (title + refresh button)
- File tree with expand/collapse icons
- Hover states on file tree nodes
- Empty state styling

#### TaskManagementPanel.css
- White background with border-radius and box-shadow
- Header with flex layout (title + refresh button)
- Task list with scrollable container
- Empty state styling

#### BullMQQueueView.css
- White background with border-radius and box-shadow
- Header with flex layout (title + refresh button)
- Queue cards with border and background color
- Active queue highlighting (blue border)
- Stats grid layout with color-coded values
- Agent tags with blue background

---

## 3. Data Flow and API Dependencies

### 3.1 API Endpoints

#### Conversations API
**Base Path**: `/conversations/api` (or `VITE_API_BASE_URL`)

**Endpoints Used**:
- `GET /conversations/api/list` - List all conversations
- `GET /conversations/api/{conversationId}` - Get single conversation
- `POST /conversations/api/new` - Create new conversation
- `POST /conversations/api/{conversationId}/message` - Add message to conversation

**Functions**:
- `listConversations()`: Returns `Promise<Conversation[]>`
- `getConversationById(id: string)`: Returns `Promise<Conversation>`
- `createConversation()`: Returns `Promise<Conversation>`
- `addMessageToConversation(id: string, message: string)`: Returns `Promise<Conversation>`

**Data Types**:
```typescript
interface Conversation {
  id: string;
  messages: Message[];
  metadata?: {
    repository?: string;
    // ... other metadata
  };
  // ... other fields
}
```

#### Tasks API
**Base Path**: `/api` (or `getApiBasePath()`)

**Endpoints Used**:
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/{taskId}` - Get single task
- `POST /api/tasks` - Create new task (not used in TaskDashboard)

**Functions**:
- `listTasks()`: Returns `Promise<Task[]>`
- `fetchTask(taskId: number)`: Returns `Promise<Task>`
- `getTaskById(taskId: number)`: Returns `Promise<Task>`

**Data Types**:
```typescript
interface Task {
  id: number;
  prompt: string;
  status: number; // 0=ready, 1=complete, etc.
  order: number;
  createdat: string;
  updatedat: string;
  uuid?: string;
}
```

#### Files API
**Base Path**: `/api` (or `getApiBasePath()`)

**Endpoints Used**:
- `GET /api/working-directory/files` - Get working directory file tree

**Functions**:
- `getWorkingDirectoryFiles()`: Returns `Promise<FileNode[]>`

**Data Types**:
```typescript
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}
```

#### Queues API
**Base Path**: `/agents`

**Endpoints Used**:
- `GET /agents/queues` - List all queues

**Functions**:
- `listQueues()`: Returns `Promise<QueueInfo[]>`

**Data Types**:
```typescript
interface QueueInfo {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  agents: string[];
}
```

### 3.2 Cross-Panel Interactions

**Flow 1: Note Conversation Update → Refresh Other Panels**
1. User creates/updates a note conversation in `NoteTakingPanel`
2. `NoteTakingPanel` calls `onConversationUpdate` callback
3. `TaskDashboard.handleNoteConversationUpdate()` is triggered
4. File browser is refreshed via `fileBrowserRef.current?.refresh()`
5. Task panel is refreshed via `taskPanelRef.current?.refresh()`

**Flow 2: Conversation Selection → Update State**
1. User selects a conversation in `NoteTakingPanel`
2. `NoteTakingPanel` calls `onConversationSelect` callback
3. `TaskDashboard` updates `selectedNoteConversationId` state
4. `NoteTakingPanel` receives `conversationId` prop and loads detail view

---

## 4. Error Handling and Edge Cases

### 4.1 Loading States
- All panels show `LoadingSpinner` component while loading
- Loading state is managed per component with `useState<boolean>`

### 4.2 Error States
- All panels show `ErrorMessage` component on error
- Error messages are user-friendly strings
- Errors are caught in try/catch blocks and displayed to user

### 4.3 Empty States
- **WorkingDirectoryBrowser**: "No files found"
- **TaskManagementPanel**: "No tasks found. Tasks are created by cursor-cli."
- **BullMQQueueView**: "No queues found"
- **NoteTakingPanel**: Handled by `ConversationListView` (shows empty list)

### 4.4 Edge Cases
- **No conversations**: NoteTakingPanel shows empty list view
- **No tasks**: TaskManagementPanel shows empty message
- **No files**: WorkingDirectoryBrowser shows empty message
- **No queues**: BullMQQueueView shows empty message
- **Failed API calls**: All components show error messages
- **Network errors**: Handled by fetch error handling

---

## 5. Testing Patterns

### 5.1 Test Files
- `src/components/__tests__/NoteTakingPanel.test.tsx` - Tests NoteTakingPanel component
- Other component tests follow similar patterns

### 5.2 Test Patterns Observed
- Uses React Testing Library
- Tests loading, error, and success states
- Tests user interactions (clicks, selections)
- Mocks API calls
- Tests callback invocations

### 5.3 Test Results
- All 102 tests pass (verified via `npm test`)
- No test failures or errors

---

## 6. Key Implementation Details

### 6.1 Ref Pattern
Both `WorkingDirectoryBrowser` and `TaskManagementPanel` use the ref pattern to expose refresh methods:
- Component uses `forwardRef` wrapper
- `useImperativeHandle` exposes `refresh()` method
- Parent component stores ref and calls `refresh()` when needed

### 6.2 State Synchronization
- `TaskDashboard` manages `selectedNoteConversationId` state
- This state is passed to `NoteTakingPanel` as `conversationId` prop
- When conversation is updated, `handleNoteConversationUpdate` refreshes other panels

### 6.3 Auto-Refresh
- `BullMQQueueView` auto-refreshes every 5 seconds using `setInterval`
- Other panels refresh manually via button clicks or ref calls

### 6.4 File Tree Expansion
- `WorkingDirectoryBrowser` auto-expands first-level directories on initial load
- Expanded state is preserved in `expandedPaths` Set
- State persists across refreshes

---

## 7. File Paths Reference

### Components
- `src/components/TaskDashboard.tsx`
- `src/components/NoteTakingPanel.tsx`
- `src/components/WorkingDirectoryBrowser.tsx`
- `src/components/TaskManagementPanel.tsx`
- `src/components/BullMQQueueView.tsx`

### CSS Files
- `src/components/TaskDashboard.css`
- `src/components/NoteTakingPanel.css`
- `src/components/WorkingDirectoryBrowser.css`
- `src/components/TaskManagementPanel.css`
- `src/components/BullMQQueueView.css`

### API Files
- `src/api/conversations.ts`
- `src/api/tasks.ts`
- `src/api/repositories.ts`
- `src/api/queues.ts`

### Type Files
- `src/types/index.ts` (Conversation, Task types)
- `src/types/file-tree.ts` (FileNode type)

---

## 8. Summary

The TaskDashboard is a four-panel layout that coordinates:
1. **File Viewer** (WorkingDirectoryBrowser) - Shows working directory file tree
2. **Notes Panel** (NoteTakingPanel) - Manages note-taking conversations
3. **Tasks Panel** (TaskManagementPanel) - Displays and manages tasks
4. **Queues Panel** (BullMQQueueView) - Shows BullMQ queue status

Key patterns:
- Ref-based refresh mechanism for file browser and task panel
- Callback-based cross-panel communication
- Responsive CSS grid layout with breakpoints
- Consistent error/loading/empty state handling
- Auto-refresh for queues (5 second interval)
- Manual refresh buttons for all panels

The port to `cursor-executor-front` should maintain these patterns while adapting to TanStack Query for data fetching and mutations.

