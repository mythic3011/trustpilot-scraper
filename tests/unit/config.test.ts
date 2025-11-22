import { describe, it, expect } from 'vitest';
import { ScraperConfig } from '../../src/config.js';

describe('ScraperConfig', () => {
    const validURL = 'https://www.trustpilot.com/review/example.com';

    describe('constructor', () => {
        it('should create config with required URL', () => {
            const config = new ScraperConfig({ url: validURL });
            expect(config.targetURL).toBe(validURL);
        });

        it('should apply default values for optional parameters', () => {
            const config = new ScraperConfig({ url: validURL });
            expect(config.outputFilename).toBe('reviews.csv');
            expect(config.maxPages).toBe(Infinity);
            expect(config.delayMs).toBe(2000);
            expect(config.timeout).toBe(30000);
            expect(config.headless).toBe(true);
            expect(config.viewport).toEqual({ width: 1920, height: 1080 });
            expect(config.userAgent).toContain('Chrome');
        });

        it('should use provided optional parameters', () => {
            const config = new ScraperConfig({
                url: validURL,
                output: 'custom.csv',
                maxPages: 5,
                delay: 3000,
                timeout: 60000,
                headless: false
            });
            expect(config.outputFilename).toBe('custom.csv');
            expect(config.maxPages).toBe(5);
            expect(config.delayMs).toBe(3000);
            expect(config.timeout).toBe(60000);
            expect(config.headless).toBe(false);
        });

        it('should throw error for missing URL', () => {
            expect(() => new ScraperConfig({ url: '' })).toThrow('URL is required');
        });

        it('should throw error for invalid URL', () => {
            expect(() => new ScraperConfig({ url: 'https://example.com' })).toThrow('Invalid Trustpilot URL');
        });

        it('should throw error for invalid maxPages', () => {
            expect(() => new ScraperConfig({ url: validURL, maxPages: -1 })).toThrow('maxPages must be a positive integer');
            expect(() => new ScraperConfig({ url: validURL, maxPages: 0 })).toThrow('maxPages must be a positive integer');
            expect(() => new ScraperConfig({ url: validURL, maxPages: 1.5 })).toThrow('maxPages must be a positive integer');
        });

        it('should throw error for negative delay', () => {
            expect(() => new ScraperConfig({ url: validURL, delay: -100 })).toThrow('delay must be non-negative');
        });
    });

    describe('getCompanyId', () => {
        it('should return company ID from URL', () => {
            const config = new ScraperConfig({ url: validURL });
            expect(config.getCompanyId()).toBe('example.com');
        });
    });

    describe('toObject', () => {
        it('should return plain object representation', () => {
            const config = new ScraperConfig({ url: validURL });
            const obj = config.toObject();
            expect(obj.targetURL).toBe(validURL);
            expect(obj.outputFilename).toBe('reviews.csv');
            expect(obj).toHaveProperty('maxPages');
            expect(obj).toHaveProperty('delayMs');
        });
    });

    describe('fromCLIOptions', () => {
        it('should create config from CLI options', () => {
            const config = ScraperConfig.fromCLIOptions({ url: validURL, output: 'test.csv' });
            expect(config.targetURL).toBe(validURL);
            expect(config.outputFilename).toBe('test.csv');
        });
    });
});
