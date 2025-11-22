/**
 * Unit tests for CSVExporter
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSVExporter } from '../../src/csv-exporter.js';
import { TransformedReview } from '../../src/data-transformer.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('CSVExporter', () => {
    let exporter: CSVExporter;
    const testOutputDir = path.join(process.cwd(), 'test-output');
    const testFiles: string[] = [];

    beforeEach(() => {
        exporter = new CSVExporter();
    });

    afterEach(async () => {
        // Clean up test files
        for (const file of testFiles) {
            try {
                await fs.unlink(file);
            } catch {
                // Ignore errors if file doesn't exist
            }
        }
        testFiles.length = 0;

        // Clean up test directory
        try {
            await fs.rmdir(testOutputDir);
        } catch {
            // Ignore errors if directory doesn't exist or not empty
        }
    });

    describe('export', () => {
        it('should export reviews to CSV file', async () => {
            const reviews: TransformedReview[] = [
                {
                    rating: 5,
                    text: 'Great product!',
                    date: '2024-01-15',
                    reviewerName: 'John Doe',
                    title: 'Excellent',
                    verified: true
                },
                {
                    rating: 4,
                    text: 'Good service',
                    date: '2024-01-14',
                    reviewerName: 'Jane Smith',
                    title: 'Satisfied',
                    verified: false
                }
            ];

            const filename = path.join(testOutputDir, 'test-reviews.csv');
            testFiles.push(filename);

            await fs.mkdir(testOutputDir, { recursive: true });
            const outputPath = await exporter.export(reviews, { filename });

            expect(outputPath).toBe(path.resolve(filename));

            // Verify file exists
            const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
            expect(fileExists).toBe(true);

            // Verify file content
            const content = await fs.readFile(outputPath, 'utf-8');
            expect(content).toContain('rating,text,date,reviewerName,title,verified');
            expect(content).toContain('5,Great product!,2024-01-15,John Doe,Excellent,true');
            expect(content).toContain('4,Good service,2024-01-14,Jane Smith,Satisfied,false');
        });

        it('should handle special characters in text (commas)', async () => {
            const reviews: TransformedReview[] = [
                {
                    rating: 5,
                    text: 'Great product, excellent service, highly recommended',
                    date: '2024-01-15',
                    reviewerName: 'John Doe',
                    title: 'Excellent, Amazing',
                    verified: true
                }
            ];

            const filename = path.join(testOutputDir, 'test-commas.csv');
            testFiles.push(filename);

            await fs.mkdir(testOutputDir, { recursive: true });
            const outputPath = await exporter.export(reviews, { filename });

            const content = await fs.readFile(outputPath, 'utf-8');
            // csv-writer should wrap fields with commas in quotes
            expect(content).toContain('"Great product, excellent service, highly recommended"');
            expect(content).toContain('"Excellent, Amazing"');
        });

        it('should handle special characters in text (quotes)', async () => {
            const reviews: TransformedReview[] = [
                {
                    rating: 5,
                    text: 'They said "amazing" and I agree',
                    date: '2024-01-15',
                    reviewerName: 'John Doe',
                    title: 'Simply "the best"',
                    verified: true
                }
            ];

            const filename = path.join(testOutputDir, 'test-quotes.csv');
            testFiles.push(filename);

            await fs.mkdir(testOutputDir, { recursive: true });
            const outputPath = await exporter.export(reviews, { filename });

            const content = await fs.readFile(outputPath, 'utf-8');
            // csv-writer should escape quotes by doubling them
            expect(content).toContain('They said ""amazing"" and I agree');
            expect(content).toContain('Simply ""the best""');
        });

        it('should handle special characters in text (newlines)', async () => {
            const reviews: TransformedReview[] = [
                {
                    rating: 5,
                    text: 'Line 1\nLine 2\nLine 3',
                    date: '2024-01-15',
                    reviewerName: 'John Doe',
                    title: 'Multi-line',
                    verified: true
                }
            ];

            const filename = path.join(testOutputDir, 'test-newlines.csv');
            testFiles.push(filename);

            await fs.mkdir(testOutputDir, { recursive: true });
            const outputPath = await exporter.export(reviews, { filename });

            const content = await fs.readFile(outputPath, 'utf-8');
            // csv-writer should wrap fields with newlines in quotes
            expect(content).toContain('"Line 1\nLine 2\nLine 3"');
        });

        it('should handle international characters with UTF-8 encoding', async () => {
            const reviews: TransformedReview[] = [
                {
                    rating: 5,
                    text: 'Très bien! 很好! Отлично!',
                    date: '2024-01-15',
                    reviewerName: 'José García',
                    title: 'Excelente',
                    verified: true
                }
            ];

            const filename = path.join(testOutputDir, 'test-utf8.csv');
            testFiles.push(filename);

            await fs.mkdir(testOutputDir, { recursive: true });
            const outputPath = await exporter.export(reviews, { filename });

            const content = await fs.readFile(outputPath, 'utf-8');
            expect(content).toContain('Très bien! 很好! Отлично!');
            expect(content).toContain('José García');
        });

        it('should export empty array to CSV with headers only', async () => {
            const reviews: TransformedReview[] = [];

            const filename = path.join(testOutputDir, 'test-empty.csv');
            testFiles.push(filename);

            await fs.mkdir(testOutputDir, { recursive: true });
            const outputPath = await exporter.export(reviews, { filename });

            const content = await fs.readFile(outputPath, 'utf-8');
            // CSV writer adds a trailing newline after headers
            expect(content.trim()).toBe('rating,text,date,reviewerName,title,verified');
        });

        it('should return absolute file path', async () => {
            const reviews: TransformedReview[] = [
                {
                    rating: 5,
                    text: 'Test',
                    date: '2024-01-15',
                    reviewerName: 'Test User',
                    title: 'Test',
                    verified: true
                }
            ];

            const filename = path.join(testOutputDir, 'test-path.csv');
            testFiles.push(filename);

            await fs.mkdir(testOutputDir, { recursive: true });
            const outputPath = await exporter.export(reviews, { filename });

            expect(path.isAbsolute(outputPath)).toBe(true);
            expect(outputPath).toBe(path.resolve(filename));
        });

        it('should use UTF-8 encoding by default', async () => {
            const reviews: TransformedReview[] = [
                {
                    rating: 5,
                    text: 'Test with émojis 😀',
                    date: '2024-01-15',
                    reviewerName: 'Test User',
                    title: 'Test',
                    verified: true
                }
            ];

            const filename = path.join(testOutputDir, 'test-default-encoding.csv');
            testFiles.push(filename);

            await fs.mkdir(testOutputDir, { recursive: true });
            const outputPath = await exporter.export(reviews, { filename });

            const content = await fs.readFile(outputPath, 'utf-8');
            expect(content).toContain('Test with émojis 😀');
        });

        it('should include all required CSV headers', async () => {
            const reviews: TransformedReview[] = [];

            const filename = path.join(testOutputDir, 'test-headers.csv');
            testFiles.push(filename);

            await fs.mkdir(testOutputDir, { recursive: true });
            const outputPath = await exporter.export(reviews, { filename });

            const content = await fs.readFile(outputPath, 'utf-8');
            const headers = content.split('\n')[0];

            expect(headers).toBe('rating,text,date,reviewerName,title,verified');
        });
    });
});
