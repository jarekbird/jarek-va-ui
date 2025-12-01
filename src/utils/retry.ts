/**
 * Retry utility with exponential backoff
 * Provides configurable retry logic for async operations
 */

export interface RetryOptions {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxRetries?: number;
  /**
   * Initial delay in milliseconds (default: 1000)
   */
  initialDelay?: number;
  /**
   * Maximum delay in milliseconds (default: 30000)
   */
  maxDelay?: number;
  /**
   * Multiplier for exponential backoff (default: 2)
   */
  multiplier?: number;
  /**
   * Callback for logging retry attempts
   */
  onRetry?: (attempt: number, error: Error, delay: number) => void;
  /**
   * Function to determine if an error should be retried
   * Returns true if the error should be retried, false otherwise
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<
  Omit<RetryOptions, 'onRetry' | 'shouldRetry'>
> & {
  onRetry?: RetryOptions['onRetry'];
  shouldRetry?: RetryOptions['shouldRetry'];
} = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  multiplier: 2,
};

/**
 * Calculate delay for a given attempt using exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Default function to determine if an error should be retried
 * Retries on network errors, timeouts, and 5xx server errors
 */
function defaultShouldRetry(error: Error, attempt: number): boolean {
  // Don't retry if we've exceeded max attempts
  if (attempt >= DEFAULT_OPTIONS.maxRetries) {
    return false;
  }

  // Retry on network errors
  if (
    error.message.includes('network') ||
    error.message.includes('fetch') ||
    error.message.includes('timeout') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ENOTFOUND')
  ) {
    return true;
  }

  // Retry on 5xx server errors (if error has status property)
  if ('status' in error) {
    const errorWithStatus = error as Error & { status?: number };
    if (
      typeof errorWithStatus.status === 'number' &&
      errorWithStatus.status >= 500 &&
      errorWithStatus.status < 600
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Retry an async function with exponential backoff
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise resolving to the function result
 * @throws The last error if all retries are exhausted
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    initialDelay = DEFAULT_OPTIONS.initialDelay,
    maxDelay = DEFAULT_OPTIONS.maxDelay,
    multiplier = DEFAULT_OPTIONS.multiplier,
    onRetry = undefined,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < maxRetries && shouldRetry(lastError, attempt)) {
        const delay = calculateDelay(
          attempt,
          initialDelay,
          maxDelay,
          multiplier
        );

        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, lastError, delay);
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // Don't retry - throw the error
        throw lastError;
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry exhausted');
}

/**
 * Create a retry function with pre-configured options
 * Useful for creating retry functions with specific settings
 */
export function createRetryFunction<T>(
  options: RetryOptions = {}
): (fn: () => Promise<T>) => Promise<T> {
  return (fn: () => Promise<T>) => retryWithBackoff(fn, options);
}
