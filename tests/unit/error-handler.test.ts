/**
 * Unit tests for ErrorHandler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler, ErrorCategory, ErrorAction, ErrorContext } from '../../src/error-handler.js';
import { Logger } from '../../src/logger.js';

describe('ErrorHandler', () => {
    let errorHandler: ErrorHandler;
    let mockLogger: Logger;

    beforeEach(() => {
        mockLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn()
        } as unknown as Logger;

        errorHandler = new ErrorHandler(mockLogger);
    });

    describe('Critical Errors', () => {
        it('should classify invalid URL as critical', () => {
            const error = new Error('Invalid URL format');
            const context: ErrorContext = { operation: 'validation' };

            const action = errorHandler.handleError(error, context);

            expect(action).toBe(ErrorAction.TERMINATE);
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should classify browser initialization failure as critical', () => {
            const error = new Error('Failed to launch browser');
            const context: ErrorContext = { operation: 'initialization' };

            const action = errorHandler.handleError(error, context);

            expect(action).toBe(ErrorAction.TERMINATE);
        });

        it('should classify CAPTCHA detection as critical', () => {
            const error = new Error('CAPTCHA detected on page');
            const context: ErrorContext = { operation: 'navigation', url: 'https://example.com' };

            const action = errorHandler.handleError(error, context);

            expect(action).toBe(ErrorAction.TERMINATE);
            expect(errorHandler.isCaptcha(error)).toBe(true);
        });

        it('should classify file permission errors as critical', () => {
            const error = new Error('EACCES: permission denied');
            const context: ErrorContext = { operation: 'export' };

            const action = errorHandler.handleError(error, context);

            expect(action).toBe(ErrorAction.TERMINATE);
        });

        it('should detect various CAPTCHA indicators', () => {
            const captchaErrors = [
                new Error('reCAPTCHA challenge required'),
                new Error('Cloudflare security check'),
                new Error('Access denied - bot detection'),
                new Error('Security challenge failed')
            ];

            captchaErrors.forEach(error => {
                expect(errorHandler.isCaptcha(error)).toBe(true);
            });
        });
    });

    describe('Recoverable Errors', () => {
        it('should classify network timeout as recoverable', () => {
            const error = new Error('Request timeout after 30000ms');
            const context: ErrorContext = { operation: 'navigation', attemptNumber: 1 };

            const action = errorHandler.handleError(error, context);

            expect(action).toBe(ErrorAction.RETRY);
            expect(mockLogger.warn).toHaveBeenCalled();
        });

        it('should classify HTTP 5xx errors as recoverable', () => {
            const errors = [
                new Error('HTTP 500 Internal Server Error'),
                new Error('HTTP 502 Bad Gateway'),
                new Error('HTTP 503 Service Unavailable'),
                new Error('HTTP 504 Gateway Timeout')
            ];

            errors.forEach(error => {
                const context: ErrorContext = { operation: 'request' };
                const action = errorHandler.handleError(error, context);
                expect(action).toBe(ErrorAction.RETRY);
            });
        });

        it('should classify connection refused as recoverable', () => {
            const error = new Error('ECONNREFUSED: connection refused');
            const context: ErrorContext = { operation: 'navigation' };

            const action = errorHandler.handleError(error, context);

            expect(action).toBe(ErrorAction.RETRY);
        });

        it('should classify rate limit (429) as recoverable', () => {
            const error = new Error('HTTP 429 Too Many Requests');
            const context: ErrorContext = { operation: 'request' };

            const action = errorHandler.handleError(error, context);

            expect(action).toBe(ErrorAction.RETRY);
        });
    });

    describe('Non-Critical Errors', () => {
        it('should classify single review extraction failure as non-critical', () => {
            const error = new Error('Failed to extract review title');
            const context: ErrorContext = {
                operation: 'extraction',
                pageNumber: 2,
                additionalInfo: { reviewIndex: 5 }
            };

            const action = errorHandler.handleError(error, context);

            expect(action).toBe(ErrorAction.CONTINUE);
            expect(mockLogger.warn).toHaveBeenCalled();
        });

        it('should classify missing optional field as non-critical', () => {
            const error = new Error('Optional field not found');
            const context: ErrorContext = { operation: 'extraction' };

            const action = errorHandler.handleError(error, context);

            expect(action).toBe(ErrorAction.CONTINUE);
        });

        it('should classify resource load failure as non-critical', () => {
            const error = new Error('Failed to load image resource');
            const context: ErrorContext = { operation: 'page-load' };

            const action = errorHandler.handleError(error, context);

            expect(action).toBe(ErrorAction.CONTINUE);
        });
    });

    describe('Error Context Formatting', () => {
        it('should include URL in error log', () => {
            const error = new Error('Test error');
            const context: ErrorContext = {
                operation: 'test',
                url: 'https://example.com'
            };

            errorHandler.handleError(error, context);

            const logCall = (mockLogger.warn as any).mock.calls[0][0];
            expect(logCall).toContain('https://example.com');
        });

        it('should include page number in error log', () => {
            const error = new Error('Test error');
            const context: ErrorContext = {
                operation: 'test',
                pageNumber: 5
            };

            errorHandler.handleError(error, context);

            const logCall = (mockLogger.warn as any).mock.calls[0][0];
            expect(logCall).toContain('Page: 5');
        });

        it('should include attempt number in recoverable error log', () => {
            const error = new Error('Timeout');
            const context: ErrorContext = {
                operation: 'request',
                attemptNumber: 2
            };

            errorHandler.handleError(error, context);

            const logCall = (mockLogger.warn as any).mock.calls[0][0];
            expect(logCall).toContain('attempt 2');
        });

        it('should include additional info in error log', () => {
            const error = new Error('Test error');
            const context: ErrorContext = {
                operation: 'test',
                additionalInfo: {
                    reviewIndex: 3,
                    selector: '.review-card'
                }
            };

            errorHandler.handleError(error, context);

            const logCall = (mockLogger.warn as any).mock.calls[0][0];
            expect(logCall).toContain('reviewIndex: 3');
            expect(logCall).toContain('selector: .review-card');
        });
    });

    describe('getErrorCategory', () => {
        it('should return correct category for critical errors', () => {
            const error = new Error('Invalid URL');
            const context: ErrorContext = { operation: 'validation' };

            const category = errorHandler.getErrorCategory(error, context);

            expect(category).toBe(ErrorCategory.CRITICAL);
        });

        it('should return correct category for recoverable errors', () => {
            const error = new Error('Timeout');
            const context: ErrorContext = { operation: 'request' };

            const category = errorHandler.getErrorCategory(error, context);

            expect(category).toBe(ErrorCategory.RECOVERABLE);
        });

        it('should return correct category for non-critical errors', () => {
            const error = new Error('Minor parsing issue');
            const context: ErrorContext = { operation: 'extraction' };

            const category = errorHandler.getErrorCategory(error, context);

            expect(category).toBe(ErrorCategory.NON_CRITICAL);
        });
    });
});
