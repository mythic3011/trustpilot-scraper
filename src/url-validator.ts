/**
 * URLValidator
 * Validates Trustpilot company review URLs
 */

export class URLValidator {
    private static readonly TRUSTPILOT_PATTERN = /^https:\/\/www\.trustpilot\.com\/review\/.+$/;

    /**
     * Validates if a URL is a valid Trustpilot company review URL
     * @param url - The URL to validate
     * @returns true if valid, false otherwise
     */
    static validate(url: string): boolean {
        if (!url || typeof url !== 'string') {
            return false;
        }

        try {
            // First check if it's a valid URL
            new URL(url);

            // Then check if it matches the Trustpilot pattern
            return this.TRUSTPILOT_PATTERN.test(url);
        } catch {
            return false;
        }
    }

    /**
     * Extracts the company identifier from a Trustpilot URL
     * @param url - The Trustpilot URL
     * @returns The company identifier or null if invalid
     */
    static extractCompanyId(url: string): string | null {
        if (!this.validate(url)) {
            return null;
        }

        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            // Path format: /review/{company-id}
            const companyId = pathParts[2];
            return companyId || null;
        } catch {
            return null;
        }
    }
}
