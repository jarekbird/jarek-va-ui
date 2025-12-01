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
    const { container } = render(
      <VoiceIndicator status="disconnected" mode="idle" />
    );
    const indicator = container.querySelector('.voice-indicator--disconnected');
    expect(indicator).toBeInTheDocument();
  });

  it('applies correct class for connecting status', () => {
    const { container } = render(
      <VoiceIndicator status="connecting" mode="idle" />
    );
    const indicator = container.querySelector('.voice-indicator--connecting');
    expect(indicator).toBeInTheDocument();
  });

  it('applies correct class for listening mode', () => {
    const { container } = render(
      <VoiceIndicator status="connected" mode="listening" />
    );
    const indicator = container.querySelector('.voice-indicator--listening');
    expect(indicator).toBeInTheDocument();
  });

  it('applies correct class for speaking mode', () => {
    const { container } = render(
      <VoiceIndicator status="connected" mode="speaking" />
    );
    const indicator = container.querySelector('.voice-indicator--speaking');
    expect(indicator).toBeInTheDocument();
  });

  it('applies correct class for error status', () => {
    const { container } = render(<VoiceIndicator status="error" mode="idle" />);
    const indicator = container.querySelector('.voice-indicator--error');
    expect(indicator).toBeInTheDocument();
  });

  it('shows error indicator when status is error', () => {
    render(<VoiceIndicator status="error" mode="idle" />);
    const label = screen.getByText('Error');
    expect(label).toBeInTheDocument();
  });

  it('has role="status" for accessibility', () => {
    render(<VoiceIndicator status="disconnected" mode="idle" />);
    const indicator = screen.getByRole('status');
    expect(indicator).toBeInTheDocument();
  });
});
