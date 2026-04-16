import { config } from 'dotenv';
import { ContextLockedError, ContextNotFoundError, Lexmount } from 'lexmount';

config({ override: true });

async function main(): Promise<void> {
  const sourceId = process.argv[2];
  if (!sourceId) {
    throw new Error('Usage: npm run context-fork -- <context_id>');
  }

  const client = new Lexmount();

  try {
    const forked = await client.contexts.fork(sourceId);
    console.log(`Forked context id: ${forked.id}`);
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
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
