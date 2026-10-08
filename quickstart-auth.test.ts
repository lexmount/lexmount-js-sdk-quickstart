import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createServer, request } from 'node:http';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse } from 'dotenv';
import { authorize, canOpenBrowser, ensureCredentials, saveCredentials, DEFAULT_BASE_URL } from './quickstart-auth.ts';

const repoDirectory = fileURLToPath(new URL('.', import.meta.url));
const credentials = { ok: true, project_id: 'project-test', api_key: 'api-test-only', api_base_url: DEFAULT_BASE_URL };
const site = 'https://browser.lexmount.com';
async function fixture(t: { after: (fn: () => Promise<unknown>) => void }, text = '') {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'quickstart-auth-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, '.env');
  if (text) await fs.writeFile(file, text);
  return file;
}

test('complete .env overrides shell credentials without login; default is .com', async t => {
  const file = await fixture(t, 'LEXMOUNT_PROJECT_ID=from-file\nLEXMOUNT_API_KEY=file-key\n');
  const env = { LEXMOUNT_PROJECT_ID: 'from-shell', LEXMOUNT_API_KEY: 'shell-key', LEXMOUNT_BASE_URL: '' };
  await ensureCredentials({ env, envFile: file, browserAvailable: () => { throw new Error('Must not open'); } });
  assert.equal(env.LEXMOUNT_PROJECT_ID, 'from-file');
  assert.equal(env.LEXMOUNT_API_KEY, 'file-key');
  assert.equal(env.LEXMOUNT_BASE_URL, DEFAULT_BASE_URL);
});

test('placeholder/partial/headless credentials fail before login, without changing .env', async t => {
  for (const content of ['', 'LEXMOUNT_PROJECT_ID=present\n',
    'LEXMOUNT_PROJECT_ID=your_project_id_here\nLEXMOUNT_API_KEY=your-api-key-here\n']) {
    const file = await fixture(t, content);
    await assert.rejects(ensureCredentials({ env: {}, envFile: file, browserAvailable: () => false,
      login: async () => { throw new Error('Must not call'); } }), /https:\/\/browser.lexmount.com/);
    assert.equal(await fs.readFile(file, 'utf8').catch(() => ''), content);
  }
});

test('only local interactive macOS/Windows can launch; remote/CI/services cannot', () => {
  for (const platform of ['darwin', 'win32'] as const) {
    assert.equal(canOpenBrowser(platform, {}, true), true);
    assert.equal(canOpenBrowser(platform, {}, false), false);
    for (const key of ['SSH_CONNECTION', 'SSH_CLIENT', 'SSH_TTY', 'CI', 'GITHUB_ACTIONS', 'TF_BUILD']) {
      assert.equal(canOpenBrowser(platform, { [key]: '1' }, true), false);
    }
  }
  assert.equal(canOpenBrowser('linux', {}, true), false);
  assert.equal(canOpenBrowser('win32', { SESSIONNAME: 'Services' }, true), false);
});

test('browser login validates state/path/PKCE and exchanges only the valid code', async () => {
  let challenge = '';
  let callback = '';
  let calls = 0;
  const result = await authorize(site, DEFAULT_BASE_URL, {
    open: async raw => {
      const url = new URL(raw);
      assert.equal(url.origin, site);
      assert.equal(url.pathname, '/connect/codex');
      assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
      challenge = url.searchParams.get('code_challenge')!;
      callback = url.searchParams.get('redirect_uri')!;
      assert.equal(new URL(callback).hostname, '127.0.0.1');
      assert.equal((await fetch(new URL('/favicon.ico', callback))).status, 404);
      assert.equal((await fetch(`${callback}?state=invalid&code=bad`)).status, 400);
      const state = url.searchParams.get('state')!;
      assert.equal((await fetch(`${callback}?state=${state}&code=good`, { headers: { Origin: 'https://foreign.example' } })).status, 403);
      assert.equal((await fetch(`${callback}?state=${state}&state=${state}&code=bad`)).status, 400);
      const wrongHost = await new Promise<number | undefined>((resolve, reject) => {
        request(`${callback}?state=${state}&code=good`, { headers: { Host: 'foreign.example' } }, response => {
          response.resume(); resolve(response.statusCode);
        }).on('error', reject).end();
      });
      assert.equal(wrongHost, 403);
      assert.equal((await fetch(`${callback}?state=${state}&code=good`)).status, 200);
      assert.equal((await fetch(`${callback}?state=${state}&code=second`)).status, 409);
      return true;
    },
    exchange: async (url, body) => {
      calls++;
      assert.equal(url, `${site}/api/connect/codex/exchange`);
      assert.equal(body.code, 'good');
      assert.equal(body.redirect_uri, callback);
      assert.match(body.code_verifier, /^[A-Za-z0-9_-]{43}$/);
      assert.equal(createHash('sha256').update(body.code_verifier).digest('base64url'), challenge);
      return credentials;
    },
  });
  assert.equal(result.api_key, credentials.api_key);
  assert.equal(calls, 1);
  await assert.rejects(fetch(callback)); // Listener is always closed.
});

