/**
 * CSV Exporter
 * Exports review data to CSV format with proper encoding and escaping
 */

import { createObjectCsvWriter } from 'csv-writer';
import { TransformedReview } from './data-transformer.js';
import * as path from 'path';

/**
 * Options for CSV export
 */
export interface ExportOptions {
    filename: string;
    encoding?: string;
}

/**
 * CSVExporter handles exporting review data to CSV files
 */
export class CSVExporter {
    /**
     * Export reviews to a CSV file
     * @param reviews - Array of transformed reviews to export
     * @param options - Export options including filename and encoding
     * @returns Path to the created CSV file
     */
    async export(reviews: TransformedReview[], options: ExportOptions): Promise<string> {
        const encoding = options.encoding || 'utf8';
        const outputPath = path.resolve(options.filename);

        // Define CSV headers matching the TransformedReview interface
        const csvWriter = createObjectCsvWriter({
            path: outputPath,
            header: [
                { id: 'rating', title: 'rating' },
                { id: 'text', title: 'text' },
                { id: 'date', title: 'date' },
                { id: 'reviewerName', title: 'reviewerName' },
                { id: 'title', title: 'title' },
                { id: 'verified', title: 'verified' }
            ],
            encoding: encoding as BufferEncoding
        });

        // Write reviews to CSV
        // csv-writer library handles proper escaping of special characters
        // (commas, quotes, newlines) automatically
        await csvWriter.writeRecords(reviews);

        return outputPath;
    }
}
