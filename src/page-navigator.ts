/**
 * Page Navigator
 * Handles browser navigation, pagination, lazy loading, and content waiting
 */

import { Page } from 'playwright';
import { Logger } from './logger.js';

/**
 * Result of a navigation operation
 */
export interface NavigationResult {
    success: boolean;
    hasNextPage: boolean;
    error?: string;
}

/**
 * PageNavigator handles all browser navigation operations
 * including URL navigation, content waiting, lazy loading, and pagination
 */
export class PageNavigator {
    private page: Page;
    private logger: Logger;

    constructor(page: Page, logger: Logger) {
        this.page = page;
        this.logger = logger;
    }

    /**
     * Navigate to a URL with error handling
     * @param url - The URL to navigate to
     * @returns Promise resolving to true if navigation succeeded, false otherwise
     */
    async navigateToURL(url: string): Promise<boolean> {
        try {
            this.logger.logRequest(url, 'GET');

            const response = await this.page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            if (!response) {
                this.logger.error(`Navigation failed: no response received for ${url}`);
                return false;
            }

            const status = response.status();
            this.logger.logResponse(url, status);

            if (status >= 400) {
                this.logger.error(`Navigation failed with status ${status} for ${url}`);
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error(`Navigation error for ${url}`, error as Error);
            return false;
        }
    }

    /**
     * Wait for content to be present on the page
     * @param selector - CSS selector to wait for
     * @param timeout - Maximum time to wait in milliseconds
     * @returns Promise resolving to true if content appeared, false if timeout
     */
    async waitForContent(selector: string, timeout: number = 30000): Promise<boolean> {
        try {
            await this.page.waitForSelector(selector, {
                timeout,
                state: 'visible'
            });
            return true;
        } catch (error) {
            this.logger.warn(`Timeout waiting for selector: ${selector}`);
            return false;
        }
    }

    /**
     * Scroll the page to load lazy-loaded content
     * Scrolls once to ensure all content on the current page is loaded
     */
    async scrollToLoadLazyContent(): Promise<void> {
        try {
            // Get initial review count
            const initialHeight = await this.page.evaluate(() => document.body.scrollHeight);

            // Scroll to bottom once to trigger any lazy loading
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            // Wait for content to load
            await this.sleep(1000);

            // Check if new content was loaded
            const newHeight = await this.page.evaluate(() => document.body.scrollHeight);

            // If height changed significantly, wait a bit more for content to stabilize
            if (newHeight > initialHeight * 1.1) {
                await this.sleep(500);
            }

            // Scroll back to top
            await this.page.evaluate(() => {
                window.scrollTo(0, 0);
            });

            // Wait for any lazy-loaded content to settle
            await this.sleep(500);
        } catch (error) {
            this.logger.warn('Error during lazy content loading');
        }
    }

    /**
     * Detect if a next page button exists
     * Tries multiple common selectors for Trustpilot pagination
     * @returns Promise resolving to true if next page button exists, false otherwise
     */
    async detectNextPageButton(): Promise<boolean> {
        try {
            // Common selectors for Trustpilot next page button
            const nextPageSelectors = [
                'a[name="pagination-button-next"]',
                'a[data-pagination-button-next]',
                'button[name="pagination-button-next"]',
                'a.pagination-link--next',
                'a[aria-label*="next" i]',
                'button[aria-label*="next" i]',
                '.pagination a:last-child',
                'nav[role="navigation"] a:last-child'
            ];

            for (const selector of nextPageSelectors) {
                const element = await this.page.$(selector);

                if (element) {
                    // Check if the element is visible and not disabled
                    const isVisible = await element.isVisible();
                    const isDisabled = await element.evaluate((el) => {
                        return el.hasAttribute('disabled') ||
                            el.classList.contains('disabled') ||
                            el.getAttribute('aria-disabled') === 'true';
                    });

                    if (isVisible && !isDisabled) {
                        return true;
                    }
                }
            }

            return false;
        } catch (error) {
            this.logger.warn('Error detecting next page button');
            return false;
        }
    }

    /**
     * Dismiss any authentication or modal dialogs that might be blocking interaction
     */
    async dismissModals(): Promise<void> {
        try {
            // Common selectors for modal close buttons
            const closeButtonSelectors = [
                'button[aria-label*="close" i]',
                'button[aria-label*="dismiss" i]',
                '[data-close-modal-icon]',
                '.modal button[class*="close"]',
                '[role="dialog"] button[aria-label*="close" i]',
                '[data-authentication-modal] button[aria-label*="close" i]'
            ];

            for (const selector of closeButtonSelectors) {
                try {
                    const closeButton = await this.page.$(selector);
                    if (closeButton && await closeButton.isVisible()) {
                        await closeButton.click();
                        await this.sleep(500);
                        this.logger.info('Dismissed modal dialog');
                        return;
                    }
                } catch (error) {
                    // Try next selector
                    continue;
                }
            }

            // Try pressing Escape key as fallback
            await this.page.keyboard.press('Escape');
            await this.sleep(300);
        } catch (error) {
            // Non-critical error, continue
            this.logger.warn('Could not dismiss modal');
        }
    }

    /**
     * Click the next page button and wait for navigation
     * @returns Promise resolving to NavigationResult with success status and next page availability
     */
    async clickNextPage(): Promise<NavigationResult> {
        try {
            // Dismiss any modals that might be blocking the click
            await this.dismissModals();

            // Common selectors for Trustpilot next page button
            const nextPageSelectors = [
                'a[name="pagination-button-next"]',
                'a[data-pagination-button-next]',
                'button[name="pagination-button-next"]',
                'a.pagination-link--next',
                'a[aria-label*="next" i]',
                'button[aria-label*="next" i]',
                '.pagination a:last-child',
                'nav[role="navigation"] a:last-child'
            ];

            let clickedElement = null;

            for (const selector of nextPageSelectors) {
                const element = await this.page.$(selector);

                if (element) {
                    const isVisible = await element.isVisible();
                    const isDisabled = await element.evaluate((el) => {
                        return el.hasAttribute('disabled') ||
                            el.classList.contains('disabled') ||
                            el.getAttribute('aria-disabled') === 'true';
                    });

                    if (isVisible && !isDisabled) {
                        clickedElement = element;
                        break;
                    }
                }
            }

            if (!clickedElement) {
                return {
                    success: false,
                    hasNextPage: false,
                    error: 'Next page button not found'
                };
            }

            // Try clicking with retries in case of modal interference
            let clickSuccess = false;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    if (attempt > 0) {
                        // Dismiss modals again before retry
                        await this.dismissModals();
                        await this.sleep(500);
                    }

                    // Click and wait for navigation
                    await Promise.all([
                        this.page.waitForLoadState('domcontentloaded'),
                        clickedElement.click()
                    ]);

                    clickSuccess = true;
                    break;
                } catch (clickError) {
                    if (attempt === 2) {
                        throw clickError;
                    }
                    this.logger.warn(`Click attempt ${attempt + 1} failed, retrying...`);
                    await this.sleep(1000);
                }
            }

            if (!clickSuccess) {
                return {
                    success: false,
                    hasNextPage: false,
                    error: 'Failed to click next page button after retries'
                };
            }

            // Wait for network to be idle
            await this.waitForNetworkIdle();

            // Check if there's still a next page after navigation
            const hasNextPage = await this.detectNextPageButton();

            return {
                success: true,
                hasNextPage
            };
        } catch (error) {
            this.logger.error('Error clicking next page', error as Error);
            return {
                success: false,
                hasNextPage: false,
                error: (error as Error).message
            };
        }
    }

    /**
     * Wait for network to be idle before extraction
     * Ensures all asynchronous content has loaded
     */
    async waitForNetworkIdle(): Promise<void> {
        try {
            await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch (error) {
            // Network idle timeout is not critical, log and continue
            this.logger.warn('Network idle timeout - continuing anyway');
        }
    }

    /**
     * Sleep utility function
     * @param milliseconds - Duration to sleep
     */
    private sleep(milliseconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
}
