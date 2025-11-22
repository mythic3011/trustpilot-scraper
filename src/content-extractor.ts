/**
 * Content Extractor
 * Extracts review data from Trustpilot pages
 */

import { Page } from 'playwright';
import { Logger } from './logger.js';

/**
 * Raw review element data extracted from the DOM
 */
export interface ReviewElement {
    rating: string;
    text: string;
    date: string;
    reviewerName: string;
    title?: string;
    verified?: boolean;
}

/**
 * CSS selectors for Trustpilot review elements
 */
interface ReviewSelectors {
    // Container selectors
    reviewContainer: string[];

    // Required field selectors
    rating: string[];
    text: string[];
    date: string[];
    reviewerName: string[];

    // Optional field selectors
    title: string[];
    verified: string[];
}

/**
 * Primary and fallback selectors for Trustpilot reviews
 */
const REVIEW_SELECTORS: ReviewSelectors = {
    // Review container - the main element containing each review
    reviewContainer: [
        'article[data-service-review-card-paper]',
        'div[data-service-review-card-paper]',
        'article.review',
        'div.review-card',
        '[class*="review"][class*="card"]',
        'article[class*="styles_reviewCard"]'
    ],

    // Rating selectors
    rating: [
        'div[data-service-review-rating] img[alt]',
        'div[class*="star-rating"] img[alt]',
        '[data-rating]',
        'img[alt*="star" i]',
        '[class*="rating"]'
    ],

    // Review text selectors
    text: [
        'p[data-service-review-text-typography]',
        'div[data-service-review-text]',
        'p.review-content__text',
        '[class*="reviewContent"]',
        'p[class*="typography_body"]',
        '[class*="review-text"]',
        '[class*="reviewText"]',
        'p[class*="content"]',
        'div[class*="text"]'
    ],

    // Date selectors
    date: [
        'time[datetime]',
        'div[data-service-review-date-time-ago]',
        'span.review-date',
        '[class*="date"]'
    ],

    // Reviewer name selectors
    reviewerName: [
        'span[data-consumer-name-typography]',
        'div[data-consumer-name]',
        'span.consumer-information__name',
        '[class*="consumerName"]',
        'span[class*="typography_heading"]'
    ],

    // Title selectors (optional)
    title: [
        'h2[data-service-review-title-typography]',
        'div[data-service-review-title]',
        'h3.review-content__title',
        '[class*="reviewTitle"]',
        'h2[class*="typography_heading"]'
    ],

    // Verified status selectors (optional)
    verified: [
        'div[data-service-review-verified]',
        'span.review-content-header__verified',
        '[class*="verified"]',
        'svg[class*="verified"]'
    ]
};

/**
 * ContentExtractor extracts review data from Trustpilot pages
 */
export class ContentExtractor {
    private page: Page;
    private logger: Logger;

    constructor(page: Page, logger: Logger) {
        this.page = page;
        this.logger = logger;
    }

    /**
     * Extract all reviews from the current page
     * @returns Promise resolving to array of ReviewElement objects
     */
    async extractReviews(): Promise<ReviewElement[]> {
        try {
            // Find all review containers using primary and fallback selectors
            const reviewElements = await this.findReviewContainers();

            if (reviewElements.length === 0) {
                this.logger.warn('No review elements found on page');
                return [];
            }

            this.logger.info(`Found ${reviewElements.length} review elements`);

            // Extract data from each review element
            const reviews: ReviewElement[] = [];

            for (let i = 0; i < reviewElements.length; i++) {
                try {
                    const review = await this.extractSingleReview(reviewElements[i]);
                    reviews.push(review);
                } catch (error) {
                    // Non-critical error: log and continue with other reviews
                    this.logger.warn(`Failed to extract review ${i + 1}: ${(error as Error).message}`);
                }
            }

            this.logger.info(`Successfully extracted ${reviews.length} reviews`);
            return reviews;

        } catch (error) {
            this.logger.error('Error extracting reviews', error as Error);
            throw error;
        }
    }

