# Backend API Contracts for Task Dashboard

**Backend Implementation**: `python-cursor/cursor-executor/cursor-executor-back/`

**Purpose**: This document provides a comprehensive inventory of all backend API endpoints required by the Task Dashboard, including their request/response shapes, error handling, and status (exists/missing).

---

## 1. Conversations Endpoints

### 1.1 List Conversations

**Endpoint**: `GET /api/list`

**Status**: ✅ **EXISTS**

**Location**: `cursor_executor/api/server.py` (lines 748-777)

**Description**: Get list of all conversations.

**Request**:
- Method: `GET`
- Path: `/api/list`
- Query Parameters: None
- Body: None

**Response**:
- Status Code: `200`
- Content-Type: `application/json`
- Body: Array of conversation objects
  ```json
  [
    {
      "conversationId": "string",
      "messages": [
        {
          "role": "string",
          "content": "string",
          "timestamp": "string"
        }
      ],
      "createdAt": "string",
      "lastAccessedAt": "string"
    }
  ]
  ```

**Error Responses**:
- `500`: Server error
  ```json
  {
    "success": false,
    "error": "string"
  }
  ```

**Notes**:
- Returns all conversations from Redis
- Messages are included in response
- Timestamps are ISO 8601 strings

---

### 1.2 Get Single Conversation

**Endpoint**: `GET /api/{conversation_id}`

**Status**: ✅ **EXISTS**

**Location**: `cursor_executor/api/server.py` (lines 909-952)

**Description**: Get a specific conversation by ID.

**Request**:
- Method: `GET`
- Path: `/api/{conversation_id}`
- Path Parameters:
  - `conversation_id` (string): Conversation ID
- Query Parameters: None
- Body: None

**Response**:
- Status Code: `200`
- Content-Type: `application/json`
- Body: Conversation object
  ```json
  {
    "conversationId": "string",
    "messages": [
      {
        "role": "string",
        "content": "string",
        "timestamp": "string"
      }
    ],
    "createdAt": "string",
    "lastAccessedAt": "string"
  }
  ```

**Error Responses**:
- `404`: Conversation not found
  ```json
  {
    "success": false,
    "error": "Conversation not found"
  }
  ```
- `500`: Server error
  ```json
  {
    "success": false,
    "error": "string"
  }
  ```

**Notes**:
- Reserved paths (`tasks`, `agent`, `working-directory`) return 404
- Returns conversation from Redis

---

### 1.3 Create New Conversation

**Endpoint**: `POST /api/new`

**Status**: ✅ **EXISTS**

**Location**: `cursor_executor/api/server.py` (lines 780-822)

**Description**: Create a new conversation.

**Request**:
- Method: `POST`
- Path: `/api/new`
- Query Parameters: None
- Body:
  ```json
  {
    "queueType": "default" | "telegram" | "api"  // optional, defaults to "api"
  }
  ```

**Response**:
- Status Code: `200`
- Content-Type: `application/json`
- Body:
  ```json
  {
    "success": true,
    "conversationId": "string",
    "message": "New conversation created",
    "queueType": "string"
  }
  ```

**Error Responses**:
- `500`: Server error
  ```json
  {
    "success": false,
    "error": "string",
    "timestamp": "string"
  }
  ```

**Notes**:
- Creates new conversation in Redis
- Returns new conversation ID

---

### 1.4 Add Message to Conversation

**Endpoint**: `POST /api/{conversation_id}/message`

**Status**: ✅ **EXISTS**

**Location**: `cursor_executor/api/server.py` (lines 955-1055)

**Description**: Send a message to a conversation and trigger cursor execution.

**Request**:
- Method: `POST`
- Path: `/api/{conversation_id}/message`
- Path Parameters:
  - `conversation_id` (string): Conversation ID
- Query Parameters: None
- Body:
  ```json
  {
    "message": "string",  // required, non-empty string
    "repository": "string",  // optional
    "branchName": "string"  // optional
  }
  ```

**Response**:
- Status Code: `200`
- Content-Type: `application/json`
- Body:
  ```json
  {
    "success": true,
    "message": "Message sent",
    "requestId": "string",
    "conversationId": "string"
  }
  ```

**Error Responses**:
- `400`: Invalid request (missing or empty message)
  ```json
  {
    "success": false,
    "error": "Message is required and must be a non-empty string"
  }
  ```
- `404`: Conversation not found
  ```json
  {
    "success": false,
    "error": "Conversation not found"
  }
  ```
- `500`: Server error
  ```json
  {
    "success": false,
    "error": "string",
    "timestamp": "string"
  }
  ```

