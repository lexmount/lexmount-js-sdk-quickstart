import { config } from 'dotenv';
import { Lexmount } from 'lexmount';

config({ override: true });

interface SessionTarget {
  id: string;
  title: string;
  type: string;
  url: string;
  inspectUrl?: string | null;
  webSocketDebuggerUrl?: string | null;
  webSocketDebuggerUrlTransformed?: string | null;
}

type SessionsWithTargets = {
  listTargets(sessionId: string): Promise<SessionTarget[]>;
};

async function main(): Promise<void> {
  const client = new Lexmount();
  let sessionId: string | null = null;

  try {
    const session = await client.sessions.create();
    sessionId = session.id;

    console.log(`session_id: ${session.id}`);
    console.log('Listing session targets...');

    const targets = await (client.sessions as unknown as SessionsWithTargets).listTargets(
      session.id
    );
    console.log(`Found ${targets.length} targets\n`);

    for (const target of targets) {
      console.log(`target_id: ${target.id}`);
      console.log(`title: ${target.title}`);
      console.log(`type: ${target.type}`);
      console.log(`url: ${target.url}`);
      console.log(`inspectUrl: ${target.inspectUrl ?? 'N/A'}`);
      console.log(
        `webSocketDebuggerUrl: ${target.webSocketDebuggerUrlTransformed ?? target.webSocketDebuggerUrl ?? 'N/A'}`
      );
      console.log('');
    }
  } finally {
    if (sessionId) {
      await client.sessions.delete({ sessionId }).catch(() => undefined);
    }
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
