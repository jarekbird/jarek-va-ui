# Test Suite

This directory contains test utilities and setup files for the jarek-va-ui test suite.

## Test Setup

- `setup.ts` - Global test setup, includes jest-dom matchers and cleanup
- `test-utils.tsx` - Custom render function for React Testing Library

## Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are co-located with their source files:
- Component tests: `src/components/__tests__/`
- API tests: `src/api/__tests__/`
- App tests: `src/__tests__/`

## Writing Tests

Use the custom `render` function from `test-utils.tsx`:

```tsx
import { render, screen } from '../test/test-utils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

