import { config } from 'dotenv';
import { ContextLockedError, ContextNotFoundError, Lexmount } from 'lexmount';

config({ override: true });

async function main(): Promise<void> {
  const client = new Lexmount();
  let sourceId: string | undefined;
  let forkedId: string | undefined;

  try {
    const source = await client.contexts.create({
      metadata: {
        scenario: 'quickstart-context-fork',
      },
    });
    sourceId = source.id;
    console.log(`Source context created: ${sourceId}`);

    const forked = await client.contexts.fork(sourceId);
    forkedId = forked.id;
    console.log(`Forked context created: ${forkedId}`);

    const details = await client.contexts.get(forkedId);
    console.log(`Forked context status: ${details.status}`);
  } catch (error: unknown) {
    if (error instanceof ContextLockedError) {
      console.error(`Source context is locked: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    if (error instanceof ContextNotFoundError) {
      console.error(`Source context not found: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  } finally {
    if (forkedId) {
      await client.contexts.delete(forkedId).catch(() => undefined);
    }
    if (sourceId) {
      await client.contexts.delete(sourceId).catch(() => undefined);
    }
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
