/**
 * Logger module using Winston
 * Provides structured logging with colored console output and timestamps
 */

import winston from 'winston';

/**
 * Logger class for structured logging throughout the application
 */
export class Logger {
    private logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.printf(({ level, message, timestamp }) => {
                    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
                })
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.timestamp({
                            format: 'YYYY-MM-DD HH:mm:ss'
                        }),
                        winston.format.printf(({ level, message, timestamp }) => {
                            return `[${timestamp}] ${level}: ${message}`;
                        })
                    )
                })
            ]
        });
    }

    /**
     * Log an informational message
     */
    info(message: string): void {
        this.logger.info(message);
    }

    /**
     * Log a warning message
     */
    warn(message: string): void {
        this.logger.warn(message);
    }

    /**
     * Log an error message
     */
    error(message: string, error?: Error): void {
        if (error) {
            this.logger.error(`${message}: ${error.message}`, { stack: error.stack });
        } else {
            this.logger.error(message);
        }
    }

    /**
     * Log scraping configuration on startup
     */
    logConfiguration(config: {
        targetURL: string;
        outputFilename: string;
        maxPages: number;
        delayMs: number;
        userAgent: string;
    }): void {
        this.info('Trustpilot Review Scraper');
        this.info('========================');
        this.info(`Target URL: ${config.targetURL}`);
        this.info(`Output File: ${config.outputFilename}`);
        this.info(`Max Pages: ${config.maxPages === Infinity ? 'unlimited' : config.maxPages}`);
        this.info(`Delay: ${config.delayMs}ms`);
        this.info(`User Agent: ${config.userAgent.substring(0, 50)}...`);
        this.info('========================');
    }

    /**
     * Log progress update for page processing
     */
    logPageProgress(pageNumber: number, reviewCount: number): void {
        this.info(`Processing page ${pageNumber}: extracted ${reviewCount} reviews`);
    }

    /**
     * Log HTTP request
     */
    logRequest(url: string, method: string = 'GET'): void {
        this.info(`${method} ${url}`);
    }

    /**
     * Log HTTP response
     */
    logResponse(url: string, status: number): void {
        this.info(`Response from ${url}: ${status}`);
    }

    /**
     * Log completion summary
     */
    logSummary(summary: {
        totalReviews: number;
        outputFile: string;
        startTime: Date;
        endTime: Date;
        pagesProcessed: number;
    }): void {
        const duration = summary.endTime.getTime() - summary.startTime.getTime();
        const durationSeconds = (duration / 1000).toFixed(2);

        this.info('========================');
        this.info('Scraping Complete');
        this.info('========================');
        this.info(`Total Reviews: ${summary.totalReviews}`);
        this.info(`Pages Processed: ${summary.pagesProcessed}`);
        this.info(`Output File: ${summary.outputFile}`);
        this.info(`Start Time: ${summary.startTime.toISOString()}`);
        this.info(`End Time: ${summary.endTime.toISOString()}`);
        this.info(`Duration: ${durationSeconds}s`);
        this.info('========================');
    }
}

/**
 * Create and export a singleton logger instance
 */
export const logger = new Logger();