**Notes**:
- Triggers async cursor execution
- Returns immediately (does not wait for execution)
- Message is added to conversation in Redis

---

## 2. Tasks Endpoints

### 2.1 List Tasks

**Endpoint**: `GET /api/tasks`

**Status**: ✅ **EXISTS**

**Location**: `cursor_executor/api/server.py` (lines 1375-1410)

**Description**: List all tasks, optionally filtered by status.

**Request**:
- Method: `GET`
- Path: `/api/tasks`
- Query Parameters:
  - `status` (number, optional): Filter by task status (0=ready, 1=complete, 2=archived, 3=backlogged, 4=in_progress)
- Body: None

**Response**:
- Status Code: `200`
- Content-Type: `application/json`
- Body: Array of task objects
  ```json
  [
    {
      "id": 1,
      "prompt": "string",
      "status": 0,
      "status_label": "ready",
      "createdat": "string",
      "updatedat": "string",
      "order": 0,
      "uuid": "string"
    }
  ]
  ```

**Error Responses**:
- `400`: Invalid status parameter
  ```json
  {
    "success": false,
    "error": "Invalid status parameter. Must be a number."
  }
  ```
- `500`: Server error
  ```json
  {
    "success": false,
    "error": "string"
  }
  ```

**Notes**:
- Returns tasks from SQLite database
- Status enum values: 0=READY, 1=COMPLETE, 2=ARCHIVED, 3=BACKLOGGED, 4=IN_PROGRESS
- Tasks are sorted by order field (ascending)

---

### 2.2 Get Single Task

**Endpoint**: `GET /api/tasks/{id}`

**Status**: ✅ **EXISTS**

**Location**: `cursor_executor/api/server.py` (lines 1413-1449)

**Description**: Get a specific task by ID.

**Request**:
- Method: `GET`
- Path: `/api/tasks/{id}`
- Path Parameters:
  - `id` (string): Task ID (must be a number)
- Query Parameters: None
- Body: None

**Response**:
- Status Code: `200`
- Content-Type: `application/json`
- Body: Task object
  ```json
  {
    "id": 1,
    "prompt": "string",
    "status": 0,
    "status_label": "ready",
    "createdat": "string",
    "updatedat": "string",
    "order": 0,
    "uuid": "string"
  }
  ```

**Error Responses**:
- `400`: Invalid task ID
  ```json
  {
    "success": false,
    "error": "Invalid task ID. Must be a number."
  }
  ```
- `404`: Task not found
  ```json
  {
    "success": false,
    "error": "Task not found"
  }
  ```
- `500`: Server error
  ```json
  {
    "success": false,
    "error": "string"
  }
  ```

**Notes**:
- Task ID must be a valid integer
- Returns task from SQLite database

---

### 2.3 Create Task

**Endpoint**: `POST /api/tasks`

**Status**: ✅ **EXISTS**

**Location**: `cursor_executor/api/server.py` (lines 1452-1486)

**Description**: Create a new task.

**Request**:
- Method: `POST`
- Path: `/api/tasks`
- Query Parameters: None
- Body:
  ```json
  {
    "prompt": "string",  // required, non-empty string
    "order": 0,  // optional, defaults to 0
    "status": 0  // optional, defaults to 0 (READY)
  }
  ```

**Response**:
- Status Code: `201`
- Content-Type: `application/json`
- Body: Task object
  ```json
  {
    "id": 1,
    "prompt": "string",
    "status": 0,
    "status_label": "ready",
    "createdat": "string",
    "updatedat": "string",
    "order": 0,
    "uuid": "string"
  }
  ```

**Error Responses**:
- `400`: Invalid request (missing or empty prompt)
  ```json
  {
    "success": false,
    "error": "Prompt is required and must be a non-empty string"
  }
  ```
- `500`: Server error
  ```json
  {
    "success": false,
    "error": "string"
  }
  ```

**Notes**:
- Creates task in SQLite database
- Auto-generates UUID if not provided
- Sets createdat and updatedat timestamps

---

### 2.4 Update Task

**Endpoint**: `PUT /api/tasks/{id}`

**Status**: ✅ **EXISTS**

**Location**: `cursor_executor/api/server.py` (lines 1489-1561)

**Description**: Update a task.

**Request**:
- Method: `PUT`
- Path: `/api/tasks/{id}`
- Path Parameters:
  - `id` (string): Task ID (must be a number)
- Query Parameters: None
- Body:
  ```json
  {
    "prompt": "string",  // optional
    "status": 0,  // optional
    "order": 0  // optional
  }
  ```

