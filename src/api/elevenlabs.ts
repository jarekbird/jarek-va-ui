/**
 * API client for ElevenLabs agent service.
 * Handles signed URL requests and session registration.
 */

/**
 * Base URL for ElevenLabs agent API endpoints.
 * Uses VITE_ELEVENLABS_AGENT_URL if set, otherwise defaults to relative path.
 */
const getElevenLabsApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_ELEVENLABS_AGENT_URL;
  if (envUrl) {
    return envUrl;
  }
  // Default to relative path - will be proxied by nginx/Traefik
  return '';
};

/**
 * Response from getting a signed URL
 */
export interface SignedUrlResponse {
  signedUrl: string;
  expiresAt?: string;
}

/**
 * Request body for registering a session
 */
export interface RegisterSessionRequest {
  sessionUrl: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Response from registering a session
 */
export interface RegisterSessionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Get a signed URL for connecting to an ElevenLabs agent
 * @param agentId - Optional agent ID
 * @returns Promise resolving to signed URL and expiration
 * @throws Error if the API request fails
 */
export async function getVoiceSignedUrl(
  agentId?: string
): Promise<SignedUrlResponse> {
  const baseUrl = getElevenLabsApiBaseUrl();
  const url = agentId
    ? `${baseUrl}/signed-url?agentId=${encodeURIComponent(agentId)}`
    : `${baseUrl}/signed-url`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Check if response is actually JSON before parsing
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `Expected JSON but received ${contentType}. Response: ${text.substring(0, 200)}`
    );
  }

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      errorData.error || `Failed to get signed URL: ${response.statusText}`
    );
  }

  const data = await response.json();

  // Handle both camelCase and snake_case response formats
  return {
    signedUrl: data.signedUrl || data.signed_url || data.url,
    expiresAt: data.expiresAt || data.expires_at,
  };
}

/**
 * Register a session with the backend
 * @param conversationId - Conversation ID to associate with the session
 * @param sessionData - Session data including sessionUrl
 * @returns Promise resolving to registration response
 * @throws Error if the API request fails
 */
export async function registerSession(
  conversationId: string,
  sessionData: RegisterSessionRequest
): Promise<RegisterSessionResponse> {
  const baseUrl = getElevenLabsApiBaseUrl();
  // When using relative paths (dev mode), use the special /agent-session path
  // that gets proxied to elevenlabs-agent
  // When using absolute URL (production), use the full path
  const url = baseUrl
    ? `${baseUrl}/agent-conversations/api/${conversationId}/session`
    : `/agent-session/${conversationId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sessionData),
  });

  // Check if response is actually JSON before parsing
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `Expected JSON but received ${contentType}. Response: ${text.substring(0, 200)}`
    );
  }

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      errorData.error || `Failed to register session: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get agent configuration
 * @returns Promise resolving to configuration
 * @throws Error if the API request fails
 */
export async function getAgentConfig(): Promise<{
  agentId: string | null;
  agentUrl: string;
  cursorRunnerUrl: string;
  webhookSecretConfigured: boolean;
  redisUrl: string;
  hasApiKey: boolean;
}> {
  const baseUrl = getElevenLabsApiBaseUrl();
  const url = `${baseUrl}/config`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      errorData.error || `Failed to get agent config: ${response.statusText}`
    );
  }

  const data = await response.json();
  // The API returns { success: true, config: {...} }
  // Extract the config object
  if (data.success && data.config) {
    return data.config;
  }
  // Fallback: if response is already the config object
  return data;
}
