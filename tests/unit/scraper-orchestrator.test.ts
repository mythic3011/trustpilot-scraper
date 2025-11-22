/**
 * Unit tests for ScraperOrchestrator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScraperOrchestrator } from '../../src/scraper-orchestrator.js';
import { ScraperConfig } from '../../src/config.js';
import { Logger } from '../../src/logger.js';

describe('ScraperOrchestrator', () => {
    let config: ScraperConfig;
    let logger: Logger;

    beforeEach(() => {
        config = new ScraperConfig({
            url: 'https://www.trustpilot.com/review/example.com',
            output: 'test-reviews.csv',
            maxPages: 2,
            delay: 1000
        });
        logger = new Logger();
    });

    describe('Initialization', () => {
        it('should create an orchestrator instance', () => {
            const orchestrator = new ScraperOrchestrator(config, logger);
            expect(orchestrator).toBeDefined();
            expect(orchestrator).toBeInstanceOf(ScraperOrchestrator);
        });

        it('should accept configuration and logger', () => {
            const orchestrator = new ScraperOrchestrator(config, logger);
            expect(orchestrator).toBeDefined();
        });
    });

    describe('Configuration', () => {
        it('should work with minimal configuration', () => {
            const minimalConfig = new ScraperConfig({
                url: 'https://www.trustpilot.com/review/test.com'
            });
            const orchestrator = new ScraperOrchestrator(minimalConfig, logger);
            expect(orchestrator).toBeDefined();
        });

        it('should work with full configuration', () => {
            const fullConfig = new ScraperConfig({
                url: 'https://www.trustpilot.com/review/test.com',
                output: 'custom-output.csv',
                maxPages: 5,
                delay: 3000,
                userAgent: 'Custom User Agent',
                timeout: 60000,
                headless: false
            });
            const orchestrator = new ScraperOrchestrator(fullConfig, logger);
            expect(orchestrator).toBeDefined();
        });
    });
});
