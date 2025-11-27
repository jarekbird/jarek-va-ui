/**
 * ElevenLabs Voice Service
 * Manages WebSocket/WebRTC connection to ElevenLabs conversational agent
 */

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface VoiceServiceConfig {
  agentId?: string;
  signedUrl?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
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
  private agentId?: string;
  private signedUrl?: string;
  private signedUrlExpiresAt?: Date;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private heartbeatInterval?: ReturnType<typeof setInterval>;
  private heartbeatTimeout?: ReturnType<typeof setTimeout>;
  private heartbeatConfig: HeartbeatConfig = {
    interval: 30000, // 30 seconds
    timeout: 60000, // 60 seconds
  };
  private config: VoiceServiceConfig = {};
  private ws?: WebSocket;

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Start a voice session with the ElevenLabs agent
   */
  async startVoiceSession(agentId: string, signedUrl?: string): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') {
      throw new Error('Voice session already active');
    }

    this.agentId = agentId;
    this.signedUrl = signedUrl;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    await this.connect();
  }

  /**
   * End the current voice session
   */
  endVoiceSession(): void {
    this.cleanup();
    this.status = 'disconnected';
    this.agentId = undefined;
    this.signedUrl = undefined;
    this.signedUrlExpiresAt = undefined;
    this.reconnectAttempts = 0;
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
   */
  async renewSignedUrl(): Promise<void> {
    if (!this.agentId) {
      throw new Error('No agent ID set');
    }

    // Fetch new signed URL from backend
    const agentUrl = import.meta.env.VITE_ELEVENLABS_AGENT_URL || '';
    const url = agentUrl ? `${agentUrl}/signed-url?agent_id=${this.agentId}` : `/signed-url?agent_id=${this.agentId}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to renew signed URL: ${response.statusText}`);
      }

      const data = await response.json();
      this.signedUrl = data.url;
      if (data.expiresAt) {
        this.signedUrlExpiresAt = new Date(data.expiresAt);
      }

      // Reconnect if currently connected
      if (this.status === 'connected') {
        await this.reconnect();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  async reconnectWithBackoff(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.status = 'error';
      this.notifyStatusChange();
      throw new Error('Max reconnection attempts reached');
    }

    this.status = 'reconnecting';
    this.notifyStatusChange();

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    await new Promise((resolve) => setTimeout(resolve, delay));

    this.reconnectAttempts++;
    await this.connect();
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
   */
  private async connect(): Promise<void> {
    this.status = 'connecting';
    this.notifyStatusChange();

    try {
      // Check if signed URL is expired
      if (this.signedUrlExpiresAt && new Date() >= this.signedUrlExpiresAt) {
        await this.renewSignedUrl();
      } else if (!this.signedUrl && this.agentId) {
        // If no signed URL provided, try to fetch one
        try {
          await this.renewSignedUrl();
        } catch (error) {
          // Continue without signed URL if fetch fails
          console.warn('Failed to fetch signed URL, continuing without it:', error);
        }
      }

      // In a real implementation, this would create a WebSocket connection
      // For now, simulate connection
      await new Promise((resolve) => setTimeout(resolve, 100));

      this.status = 'connected';
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.notifyStatusChange();
      this.startHeartbeat();

      if (this.config.onConnect) {
        this.config.onConnect();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleError(err);
      throw err;
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
   */
  private handleConnectionFailure(): void {
    this.cleanup();
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectWithBackoff().catch((error) => {
        this.handleError(error);
      });
    } else {
      this.status = 'error';
      this.notifyStatusChange();
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
   * Internal: Cleanup resources
   */
  private cleanup(): void {
    this.stopHeartbeat();
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

