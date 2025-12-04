# cursor-executor-front Architecture Documentation

**Reference Implementation**: `python-cursor/cursor-executor/cursor-executor-front/src/`

**Purpose**: This document provides a comprehensive understanding of the `cursor-executor-front` application architecture, patterns, and conventions to guide the Task Dashboard implementation.

---

## 1. Project Structure

### 1.1 Directory Layout

```
cursor-executor-front/
├── src/
│   ├── api/              # API client functions
│   │   ├── tasks.ts      # Tasks API functions
│   │   ├── tasks.test.ts # Tasks API tests
│   │   └── client.ts     # Base API client (referenced, may not exist yet)
│   ├── hooks/            # React Query hooks
│   │   ├── useTasksQuery.ts
│   │   └── useTasksQuery.test.tsx
│   ├── routes/           # Route components
│   │   └── conversations/
│   │       └── detail/
│   │           ├── ConversationDetailPage.tsx
│   │           ├── ConversationDetailPage.css
│   │           └── components/
│   │               ├── RelatedTasksPanel.tsx
│   │               ├── RelatedTasksPanel.test.tsx
│   │               └── RelatedTasksPanel.css
│   ├── query/            # TanStack Query setup (referenced, may not exist yet)
│   │   └── queryClient.ts
│   └── types/            # TypeScript type definitions (referenced, may not exist yet)
│       └── task.ts
```

**Note**: Some files are referenced in imports but may not exist yet. The codebase appears to be in early development.

---

## 2. API Layer Patterns

### 2.1 Base API Client

**Location**: `src/api/client.ts` (referenced but may not exist)

**Pattern**: The code references `apiGet` and `ApiError` from `./client`, suggesting a centralized API client pattern.

**Expected Structure**:
```typescript
// src/api/client.ts (inferred pattern)
export class ApiError extends Error {
  status: number;
  statusText: string;
  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.status = status;
    this.statusText = statusText;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new ApiError(
      `API request failed: ${response.statusText}`,
      response.status,
      response.statusText
    );
  }
  return response.json();
}
```

### 2.2 API Function Pattern

**Example**: `src/api/tasks.ts` (lines 1-188)

**Key Patterns**:

1. **Type Definitions**:
   - Parameters interface: `FetchTasksParams`
   - Response interface: `FetchTasksResponse`
   - Backend response interface: `TaskApiResponse` (internal)

2. **Transformation Functions**:
   - `transformTask(apiResponse: TaskApiResponse): Task` - Transforms backend response to frontend type
   - `transformTaskSummary(apiResponse: TaskApiResponse): TaskSummary` - Transforms to summary type
   - `normalizeTimestamp(timestamp: string): string` - Normalizes timestamps to ISO 8601

3. **API Functions**:
   - `fetchTasks(params?: FetchTasksParams): Promise<FetchTasksResponse>`
   - `fetchTask(taskId: number): Promise<Task>`

4. **Error Handling**:
   - Uses `apiGet` which throws `ApiError`
   - Validates required parameters (e.g., `taskId`)
   - URL encodes path parameters

5. **Query Parameter Building**:
   - Uses `URLSearchParams` to build query strings
   - Only includes parameters that are defined
   - Converts values to strings

**Example**:
```typescript
export async function fetchTasks(
  params?: FetchTasksParams
): Promise<FetchTasksResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  // ... more params
  
  const queryString = queryParams.toString();
  const path = `/api/tasks${queryString ? `?${queryString}` : ''}`;
  
  const apiResponses = await apiGet<TaskApiResponse[]>(path);
  const tasks = apiResponses.map(transformTaskSummary);
  
  return {
    tasks,
    pagination: params?.limit || params?.offset
      ? { total: tasks.length, limit: params.limit, offset: params.offset }
      : undefined,
  };
}
```

### 2.3 API Testing Pattern

**Example**: `src/api/tasks.test.ts` (lines 1-186)

**Key Patterns**:

1. **Mocking Strategy**:
   - Mocks the base client (`apiGet`) using Vitest
   - Uses `vi.mock('./client', async (importOriginal) => {...})`
   - Preserves original exports while mocking specific functions

2. **Test Structure**:
   - Uses `describe` blocks for grouping (e.g., `describe('fetchTasks', ...)`)
   - Uses `beforeEach` to clear mocks
   - Tests success cases, error cases, and edge cases

