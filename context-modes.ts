import { ensureCredentials } from './quickstart-auth.ts';
import { Lexmount } from 'lexmount';

async function main(): Promise<void> {
  await ensureCredentials();
  const client = new Lexmount();
  const context = await client.contexts.create({
    metadata: { scenario: 'context-modes' },
  });

  try {
    const writer = await client.sessions.create({
      context: { id: context.id, mode: 'readWrite' },
    });
    console.log(`Read-write session: ${writer.id}`);
    await writer.close();

    const readerOne = await client.sessions.create({
      context: { id: context.id, mode: 'readOnly' },
    });
    const readerTwo = await client.sessions.create({
      context: { id: context.id, mode: 'readOnly' },
    });

    console.log(`Read-only sessions: ${readerOne.id}, ${readerTwo.id}`);

    await readerOne.close();
    await readerTwo.close();
  } finally {
    await client.contexts.delete(context.id).catch(() => undefined);
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
