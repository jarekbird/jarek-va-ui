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

import React, { useState, useEffect, useRef } from 'react';
import { VoiceIndicator } from './VoiceIndicator';
import { AgentChatPanel } from './AgentChatPanel';
import { NoteTakingPanel } from './NoteTakingPanel';
import { ElevenLabsVoiceService, type ConnectionStatus, type AgentMode } from '../services/elevenlabs-voice';
import { isElevenLabsEnabled } from '../utils/feature-flags';
import { getAgentConfig } from '../api/elevenlabs';
import { ErrorMessage } from './ErrorMessage';
import './Dashboard.css';

/**
 * Dashboard - Unified view for voice agent and note-taking
 */
export const Dashboard: React.FC = () => {
  const [selectedAgentConversationId, setSelectedAgentConversationId] = useState<string | undefined>();
  const [selectedNoteConversationId, setSelectedNoteConversationId] = useState<string | undefined>();
  const [voiceStatus, setVoiceStatus] = useState<ConnectionStatus>('disconnected');
  const [voiceMode, setVoiceMode] = useState<AgentMode>('idle');
  const [agentId, setAgentId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isLoadingAgentConfig, setIsLoadingAgentConfig] = useState<boolean>(true);
  const voiceServiceRef = useRef<ElevenLabsVoiceService | null>(null);

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

  const handleConnect = async () => {
    if (!voiceServiceRef.current) {
      setConnectionError('Voice service not initialized');
      return;
    }

    if (!agentId) {
      setConnectionError('Agent ID not configured. Please check your agent configuration.');
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to agent';
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

  return (
    <div className="dashboard" data-testid="dashboard">
      <div className="dashboard__content">
        <div className="dashboard__left">
          <div className="dashboard__voice-indicator">
            <VoiceIndicator 
              status={voiceStatus} 
              mode={voiceMode}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              disabled={isLoadingAgentConfig || !agentId || !selectedAgentConversationId}
            />
            {connectionError && (
              <ErrorMessage message={connectionError} />
            )}
            {!agentId && !isLoadingAgentConfig && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#ef4444', textAlign: 'center' }}>
                Agent ID not configured
              </div>
            )}
            {!selectedAgentConversationId && agentId && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#f59e0b', textAlign: 'center' }}>
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
          />
        </div>
      </div>
    </div>
  );
};

