import { realpathSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { Lexmount } from 'lexmount';
import { ensureCredentials } from './quickstart-auth.ts';

export async function main(args = process.argv.slice(2)): Promise<void> {
  const { values } = parseArgs({ args, options: {
    'session-id': { type: 'string' },
    'tab-id': { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) {
    console.log('Usage: npm run session-replay -- --session-id SESSION_ID [--tab-id TAB_ID]');
    console.log('Queries once without creating or closing a browser session. Run again if processing.');
    return;
  }
  if (!values['session-id']?.trim() || (values['tab-id'] !== undefined && !values['tab-id'].trim())) {
    throw new Error('Provide --session-id SESSION_ID and a nonempty --tab-id if specified.');
  }
  await ensureCredentials();
  const client = new Lexmount({
    apiKey: process.env.LEXMOUNT_API_KEY,
    projectId: process.env.LEXMOUNT_PROJECT_ID,
    baseURL: process.env.LEXMOUNT_BASE_URL ?? 'https://api.lexmount.com',
  });
  try {
    const replay = await client.sessions.getReplay(values['session-id']);
    const tabId = values['tab-id'];
    const tab = tabId === undefined ? undefined : replay.tabs.find(item => item.tabId === tabId);
    if (tabId !== undefined && !tab) throw new Error('Requested tab is not present in the replay response.');
    console.log(JSON.stringify({
      sessionId: replay.sessionId,
      replayStatus: replay.replayStatus,
      replayUrl: tabId === undefined ? replay.replayUrl : tab!.replayUrl,
      tabs: replay.tabs.map(item => ({ tabId: item.tabId, replayUrl: item.replayUrl })),
    }, null, 2));
    // For just the URL, use await client.sessions.getReplayUrl(sessionId, { tabId }).
    // A null URL is normal until the recording has completed processing.
  } finally {
    client.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main().catch((error: unknown) => {
    // Never dump request objects/headers, which can contain API keys.
    if (error instanceof Error && 'status_code' in error) {
      const details = error as Error & { status_code: number; code?: string; request_id?: string };
      console.error('Replay request failed:', details.status_code, details.code, details.request_id);
    } else {
      console.error(error instanceof Error ? error.message : 'Replay query failed.');
    }
    process.exitCode = 1;
  });
}
