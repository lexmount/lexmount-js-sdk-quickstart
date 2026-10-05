/** Shared startup for every quickstart. No SDK requests are made before this completes. */
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse } from 'dotenv';

export const DEFAULT_BASE_URL = 'https://api.lexmount.com';
const SITES: Record<string, string> = {
  'https://api.lexmount.com': 'https://browser.lexmount.com',
  'https://api.lexmount.cn': 'https://browser.lexmount.cn',
};
const CREDENTIAL_KEYS = ['LEXMOUNT_PROJECT_ID', 'LEXMOUNT_API_KEY', 'LEXMOUNT_BASE_URL'] as const;
type Env = Record<string, string | undefined>;
type Credentials = { project_id: string; api_key: string; api_base_url: string };
type Exchange = (url: string, body: Record<string, string>) => Promise<unknown>;

export function hasCredential(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase().replace(/-/g, '_');
  return !!normalized && !/^(your_|replace_|<|changeme$|placeholder$)/.test(normalized);
}

export function canOpenBrowser(platform = process.platform, env: Env = process.env,
  interactive = !!process.stdin.isTTY): boolean {
  return ['darwin', 'win32'].includes(platform) && interactive
    && !['SSH_CONNECTION', 'SSH_CLIENT', 'SSH_TTY', 'CI', 'GITHUB_ACTIONS', 'TF_BUILD'].some(key => !!env[key])
    && env.SESSIONNAME?.toLowerCase() !== 'services';
}

export function openBrowser(url: string): Promise<boolean> {
  // Pass arguments directly; never interpolate the authorization URL into a shell command.
  let command: string;
  let args: string[];
  if (process.platform === 'darwin') {
    command = '/usr/bin/open'; args = [url];
  } else if (process.platform === 'win32') {
    command = 'powershell.exe';
    const script = `$ErrorActionPreference = 'Stop'; Start-Process -FilePath '${url.replace(/'/g, "''")}'`;
    args = ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')];
  } else return Promise.resolve(false);
  return new Promise(resolve => execFile(command, args, { timeout: 10000, windowsHide: true }, error => resolve(!error)));
}