test('browser failure, cancellation, forged callback and timeout never exchange', async () => {
  const exchange = async () => { assert.fail('Unexpected exchange'); };
  await assert.rejects(authorize(site, DEFAULT_BASE_URL, { open: async () => false, exchange }), /local browser/);
  await assert.rejects(authorize(site, DEFAULT_BASE_URL, {
    open: async raw => {
      const url = new URL(raw);
      await fetch(`${url.searchParams.get('redirect_uri')}?state=${url.searchParams.get('state')}&error=access_denied`);
      return true;
    }, exchange,
  }), /cancelled/);
  await assert.rejects(authorize(site, DEFAULT_BASE_URL, {
    open: async raw => {
      const url = new URL(raw);
      await fetch(`${url.searchParams.get('redirect_uri')}?state=forged&code=bad`);
      return true;
    }, exchange, timeoutMs: 50,
  }), /timed out/);
});

test('malformed responses and mismatched environments fail closed', async () => {
  for (const response of [{ ...credentials, ok: false }, { ...credentials, api_key: '' },
    { ...credentials, api_base_url: null }, { ...credentials, project_id: 'bad\nINJECT=1' }, { ...credentials, api_base_url: 'https://api.lexmount.cn' }]) {
    await assert.rejects(authorize(site, DEFAULT_BASE_URL, {
      open: async raw => {
        const url = new URL(raw);
        await fetch(`${url.searchParams.get('redirect_uri')}?state=${url.searchParams.get('state')}&code=good`);
        return true;
      }, exchange: async () => response,
    }));
  }
});

test('successful login replaces the pair, preserves unrelated multiline settings and permissions', async t => {
  const original = '# custom settings\r\nMULTI="hello\r\nLEXMOUNT_API_KEY=not-an-assignment\r\nworld"\r\n'
    + 'export LEXMOUNT_PROJECT_ID=old-project\r\nLEXMOUNT_API_KEY=your_api_key_here\r\nOTHER="value # keep"\r\n';
  const file = await fixture(t, original);
  const env: Record<string, string | undefined> = {};
  await ensureCredentials({ env, envFile: file, browserAvailable: () => true, login: async () => credentials });
  const saved = await fs.readFile(file, 'utf8');
  assert.equal(parse(saved).MULTI, parse(original).MULTI);
  assert.equal(parse(saved).OTHER, 'value # keep');
  assert.equal(parse(saved).LEXMOUNT_API_KEY, credentials.api_key);
  assert.equal(parse(saved).LEXMOUNT_PROJECT_ID, credentials.project_id);
  assert.equal(env.LEXMOUNT_API_KEY, credentials.api_key);
  assert.equal(saved.includes('old-project'), false);
  if (process.platform !== 'win32') assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
});

