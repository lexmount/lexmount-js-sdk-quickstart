import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { Lexmount } from 'lexmount';
import { ensureCredentials } from './quickstart-auth.ts';

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      url: { type: 'string' },
      region: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log('Usage: npm run local-proxy-demo -- --url http://oa.company.internal/ [--region <region-id>]');
    console.log('Defaults: LEXMOUNT_LOCAL_PROXY_URL and LEXMOUNT_REGION from .env.');
    return;
  }

  await ensureCredentials();
  const target = values.url ?? process.env.LEXMOUNT_LOCAL_PROXY_URL?.trim();
  if (!target) {
    throw new Error('Set LEXMOUNT_LOCAL_PROXY_URL or pass --url with an HTTP(S) URL reachable from this machine.');
  }
  const url = new URL(target);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('The local proxy demo requires an HTTP(S) URL.');
  }

  const region = values.region ?? (process.env.LEXMOUNT_REGION?.trim() || undefined);
  const client = new Lexmount({ region });
  try {
    // This connector uses this machine's network and OS/VPN DNS, separately from CDP.
    const tunnel = await client.tunnels.open();
    try {
      console.log(`Local tunnel ready in region ${tunnel.regionId}`);
      const session = await client.sessions.create({
        browserMode: 'normal',
        proxy: { type: 'local', tunnelId: tunnel.id },
      });
      try {
        console.log(`Session created: ${session.id}`);
        const browser = await chromium.connectOverCDP(session.connectUrl);
        try {
          const context = browser.contexts()[0];
          if (!context) throw new Error('No browser context available after connecting.');
          const page = context.pages()[0] ?? await context.newPage();
          await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 60_000 });
          console.log(`Page title: ${await page.title()}`);
          await page.screenshot({ path: 'local_proxy_demo.png' });
          console.log('Saved screenshot to local_proxy_demo.png');
        } finally {
          await browser.close();
        }
      } finally {
        // Stop the cloud session before revoking its network connector.
        await session.close();
      }
    } finally {
      await tunnel.close();
    }
  } finally {
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
