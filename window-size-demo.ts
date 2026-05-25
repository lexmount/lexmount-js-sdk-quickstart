import { config } from 'dotenv';
import { chromium, type Browser } from 'playwright';
import { Lexmount } from 'lexmount';

config({ override: true });

function getArgValue(name: string): string | undefined {
  const prefix = `${name}=`;
  const index = process.argv.findIndex((arg) => arg === name || arg.startsWith(prefix));
  if (index < 0) {
    return undefined;
  }
  const value = process.argv[index];
  if (value.startsWith(prefix)) {
    return value.slice(prefix.length);
  }
  return process.argv[index + 1];
}

async function main(): Promise<void> {
  const windowSize = getArgValue('--window_size') ?? process.env.LEXMOUNT_WINDOW_SIZE ?? '1920,1080';
  const client = new Lexmount();
  let browser: Browser | undefined;

  const session = await client.sessions.create({
    browserMode: 'normal',
    windowSize,
  });
  console.log(`Session created with windowSize=${windowSize}: ${session.id}`);

  try {
    browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0];
    const page = context?.pages()[0] ?? (await context?.newPage());

    if (!page) {
      throw new Error('No page available after connecting to the remote browser.');
    }

    const viewport = page.viewportSize();
    console.log(`Initial viewport: ${viewport?.width ?? 'unknown'}x${viewport?.height ?? 'unknown'}`);
    await page.goto('https://browser.lexmount.cn/');
    console.log(`Page title: ${await page.title()}`);
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
