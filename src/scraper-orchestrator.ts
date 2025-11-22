/**
 * Scraper Orchestrator
 * Main scraping loop that coordinates all components
 */

import { BrowserController } from './browser-controller.js';
import { PageNavigator } from './page-navigator.js';
import { ContentExtractor } from './content-extractor.js';
import { DataTransformer, TransformedReview } from './data-transformer.js';
import { CSVExporter } from './csv-exporter.js';
import { RateLimiter } from './rate-limiter.js';
import { Logger } from './logger.js';
import { ScraperConfig } from './config.js';
import { Page } from 'playwright';

/**
 * Result of a scraping session
 */
export interface ScrapingResult {
    totalReviews: number;
    pagesProcessed: number;
    outputFile: string;
    startTime: Date;
    endTime: Date;
    errors: string[];
}

/**
 * ScraperOrchestrator coordinates all components to perform the scraping operation
 */
export class ScraperOrchestrator {
    private config: ScraperConfig;
    private logger: Logger;
    private browserController: BrowserController;
    private rateLimiter: RateLimiter;
    private dataTransformer: DataTransformer;
    private csvExporter: CSVExporter;

    constructor(config: ScraperConfig, logger: Logger) {
        this.config = config;
        this.logger = logger;
        this.browserController = new BrowserController({
            headless: config.headless,
            userAgent: config.userAgent,
            viewport: config.viewport,
            timeout: config.timeout
        });
        this.rateLimiter = new RateLimiter();
        this.dataTransformer = new DataTransformer();
        this.csvExporter = new CSVExporter();
    }

    /**
     * Wait for user to press Enter
     */
    private async waitForUserInput(): Promise<void> {
        return new Promise((resolve) => {
            process.stdin.once('data', () => {
                resolve();
            });
        });
    }

