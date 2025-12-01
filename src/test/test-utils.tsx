import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with any providers
 * This can be extended to include providers like Router, Theme, etc.
 */
// eslint-disable-next-line react-refresh/only-export-components
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  // Use MemoryRouter in tests without basename for simplicity
  // Components that need routing will work with routes relative to "/"
  // Default to root route since basename is auto-detected in production
  return <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { customRender as render };
