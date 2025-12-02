# Routing Configuration

## Router Choice

**React Router** has been chosen as the routing solution for this application.

### Rationale

- React Router is already installed and integrated in the codebase
- It's a mature, well-documented solution with strong community support
- It integrates well with React and TanStack Query
- The existing codebase already uses React Router patterns

### Installed Packages

- `react-router-dom@^7.9.6` - Main routing library for React web applications
- `@types/react-router-dom@^5.3.3` - TypeScript type definitions

### Current Setup

The router is configured in `src/main.tsx` with automatic basename detection.  
When the UI is served behind Traefik at `/conversations`, the browser pathname will
start with `/conversations`, so the router trims that prefix before matching routes.
When running locally (e.g. `http://localhost:3002`), the basename falls back to `/`.

```tsx
const SUPPORTED_BASENAMES = ['/conversations'];
const basename = detectBasename(); // returns '/conversations' or '/'

<BrowserRouter basename={basename === '/' ? undefined : basename}>
  <App />
</BrowserRouter>
```

Routes are defined in `src/App.tsx`:

- `/` - Conversation list view
- `/conversation/:conversationId` - Conversation detail view
- `/tasks` - Task list view
- `/task/:id` - Task detail view

### Future Considerations

If migration to TanStack Router is desired in the future, the following would need to be done:
1. Install `@tanstack/react-router`
2. Update route definitions to use TanStack Router's file-based routing
3. Update all navigation code
4. Update tests

For now, React Router provides all necessary functionality for the application.



