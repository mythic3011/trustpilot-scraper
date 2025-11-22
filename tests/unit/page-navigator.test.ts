/**
 * Unit tests for PageNavigator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PageNavigator } from '../../src/page-navigator.js';
import { Logger } from '../../src/logger.js';

describe('PageNavigator', () => {
    let mockPage: any;
    let mockLogger: Logger;
    let navigator: PageNavigator;

    beforeEach(() => {
        // Create mock logger
        mockLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            logRequest: vi.fn(),
            logResponse: vi.fn(),
            logConfiguration: vi.fn(),
            logPageProgress: vi.fn(),
            logSummary: vi.fn()
        } as any;

        // Create mock page
        mockPage = {
            goto: vi.fn(),
            waitForSelector: vi.fn(),
            evaluate: vi.fn(),
            $: vi.fn(),
            waitForLoadState: vi.fn()
        };

        navigator = new PageNavigator(mockPage, mockLogger);
    });

    describe('navigateToURL', () => {
        it('should successfully navigate to a valid URL', async () => {
            const mockResponse = {
                status: () => 200
            };
            mockPage.goto.mockResolvedValue(mockResponse);

            const result = await navigator.navigateToURL('https://www.trustpilot.com/review/example.com');

            expect(result).toBe(true);
            expect(mockPage.goto).toHaveBeenCalledWith(
                'https://www.trustpilot.com/review/example.com',
                expect.objectContaining({
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                })
            );
            expect(mockLogger.logRequest).toHaveBeenCalled();
            expect(mockLogger.logResponse).toHaveBeenCalled();
        });

        it('should return false for 404 response', async () => {
            const mockResponse = {
                status: () => 404
            };
            mockPage.goto.mockResolvedValue(mockResponse);

            const result = await navigator.navigateToURL('https://www.trustpilot.com/review/notfound.com');

            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should return false when navigation throws error', async () => {
            mockPage.goto.mockRejectedValue(new Error('Network error'));

            const result = await navigator.navigateToURL('https://www.trustpilot.com/review/example.com');

            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should return false when no response is received', async () => {
            mockPage.goto.mockResolvedValue(null);

            const result = await navigator.navigateToURL('https://www.trustpilot.com/review/example.com');

            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('waitForContent', () => {
        it('should return true when selector appears', async () => {
            mockPage.waitForSelector.mockResolvedValue(true);

            const result = await navigator.waitForContent('.review-card', 5000);

            expect(result).toBe(true);
            expect(mockPage.waitForSelector).toHaveBeenCalledWith(
                '.review-card',
                expect.objectContaining({
                    timeout: 5000,
                    state: 'visible'
                })
            );
        });

        it('should return false when selector times out', async () => {
            mockPage.waitForSelector.mockRejectedValue(new Error('Timeout'));

            const result = await navigator.waitForContent('.review-card', 5000);

            expect(result).toBe(false);
            expect(mockLogger.warn).toHaveBeenCalled();
        });

        it('should use default timeout when not specified', async () => {
            mockPage.waitForSelector.mockResolvedValue(true);

            await navigator.waitForContent('.review-card');

            expect(mockPage.waitForSelector).toHaveBeenCalledWith(
                '.review-card',
                expect.objectContaining({
                    timeout: 30000
                })
            );
        });
    });

    describe('scrollToLoadLazyContent', () => {
        it('should scroll to bottom and back to top', async () => {
            mockPage.evaluate.mockResolvedValue(undefined);

            await navigator.scrollToLoadLazyContent();

            // Should scroll down 3 times and then back to top
            expect(mockPage.evaluate).toHaveBeenCalledTimes(4);
        });

        it('should handle errors gracefully', async () => {
            mockPage.evaluate.mockRejectedValue(new Error('Scroll error'));

            await navigator.scrollToLoadLazyContent();

            expect(mockLogger.warn).toHaveBeenCalled();
        });
    });

    describe('detectNextPageButton', () => {
        it('should return true when next page button exists and is visible', async () => {
            const mockElement = {
                isVisible: vi.fn().mockResolvedValue(true),
                evaluate: vi.fn().mockResolvedValue(false) // not disabled
            };
            mockPage.$.mockResolvedValue(mockElement);

            const result = await navigator.detectNextPageButton();

            expect(result).toBe(true);
        });

        it('should return false when next page button is disabled', async () => {
            const mockElement = {
                isVisible: vi.fn().mockResolvedValue(true),
                evaluate: vi.fn().mockResolvedValue(true) // disabled
            };
            mockPage.$.mockResolvedValue(mockElement);

            const result = await navigator.detectNextPageButton();

            expect(result).toBe(false);
        });

        it('should return false when next page button is not visible', async () => {
            const mockElement = {
                isVisible: vi.fn().mockResolvedValue(false),
                evaluate: vi.fn().mockResolvedValue(false)
            };
            mockPage.$.mockResolvedValue(mockElement);

            const result = await navigator.detectNextPageButton();

            expect(result).toBe(false);
        });

        it('should return false when no next page button exists', async () => {
            mockPage.$.mockResolvedValue(null);

            const result = await navigator.detectNextPageButton();

            expect(result).toBe(false);
        });

        it('should handle errors gracefully', async () => {
            mockPage.$.mockRejectedValue(new Error('Selector error'));

            const result = await navigator.detectNextPageButton();

            expect(result).toBe(false);
            expect(mockLogger.warn).toHaveBeenCalled();
        });
    });

    describe('clickNextPage', () => {
        it('should successfully click next page and return navigation result', async () => {
            const mockElement = {
                isVisible: vi.fn().mockResolvedValue(true),
                evaluate: vi.fn().mockResolvedValue(false),
                click: vi.fn().mockResolvedValue(undefined)
            };
            mockPage.$.mockResolvedValue(mockElement);
            mockPage.waitForLoadState.mockResolvedValue(undefined);

            // Mock detectNextPageButton for the result
            const detectSpy = vi.spyOn(navigator, 'detectNextPageButton').mockResolvedValue(true);

            const result = await navigator.clickNextPage();

            expect(result.success).toBe(true);
            expect(result.hasNextPage).toBe(true);
            expect(mockElement.click).toHaveBeenCalled();

            detectSpy.mockRestore();
        });

        it('should return error when next page button not found', async () => {
            mockPage.$.mockResolvedValue(null);

            const result = await navigator.clickNextPage();

            expect(result.success).toBe(false);
            expect(result.hasNextPage).toBe(false);
            expect(result.error).toBe('Next page button not found');
        });

        it('should handle click errors', async () => {
            const mockElement = {
                isVisible: vi.fn().mockResolvedValue(true),
                evaluate: vi.fn().mockResolvedValue(false),
                click: vi.fn().mockRejectedValue(new Error('Click failed'))
            };
            mockPage.$.mockResolvedValue(mockElement);

            const result = await navigator.clickNextPage();

            expect(result.success).toBe(false);
            expect(result.hasNextPage).toBe(false);
            expect(result.error).toBeDefined();
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('waitForNetworkIdle', () => {
        it('should wait for network idle state', async () => {
            mockPage.waitForLoadState.mockResolvedValue(undefined);

            await navigator.waitForNetworkIdle();

            expect(mockPage.waitForLoadState).toHaveBeenCalledWith('networkidle', { timeout: 10000 });
        });

        it('should handle timeout gracefully', async () => {
            mockPage.waitForLoadState.mockRejectedValue(new Error('Timeout'));

            await navigator.waitForNetworkIdle();

            expect(mockLogger.warn).toHaveBeenCalled();
        });
    });
});
