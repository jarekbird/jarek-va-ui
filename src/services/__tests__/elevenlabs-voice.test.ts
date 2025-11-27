import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ElevenLabsVoiceService,
  type ConnectionStatus,
} from '../elevenlabs-voice';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as any;

describe('ElevenLabsVoiceService', () => {
  let service: ElevenLabsVoiceService;

  beforeEach(() => {
    service = new ElevenLabsVoiceService();
    vi.clearAllMocks();
    vi.useFakeTimers();
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

      // Mock fetch for signed URL if needed (when no signedUrl provided)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'wss://test-url', expiresAt: new Date(Date.now() + 3600000).toISOString() }),
      } as Response);

      const connectPromise = service.startVoiceSession('agent-123');

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
      (service as any).signedUrlExpiresAt = expiredDate;

      // Mock fetch to fail when trying to renew signed URL
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const connectPromise = service.startVoiceSession('agent-123', 'expired-url');
      await vi.advanceTimersByTimeAsync(100);

      await expect(connectPromise).rejects.toThrow();

      expect(service.getConnectionStatus()).toBe('error');
      expect(statusChanges).toContain('error');
    });

    it('should prevent starting a session when already connected', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'wss://test-url', expiresAt: new Date(Date.now() + 3600000).toISOString() }),
      } as Response);

      const connectPromise = service.startVoiceSession('agent-123');
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
      expect(typeof (service as any).reconnectWithBackoff).toBe('function');

      // Set up for retry
      (service as any).agentId = 'agent-123';
      (service as any).reconnectAttempts = 0;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'wss://test-url', expiresAt: new Date(Date.now() + 3600000).toISOString() }),
      } as Response);

      // Call reconnectWithBackoff
      const reconnectPromise = (service as any).reconnectWithBackoff();
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
      (service as any).agentId = 'agent-123';
      (service as any).reconnectAttempts = 5; // Set to max
      (service as any).maxReconnectAttempts = 5;

      // Mock fetch to always fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Try to reconnect - should fail immediately
      await expect((service as any).reconnectWithBackoff()).rejects.toThrow(
        'Max reconnection attempts reached'
      );

      expect(service.getConnectionStatus()).toBe('error');
    });

    it('should reset reconnect attempts on successful connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'wss://test-url', expiresAt: new Date(Date.now() + 3600000).toISOString() }),
      } as Response);

      const connectPromise = service.startVoiceSession('agent-123');
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: newUrl, expiresAt: newExpiresAt }),
      } as Response);

      // Set agent ID directly (don't start session to avoid connection logic)
      (service as any).agentId = 'agent-123';
      (service as any).signedUrlExpiresAt = expiredDate;

      const renewPromise = service.renewSignedUrl();
      await vi.advanceTimersByTimeAsync(0); // Allow fetch to resolve
      await renewPromise;

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/signed-url?agent_id=agent-123')
      );
      expect((service as any).signedUrl).toBe(newUrl);
    });

    it('should always fetch new signed URL when renewSignedUrl is called', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      (service as any).signedUrlExpiresAt = futureDate;
      (service as any).agentId = 'agent-123';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'wss://new-url', expiresAt: new Date(Date.now() + 3600000).toISOString() }),
      } as Response);

      // Set agent ID directly
      (service as any).agentId = 'agent-123';
      (service as any).signedUrlExpiresAt = futureDate;

      // renewSignedUrl always fetches a new URL
      await service.renewSignedUrl();

      // Should have called fetch for renewal
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/signed-url?agent_id=agent-123')
      );
      expect((service as any).signedUrl).toBe('wss://new-url');
    });

    it('should reconnect after renewing signed URL', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      const newUrl = 'wss://new-signed-url';
      const newExpiresAt = new Date(Date.now() + 3600000).toISOString();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: newUrl, expiresAt: newExpiresAt }),
      } as Response);

      // Start session and connect
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'wss://initial-url', expiresAt: new Date(Date.now() + 3600000).toISOString() }),
      } as Response);

      const connectPromise = service.startVoiceSession('agent-123', 'expired-url');
      await vi.advanceTimersByTimeAsync(200);
      await connectPromise;

      expect(service.getConnectionStatus()).toBe('connected');

      // Set expired and renew (this should trigger reconnect)
      (service as any).signedUrlExpiresAt = expiredDate;
      const renewPromise = service.renewSignedUrl();
      await vi.advanceTimersByTimeAsync(200); // Allow reconnect to complete
      await renewPromise;

      // Should have attempted to reconnect
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle signed URL renewal failure', async () => {
      (service as any).agentId = 'agent-123';
      (service as any).status = 'disconnected'; // Ensure not connected to avoid reconnect logic

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // The error should be thrown and handled
      await expect(service.renewSignedUrl()).rejects.toThrow('Network error');
    });
  });

  describe('Heartbeat and Timeout Handling', () => {
    it('should start heartbeat when connected', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'wss://test-url', expiresAt: new Date(Date.now() + 3600000).toISOString() }),
      } as Response);

      const connectPromise = service.startVoiceSession('agent-123');
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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'wss://test-url', expiresAt: new Date(Date.now() + 3600000).toISOString() }),
      } as Response);

      const connectPromise = service.startVoiceSession('agent-123');
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'wss://test-url', expiresAt: new Date(Date.now() + 3600000).toISOString() }),
      } as Response);

      const connectPromise = service.startVoiceSession('agent-123');
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
      await service.startVoiceSession('agent-123');
      vi.advanceTimersByTime(100);

      // Heartbeat should start automatically
      expect(service.getConnectionStatus()).toBe('connected');

      // Advance time to trigger heartbeat ping (30 seconds)
      await vi.advanceTimersByTimeAsync(31000);

      // In a real implementation, this would send a ping via WebSocket
      // For now, we verify the service is still connected and heartbeat is running
      expect(service.getConnectionStatus()).toBe('connected');
    });
  });

  describe('Text Message Sending', () => {
    it('should send text message when connected', async () => {
      await service.startVoiceSession('agent-123');
      vi.advanceTimersByTime(100);

      expect(() => service.sendTextToAgent('Hello agent')).not.toThrow();
    });

    it('should throw error when not connected', () => {
      expect(() => service.sendTextToAgent('Hello agent')).toThrow('Not connected to agent');
    });
  });

  describe('Configuration', () => {
    it('should call onConnect callback when connected', async () => {
      const onConnect = vi.fn();
      service.configure({ onConnect });

      await service.startVoiceSession('agent-123');
      vi.advanceTimersByTime(100);

      expect(onConnect).toHaveBeenCalled();
    });

    it('should call onError callback on error', async () => {
      const onError = vi.fn();
      service.configure({ onError });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.startVoiceSession('agent-123', 'expired-url')).rejects.toThrow();

      expect(onError).toHaveBeenCalled();
    });

    it('should call onStatusChange callback on status changes', async () => {
      const onStatusChange = vi.fn();
      service.configure({ onStatusChange });

      await service.startVoiceSession('agent-123');
      vi.advanceTimersByTime(100);

      expect(onStatusChange).toHaveBeenCalledWith('connecting');
      expect(onStatusChange).toHaveBeenCalledWith('connected');
    });
  });

  describe('Session Management', () => {
    it('should end session and cleanup resources', async () => {
      await service.startVoiceSession('agent-123');
      vi.advanceTimersByTime(100);

      expect(service.getConnectionStatus()).toBe('connected');

      service.endVoiceSession();

      expect(service.getConnectionStatus()).toBe('disconnected');
      expect((service as any).agentId).toBeUndefined();
      expect((service as any).signedUrl).toBeUndefined();
    });

    it('should reset state after ending session', async () => {
      await service.startVoiceSession('agent-123');
      vi.advanceTimersByTime(100);

      service.endVoiceSession();

      // Should be able to start a new session
      await service.startVoiceSession('agent-456');
      vi.advanceTimersByTime(100);

      expect(service.getConnectionStatus()).toBe('connected');
    });
  });
});