test('concurrent edits and failed login leave original settings and partial credentials intact', async t => {
  const file = await fixture(t, '# changed\n');
  await assert.rejects(saveCredentials(file, '# before\n', credentials), /changed during login/);
  const env = { LEXMOUNT_PROJECT_ID: 'partial' };
  await assert.rejects(ensureCredentials({ env, envFile: file, browserAvailable: () => true,
    login: async () => { throw new Error('sensitive-response-MUST-NOT-LEAK'); } }), error => {
    assert.equal(String(error).includes('sensitive-response'), false); return true;
  });
  assert.equal(await fs.readFile(file, 'utf8'), '# changed\n');
  assert.equal(env.LEXMOUNT_PROJECT_ID, 'partial');
});

test('.cn uses its own website and custom APIs require manual setup', async t => {
  const file = await fixture(t);
  await ensureCredentials({ envFile: file, env: { LEXMOUNT_BASE_URL: 'https://api.lexmount.cn' },
    browserAvailable: () => true, login: async (url, base) => {
      assert.equal(url, 'https://browser.lexmount.cn');
      return { ...credentials, api_base_url: base };
    } });
  const customFile = await fixture(t);
  await assert.rejects(ensureCredentials({ envFile: customFile, env: { LEXMOUNT_BASE_URL: 'https://private.example' },
    browserAvailable: () => true, login: async () => { assert.fail('Unexpected login'); } }), /matching website/);
});


test('HTTP exchange posts the code, verifier and redirect URI and reads credentials', async () => {
  const requests: { path: string | undefined; body: Record<string, string> }[] = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({ path: req.url, body: JSON.parse(body) });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(credentials));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const result = await authorize(`http://127.0.0.1:${address.port}`, DEFAULT_BASE_URL, {
      open: async raw => {
        const url = new URL(raw);
        await fetch(`${url.searchParams.get('redirect_uri')}?state=${url.searchParams.get('state')}&code=good`);
        return true;
      },
    });
    assert.equal(result.api_key, credentials.api_key);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].path, '/api/connect/codex/exchange');
    assert.equal(requests[0].body.code, 'good');
    assert.match(requests[0].body.code_verifier, /^[A-Za-z0-9_-]{43}$/);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

async function checkDemoStartup(t: { after: (fn: () => Promise<unknown>) => void }, native: boolean) {
  const file = await fixture(t);
  const cwd = path.dirname(file);
  const guard = path.join(cwd, 'no-network.cjs');
  await fs.writeFile(guard, `const net = require('node:net');
    const original = net.Socket.prototype.connect;
    net.Socket.prototype.connect = function (...args) {
      if (typeof args[0] === 'number' || args[0]?.port) throw new Error('unexpected network');
      return original.apply(this, args);
    };`);
  const scripts = (JSON.parse(await fs.readFile(path.join(repoDirectory, 'package.json'), 'utf8')) as
    { scripts: Record<string, string> }).scripts;
  const demos = Object.entries(scripts).filter(([name]) => name !== 'test');
  assert.equal(demos.length, 20);
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('LEXMOUNT_')));
  env.CI = '1';
  for (const [name, script] of demos) {
    const demo = path.resolve(repoDirectory, script.replace('tsx ', ''));
    const { code, stderr } = await new Promise<{ code: number | string | undefined; stderr: string }>(resolve => {
      const runner = native ? [] : [path.join(repoDirectory, 'node_modules/tsx/dist/cli.mjs')];
      execFile(process.execPath, ['--require', guard, ...runner, demo],
        { cwd, env, timeout: 15000 }, (error, _stdout, stderr) => resolve({ code: error?.code ?? undefined, stderr }));
    });
    assert.equal(code, 1, name);
    assert.match(stderr, /Lexmount credentials are missing/, name);
    assert.equal(stderr.includes('unexpected network'), false, name);
  }
}

test('all 20 demos reach credential setup through tsx before network access', async t => {
  await checkDemoStartup(t, false);
});

const nativeTypeScript = (process.features as { typescript?: string }).typescript;
test('all 20 demos reach credential setup through native node before network access',
  { skip: !nativeTypeScript && 'Requires Node with native TypeScript enabled (22.18+ or 24+)' }, async t => {
    await checkDemoStartup(t, true);
  });
