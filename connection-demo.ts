import { config } from 'dotenv';
import { chromium, type Browser } from 'playwright';
import { Lexmount } from 'lexmount';

config({ override: true });

function buildConnectionUrl(client: Lexmount): string {
  const base = new URL(client.baseUrl);
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  base.pathname = '/connection';
  base.search = new URLSearchParams({
    project_id: client.projectId,
    api_key: client.apiKey,
  }).toString();
  base.hash = '';
  return base.toString();
}

async function main(): Promise<void> {
  const client = new Lexmount();
  let browser: Browser | undefined;

  try {
    const connectionUrl = buildConnectionUrl(client);
    console.log(`connection_url: ${connectionUrl}`);

    browser = await chromium.connectOverCDP(connectionUrl);
    const context = browser.contexts()[0];
    const page = context?.pages()[0] ?? (await context?.newPage());

    if (!page) {
      throw new Error('No page available after connecting to the remote browser.');
    }

    await page.goto('https://example.com/');
    const pageTitle = await page.title();
    if (pageTitle !== 'Example Domain') {
      throw new Error(`Page title mismatch. Expected Example Domain. Actual: ${pageTitle}`);
    }

    await page.screenshot({ path: 'connection_demo.png' });
    console.log('Saved screenshot to connection_demo.png');
  } finally {
    await browser?.close();
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
