/**
 * Feature flag utilities for controlling feature visibility.
 */

/**
 * Check if ElevenLabs agent feature is enabled.
 * Reads from VITE_ELEVENLABS_AGENT_ENABLED environment variable.
 * Defaults to false if not set.
 *
 * @returns true if the feature is enabled, false otherwise
 */
export function isElevenLabsEnabled(): boolean {
  const flag = import.meta.env.VITE_ELEVENLABS_AGENT_ENABLED;
  // Check for explicit 'true' string (case-insensitive)
  return flag === 'true' || flag === 'True' || flag === 'TRUE';
}
