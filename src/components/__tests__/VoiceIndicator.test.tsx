/**
 * Tests for VoiceIndicator component
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoiceIndicator } from '../VoiceIndicator';

describe('VoiceIndicator', () => {
  it('renders voice indicator', () => {
    render(<VoiceIndicator status="disconnected" mode="idle" />);
    expect(screen.getByTestId('voice-indicator')).toBeInTheDocument();
  });

  it('applies correct class for disconnected status', () => {
    render(<VoiceIndicator status="disconnected" mode="idle" />);
    const indicator = screen.getByTestId('voice-indicator');
    expect(indicator).toHaveClass('voice-indicator', 'disconnected');
  });

  it('applies correct class for connecting status', () => {
    render(<VoiceIndicator status="connecting" mode="idle" />);
    const indicator = screen.getByTestId('voice-indicator');
    expect(indicator).toHaveClass('voice-indicator', 'connecting');
  });

  it('applies correct class for listening mode', () => {
    render(<VoiceIndicator status="connected" mode="listening" />);
    const indicator = screen.getByTestId('voice-indicator');
    expect(indicator).toHaveClass('voice-indicator', 'listening');
  });

  it('applies correct class for speaking mode', () => {
    render(<VoiceIndicator status="connected" mode="speaking" />);
    const indicator = screen.getByTestId('voice-indicator');
    expect(indicator).toHaveClass('voice-indicator', 'speaking');
  });

  it('applies correct class for error status', () => {
    render(<VoiceIndicator status="error" mode="idle" />);
    const indicator = screen.getByTestId('voice-indicator');
    expect(indicator).toHaveClass('voice-indicator', 'error');
  });

  it('shows error indicator when status is error', () => {
    render(<VoiceIndicator status="error" mode="idle" />);
    const indicator = screen.getByTestId('voice-indicator');
    expect(indicator.textContent).toContain('!');
  });

  it('has role="status" for accessibility', () => {
    render(<VoiceIndicator status="disconnected" mode="idle" />);
    const indicator = screen.getByRole('status');
    expect(indicator).toBeInTheDocument();
  });
});


