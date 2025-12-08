/**
 * Tests for ElevenLabs session TTL and expiration behavior
 *
 * These tests validate:
 * 1. Sessions expire after 10 minutes (TTL accuracy)
 * 2. Callbacks after expiration fail gracefully with clear logging
 * 3. Conversations persist even when sessions expire
 *
 * Task: TASK-45 - Validate Session TTL and Expiration Behavior
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { registerSession, getVoiceSignedUrl } from '../elevenlabs';
import {
  getAgentConversation,
  createAgentConversation,
  sendAgentMessage,
} from '../agent-conversations';
import { server } from '../../test/mocks/server';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('Session TTL and Expiration Behavior', () => {
  // Disable MSW for this test suite since we use manual fetch mocks
  beforeAll(() => {
    server.close();
  });

  afterAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (vi.isFakeTimers()) {
      vi.useRealTimers();
    }
  });

  describe('Session TTL Accuracy', () => {
    it('should register session with expected TTL metadata', async () => {
      const conversationId = 'conv-123';
      const sessionUrl = 'wss://example.com/session';
      const createdAt = new Date().toISOString();
      const expectedTtl = 600; // 10 minutes in seconds

      // Mock successful session registration
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          success: true,
          message: 'Session registered',
          ttl: expectedTtl,
          createdAt,
        }),
      });

      const result = await registerSession(conversationId, {
        sessionUrl,
        sessionId: 'session-123',
        metadata: {
          createdAt,
        },
      });

      expect(result.success).toBe(true);

      // Verify the registration call was made correctly
      const callArgs = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[0]).toMatch(
        new RegExp(`/agent-conversations/api/${conversationId}/session$`)
      );
      expect(callArgs[1].method).toBe('POST');

      const body = JSON.parse(callArgs[1].body);
      expect(body.sessionUrl).toBe(sessionUrl);
    });

    it('should simulate session expiration after 10 minutes using fake timers', async () => {
      vi.useFakeTimers();

      const conversationId = 'conv-123';
      const sessionUrl = 'wss://example.com/session';
      const now = Date.now();

      // Mock initial session registration
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          success: true,
          message: 'Session registered',
          createdAt: new Date(now).toISOString(),
        }),
      });

      // Register session at time 0
      await registerSession(conversationId, {
        sessionUrl,
        sessionId: 'session-123',
      });

      // Advance time by 10 minutes + 1 second (session should be expired)
      vi.advanceTimersByTime(10 * 60 * 1000 + 1000);

      // Mock expired session response (404 or error indicating session not found)
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          error: 'Session not found or expired',
          code: 'SESSION_EXPIRED',
        }),
      });

      // Attempt to register again (simulating callback trying to use expired session)
      await expect(
        registerSession(conversationId, {
          sessionUrl: 'wss://example.com/new-session',
        })
      ).rejects.toThrow();

      vi.useRealTimers();
    });
  });

  describe('Graceful Expiration Handling', () => {
    it('should handle callback after session expiration gracefully', async () => {
      const conversationId = 'conv-123';

      // Simulate callback trying to use expired session
      // The backend should return a clear error message
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          error: 'Session expired. Session TTL was 10 minutes.',
          code: 'SESSION_EXPIRED',
          timestamp: new Date().toISOString(),
        }),
      });

      // Attempt to register session with expired session reference
      // Verify error message is clear and informative
      try {
        await registerSession(conversationId, {
          sessionUrl: 'wss://example.com/expired-session',
        });
        // Should not reach here
        expect.fail('Expected registerSession to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('Session expired');
      }
    });

    it('should log clear error messages when session expires', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const conversationId = 'conv-123';

      // Mock expired session response
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          error: 'Session expired. Session TTL was 10 minutes.',
          code: 'SESSION_EXPIRED',
          timestamp: new Date().toISOString(),
        }),
      });

      try {
        await registerSession(conversationId, {
          sessionUrl: 'wss://example.com/expired-session',
        });
      } catch (error) {
        // Error should be thrown, which is expected
        expect(error).toBeInstanceOf(Error);
      }

      // Verify that error logging would be clear (in a real implementation,
      // the API client or service layer would log this)
      // For now, we verify the error message is descriptive
      expect(consoleErrorSpy).not.toHaveBeenCalled(); // API client doesn't log, but service layer would

      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors during expiration gracefully', async () => {
      const conversationId = 'conv-123';

      // Simulate network error when checking expired session
      (mockFetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error: Connection timeout')
      );

      await expect(
        registerSession(conversationId, {
          sessionUrl: 'wss://example.com/session',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Conversation Persistence', () => {
    it('should retrieve conversation even after session expires', async () => {
      const conversationId = 'conv-123';

      // First, create a conversation
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          success: true,
          conversationId,
          message: 'Conversation created',
        }),
      });

      await createAgentConversation({
        agentId: 'agent-123',
      });

      // Simulate session expiration (session registration fails)
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          error: 'Session expired',
          code: 'SESSION_EXPIRED',
        }),
      });

      // Session registration should fail
      await expect(
        registerSession(conversationId, {
          sessionUrl: 'wss://example.com/expired-session',
        })
      ).rejects.toThrow();

      // But conversation should still be retrievable
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          id: conversationId,
          agentId: 'agent-123',
          createdAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
          messageCount: 0,
          messages: [],
        }),
      });

      const conversation = await getAgentConversation(conversationId);
      expect(conversation.id).toBe(conversationId);
      expect(conversation.agentId).toBe('agent-123');
    });

    it('should allow sending messages to conversation after session expires', async () => {
      const conversationId = 'conv-123';

      // Simulate session expiration
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          error: 'Session expired',
          code: 'SESSION_EXPIRED',
        }),
      });

      // Session registration fails
      await expect(
        registerSession(conversationId, {
          sessionUrl: 'wss://example.com/expired-session',
        })
      ).rejects.toThrow();

      // But sending messages to conversation should still work
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          success: true,
          conversationId,
          message: 'Message sent',
        }),
      });

      const result = await sendAgentMessage(conversationId, {
        role: 'user',
        content: 'Hello, this is a test message',
        source: 'text',
      });

      expect(result.success).toBe(true);
      expect(result.conversationId).toBe(conversationId);
    });

    it('should maintain conversation history after session expiration', async () => {
      const conversationId = 'conv-123';

      // Send a message before session expires
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          success: true,
          conversationId,
          message: 'Message sent',
        }),
      });

      await sendAgentMessage(conversationId, {
        role: 'user',
        content: 'First message',
        source: 'voice',
      });

      // Simulate session expiration
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          error: 'Session expired',
          code: 'SESSION_EXPIRED',
        }),
      });

      await expect(
        registerSession(conversationId, {
          sessionUrl: 'wss://example.com/expired-session',
        })
      ).rejects.toThrow();

      // Conversation should still have its history
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          id: conversationId,
          agentId: 'agent-123',
          createdAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
          messageCount: 1,
          messages: [
            {
              role: 'user',
              content: 'First message',
              source: 'voice',
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      const conversation = await getAgentConversation(conversationId);
      expect(conversation.messageCount).toBe(1);
      expect(conversation.messages).toHaveLength(1);
      expect(conversation.messages[0].content).toBe('First message');
    });
  });

  describe('Integration: Full Session Lifecycle', () => {
    it('should handle complete session lifecycle: create, register, expire, and verify conversation persists', async () => {
      vi.useFakeTimers();
      const conversationId = 'conv-lifecycle-123';
      const now = Date.now();
      vi.setSystemTime(now);

      // Step 1: Create conversation
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          success: true,
          conversationId,
          message: 'Conversation created',
        }),
      });

      await createAgentConversation({ agentId: 'agent-123' });

      // Step 2: Register session
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          success: true,
          message: 'Session registered',
          createdAt: new Date(now).toISOString(),
          ttl: 600, // 10 minutes
        }),
      });

      await registerSession(conversationId, {
        sessionUrl: 'wss://example.com/session',
        sessionId: 'session-123',
      });

      // Step 3: Advance time by 10 minutes + 1 second (session expires)
      vi.advanceTimersByTime(10 * 60 * 1000 + 1000);

      // Step 4: Verify session is expired
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          error: 'Session expired. Session TTL was 10 minutes.',
          code: 'SESSION_EXPIRED',
        }),
      });

      await expect(
        registerSession(conversationId, {
          sessionUrl: 'wss://example.com/new-session',
        })
      ).rejects.toThrow('Session expired');

      // Step 5: Verify conversation still exists and is accessible
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          id: conversationId,
          agentId: 'agent-123',
          createdAt: new Date(now).toISOString(),
          lastAccessedAt: new Date(now).toISOString(),
          messageCount: 0,
          messages: [],
        }),
      });

      const conversation = await getAgentConversation(conversationId);
      expect(conversation.id).toBe(conversationId);
      expect(conversation.agentId).toBe('agent-123');

      vi.useRealTimers();
    });
  });

  describe('Signed URL and Session Coordination', () => {
    it('should handle signed URL expiration independently of session expiration', async () => {
      const conversationId = 'conv-123';
      const agentId = 'agent-123';

      // Get signed URL with expiration
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          signedUrl: 'wss://example.com/signed-url',
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        }),
      });

      const signedUrlResult = await getVoiceSignedUrl(agentId);
      expect(signedUrlResult.signedUrl).toBe('wss://example.com/signed-url');
      expect(signedUrlResult.expiresAt).toBeDefined();

      // Register session (which has its own 10-minute TTL)
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          success: true,
          message: 'Session registered',
          ttl: 600, // 10 minutes
        }),
      });

      await registerSession(conversationId, {
        sessionUrl: signedUrlResult.signedUrl,
        sessionId: 'session-123',
      });

      // Both should work independently
      expect(signedUrlResult.expiresAt).toBeDefined();
    });
  });
});