**Response**:
- Status Code: `200`
- Content-Type: `application/json`
- Body: Updated task object
  ```json
  {
    "id": 1,
    "prompt": "string",
    "status": 0,
    "status_label": "ready",
    "createdat": "string",
    "updatedat": "string",
    "order": 0,
    "uuid": "string"
  }
  ```

**Error Responses**:
- `400`: Invalid request
  - Invalid task ID: `{"success": false, "error": "Invalid task ID. Must be a number."}`
  - Invalid prompt: `{"success": false, "error": "Prompt must be a non-empty string"}`
  - Invalid status: `{"success": false, "error": "Status must be a number"}`
  - Invalid order: `{"success": false, "error": "Order must be a number"}`
- `404`: Task not found
  ```json
  {
    "success": false,
    "error": "Task not found"
  }
  ```
- `500`: Server error
  ```json
  {
    "success": false,
    "error": "string"
  }
  ```

**Notes**:
- Only provided fields are updated
- Updatedat timestamp is automatically updated
- Status must be valid TaskStatus enum value

---

### 2.5 Delete Task

**Endpoint**: `DELETE /api/tasks/{id}`

**Status**: ✅ **EXISTS**

**Location**: `cursor_executor/api/server.py` (lines 1564-1600+)

**Description**: Delete a task.

**Request**:
- Method: `DELETE`
- Path: `/api/tasks/{id}`
- Path Parameters:
  - `id` (string): Task ID (must be a number)
- Query Parameters: None
- Body: None

**Response**:
- Status Code: `200`
- Content-Type: `application/json`
- Body:
  ```json
  {
    "success": true,
    "message": "Task deleted"
  }
  ```

**Error Responses**:
- `400`: Invalid task ID
  ```json
  {
    "success": false,
    "error": "Invalid task ID. Must be a number."
  }
  ```
- `404`: Task not found
  ```json
  {
    "success": false,
    "error": "Task not found"
  }
  ```
- `500`: Server error
  ```json
  {
    "success": false,
    "error": "string"
  }
  ```

**Notes**:
- Permanently deletes task from SQLite database
- Not used by TaskDashboard (tasks are managed by cursor-cli)

---

## 3. Files Endpoints

### 3.1 Get Working Directory Files

**Endpoint**: `GET /api/working-directory/files`

**Status**: ✅ **EXISTS**

**Location**: `cursor_executor/api/server.py` (lines 825-906)

**Description**: Get file tree for the cursor working directory.

**Request**:
- Method: `GET`
- Path: `/api/working-directory/files`
- Query Parameters: None
- Body: None

**Response**:
- Status Code: `200`
- Content-Type: `application/json`
- Body: Array of FileNode objects
  ```json
  [
    {
      "name": "string",
      "path": "string",
      "type": "file" | "directory",
      "children": [
        {
          "name": "string",
          "path": "string",
          "type": "file" | "directory",
          "children": []
        }
      ]
    }
  ]
  ```

**Error Responses**:
- `404`: Working directory not found
  ```json
  {
    "success": false,
    "error": "Working directory not found: {path}",
    "timestamp": "string"
  }
  ```
- `500`: Server error
  ```json
  {
    "success": false,
    "error": "string",
    "timestamp": "string"
  }
  ```

**Notes**:
- Uses REPOSITORIES_PATH parent directory (or TARGET_APP_PATH as fallback)
- Returns hierarchical file tree structure
- Ignores common patterns (.git, node_modules, *.log, etc.)
- FileNode structure matches frontend type definition

---

### 3.2 Get Repository Files

**Endpoint**: `GET /repositories/api/{repository}/files`

**Status**: ✅ **EXISTS**

**Location**: `cursor_executor/api/server.py` (lines 1059-1113)

**Description**: Get file tree for a repository.

**Request**:
- Method: `GET`
- Path: `/repositories/api/{repository}/files`
- Path Parameters:
  - `repository` (string): Repository name
- Query Parameters: None
- Body: None

**Response**:
- Status Code: `200`
- Content-Type: `application/json`
- Body: Array of FileNode objects (same structure as working directory files)

**Error Responses**:
- `400`: Repository name required
  ```json
  {
    "success": false,
    "error": "Repository name is required"
  }
  ```
- `404`: Repository not found
  ```json
  {
    "success": false,
    "error": "Repository '{repository}' not found"
  }
  ```
- `500`: Server error
  ```json
  {
    "success": false,
    "error": "string",
    "timestamp": "string"
  }
  ```

**Notes**:
- Repository path is constructed from REPOSITORIES_PATH + repository name
- Returns hierarchical file tree structure
- Not used by TaskDashboard (uses working directory endpoint)

