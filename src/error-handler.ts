/**
 * Error Handler
 * Classifies errors and determines appropriate actions
 */

import { Logger } from './logger.js';

/**
 * Error categories for classification
 */
export enum ErrorCategory {
    CRITICAL = 'critical',
    RECOVERABLE = 'recoverable',
    NON_CRITICAL = 'non-critical'
}

/**
 * Actions to take based on error classification
 */
export enum ErrorAction {
    TERMINATE = 'terminate',
    RETRY = 'retry',
    CONTINUE = 'continue'
}

/**
 * Context information for error handling
 */
export interface ErrorContext {
    operation: string;
    url?: string;
    pageNumber?: number;
    attemptNumber?: number;
    additionalInfo?: Record<string, unknown>;
}

/**
 * ErrorHandler classifies errors and determines appropriate actions
 * Handles critical, recoverable, and non-critical errors with appropriate logging
 */
export class ErrorHandler {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /**
     * Handle an error and return the appropriate action
     * @param error - The error to handle
     * @param context - Context information about where the error occurred
     * @returns The action to take (TERMINATE, RETRY, or CONTINUE)
     */
    handleError(error: Error, context: ErrorContext): ErrorAction {
        const category = this.classifyError(error, context);

        switch (category) {
            case ErrorCategory.CRITICAL:
                this.logCriticalError(error, context);
                return ErrorAction.TERMINATE;

            case ErrorCategory.RECOVERABLE:
                this.logRecoverableError(error, context);
                return ErrorAction.RETRY;

            case ErrorCategory.NON_CRITICAL:
                this.logNonCriticalError(error, context);
                return ErrorAction.CONTINUE;

            default:
                // Default to critical for unknown error types
                this.logCriticalError(error, context);
                return ErrorAction.TERMINATE;
        }
    }

    /**
     * Classify an error into a category
     * @param error - The error to classify
     * @param context - Context information
     * @returns The error category
     */
    private classifyError(error: Error, context: ErrorContext): ErrorCategory {
        const errorMessage = error.message.toLowerCase();

        // Critical errors - terminate execution
        if (this.isCriticalError(error, errorMessage, context)) {
            return ErrorCategory.CRITICAL;
        }

        // Recoverable errors - retry with backoff
        if (this.isRecoverableError(error, errorMessage)) {
            return ErrorCategory.RECOVERABLE;
        }

        // Non-critical errors - log and continue
        return ErrorCategory.NON_CRITICAL;
    }

    /**
     * Check if an error is critical (should terminate execution)
     */
    private isCriticalError(_error: Error, errorMessage: string, context: ErrorContext): boolean {
        // Invalid URL format
        if (errorMessage.includes('invalid') && errorMessage.includes('url')) {
            return true;
        }

        // Browser initialization failure
        if (errorMessage.includes('browser') &&
            (errorMessage.includes('launch') || errorMessage.includes('initialize'))) {
            return true;
        }

        // CAPTCHA detection
        if (this.isCaptchaError(errorMessage)) {
            return true;
        }

        // File system write permission errors
        if (errorMessage.includes('eacces') ||
            errorMessage.includes('eperm') ||
            errorMessage.includes('permission denied')) {
            return true;
        }

        // File system errors (ENOENT for directory not found, etc.)
        if (errorMessage.includes('enoent') && context.operation === 'export') {
            return true;
        }

        return false;
    }

    /**
     * Check if an error is recoverable (should retry)
     */
    private isRecoverableError(_error: Error, errorMessage: string): boolean {
        // Network timeouts
        if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
            return true;
        }

        // HTTP 5xx errors
        if (errorMessage.includes('500') ||
            errorMessage.includes('502') ||
            errorMessage.includes('503') ||
            errorMessage.includes('504')) {
            return true;
        }

        // Temporary connection failures
        if (errorMessage.includes('econnrefused') ||
            errorMessage.includes('econnreset') ||
            errorMessage.includes('connection') && errorMessage.includes('refused')) {
            return true;
        }

        // Rate limit (429) responses
        if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
            return true;
        }

        // Network errors
        if (errorMessage.includes('network') || errorMessage.includes('net::')) {
            return true;
        }

        return false;
    }

    /**
     * Detect CAPTCHA or anti-bot measures
     * @param errorMessage - The error message to check
     * @returns true if CAPTCHA is detected
     */
    private isCaptchaError(errorMessage: string): boolean {
        const captchaIndicators = [
            'captcha',
            'recaptcha',
            'challenge',
            'cloudflare',
            'access denied',
            'blocked',
            'bot detection',
            'security check'
        ];

        return captchaIndicators.some(indicator =>
            errorMessage.includes(indicator)
        );
    }

    /**
     * Log a critical error with full context
     */
    private logCriticalError(error: Error, context: ErrorContext): void {
        const contextStr = this.formatContext(context);
        this.logger.error(
            `CRITICAL ERROR [${context.operation}]: ${error.message}${contextStr}`,
            error
        );
    }

    /**
     * Log a recoverable error
     */
    private logRecoverableError(error: Error, context: ErrorContext): void {
        const contextStr = this.formatContext(context);
        const attemptInfo = context.attemptNumber
            ? ` (attempt ${context.attemptNumber})`
            : '';
        this.logger.warn(
            `Recoverable error [${context.operation}]${attemptInfo}: ${error.message}${contextStr}`
        );
    }

    /**
     * Log a non-critical error
     */
    private logNonCriticalError(error: Error, context: ErrorContext): void {
        const contextStr = this.formatContext(context);
        this.logger.warn(
            `Non-critical error [${context.operation}]: ${error.message}${contextStr} - continuing execution`
        );
    }

    /**
     * Format context information for logging
     */
    private formatContext(context: ErrorContext): string {
        const parts: string[] = [];

        if (context.url) {
            parts.push(`URL: ${context.url}`);
        }

        if (context.pageNumber !== undefined) {
            parts.push(`Page: ${context.pageNumber}`);
        }

        if (context.additionalInfo) {
            const infoStr = Object.entries(context.additionalInfo)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            if (infoStr) {
                parts.push(infoStr);
            }
        }

        return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
    }

    /**
     * Check if an error indicates CAPTCHA detection
     * Public method for external use
     */
    isCaptcha(error: Error): boolean {
        return this.isCaptchaError(error.message.toLowerCase());
    }

    /**
     * Get the error category for an error
     * Public method for external use
     */
    getErrorCategory(error: Error, context: ErrorContext): ErrorCategory {
        return this.classifyError(error, context);
    }
}
