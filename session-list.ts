import { config } from 'dotenv';
import { Lexmount } from 'lexmount';

config({ override: true });

async function main(): Promise<void> {
  const client = new Lexmount();
  const createdSessionIds: string[] = [];

  try {
    console.log('Creating test sessions...');
    const sessionOne = await client.sessions.create({ browserMode: 'normal' });
    const sessionTwo = await client.sessions.create({ browserMode: 'normal' });
    createdSessionIds.push(sessionOne.id, sessionTwo.id);

    const result = await client.sessions.list();
    console.log(`Found ${result.length} sessions on the current page`);
    console.log(
      `Pagination: total=${result.pagination.totalCount}, active=${result.pagination.activeCount}, closed=${result.pagination.closedCount}`
    );

    const activeResult = await client.sessions.list({ status: 'active' });
    console.log(`Found ${activeResult.length} active sessions`);

    for (const session of activeResult) {
      console.log(`${session.id} ${session.status} ${session.browserType}`);
    }
  } finally {
    for (const sessionId of createdSessionIds) {
      await client.sessions.delete({ sessionId }).catch(() => undefined);
    }
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
