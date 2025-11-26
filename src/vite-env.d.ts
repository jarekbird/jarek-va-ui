/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /**
   * Feature flag to enable/disable ElevenLabs agent functionality.
   * Defaults to `false` when not set.
   * When disabled, all agent-specific UI and functionality will be hidden.
   */
  readonly VITE_ELEVENLABS_AGENT_ENABLED?: string;
  /**
   * Base URL for the ElevenLabs agent service API.
   * Used for fetching signed URLs and registering sessions.
   */
  readonly VITE_ELEVENLABS_AGENT_URL?: string;
  /**
   * Optional: ElevenLabs agent ID for private agents.
   * If not provided, the default agent will be used.
   */
  readonly VITE_ELEVENLABS_AGENT_ID?: string;
  /**
   * Optional: Public key for ElevenLabs agent authentication.
   */
  readonly VITE_ELEVENLABS_AGENT_PUBLIC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
