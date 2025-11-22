/**
 * Browser Controller
 * Manages the headless browser instance using Playwright
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';

/**
 * Configuration for browser initialization
 */
export interface BrowserConfig {
    headless: boolean;
    userAgent: string;
    viewport: { width: number; height: number };
    timeout: number;
}

/**
 * Default browser configuration
 */
const DEFAULT_BROWSER_CONFIG: BrowserConfig = {
    headless: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    timeout: 30000
};

/**
 * BrowserController manages the Playwright browser instance
 * Handles initialization, page creation, and cleanup
 */
export class BrowserController {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private config: BrowserConfig;

    constructor(config?: Partial<BrowserConfig>) {
        this.config = { ...DEFAULT_BROWSER_CONFIG, ...config };
    }

    /**
     * Initialize the browser with the configured settings
     * @returns Promise resolving to the Browser instance
     */
    async initialize(): Promise<Browser> {
        if (this.browser) {
            return this.browser;
        }

        this.browser = await chromium.launch({
            headless: this.config.headless,
            timeout: this.config.timeout
        });

        // Create a browser context with configured settings
        this.context = await this.browser.newContext({
            userAgent: this.config.userAgent,
            viewport: this.config.viewport
        });

        // Set default timeout for all pages in this context
        this.context.setDefaultTimeout(this.config.timeout);

        return this.browser;
    }

    /**
     * Create a new page in the browser context
     * @returns Promise resolving to a new Page instance
     */
    async createPage(): Promise<Page> {
        if (!this.context) {
            await this.initialize();
        }

        if (!this.context) {
            throw new Error('Browser context not initialized');
        }

        const page = await this.context.newPage();
        return page;
    }

    /**
     * Close the browser and cleanup resources
     */
    async close(): Promise<void> {
        if (this.context) {
            await this.context.close();
            this.context = null;
        }

        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Get the current browser instance
     * @returns The browser instance or null if not initialized
     */
    getBrowser(): Browser | null {
        return this.browser;
    }

    /**
     * Get the current browser context
     * @returns The browser context or null if not initialized
     */
    getContext(): BrowserContext | null {
        return this.context;
    }

    /**
     * Check if the browser is initialized
     * @returns true if browser is initialized, false otherwise
     */
    isInitialized(): boolean {
        return this.browser !== null && this.context !== null;
    }
}
