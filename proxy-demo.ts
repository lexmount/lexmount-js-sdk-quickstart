import { config } from 'dotenv';
import { chromium, type Browser } from 'playwright';
import { Lexmount } from 'lexmount';

config({ override: true });

function buildProxyConfig() {
  const server = process.env.LEXMOUNT_PROXY_SERVER?.trim();
  if (!server) {
    throw new Error('LEXMOUNT_PROXY_SERVER is required for proxy-demo.ts');
  }

  return {
    type: 'external' as const,
    server,
    username: process.env.LEXMOUNT_PROXY_USERNAME?.trim() || undefined,
    password: process.env.LEXMOUNT_PROXY_PASSWORD?.trim() || undefined,
  };
}

async function main(): Promise<void> {
  const client = new Lexmount();
  const proxy = buildProxyConfig();
  let browser: Browser | undefined;

  console.log(`Using proxy server: ${proxy.server}`);

  const session = await client.sessions.create({ proxy });
  console.log(`Session created: ${session.id}`);

  try {
    browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0];
    const page = context?.pages()[0] ?? (await context?.newPage());

    if (!page) {
      throw new Error('No page available after connecting to the remote browser.');
    }

    await page.goto('https://example.com/', { waitUntil: 'domcontentloaded' });
    console.log(`Page title: ${await page.title()}`);
    await page.screenshot({ path: 'proxy_demo.png' });
    console.log('Saved screenshot to proxy_demo.png');
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
