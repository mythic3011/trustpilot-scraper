#!/usr/bin/env node

/**
 * Trustpilot Review Scraper
 * Main entry point for the application
 */

import { parseArguments, validateOptions, toConfigurationOptions } from './cli.js';
import { ScraperConfig } from './config.js';
import { Logger } from './logger.js';
import { ScraperOrchestrator } from './scraper-orchestrator.js';
import { ErrorHandler, ErrorAction } from './error-handler.js';

/**
 * Main function
 * Orchestrates the entire scraping process from CLI parsing to final export
 */
async function main(): Promise<void> {
    let logger: Logger | null = null;
    let errorHandler: ErrorHandler | null = null;

    try {
        // Parse command-line arguments
        const cliOptions = parseArguments();

        // Validate options
        validateOptions(cliOptions);

        // Convert to configuration options and create config
        const configOptions = toConfigurationOptions(cliOptions);
        const config = ScraperConfig.fromCLIOptions(configOptions);

        // Initialize logger
        logger = new Logger();
        errorHandler = new ErrorHandler(logger);

        // Create scraper orchestrator
        const orchestrator = new ScraperOrchestrator(config, logger);

        // Execute scraping
        const result = await orchestrator.scrape();

        // Check for errors during scraping
        if (result.errors.length > 0) {
            logger.warn(`Scraping completed with ${result.errors.length} error(s)`);
            // Exit with warning status but still success since we got data
            process.exit(0);
        }

        // Success - exit with status 0
        process.exit(0);

    } catch (error) {
        // Handle top-level errors
        if (error instanceof Error) {
            // If we have an error handler, use it to classify the error
            if (errorHandler && logger) {
                const action = errorHandler.handleError(error, {
                    operation: 'main',
                    additionalInfo: { phase: 'initialization' }
                });

                // For critical errors, provide user-friendly message
                if (action === ErrorAction.TERMINATE) {
                    if (errorHandler.isCaptcha(error)) {
                        logger.error('CAPTCHA or anti-bot protection detected. Cannot continue.');
                        logger.info('Please try again later or use a different approach.');
                    }
                }
            } else {
                // Fallback if logger not initialized
                console.error(`Error: ${error.message}`);
            }

            // Exit with error status
            process.exit(1);
        }

        // Unknown error type - rethrow
        throw error;
    }
}

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error.message);
    console.error(error.stack);
    process.exit(1);
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: unknown) => {
    console.error('Unhandled Promise Rejection:', reason);
    process.exit(1);
});

/**
 * Handle SIGINT (Ctrl+C) gracefully
 */
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Shutting down gracefully...');
    process.exit(130); // Standard exit code for SIGINT
});

/**
 * Handle SIGTERM gracefully
 */
process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Shutting down gracefully...');
    process.exit(143); // Standard exit code for SIGTERM
});

// Run main function if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { };
