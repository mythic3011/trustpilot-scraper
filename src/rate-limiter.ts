/**
 * Rate Limiter with retry logic and exponential backoff
 * Handles request delays and retry strategies for web scraping
 */

export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
}

export interface RetryContext {
    attempt: number;
    lastError?: Error;
    retryAfter?: number;
}

export class RateLimiter {
    private lastRequestTime: number = 0;

    /**
     * Enforces a configurable delay between requests
     * @param milliseconds - Delay duration in milliseconds
     */
    async delay(milliseconds: number): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < milliseconds) {
            const remainingDelay = milliseconds - timeSinceLastRequest;
            await this.sleep(remainingDelay);
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * Retries an operation with exponential backoff
     * @param operation - The async operation to retry
     * @param config - Retry configuration (maxRetries, baseDelay, maxDelay)
     * @returns The result of the successful operation
     * @throws The last error if all retries are exhausted
     */
    async retryWithBackoff<T>(
        operation: () => Promise<T>,
        config: RetryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 8000
        }
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;

                // Don't retry if we've exhausted all attempts
                if (attempt === config.maxRetries) {
                    break;
                }

                // Check for 429 rate limit response with retry-after header
                const retryAfter = this.extractRetryAfter(error);
                if (retryAfter !== null) {
                    await this.sleep(retryAfter * 1000); // Convert seconds to milliseconds
                    continue;
                }

                // Calculate exponential backoff delay: baseDelay * 2^attempt
                const exponentialDelay = Math.min(
                    config.baseDelay * Math.pow(2, attempt),
                    config.maxDelay
                );

                await this.sleep(exponentialDelay);
            }
        }

        throw lastError || new Error('Operation failed after retries');
    }

    /**
     * Extracts retry-after value from error (if it's a 429 response)
     * @param error - The error to check
     * @returns Retry-after duration in seconds, or null if not applicable
     */
    private extractRetryAfter(error: any): number | null {
        // Check if error has response with status 429 and retry-after header
        if (error?.response?.status === 429) {
            const retryAfter = error.response.headers?.['retry-after'];

            if (retryAfter) {
                // retry-after can be in seconds (number) or HTTP date
                const parsed = parseInt(retryAfter, 10);
                if (!isNaN(parsed)) {
                    return parsed;
                }
            }
        }

        // Check for Playwright-specific timeout or rate limit errors
        if (error?.message?.includes('429') || error?.status === 429) {
            // Default to 60 seconds if no retry-after header
            return 60;
        }

        return null;
    }

    /**
     * Sleep utility function
     * @param milliseconds - Duration to sleep
     */
    private sleep(milliseconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
}