async function exchangeCode(url: string, body: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body),
  });
  if (!response.ok || !response.body) throw new Error('Credential exchange failed.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 65536) throw new Error('Credential response is too large.');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export async function authorize(site: string, baseUrl: string, options: {
  open?: (url: string) => Promise<boolean>; exchange?: Exchange; timeoutMs?: number;
} = {}): Promise<Credentials> {
  const verifier = randomBytes(32).toString('base64url');
  const state = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  let redirectUri = '';
  let accepted = false;
  let receive!: (code: string) => void;
  let fail!: (error: Error) => void;
  const callback = new Promise<string>((resolve, reject) => { receive = resolve; fail = reject; });
  // The browser launcher can fail before we start awaiting the callback.
  void callback.catch(() => {});
  const server = createServer((req, res) => {
    const reply = (status: number, message: string) => {
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer', Connection: 'close' });
      res.end(message);
    };
    let url: URL;
    try { url = new URL(req.url || '/', redirectUri); }
    catch { reply(400, 'Invalid callback.'); return; }
    if (req.headers.host !== new URL(redirectUri).host || req.headers.origin || req.method !== 'GET') {
      reply(403, 'Invalid callback.'); return;
    }
    if (url.pathname !== '/callback') { reply(404, 'Not found.'); return; }
    const states = url.searchParams.getAll('state');
    const supplied = Buffer.from(states[0] || '');
    if (states.length !== 1 || supplied.length !== state.length || !timingSafeEqual(supplied, Buffer.from(state))) {
      reply(400, 'Invalid callback state.'); return;
    }
    if (accepted) { reply(409, 'Authorization already received.'); return; }
    if (url.searchParams.has('error')) {
      accepted = true;
      reply(400, 'Authorization cancelled. Return to the terminal.');
      fail(new Error('Authorization was cancelled.')); return;
    }
    const codes = url.searchParams.getAll('code');
    if (codes.length !== 1 || !/^[A-Za-z0-9._~-]{1,2048}$/.test(codes[0])) {
      reply(400, 'Invalid authorization code.'); return;
    }
    accepted = true;
    reply(200, 'Authorization received. Return to the terminal to finish setup.');
    receive(codes[0]);
  });
  server.headersTimeout = 5000;
  server.requestTimeout = 10000;
  server.on('connection', socket => socket.setTimeout(10000, () => socket.destroy()));
  const interrupt = () => fail(new Error('Authorization interrupted.'));
  let timer: NodeJS.Timeout | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => { server.off('error', reject); resolve(); });
    });
    server.on('error', fail);
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Local callback is unavailable.');
    redirectUri = `http://127.0.0.1:${address.port}/callback`;
    const url = new URL('/connect/codex', site);
    url.search = new URLSearchParams({
      source: 'sdk-quickstart', intent: 'agent-browser-control', response: 'code',
      client_name: 'Lexmount Node.js Quickstart', scope: 'browser:actions browser:sessions browser:contexts',
      redirect_uri: redirectUri, state, code_challenge: challenge, code_challenge_method: 'S256',
    }).toString();
    process.once('SIGINT', interrupt);
    timer = setTimeout(() => fail(new Error('Authorization timed out.')), options.timeoutMs ?? 180000);
    if (!await (options.open ?? openBrowser)(url.toString())) throw new Error('Unable to open a local browser.');
    const code = await callback;
    const result = await (options.exchange ?? exchangeCode)(new URL('/api/connect/codex/exchange', site).toString(), {
      code, code_verifier: verifier, redirect_uri: redirectUri,
    }) as Partial<Credentials> & { ok?: boolean };
    if (!result || result.ok !== true || ![result.project_id, result.api_key].every(value =>
      typeof value === 'string' && hasCredential(value) && /^[A-Za-z0-9._~+/:=-]{1,4096}$/.test(value))) {
      throw new Error('Credential exchange did not return a valid project and API key.');
    }
    if (typeof result.api_base_url !== 'string' || result.api_base_url.replace(/\/$/, '') !== baseUrl) {
      throw new Error('Authorization returned a different API environment.');
    }
    return result as Credentials;
  } finally {
    clearTimeout(timer);
    process.removeListener('SIGINT', interrupt);
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

async function readEnv(file: string): Promise<string> {
  try { return await fs.readFile(file, 'utf8'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ''; throw error; }
}

export async function saveCredentials(file: string, original: string, credentials: Credentials): Promise<void> {
  const values = {
    LEXMOUNT_PROJECT_ID: credentials.project_id, LEXMOUNT_API_KEY: credentials.api_key,
    LEXMOUNT_BASE_URL: credentials.api_base_url.replace(/\/$/, ''),
  };
  // Tokenize all assignments so credential-looking lines inside multiline values stay intact.
  const assignment = /^[ \t]*(?:export[ \t]+)?([\w.-]+)[ \t]*(?:=[ \t]*|:[ \t]+)(?:'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`[^`]*`|[^\r\n]*)[ \t]*(?:#[^\r\n]*)?/gm;
  const seen = new Set<string>();
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  let updated = original.replace(assignment, (line, key: string) => {
    if (!CREDENTIAL_KEYS.includes(key as typeof CREDENTIAL_KEYS[number])) return line;
    seen.add(key);
    return `${key}=${values[key as keyof typeof values]}`;
  });
  if (updated && !updated.endsWith('\n')) updated += newline;
  for (const key of CREDENTIAL_KEYS) if (!seen.has(key)) updated += `${key}=${values[key]}${newline}`;
  const stat = await fs.lstat(file).catch(error => {
    if (error.code === 'ENOENT') return undefined; throw error;
  });
  if (stat && !stat.isFile()) throw new Error('The .env path must be a regular file.');
  if (await readEnv(file) !== original) throw new Error('The .env file changed during login. Please retry.');
  const temporary = `${file}.${randomBytes(8).toString('hex')}.tmp`;
  try {
    await fs.writeFile(temporary, updated, { mode: 0o600, flag: 'wx' });
    await fs.rename(temporary, file);
  } finally { await fs.rm(temporary, { force: true }); }
}

export async function ensureCredentials(options: {
  env?: Env; envFile?: string; browserAvailable?: () => boolean;
  login?: (site: string, base: string) => Promise<Credentials>;
} = {}): Promise<void> {
  const env = options.env ?? process.env;
  const file = path.resolve(options.envFile ?? '.env');
  const original = await readEnv(file);
  // Keep the demos' existing precedence: .env overrides exported variables.
  Object.assign(env, parse(original));
  const base = (env.LEXMOUNT_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, '');
  env.LEXMOUNT_BASE_URL = base;
  if (hasCredential(env.LEXMOUNT_PROJECT_ID) && hasCredential(env.LEXMOUNT_API_KEY)) return;
  const site = SITES[base];
  const manual = `Open ${site ?? 'https://browser.lexmount.com'} and obtain the Project ID and API key for your API environment.\n`
    + `Set LEXMOUNT_PROJECT_ID and LEXMOUNT_API_KEY in ${file}, then rerun this demo.\n`
    + 'Custom API environments require credentials from their matching website.';
  if (!site || !(options.browserAvailable ?? (() => canOpenBrowser(process.platform, env)))()) {
    throw new Error(`Lexmount credentials are missing or still contain example values.\n${manual}`);
  }
  console.log('Lexmount credentials are missing. Opening your browser to sign in and authorize (up to 3 minutes).');
  try {
    const credentials = await (options.login ?? authorize)(site, base);
    await saveCredentials(file, original, credentials);
    Object.assign(env, { LEXMOUNT_PROJECT_ID: credentials.project_id, LEXMOUNT_API_KEY: credentials.api_key,
      LEXMOUNT_BASE_URL: credentials.api_base_url.replace(/\/$/, '') });
    console.log('Lexmount credentials saved to .env. Continuing the demo.');
  } catch {
    // Never print raw exchange responses, API keys, authorization codes, or browser-launch arguments.
    throw new Error(`Browser authorization or saving .env failed. No demo requests were started.\n${manual}`);
  }
}
