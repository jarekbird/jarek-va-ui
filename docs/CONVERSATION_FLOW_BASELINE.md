# Conversation & Note-Taking Flow Baseline

This document captures the baseline behavior of the conversation/note-taking system before renaming to "Note Taking History" in Task 3.

## Redis Storage

Conversations are stored in Redis with the key pattern:
- Key: `cursor:conversation:{conversationId}`
- TTL: 3600 seconds (1 hour)
- Format: JSON string containing `ConversationContext`

### ConversationContext Structure

```typescript
interface ConversationContext {
  conversationId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  createdAt: string; // ISO 8601 timestamp
  lastAccessedAt: string; // ISO 8601 timestamp
}
```

## API Endpoints

All endpoints are served by `cursor-runner` at `/conversations/api/*`:

### GET /conversations/api/list
- Returns: Array of `Conversation` objects
- Response: `200 OK` with JSON array
- Error: `500 Internal Server Error` with error object

### GET /conversations/api/:conversationId
- Returns: Single `Conversation` object
- Response: `200 OK` with JSON object
- Error: `404 Not Found` if conversation doesn't exist
- Error: `500 Internal Server Error` for other errors

### POST /conversations/api/new
- Body: `{ queueType?: 'default' | 'telegram' | 'api' }` (optional, defaults to 'api')
- Returns: `{ success: true, conversationId: string, message: string, queueType: string }`
- Response: `200 OK` with JSON object
- Error: `500 Internal Server Error` with error object

## Frontend Components

### ConversationListView
- Fetches conversations via `listConversations()` from `/conversations/api/list`
- Displays list of conversations with creation and last accessed timestamps
- Allows creating new conversations via "New Conversation" button
- Navigates to detail view when a conversation is selected

### ConversationDetailView
- Fetches single conversation via `getConversationById(id)` from `/conversations/api/:conversationId`
- Displays conversation details including all messages
- Shows loading and error states
- Provides back navigation to list view

## Conversation Creation Flow

1. User clicks "New Conversation" button
2. Frontend calls `POST /conversations/api/new` with `{ queueType: 'api' }`
3. Backend creates new conversation in Redis with key `cursor:conversation:{newId}`
4. Backend returns `{ success: true, conversationId: newId }`
5. Frontend navigates to `/conversation/{newId}`
6. Frontend loads conversation details from `/conversations/api/{newId}`

## Conversation Reading Flow

1. User navigates to conversation list or detail view
2. Frontend calls `GET /conversations/api/list` or `GET /conversations/api/:id`
3. Backend reads from Redis key `cursor:conversation:{id}`
4. Backend returns conversation data as JSON
5. Frontend displays conversation data in UI

## Test Coverage

The following automated tests verify the baseline behavior:

- `src/api/__tests__/conversations.test.ts` - Tests API client functions
- `src/components/__tests__/ConversationDetails.test.tsx` - Tests conversation detail component
- `src/components/__tests__/ConversationList.test.tsx` - Tests conversation list component
- `src/__tests__/App.test.tsx` - Tests full app integration

All tests pass and verify:
- Successful API calls return expected data
- Error handling for 404 and 500 responses
- Proper URL construction with default and custom API base URLs
- Component rendering with conversation data

## Notes

- Conversations are stored with a 1-hour TTL in Redis
- The system gracefully handles Redis unavailability (returns empty data)
- Queue types ('default', 'telegram', 'api') are used to track conversation sources
- All timestamps are in ISO 8601 format
- The UI uses relative paths by default (`/conversations/api`) but can be configured via `VITE_API_BASE_URL`

