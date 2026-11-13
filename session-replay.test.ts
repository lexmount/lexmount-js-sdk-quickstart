import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const replay = {
  session_id: 'session/one', project_id: 'test-project', replay_status: 'completed',
  replay_url: 'https://video.example/one.mp4', tabs: [
    { tab_id: 'one', replay_url: 'https://video.example/one.mp4' },
    { tab_id: 'two', replay_url: 'https://video.example/two.mp4' },
  ],
};

test('replay CLI uses packaged SDK, respects tab/state and propagates API errors', async t => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'replay-demo-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const posts: string[] = [];
  let status = 200;
  let state = 'completed';
  const server = createServer(async (req, res) => {
    for await (const _chunk of req) { /* drain */ }
    if (req.method === 'GET' && req.url === '/v1/regions/catalog') {
      res.writeHead(404).end(); return;
    }
    assert.equal(req.method, 'POST');
    assert.equal(req.url, '/instance/v1/sessions/session%2Fone/replay');
    assert.equal(req.headers['x-api-key'], 'test-only-key');
    assert.equal(req.headers['x-project-id'], 'test-project');
    posts.push(req.url!);
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status === 200 ? { ...replay, replay_status: state } : { error: 'denied' }));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); }));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const env = { ...process.env, CI: '1', LEXMOUNT_API_KEY: 'test-only-key',
    LEXMOUNT_PROJECT_ID: 'test-project', LEXMOUNT_BASE_URL: `http://127.0.0.1:${address.port}` };
  async function run(args: string[]) {
    return new Promise<{ code: number | string; stdout: string; stderr: string }>(resolve => {
      execFile(process.execPath, [path.join(root, 'node_modules/tsx/dist/cli.mjs'),
        path.join(root, 'session-replay.ts'), ...args], { cwd, env, timeout: 15000 },
      (error, stdout, stderr) => resolve({ code: error?.code ?? 0, stdout, stderr }));
    });
  }
  const help = await run(['--help']);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /Usage:/);
  assert.notEqual((await run([])).code, 0);
  assert.equal(posts.length, 0);
  for (const [args, expected] of [
    [[], replay.replay_url], [['--tab-id', 'two'], replay.tabs[1].replay_url],
  ] as const) {
    const result = await run(['--session-id', 'session/one', ...args]);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).replayUrl, expected);
  }
  state = 'transcoding';
  const pending = await run(['--session-id', 'session/one']);
  assert.equal(pending.code, 0, pending.stderr);
  assert.equal(JSON.parse(pending.stdout).replayUrl, null);
  assert.equal(JSON.parse(pending.stdout).replayStatus, 'transcoding');
  const missingTab = await run(['--session-id', 'session/one', '--tab-id', 'missing']);
  assert.notEqual(missingTab.code, 0);
  assert.match(missingTab.stderr, /not present/);
  status = 401;
  const denied = await run(['--session-id', 'session/one']);
  assert.notEqual(denied.code, 0);
  assert.match(denied.stderr, /401|Authentication failed/i);
  assert.ok(!denied.stderr.includes('test-only-key'));
  assert.equal(posts.length, 5); // Exactly one replay query per invocation, never create/delete.
});
