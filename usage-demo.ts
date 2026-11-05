import 'dotenv/config';
import { Lexmount } from 'lexmount';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} before running this example.`);
  return value;
}

async function main() {
  const client = new Lexmount({
    apiKey: required('LEXMOUNT_API_KEY'),
    projectId: required('LEXMOUNT_PROJECT_ID'),
    baseURL: required('LEXMOUNT_BASE_URL'),
  });
  try {
    if (!('usage' in client)) {
      throw new Error('This SDK has no usage resource. Install the usage-enabled SDK described in README.');
    }
    const current = await client.usage.current({ withResponse: true });
    console.log(JSON.stringify({ endpoint: 'current', request_id: current.request_id,
      status_code: current.status_code, data: current.data }, null, 2));

  } finally {
    client.close();
  }
}

main().catch((error: unknown) => {
  // Do not dump request objects/headers: they can contain API keys.
  if (error instanceof Error && 'status_code' in error) {
    const details = error as Error & { status_code: number; code?: string; request_id?: string };
    console.error('Usage request failed:', details.status_code, details.code, details.request_id);
  } else {
    console.error(error instanceof Error ? error.message : 'Usage query failed.');
  }
  process.exitCode = 1;
});
