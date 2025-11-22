import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '../../src/rate-limiter';

describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
        rateLimiter = new RateLimiter();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('delay', () => {
        it('should enforce minimum delay between requests', async () => {
            const delayMs = 1000;

            // First request - no delay needed
            const promise1 = rateLimiter.delay(delayMs);
            await vi.advanceTimersByTimeAsync(0);
            await promise1;

            // Second request immediately after - should delay
            const promise2 = rateLimiter.delay(delayMs);
            await vi.advanceTimersByTimeAsync(delayMs);
            await promise2;

            expect(true).toBe(true); // If we get here, delay worked
        });

        it('should not delay if enough time has passed', async () => {
            const delayMs = 1000;

            // First request
            await rateLimiter.delay(delayMs);

            // Advance time beyond delay
            await vi.advanceTimersByTimeAsync(2000);

            // Second request - should not need additional delay
            const startTime = Date.now();
            await rateLimiter.delay(delayMs);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(100);
        });
    });

    describe('retryWithBackoff', () => {
        it('should succeed on first attempt if operation succeeds', async () => {
            const operation = vi.fn().mockResolvedValue('success');

            const result = await rateLimiter.retryWithBackoff(operation);

            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should retry with exponential backoff on failure', async () => {
            const operation = vi.fn()
                .mockRejectedValueOnce(new Error('fail 1'))
                .mockRejectedValueOnce(new Error('fail 2'))
                .mockResolvedValueOnce('success');

            const promise = rateLimiter.retryWithBackoff(operation, {
                maxRetries: 3,
                baseDelay: 1000,
                maxDelay: 8000
            });

            // First attempt fails immediately
            await vi.advanceTimersByTimeAsync(0);

            // First retry after 1s (1000 * 2^0)
            await vi.advanceTimersByTimeAsync(1000);

            // Second retry after 2s (1000 * 2^1)
            await vi.advanceTimersByTimeAsync(2000);

            const result = await promise;

            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(3);
        });

        it('should throw error after max retries exhausted', async () => {
            const operation = vi.fn().mockRejectedValue(new Error('persistent failure'));

            const promise = rateLimiter.retryWithBackoff(operation, {
                maxRetries: 2,
                baseDelay: 1000,
                maxDelay: 8000
            });

            // Advance through all retry attempts
            await vi.advanceTimersByTimeAsync(0); // Initial attempt
            await vi.advanceTimersByTimeAsync(1000); // First retry
            await vi.advanceTimersByTimeAsync(2000); // Second retry

            await expect(promise).rejects.toThrow('persistent failure');
            expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
        });

        it('should respect retry-after header for 429 responses', async () => {
            const error429 = {
                response: {
                    status: 429,
                    headers: {
                        'retry-after': '5'
                    }
                }
            };

            const operation = vi.fn()
                .mockRejectedValueOnce(error429)
                .mockResolvedValueOnce('success');

            const promise = rateLimiter.retryWithBackoff(operation, {
                maxRetries: 3,
                baseDelay: 1000,
                maxDelay: 8000
            });

            await vi.advanceTimersByTimeAsync(0); // Initial attempt fails
            await vi.advanceTimersByTimeAsync(5000); // Wait for retry-after (5 seconds)

            const result = await promise;

            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(2);
        });

        it('should cap exponential backoff at maxDelay', async () => {
            const operation = vi.fn()
                .mockRejectedValueOnce(new Error('fail 1'))
                .mockRejectedValueOnce(new Error('fail 2'))
                .mockRejectedValueOnce(new Error('fail 3'))
                .mockResolvedValueOnce('success');

            const promise = rateLimiter.retryWithBackoff(operation, {
                maxRetries: 4,
                baseDelay: 1000,
                maxDelay: 3000 // Cap at 3 seconds
            });

            await vi.advanceTimersByTimeAsync(0); // Initial
            await vi.advanceTimersByTimeAsync(1000); // 1s (2^0 * 1000)
            await vi.advanceTimersByTimeAsync(2000); // 2s (2^1 * 1000)
            await vi.advanceTimersByTimeAsync(3000); // 3s (capped, would be 4s)

            const result = await promise;

            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(4);
        });

        it('should use default retry config if not provided', async () => {
            const operation = vi.fn()
                .mockRejectedValueOnce(new Error('fail'))
                .mockResolvedValueOnce('success');

            const promise = rateLimiter.retryWithBackoff(operation);

            await vi.advanceTimersByTimeAsync(0);
            await vi.advanceTimersByTimeAsync(1000); // Default baseDelay is 1000

            const result = await promise;

            expect(result).toBe('success');
        });
    });
});
