/**
 * Unit tests for ContentExtractor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentExtractor } from '../../src/content-extractor.js';
import { Logger } from '../../src/logger.js';

describe('ContentExtractor', () => {
    let mockPage: any;
    let mockLogger: Logger;
    let extractor: ContentExtractor;

    beforeEach(() => {
        // Create mock logger
        mockLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            logRequest: vi.fn(),
            logResponse: vi.fn()
        } as any;

        // Create mock page
        mockPage = {
            $$: vi.fn(),
            $: vi.fn()
        };

        extractor = new ContentExtractor(mockPage, mockLogger);
    });

    describe('extractReviews', () => {
        it('should extract all reviews from page', async () => {
            // Mock review elements
            const mockReviewElement1 = createMockReviewElement({
                rating: '5 stars',
                text: 'Great product!',
                date: '2024-01-15',
                reviewerName: 'John Doe'
            });

            const mockReviewElement2 = createMockReviewElement({
                rating: '4 stars',
                text: 'Good service',
                date: '2024-01-14',
                reviewerName: 'Jane Smith'
            });

            mockPage.$$.mockResolvedValue([mockReviewElement1, mockReviewElement2]);

            const reviews = await extractor.extractReviews();

            expect(reviews).toHaveLength(2);
            expect(reviews[0].rating).toBe('5 stars');
            expect(reviews[0].text).toBe('Great product!');
            expect(reviews[1].rating).toBe('4 stars');
            expect(reviews[1].text).toBe('Good service');
        });

        it('should return empty array when no reviews found', async () => {
            mockPage.$$.mockResolvedValue([]);

            const reviews = await extractor.extractReviews();

            expect(reviews).toHaveLength(0);
            expect(mockLogger.warn).toHaveBeenCalledWith('No review elements found on page');
        });

        it('should continue extraction when single review fails', async () => {
            const mockReviewElement1 = createMockReviewElement({
                rating: '',  // Missing required field
                text: 'Great product!',
                date: '2024-01-15',
                reviewerName: 'John Doe'
            });

            const mockReviewElement2 = createMockReviewElement({
                rating: '4 stars',
                text: 'Good service',
                date: '2024-01-14',
                reviewerName: 'Jane Smith'
            });

            mockPage.$$.mockResolvedValue([mockReviewElement1, mockReviewElement2]);

            const reviews = await extractor.extractReviews();

            // Should only get the second review
            expect(reviews).toHaveLength(1);
            expect(reviews[0].rating).toBe('4 stars');
            expect(mockLogger.warn).toHaveBeenCalled();
        });
    });

    describe('extractSingleReview', () => {
        it('should extract all required fields', async () => {
            const mockElement = createMockReviewElement({
                rating: '5 stars',
                text: 'Excellent service and fast delivery!',
                date: '2024-01-15T10:30:00Z',
                reviewerName: 'John Doe'
            });

            const review = await extractor.extractSingleReview(mockElement);

            expect(review.rating).toBe('5 stars');
            expect(review.text).toBe('Excellent service and fast delivery!');
            expect(review.date).toBe('2024-01-15T10:30:00Z');
            expect(review.reviewerName).toBe('John Doe');
        });

        it('should extract optional fields when present', async () => {
            const mockElement = createMockReviewElement({
                rating: '5 stars',
                text: 'Great product!',
                date: '2024-01-15',
                reviewerName: 'John Doe',
                title: 'Best purchase ever',
                verified: 'Verified'
            });

            const review = await extractor.extractSingleReview(mockElement);

            expect(review.title).toBe('Best purchase ever');
            expect(review.verified).toBe(true);
        });

        it('should handle missing optional fields', async () => {
            const mockElement = createMockReviewElement({
                rating: '5 stars',
                text: 'Great product!',
                date: '2024-01-15',
                reviewerName: 'John Doe'
            });

            const review = await extractor.extractSingleReview(mockElement);

            expect(review.title).toBeUndefined();
            expect(review.verified).toBeUndefined();
        });

        it('should throw error when required field is missing', async () => {
            const mockElement = createMockReviewElement({
                rating: '',  // Missing
                text: 'Great product!',
                date: '2024-01-15',
                reviewerName: 'John Doe'
            });

            await expect(extractor.extractSingleReview(mockElement)).rejects.toThrow('Required field "rating" not found');
        });

        it('should handle special characters in text', async () => {
            const mockElement = createMockReviewElement({
                rating: '5 stars',
                text: 'Great product! "Amazing", really.',
                date: '2024-01-15',
                reviewerName: 'John Doe'
            });

            const review = await extractor.extractSingleReview(mockElement);

            expect(review.text).toBe('Great product! "Amazing", really.');
        });
    });
});

/**
 * Helper function to create mock review element
 */
function createMockReviewElement(data: {
    rating: string;
    text: string;
    date: string;
    reviewerName: string;
    title?: string;
    verified?: string;
}) {
    return {
        $: vi.fn((selector: string) => {
            // Mock title element (check before text to avoid false matches)
            if (selector.includes('title') || selector.includes('h2') || selector.includes('h3')) {
                if (!data.title) return Promise.resolve(null);
                return Promise.resolve({
                    getAttribute: vi.fn(() => Promise.resolve(null)),
                    textContent: vi.fn(() => Promise.resolve(data.title))
                });
            }

            // Mock verified element
            if (selector.includes('verified')) {
                if (!data.verified) return Promise.resolve(null);
                return Promise.resolve({
                    getAttribute: vi.fn(() => Promise.resolve(null)),
                    textContent: vi.fn(() => Promise.resolve(data.verified))
                });
            }

            // Mock rating element
            if (selector.includes('rating') || selector.includes('star')) {
                if (!data.rating) return Promise.resolve(null);
                return Promise.resolve({
                    getAttribute: vi.fn((attr: string) => {
                        if (attr === 'alt') return Promise.resolve(data.rating);
                        if (attr === 'data-rating') return Promise.resolve(data.rating);
                        return Promise.resolve(null);
                    }),
                    textContent: vi.fn(() => Promise.resolve(data.rating))
                });
            }

            // Mock text element
            if (selector.includes('text') || selector.includes('review-content')) {
                if (!data.text) return Promise.resolve(null);
                return Promise.resolve({
                    getAttribute: vi.fn(() => Promise.resolve(null)),
                    textContent: vi.fn(() => Promise.resolve(data.text))
                });
            }

            // Mock date element
            if (selector.includes('date') || selector.includes('time')) {
                if (!data.date) return Promise.resolve(null);
                return Promise.resolve({
                    getAttribute: vi.fn((attr: string) => {
                        if (attr === 'datetime') return Promise.resolve(data.date);
                        return Promise.resolve(null);
                    }),
                    textContent: vi.fn(() => Promise.resolve(data.date))
                });
            }

            // Mock reviewer name element
            if (selector.includes('consumer') || selector.includes('name')) {
                if (!data.reviewerName) return Promise.resolve(null);
                return Promise.resolve({
                    getAttribute: vi.fn(() => Promise.resolve(null)),
                    textContent: vi.fn(() => Promise.resolve(data.reviewerName))
                });
            }

            return Promise.resolve(null);
        })
    };
}
