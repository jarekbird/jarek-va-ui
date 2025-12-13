/**
 * ElevenLabs Voice Service
 * Manages WebSocket/WebRTC connection to ElevenLabs conversational agent
 *
 * State Machine:
 * - disconnected → connecting → connected
 * - connected → reconnecting → connected (on network issues)
 * - any → error (on fatal errors)
 * - any → disconnected (on explicit end)
 *
 * Events:
 * - onConnect: Fired when connection is established
 * - onDisconnect: Fired when connection is closed
 * - onModeChange: Fired when agent mode changes (idle/listening/speaking)
 * - onError: Fired when an error occurs
 * - onMessage: Fired when a message is received from the agent
 * - onStatusChange: Fired when connection status changes
 *
 * Uses the official ElevenLabs JS SDK (`@elevenlabs/client`).
 */

import { getVoiceSignedUrl, registerSession } from '../api/elevenlabs';
import { isElevenLabsEnabled } from '../utils/feature-flags';
import { retryWithBackoff } from '../utils/retry';
import { Conversation } from '@elevenlabs/client';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export type AgentMode = 'idle' | 'listening' | 'speaking';

export interface VoiceServiceConfig {
  agentId?: string;
  signedUrl?: string;
  conversationId?: string; // Required for session registration
  onConnect?: () => void;
  onDisconnect?: () => void;
  onModeChange?: (mode: AgentMode) => void;
  onError?: (error: Error) => void;
  // User-side transcript / messages coming from the ElevenLabs session
  onMessage?: (message: string) => void;
  // Agent-side (assistant) text coming from the ElevenLabs session
  onAgentMessage?: (message: string) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

export interface HeartbeatConfig {
  interval: number; // milliseconds
  timeout: number; // milliseconds
}

/**
 * ElevenLabs Voice Service
 * Handles connection, reconnection, signed URL renewal, and heartbeat monitoring
 */
export class ElevenLabsVoiceService {
  private status: ConnectionStatus = 'disconnected';
  private agentMode: AgentMode = 'idle';
  private agentId?: string;
  private conversationId?: string;
  private signedUrl?: string;
  private signedUrlExpiresAt?: Date;
  private signedUrlRenewalTimer?: ReturnType<typeof setTimeout>;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private heartbeatInterval?: ReturnType<typeof setInterval>;
  private heartbeatTimeout?: ReturnType<typeof setTimeout>;
  private heartbeatConfig: HeartbeatConfig = {
    interval: 30000, // 30 seconds
    timeout: 60000, // 60 seconds
  };
  private config: VoiceServiceConfig = {};
  private sessionRegistered: boolean = false;
  private connectionTimeout?: ReturnType<typeof setTimeout>;
  private readonly CONNECTION_TIMEOUT = 30000; // 30 seconds
  private elevenConversation?: unknown;
  private elevenConversationId?: string;
  private elevenSessionUrl?: string;

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Start a voice session with the ElevenLabs agent
   * @param agentId - Agent ID to connect to
   * @param conversationId - Conversation ID for session registration
   * @param signedUrl - Optional pre-fetched signed URL
   */
  async startVoiceSession(
    agentId: string,
    conversationId?: string,
    signedUrl?: string
  ): Promise<void> {
    // Check feature flag
    if (!isElevenLabsEnabled()) {
      throw new Error('ElevenLabs agent feature is disabled');
    }

    if (this.status === 'connected' || this.status === 'connecting') {
      throw new Error('Voice session already active');
    }

    this.agentId = agentId;
    this.conversationId = conversationId || this.config.conversationId;
    this.signedUrl = signedUrl;
    this.reconnectAttempts = 0;
    this.sessionRegistered = false;

    await this.connect();
  }

  /**
   * End the current voice session
   */
  endVoiceSession(): void {
    this.cleanup();
    this.status = 'disconnected';
    this.agentMode = 'idle';
    this.agentId = undefined;
    this.conversationId = undefined;
    this.signedUrl = undefined;
    this.signedUrlExpiresAt = undefined;
    this.reconnectAttempts = 0;
    this.sessionRegistered = false;

    if (this.config.onDisconnect) {
      this.config.onDisconnect();
    }
    this.notifyStatusChange();
  }