    /**
     * Extract data from a single review element
     * @param element - The review container element handle
     * @returns Promise resolving to ReviewElement with extracted data
     */
    async extractSingleReview(element: any): Promise<ReviewElement> {
        // Extract required fields
        const rating = await this.extractField(element, REVIEW_SELECTORS.rating, 'rating', true);
        const text = await this.extractField(element, REVIEW_SELECTORS.text, 'text', true);
        const date = await this.extractField(element, REVIEW_SELECTORS.date, 'date', true);
        const reviewerName = await this.extractField(element, REVIEW_SELECTORS.reviewerName, 'reviewerName', true);

        // Extract optional fields
        const title = await this.extractField(element, REVIEW_SELECTORS.title, 'title', false);
        const verifiedText = await this.extractField(element, REVIEW_SELECTORS.verified, 'verified', false);

        // Parse verified status
        const verified = verifiedText !== '' && verifiedText !== null;

        return {
            rating,
            text,
            date,
            reviewerName,
            title: title || undefined,
            verified: verified || undefined
        };
    }

    /**
     * Find all review container elements on the page
     * Tries primary selector first, then fallback selectors
     * @returns Promise resolving to array of element handles
     */
    private async findReviewContainers(): Promise<any[]> {
        for (const selector of REVIEW_SELECTORS.reviewContainer) {
            try {
                const elements = await this.page.$$(selector);
                if (elements.length > 0) {
                    this.logger.info(`Found reviews using selector: ${selector}`);
                    return elements;
                }
            } catch (error) {
                // Try next selector
                continue;
            }
        }

        // No reviews found with any selector
        return [];
    }

    /**
     * Extract a field from a review element using multiple selector strategies
     * @param element - The parent review element
     * @param selectors - Array of CSS selectors to try
     * @param fieldName - Name of the field being extracted (for logging)
     * @param required - Whether this field is required
     * @returns Promise resolving to the extracted text or empty string
     */
    private async extractField(
        element: any,
        selectors: string[],
        fieldName: string,
        required: boolean
    ): Promise<string> {
        for (const selector of selectors) {
            try {
                const fieldElement = await element.$(selector);

                if (fieldElement) {
                    let text = '';

                    // Special handling for rating (extract from alt attribute)
                    if (fieldName === 'rating') {
                        text = await fieldElement.getAttribute('alt') || '';

                        // If no alt attribute, try data-rating
                        if (!text) {
                            text = await fieldElement.getAttribute('data-rating') || '';
                        }

                        // If still no text, try textContent
                        if (!text) {
                            text = await fieldElement.textContent() || '';
                        }
                    }
                    // Special handling for date (prefer datetime attribute)
                    else if (fieldName === 'date') {
                        text = await fieldElement.getAttribute('datetime') || '';

                        // If no datetime attribute, use textContent
                        if (!text) {
                            text = await fieldElement.textContent() || '';
                        }
                    }
                    // Default: extract text content
                    else {
                        text = await fieldElement.textContent() || '';
                    }

                    // Clean up whitespace
                    text = text.trim();

                    if (text) {
                        return text;
                    }
                }
            } catch (error) {
                // Try next selector
                continue;
            }
        }

        // If no selector worked and this is the text field, try a more aggressive approach
        if (fieldName === 'text' && required) {
            try {
                // Try to get all paragraph elements within the review
                const paragraphs = await element.$$('p');
                for (const p of paragraphs) {
                    const text = (await p.textContent() || '').trim();
                    // Look for substantial text content (more than just a few words)
                    if (text && text.length > 20) {
                        return text;
                    }
                }

                // Last resort: get all text content from the element
                const allText = (await element.textContent() || '').trim();
                // Extract the longest continuous text block
                const lines = allText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 20);
                if (lines.length > 0) {
                    // Return the longest line as it's likely the review text
                    return lines.reduce((a: string, b: string) => a.length > b.length ? a : b);
                }
            } catch (error) {
                // Fallback failed, continue to error handling below
            }
        }

        // Field not found
        if (required) {
            throw new Error(`Required field "${fieldName}" not found`);
        }

        return '';
    }
}
