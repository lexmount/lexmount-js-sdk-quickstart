import { writeFileSync } from 'node:fs';
import { config } from 'dotenv';
import { chromium, type Browser } from 'playwright';
import { Lexmount } from 'lexmount';

config({ override: true });

async function main(): Promise<void> {
  const client = new Lexmount();
  let browser: Browser | undefined;

  const session = await client.sessions.create({
    browserMode: 'light',
    // Set false to disable MOLI_RESOURCE for only this Light session.
    enableLightmountResource: true,
  });
  console.log(`Session created: ${session.id}`);

  try {
    browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0];
    const page = context?.pages()[0] ?? (await context?.newPage());

    if (!page) {
      throw new Error('No page available after connecting to the remote browser.');
    }

    await page.goto('https://news.sina.cn/');
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map(
        (anchor) => (anchor as HTMLAnchorElement).href
      );
    });

    writeFileSync('links.txt', links.join('\n'), 'utf-8');
    console.log(`Saved ${links.length} links to links.txt`);
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
