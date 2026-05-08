import { config } from 'dotenv';
import { chromium, type Browser } from 'playwright';
import { Lexmount, type BrowserMode } from 'lexmount';

config({ override: true });

function parseBrowserMode(): BrowserMode {
  const index = process.argv.indexOf('--browser-mode');
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (value === 'normal' || value === 'light') {
    return value;
  }
  return 'normal';
}

function parsePageCount(): number {
  const index = process.argv.indexOf('--pages');
  const value = index >= 0 ? Number(process.argv[index + 1]) : 2;
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 2;
}

async function main(): Promise<void> {
  const browserMode = parseBrowserMode();
  const pageCount = parsePageCount();
  const client = new Lexmount();
  let browser: Browser | undefined;

  const session = await client.sessions.create({ browserMode });
  console.log(`session_id: ${session.id}`);
  console.log(`browser_mode: ${browserMode}`);
  console.log(`connect_url: ${session.connectUrl}`);

  try {
    browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0];
    if (!context) {
      throw new Error('No browser context available after connecting to the remote browser.');
    }

    for (let i = 0; i < pageCount; i += 1) {
      const page = await context.newPage();
      await page.goto('https://example.com/');
      console.log(`new_page_${i + 1}: title=${await page.title()}`);
      await page.close();
    }
  } finally {
    await browser?.close();
    await session.close();
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
