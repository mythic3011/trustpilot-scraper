/**
 * Configuration Management
 * Handles scraper configuration with validation and default values
 */

import { URLValidator } from './url-validator.js';

/**
 * Configuration interface for the scraper
 */
export interface Configuration {
    // Required
    targetURL: string;

    // Optional with defaults
    outputFilename: string;
    maxPages: number;
    delayMs: number;
    userAgent: string;
    timeout: number;

    // Browser settings
    headless: boolean;
    viewport: {
        width: number;
        height: number;
    };
}

/**
 * Input options for creating a configuration
 */
export interface ConfigurationOptions {
    url: string;
    output?: string;
    maxPages?: number;
    delay?: number;
    userAgent?: string;
    timeout?: number;
    headless?: boolean;
}

/**
 * ScraperConfig class
 * Manages configuration with validation and default values
 */
export class ScraperConfig implements Configuration {
    // Default values
    private static readonly DEFAULT_OUTPUT = 'reviews.csv';
    private static readonly DEFAULT_MAX_PAGES = Infinity;
    private static readonly DEFAULT_DELAY_MS = 2000;
    private static readonly DEFAULT_USER_AGENT =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    private static readonly DEFAULT_TIMEOUT = 30000;
    private static readonly DEFAULT_HEADLESS = true;
    private static readonly DEFAULT_VIEWPORT = { width: 1920, height: 1080 };

    public readonly targetURL: string;
    public readonly outputFilename: string;
    public readonly maxPages: number;
    public readonly delayMs: number;
    public readonly userAgent: string;
    public readonly timeout: number;
    public readonly headless: boolean;
    public readonly viewport: { width: number; height: number };

    /**
     * Creates a new ScraperConfig instance
     * @param options - Configuration options
     * @throws Error if URL is invalid or required parameters are missing
     */
    constructor(options: ConfigurationOptions) {
        // Validate required URL
        if (!options.url) {
            throw new Error('URL is required');
        }

        if (!URLValidator.validate(options.url)) {
            throw new Error('Invalid Trustpilot URL. Must match pattern: https://www.trustpilot.com/review/*');
        }

        this.targetURL = options.url;

        // Apply defaults for optional parameters
        this.outputFilename = options.output || ScraperConfig.DEFAULT_OUTPUT;
        this.maxPages = options.maxPages ?? ScraperConfig.DEFAULT_MAX_PAGES;
        this.delayMs = options.delay ?? ScraperConfig.DEFAULT_DELAY_MS;
        this.userAgent = options.userAgent || ScraperConfig.DEFAULT_USER_AGENT;
        this.timeout = options.timeout ?? ScraperConfig.DEFAULT_TIMEOUT;
        this.headless = options.headless ?? ScraperConfig.DEFAULT_HEADLESS;
        this.viewport = { ...ScraperConfig.DEFAULT_VIEWPORT };

        // Validate numeric parameters
        this.validateNumericParameters();
    }

    /**
     * Validates numeric parameters are within acceptable ranges
     * @throws Error if parameters are invalid
     */
    private validateNumericParameters(): void {
        if (this.maxPages !== Infinity && (this.maxPages < 1 || !Number.isInteger(this.maxPages))) {
            throw new Error('maxPages must be a positive integer or Infinity');
        }

        if (this.delayMs < 0) {
            throw new Error('delay must be non-negative');
        }

        if (this.timeout < 0) {
            throw new Error('timeout must be non-negative');
        }
    }

    /**
     * Gets the company identifier from the target URL
     * @returns The company identifier
     */
    getCompanyId(): string | null {
        return URLValidator.extractCompanyId(this.targetURL);
    }

    /**
     * Creates a configuration from CLI-style options
     * @param options - CLI options
     * @returns A new ScraperConfig instance
     */
    static fromCLIOptions(options: ConfigurationOptions): ScraperConfig {
        return new ScraperConfig(options);
    }

    /**
     * Returns a plain object representation of the configuration
     * @returns Configuration as a plain object
     */
    toObject(): Configuration {
        return {
            targetURL: this.targetURL,
            outputFilename: this.outputFilename,
            maxPages: this.maxPages,
            delayMs: this.delayMs,
            userAgent: this.userAgent,
            timeout: this.timeout,
            headless: this.headless,
            viewport: { ...this.viewport }
        };
    }
}
