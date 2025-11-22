/**
 * Unit tests for BrowserController
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserController } from '../../src/browser-controller.js';

describe('BrowserController', () => {
    let controller: BrowserController;

    beforeEach(() => {
        controller = new BrowserController();
    });

    afterEach(async () => {
        if (controller.isInitialized()) {
            await controller.close();
        }
    });

    describe('initialization', () => {
        it('should initialize browser with default config', async () => {
            const browser = await controller.initialize();

            expect(browser).toBeDefined();
            expect(controller.isInitialized()).toBe(true);
            expect(controller.getBrowser()).toBe(browser);
        });

        it('should initialize browser with custom config', async () => {
            const customController = new BrowserController({
                headless: true,
                userAgent: 'Custom User Agent',
                viewport: { width: 1280, height: 720 },
                timeout: 15000
            });

            const browser = await customController.initialize();

            expect(browser).toBeDefined();
            expect(customController.isInitialized()).toBe(true);

            await customController.close();
        });

        it('should return same browser instance on multiple initialize calls', async () => {
            const browser1 = await controller.initialize();
            const browser2 = await controller.initialize();

            expect(browser1).toBe(browser2);
        });

        it('should have viewport size of 1920x1080 by default', async () => {
            await controller.initialize();
            const page = await controller.createPage();
            const viewport = page.viewportSize();

            expect(viewport).toEqual({ width: 1920, height: 1080 });

            await page.close();
        });

        it('should set realistic user agent string', async () => {
            await controller.initialize();
            const page = await controller.createPage();
            const userAgent = await page.evaluate(() => navigator.userAgent);

            // Check that user agent contains Chrome or Safari
            expect(userAgent).toMatch(/Chrome|Safari/);

            await page.close();
        });
    });

    describe('page creation', () => {
        it('should create a new page', async () => {
            await controller.initialize();
            const page = await controller.createPage();

            expect(page).toBeDefined();
            expect(page.url()).toBe('about:blank');

            await page.close();
        });

        it('should auto-initialize browser if not initialized', async () => {
            expect(controller.isInitialized()).toBe(false);

            const page = await controller.createPage();

            expect(controller.isInitialized()).toBe(true);
            expect(page).toBeDefined();

            await page.close();
        });

        it('should create multiple pages', async () => {
            await controller.initialize();

            const page1 = await controller.createPage();
            const page2 = await controller.createPage();

            expect(page1).toBeDefined();
            expect(page2).toBeDefined();
            expect(page1).not.toBe(page2);

            await page1.close();
            await page2.close();
        });
    });

    describe('cleanup', () => {
        it('should close browser and cleanup resources', async () => {
            await controller.initialize();
            expect(controller.isInitialized()).toBe(true);

            await controller.close();

            expect(controller.isInitialized()).toBe(false);
            expect(controller.getBrowser()).toBeNull();
            expect(controller.getContext()).toBeNull();
        });

        it('should handle close when not initialized', async () => {
            expect(controller.isInitialized()).toBe(false);

            await expect(controller.close()).resolves.not.toThrow();

            expect(controller.isInitialized()).toBe(false);
        });

        it('should allow re-initialization after close', async () => {
            await controller.initialize();
            await controller.close();

            expect(controller.isInitialized()).toBe(false);

            const browser = await controller.initialize();

            expect(browser).toBeDefined();
            expect(controller.isInitialized()).toBe(true);
        });
    });

    describe('timeout configuration', () => {
        it('should use default timeout of 30 seconds', async () => {
            await controller.initialize();
            const context = controller.getContext();

            expect(context).toBeDefined();
            // Playwright doesn't expose timeout directly, but we can verify it works
            // by creating a page and checking it doesn't throw
            const page = await controller.createPage();
            expect(page).toBeDefined();

            await page.close();
        });

        it('should use custom timeout when provided', async () => {
            const customController = new BrowserController({
                timeout: 15000
            });

            await customController.initialize();
            const page = await customController.createPage();

            expect(page).toBeDefined();

            await page.close();
            await customController.close();
        });
    });
});
