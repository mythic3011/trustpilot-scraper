/**
 * Unit tests for Logger class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from '../../src/logger.js';

describe('Logger', () => {
    let logger: Logger;

    beforeEach(() => {
        logger = new Logger();
        // Suppress console output during tests
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    describe('Basic logging methods', () => {
        it('should log info messages', () => {
            expect(() => logger.info('Test info message')).not.toThrow();
        });

        it('should log warning messages', () => {
            expect(() => logger.warn('Test warning message')).not.toThrow();
        });

        it('should log error messages', () => {
            expect(() => logger.error('Test error message')).not.toThrow();
        });

        it('should log error messages with Error objects', () => {
            const error = new Error('Test error');
            expect(() => logger.error('Error occurred', error)).not.toThrow();
        });
    });

    describe('Structured logging methods', () => {
        it('should log configuration', () => {
            const config = {
                targetURL: 'https://www.trustpilot.com/review/example.com',
                outputFilename: 'reviews.csv',
                maxPages: 10,
                delayMs: 2000,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            };

            expect(() => logger.logConfiguration(config)).not.toThrow();
        });

        it('should log configuration with unlimited pages', () => {
            const config = {
                targetURL: 'https://www.trustpilot.com/review/example.com',
                outputFilename: 'reviews.csv',
                maxPages: Infinity,
                delayMs: 2000,
                userAgent: 'Mozilla/5.0'
            };

            expect(() => logger.logConfiguration(config)).not.toThrow();
        });

        it('should log page progress', () => {
            expect(() => logger.logPageProgress(1, 20)).not.toThrow();
            expect(() => logger.logPageProgress(5, 15)).not.toThrow();
        });

        it('should log HTTP requests', () => {
            expect(() => logger.logRequest('https://example.com')).not.toThrow();
            expect(() => logger.logRequest('https://example.com', 'POST')).not.toThrow();
        });

        it('should log HTTP responses', () => {
            expect(() => logger.logResponse('https://example.com', 200)).not.toThrow();
            expect(() => logger.logResponse('https://example.com', 404)).not.toThrow();
        });

        it('should log completion summary', () => {
            const summary = {
                totalReviews: 100,
                outputFile: 'reviews.csv',
                startTime: new Date('2024-01-01T10:00:00Z'),
                endTime: new Date('2024-01-01T10:05:00Z'),
                pagesProcessed: 5
            };

            expect(() => logger.logSummary(summary)).not.toThrow();
        });
    });
});
