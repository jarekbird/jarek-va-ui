import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import App from '../App';
import { Navigation } from '../components/Navigation';
import { isElevenLabsEnabled } from '../utils/feature-flags';

/**
 * Feature flag gating tests.
 * Note: Since import.meta.env is read at build time in Vite,
 * we test the behavior with the current environment setting.
 * In practice, the flag should be set via environment variables
 * before building/running the app.
 */
describe('Feature Flag Gating', () => {
  const isEnabled = import.meta.env.VITE_ELEVENLABS_AGENT_ENABLED === 'true' ||
                    import.meta.env.VITE_ELEVENLABS_AGENT_ENABLED === 'True' ||
                    import.meta.env.VITE_ELEVENLABS_AGENT_ENABLED === 'TRUE';

  describe('Navigation Gating', () => {
    it('conditionally shows/hides agent navigation links based on flag', () => {
      render(<Navigation />);

      if (isEnabled) {
        expect(screen.getByText('Agent Conversations')).toBeInTheDocument();
        expect(screen.getByText('Agent Config')).toBeInTheDocument();
      } else {
        expect(screen.queryByText('Agent Conversations')).not.toBeInTheDocument();
        expect(screen.queryByText('Agent Config')).not.toBeInTheDocument();
      }
      
      // These should always be visible
      expect(screen.getByText('Note Taking History')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });
  });

  describe('Route Gating', () => {
    it('renders App without errors', () => {
      const { container } = render(<App />);
      expect(container).toBeTruthy();
    });
  });

  describe('Feature Flag Helper', () => {
    it('has centralized flag check function', () => {
      // Verify the function exists and returns a boolean
      expect(typeof isElevenLabsEnabled).toBe('function');
      expect(typeof isElevenLabsEnabled()).toBe('boolean');
    });
  });
});

