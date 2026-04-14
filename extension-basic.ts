import { access } from 'node:fs/promises';
import { config } from 'dotenv';
import { chromium, type Browser } from 'playwright';
import { Lexmount } from 'lexmount';

config({ override: true });

async function main(): Promise<void> {
  const extensionPath = process.env.LEXMOUNT_EXTENSION_PATH?.trim();
  if (!extensionPath) {
    throw new Error('LEXMOUNT_EXTENSION_PATH is required for extension-basic.ts');
  }

  await access(extensionPath);

  const client = new Lexmount();
  let browser: Browser | undefined;

  const extension = await client.extensions.upload(extensionPath, {
    name: 'quickstart-extension',
  });
  console.log(`Uploaded extension: ${extension.id}`);

  const extensions = await client.extensions.list({ limit: 10 });
  console.log(`Found ${extensions.length} extension(s)`);

  const session = await client.sessions.create({
    browserMode: 'normal',
    extensionIds: [extension.id],
  });
  console.log(`Session created: ${session.id}`);

  try {
    browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0];
    const page = context?.pages()[0] ?? (await context?.newPage());

    if (!page) {
      throw new Error('No page available after connecting to the remote browser.');
    }

    await page.goto('https://www.baidu.com/');
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
