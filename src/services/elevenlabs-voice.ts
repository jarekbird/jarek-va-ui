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
 */

import { getVoiceSignedUrl, registerSession } from '../api/elevenlabs';
import { isElevenLabsEnabled } from '../utils/feature-flags';
import { retryWithBackoff } from '../utils/retry';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export type AgentMode = 'idle' | 'listening' | 'speaking';

export interface VoiceServiceConfig {
  agentId?: string;
  signedUrl?: string;
  conversationId?: string; // Required for session registration
  onConnect?: () => void;
  onDisconnect?: () => void;
  onModeChange?: (mode: AgentMode) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: string) => void;
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
  private ws?: WebSocket;
  private sessionRegistered: boolean = false;
  private connectionTimeout?: ReturnType<typeof setTimeout>;
  private readonly CONNECTION_TIMEOUT = 30000; // 30 seconds

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
    if (this.status !== 'connected' || !this.ws) {
      throw new Error('Not connected to agent');
    }

    // In a real implementation, this would send a text message via WebSocket
    // For now, this is a stub
    console.log('Sending text to agent:', text);
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
            console.warn(`Retrying signed URL renewal (attempt ${attempt}):`, error.message);
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
          this.handleError(error instanceof Error ? error : new Error(String(error)));
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
   */
  startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.status === 'connected' && this.ws) {
        // Send heartbeat ping
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.warn('Heartbeat ping failed:', error);
          this.handleConnectionFailure();
        }

        // Set timeout for heartbeat response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout - connection may be dead');
          this.handleConnectionFailure();
        }, this.heartbeatConfig.timeout);
      }
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
          console.warn('Failed to fetch signed URL, continuing without it:', error);
        }
      }

      // Request microphone permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Store stream for later use (in real implementation)
        stream.getTracks().forEach((track) => track.stop()); // Stop for now, will use in real connection
      } catch (error) {
        throw new Error(
          'Microphone permission denied. Please allow microphone access to use voice features.'
        );
      }

      // In a real implementation, this would:
      // 1. Initialize ElevenLabs SDK with signedUrl
      // 2. Create WebSocket connection
      // 3. Set up audio streams
      // For now, simulate connection
      await new Promise((resolve) => setTimeout(resolve, 100));

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
      // In a real implementation, extract sessionUrl from ElevenLabs SDK session object
      // For now, use a placeholder - the actual implementation would extract from the SDK
      const sessionUrl = this.signedUrl || 'wss://placeholder-session-url';

      await retryWithBackoff(
        () =>
          registerSession(this.conversationId!, {
            sessionUrl,
            sessionId: `session-${Date.now()}`,
            metadata: {
              agentId: this.agentId,
              connectedAt: new Date().toISOString(),
            },
          }),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, error) => {
            console.warn(`Retrying session registration (attempt ${attempt}):`, error.message);
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
   * Internal: Handle connection failure
   * Implements Task 28: Network Failure Handling
   */
  private handleConnectionFailure(): void {
    this.cleanup();
    this.sessionRegistered = false; // Reset session registration on failure

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectWithBackoff().catch((error) => {
        this.handleError(error);
      });
    } else {
      this.status = 'error';
      this.notifyStatusChange();
      if (this.config.onError) {
        this.config.onError(
          new Error('Connection failed after multiple retry attempts. Please try again.')
        );
      }
    }
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
   * Internal: Cleanup resources
   */
  private cleanup(): void {
    this.stopHeartbeat();
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = undefined;
    }
    if (this.signedUrlRenewalTimer) {
      clearTimeout(this.signedUrlRenewalTimer);
      this.signedUrlRenewalTimer = undefined;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
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

