import { config } from 'dotenv';
import { chromium, type Browser } from 'playwright';
import { Lexmount } from 'lexmount';

config({ override: true });

async function main(): Promise<void> {
  const client = new Lexmount();
  let browser: Browser | undefined;

  const session = await client.sessions.create();
  console.log(`Session created: ${session.id}`);

  try {
    browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0];
    const page = context?.pages()[0] ?? (await context?.newPage());

    if (!page) {
      throw new Error('No page available after connecting to the remote browser.');
    }

    await page.goto('https://browser.lexmount.cn/');
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);

    if (!pageTitle.includes('Lexmount Browser')) {
      throw new Error(`Unexpected page title: ${pageTitle}`);
    }

    await page.screenshot({ path: 'screenshot.png' });
    console.log('Screenshot saved to screenshot.png');
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
