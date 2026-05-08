import { config } from 'dotenv';
import { Lexmount } from 'lexmount';

config({ override: true });

async function waitForEnter(): Promise<void> {
  await new Promise<void>((resolve) => {
    process.stdin.resume();
    process.stdout.write('Press Enter to close the session...');
    process.stdin.once('data', () => {
      process.stdout.write('\n');
      resolve();
    });
  });
}

async function main(): Promise<void> {
  const client = new Lexmount();

  const session = await client.sessions.create();
  console.log(`session_id: ${session.id}`);
  console.log(`inspect_url: ${session.inspectUrl}`);

  try {
    if (process.env.LEXMOUNT_QUICKSTART_NON_INTERACTIVE !== '1') {
      await waitForEnter();
    }
  } finally {
    await session.close();
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