    /**
     * Execute the main scraping operation
     * @returns Promise resolving to ScrapingResult with session details
     */
    async scrape(): Promise<ScrapingResult> {
        const startTime = new Date();
        const errors: string[] = [];
        const allReviews: TransformedReview[] = [];
        let pagesProcessed = 0;
        let page: Page | null = null;

        try {
            // Log configuration
            this.logger.logConfiguration({
                targetURL: this.config.targetURL,
                outputFilename: this.config.outputFilename,
                maxPages: this.config.maxPages,
                delayMs: this.config.delayMs,
                userAgent: this.config.userAgent
            });

            // Initialize browser
            this.logger.info('Initializing browser...');
            await this.browserController.initialize();
            page = await this.browserController.createPage();

            // Create navigator and extractor
            const navigator = new PageNavigator(page, this.logger);
            const extractor = new ContentExtractor(page, this.logger);

            // Navigate to first page
            this.logger.info('Navigating to target URL...');
            const navigationSuccess = await navigator.navigateToURL(this.config.targetURL);

            if (!navigationSuccess) {
                throw new Error('Failed to navigate to target URL');
            }

            // Wait for content to load
            await navigator.waitForNetworkIdle();

            // If not headless, pause for manual login
            if (!this.config.headless) {
                this.logger.info('');
                this.logger.info('========================================');
                this.logger.info('Browser window is open for manual login');
                this.logger.info('========================================');
                this.logger.info('');
                this.logger.info('Instructions:');
                this.logger.info('1. Log in to Trustpilot if needed');
                this.logger.info('2. Navigate to the reviews page if needed');
                this.logger.info('3. Press ENTER in this terminal to start scraping');
                this.logger.info('');

                // Wait for user to press Enter
                await this.waitForUserInput();

                this.logger.info('Starting scrape...');
                this.logger.info('');
            }

            // Main scraping loop
            let currentPage = 1;
            let hasNextPage = true;
            const seenReviews = new Set<string>(); // Track unique reviews

            while (hasNextPage && currentPage <= this.config.maxPages) {
                try {
                    // Scroll to load lazy content
                    await navigator.scrollToLoadLazyContent();

                    // Wait for network to be idle before extraction
                    await navigator.waitForNetworkIdle();

                    // Extract reviews from current page
                    this.logger.info(`Extracting reviews from page ${currentPage}...`);
                    const rawReviews = await extractor.extractReviews();

                    // Transform reviews
                    const transformedReviews = rawReviews.map(review =>
                        this.dataTransformer.transform(review)
                    );

                    // Filter out duplicates based on text + reviewer + date
                    const uniqueReviews = transformedReviews.filter(review => {
                        const reviewKey = `${review.text}|${review.reviewerName}|${review.date}`;
                        if (seenReviews.has(reviewKey)) {
                            return false; // Duplicate
                        }
                        seenReviews.add(reviewKey);
                        return true; // Unique
                    });

                    const duplicateCount = transformedReviews.length - uniqueReviews.length;
                    if (duplicateCount > 0) {
                        this.logger.warn(`Filtered out ${duplicateCount} duplicate reviews on page ${currentPage}`);
                    }

                    // Add to collection (maintaining order)
                    allReviews.push(...uniqueReviews);

                    // Log progress
                    this.logger.logPageProgress(currentPage, uniqueReviews.length);

                    pagesProcessed++;

                    // Create checkpoint every 50 pages
                    if (pagesProcessed % 50 === 0) {
                        try {
                            const checkpointFilename = this.config.outputFilename.replace('.csv', `_checkpoint_page${pagesProcessed}.csv`);
                            await this.csvExporter.export(allReviews, {
                                filename: checkpointFilename
                            });
                            this.logger.info(`Checkpoint saved: ${checkpointFilename} (${allReviews.length} reviews)`);
                        } catch (checkpointError) {
                            this.logger.warn(`Failed to save checkpoint: ${(checkpointError as Error).message}`);
                        }
                    }

                    // Check if we've reached the max pages limit
                    if (currentPage >= this.config.maxPages) {
                        this.logger.info(`Reached maximum pages limit (${this.config.maxPages})`);
                        break;
                    }

                    // Check for next page
                    hasNextPage = await navigator.detectNextPageButton();

                    if (hasNextPage) {
                        // Apply rate limiting delay before navigating to next page
                        this.logger.info(`Waiting ${this.config.delayMs}ms before next page...`);
                        await this.rateLimiter.delay(this.config.delayMs);

                        // Navigate to next page
                        this.logger.info('Navigating to next page...');
                        const navigationResult = await navigator.clickNextPage();

                        if (!navigationResult.success) {
                            // Pagination failed - log error but continue with collected data
                            const errorMsg = `Pagination failed on page ${currentPage}: ${navigationResult.error || 'unknown error'}`;
                            this.logger.warn(errorMsg);
                            errors.push(errorMsg);
                            hasNextPage = false;
                        } else {
                            // Update hasNextPage based on navigation result
                            hasNextPage = navigationResult.hasNextPage;
                            currentPage++;
                        }
                    } else {
                        this.logger.info('No more pages to scrape');
                    }

                } catch (pageError) {
                    // Non-critical error: log and continue with collected data
                    const errorMsg = `Error processing page ${currentPage}: ${(pageError as Error).message}`;
                    this.logger.error(errorMsg, pageError as Error);
                    errors.push(errorMsg);
                    hasNextPage = false;
                }
            }

            // Export collected reviews to CSV
            this.logger.info(`Exporting ${allReviews.length} reviews to CSV...`);
            const outputFile = await this.csvExporter.export(allReviews, {
                filename: this.config.outputFilename
            });

            const endTime = new Date();

            // Log summary
            this.logger.logSummary({
                totalReviews: allReviews.length,
                outputFile,
                startTime,
                endTime,
                pagesProcessed
            });

            return {
                totalReviews: allReviews.length,
                pagesProcessed,
                outputFile,
                startTime,
                endTime,
                errors
            };

        } catch (error) {
            // Critical error
            this.logger.error('Critical error during scraping', error as Error);
            errors.push((error as Error).message);

            // Export partial data if we have any reviews
            if (allReviews.length > 0) {
                try {
                    this.logger.info(`Exporting ${allReviews.length} partial reviews to CSV...`);
                    const outputFile = await this.csvExporter.export(allReviews, {
                        filename: this.config.outputFilename
                    });

                    const endTime = new Date();

                    this.logger.logSummary({
                        totalReviews: allReviews.length,
                        outputFile,
                        startTime,
                        endTime,
                        pagesProcessed
                    });

                    return {
                        totalReviews: allReviews.length,
                        pagesProcessed,
                        outputFile,
                        startTime,
                        endTime,
                        errors
                    };
                } catch (exportError) {
                    this.logger.error('Failed to export partial data', exportError as Error);
                    errors.push(`Export failed: ${(exportError as Error).message}`);
                }
            }

            throw error;

        } finally {
            // Cleanup: close browser
            if (this.browserController.isInitialized()) {
                this.logger.info('Closing browser...');
                await this.browserController.close();
            }
        }
    }
}