3. **Test Cases**:
   - Transformations (backend → frontend)
   - Query parameter building
   - Error propagation
   - Empty responses
   - Pagination metadata

**Example**:
```typescript
vi.mock('./client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./client')>();
  return {
    ...actual,
    apiGet: vi.fn(),
  };
});

describe('fetchTasks', () => {
  it('should fetch and transform tasks list', async () => {
    const mockApiResponse = [...];
    (apiGet as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockApiResponse);
    
    const result = await fetchTasks();
    
    expect(result.tasks).toHaveLength(2);
    expect(apiGet).toHaveBeenCalledWith('/api/tasks');
  });
});
```

---

## 3. TanStack Query Patterns

### 3.1 Query Client Setup

**Location**: `src/query/queryClient.ts` (referenced but may not exist)

**Pattern**: Code references `createQueryClient()` function.

**Expected Structure**:
```typescript
// src/query/queryClient.ts (inferred pattern)
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      },
    },
  });
}
```

### 3.2 Query Key Factory Pattern

**Example**: `src/hooks/useTasksQuery.ts` (lines 20-25)

**Pattern**: Uses a query key factory for consistent, hierarchical query keys.

```typescript
export const tasksQueryKeys = {
  all: ['tasks'] as const,
  lists: () => [...tasksQueryKeys.all, 'list'] as const,
  list: (params?: FetchTasksParams) =>
    [...tasksQueryKeys.lists(), params] as const,
};
```

**Benefits**:
- Consistent query key structure
- Easy invalidation (e.g., `queryClient.invalidateQueries({ queryKey: tasksQueryKeys.all })`)
- Type-safe query keys

### 3.3 Query Hook Pattern

**Example**: `src/hooks/useTasksQuery.ts` (lines 42-57)

**Key Patterns**:

1. **Hook Signature**:
   - Accepts optional params and options
   - Returns `useQuery` result

2. **Query Configuration**:
   - Uses query key factory
   - Wraps API function in `queryFn`
   - Supports `enabled`, `staleTime`, `gcTime` options

3. **Type Safety**:
   - Generic type parameter: `useQuery<FetchTasksResponse>`
   - Exports types for params and response

**Example**:
```typescript
export function useTasksQuery(
  params?: FetchTasksParams,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
  }
) {
  return useQuery<FetchTasksResponse>({
    queryKey: tasksQueryKeys.list(params),
    queryFn: () => fetchTasks(params),
    enabled: options?.enabled,
    staleTime: options?.staleTime,
    gcTime: options?.gcTime,
  });
}
```

### 3.4 Query Hook Testing Pattern

**Example**: `src/hooks/useTasksQuery.test.tsx` (lines 1-171)

**Key Patterns**:

1. **Test Setup**:
   - Creates QueryClient for each test
   - Wraps hook in `QueryClientProvider`
   - Mocks API functions

2. **Test Wrapper**:
   ```typescript
   const wrapper = ({ children }: { children: React.ReactNode }) => (
     <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
   );
   ```

3. **Test Cases**:
   - Loading state
   - Success state
   - Error state
   - Query key structure
   - Enabled/disabled behavior
   - Different params = different query keys

4. **Async Testing**:
   - Uses `waitFor` for async assertions
   - Uses `renderHook` from `@testing-library/react`

**Example**:
```typescript
const { result } = renderHook(() => useTasksQuery(), { wrapper });

await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});

expect(fetchTasks).toHaveBeenCalledWith(undefined);
expect(result.current.data?.tasks).toEqual(mockTasks);
```

---

## 4. Routing Patterns

### 4.1 Route Component Structure

**Example**: `src/routes/conversations/detail/ConversationDetailPage.tsx` (lines 1-102)

**Key Patterns**:

1. **React Router Integration**:
   - Uses `useParams` to get route parameters
   - Uses `Link` for navigation

2. **TanStack Query Integration**:
   - Uses `useQuery` directly in component (not always via custom hook)
   - Query key: `['conversation', conversationId]`
   - `enabled` option based on route param existence

3. **State Handling**:
   - Loading state: Shows loading spinner
   - Error state: Shows error message with retry button
   - Empty state: Shows "not found" message
   - Success state: Renders main content

