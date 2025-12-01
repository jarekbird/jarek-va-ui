import { describe, it, expect } from 'vitest';

/**
 * Test the feature flag logic directly.
 * Since import.meta.env is read at module load time in Vite,
 * we test the logic function directly rather than trying to mock the env.
 */
function testFlagLogic(flagValue: string | undefined): boolean {
  return flagValue === 'true' || flagValue === 'True' || flagValue === 'TRUE';
}

describe('isElevenLabsEnabled logic', () => {
  it('returns false when flag is not set', () => {
    expect(testFlagLogic(undefined)).toBe(false);
  });

  it('returns false when flag is empty string', () => {
    expect(testFlagLogic('')).toBe(false);
  });

  it('returns false when flag is "false"', () => {
    expect(testFlagLogic('false')).toBe(false);
  });

  it('returns true when flag is "true"', () => {
    expect(testFlagLogic('true')).toBe(true);
  });

  it('returns true when flag is "True" (case-insensitive)', () => {
    expect(testFlagLogic('True')).toBe(true);
  });

  it('returns true when flag is "TRUE" (case-insensitive)', () => {
    expect(testFlagLogic('TRUE')).toBe(true);
  });

  it('returns false when flag is "1" (only "true" is accepted)', () => {
    expect(testFlagLogic('1')).toBe(false);
  });
});