---

## 4. Queue Status Endpoints

### 4.1 Get Queue Status

**Endpoint**: `GET /health/queue`

**Status**: ✅ **EXISTS** (but may not match BullMQQueueView requirements)

**Location**: `cursor_executor/api/server.py` (lines 218-249)

**Description**: Diagnostic endpoint for execution queue status.

**Request**:
- Method: `GET`
- Path: `/health/queue`
- Query Parameters: None
- Body: None

**Response**:
- Status Code: `200`
- Content-Type: `application/json`
- Body:
  ```json
  {
    "status": "ok",
    "service": "cursor-executor",
    "queue": {
      "available": 5,
      "waiting": 0
    },
    "warning": "string"  // optional, present when all slots occupied
  }
  ```

**Error Responses**:
- `503`: Cursor CLI not initialized
  ```json
  {
    "detail": "Cursor CLI not initialized"
  }
  ```

**Notes**:
- Returns cursor-cli execution queue status
- Shows available slots and waiting jobs
- **Gap**: This endpoint does NOT match the BullMQQueueView requirements
  - BullMQQueueView expects: `{ queues: QueueInfo[] }`
  - QueueInfo structure: `{ name, waiting, active, completed, failed, delayed, agents: string[] }`
  - Current endpoint only shows cursor-cli queue, not BullMQ queues

---

### 4.2 BullMQ Queue Status (Missing)

**Endpoint**: `GET /agents/queues` (or similar)

**Status**: ❌ **MISSING**

**Description**: Get BullMQ queue status with detailed metrics.

**Required Request**:
- Method: `GET`
- Path: `/agents/queues` (or `/api/queues`)
- Query Parameters: None
- Body: None

**Required Response**:
- Status Code: `200`
- Content-Type: `application/json`
- Body:
  ```json
  {
    "queues": [
      {
        "name": "string",
        "waiting": 0,
        "active": 0,
        "completed": 0,
        "failed": 0,
        "delayed": 0,
        "agents": ["string"]
      }
    ]
  }
  ```

**Notes**:
- **Gap**: This endpoint needs to be implemented in backend
- Should connect to BullMQ Redis instance
- Should return queue metrics for all active queues
- Should include agent information
- Reference implementation in `jarek-va-ui` uses `/agents/queues` endpoint

---

## 5. Endpoint Status Summary

### 5.1 Conversations Endpoints

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/list` | GET | ✅ EXISTS | Lists all conversations |
| `/api/{conversation_id}` | GET | ✅ EXISTS | Get single conversation |
| `/api/new` | POST | ✅ EXISTS | Create new conversation |
| `/api/{conversation_id}/message` | POST | ✅ EXISTS | Add message to conversation |

**Status**: ✅ **All required endpoints exist**

---

### 5.2 Tasks Endpoints

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/tasks` | GET | ✅ EXISTS | List tasks (with status filter) |
| `/api/tasks/{id}` | GET | ✅ EXISTS | Get single task |
| `/api/tasks` | POST | ✅ EXISTS | Create task |
| `/api/tasks/{id}` | PUT | ✅ EXISTS | Update task |
| `/api/tasks/{id}` | DELETE | ✅ EXISTS | Delete task |

**Status**: ✅ **All required endpoints exist**

**Gaps**:
- ❌ Missing query parameters for filtering by `conversation_id` in list endpoint
- ❌ Missing query parameters for sorting (`sortBy`, `sortOrder`) in list endpoint
- ❌ Missing query parameters for pagination (`limit`, `offset`) in list endpoint

**Workaround**: Frontend can filter/sort/paginate client-side, but server-side support would be better.

---

