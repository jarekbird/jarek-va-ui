/**
 * VoiceIndicator Component
 * Displays a visual indicator for the agent's voice status
 * Shows a pulsing circle animation when the agent is speaking
 */

import React from 'react';
import type { ConnectionStatus } from '../services/elevenlabs-voice';
import './VoiceIndicator.css';

export interface VoiceIndicatorProps {
  status: ConnectionStatus;
  mode?: 'idle' | 'listening' | 'speaking';
}

/**
 * VoiceIndicator - Visual indicator for agent voice status
 * 
 * States:
 * - disconnected: Gray, static
 * - connecting: Blue, pulsing slowly
 * - connected: Green, static
 * - reconnecting: Yellow, pulsing
 * - error: Red, static
 * 
 * Modes (when connected):
 * - idle: Green, static
 * - listening: Blue, pulsing
 * - speaking: Green, pulsing quickly
 */
export const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({
  status,
  mode = 'idle',
}) => {
  const getIndicatorClass = (): string => {
    const baseClass = 'voice-indicator';
    
    if (status === 'disconnected') {
      return `${baseClass} ${baseClass}--disconnected`;
    }
    if (status === 'connecting' || status === 'reconnecting') {
      return `${baseClass} ${baseClass}--connecting`;
    }
    if (status === 'error') {
      return `${baseClass} ${baseClass}--error`;
    }
    if (status === 'connected') {
      if (mode === 'speaking') {
        return `${baseClass} ${baseClass}--speaking`;
      }
      if (mode === 'listening') {
        return `${baseClass} ${baseClass}--listening`;
      }
      return `${baseClass} ${baseClass}--idle`;
    }
    
    return baseClass;
  };

  const getStatusLabel = (): string => {
    if (status === 'disconnected') return 'Disconnected';
    if (status === 'connecting') return 'Connecting...';
    if (status === 'reconnecting') return 'Reconnecting...';
    if (status === 'error') return 'Error';
    if (status === 'connected') {
      if (mode === 'speaking') return 'Speaking';
      if (mode === 'listening') return 'Listening';
      return 'Ready';
    }
    return 'Unknown';
  };

  return (
    <div className="voice-indicator-container" data-testid="voice-indicator">
      <div className={getIndicatorClass()} role="status" aria-label={getStatusLabel()}>
        <div className="voice-indicator__inner"></div>
      </div>
      <span className="voice-indicator__label">{getStatusLabel()}</span>
    </div>
  );
};


