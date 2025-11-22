/**
 * CLI Interface
 * Command-line argument parsing and validation using Commander
 */

import { Command } from 'commander';
import { ConfigurationOptions } from './config.js';

/**
 * CLI options interface matching Commander's parsed output
 */
export interface CLIOptions {
    url: string;
    output?: string;
    maxPages?: number;
    delay?: number;
    userAgent?: string;
    headed?: boolean;
    waitForLogin?: boolean;
}

/**
 * Parses command-line arguments and returns validated options
 * @param argv - Command-line arguments (defaults to process.argv)
 * @returns Parsed CLI options
 */
export function parseArguments(argv: string[] = process.argv): CLIOptions {
    const program = new Command();

    program
        .name('trustpilot-scraper')
        .description('Extract customer reviews from Trustpilot and export to CSV')
        .version('1.0.0')
        .requiredOption(
            '-u, --url <url>',
            'Trustpilot company URL (e.g., https://www.trustpilot.com/review/example.com)'
        )
        .option(
            '-o, --output <filename>',
            'Output CSV filename',
            'reviews.csv'
        )
        .option(
            '-m, --max-pages <number>',
            'Maximum number of pages to scrape',
            parsePositiveInteger
        )
        .option(
            '-d, --delay <milliseconds>',
            'Delay between requests in milliseconds (minimum 1000ms recommended)',
            parseNonNegativeInteger,
            2000
        )
        .option(
            '-a, --user-agent <string>',
            'Custom user agent string'
        )
        .option(
            '--headed',
            'Show browser window (non-headless mode)'
        )
        .option(
            '--wait-for-login',
            'Pause before scraping to allow manual login'
        )
        .addHelpText('after', `
Examples:
  $ trustpilot-scraper --url https://www.trustpilot.com/review/example.com
  $ trustpilot-scraper -u https://www.trustpilot.com/review/example.com -o output.csv
  $ trustpilot-scraper -u https://www.trustpilot.com/review/example.com -m 10 -d 3000
  $ trustpilot-scraper -u https://www.trustpilot.com/review/example.com --headed --wait-for-login
  $ trustpilot-scraper -u https://www.trustpilot.com/review/example.com --max-pages 5 --delay 1500

Notes:
  - The URL must be a valid Trustpilot company review page
  - A delay of at least 1000ms (1 second) is recommended to avoid rate limiting
  - Use --max-pages to limit scraping for testing or partial data collection
  - Use --headed to see the browser window (useful for debugging or manual login)
  - Use --wait-for-login to pause and allow manual login before scraping starts
        `);

    program.parse(argv);
    const options = program.opts<CLIOptions>();

    return options;
}

/**
 * Validates CLI options and provides detailed error messages
 * @param options - Parsed CLI options
 * @returns True if valid, throws Error with descriptive message if invalid
 */
export function validateOptions(options: CLIOptions): boolean {
    // URL validation
    if (!options.url) {
        throw new Error('URL is required. Use --url or -u to specify a Trustpilot company URL.');
    }

    if (typeof options.url !== 'string' || options.url.trim().length === 0) {
        throw new Error('URL must be a non-empty string.');
    }

    // URL format validation (basic check, detailed validation in URLValidator)
    if (!options.url.startsWith('https://www.trustpilot.com/review/')) {
        throw new Error(
            'Invalid Trustpilot URL format. URL must start with: https://www.trustpilot.com/review/\n' +
            'Example: https://www.trustpilot.com/review/example.com'
        );
    }

    // Output filename validation
    if (options.output !== undefined) {
        if (typeof options.output !== 'string' || options.output.trim().length === 0) {
            throw new Error('Output filename must be a non-empty string.');
        }

        // Check for path traversal attempts
        if (options.output.includes('..') || options.output.includes('/') || options.output.includes('\\')) {
            throw new Error('Output filename cannot contain path separators or parent directory references.');
        }
    }

    // Max pages validation
    if (options.maxPages !== undefined) {
        if (!Number.isInteger(options.maxPages) || options.maxPages < 1) {
            throw new Error('Max pages must be a positive integer (e.g., 1, 5, 10).');
        }
    }

    // Delay validation
    if (options.delay !== undefined) {
        if (!Number.isInteger(options.delay) || options.delay < 0) {
            throw new Error('Delay must be a non-negative integer in milliseconds (e.g., 1000, 2000).');
        }

        if (options.delay < 1000) {
            console.warn('Warning: Delay less than 1000ms (1 second) may result in rate limiting or blocking.');
        }
    }

    // User agent validation
    if (options.userAgent !== undefined) {
        if (typeof options.userAgent !== 'string' || options.userAgent.trim().length === 0) {
            throw new Error('User agent must be a non-empty string.');
        }
    }

    return true;
}

/**
 * Converts CLI options to ConfigurationOptions format
 * @param cliOptions - Parsed CLI options
 * @returns Configuration options ready for ScraperConfig
 */
export function toConfigurationOptions(cliOptions: CLIOptions): ConfigurationOptions {
    return {
        url: cliOptions.url,
        output: cliOptions.output,
        maxPages: cliOptions.maxPages,
        delay: cliOptions.delay,
        userAgent: cliOptions.userAgent,
        headless: !cliOptions.headed // If --headed is set, headless should be false
    };
}

/**
 * Custom parser for positive integers
 * @param value - String value from CLI
 * @returns Parsed integer
 * @throws Error if value is not a positive integer
 */
function parsePositiveInteger(value: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 1) {
        throw new Error(`Invalid number: "${value}". Must be a positive integer.`);
    }
    return parsed;
}

/**
 * Custom parser for non-negative integers
 * @param value - String value from CLI
 * @returns Parsed integer
 * @throws Error if value is not a non-negative integer
 */
function parseNonNegativeInteger(value: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) {
        throw new Error(`Invalid number: "${value}". Must be a non-negative integer.`);
    }
    return parsed;
}
