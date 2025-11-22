/**
 * Data Transformer
 * Normalizes and transforms raw review data
 */

import { parse, format, isValid } from 'date-fns';
import { ReviewElement } from './content-extractor.js';

/**
 * Transformed review with normalized data
 */
export interface TransformedReview {
    rating: number;
    text: string;
    date: string;           // ISO 8601 format (YYYY-MM-DD)
    reviewerName: string;
    title: string;
    verified: boolean;
}

/**
 * DataTransformer normalizes raw review data into a consistent format
 */
export class DataTransformer {
    /**
     * Transform a raw ReviewElement into a normalized TransformedReview
     * @param review - Raw review element from extraction
     * @returns Transformed review with normalized data
     */
    transform(review: ReviewElement): TransformedReview {
        return {
            rating: this.parseRating(review.rating),
            text: this.sanitizeText(review.text),
            date: this.normalizeDate(review.date),
            reviewerName: this.sanitizeText(review.reviewerName),
            title: review.title ? this.sanitizeText(review.title) : '',
            verified: review.verified ?? false
        };
    }

    /**
     * Normalize date strings to ISO 8601 format (YYYY-MM-DD)
     * Handles various date formats including relative dates
     * @param dateString - Raw date string from extraction
     * @returns ISO 8601 formatted date string or original string if parsing fails
     */
    normalizeDate(dateString: string): string {
        if (!dateString) {
            return dateString;
        }

        const trimmed = dateString.trim();

        if (trimmed === '') {
            return '';
        }

        // Try to parse ISO 8601 datetime format (e.g., "2024-01-15T10:30:00Z")
        if (trimmed.match(/^\d{4}-\d{2}-\d{2}T/)) {
            const date = new Date(trimmed);
            if (isValid(date)) {
                return format(date, 'yyyy-MM-dd');
            }
        }

        // Try to parse ISO 8601 date format (e.g., "2024-01-15")
        if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const date = parse(trimmed, 'yyyy-MM-dd', new Date());
            if (isValid(date)) {
                return format(date, 'yyyy-MM-dd');
            }
        }

        // Try common date formats
        const dateFormats = [
            'MMM dd, yyyy',      // Jan 15, 2024
            'MMMM dd, yyyy',     // January 15, 2024
            'dd MMM yyyy',       // 15 Jan 2024
            'dd MMMM yyyy',      // 15 January 2024
            'MM/dd/yyyy',        // 01/15/2024
            'dd/MM/yyyy',        // 15/01/2024
            'yyyy/MM/dd',        // 2024/01/15
            'MMM d, yyyy',       // Jan 5, 2024 (single digit day)
            'MMMM d, yyyy',      // January 5, 2024
            'd MMM yyyy',        // 5 Jan 2024
            'd MMMM yyyy'        // 5 January 2024
        ];

        for (const formatString of dateFormats) {
            try {
                const date = parse(trimmed, formatString, new Date());
                if (isValid(date)) {
                    return format(date, 'yyyy-MM-dd');
                }
            } catch {
                // Try next format
                continue;
            }
        }

        // Handle relative dates (e.g., "2 days ago", "1 week ago")
        const relativeMatch = trimmed.match(/(\d+)\s+(day|week|month|year)s?\s+ago/i);
        if (relativeMatch) {
            const amount = parseInt(relativeMatch[1], 10);
            const unit = relativeMatch[2].toLowerCase();
            const now = new Date();

            let date: Date;
            switch (unit) {
                case 'day':
                    date = new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
                    break;
                case 'week':
                    date = new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    date = new Date(now);
                    date.setMonth(date.getMonth() - amount);
                    break;
                case 'year':
                    date = new Date(now);
                    date.setFullYear(date.getFullYear() - amount);
                    break;
                default:
                    return trimmed; // Fallback to original string
            }

            if (isValid(date)) {
                return format(date, 'yyyy-MM-dd');
            }
        }

        // Handle "today", "yesterday"
        if (trimmed.toLowerCase() === 'today') {
            return format(new Date(), 'yyyy-MM-dd');
        }

        if (trimmed.toLowerCase() === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return format(yesterday, 'yyyy-MM-dd');
        }

        // Fallback: return original string if parsing fails
        return trimmed;
    }

    /**
     * Sanitize text by trimming whitespace and normalizing line breaks
     * @param text - Raw text string
     * @returns Sanitized text
     */
    sanitizeText(text: string): string {
        if (!text) {
            return '';
        }

        return text
            .trim()
            .replace(/\r\n/g, '\n')  // Normalize Windows line endings
            .replace(/\r/g, '\n')    // Normalize old Mac line endings
            .replace(/\n{3,}/g, '\n\n'); // Collapse multiple newlines to max 2
    }

    /**
     * Parse rating string to number
     * Handles various rating formats (e.g., "5 stars", "Rated 5 out of 5", "5/5")
     * @param ratingString - Raw rating string
     * @returns Numeric rating (1-5) or 0 if parsing fails
     */
    parseRating(ratingString: string): number {
        if (!ratingString) {
            return 0;
        }

        const trimmed = ratingString.trim();

        // Try to extract number from various formats
        // "5 stars", "5 out of 5", "Rated 5", "5/5", "5.0"
        const numberMatch = trimmed.match(/(\d+(?:\.\d+)?)/);

        if (numberMatch) {
            const rating = parseFloat(numberMatch[1]);

            // Validate rating is in expected range (1-5)
            if (rating >= 1 && rating <= 5) {
                return rating;
            }
        }

        // Fallback: return 0 if parsing fails
        return 0;
    }
}
