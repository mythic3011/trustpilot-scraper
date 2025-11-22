# Trustpilot Scraper - Project Summary

## Overview

A production-ready TypeScript web scraper for extracting customer reviews from Trustpilot. Built with ethical scraping practices, comprehensive testing, and robust error handling.

## Key Features

### Core Functionality

- ✅ Automated review extraction from Trustpilot company pages
- ✅ Smart pagination with automatic page navigation
- ✅ CSV export with UTF-8 encoding
- ✅ Checkpoint files every 50 pages for data safety
- ✅ Configurable rate limiting and delays
- ✅ Manual login support for authenticated pages

### Technical Excellence

- ✅ **TypeScript** - Full type safety and IntelliSense
- ✅ **Playwright** - Reliable browser automation
- ✅ **Property-Based Testing** - Formal correctness guarantees
- ✅ **Comprehensive Test Suite** - Unit, property, and integration tests
- ✅ **Error Resilience** - Retry logic with exponential backoff
- ✅ **Structured Logging** - Winston-based logging system

## Project Statistics

### Code Metrics

- **Source Files**: 13 TypeScript modules
- **Test Files**: 12 test suites
- **Lines of Code**: ~2,000 LOC
- **Test Coverage**: Comprehensive (unit + property + integration)

### Dependencies

- **Runtime**: 8 production dependencies
- **Development**: 6 dev dependencies
- **Total Package Size**: ~75 KB (excluding node_modules)

## Architecture

### Module Structure

```
src/
├── index.ts                  # Main orchestrator
├── cli.ts                    # Command-line interface
├── browser-controller.ts     # Playwright browser management
├── page-navigator.ts         # Pagination logic
├── content-extractor.ts      # HTML parsing and data extraction
├── data-transformer.ts       # Data normalization
├── csv-exporter.ts          # CSV file generation
├── rate-limiter.ts          # Request throttling
├── error-handler.ts         # Error classification and retry
├── logger.ts                # Logging infrastructure
├── url-validator.ts         # URL validation
└── config.ts                # Configuration management
```

### Design Principles

1. **Separation of Concerns** - Each module has a single, well-defined responsibility
2. **Interface-Driven Design** - Clear contracts between components
3. **Error Resilience** - Centralized error handling with automatic retry
4. **Testability** - Modular architecture enables comprehensive testing
5. **Ethical Scraping** - Built-in rate limiting and respectful defaults

## Testing Strategy

### Test Coverage

**Unit Tests** (tests/unit/)

- Input validation
- Data transformation
- CSV formatting
- Error handling
- Configuration validation

**Property-Based Tests** (tests/property/)

- URL validation correctness (all valid URLs accepted, all invalid rejected)
- CSV escaping (handles all special characters correctly)
- Rate limiter timing guarantees
- Data transformer consistency

**Integration Tests** (tests/integration/)

- End-to-end scraping workflow
- Mock Trustpilot page handling
- Error recovery scenarios

### Testing Tools

- **Vitest** - Fast, modern test runner
- **fast-check** - Property-based testing library
- **Playwright Test** - Browser automation testing

## Usage

### Quick Start

```bash
# Install dependencies
npm install

# Install browser
npx playwright install chromium

# Run scraper
npm start -- --url https://www.trustpilot.com/review/example.com
```

### Common Commands

```bash
# Development mode (no build)
npm run dev -- --url <url>

# Build project
npm run build

# Run tests
npm test

# Run specific test suite
npm run test:unit
npm run test:property
npm run test:integration
```

### CLI Options

| Option             | Description                      | Default       | Example             |
| ------------------ | -------------------------------- | ------------- | ------------------- |
| `--url`            | Target Trustpilot URL (required) | -             | `--url https://...` |
| `--output`         | Output CSV filename              | `reviews.csv` | `--output data.csv` |
| `--max-pages`      | Maximum pages to scrape          | unlimited     | `--max-pages 50`    |
| `--delay`          | Delay between requests (ms)      | `2000`        | `--delay 5000`      |
| `--headed`         | Show browser window              | `false`       | `--headed`          |
| `--wait-for-login` | Pause for manual login           | `false`       | `--wait-for-login`  |

## Output Format

### CSV Structure

```csv
rating,text,date,reviewerName,title,verified
5,"Great product!","2024-01-15","John Smith","Excellent",true
4,"Good service","2024-01-14","Jane Doe","Pretty good",false
```

### Data Fields

- **rating** - Star rating (1-5)
- **text** - Full review content
- **date** - Review date (ISO 8601 format)
- **reviewerName** - Reviewer's display name
- **title** - Review headline
- **verified** - Verified purchase status (boolean)

### Special Handling