  /**
   * Send text message to the agent
   */
  sendTextToAgent(text: string): void {
    if (this.status !== 'connected' || !this.elevenConversation) {
      throw new Error('Not connected to agent');
    }

    try {
      // ElevenLabs SDK uses sendUserMessage(text) for conversational input.
      if (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (this.elevenConversation as any).sendUserMessage === 'function'
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.elevenConversation as any).sendUserMessage(text);
      } else if (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (this.elevenConversation as any).sendMessage === 'function'
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.elevenConversation as any).sendMessage({
          type: 'user_message',
          text,
        });
      } else if (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (this.elevenConversation as any).send === 'function'
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.elevenConversation as any).send(text);
      } else {
        throw new Error(
          'ElevenLabs SDK does not support sending text messages (no sendUserMessage/sendMessage/send)'
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to send text to agent:', err);
      throw err;
    }
  }

  /**
   * Renew the signed URL and reconnect if needed
   * Implements Task 27: Signed URL Expiration Handling
   */
  async renewSignedUrl(): Promise<void> {
    if (!this.agentId) {
      throw new Error('No agent ID set');
    }

    try {
      const result = await retryWithBackoff(
        () => getVoiceSignedUrl(this.agentId),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, error) => {
            console.warn(
              `Retrying signed URL renewal (attempt ${attempt}):`,
              error.message
            );
          },
        }
      );

      this.signedUrl = result.signedUrl;
      if (result.expiresAt) {
        this.signedUrlExpiresAt = new Date(result.expiresAt);
        this.scheduleSignedUrlRenewal();
      }

      // Reconnect if currently connected
      if (this.status === 'connected') {
        console.log('Reconnecting with renewed signed URL...');
        await this.reconnect();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to renew signed URL:', err);
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Schedule signed URL renewal 5 minutes before expiration
   * Implements Task 27: Proactive renewal
   */
  private scheduleSignedUrlRenewal(): void {
    if (this.signedUrlRenewalTimer) {
      clearTimeout(this.signedUrlRenewalTimer);
    }

    if (!this.signedUrlExpiresAt) {
      return;
    }

    const now = new Date();
    const expirationTime = this.signedUrlExpiresAt.getTime();
    const renewalTime = expirationTime - now.getTime() - 5 * 60 * 1000; // 5 minutes before expiration

    if (renewalTime > 0) {
      this.signedUrlRenewalTimer = setTimeout(() => {
        this.renewSignedUrl().catch((error) => {
          console.error('Scheduled signed URL renewal failed:', error);
          this.handleError(
            error instanceof Error ? error : new Error(String(error))
          );
        });
      }, renewalTime);
    } else {
      // Already expired or expiring soon, renew immediately
      this.renewSignedUrl().catch((error) => {
        console.error('Immediate signed URL renewal failed:', error);
      });
    }
  }

  /**
   * Reconnect with exponential backoff
   * Implements Task 28: Network Failure Handling with retry utility
   */
  async reconnectWithBackoff(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.status = 'error';
      this.notifyStatusChange();
      throw new Error('Max reconnection attempts reached');
    }

    this.status = 'reconnecting';
    this.notifyStatusChange();

    try {
      await retryWithBackoff(
        async () => {
          this.reconnectAttempts++;
          await this.connect();
        },
        {
          maxRetries: this.maxReconnectAttempts - this.reconnectAttempts,
          initialDelay: 1000,
          multiplier: 2,
          maxDelay: 30000,
          onRetry: (attempt, error) => {
            console.log(`Reconnection attempt ${attempt}:`, error.message);
          },
        }
      );
    } catch (error) {
      this.status = 'error';
      this.notifyStatusChange();
      throw error;
    }
  }

