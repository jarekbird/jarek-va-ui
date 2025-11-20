# jarek-va-ui

React + TypeScript frontend application for viewing conversation history from cursor-runner.

## Overview

This is a separate frontend application that displays conversation history stored in Redis by the cursor-runner service. It communicates with the cursor-runner API to fetch and display conversations.

## Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **ESLint + Prettier** - Code quality and formatting

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Running Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3002`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Configuration

The API base URL can be configured via environment variable:

- `VITE_API_BASE_URL` - Defaults to `/conversations/api` (relative path)

For development, you can create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3001/conversations/api
```

## API Endpoints

The application expects the following API endpoints from cursor-runner:

- `GET /conversations/api/list` - Returns array of all conversations
- `GET /conversations/api/:conversationId` - Returns a single conversation by ID

## Project Structure

```
jarek-va-ui/
├── src/
│   ├── api/              # API client functions
│   ├── components/       # React components
│   ├── styles/           # CSS styles
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── index.html           # HTML template
├── package.json
├── tsconfig.json
└── vite.config.ts
```