- ✅ Commas in text (properly quoted)
- ✅ Quotes in text (escaped)
- ✅ Newlines in reviews (preserved)
- ✅ UTF-8 encoding (emojis, international characters)

## Ethical Scraping

### Built-in Protections

1. **Rate Limiting** - Default 2-second delay between requests
2. **Exponential Backoff** - Automatic retry with increasing delays
3. **429 Handling** - Respects rate limit responses
4. **Realistic User Agent** - Browser-like identification
5. **Request Logging** - Full audit trail

### Best Practices

**Recommended Settings:**

- Delay: 2-5 seconds between requests
- Max pages: Limit to what you need
- Timing: Scrape during off-peak hours
- Frequency: Space out scraping sessions

**Legal Compliance:**

- Check robots.txt policies
- Review Trustpilot Terms of Service
- Use for research/educational purposes
- Respect data protection laws

## Performance

### Scraping Speed

With default settings (2-second delay):

- **~30 reviews/minute** (assuming 20 reviews per page)
- **~1,800 reviews/hour**
- **100 pages in ~3.5 minutes** (excluding page load time)

### Resource Usage

- **Memory**: ~200-300 MB (Chromium browser)
- **CPU**: Low (mostly waiting)
- **Disk**: Minimal (CSV output only)
- **Network**: ~1-2 MB per page

## Error Handling

### Automatic Recovery

The scraper automatically handles:

- Network timeouts (retry with backoff)
- Rate limiting (429 responses)
- Temporary server errors (5xx)
- Page load failures
- Element not found errors

### Checkpoint System

- Saves progress every 50 pages
- Format: `reviews_checkpoint_page50.csv`
- Prevents data loss on interruption
- Can resume from checkpoints manually

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- TypeScript 5.3+

### Setup

```bash
# Clone repository
git clone https://github.com/mythic3011/trustpilot-scraper.git
cd trustpilot-scraper

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run tests
npm test

# Build project
npm run build
```

### Project Scripts

```json
{
  "start": "node dist/index.js",
  "dev": "tsx src/index.ts",
  "build": "tsc",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:unit": "vitest run tests/unit",
  "test:property": "vitest run tests/property",
  "test:integration": "vitest run tests/integration"
}
```

## Technology Stack

### Core Dependencies

| Package    | Version | Purpose            |
| ---------- | ------- | ------------------ |
| playwright | ^1.40.0 | Browser automation |
| typescript | ^5.3.0  | Type safety        |
| commander  | ^11.1.0 | CLI parsing        |
| csv-writer | ^1.6.0  | CSV generation     |
| winston    | ^3.11.0 | Logging            |
| date-fns   | ^3.0.0  | Date utilities     |

### Development Dependencies

| Package    | Version | Purpose                |
| ---------- | ------- | ---------------------- |
| vitest     | ^1.0.0  | Testing framework      |
| fast-check | ^3.15.0 | Property-based testing |
| tsx        | ^4.7.0  | TypeScript execution   |

## Use Cases

### Academic Research

- Text mining analysis
- Sentiment analysis
- Customer feedback studies
- Market research

### Data Analysis

- Product review analysis
- Competitor analysis
- Trend identification
- Quality assessment

### Machine Learning

- Training data collection
- NLP model development
- Sentiment classification
- Topic modeling

## Limitations

### Technical Limitations

- Requires JavaScript rendering (Playwright)
- Cannot bypass CAPTCHAs automatically
- Limited to publicly visible reviews
- Dependent on Trustpilot HTML structure

### Ethical Limitations

- Must respect rate limits
- Should not overload servers
- Educational/research use only
- Subject to Terms of Service

## Future Enhancements

### Potential Features

- [ ] Resume from checkpoint automatically
- [ ] Multiple output formats (JSON, Excel)
- [ ] Parallel page scraping
- [ ] Proxy support
- [ ] Custom selectors configuration
- [ ] API mode (library usage)

### Improvements

- [ ] Reduce memory footprint
- [ ] Add progress bar
- [ ] Better CAPTCHA detection
- [ ] Configurable retry strategies
- [ ] More detailed logging levels

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

ISC License - Free for educational and research use

## Disclaimer

This tool is provided for **educational and research purposes only**. Users are responsible for:

- Compliance with applicable laws
- Adherence to Trustpilot Terms of Service
- Ethical scraping practices
- Data protection and privacy

## Support

- **GitHub**: https://github.com/mythic3011/trustpilot-scraper
- **Issues**: https://github.com/mythic3011/trustpilot-scraper/issues
- **Documentation**: See README.md and USAGE_EXAMPLES.md

---

**Built with TypeScript, Playwright, and ethical scraping principles**
