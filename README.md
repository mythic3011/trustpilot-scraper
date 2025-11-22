# Trustpilot Review Scraper

> A robust, ethical web scraper for extracting customer reviews from Trustpilot with comprehensive testing and rate limiting.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

## 🌟 Features

- 🚀 **Automated Extraction** - Scrapes reviews from any Trustpilot company page
- 📊 **CSV Export** - UTF-8 encoded output ready for text mining and analysis
- 🔄 **Smart Pagination** - Automatically navigates through multiple review pages
- ⏱️ **Rate Limiting** - Configurable delays and exponential backoff to respect servers
- 🎭 **Headless Automation** - Powered by Playwright for JavaScript rendering
- 📝 **Comprehensive Logging** - Detailed progress reporting and error tracking
- 🛡️ **Robust Error Handling** - Retry logic with exponential backoff
- 🧪 **Property-Based Testing** - Correctness guarantees through formal verification
- 🔐 **Manual Login Support** - Optional headed mode for authentication

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [Output Format](#-output-format)
- [Rate Limiting](#-rate-limiting--ethical-scraping)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run the scraper
npm start -- --url https://www.trustpilot.com/review/ouraring.com
```

## 📦 Installation

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn** package manager
- Sufficient disk space for CSV output

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/mythic3011/trustpilot-scraper.git
cd trustpilot-scraper
```

2. **Install dependencies**

```bash
npm install
```

3. **Install Playwright browsers**

```bash
npx playwright install chromium
```

This downloads the Chromium browser binary (~100MB) required for headless automation.

## 💻 Usage

### Basic Usage

```bash
npm start -- --url https://www.trustpilot.com/review/example.com
```

### Development Mode

Run with TypeScript directly (no build step):

```bash
npm run dev -- --url https://www.trustpilot.com/review/example.com
```

### Command Line Options

#### Required

| Option        | Description                   | Example                                               |
| ------------- | ----------------------------- | ----------------------------------------------------- |
| `--url <url>` | Trustpilot company review URL | `--url https://www.trustpilot.com/review/example.com` |

#### Optional

| Option                  | Description                          | Default       | Example                         |
| ----------------------- | ------------------------------------ | ------------- | ------------------------------- |
| `--output <filename>`   | Output CSV filename                  | `reviews.csv` | `--output company-reviews.csv`  |
| `--max-pages <number>`  | Maximum pages to scrape              | unlimited     | `--max-pages 10`                |
| `--delay <ms>`          | Delay between requests (min: 1000ms) | `2000`        | `--delay 5000`                  |
| `--user-agent <string>` | Custom user agent                    | Chrome UA     | `--user-agent "Mozilla/5.0..."` |
| `--headed`              | Show browser window                  | `false`       | `--headed`                      |
| `--wait-for-login`      | Pause for manual login               | `false`       | `--wait-for-login`              |

### Usage Examples

#### Scrape First 5 Pages

```bash
npm start -- --url https://www.trustpilot.com/review/example.com --max-pages 5
```

#### Custom Output with Slower Rate

```bash
npm start -- \
  --url https://www.trustpilot.com/review/example.com \
  --output example-reviews.csv \
  --delay 5000
```

#### Manual Login (Headed Mode)

```bash
npm start -- --url https://www.trustpilot.com/review/example.com --headed
```

This will:

1. Open a visible browser window
2. Navigate to the URL
3. Pause and wait for you to press ENTER
4. Allow manual login or interaction
5. Start scraping after you press ENTER

#### Complete Example

```bash
npm start -- \
  --url https://www.trustpilot.com/review/ouraring.com \
  --output oura-reviews.csv \
  --max-pages 100 \
  --delay 3000
```

## 📊 Output Format

### CSV Structure

| Column         | Type    | Description            | Example                                |
| -------------- | ------- | ---------------------- | -------------------------------------- |
| `rating`       | number  | Star rating (1-5)      | `5`                                    |
| `text`         | string  | Review content         | `"Great product! Highly recommend..."` |
| `date`         | string  | Review date (ISO 8601) | `2024-01-15`                           |
| `reviewerName` | string  | Reviewer name          | `John Smith`                           |
| `title`        | string  | Review headline        | `"Excellent service"`                  |
| `verified`     | boolean | Verified purchase      | `true`                                 |

### Example Output

```csv
rating,text,date,reviewerName,title,verified
5,"Great product! Highly recommend to anyone.","2024-01-15","John Smith","Excellent service",true
4,"Good overall, shipping took longer.","2024-01-14","Jane Doe","Pretty good",false
5,"Amazing support. Quick resolution.","2024-01-13","Bob Johnson","Outstanding",true
```

### Special Character Handling

The CSV exporter properly handles:

- ✅ **Commas** in text (fields are quoted)
- ✅ **Quotes** in text (escaped with double quotes)
- ✅ **Newlines** in reviews (preserved in quoted fields)
- ✅ **International characters** (UTF-8 encoding)
- ✅ **Emojis** and special symbols

## ⚖️ Rate Limiting & Ethical Scraping

### Why It Matters

Responsible web scraping prevents:

- Server overload
- IP blocking
- Terms of service violations
- Service degradation for other users

### Built-in Protections

1. **Configurable Delays** - Default 2s between requests (min 1s)
2. **Exponential Backoff** - Automatic retry with increasing delays (1s → 2s → 4s)
3. **429 Handling** - Respects `retry-after` headers
4. **Realistic User Agent** - Browser-like identification
5. **Request Logging** - Full audit trail

### Best Practices

**Do:**

- ✅ Use reasonable delays (2-5 seconds)
- ✅ Limit page count with `--max-pages`
- ✅ Scrape during off-peak hours
- ✅ Check `robots.txt` policies
- ✅ Review Trustpilot's Terms of Service
- ✅ Space out scraping sessions

**Don't:**

- ❌ Run multiple instances simultaneously
- ❌ Scrape too frequently
- ❌ Ignore rate limit responses
- ❌ Use for commercial purposes without permission

### Legal Considerations

- This tool is for **educational and research purposes**
- Users are responsible for compliance with laws and ToS
- Consider using official APIs when available
- Respect intellectual property and privacy rights

## 🧪 Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Specific suites
npm run test:unit          # Unit tests
npm run test:property      # Property-based tests
npm run test:integration   # Integration tests
```

### Testing Strategy

**Unit Tests** - Verify specific examples and edge cases

- Input validation
- Error handling
- Data transformation
- CSV formatting

**Property-Based Tests** - Verify universal properties

- URL validation correctness
- CSV escaping for all inputs
- Rate limiter timing guarantees
- Data transformer consistency

**Integration Tests** - End-to-end workflows

- Full scraping pipeline
- Mock Trustpilot pages
- Error recovery scenarios

### Test Coverage

The project uses **fast-check** for property-based testing, providing:

- Randomized input generation
- Automatic edge case discovery
- Formal correctness guarantees
- Shrinking to minimal failing examples

## 🔧 Troubleshooting

### Browser Not Found

**Error:** `browserType.launch: Executable doesn't exist`

**Solution:**

```bash
npx playwright install chromium
```

### CAPTCHA Detection

**Symptoms:** Scraper terminates with CAPTCHA message

**Solutions:**

- Increase delay: `--delay 5000`
- Avoid frequent scraping
- Wait before retrying
- Use different network

### No Reviews Extracted

**Symptoms:** Empty CSV file

**Solutions:**

1. Verify URL is correct
2. Check page has reviews in browser
3. Try longer delay: `--delay 5000`
4. Check for HTML structure changes

### Invalid URL Error

**Error:** `Invalid Trustpilot URL format`

**Valid formats:**

- ✅ `https://www.trustpilot.com/review/example.com`
- ✅ `https://www.trustpilot.com/review/my-company`
- ❌ `https://trustpilot.com/review/example.com` (missing www)
- ❌ `https://www.trustpilot.com/categories/electronics` (not review page)

### Network Timeout

**Error:** `Navigation timeout exceeded`

**Solutions:**

- Check internet connection
- Target site may be slow/unavailable
- Try again later
- Use stable network

### Permission Denied

**Error:** `EACCES: permission denied`

**Solutions:**

- Check write permissions
- Specify different path: `--output ~/Documents/reviews.csv`
- Close file if open in Excel/other program

### Rate Limit (429)

**Warning:** `Rate limit detected, waiting...`

**Behavior:** Scraper automatically handles this by:

- Respecting `retry-after` header
- Waiting specified duration
- Retrying request

**Prevention:** Increase `--delay` parameter

## 📁 Project Structure

```
scraper-project/
├── src/                          # Source code
│   ├── index.ts                  # Main entry point
│   ├── cli.ts                    # CLI argument parsing
│   ├── browser-controller.ts    # Browser automation
│   ├── page-navigator.ts        # Pagination logic
│   ├── content-extractor.ts     # Review extraction
│   ├── data-transformer.ts      # Data normalization
│   ├── csv-exporter.ts          # CSV generation
│   ├── rate-limiter.ts          # Rate limiting
│   ├── error-handler.ts         # Error handling
│   ├── logger.ts                # Logging
│   ├── url-validator.ts         # URL validation
│   └── config.ts                # Configuration
├── tests/
│   ├── unit/                    # Unit tests
│   ├── property/                # Property-based tests
│   └── integration/             # Integration tests
├── dist/                        # Compiled output (generated)
├── tsconfig.json                # TypeScript config
├── vitest.config.ts            # Test config
├── package.json                 # Dependencies
└── README.md                    # This file
```

## 🛠️ Technology Stack

- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Playwright](https://playwright.dev/)** - Browser automation
- **[Vitest](https://vitest.dev/)** - Fast, modern testing
- **[fast-check](https://fast-check.dev/)** - Property-based testing
- **[winston](https://github.com/winstonjs/winston)** - Logging framework
- **[commander](https://github.com/tj/commander.js)** - CLI parsing
- **[csv-writer](https://github.com/ryu1kn/csv-writer)** - CSV generation
- **[date-fns](https://date-fns.org/)** - Date utilities

## 🏗️ Architecture

### Design Principles

1. **Separation of Concerns** - Each module has single responsibility
2. **Interface-Driven** - Clear contracts between components
3. **Error Resilience** - Centralized error handling with retry logic
4. **Testability** - Modular design enables comprehensive testing
5. **Configuration** - Validated at startup, immutable at runtime

### Key Components

- **Browser Controller** - Manages Playwright browser lifecycle
- **Page Navigator** - Handles pagination and page loading
- **Content Extractor** - Parses HTML and extracts review data
- **Data Transformer** - Normalizes and validates extracted data
- **CSV Exporter** - Generates properly formatted CSV files
- **Rate Limiter** - Enforces delays and handles backoff
- **Error Handler** - Classifies errors and determines retry strategy

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/mythic3011/trustpilot-scraper.git
cd trustpilot-scraper

# Install dependencies
npm install

# Run tests
npm test

# Build project
npm run build
```

### Contribution Guidelines

1. **Code Style** - Follow existing TypeScript conventions
2. **Testing** - Add unit and property tests for new features
3. **Documentation** - Update README for user-facing changes
4. **Commits** - Use clear, descriptive commit messages
5. **Ethics** - Maintain ethical scraping practices

### Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes with tests
3. Ensure all tests pass: `npm test`
4. Update documentation as needed
5. Submit PR with clear description

## 📄 License

ISC License - See [LICENSE](LICENSE) file for details

## ⚠️ Disclaimer

This tool is provided for **educational and research purposes only**. Users are solely responsible for ensuring their use complies with:

- Applicable laws and regulations
- Trustpilot's Terms of Service
- Website robots.txt policies
- Data protection and privacy laws

The authors assume **no liability** for misuse or any consequences arising from the use of this software.

## 🙏 Acknowledgments

- Built with [Playwright](https://playwright.dev/) for reliable browser automation
- Property-based testing powered by [fast-check](https://fast-check.dev/)
- Inspired by ethical web scraping best practices

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/mythic3011/trustpilot-scraper/issues)
- **Documentation**: See [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) for more examples
- **Repository**: https://github.com/mythic3011/trustpilot-scraper

---

**Made with ❤️ for ethical web scraping and text mining research**
