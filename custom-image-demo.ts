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
  const customImageId = getArgValue('--custom_image_id') ?? process.env.LEXMOUNT_CUSTOM_IMAGE_ID;
  if (!customImageId) {
    throw new Error('Missing --custom_image_id or LEXMOUNT_CUSTOM_IMAGE_ID');
  }

  const client = new Lexmount();
  let browser: Browser | undefined;

  const createOptions = { browserMode: 'normal' as const, customImageId };
  const session = await client.sessions.create(createOptions);
  console.log(`Session created with custom image: ${session.id}`);

  try {
    browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0];
    const page = context?.pages()[0] ?? (await context?.newPage());

    if (!page) {
      throw new Error('No page available after connecting to the remote browser.');
    }

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
