import { ensureCredentials } from './quickstart-auth';
import { chromium, type Browser } from 'playwright';
import { Lexmount } from 'lexmount';

const WINDOW_SIZE_FLAGS = ['--window_size', '--window-size'] as const;

export function getWindowSizeArg(args: readonly string[]): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    for (const flag of WINDOW_SIZE_FLAGS) {
      const prefix = `${flag}=`;
      if (arg.startsWith(prefix)) {
        return arg.slice(prefix.length);
      }
      if (arg === flag) {
        const value = args[index + 1];
        if (value === undefined) {
          throw new Error(`Missing value for ${flag}. Use ${flag} WIDTH,HEIGHT.`);
        }
        return value;
      }
    }

    if (arg === '--window' && args[index + 1] === 'size') {
      const value = args[index + 2];
      if (value === undefined) {
        throw new Error('Missing value for --window size. Use --window size WIDTH,HEIGHT.');
      }
      return value;
    }
  }

  return undefined;
}

export function normalizeWindowSize(value: string): string {
  const match = value.match(/^\s*(\d+)\s*,\s*(\d+)\s*$/);
  if (!match) {
    throw new Error(
      `Invalid window size "${value}". Use WIDTH,HEIGHT, for example --window_size 800,600.`,
    );
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width < 1 || height < 1) {
    throw new Error('Window width and height must both be greater than zero.');
  }

  return `${width},${height}`;
}

async function main(): Promise<void> {
  await ensureCredentials();
  const rawWindowSize =
    getWindowSizeArg(process.argv.slice(2)) ?? process.env.LEXMOUNT_WINDOW_SIZE ?? '1920,1080';
  const windowSize = normalizeWindowSize(rawWindowSize);
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

    // CDP sessions use the browser's native viewport rather than a Playwright-
    // emulated viewport, so page.viewportSize() is null. Read the live page size.
    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    console.log(`Initial viewport: ${viewport.width}x${viewport.height}`);
    await page.goto('https://browser.lexmount.cn/');
    console.log(`Page title: ${await page.title()}`);
  } finally {
    await browser?.close();
    await session.close();
    client.close();
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