### 5.3 Files Endpoints

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/working-directory/files` | GET | ✅ EXISTS | Get working directory file tree |
| `/repositories/api/{repository}/files` | GET | ✅ EXISTS | Get repository file tree |

**Status**: ✅ **All required endpoints exist**

---

### 5.4 Queue Endpoints

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/health/queue` | GET | ✅ EXISTS | Cursor CLI queue status (doesn't match requirements) |
| `/agents/queues` | GET | ❌ MISSING | BullMQ queue status (needed for BullMQQueueView) |

**Status**: ⚠️ **Partially exists - missing BullMQ endpoint**

**Gaps**:
- ❌ Missing BullMQ queue status endpoint
- Current `/health/queue` endpoint only shows cursor-cli execution queue
- BullMQQueueView needs detailed queue metrics (waiting, active, completed, failed, delayed, agents)

---

## 6. Gap Analysis

### 6.1 High Priority Gaps

1. **BullMQ Queue Status Endpoint** (❌ MISSING)
   - **Impact**: BullMQQueueView cannot function without this endpoint
   - **Required**: `GET /agents/queues` (or `/api/queues`)
   - **Response Format**: `{ queues: QueueInfo[] }`
   - **QueueInfo Structure**: `{ name, waiting, active, completed, failed, delayed, agents: string[] }`
   - **Implementation**: Needs to connect to BullMQ Redis instance and query queue metrics

### 6.2 Medium Priority Gaps

2. **Tasks List Filtering** (⚠️ PARTIAL)
   - **Impact**: TaskManagementPanel may need to filter by conversation_id
   - **Current**: Only supports `status` filter
   - **Missing**: `conversation_id`, `sortBy`, `sortOrder`, `limit`, `offset` query parameters
   - **Workaround**: Frontend can filter/sort client-side

### 6.3 Low Priority Gaps

3. **No Critical Gaps** - All other endpoints exist and function correctly

---

## 7. Error Handling Patterns

### 7.1 Standard Error Response Format

All endpoints use consistent error response format:

```json
{
  "success": false,
  "error": "Error message string"
}
```

Additional fields may include:
- `timestamp`: ISO 8601 timestamp string
- `detail`: Additional error details

### 7.2 HTTP Status Codes

- `200`: Success
- `201`: Created (for POST endpoints that create resources)
- `400`: Bad Request (validation errors, invalid parameters)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error (server errors)
- `503`: Service Unavailable (service not initialized)

### 7.3 Error Handling Notes

- All endpoints catch exceptions and return appropriate HTTP status codes
- Error messages are user-friendly strings
- Validation errors return `400` with descriptive messages
- Missing resources return `404`
- Server errors return `500` with error details

---

## 8. Authentication and Authorization

**Current State**: No authentication/authorization implemented

**Notes**:
- All endpoints are currently unauthenticated
- No API keys or tokens required
- All endpoints are publicly accessible
- Future implementation may require authentication

---

## 9. CORS Configuration

**Current State**: CORS middleware is configured

**Location**: `cursor_executor/api/server.py` (lines 60-70)

**Configuration**:
- Allows all origins (`*`)
- Allows all methods
- Allows all headers

**Notes**:
- CORS is enabled for all routes
- No restrictions on cross-origin requests

---

## 10. Implementation Notes

### 10.1 Backend Service Initialization

All endpoints depend on global service instances initialized in `startup_event()`:
- `cursor_execution`: CursorExecutionService
- `task_service`: TaskService
- `file_tree_service`: FileTreeService
- `filesystem`: FilesystemService
- `git_service`: GitService
- `cursor_cli`: CursorCLI

If services are not initialized, endpoints return `503 Service Unavailable`.

### 10.2 Data Storage

- **Conversations**: Stored in Redis (via ConversationService)
- **Tasks**: Stored in SQLite (via TaskService)
- **File Trees**: Generated on-demand from filesystem (via FileTreeService)

### 10.3 Response Format

All endpoints return `JSONResponse` with:
- Consistent error format
- Proper HTTP status codes
- Structured data (objects/arrays)
- ISO 8601 timestamps

---

## 11. Summary

### 11.1 Endpoint Coverage

- **Conversations**: ✅ 100% (4/4 endpoints exist)
- **Tasks**: ✅ 100% (5/5 endpoints exist, but filtering could be enhanced)
- **Files**: ✅ 100% (2/2 endpoints exist)
- **Queues**: ⚠️ 50% (1/2 endpoints exist, missing BullMQ endpoint)

### 11.2 Critical Gaps

1. **BullMQ Queue Status Endpoint** - Required for BullMQQueueView component
   - Must be implemented before BullMQQueueView can function
   - Should return queue metrics in format expected by frontend

### 11.3 Recommended Next Steps

1. **Implement BullMQ Queue Status Endpoint**:
   - Create `GET /agents/queues` endpoint
   - Connect to BullMQ Redis instance
   - Query queue metrics for all active queues
   - Return data in format: `{ queues: QueueInfo[] }`

2. **Enhance Tasks List Endpoint** (optional):
   - Add `conversation_id` query parameter
   - Add `sortBy` and `sortOrder` query parameters
   - Add `limit` and `offset` query parameters for pagination

3. **Frontend Implementation**:
   - Can proceed with Task Dashboard implementation
   - Use existing endpoints for conversations, tasks, and files
   - Stub BullMQQueueView until queue endpoint is implemented

---

This documentation should guide both frontend implementation and backend gap-filling efforts.

