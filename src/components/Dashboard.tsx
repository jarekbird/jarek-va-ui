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
import './Dashboard.css';

/**
 * Dashboard - Unified view for voice agent and note-taking
 */
export const Dashboard: React.FC = () => {
  const [selectedAgentConversationId, setSelectedAgentConversationId] = useState<string | undefined>();
  const [selectedNoteConversationId, setSelectedNoteConversationId] = useState<string | undefined>();
  const [voiceStatus, setVoiceStatus] = useState<ConnectionStatus>('disconnected');
  const [voiceMode, setVoiceMode] = useState<AgentMode>('idle');
  const voiceServiceRef = useRef<ElevenLabsVoiceService | null>(null);

  // Initialize voice service
  useEffect(() => {
    if (!isElevenLabsEnabled()) {
      return;
    }

    const voiceService = new ElevenLabsVoiceService();
    voiceService.configure({
      onStatusChange: (status) => {
        setVoiceStatus(status);
      },
      onModeChange: (mode) => {
        setVoiceMode(mode);
      },
      onError: (error) => {
        console.error('Voice service error:', error);
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

  return (
    <div className="dashboard" data-testid="dashboard">
      <div className="dashboard__header">
        <h1>Dashboard</h1>
        <p className="dashboard__subtitle">Voice Agent & Note-Taking</p>
      </div>
      <div className="dashboard__content">
        <div className="dashboard__left">
          <div className="dashboard__voice-indicator">
            <VoiceIndicator status={voiceStatus} mode={voiceMode} />
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

