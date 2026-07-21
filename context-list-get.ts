import { config } from 'dotenv';
import { Lexmount } from 'lexmount';

config({ override: true });

async function main(): Promise<void> {
  const client = new Lexmount();
  const createdContextIds: string[] = [];

  try {
    const first = await client.contexts.create({
      description: 'First example context',
      metadata: { label: 'first-example-context' },
    });
    const second = await client.contexts.create({
      description: 'Second example context',
      metadata: { label: 'second-example-context' },
    });

    createdContextIds.push(first.id, second.id);

    const contexts = await client.contexts.list();
    console.log(`Total contexts found: ${contexts.length}`);

    for (const context of contexts) {
      console.log(`${context.displayName} ${context.status} (${context.id})`);
    }

    const details = await client.contexts.get(first.id);
    console.log(`Details for ${details.displayName}: ${details.status} (${details.id})`);
  } finally {
    for (const contextId of createdContextIds) {
      await client.contexts.delete(contextId).catch(() => undefined);
    }
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