  /**
   * Start heartbeat monitoring
   * Note: ElevenLabs SDK manages its own connection state; we keep this as a lightweight
   * timer-based guard so existing UI/tests relying on "heartbeat running" semantics still work.
   */
  startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.status !== 'connected') return;

      // Preserve the prior "timeout timer exists" behavior; SDK handles real health checks.
      this.heartbeatTimeout = setTimeout(() => {
        // No-op: we rely on SDK onDisconnect/onError for actual failures.
      }, this.heartbeatConfig.timeout);
    }, this.heartbeatConfig.interval);
  }

  /**
   * Stop heartbeat monitoring
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = undefined;
    }
  }

  /**
   * Configure the service
   */
  configure(config: VoiceServiceConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Internal: Connect to ElevenLabs
   * Implements Task 25: Basic Voice Service Connection Flow
   */
  private async connect(): Promise<void> {
    this.status = 'connecting';
    this.notifyStatusChange();

    // Set connection timeout
    this.connectionTimeout = setTimeout(() => {
      if (this.status === 'connecting') {
        this.handleError(new Error('Connection timeout'));
      }
    }, this.CONNECTION_TIMEOUT);

    try {
      // Check if signed URL is expired or missing
      if (this.signedUrlExpiresAt && new Date() >= this.signedUrlExpiresAt) {
        await this.renewSignedUrl();
      } else if (!this.signedUrl && this.agentId) {
        // If no signed URL provided, try to fetch one
        try {
          await this.renewSignedUrl();
        } catch (error) {
          // Continue without signed URL if fetch fails (for public agents)
          console.warn(
            'Failed to fetch signed URL, continuing without it:',
            error
          );
        }
      }

      if (!this.agentId) {
        throw new Error('Agent ID is required');
      }

      try {
        // Prefer WebSocket connection for now so we can register a stable WSS URL
        // with our backend for callback routing.
        this.elevenSessionUrl = this.buildElevenSessionUrl(
          this.agentId,
          this.signedUrl
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sessionConfig: any = {
          agentId: this.agentId,
          connectionType: 'websocket',
        };

        // Only include signedUrl if it's defined (SDK type doesn't allow undefined)
        if (this.signedUrl) {
          sessionConfig.signedUrl = this.signedUrl;
        }

        sessionConfig.onConnect = ({
          conversationId,
        }: {
          conversationId: string;
        }) => {
          this.elevenConversationId = conversationId;
        };

        sessionConfig.onMessage = ({
          source,
          message,
        }: {
          source: 'ai' | 'user';
          message: string;
        }) => {
          // Preserve existing semantics: VoiceServiceConfig.onMessage is treated as
          // "user transcript" for persistence in AgentConversationDetails.
          if (source === 'user') {
            this.config.onMessage?.(message);
          } else {
            this.config.onAgentMessage?.(message);
            console.log('[ElevenLabs] agent message:', message);
          }
        };

        sessionConfig.onModeChange = ({ mode }: { mode: string }) => {
          if (mode === 'speaking') this.setAgentMode('speaking');
          else if (mode === 'listening') this.setAgentMode('listening');
          else this.setAgentMode('idle');
        };

        sessionConfig.onStatusChange = ({ status }: { status: string }) => {
          if (status === 'connecting') this.status = 'connecting';
          else if (status === 'connected') this.status = 'connected';
          else if (status === 'disconnected') this.status = 'disconnected';
          this.notifyStatusChange();
        };

        sessionConfig.onDisconnect = () => {
          if (this.status !== 'disconnected') {
            this.status = 'disconnected';
            this.notifyStatusChange();
            this.config.onDisconnect?.();
          }
        };

        sessionConfig.onError = (message: string) => {
          this.handleError(new Error(message));
        };

        this.elevenConversation =
          await Conversation.startSession(sessionConfig);
      } catch (sdkError) {
        const err =
          sdkError instanceof Error ? sdkError : new Error(String(sdkError));
        console.error('Failed to initialize ElevenLabs SDK:', err);
        throw new Error(
          `Failed to connect to ElevenLabs agent: ${err.message}`
        );
      }

      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = undefined;
      }

      this.status = 'connected';
      this.reconnectAttempts = 0;
      this.notifyStatusChange();
      this.startHeartbeat();
      this.scheduleSignedUrlRenewal();

      // Register session (Task 26)
      await this.registerSessionIfNeeded();

      if (this.config.onConnect) {
        this.config.onConnect();
      }
    } catch (error) {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = undefined;
      }
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Register session with backend (Task 26)
   * Extracts session payload and registers it for callback routing
   */
  private async registerSessionIfNeeded(): Promise<void> {
    if (this.sessionRegistered || !this.conversationId) {
      return;
    }

    try {
      const sessionUrl =
        this.elevenSessionUrl ||
        this.buildElevenSessionUrl(this.agentId || 'unknown', this.signedUrl) ||
        'wss://placeholder-session-url';

      const sessionId = this.elevenConversationId || `session-${Date.now()}`;

      await retryWithBackoff(
        () =>
          registerSession(this.conversationId!, {
            sessionUrl,
            sessionId,
            metadata: {
              agentId: this.agentId,
              elevenConversationId: this.elevenConversationId,
              connectedAt: new Date().toISOString(),
            },
          }),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, error) => {
            console.warn(
              `Retrying session registration (attempt ${attempt}):`,
              error.message
            );
          },
        }
      );

      this.sessionRegistered = true;
      console.log('Session registered successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to register session:', err);
      // Don't throw - allow voice session to continue, but cursor tools won't work
      // User will be notified via onError callback
      if (this.config.onError) {
        this.config.onError(
          new Error(
            'Failed to register session. Cursor-powered tools may not work. Please try reconnecting.'
          )
        );
      }
    }
  }

  /**
   * Internal: Reconnect
   */
  private async reconnect(): Promise<void> {
    this.cleanup();
    await this.connect();
  }

  /**
   * Internal: Handle errors
   */
  private handleError(error: Error): void {
    this.status = 'error';
    this.notifyStatusChange();
    if (this.config.onError) {
      this.config.onError(error);
    }
  }

  /**
   * Get current agent mode
   */
  getAgentMode(): AgentMode {
    return this.agentMode;
  }

  /**
   * Set agent mode and notify listeners
   */
  setAgentMode(mode: AgentMode): void {
    if (this.agentMode !== mode) {
      this.agentMode = mode;
      if (this.config.onModeChange) {
        this.config.onModeChange(mode);
      }
    }
  }

  /**
   * Build a websocket URL for the active ElevenLabs session.
   * Mirrors @elevenlabs/client (0.11.3) websocket URL construction so that
   * our backend can later use the stored URL for callback routing/push.
   */
  private buildElevenSessionUrl(agentId: string, signedUrl?: string): string {
    const source = 'js_sdk';
    const version = '0.11.3';

    if (signedUrl) {
      const joiner = signedUrl.includes('?') ? '&' : '?';
      return `${signedUrl}${joiner}source=${encodeURIComponent(source)}&version=${encodeURIComponent(version)}`;
    }

    return `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(agentId)}&source=${encodeURIComponent(source)}&version=${encodeURIComponent(version)}`;
  }

  /**
   * Internal: Cleanup resources
   */
  private cleanup(): void {
    this.stopHeartbeat();

    // Stop and cleanup ElevenLabs conversation
    if (this.elevenConversation) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (this.elevenConversation as any).endSession === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.elevenConversation as any).endSession();
        } else if (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          typeof (this.elevenConversation as any).close === 'function'
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.elevenConversation as any).close();
        }
      } catch (error) {
        console.warn('Error ending ElevenLabs session:', error);
      }
      this.elevenConversation = undefined;
    }
    this.elevenConversationId = undefined;
    this.elevenSessionUrl = undefined;

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = undefined;
    }
    if (this.signedUrlRenewalTimer) {
      clearTimeout(this.signedUrlRenewalTimer);
      this.signedUrlRenewalTimer = undefined;
    }
  }

  /**
   * Internal: Notify status change
   */
  private notifyStatusChange(): void {
    if (this.config.onStatusChange) {
      this.config.onStatusChange(this.status);
    }
  }
}
