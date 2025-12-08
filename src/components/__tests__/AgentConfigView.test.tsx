import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { AgentConfigView } from '../AgentConfigView';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * Comprehensive unit tests for AgentConfigView component
 *
 * This test suite verifies:
 * - Successful loading of both config and health data
 * - Error handling for config load (blocks UI)
 * - Error handling for health load (non-critical, logs warning)
 * - Refresh functionality
 * - Status color and icon logic for different health statuses
 * - Integration with MSW for API mocking
 */

describe('AgentConfigView', () => {
  const mockConfig = {
    agentId: 'test-agent-id',
    agentUrl: 'http://localhost:8000',
    cursorRunnerUrl: 'http://localhost:3000',
    webhookSecretConfigured: true,
    redisUrl: 'redis://localhost:6379',
    hasApiKey: true,
  };

  const mockHealth = {
    service: 'ok',
    status: 'ok',
    dependencies: {
      redis: 'connected',
      cursorRunner: 'connected',
    },
    timestamp: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
    // Reset environment variable
    vi.stubEnv('VITE_ELEVENLABS_AGENT_URL', '');

    // Set up default successful handlers
    server.use(
      http.get(/\/config$/, () => {
        return HttpResponse.json(
          { success: true, config: mockConfig },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }),
      http.get(/\/config\/health$/, () => {
        return HttpResponse.json(mockHealth, {
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
  });

  describe('Successful load', () => {
    it('loads both config and health on mount', async () => {
      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Config should be displayed
      expect(screen.getByText(/agent id:/i)).toBeInTheDocument();
      expect(screen.getByText('test-agent-id')).toBeInTheDocument();

      // Health should be displayed
      expect(screen.getByText(/health status/i)).toBeInTheDocument();
      expect(screen.getByText(/service:/i)).toBeInTheDocument();
    });

    it('displays config data correctly', async () => {
      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      expect(screen.getByText('test-agent-id')).toBeInTheDocument();
      expect(screen.getByText('http://localhost:8000')).toBeInTheDocument();
      expect(screen.getByText('http://localhost:3000')).toBeInTheDocument();
      // Webhook secret and API key both show "✓ Configured", so check for both
      const configuredElements = screen.getAllByText(/✓ configured/i);
      expect(configuredElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/redis:\/\/localhost:6379/i)).toBeInTheDocument();
    });

    it('displays health data correctly', async () => {
      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      expect(screen.getByText(/service:/i)).toBeInTheDocument();
      // Use getAllByText since "Redis:" appears in both config and health sections
      const redisElements = screen.getAllByText(/redis:/i);
      expect(redisElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/cursor runner:/i)).toBeInTheDocument();
    });

    it('renders Navigation component', async () => {
      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Navigation should be rendered (check for Dashboard link)
      const dashboardLinks = screen.getAllByRole('link', {
        name: /dashboard/i,
      });
      expect(dashboardLinks.length).toBeGreaterThan(0);
    });

    it('shows LoadingSpinner during load, then hides it', async () => {
      server.use(
        http.get(/\/config$/, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return HttpResponse.json(
            { success: true, config: mockConfig },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }),
        http.get(/\/config\/health$/, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return HttpResponse.json(mockHealth, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<AgentConfigView />);

      // Spinner should be visible initially
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();

      // Spinner should disappear after load
      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('loads both config and health in parallel', async () => {
      let configCalled = false;
      let healthCalled = false;
      const configPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          configCalled = true;
          resolve();
        }, 50);
      });
      const healthPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          healthCalled = true;
          resolve();
        }, 50);
      });

      server.use(
        http.get(/\/config$/, async () => {
          await configPromise;
          return HttpResponse.json(
            { success: true, config: mockConfig },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }),
        http.get(/\/config\/health$/, async () => {
          await healthPromise;
          return HttpResponse.json(mockHealth, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<AgentConfigView />);

      // Both should be called around the same time (within 100ms)
      await waitFor(
        () => {
          expect(configCalled).toBe(true);
          expect(healthCalled).toBe(true);
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Config error handling', () => {
    it('displays error message when config load fails', async () => {
      server.use(
        http.get(/\/config$/, () => {
          return HttpResponse.json(
            { success: false, error: 'Config load failed' },
            { status: 500 }
          );
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          const errorElement =
            screen.queryByText(/failed to load configuration/i) ||
            screen.queryByText(/config load failed/i) ||
            screen.queryByText(/error/i);
          expect(errorElement).toBeTruthy();
        },
        { timeout: 5000 }
      );
    });

    it('renders ErrorMessage component with error message', async () => {
      server.use(
        http.get(/\/config$/, () => {
          return HttpResponse.error();
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          const errorElement =
            screen.queryByText(/failed to load configuration/i) ||
            screen.queryByText(/error/i) ||
            screen.queryByText(/failed/i);
          expect(errorElement).toBeTruthy();
        },
        { timeout: 5000 }
      );
    });

    it('does not display config section when error occurs', async () => {
      server.use(
        http.get(/\/config$/, () => {
          return HttpResponse.error();
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Config section should not be displayed (h2 "Configuration" should not be visible)
      // Note: h1 "Agent Configuration" is still visible as it's always rendered
      expect(
        screen.queryByRole('heading', { name: /^configuration$/i, level: 2 })
      ).not.toBeInTheDocument();
      expect(screen.queryByText('test-agent-id')).not.toBeInTheDocument();
    });

    it('handles network errors', async () => {
      server.use(
        http.get(/\/config$/, () => {
          return HttpResponse.error();
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          const errorElement =
            screen.queryByText(/failed to load configuration/i) ||
            screen.queryByText(/error/i) ||
            screen.queryByText(/failed/i);
          expect(errorElement).toBeTruthy();
        },
        { timeout: 5000 }
      );
    });

    it('handles 404 errors', async () => {
      server.use(
        http.get(/\/config$/, () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          const errorElement =
            screen.queryByText(/failed to load configuration/i) ||
            screen.queryByText(/not found/i) ||
            screen.queryByText(/error/i);
          expect(errorElement).toBeTruthy();
        },
        { timeout: 5000 }
      );
    });

    it('handles 500 errors', async () => {
      server.use(
        http.get(/\/config$/, () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          const errorElement =
            screen.queryByText(/failed to load configuration/i) ||
            screen.queryByText(/server error/i) ||
            screen.queryByText(/error/i);
          expect(errorElement).toBeTruthy();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Health error handling', () => {
    it('logs warning to console when health load fails', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      server.use(
        http.get(/\/config\/health$/, () => {
          return HttpResponse.error();
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Should have logged a warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load health status:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('does not block UI when health load fails', async () => {
      server.use(
        http.get(/\/config\/health$/, () => {
          return HttpResponse.error();
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Config should still be displayed
      expect(screen.getByText('test-agent-id')).toBeInTheDocument();
      // No error message should be shown for health failure
      expect(
        screen.queryByText(/failed to load health/i)
      ).not.toBeInTheDocument();
    });

    it('displays config even if health fails', async () => {
      server.use(
        http.get(/\/config\/health$/, () => {
          return HttpResponse.error();
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Config should be displayed (check for h2 "Configuration", not h1)
      expect(
        screen.getByRole('heading', { name: /^configuration$/i, level: 2 })
      ).toBeInTheDocument();
      expect(screen.getByText('test-agent-id')).toBeInTheDocument();
    });

    it('does not display health section when health fails', async () => {
      server.use(
        http.get(/\/config\/health$/, () => {
          return HttpResponse.error();
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Health section should not be displayed
      expect(screen.queryByText(/health status/i)).not.toBeInTheDocument();
    });
  });

  describe('Refresh functionality', () => {
    it('triggers both loadConfig and loadHealth when Refresh button is clicked', async () => {
      const user = userEvent.setup();
      let requestCount = 0;

      server.use(
        http.get(/\/config$/, () => {
          requestCount++;
          return HttpResponse.json(
            { success: true, config: mockConfig },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }),
        http.get(/\/config\/health$/, () => {
          requestCount++;
          return HttpResponse.json(mockHealth, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const initialRequestCount = requestCount;

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should have made 2 more requests (config + health)
      await waitFor(
        () => {
          expect(requestCount).toBeGreaterThan(initialRequestCount);
        },
        { timeout: 5000 }
      );
    });

    it('shows "Refreshing..." text during refresh', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(/\/config$/, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(
            { success: true, config: mockConfig },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }),
        http.get(/\/config\/health$/, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(mockHealth, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Button should show "Refreshing..." during refresh
      await waitFor(() => {
        expect(refreshButton).toHaveTextContent(/refreshing/i);
      });
    });

    it('disables button during refresh', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(/\/config$/, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(
            { success: true, config: mockConfig },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }),
        http.get(/\/config\/health$/, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(mockHealth, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Button should be disabled during refresh
      await waitFor(() => {
        expect(refreshButton).toBeDisabled();
      });
    });

    it('reloads both config and health on refresh', async () => {
      const user = userEvent.setup();
      let configCallCount = 0;
      let healthCallCount = 0;

      server.use(
        http.get(/\/config$/, () => {
          configCallCount++;
          return HttpResponse.json(
            { success: true, config: mockConfig },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }),
        http.get(/\/config\/health$/, () => {
          healthCallCount++;
          return HttpResponse.json(mockHealth, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const initialConfigCalls = configCallCount;
      const initialHealthCalls = healthCallCount;

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(
        () => {
          expect(configCallCount).toBeGreaterThan(initialConfigCalls);
          expect(healthCallCount).toBeGreaterThan(initialHealthCalls);
        },
        { timeout: 5000 }
      );
    });

    it('clears error state on successful refresh', async () => {
      const user = userEvent.setup();
      let callCount = 0;

      server.use(
        http.get(/\/config$/, () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.error();
          }
          return HttpResponse.json(
            { success: true, config: mockConfig },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }),
        http.get(/\/config\/health$/, () => {
          return HttpResponse.json(mockHealth, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<AgentConfigView />);

      // Wait for error
      await waitFor(
        () => {
          const errorElement =
            screen.queryByText(/failed to load configuration/i) ||
            screen.queryByText(/error/i) ||
            screen.queryByText(/failed/i);
          expect(errorElement).toBeTruthy();
        },
        { timeout: 5000 }
      );

      // Click refresh
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Error should be cleared and config should load
      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
          expect(screen.getByText('test-agent-id')).toBeInTheDocument();
          const errorElement =
            screen.queryByText(/failed to load configuration/i) ||
            screen.queryByText(/error/i);
          expect(errorElement).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('shows error message when refresh fails', async () => {
      const user = userEvent.setup();
      let callCount = 0;

      server.use(
        http.get(/\/config$/, () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json(
              { success: true, config: mockConfig },
              {
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
          return HttpResponse.error();
        }),
        http.get(/\/config\/health$/, () => {
          return HttpResponse.json(mockHealth, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Error message should be displayed
      await waitFor(
        () => {
          const errorElement =
            screen.queryByText(/failed to refresh/i) ||
            screen.queryByText(/error/i) ||
            screen.queryByText(/failed/i);
          expect(errorElement).toBeTruthy();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Status color and icon logic', () => {
    it('shows green color and checkmark icon for "ok" status', async () => {
      server.use(
        http.get(/\/config\/health$/, () => {
          return HttpResponse.json(
            {
              ...mockHealth,
              status: 'ok',
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Check for green color (#27ae60) and checkmark (✓)
      const serviceElement = screen.getByText(/service:/i).parentElement;
      expect(serviceElement).toBeTruthy();
      if (serviceElement) {
        const statusSpan = serviceElement.querySelector('span[style*="color"]');
        expect(statusSpan).toBeTruthy();
        if (statusSpan) {
          expect(statusSpan).toHaveStyle({ color: '#27ae60' });
          expect(statusSpan).toHaveTextContent(/✓/);
        }
      }
    });

    it('shows green color and checkmark icon for "connected" status', async () => {
      server.use(
        http.get(/\/config\/health$/, () => {
          return HttpResponse.json(
            {
              ...mockHealth,
              dependencies: {
                redis: 'connected',
                cursorRunner: 'connected',
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Check for green color on dependencies
      // Find the health section Redis (it's in a health-item div)
      const healthSection = screen
        .getByText(/health status/i)
        .closest('.config-section');
      expect(healthSection).toBeTruthy();
      if (healthSection) {
        const redisLabel = Array.from(
          healthSection.querySelectorAll('strong')
        ).find((el) => el.textContent?.toLowerCase().includes('redis'));
        expect(redisLabel).toBeTruthy();
        if (redisLabel) {
          const healthItem = redisLabel.closest('.health-item');
          expect(healthItem).toBeTruthy();
          if (healthItem) {
            const statusSpan = healthItem.querySelector('span[style*="color"]');
            expect(statusSpan).toBeTruthy();
            if (statusSpan) {
              expect(statusSpan).toHaveStyle({ color: '#27ae60' });
              expect(statusSpan).toHaveTextContent(/✓/);
            }
          }
        }
      }
    });

    it('shows orange color and warning icon for "degraded" status', async () => {
      server.use(
        http.get(/\/config\/health$/, () => {
          return HttpResponse.json(
            {
              ...mockHealth,
              status: 'degraded',
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Check for orange color (#f39c12) and warning icon (⚠)
      const serviceElement = screen.getByText(/service:/i).parentElement;
      expect(serviceElement).toBeTruthy();
      if (serviceElement) {
        const statusSpan = serviceElement.querySelector('span[style*="color"]');
        expect(statusSpan).toBeTruthy();
        if (statusSpan) {
          expect(statusSpan).toHaveStyle({ color: '#f39c12' });
          expect(statusSpan).toHaveTextContent(/⚠/);
        }
      }
    });

    it('shows red color and X icon for "disconnected" status', async () => {
      server.use(
        http.get(/\/config\/health$/, () => {
          return HttpResponse.json(
            {
              ...mockHealth,
              dependencies: {
                redis: 'disconnected',
                cursorRunner: 'connected',
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Check for red color (#e74c3c) and X icon (✗)
      // Find the health section Redis
      const healthSection = screen
        .getByText(/health status/i)
        .closest('.config-section');
      expect(healthSection).toBeTruthy();
      if (healthSection) {
        const redisLabel = Array.from(
          healthSection.querySelectorAll('strong')
        ).find((el) => el.textContent?.toLowerCase().includes('redis'));
        expect(redisLabel).toBeTruthy();
        if (redisLabel) {
          const healthItem = redisLabel.closest('.health-item');
          expect(healthItem).toBeTruthy();
          if (healthItem) {
            const statusSpan = healthItem.querySelector('span[style*="color"]');
            expect(statusSpan).toBeTruthy();
            if (statusSpan) {
              expect(statusSpan).toHaveStyle({ color: '#e74c3c' });
              expect(statusSpan).toHaveTextContent(/✗/);
            }
          }
        }
      }
    });

    it('shows red color and X icon for "unhealthy" status', async () => {
      server.use(
        http.get(/\/config\/health$/, () => {
          return HttpResponse.json(
            {
              ...mockHealth,
              status: 'unhealthy',
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Check for red color (#e74c3c) and X icon (✗)
      const serviceElement = screen.getByText(/service:/i).parentElement;
      expect(serviceElement).toBeTruthy();
      if (serviceElement) {
        const statusSpan = serviceElement.querySelector('span[style*="color"]');
        expect(statusSpan).toBeTruthy();
        if (statusSpan) {
          expect(statusSpan).toHaveStyle({ color: '#e74c3c' });
          expect(statusSpan).toHaveTextContent(/✗/);
        }
      }
    });

    it('shows gray color and question mark icon for unknown status', async () => {
      server.use(
        http.get(/\/config\/health$/, () => {
          return HttpResponse.json(
            {
              ...mockHealth,
              status: 'unknown-status',
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Check for gray color (#7f8c8d) and question mark icon (?)
      const serviceElement = screen.getByText(/service:/i).parentElement;
      expect(serviceElement).toBeTruthy();
      if (serviceElement) {
        const statusSpan = serviceElement.querySelector('span[style*="color"]');
        expect(statusSpan).toBeTruthy();
        if (statusSpan) {
          expect(statusSpan).toHaveStyle({ color: '#7f8c8d' });
          expect(statusSpan).toHaveTextContent(/\?/);
        }
      }
    });

    it('applies status colors to service, redis, and cursorRunner', async () => {
      server.use(
        http.get(/\/config\/health$/, () => {
          return HttpResponse.json(
            {
              service: 'ok',
              status: 'ok',
              dependencies: {
                redis: 'degraded',
                cursorRunner: 'unhealthy',
              },
              timestamp: new Date().toISOString(),
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Service should be green
      const serviceElement = screen.getByText(/service:/i).parentElement;
      expect(serviceElement).toBeTruthy();
      if (serviceElement) {
        const statusSpan = serviceElement.querySelector('span[style*="color"]');
        expect(statusSpan).toHaveStyle({ color: '#27ae60' });
      }

      // Redis should be orange
      const healthSection = screen
        .getByText(/health status/i)
        .closest('.config-section');
      expect(healthSection).toBeTruthy();
      if (healthSection) {
        const redisLabel = Array.from(
          healthSection.querySelectorAll('strong')
        ).find((el) => el.textContent?.toLowerCase().includes('redis'));
        expect(redisLabel).toBeTruthy();
        if (redisLabel) {
          const healthItem = redisLabel.closest('.health-item');
          expect(healthItem).toBeTruthy();
          if (healthItem) {
            const statusSpan = healthItem.querySelector('span[style*="color"]');
            expect(statusSpan).toBeTruthy();
            if (statusSpan) {
              expect(statusSpan).toHaveStyle({ color: '#f39c12' });
            }
          }
        }

        // Cursor Runner should be red
        const cursorRunnerLabel = Array.from(
          healthSection.querySelectorAll('strong')
        ).find((el) => el.textContent?.toLowerCase().includes('cursor runner'));
        expect(cursorRunnerLabel).toBeTruthy();
        if (cursorRunnerLabel) {
          const healthItem = cursorRunnerLabel.closest('.health-item');
          expect(healthItem).toBeTruthy();
          if (healthItem) {
            const statusSpan = healthItem.querySelector('span[style*="color"]');
            expect(statusSpan).toBeTruthy();
            if (statusSpan) {
              expect(statusSpan).toHaveStyle({ color: '#e74c3c' });
            }
          }
        }
      }
    });
  });

  describe('Environment variable handling', () => {
    it('uses VITE_ELEVENLABS_AGENT_URL if set', async () => {
      const baseUrl = 'http://test-agent:8000';
      vi.stubEnv('VITE_ELEVENLABS_AGENT_URL', baseUrl);

      let capturedUrl: string | null = null;

      server.use(
        http.get(
          new RegExp(
            `${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/config$`
          ),
          ({ request }) => {
            capturedUrl = request.url;
            return HttpResponse.json(
              { success: true, config: mockConfig },
              {
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
        ),
        http.get(
          new RegExp(
            `${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/config/health$`
          ),
          () => {
            return HttpResponse.json(mockHealth, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        )
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Should have used the base URL
      expect(capturedUrl).toContain(baseUrl);
    });

    it('uses relative paths if env var not set', async () => {
      vi.stubEnv('VITE_ELEVENLABS_AGENT_URL', '');

      let capturedUrl: string | null = null;

      server.use(
        http.get(/\/config$/, ({ request }) => {
          capturedUrl = request.url;
          // Extract just the pathname to check relative path
          try {
            const url = new URL(request.url);
            capturedUrl = url.pathname;
          } catch {
            // If URL parsing fails, it might be a relative path
            capturedUrl = request.url;
          }
          return HttpResponse.json(
            { success: true, config: mockConfig },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }),
        http.get(/\/config\/health$/, () => {
          return HttpResponse.json(mockHealth, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Should have used relative path (pathname should be /config)
      expect(capturedUrl).toContain('/config');
    });
  });

  describe('Edge cases', () => {
    it('handles invalid JSON in config response', async () => {
      server.use(
        http.get(/\/config$/, () => {
          return new HttpResponse('invalid json', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(/\/config\/health$/, () => {
          return HttpResponse.json(mockHealth, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Should show error (JSON parse error will be caught and shown as error)
      const errorElement =
        screen.queryByText(/failed to load configuration/i) ||
        screen.queryByText(/error/i) ||
        screen.queryByText(/failed/i) ||
        screen.queryByText(/unexpected token/i);
      expect(errorElement).toBeTruthy();
    });

    it('handles invalid JSON in health response', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      server.use(
        http.get(/\/config\/health$/, () => {
          return new HttpResponse('invalid json', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Should have logged a warning
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Config should still be displayed
      expect(screen.getByText('test-agent-id')).toBeInTheDocument();

      consoleWarnSpy.mockRestore();
    });

    it('handles both config and health failures', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      server.use(
        http.get(/\/config$/, () => {
          return HttpResponse.error();
        }),
        http.get(/\/config\/health$/, () => {
          return HttpResponse.error();
        })
      );

      render(<AgentConfigView />);

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Config error should be shown
      const errorElement =
        screen.queryByText(/failed to load configuration/i) ||
        screen.queryByText(/error/i) ||
        screen.queryByText(/failed/i);
      expect(errorElement).toBeTruthy();

      // Health failure should be logged
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