4. **Component Structure**:
   - Header with back link
   - Main content area
   - Sidebar (if applicable)

**Example**:
```typescript
export function ConversationDetailPage() {
  const { conversationId } = useParams<{ conversationId: string }>();

  const { data: conversation, isLoading, error, isError } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => {
      if (!conversationId) {
        throw new Error('conversationId is required');
      }
      return fetchConversation(conversationId);
    },
    enabled: !!conversationId,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState error={error} />;
  }

  if (!conversation) {
    return <EmptyState />;
  }

  return <SuccessState conversation={conversation} />;
}
```

### 4.2 Route Component Styling

**Example**: `src/routes/conversations/detail/ConversationDetailPage.css` (lines 1-121)

**Key Patterns**:

1. **Layout**:
   - Uses CSS Grid for main/sidebar layout
   - Responsive breakpoints (tablet, mobile)
   - Max-width container with auto margins

2. **State Styling**:
   - Loading spinner with animation
   - Error container with centered content
   - Empty container styling

3. **Responsive Design**:
   - Grid collapses to single column on mobile
   - Sidebar moves to top on mobile (`order: -1`)

---

## 5. Component Patterns

### 5.1 Component Structure

**Example**: `src/routes/conversations/detail/components/RelatedTasksPanel.tsx` (lines 1-145)

**Key Patterns**:

1. **Props Interface**:
   - Exported interface for props
   - Optional `data-testid` for testing

2. **Query Hook Usage**:
   - Uses custom query hook (`useTasksQuery`)
   - Passes params and options
   - Uses `enabled` option conditionally

3. **State Rendering**:
   - Loading: Shows spinner
   - Error: Shows error message
   - Empty: Shows empty message
   - Success: Renders list

4. **Helper Functions**:
   - Status label mapping
   - CSS class mapping
   - Data transformation

**Example**:
```typescript
export function RelatedTasksPanel({
  conversationId,
  'data-testid': testId,
}: RelatedTasksPanelProps) {
  const { data, isLoading, error, isError } = useTasksQuery(
    { conversation_id: conversationId },
    { enabled: !!conversationId }
  );

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} />;
  if (!data?.tasks.length) return <EmptyState />;

  return <SuccessState tasks={data.tasks} />;
}
```

### 5.2 Component Testing

**Example**: `src/routes/conversations/detail/components/RelatedTasksPanel.test.tsx`

**Key Patterns**:

1. **Test Setup**:
   - Creates QueryClient
   - Mocks API functions
   - Wraps component in QueryClientProvider

2. **Test Cases**:
   - Loading state
   - Error state
   - Empty state
   - Success state with tasks
   - Query hook called with correct params

3. **Rendering**:
   - Uses `render` from `@testing-library/react`
   - Uses `screen` for queries
   - Uses `data-testid` attributes

---

## 6. Type System Patterns

### 6.1 Type Definitions

**Location**: `src/types/task.ts` (referenced but may not exist)

**Expected Structure** (inferred from usage):

```typescript
// src/types/task.ts (inferred pattern)
export enum TaskStatus {
  Ready = 0,
  Complete = 1,
  Archived = 2,
  Backlogged = 3,
  InProgress = 4,
}

export interface TaskSummary {
  id: number;
  prompt: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  order: number;
  uuid: string;
  conversation_id?: string;
}

export interface Task extends TaskSummary {
  logs?: Array<{
    timestamp: string;
    level: string;
    message: string;
    metadata?: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
}
```

### 6.2 Type Usage Patterns

1. **Import Patterns**:
   - Import types: `import type { Task } from '../types/task'`
   - Import enums: `import { TaskStatus } from '../types/task'`
   - Import both: `import type { Task, TaskSummary, TaskStatus } from '../types/task'`

2. **Type Safety**:
   - API functions are typed with generics
   - Query hooks use generic types
   - Props interfaces are exported

---

## 7. Testing Patterns Summary

### 7.1 Test File Organization

- API tests: `src/api/*.test.ts`
- Hook tests: `src/hooks/*.test.tsx`
- Component tests: `src/routes/**/components/*.test.tsx`

### 7.2 Testing Tools

- **Vitest**: Test runner
- **@testing-library/react**: Component testing
- **@tanstack/react-query**: Query testing utilities

