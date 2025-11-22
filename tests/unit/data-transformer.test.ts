/**
 * Unit tests for DataTransformer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DataTransformer } from '../../src/data-transformer.js';
import { ReviewElement } from '../../src/content-extractor.js';

describe('DataTransformer', () => {
    let transformer: DataTransformer;

    beforeEach(() => {
        transformer = new DataTransformer();
    });

    describe('transform', () => {
        it('should transform a complete review element', () => {
            const review: ReviewElement = {
                rating: '5 stars',
                text: '  Great product!  ',
                date: '2024-01-15',
                reviewerName: 'John Doe',
                title: 'Excellent',
                verified: true
            };

            const result = transformer.transform(review);

            expect(result).toEqual({
                rating: 5,
                text: 'Great product!',
                date: '2024-01-15',
                reviewerName: 'John Doe',
                title: 'Excellent',
                verified: true
            });
        });

        it('should handle missing optional fields', () => {
            const review: ReviewElement = {
                rating: '4',
                text: 'Good service',
                date: 'Jan 15, 2024',
                reviewerName: 'Jane Smith'
            };

            const result = transformer.transform(review);

            expect(result.rating).toBe(4);
            expect(result.text).toBe('Good service');
            expect(result.date).toBe('2024-01-15');
            expect(result.reviewerName).toBe('Jane Smith');
            expect(result.title).toBe('');
            expect(result.verified).toBe(false);
        });
    });

    describe('parseRating', () => {
        it('should parse simple numeric ratings', () => {
            expect(transformer.parseRating('5')).toBe(5);
            expect(transformer.parseRating('4')).toBe(4);
            expect(transformer.parseRating('3')).toBe(3);
            expect(transformer.parseRating('2')).toBe(2);
            expect(transformer.parseRating('1')).toBe(1);
        });

        it('should parse decimal ratings', () => {
            expect(transformer.parseRating('4.5')).toBe(4.5);
            expect(transformer.parseRating('3.7')).toBe(3.7);
        });

        it('should parse "X stars" format', () => {
            expect(transformer.parseRating('5 stars')).toBe(5);
            expect(transformer.parseRating('4 stars')).toBe(4);
        });

        it('should parse "Rated X out of 5" format', () => {
            expect(transformer.parseRating('Rated 5 out of 5')).toBe(5);
            expect(transformer.parseRating('Rated 3 out of 5')).toBe(3);
        });

        it('should parse "X/5" format', () => {
            expect(transformer.parseRating('5/5')).toBe(5);
            expect(transformer.parseRating('4/5')).toBe(4);
        });

        it('should return 0 for invalid ratings', () => {
            expect(transformer.parseRating('')).toBe(0);
            expect(transformer.parseRating('invalid')).toBe(0);
            expect(transformer.parseRating('no numbers here')).toBe(0);
        });

        it('should return 0 for out-of-range ratings', () => {
            expect(transformer.parseRating('0')).toBe(0);
            expect(transformer.parseRating('6')).toBe(0);
            expect(transformer.parseRating('10')).toBe(0);
        });
    });

    describe('sanitizeText', () => {
        it('should trim whitespace', () => {
            expect(transformer.sanitizeText('  hello  ')).toBe('hello');
            expect(transformer.sanitizeText('\n\ntext\n\n')).toBe('text');
        });

        it('should normalize line endings', () => {
            expect(transformer.sanitizeText('line1\r\nline2')).toBe('line1\nline2');
            expect(transformer.sanitizeText('line1\rline2')).toBe('line1\nline2');
        });

        it('should collapse multiple newlines', () => {
            expect(transformer.sanitizeText('line1\n\n\n\nline2')).toBe('line1\n\nline2');
            expect(transformer.sanitizeText('a\n\n\n\n\n\nb')).toBe('a\n\nb');
        });

        it('should handle empty strings', () => {
            expect(transformer.sanitizeText('')).toBe('');
            expect(transformer.sanitizeText('   ')).toBe('');
        });

        it('should preserve single and double newlines', () => {
            expect(transformer.sanitizeText('line1\nline2')).toBe('line1\nline2');
            expect(transformer.sanitizeText('line1\n\nline2')).toBe('line1\n\nline2');
        });
    });

    describe('normalizeDate', () => {
        it('should preserve ISO 8601 date format', () => {
            expect(transformer.normalizeDate('2024-01-15')).toBe('2024-01-15');
            expect(transformer.normalizeDate('2023-12-31')).toBe('2023-12-31');
        });

        it('should convert ISO 8601 datetime to date', () => {
            expect(transformer.normalizeDate('2024-01-15T10:30:00Z')).toBe('2024-01-15');
            expect(transformer.normalizeDate('2024-01-15T00:00:00.000Z')).toBe('2024-01-15');
        });

        it('should parse "MMM dd, yyyy" format', () => {
            expect(transformer.normalizeDate('Jan 15, 2024')).toBe('2024-01-15');
            expect(transformer.normalizeDate('Dec 31, 2023')).toBe('2023-12-31');
        });

        it('should parse "MMMM dd, yyyy" format', () => {
            expect(transformer.normalizeDate('January 15, 2024')).toBe('2024-01-15');
            expect(transformer.normalizeDate('December 31, 2023')).toBe('2023-12-31');
        });

        it('should parse "dd MMM yyyy" format', () => {
            expect(transformer.normalizeDate('15 Jan 2024')).toBe('2024-01-15');
            expect(transformer.normalizeDate('31 Dec 2023')).toBe('2023-12-31');
        });

        it('should parse "MM/dd/yyyy" format', () => {
            expect(transformer.normalizeDate('01/15/2024')).toBe('2024-01-15');
            expect(transformer.normalizeDate('12/31/2023')).toBe('2023-12-31');
        });

        it('should parse "dd/MM/yyyy" format', () => {
            expect(transformer.normalizeDate('15/01/2024')).toBe('2024-01-15');
            expect(transformer.normalizeDate('31/12/2023')).toBe('2023-12-31');
        });

        it('should handle single digit days', () => {
            expect(transformer.normalizeDate('Jan 5, 2024')).toBe('2024-01-05');
            expect(transformer.normalizeDate('5 Jan 2024')).toBe('2024-01-05');
        });

        it('should return original string for unparseable dates', () => {
            expect(transformer.normalizeDate('invalid date')).toBe('invalid date');
            expect(transformer.normalizeDate('some text')).toBe('some text');
        });

        it('should handle empty strings', () => {
            expect(transformer.normalizeDate('')).toBe('');
            expect(transformer.normalizeDate('   ')).toBe('');
        });

        it('should return original string for relative dates as fallback', () => {
            // Note: Relative dates will be converted based on current date
            // We test that they don't throw errors and return valid dates
            const result = transformer.normalizeDate('2 days ago');
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });
});
