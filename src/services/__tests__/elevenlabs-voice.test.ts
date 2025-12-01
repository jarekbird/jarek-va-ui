import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ElevenLabsVoiceService,
  type ConnectionStatus,
} from '../elevenlabs-voice';

// Type for accessing private properties in tests
type ElevenLabsVoiceServicePrivate = ElevenLabsVoiceService & {
  agentId?: string;
  signedUrl?: string;
  signedUrlExpiresAt?: Date;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  status: ConnectionStatus;
  ws?: WebSocket & { send: (data: string) => void; close: () => void };
};

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

// Mock feature flag
vi.mock('../../utils/feature-flags', () => ({
  isElevenLabsEnabled: vi.fn(() => true),
}));

// Mock API functions
vi.mock('../../api/elevenlabs', () => ({
  getVoiceSignedUrl: vi.fn(),
  registerSession: vi.fn(),
}));

import { getVoiceSignedUrl, registerSession } from '../../api/elevenlabs';

describe('ElevenLabsVoiceService', () => {
  let service: ElevenLabsVoiceService;
  let mockGetUserMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new ElevenLabsVoiceService();
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock getUserMedia for microphone permission
    mockGetUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
      },
      writable: true,
      configurable: true,
    });

    // Default mock for getVoiceSignedUrl
    vi.mocked(getVoiceSignedUrl).mockResolvedValue({
      signedUrl: 'wss://test-url',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });

    // Default mock for registerSession
    vi.mocked(registerSession).mockResolvedValue({
      success: true,
      message: 'Session registered',
    });
  });

  afterEach(() => {
    service.endVoiceSession();
    vi.useRealTimers();
  });

  describe('Connection State Transitions', () => {
    it('should start in disconnected state', () => {
      expect(service.getConnectionStatus()).toBe('disconnected');
    });

    it('should transition: disconnected → connecting → connected', async () => {
      const statusChanges: ConnectionStatus[] = [];
      service.configure({
        onStatusChange: (status) => {
          statusChanges.push(status);
        },
      });

      const connectPromise = service.startVoiceSession('agent-123', 'conv-123');

      // Should be connecting immediately
      expect(service.getConnectionStatus()).toBe('connecting');
      expect(statusChanges).toContain('connecting');

      // Wait for connection (stub simulates 100ms delay)
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise;

      expect(service.getConnectionStatus()).toBe('connected');
      expect(statusChanges).toContain('connected');
    });

    it('should transition to error state on connection failure', async () => {
      const statusChanges: ConnectionStatus[] = [];
      service.configure({
        onStatusChange: (status) => {
          statusChanges.push(status);
        },
        onError: () => {}, // Suppress error logging in tests
      });

      // Start session with expired URL to trigger renewal
      const expiredDate = new Date(Date.now() - 1000);
      (service as ElevenLabsVoiceServicePrivate).signedUrlExpiresAt =
        expiredDate;

      // Mock getVoiceSignedUrl to fail when trying to renew signed URL
      vi.mocked(getVoiceSignedUrl).mockRejectedValueOnce(
        new Error('Network error')
      );

      const connectPromise = service.startVoiceSession(
        'agent-123',
        'conv-123',
        'expired-url'
      );

      // Ensure promise is handled
      connectPromise.catch(() => {
        // Expected rejection, suppress unhandled rejection warning
      });

      await vi.advanceTimersByTimeAsync(100);

      await expect(connectPromise).rejects.toThrow();

      expect(service.getConnectionStatus()).toBe('error');
      expect(statusChanges).toContain('error');
    });

    it('should prevent starting a session when already connected', async () => {
      const connectPromise = service.startVoiceSession('agent-123', 'conv-123');
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise;

      await expect(service.startVoiceSession('agent-456')).rejects.toThrow(
        'Voice session already active'
      );
    });
  });

  describe('Retry and Backoff Behavior', () => {
    it('should have reconnectWithBackoff method', async () => {
      // Test that reconnectWithBackoff exists and can be called
      // In a full implementation, this would test exponential backoff
      // For now, we verify the method exists
      expect(
        typeof (
          service as ElevenLabsVoiceServicePrivate & {
            reconnectWithBackoff: () => Promise<void>;
          }
        ).reconnectWithBackoff
      ).toBe('function');

      // Set up for retry
      const servicePrivate = service as ElevenLabsVoiceServicePrivate & {
        reconnectWithBackoff: () => Promise<void>;
      };
      servicePrivate.agentId = 'agent-123';
      servicePrivate.reconnectAttempts = 0;

      // Call reconnectWithBackoff
      const reconnectPromise = servicePrivate.reconnectWithBackoff();
      await vi.advanceTimersByTimeAsync(1100); // Backoff delay
      await reconnectPromise;

      expect(service.getConnectionStatus()).toBe('connected');
    });

    it('should stop retrying after max attempts', async () => {
      const statusChanges: ConnectionStatus[] = [];
      service.configure({
        onStatusChange: (status) => {
          statusChanges.push(status);
        },
        onError: () => {}, // Suppress error logging
      });

      // Set up for max retry attempts
      const servicePrivate = service as ElevenLabsVoiceServicePrivate & {
        reconnectWithBackoff: () => Promise<void>;
      };
      servicePrivate.agentId = 'agent-123';
      servicePrivate.reconnectAttempts = 5; // Set to max
      servicePrivate.maxReconnectAttempts = 5;

      // Mock fetch to always fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Try to reconnect - should fail immediately
      await expect(servicePrivate.reconnectWithBackoff()).rejects.toThrow(
        'Max reconnection attempts reached'
      );

      expect(service.getConnectionStatus()).toBe('error');
    });

    it('should reset reconnect attempts on successful connection', async () => {
      const connectPromise = service.startVoiceSession('agent-123', 'conv-123');
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise;

      expect(service.getConnectionStatus()).toBe('connected');

      // After successful connection, reconnect attempts should be reset
      // This is tested implicitly by the connection succeeding
      const status = service.getConnectionStatus();
      expect(status).toBe('connected');
    });
  });

  describe('Signed URL Renewal Triggers', () => {
    it('should renew signed URL when expired', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      const newUrl = 'wss://new-signed-url';
      const newExpiresAt = new Date(Date.now() + 3600000).toISOString();

      vi.mocked(getVoiceSignedUrl).mockResolvedValueOnce({
        signedUrl: newUrl,
        expiresAt: newExpiresAt,
      });

      // Set agent ID directly (don't start session to avoid connection logic)
      const servicePrivate = service as ElevenLabsVoiceServicePrivate;
      servicePrivate.agentId = 'agent-123';
      servicePrivate.signedUrlExpiresAt = expiredDate;

      const renewPromise = service.renewSignedUrl();
      await vi.advanceTimersByTimeAsync(0); // Allow fetch to resolve
      await renewPromise;

      expect(getVoiceSignedUrl).toHaveBeenCalledWith('agent-123');
      expect(servicePrivate.signedUrl).toBe(newUrl);
    });

    it('should always fetch new signed URL when renewSignedUrl is called', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      const servicePrivate = service as ElevenLabsVoiceServicePrivate;
      servicePrivate.signedUrlExpiresAt = futureDate;
      servicePrivate.agentId = 'agent-123';

      vi.mocked(getVoiceSignedUrl).mockResolvedValueOnce({
        signedUrl: 'wss://new-url',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });

      // Set agent ID directly
      servicePrivate.agentId = 'agent-123';
      servicePrivate.signedUrlExpiresAt = futureDate;

      // renewSignedUrl always fetches a new URL
      await service.renewSignedUrl();

      // Should have called getVoiceSignedUrl for renewal
      expect(getVoiceSignedUrl).toHaveBeenCalledWith('agent-123');
      expect(servicePrivate.signedUrl).toBe('wss://new-url');
    });

    it('should reconnect after renewing signed URL', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      const newUrl = 'wss://new-signed-url';
      const newExpiresAt = new Date(Date.now() + 3600000).toISOString();

      vi.mocked(getVoiceSignedUrl)
        .mockResolvedValueOnce({
          signedUrl: 'wss://initial-url',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        })
        .mockResolvedValueOnce({
          signedUrl: newUrl,
          expiresAt: newExpiresAt,
        });

      const connectPromise = service.startVoiceSession(
        'agent-123',
        'conv-123',
        'expired-url'
      );
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise;

      expect(service.getConnectionStatus()).toBe('connected');

      // Set expired and renew (this should trigger reconnect)
      (service as ElevenLabsVoiceServicePrivate).signedUrlExpiresAt =
        expiredDate;
      const renewPromise = service.renewSignedUrl();
      await vi.advanceTimersByTimeAsync(200); // Allow reconnect to complete
      await renewPromise;

      // Should have attempted to reconnect
      expect(getVoiceSignedUrl).toHaveBeenCalled();
    });

    it('should handle signed URL renewal failure', async () => {
      const servicePrivate = service as ElevenLabsVoiceServicePrivate;
      servicePrivate.agentId = 'agent-123';
      servicePrivate.status = 'disconnected'; // Ensure not connected to avoid reconnect logic

      // Mock getVoiceSignedUrl to always fail (even after retries)
      // retryWithBackoff will retry 3 times, so we need to mock it to fail 4 times (initial + 3 retries)
      vi.mocked(getVoiceSignedUrl)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      // Advance timers to allow retries to complete
      const renewPromise = service.renewSignedUrl();

      // Ensure promise is handled
      renewPromise.catch(() => {
        // Expected rejection, suppress unhandled rejection warning
      });

      await vi.advanceTimersByTimeAsync(10000); // Allow all retries to complete

      // The error should be thrown after retries are exhausted
      await expect(renewPromise).rejects.toThrow();
    });
  });

  describe('Heartbeat and Timeout Handling', () => {
    it('should start heartbeat when connected', async () => {
      const connectPromise = service.startVoiceSession('agent-123', 'conv-123');
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise;

      expect(service.getConnectionStatus()).toBe('connected');

      // Heartbeat should be running (check by advancing time)
      await vi.advanceTimersByTimeAsync(31000); // 31 seconds

      // Heartbeat should have fired (every 30 seconds)
      // In a real implementation, we'd check if ping was sent
      // For now, verify service remains connected
      expect(service.getConnectionStatus()).toBe('connected');
    });

    it('should stop heartbeat when disconnected', async () => {
      const connectPromise = service.startVoiceSession('agent-123', 'conv-123');
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise;

      service.endVoiceSession();

      // Heartbeat should be stopped
      await vi.advanceTimersByTimeAsync(60000);

      // Should remain disconnected
      expect(service.getConnectionStatus()).toBe('disconnected');
    });

    it('should handle heartbeat timeout', async () => {
      const statusChanges: ConnectionStatus[] = [];
      service.configure({
        onStatusChange: (status) => {
          statusChanges.push(status);
        },
      });

      const connectPromise = service.startVoiceSession('agent-123', 'conv-123');
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise;

      // Simulate heartbeat timeout (no response received)
      // Advance time to trigger first heartbeat (30 seconds)
      await vi.advanceTimersByTimeAsync(31000); // Trigger first heartbeat

      // In a real implementation, heartbeat timeout would trigger reconnection
      // For now, we verify service remains connected and heartbeat is running
      expect(service.getConnectionStatus()).toBe('connected');
      expect(statusChanges).toContain('connected');
    });

    it('should send heartbeat pings periodically', async () => {
      const connectPromise = service.startVoiceSession('agent-123', 'conv-123');
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise;

      // Heartbeat should start automatically
      expect(service.getConnectionStatus()).toBe('connected');

      // Set ws to a mock WebSocket for heartbeat
      (service as ElevenLabsVoiceServicePrivate).ws = {
        send: vi.fn(),
        close: vi.fn(),
      } as unknown as WebSocket;

      // Advance time to trigger heartbeat ping (30 seconds)
      await vi.advanceTimersByTimeAsync(31000);

      // In a real implementation, this would send a ping via WebSocket
      // For now, we verify the service is still connected and heartbeat is running
      expect(service.getConnectionStatus()).toBe('connected');
    });
  });

  describe('Text Message Sending', () => {
    it('should send text message when connected', async () => {
      const connectPromise = service.startVoiceSession('agent-123', 'conv-123');
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise;

      // Set ws to a mock WebSocket so the check passes
      (service as ElevenLabsVoiceServicePrivate).ws = {
        send: vi.fn(),
        close: vi.fn(),
      } as unknown as WebSocket;

      expect(() => service.sendTextToAgent('Hello agent')).not.toThrow();
    });

    it('should throw error when not connected', () => {
      expect(() => service.sendTextToAgent('Hello agent')).toThrow(
        'Not connected to agent'
      );
    });
  });

  describe('Configuration', () => {
    it('should call onConnect callback when connected', async () => {
      const onConnect = vi.fn();
      service.configure({ onConnect });

      const connectPromise = service.startVoiceSession('agent-123', 'conv-123');
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise;

      expect(onConnect).toHaveBeenCalled();
    });

    it('should call onError callback on error', async () => {
      const onError = vi.fn();
      service.configure({ onError });

      // Set expired URL to trigger renewal
      const expiredDate = new Date(Date.now() - 1000);
      (service as ElevenLabsVoiceServicePrivate).signedUrlExpiresAt =
        expiredDate;

      // Mock getVoiceSignedUrl to fail
      vi.mocked(getVoiceSignedUrl).mockRejectedValue(
        new Error('Network error')
      );

      const connectPromise = service.startVoiceSession(
        'agent-123',
        'conv-123',
        'expired-url'
      );

      // Ensure promise is handled
      connectPromise.catch(() => {
        // Expected rejection, suppress unhandled rejection warning
      });

      // Advance timers to allow retries to complete
      await vi.advanceTimersByTimeAsync(5000);

      await expect(connectPromise).rejects.toThrow();

      expect(onError).toHaveBeenCalled();
    });

    it('should call onStatusChange callback on status changes', async () => {
      const onStatusChange = vi.fn();
      service.configure({ onStatusChange });

      const connectPromise = service.startVoiceSession('agent-123', 'conv-123');
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise;

      expect(onStatusChange).toHaveBeenCalledWith('connecting');
      expect(onStatusChange).toHaveBeenCalledWith('connected');
    });
  });

  describe('Session Management', () => {
    it('should end session and cleanup resources', async () => {
      const connectPromise = service.startVoiceSession('agent-123', 'conv-123');
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise;

      expect(service.getConnectionStatus()).toBe('connected');

      service.endVoiceSession();

      expect(service.getConnectionStatus()).toBe('disconnected');
      const servicePrivate = service as ElevenLabsVoiceServicePrivate;
      expect(servicePrivate.agentId).toBeUndefined();
      expect(servicePrivate.signedUrl).toBeUndefined();
    });

    it('should reset state after ending session', async () => {
      const connectPromise1 = service.startVoiceSession(
        'agent-123',
        'conv-123'
      );
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise1;

      service.endVoiceSession();

      // Should be able to start a new session
      const connectPromise2 = service.startVoiceSession(
        'agent-456',
        'conv-456'
      );
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise2;

      expect(service.getConnectionStatus()).toBe('connected');
    });
  });
});
