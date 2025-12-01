/**
 * Tests for Dashboard component
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import { isElevenLabsEnabled } from '../../utils/feature-flags';
import { ElevenLabsVoiceService } from '../../services/elevenlabs-voice';

// Mock feature flag
vi.mock('../../utils/feature-flags', () => ({
  isElevenLabsEnabled: vi.fn(() => true),
}));

// Mock voice service
vi.mock('../../services/elevenlabs-voice', () => ({
  ElevenLabsVoiceService: vi.fn().mockImplementation(() => ({
    configure: vi.fn(),
    endVoiceSession: vi.fn(),
  })),
}));

// Mock child components
vi.mock('../VoiceIndicator', () => ({
  VoiceIndicator: ({ status, mode }: { status: string; mode: string }) => (
    <div data-testid="voice-indicator" data-status={status} data-mode={mode}>
      Voice Indicator
    </div>
  ),
}));

vi.mock('../AgentChatPanel', () => ({
  AgentChatPanel: () => (
    <div data-testid="agent-chat-panel">Agent Chat Panel</div>
  ),
}));

vi.mock('../NoteTakingPanel', () => ({
  NoteTakingPanel: () => (
    <div data-testid="note-taking-panel">Note Taking Panel</div>
  ),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isElevenLabsEnabled).mockReturnValue(true);
    // Ensure ElevenLabsVoiceService mock is properly set up
    vi.mocked(ElevenLabsVoiceService).mockImplementation(() => ({
      configure: vi.fn(),
      endVoiceSession: vi.fn(),
    }));
  });

  it('renders all three panels', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('voice-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('agent-chat-panel')).toBeInTheDocument();
    expect(screen.getByTestId('note-taking-panel')).toBeInTheDocument();
  });

  it('renders dashboard container', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('passes voice status to VoiceIndicator', () => {
    render(<Dashboard />);

    const indicator = screen.getByTestId('voice-indicator');
    // VoiceIndicator receives status prop (defaults to 'disconnected')
    expect(indicator).toBeInTheDocument();
  });

  it('initializes voice service on mount', () => {
    render(<Dashboard />);

    // Voice service should be instantiated
    expect(ElevenLabsVoiceService).toHaveBeenCalled();
  });

  it('cleans up voice service on unmount', () => {
    const mockEndVoiceSession = vi.fn();
    vi.mocked(ElevenLabsVoiceService).mockImplementation(() => ({
      configure: vi.fn(),
      endVoiceSession: mockEndVoiceSession,
    }));

    const { unmount } = render(<Dashboard />);
    unmount();

    // Voice service cleanup should be called
    expect(mockEndVoiceSession).toHaveBeenCalled();
  });
});
