/**
 * Dashboard Component
 * Main layout combining voice indicator, agent chat, and note-taking panels
 *
 * Layout:
 * - Desktop: Three regions side-by-side
 *   - Upper left: Voice indicator
 *   - Lower left: Agent chat panel
 *   - Right: Note-taking panel
 * - Mobile: Stacked vertically
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceIndicator } from './VoiceIndicator';
import { AgentChatPanel } from './AgentChatPanel';
import { NoteTakingPanel } from './NoteTakingPanel';
import {
  WorkingDirectoryBrowser,
  type WorkingDirectoryBrowserRef,
} from './WorkingDirectoryBrowser';
import {
  ElevenLabsVoiceService,
  type ConnectionStatus,
  type AgentMode,
} from '../services/elevenlabs-voice';
import { isElevenLabsEnabled } from '../utils/feature-flags';
import { getAgentConfig } from '../api/elevenlabs';
import { ErrorMessage } from './ErrorMessage';
import './Dashboard.css';

/**
 * Dashboard - Unified view for voice agent and note-taking
 */
export const Dashboard: React.FC = () => {
  const [selectedAgentConversationId, setSelectedAgentConversationId] =
    useState<string | undefined>();
  const [selectedNoteConversationId, setSelectedNoteConversationId] = useState<
    string | undefined
  >();
  const [voiceStatus, setVoiceStatus] =
    useState<ConnectionStatus>('disconnected');
  const [voiceMode, setVoiceMode] = useState<AgentMode>('idle');
  const [agentId, setAgentId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isLoadingAgentConfig, setIsLoadingAgentConfig] =
    useState<boolean>(true);
  const voiceServiceRef = useRef<ElevenLabsVoiceService | null>(null);
  const fileBrowserRef = useRef<WorkingDirectoryBrowserRef>(null);
  const lastFileRefreshAtRef = useRef<number>(0);
  const fileRefreshTimerRef = useRef<number | null>(null);

  // Load agent configuration
  useEffect(() => {
    if (!isElevenLabsEnabled()) {
      setIsLoadingAgentConfig(false);
      return;
    }

    const loadAgentConfig = async () => {
      try {
        setIsLoadingAgentConfig(true);
        const config = await getAgentConfig();
        setAgentId(config.agentId);
      } catch (error) {
        console.error('Failed to load agent config:', error);
        // Try to use environment variable as fallback
        const envAgentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
        if (envAgentId) {
          setAgentId(envAgentId);
        }
      } finally {
        setIsLoadingAgentConfig(false);
      }
    };

    loadAgentConfig();
  }, []);

  // Initialize voice service
  useEffect(() => {
    if (!isElevenLabsEnabled()) {
      return;
    }

    const voiceService = new ElevenLabsVoiceService();
    voiceService.configure({
      onStatusChange: (status) => {
        setVoiceStatus(status);
        if (status === 'connected' || status === 'disconnected') {
          setConnectionError(null);
        }
      },
      onModeChange: (mode) => {
        setVoiceMode(mode);
      },
      onError: (error) => {
        console.error('Voice service error:', error);
        setConnectionError(error.message);
      },
      onMessage: (message) => {
        // Messages will be handled by AgentChatPanel
        console.log('Voice message received:', message);
      },
    });

    voiceServiceRef.current = voiceService;

    return () => {
      // Cleanup: end voice session when component unmounts
      if (voiceServiceRef.current) {
        voiceServiceRef.current.endVoiceSession();
      }
    };
  }, []);

  // Update voice service conversation ID when agent conversation changes
  useEffect(() => {
    if (voiceServiceRef.current && selectedAgentConversationId) {
      voiceServiceRef.current.configure({
        conversationId: selectedAgentConversationId,
      });
    }
  }, [selectedAgentConversationId]);

  const refreshFileBrowser = useCallback(() => {
    void fileBrowserRef.current?.refresh();
    lastFileRefreshAtRef.current = Date.now();
  }, []);

  // Handle note conversation updates - throttled refresh to prevent spam during streaming updates
  const handleNoteConversationUpdate = useCallback(() => {
    // Skip throttling in test environment to prevent test stalls
    const isTestEnv = import.meta.env.MODE === 'test' || import.meta.env.VITEST;
    if (isTestEnv) {
      refreshFileBrowser();
      return;
    }

    const now = Date.now();
    const minIntervalMs = 2000;
    const elapsed = now - lastFileRefreshAtRef.current;

    if (elapsed >= minIntervalMs) {
      refreshFileBrowser();
      return;
    }

    if (fileRefreshTimerRef.current !== null) {
      return;
    }

    fileRefreshTimerRef.current = window.setTimeout(
      () => {
        fileRefreshTimerRef.current = null;
        refreshFileBrowser();
      },
      Math.max(50, minIntervalMs - elapsed)
    );
  }, [refreshFileBrowser]);

  useEffect(() => {
    return () => {
      if (fileRefreshTimerRef.current !== null) {
        window.clearTimeout(fileRefreshTimerRef.current);
        fileRefreshTimerRef.current = null;
      }
    };
  }, []);

  const handleConnect = async () => {
    if (!voiceServiceRef.current) {
      setConnectionError('Voice service not initialized');
      return;
    }

    if (!agentId) {
      setConnectionError(
        'Agent ID not configured. Please check your agent configuration.'
      );
      return;
    }

    if (!selectedAgentConversationId) {
      setConnectionError('Please select an agent conversation first.');
      return;
    }

    try {
      setConnectionError(null);
      await voiceServiceRef.current.startVoiceSession(
        agentId,
        selectedAgentConversationId
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to connect to agent';
      setConnectionError(errorMessage);
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.endVoiceSession();
      setConnectionError(null);
    }
  };

  // Debug: Log the feature flag value (only in development)
  useEffect(() => {
    const flagValue = import.meta.env.VITE_ELEVENLABS_AGENT_ENABLED;
    console.log('[Dashboard] VITE_ELEVENLABS_AGENT_ENABLED:', flagValue);
    console.log('[Dashboard] isElevenLabsEnabled():', isElevenLabsEnabled());
  }, []);

  // Show disabled message when feature flag is off
  if (!isElevenLabsEnabled()) {
    const flagValue = import.meta.env.VITE_ELEVENLABS_AGENT_ENABLED;
    return (
      <div className="dashboard" data-testid="dashboard">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
            Dashboard Unavailable
          </h2>
          <p
            style={{
              color: '#7f8c8d',
              marginBottom: '1rem',
              maxWidth: '600px',
            }}
          >
            The Dashboard feature is currently disabled. To enable it, set the{' '}
            <code
              style={{
                background: '#e9ecef',
                padding: '2px 6px',
                borderRadius: '3px',
                fontFamily: 'monospace',
              }}
            >
              VITE_ELEVENLABS_AGENT_ENABLED
            </code>{' '}
            environment variable to{' '}
            <code
              style={{
                background: '#e9ecef',
                padding: '2px 6px',
                borderRadius: '3px',
                fontFamily: 'monospace',
              }}
            >
              true
            </code>
            .
          </p>
          <p
            style={{ color: '#95a5a6', fontSize: '0.85rem', marginTop: '1rem' }}
          >
            Current value:{' '}
            <code
              style={{
                background: '#e9ecef',
                padding: '2px 6px',
                borderRadius: '3px',
                fontFamily: 'monospace',
              }}
            >
              {flagValue ?? '(not set)'}
            </code>
          </p>
          <p
            style={{
              color: '#95a5a6',
              fontSize: '0.85rem',
              marginTop: '0.5rem',
            }}
          >
            Note: Vite environment variables are build-time. You must rebuild
            the Docker image after changing this value.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard" data-testid="dashboard">
      <div className="dashboard__content">
        <div className="dashboard__file-browser">
          <WorkingDirectoryBrowser ref={fileBrowserRef} />
        </div>
        <div className="dashboard__middle">
          <div className="dashboard__voice-indicator">
            <VoiceIndicator
              status={voiceStatus}
              mode={voiceMode}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              disabled={
                isLoadingAgentConfig || !agentId || !selectedAgentConversationId
              }
            />
            {connectionError && <ErrorMessage message={connectionError} />}
            {!agentId && !isLoadingAgentConfig && (
              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  textAlign: 'center',
                }}
              >
                Agent ID not configured
              </div>
            )}
            {!selectedAgentConversationId && agentId && (
              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#f59e0b',
                  textAlign: 'center',
                }}
              >
                Select an agent conversation to connect
              </div>
            )}
          </div>
          <div className="dashboard__agent-chat">
            <AgentChatPanel
              conversationId={selectedAgentConversationId}
              onConversationSelect={setSelectedAgentConversationId}
              voiceService={voiceServiceRef.current}
              voiceStatus={voiceStatus}
              voiceMode={voiceMode}
            />
          </div>
        </div>
        <div className="dashboard__right">
          <NoteTakingPanel
            conversationId={selectedNoteConversationId}
            onConversationSelect={setSelectedNoteConversationId}
            onConversationUpdate={handleNoteConversationUpdate}
          />
        </div>
      </div>
    </div>
  );
};
