import { describe, it, expect } from 'vitest';
import { URLValidator } from '../../src/url-validator.js';

describe('URLValidator', () => {
    describe('validate', () => {
        it('should accept valid Trustpilot URLs', () => {
            expect(URLValidator.validate('https://www.trustpilot.com/review/example.com')).toBe(true);
            expect(URLValidator.validate('https://www.trustpilot.com/review/my-company')).toBe(true);
            expect(URLValidator.validate('https://www.trustpilot.com/review/company-name-123')).toBe(true);
        });

        it('should reject invalid URLs', () => {
            expect(URLValidator.validate('http://www.trustpilot.com/review/example.com')).toBe(false); // http instead of https
            expect(URLValidator.validate('https://trustpilot.com/review/example.com')).toBe(false); // missing www
            expect(URLValidator.validate('https://www.trustpilot.com/reviews/example.com')).toBe(false); // reviews instead of review
            expect(URLValidator.validate('https://www.example.com/review/test')).toBe(false); // wrong domain
            expect(URLValidator.validate('not-a-url')).toBe(false);
            expect(URLValidator.validate('')).toBe(false);
        });

        it('should handle null and undefined', () => {
            expect(URLValidator.validate(null as any)).toBe(false);
            expect(URLValidator.validate(undefined as any)).toBe(false);
        });
    });

    describe('extractCompanyId', () => {
        it('should extract company ID from valid URLs', () => {
            expect(URLValidator.extractCompanyId('https://www.trustpilot.com/review/example.com')).toBe('example.com');
            expect(URLValidator.extractCompanyId('https://www.trustpilot.com/review/my-company')).toBe('my-company');
        });

        it('should return null for invalid URLs', () => {
            expect(URLValidator.extractCompanyId('https://www.example.com/review/test')).toBe(null);
            expect(URLValidator.extractCompanyId('not-a-url')).toBe(null);
        });
    });
});
