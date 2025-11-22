# Trustpilot Scraper - Usage Examples

## Basic Usage

### 1. Simple Scrape (Headless)
```bash
npm start -- --url https://www.trustpilot.com/review/example.com
```
- Runs in headless mode (no browser window)
- Scrapes all pages
- Saves to `reviews.csv`

### 2. Show Browser Window
```bash
npm start -- --url https://www.trustpilot.com/review/example.com --headed
```
- Opens visible browser window
- Pauses for manual login
- Press ENTER to start scraping

### 3. Limited Pages with Custom Output
```bash
npm start -- --url https://www.trustpilot.com/review/example.com --max-pages 10 --output company-reviews.csv
```
- Scrapes only first 10 pages
- Saves to custom filename

### 4. Slower Scraping (More Conservative)
```bash
npm start -- --url https://www.trustpilot.com/review/example.com --delay 5000
```
- 5-second delay between pages
- Reduces risk of rate limiting

## Advanced Usage

### Login Required Sites
If the site requires login to see all reviews:

```bash
npm start -- --url https://www.trustpilot.com/review/example.com --headed
```

Then:
1. Browser window opens
2. Log in to Trustpilot manually
3. Navigate to the reviews page if needed
4. Press ENTER in terminal
5. Scraping starts automatically

### Development/Testing
```bash
npm run dev -- --url https://www.trustpilot.com/review/example.com --max-pages 2 --headed
```
- Uses TypeScript directly (no build needed)
- Scrapes only 2 pages for testing
- Shows browser for debugging

### Production Scraping
```bash
npm run build
npm start -- \
  --url https://www.trustpilot.com/review/example.com \
  --output production-reviews.csv \
  --delay 3000 \
  --max-pages 100
```
- Builds optimized version
- 3-second delay for safety
- Limits to 100 pages
- Custom output file

## Checkpoint Files

Every 50 pages, the scraper automatically saves checkpoint files:
- `reviews_checkpoint_page50.csv`
- `reviews_checkpoint_page100.csv`
- `reviews_checkpoint_page150.csv`
- etc.

These protect your data if the scraper crashes or is interrupted.

## Tips

1. **Start with --headed** for first-time scraping to see what's happening
2. **Use --max-pages 5** for testing before full scrape
3. **Increase --delay** if you get rate limited
4. **Check checkpoint files** if scraping is interrupted
5. **Use --headed** if you need to bypass login or CAPTCHA
