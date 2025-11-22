/**
 * Unit tests for CLI interface
 */

import { describe, it, expect } from 'vitest';
import { parseArguments, validateOptions, toConfigurationOptions } from '../../src/cli.js';

describe('CLI Interface', () => {
    describe('parseArguments', () => {
        it('should parse required URL parameter', () => {
            const argv = ['node', 'script.js', '--url', 'https://www.trustpilot.com/review/example.com'];
            const options = parseArguments(argv);
            expect(options.url).toBe('https://www.trustpilot.com/review/example.com');
        });

        it('should parse URL with short flag', () => {
            const argv = ['node', 'script.js', '-u', 'https://www.trustpilot.com/review/test.com'];
            const options = parseArguments(argv);
            expect(options.url).toBe('https://www.trustpilot.com/review/test.com');
        });

        it('should parse optional output parameter', () => {
            const argv = ['node', 'script.js', '--url', 'https://www.trustpilot.com/review/example.com', '--output', 'custom.csv'];
            const options = parseArguments(argv);
            expect(options.output).toBe('custom.csv');
        });

        it('should use default output filename when not provided', () => {
            const argv = ['node', 'script.js', '--url', 'https://www.trustpilot.com/review/example.com'];
            const options = parseArguments(argv);
            expect(options.output).toBe('reviews.csv');
        });

        it('should parse max-pages parameter', () => {
            const argv = ['node', 'script.js', '--url', 'https://www.trustpilot.com/review/example.com', '--max-pages', '10'];
            const options = parseArguments(argv);
            expect(options.maxPages).toBe(10);
        });

        it('should parse delay parameter', () => {
            const argv = ['node', 'script.js', '--url', 'https://www.trustpilot.com/review/example.com', '--delay', '3000'];
            const options = parseArguments(argv);
            expect(options.delay).toBe(3000);
        });

        it('should use default delay when not provided', () => {
            const argv = ['node', 'script.js', '--url', 'https://www.trustpilot.com/review/example.com'];
            const options = parseArguments(argv);
            expect(options.delay).toBe(2000);
        });

        it('should parse user-agent parameter', () => {
            const argv = ['node', 'script.js', '--url', 'https://www.trustpilot.com/review/example.com', '--user-agent', 'Custom Agent'];
            const options = parseArguments(argv);
            expect(options.userAgent).toBe('Custom Agent');
        });

        it('should parse all parameters together', () => {
            const argv = [
                'node', 'script.js',
                '-u', 'https://www.trustpilot.com/review/example.com',
                '-o', 'output.csv',
                '-m', '5',
                '-d', '1500',
                '-a', 'Mozilla/5.0'
            ];
            const options = parseArguments(argv);
            expect(options.url).toBe('https://www.trustpilot.com/review/example.com');
            expect(options.output).toBe('output.csv');
            expect(options.maxPages).toBe(5);
            expect(options.delay).toBe(1500);
            expect(options.userAgent).toBe('Mozilla/5.0');
        });

        it('should throw error when URL is missing', () => {
            const argv = ['node', 'script.js'];
            expect(() => parseArguments(argv)).toThrow();
        });

        it('should throw error for invalid max-pages value', () => {
            const argv = ['node', 'script.js', '--url', 'https://www.trustpilot.com/review/example.com', '--max-pages', '-5'];
            expect(() => parseArguments(argv)).toThrow();
        });

        it('should throw error for non-numeric max-pages', () => {
            const argv = ['node', 'script.js', '--url', 'https://www.trustpilot.com/review/example.com', '--max-pages', 'abc'];
            expect(() => parseArguments(argv)).toThrow();
        });

        it('should throw error for negative delay', () => {
            const argv = ['node', 'script.js', '--url', 'https://www.trustpilot.com/review/example.com', '--delay', '-1000'];
            expect(() => parseArguments(argv)).toThrow();
        });
    });

    describe('validateOptions', () => {
        it('should validate correct options', () => {
            const options = {
                url: 'https://www.trustpilot.com/review/example.com',
                output: 'reviews.csv',
                maxPages: 10,
                delay: 2000
            };
            expect(validateOptions(options)).toBe(true);
        });

        it('should throw error for missing URL', () => {
            const options = {
                url: ''
            };
            expect(() => validateOptions(options)).toThrow('URL is required');
        });

        it('should throw error for invalid URL format', () => {
            const options = {
                url: 'https://example.com'
            };
            expect(() => validateOptions(options)).toThrow('Invalid Trustpilot URL format');
        });

        it('should throw error for empty output filename', () => {
            const options = {
                url: 'https://www.trustpilot.com/review/example.com',
                output: ''
            };
            expect(() => validateOptions(options)).toThrow('Output filename must be a non-empty string');
        });

        it('should throw error for output filename with path traversal', () => {
            const options = {
                url: 'https://www.trustpilot.com/review/example.com',
                output: '../reviews.csv'
            };
            expect(() => validateOptions(options)).toThrow('Output filename cannot contain path separators');
        });

        it('should throw error for zero max pages', () => {
            const options = {
                url: 'https://www.trustpilot.com/review/example.com',
                maxPages: 0
            };
            expect(() => validateOptions(options)).toThrow('Max pages must be a positive integer');
        });

        it('should throw error for negative max pages', () => {
            const options = {
                url: 'https://www.trustpilot.com/review/example.com',
                maxPages: -5
            };
            expect(() => validateOptions(options)).toThrow('Max pages must be a positive integer');
        });

        it('should throw error for negative delay', () => {
            const options = {
                url: 'https://www.trustpilot.com/review/example.com',
                delay: -1000
            };
            expect(() => validateOptions(options)).toThrow('Delay must be a non-negative integer');
        });

        it('should throw error for empty user agent', () => {
            const options = {
                url: 'https://www.trustpilot.com/review/example.com',
                userAgent: ''
            };
            expect(() => validateOptions(options)).toThrow('User agent must be a non-empty string');
        });
    });

    describe('toConfigurationOptions', () => {
        it('should convert CLI options to configuration options', () => {
            const cliOptions = {
                url: 'https://www.trustpilot.com/review/example.com',
                output: 'output.csv',
                maxPages: 10,
                delay: 3000,
                userAgent: 'Custom Agent'
            };
            const configOptions = toConfigurationOptions(cliOptions);
            expect(configOptions.url).toBe('https://www.trustpilot.com/review/example.com');
            expect(configOptions.output).toBe('output.csv');
            expect(configOptions.maxPages).toBe(10);
            expect(configOptions.delay).toBe(3000);
            expect(configOptions.userAgent).toBe('Custom Agent');
        });

        it('should handle minimal CLI options', () => {
            const cliOptions = {
                url: 'https://www.trustpilot.com/review/example.com'
            };
            const configOptions = toConfigurationOptions(cliOptions);
            expect(configOptions.url).toBe('https://www.trustpilot.com/review/example.com');
            expect(configOptions.output).toBeUndefined();
            expect(configOptions.maxPages).toBeUndefined();
            expect(configOptions.delay).toBeUndefined();
            expect(configOptions.userAgent).toBeUndefined();
        });
    });
});