### 7.3 Common Test Patterns

1. **Mocking**:
   - Mock API functions with `vi.mock()`
   - Mock base client functions
   - Use `vi.fn()` for function mocks

2. **Async Testing**:
   - Use `waitFor` for async assertions
   - Use `renderHook` for hook testing
   - Set appropriate timeouts

3. **Query Testing**:
   - Create QueryClient for each test
   - Wrap in QueryClientProvider
   - Test loading, success, error states

---

## 8. File Organization Conventions

### 8.1 Directory Structure

- **API layer**: `src/api/` - All API client functions
- **Hooks**: `src/hooks/` - React Query hooks
- **Routes**: `src/routes/` - Route components organized by feature
- **Types**: `src/types/` - TypeScript type definitions
- **Query setup**: `src/query/` - TanStack Query configuration

### 8.2 File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (e.g., `useTasksQuery.ts`)
- API functions: `camelCase.ts` (e.g., `tasks.ts`)
- Types: `camelCase.ts` (e.g., `task.ts`)
- Tests: `*.test.ts` or `*.test.tsx`
- CSS: `ComponentName.css`

### 8.3 Import Patterns

- Relative imports for same directory level
- Absolute imports from `src/` root (if configured)
- Type-only imports: `import type { ... }`

---

## 9. Missing Files and Gaps

### 9.1 Files Referenced But May Not Exist

1. **`src/api/client.ts`**:
   - Should export `apiGet` function
   - Should export `ApiError` class
   - Base URL configuration

2. **`src/api/conversations.ts`**:
   - Should export `fetchConversation` function
   - Should follow same patterns as `tasks.ts`

3. **`src/query/queryClient.ts`**:
   - Should export `createQueryClient` function
   - QueryClient configuration

4. **`src/types/task.ts`**:
   - Should export `Task`, `TaskSummary`, `TaskStatus` types
   - Type definitions for tasks

5. **`src/App.tsx`**:
   - Main app component
   - Route configuration
   - QueryClientProvider setup

6. **`package.json`**, `tsconfig.json`, `vite.config.ts`:
   - Project configuration files

### 9.2 Implementation Notes

When implementing the Task Dashboard:
1. Create missing files following the patterns documented above
2. Follow the existing patterns for API functions, hooks, and components
3. Use the same testing patterns
4. Maintain consistency with existing code style

---

## 10. Summary

### 10.1 Key Patterns

1. **API Layer**:
   - Centralized base client (`apiGet`, `ApiError`)
   - Transformation functions for backend → frontend
   - Type-safe API functions

2. **TanStack Query**:
   - Query key factories for consistent keys
   - Custom hooks wrapping `useQuery`
   - Proper error and loading state handling

3. **Components**:
   - Loading/error/empty/success state rendering
   - Query hook integration
   - Responsive CSS Grid layouts

4. **Testing**:
   - Vitest for test runner
   - Mock API functions
   - Test all states (loading, error, success, empty)

### 10.2 Implementation Guidelines

When implementing Task Dashboard:
- Follow existing API function patterns
- Use query key factories for query keys
- Create custom hooks for queries
- Handle all states (loading, error, empty, success)
- Write tests for all functionality
- Use CSS Grid for layouts
- Follow file naming conventions

---

## 11. Code References

### 11.1 Key Files

- `src/api/tasks.ts` - API function example
- `src/api/tasks.test.ts` - API test example
- `src/hooks/useTasksQuery.ts` - Query hook example
- `src/hooks/useTasksQuery.test.tsx` - Hook test example
- `src/routes/conversations/detail/ConversationDetailPage.tsx` - Route component example
- `src/routes/conversations/detail/components/RelatedTasksPanel.tsx` - Component example

### 11.2 Patterns to Follow

1. **API Functions**: Follow `tasks.ts` pattern
2. **Query Hooks**: Follow `useTasksQuery.ts` pattern
3. **Route Components**: Follow `ConversationDetailPage.tsx` pattern
4. **Panel Components**: Follow `RelatedTasksPanel.tsx` pattern
5. **Testing**: Follow existing test patterns

---

This architecture documentation should guide the implementation of the Task Dashboard to ensure consistency with existing codebase patterns and conventions.

