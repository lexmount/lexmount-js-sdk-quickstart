import { config } from 'dotenv';
import { chromium, type Browser } from 'playwright';
import { Lexmount } from 'lexmount';

config({ override: true });

async function main(): Promise<void> {
  const client = new Lexmount();
  let browser: Browser | undefined;
  let createdContextId: string | undefined;

  try {
    const persistentContext = await client.contexts.create({
      metadata: {},
    });
    createdContextId = persistentContext.id;
    console.log(`Context created: ${createdContextId}`);

    const session = await client.sessions.create({
      context: { id: createdContextId, mode: 'readWrite' },
    });

    try {
      browser = await chromium.connectOverCDP(session.connectUrl);
      const context = browser.contexts()[0];
      const page = context?.pages()[0] ?? (await context?.newPage());

      if (!page) {
        throw new Error('No page available after connecting to the remote browser.');
      }

      await page.goto('https://www.baidu.com/');
      console.log(`Session created with context: ${createdContextId}`);
    } finally {
      await browser?.close();
      await session.close();
    }
  } finally {
    if (createdContextId) {
      await client.contexts.delete(createdContextId).catch(() => undefined);
    }
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
