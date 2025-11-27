import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retryWithBackoff, createRetryFunction } from '../retry';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('succeeds on first attempt', async () => {
    const fn = vi.fn().mockResolvedValueOnce('success');
    const result = await retryWithBackoff(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce('success');

    const promise = retryWithBackoff(fn, {
      initialDelay: 100,
      maxRetries: 3,
    });

    // Advance timers to allow retry
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('uses exponential backoff', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('network error'));
    const onRetry = vi.fn();

    const promise = retryWithBackoff(fn, {
      initialDelay: 100,
      maxRetries: 3,
      multiplier: 2,
      onRetry,
    });

    // Advance through retries
    vi.advanceTimersByTime(100); // First retry after 100ms
    await vi.runAllTimersAsync();
    vi.advanceTimersByTime(200); // Second retry after 200ms
    await vi.runAllTimersAsync();
    vi.advanceTimersByTime(400); // Third retry after 400ms
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('network error');

    expect(onRetry).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 100);
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error), 200);
    expect(onRetry).toHaveBeenNthCalledWith(3, 3, expect.any(Error), 400);
  });

  it('respects maxDelay', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('network error'));
    const onRetry = vi.fn();

    const promise = retryWithBackoff(fn, {
      initialDelay: 1000,
      maxRetries: 3,
      maxDelay: 2000,
      multiplier: 2,
      onRetry,
    });

    // Advance through retries - need to advance enough for all retries
    vi.advanceTimersByTime(1000); // First retry delay
    await vi.runAllTimersAsync();
    vi.advanceTimersByTime(2000); // Second retry delay (capped)
    await vi.runAllTimersAsync();
    vi.advanceTimersByTime(2000); // Third retry delay (capped)
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow();

    // Verify delays were capped at maxDelay
    expect(onRetry).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 1000);
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error), 2000);
    expect(onRetry).toHaveBeenNthCalledWith(3, 3, expect.any(Error), 2000);
  });

  it('retries network errors', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce('success');

    const promise = retryWithBackoff(fn, { initialDelay: 100 });
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;

    expect(result).toBe('success');
  });

  it('retries timeout errors', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce('success');

    const promise = retryWithBackoff(fn, { initialDelay: 100 });
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;

    expect(result).toBe('success');
  });

  it('does not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('validation error'));

    await expect(retryWithBackoff(fn, { initialDelay: 100 })).rejects.toThrow(
      'validation error'
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('uses custom shouldRetry function', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('custom error'))
      .mockResolvedValueOnce('success');

    const shouldRetry = vi.fn().mockReturnValue(true);

    const promise = retryWithBackoff(fn, {
      initialDelay: 100,
      shouldRetry,
    });

    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;

    expect(result).toBe('success');
    expect(shouldRetry).toHaveBeenCalledWith(
      expect.any(Error),
      0
    );
  });

  it('throws last error after max retries', async () => {
    const error = new Error('network error'); // Use network error so it gets retried
    const fn = vi.fn().mockRejectedValue(error);

    const promise = retryWithBackoff(fn, {
      maxRetries: 2,
      initialDelay: 10, // Use smaller delay for faster test
    });

    // Run all timers to completion
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('network error');
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});

describe('createRetryFunction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a retry function with pre-configured options', async () => {
    const retry = createRetryFunction({
      maxRetries: 2,
      initialDelay: 100,
    });

    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce('success');

    const promise = retry(fn);
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

