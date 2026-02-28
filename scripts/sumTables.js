const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function parseSeeds(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function extractNumbers(text) {
  const matches = text.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/g) || [];
  return matches.map((value) => Number(value.replace(/,/g, ''))).filter((n) => Number.isFinite(n));
}

(async () => {
  const seedsPath = path.join(process.cwd(), 'seeds.txt');
  const urls = parseSeeds(seedsPath);

  if (urls.length === 0) {
    throw new Error('No URLs found in seeds.txt');
  }

  const browser = await chromium.launch({ headless: true });
  let total = 0;

  try {
    for (const url of urls) {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });

      const tableText = await page.$$eval('table td, table th', (cells) =>
        cells.map((cell) => cell.textContent || '').join(' ')
      );

      const values = extractNumbers(tableText);
      total += values.reduce((sum, num) => sum + num, 0);

      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`TOTAL_SUM=${total}`);
})();
