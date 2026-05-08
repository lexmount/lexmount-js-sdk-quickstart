import { config } from 'dotenv';
import { ContextLockedError, Lexmount } from 'lexmount';

config({ override: true });

async function main(): Promise<void> {
  const client = new Lexmount();
  const context = await client.contexts.create({
    metadata: { scenario: 'context-lock-handling' },
  });

  let blockingSessionId: string | undefined;

  try {
    const blockingSession = await client.sessions.create({
      context: { id: context.id, mode: 'readWrite' },
    });
    blockingSessionId = blockingSession.id;
    console.log(`Blocking session: ${blockingSession.id}`);

    try {
      await client.sessions.create({
        context: { id: context.id, mode: 'readWrite' },
      });
    } catch (error) {
      if (error instanceof ContextLockedError) {
        console.log(`Context locked by: ${error.activeSessionId ?? 'unknown session'}`);
        console.log(`Retry after: ${error.retryAfter ?? 'not provided'} seconds`);
      } else {
        throw error;
      }
    }

    await blockingSession.close();
    blockingSessionId = undefined;
  } finally {
    if (blockingSessionId) {
      await client.sessions.delete({ sessionId: blockingSessionId }).catch(() => undefined);
    }
    await client.contexts.delete(context.id).catch(() => undefined);
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
