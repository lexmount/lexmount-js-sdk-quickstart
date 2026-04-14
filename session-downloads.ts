import { writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { config } from 'dotenv';
import { chromium, type Browser } from 'playwright';
import { Lexmount } from 'lexmount';

config({ override: true });

const DOWNLOAD_URL = 'https://proof.ovh.net/files/1Mb.dat';
const DOWNLOAD_TIMEOUT_MS = 60_000;

async function waitForCompletedDownloads(client: Lexmount, sessionId: string) {
  const deadline = Date.now() + DOWNLOAD_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const downloads = await client.sessions.downloads.list(sessionId);
    const completed = downloads.downloads.filter(
      (item) => item.filename && !item.filename.endsWith('.crdownload') && item.size > 0
    );

    if (completed.length > 0) {
      return downloads;
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for completed downloads for session ${sessionId}`);
}

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

    const cdp = await browser.newBrowserCDPSession();
    await cdp.send('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: '/config/Downloads',
      eventsEnabled: true,
    });

    await page.setContent(`<a id="dl" href="${DOWNLOAD_URL}" download>Download</a>`);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#dl').click();
    const download = await downloadPromise;
    console.log(`Suggested filename: ${download.suggestedFilename()}`);

    const downloads = await waitForCompletedDownloads(client, session.id);
    console.log(`Download count: ${downloads.summary.count}`);
    console.log(`Download total size: ${downloads.summary.totalSize}`);

    const archive = await client.sessions.downloads.archive(session.id);
    const archivePath = `session-${session.id}-downloads.zip`;
    await writeFile(archivePath, archive);
    console.log(`Archive saved to ${archivePath}`);
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
